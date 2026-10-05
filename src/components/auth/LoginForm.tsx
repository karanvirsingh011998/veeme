"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { requestOtp } from "@/lib/auth/otp";
import { buildOtpRoute } from "@/lib/auth/routes";
import { DEFAULT_COUNTRY_DIAL_CODE } from "@/lib/countries";
import { sanitizePhoneNumber, validateMobileNumber } from "@/lib/phone";
import { validateCountryCode } from "@/lib/validation/auth";
import { Button } from "@/components/ui/Button";
import { PhoneFields } from "@/components/auth/PhoneFields";
import styles from "./auth-forms.module.css";

/**
 * Mobile-number login — country code and national number only.
 */
export function LoginForm() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_DIAL_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCodeError, setCountryCodeError] = useState<string>();
  const [phoneNumberError, setPhoneNumberError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const codeErr = validateCountryCode(countryCode);
    const mobileErr = validateMobileNumber(countryCode, phoneNumber);
    setCountryCodeError(codeErr ?? undefined);
    setPhoneNumberError(mobileErr ?? undefined);
    if (codeErr || mobileErr) return;

    const digits = sanitizePhoneNumber(phoneNumber);
    setSubmitting(true);
    const otpResult = await requestOtp(countryCode, digits);
    setSubmitting(false);

    if (!otpResult.ok) {
      setFormError(otpResult.error);
      return;
    }

    router.push(
      buildOtpRoute({
        mode: "login",
        countryCode,
        phoneNumber: digits,
      }),
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <PhoneFields
        countryCode={countryCode}
        phoneNumber={phoneNumber}
        onCountryCodeChange={(code) => {
          setCountryCode(code);
          setCountryCodeError(undefined);
        }}
        onPhoneNumberChange={(num) => {
          setPhoneNumber(num);
          setPhoneNumberError(undefined);
        }}
        countryCodeError={countryCodeError}
        phoneNumberError={phoneNumberError}
        disabled={submitting}
      />

      <p className={styles.hint}>
        We&apos;ll send a one-time code. Standard SMS rates may apply.
      </p>

      {formError ? (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        className={styles.submit}
        disabled={submitting}
      >
        {submitting ? "Sending code…" : "Continue"}
      </Button>
    </form>
  );
}