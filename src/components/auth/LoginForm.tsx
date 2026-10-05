"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { requestOtp } from "@/lib/auth/auth";
import { buildOtpRoute } from "@/lib/auth/routes";
import { DEFAULT_COUNTRY_DIAL_CODE } from "@/lib/countries";
import { sanitizePhoneNumber, validateMobileNumber } from "@/lib/phone";
import { validateCountryCode } from "@/lib/validation/auth";
import { Button } from "@/components/ui/Button";
import { PhoneFields } from "@/components/auth/PhoneFields";
import styles from "./auth-forms.module.css";

/**
 * Mobile-number login — account must exist in the database before OTP.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_DIAL_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCodeError, setCountryCodeError] = useState<string>();
  const [phoneNumberError, setPhoneNumberError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fromQuery = searchParams.get("error");
    if (fromQuery) {
      setFormError(fromQuery);
    }
  }, [searchParams]);

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

    try {
      const checkResponse = await fetch("/api/auth/check-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode, phoneNumber: digits }),
      });
      const checkData = (await checkResponse.json()) as {
        ok: boolean;
        error?: string;
        code?: string;
      };

      if (!checkResponse.ok || !checkData.ok) {
        setFormError(
          checkData.error ||
            "No account found for this mobile number. Please sign up.",
        );
        setSubmitting(false);
        return;
      }

      const otpResult = await requestOtp(countryCode, digits);
      if (!otpResult.ok) {
        setFormError(otpResult.error);
        setSubmitting(false);
        return;
      }

      router.push(
        buildOtpRoute({
          mode: "login",
          countryCode,
          phoneNumber: digits,
        }),
      );
    } catch {
      setFormError("Unable to continue right now. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <PhoneFields
        countryCode={countryCode}
        phoneNumber={phoneNumber}
        onCountryCodeChange={(code) => {
          setCountryCode(code);
          setCountryCodeError(undefined);
          setFormError(null);
        }}
        onPhoneNumberChange={(num) => {
          setPhoneNumber(num);
          setPhoneNumberError(undefined);
          setFormError(null);
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
        {submitting ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}