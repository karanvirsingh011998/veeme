import { NextResponse } from "next/server";
import { loginUserFromDatabase } from "@/lib/auth/db-auth";
import { sanitizePhoneNumber } from "@/lib/phone";

type Body = {
  countryCode?: string;
  phoneNumber?: string;
};

/**
 * Login gate: check whether a profile exists for this mobile number
 * before sending the user to the OTP screen.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const countryCode = (body.countryCode || "").trim();
  const phoneNumber = sanitizePhoneNumber(body.phoneNumber || "");

  if (!countryCode || !phoneNumber) {
    return NextResponse.json(
      { ok: false, error: "Country code and mobile number are required." },
      { status: 400 },
    );
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
    exists: true,
  });
}