"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { completeSignupProfile } from "@/lib/auth/complete-profile";
import type { OtpMode } from "@/lib/auth/otp";
import { verifyOtp } from "@/lib/auth/otp";
import {
  clearSignupDraft,
  readSignupDraft,
} from "@/lib/auth/signup-draft";
import { saveAuthSession } from "@/lib/auth/session";
import { buildFullPhoneNumber } from "@/lib/phone";
import { DEV_OTP } from "@/lib/auth/constants";
import { Button } from "@/components/ui/Button";
import styles from "./auth-forms.module.css";

const OTP_LENGTH = DEV_OTP.length;

type OtpFormProps = {
  countryCode: string;
  phoneNumber: string;
  mode: OtpMode;
};

/**
 * OTP verification — dev code 66666; swappable for Supabase SMS OTP.
 */
export function OtpForm({ countryCode, phoneNumber, mode }: OtpFormProps) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const displayPhone = buildFullPhoneNumber(countryCode, phoneNumber);

  function updateDigit(index: number, value: string) {
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError(null);
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH)
      .split("");
    if (!pasted.length) return;
    const next = Array.from({ length: OTP_LENGTH }, () => "");
    pasted.forEach((digit, i) => {
      next[i] = digit;
    });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await verifyOtp(countryCode, phoneNumber, otp);
    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    if (mode === "signup") {
      const draft = readSignupDraft();
      if (!draft) {
        setSubmitting(false);
        setError("Signup details expired. Please start again.");
        return;
      }

      const profileResult = await completeSignupProfile(draft);
      if (!profileResult.ok) {
        setSubmitting(false);
        setError(profileResult.error);
        return;
      }

      clearSignupDraft();
      saveAuthSession({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        countryCode: draft.countryCode,
        phoneNumber: draft.phoneNumber,
      });
    } else {
      saveAuthSession({
        countryCode,
        phoneNumber,
      });
    }

    setSubmitting(false);
    router.push("/dashboard");
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <p className={styles.hint}>
        Code sent to <strong>{displayPhone}</strong>
      </p>
      <div
        className={styles.otpRowFive}
        onPaste={onPaste}
        aria-label="One-time passcode"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            value={digit}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateDigit(index, e.target.value.replace(/\D/g, ""))
            }
            onKeyDown={(e) => onKeyDown(index, e)}
          />
        ))}
      </div>

      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        className={styles.submit}
        disabled={submitting}
      >
        {submitting ? "Verifying…" : "Verify & continue"}
      </Button>
      <p className={styles.resend}>
        Didn&apos;t get it?{" "}
        <button
          type="button"
          onClick={() => {
            setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
            setError(null);
          }}
        >
          Resend code
        </button>
      </p>
    </form>
  );
}