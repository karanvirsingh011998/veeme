import { NextResponse } from "next/server";
import { getPhoneAuthMode } from "@/lib/auth/config";
import { verifyDevOtp } from "@/lib/auth/dev-auth";
import { verifySupabaseOtp } from "@/lib/auth/supabase-auth";
import { sanitizePhoneNumber } from "@/lib/phone";

type Body = {
  countryCode?: string;
  phoneNumber?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const countryCode = body.countryCode?.trim() || "";
  const phoneNumber = sanitizePhoneNumber(body.phoneNumber || "");
  const otp = (body.otp || "").replace(/\D/g, "");

  if (!countryCode || !phoneNumber || !otp) {
    return NextResponse.json(
      { ok: false, error: "Country code, mobile number, and OTP are required." },
      { status: 400 },
    );
  }

  if (getPhoneAuthMode() === "supabase") {
    const result = await verifySupabaseOtp(countryCode, phoneNumber, otp);
    if (!result.ok) {
      // Allow development OTP as a safe fallback while SMS is being set up.
      const dev = verifyDevOtp(countryCode, phoneNumber, otp);
      if (dev.ok) return NextResponse.json(dev);
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  return NextResponse.json(verifyDevOtp(countryCode, phoneNumber, otp));
}