const COOKIE_NAME = "vemee_admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type AdminSessionPayload = {
  sub: string;
  email: string;
  isAdmin: true;
  mode: "development" | "supabase";
  exp: number;
};

function getSessionSecret(): string {
  return (
    process.env.VEMEE_ADMIN_SESSION_SECRET ||
    process.env.VEMEE_ADMIN_PASSWORD ||
    "vemee-dev-admin-session-secret"
  );
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  view.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

async function sign(payloadB64: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  return toBase64Url(signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

export async function serializeAdminSession(
  payload: Omit<AdminSessionPayload, "exp" | "isAdmin">,
): Promise<string> {
  const full: AdminSessionPayload = {
    ...payload,
    isAdmin: true,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(full)));
  const signature = await sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export async function parseAdminSession(
  token: string | undefined | null,
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = await sign(payloadB64);
  if (!timingSafeEqual(signature, expected)) {
    return null;
  }

  try {
    const json = fromBase64Url(payloadB64);
    const payload = JSON.parse(json) as AdminSessionPayload;
    if (!payload.isAdmin || !payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}