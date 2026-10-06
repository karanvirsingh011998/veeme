import { buildFullPhoneNumber } from "@/lib/phone";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/auth/config";
import { upsertDevProfile, getDevProfile, listDevProfiles } from "@/lib/profile/dev-store";
import type { SignupDraft } from "@/lib/auth/signup-draft";
import type { ProfileRow } from "@/types/database";
import { randomUUID } from "crypto";

export type DbAuthResult =
  | { ok: true; profile: ProfileRow }
  | { ok: false; error: string; code?: "NOT_FOUND" | "EXISTS" | "CONFIG" };

/**
 * Signup: create Auth user (if needed) + insert/update profiles row in the database.
 */
export async function registerUserInDatabase(
  draft: SignupDraft,
): Promise<DbAuthResult> {
  if (!isSupabaseConfigured()) {
    return registerUserLocally(draft);
  }

  if (!isServiceRoleConfigured()) {
    return {
      ok: false,
      code: "CONFIG",
      error:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local so signup can write to the database.",
    };
  }

  const admin = createServiceClient();
  if (!admin) {
    return { ok: false, code: "CONFIG", error: "Supabase admin client unavailable." };
  }

  const countryCode = draft.countryCode;
  const phoneNumber = draft.phoneNumber;
  const fullPhone = buildFullPhoneNumber(countryCode, phoneNumber);

  // Block duplicate phone signups
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("*")
    .eq("country_code", countryCode)
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (existingProfile) {
    return {
      ok: false,
      code: "EXISTS",
      error: "An account with this mobile number already exists. Please log in.",
    };
  }

  let userId: string | null = null;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    phone: fullPhone,
    phone_confirm: true,
    email: draft.email.trim().toLowerCase(),
    email_confirm: true,
    user_metadata: {
      first_name: draft.firstName.trim(),
      last_name: draft.lastName.trim(),
      gender: draft.gender,
      country_code: countryCode,
      phone_number: phoneNumber,
    },
  });

  if (createError) {
    // Phone may already exist in Auth without a profile — recover that user id
    const recovered = await findAuthUserIdByPhone(admin, fullPhone);
    if (!recovered) {
      return { ok: false, error: createError.message };
    }
    userId = recovered;
  } else {
    userId = created.user?.id ?? null;
  }

  if (!userId) {
    return { ok: false, error: "Could not create user account." };
  }

  if (!draft.termsAcceptedAt || !draft.privacyAcceptedAt) {
    return {
      ok: false,
      error: "You must accept the Terms & Conditions and Privacy Policy.",
    };
  }

  const now = new Date().toISOString();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: userId,
      first_name: draft.firstName.trim(),
      last_name: draft.lastName.trim(),
      email: draft.email.trim().toLowerCase(),
      gender: draft.gender,
      country_code: countryCode,
      phone_number: phoneNumber,
      display_name: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
      phone_verified_at: now,
      terms_accepted_at: draft.termsAcceptedAt,
      privacy_accepted_at: draft.privacyAcceptedAt,
      account_status: "active",
      updated_at: now,
    })
    .select("*")
    .single();

  if (profileError || !profile) {
    return { ok: false, error: profileError?.message || "Could not save profile." };
  }

  return { ok: true, profile };
}

/**
 * Login: load profile from database by country_code + phone_number.
 */
export async function loginUserFromDatabase(
  countryCode: string,
  phoneNumber: string,
): Promise<DbAuthResult> {
  if (!isSupabaseConfigured()) {
    return loginUserLocally(countryCode, phoneNumber);
  }

  // Prefer service role for reliable lookups; fall back to anon if needed
  const admin = createServiceClient();
  const client = admin;

  if (!client) {
    return {
      ok: false,
      code: "CONFIG",
      error:
        "Add SUPABASE_SERVICE_ROLE_KEY to .env.local so login can read the database.",
    };
  }

  const { data: profile, error } = await client
    .from("profiles")
    .select("*")
    .eq("country_code", countryCode)
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!profile) {
    return {
      ok: false,
      code: "NOT_FOUND",
      error: "No account found for this mobile number. Please sign up.",
    };
  }

  if (profile.account_status && profile.account_status !== "active") {
    return { ok: false, error: "This account is not active." };
  }

  // Touch last_active_at when column exists in broader schema; ignore if missing
  await client
    .from("profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", profile.id);

  return { ok: true, profile };
}

async function findAuthUserIdByPhone(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  fullPhone: string,
): Promise<string | null> {
  const normalized = fullPhone.replace(/\s/g, "");
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;

    const match = data.users.find((u) => {
      const phone = (u.phone || "").replace(/\s/g, "");
      return (
        phone === normalized ||
        phone === normalized.replace(/^\+/, "") ||
        `+${phone}` === normalized
      );
    });

    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function registerUserLocally(draft: SignupDraft): Promise<DbAuthResult> {
  if (!draft.termsAcceptedAt || !draft.privacyAcceptedAt) {
    return {
      ok: false,
      error: "You must accept the Terms & Conditions and Privacy Policy.",
    };
  }

  const existing = (await listDevProfiles()).find(
    (p) =>
      p.country_code === draft.countryCode &&
      p.phone_number === draft.phoneNumber,
  );
  if (existing) {
    return {
      ok: false,
      code: "EXISTS",
      error: "An account with this mobile number already exists. Please log in.",
    };
  }

  const now = new Date().toISOString();
  const profile: ProfileRow = {
    id: randomUUID(),
    first_name: draft.firstName.trim(),
    last_name: draft.lastName.trim(),
    email: draft.email.trim().toLowerCase(),
    gender: draft.gender,
    country_code: draft.countryCode,
    phone_number: draft.phoneNumber,
    phone_verified_at: now,
    display_name: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
    bio: null,
    city: null,
    avatar_url: null,
    account_status: "active",
    is_admin: false,
    terms_accepted_at: draft.termsAcceptedAt,
    privacy_accepted_at: draft.privacyAcceptedAt,
    created_at: now,
    updated_at: now,
  };

  await upsertDevProfile(profile);
  return { ok: true, profile };
}

async function loginUserLocally(
  countryCode: string,
  phoneNumber: string,
): Promise<DbAuthResult> {
  const profiles = await listDevProfiles();
  const profile = profiles.find(
    (p) => p.country_code === countryCode && p.phone_number === phoneNumber,
  );
  if (!profile) {
    const byId = await getDevProfile(`dev-${countryCode.replace("+", "")}-${phoneNumber}`);
    if (!byId) {
      return {
        ok: false,
        code: "NOT_FOUND",
        error: "No account found for this mobile number. Please sign up.",
      };
    }
    return { ok: true, profile: byId };
  }
  return { ok: true, profile };
}