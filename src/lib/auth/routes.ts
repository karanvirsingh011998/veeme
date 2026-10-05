import type { OtpMode } from "@/lib/auth/auth";

export function buildOtpRoute(params: {
  mode: OtpMode;
  countryCode: string;
  phoneNumber: string;
}): string {
  const search = new URLSearchParams({
    mode: params.mode,
    countryCode: params.countryCode,
    phoneNumber: params.phoneNumber,
  });
  return `/auth/otp?${search.toString()}`;
}