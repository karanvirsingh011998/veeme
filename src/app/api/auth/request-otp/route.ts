import { NextResponse } from "next/server";
import { getPhoneAuthMode } from "@/lib/auth/config";
import { requestDevOtp } from "@/lib/auth/dev-auth";
import { requestSupabaseOtp } from "@/lib/auth/supabase-auth";
import { sanitizePhoneNumber } from "@/lib/phone";

type Body = {
  countryCode?: string;
  phoneNumber?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const countryCode = body.countryCode?.trim() || "";
  const phoneNumber = sanitizePhoneNumber(body.phoneNumber || "");

  if (!countryCode || !phoneNumber) {
    return NextResponse.json(
      { ok: false, error: "Country code and mobile number are required." },
      { status: 400 },
    );
  }

  if (getPhoneAuthMode() === "supabase") {
    const result = await requestSupabaseOtp(countryCode, phoneNumber);
    // If SMS provider is missing, fall back to development OTP instead of failing.
    if (!result.ok && /unsupported phone provider/i.test(result.error)) {
      return NextResponse.json(requestDevOtp(countryCode, phoneNumber));
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  return NextResponse.json(requestDevOtp(countryCode, phoneNumber));
}