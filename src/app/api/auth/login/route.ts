import { NextResponse } from "next/server";
import { verifyDevOtp } from "@/lib/auth/dev-auth";
import { getPhoneAuthMode } from "@/lib/auth/config";
import { verifySupabaseOtp } from "@/lib/auth/supabase-auth";
import { loginUserFromDatabase } from "@/lib/auth/db-auth";
import { sanitizePhoneNumber } from "@/lib/phone";

type Body = {
  countryCode?: string;
  phoneNumber?: string;
  otp?: string;
};

/**
 * After OTP: verify the mobile number exists in profiles, then return that user.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const countryCode = (body.countryCode || "").trim();
  const phoneNumber = sanitizePhoneNumber(body.phoneNumber || "");
  const otp = (body.otp || "").replace(/\D/g, "");

  if (!countryCode || !phoneNumber || !otp) {
    return NextResponse.json(
      { ok: false, error: "Country code, mobile number, and OTP are required." },
      { status: 400 },
    );
  }

  const otpCheck =
    getPhoneAuthMode() === "supabase"
      ? await verifySupabaseOtp(countryCode, phoneNumber, otp)
      : verifyDevOtp(countryCode, phoneNumber, otp);

  if (!otpCheck.ok) {
    const fallback = verifyDevOtp(countryCode, phoneNumber, otp);
    if (!fallback.ok) {
      return NextResponse.json(
        { ok: false, error: otpCheck.error },
        { status: 401 },
      );
    }
  }

  const result = await loginUserFromDatabase(countryCode, phoneNumber);
  if (!result.ok) {
    const status =
      result.code === "NOT_FOUND" ? 404 : result.code === "CONFIG" ? 503 : 400;
    return NextResponse.json(
      { ok: false, error: result.error, code: result.code },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    userId: result.profile.id,
    profile: {
      id: result.profile.id,
      firstName: result.profile.first_name,
      lastName: result.profile.last_name,
      email: result.profile.email,
      gender: result.profile.gender,
      countryCode: result.profile.country_code,
      phoneNumber: result.profile.phone_number,
    },
  });
}