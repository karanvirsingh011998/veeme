import { AuthShell } from "@/components/auth/AuthShell";
import { OtpForm } from "@/components/auth/OtpForm";
import { RedirectIfSignedIn } from "@/components/auth/RedirectIfSignedIn";
import type { OtpMode } from "@/lib/auth/auth";
import { DEFAULT_COUNTRY_DIAL_CODE } from "@/lib/countries";
import { sanitizePhoneNumber } from "@/lib/phone";
import { redirect } from "next/navigation";

type OtpPageProps = {
  searchParams: Promise<{
    countryCode?: string;
    phoneNumber?: string;
    mode?: string;
  }>;
};

export const metadata = {
  title: "Verify phone — Vemee",
};

export default async function OtpPage({ searchParams }: OtpPageProps) {
  const params = await searchParams;
  const countryCode = params.countryCode || DEFAULT_COUNTRY_DIAL_CODE;
  const phoneNumber = sanitizePhoneNumber(params.phoneNumber || "");
  const mode: OtpMode = params.mode === "signup" ? "signup" : "login";

  if (!phoneNumber) {
    redirect(mode === "signup" ? "/signup" : "/login");
  }

  return (
    <RedirectIfSignedIn>
      <AuthShell
        title="Enter the code"
        subtitle="Type the code we sent to your mobile number."
      >
        <OtpForm
          countryCode={countryCode}
          phoneNumber={phoneNumber}
          mode={mode}
        />
      </AuthShell>
    </RedirectIfSignedIn>
  );
}