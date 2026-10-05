"use client";

import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getAuthConfig, type OtpMode } from "@/lib/auth/auth";
import {
  clearSignupDraft,
  readSignupDraft,
} from "@/lib/auth/signup-draft";
import { saveAuthSession } from "@/lib/auth/session";
import { buildFullPhoneNumber } from "@/lib/phone";
import { Button } from "@/components/ui/Button";
import styles from "./auth-forms.module.css";

type OtpFormProps = {
  countryCode: string;
  phoneNumber: string;
  mode: OtpMode;
};

type AuthProfilePayload = {
  ok: boolean;
  error?: string;
  userId?: string;
  profile?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    gender?: string | null;
    countryCode?: string | null;
    phoneNumber?: string | null;
  };
};

/**
 * OTP verification — signup writes to DB; login checks DB by phone.
 */
export function OtpForm({ countryCode, phoneNumber, mode }: OtpFormProps) {
  const router = useRouter();
  const [otpLength, setOtpLength] = useState(4);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const displayPhone = buildFullPhoneNumber(countryCode, phoneNumber);

  useEffect(() => {
    let cancelled = false;
    getAuthConfig().then((config) => {
      if (cancelled) return;
      const length = config.otpLength || 4;
      setOtpLength(length);
      setDigits(Array.from({ length }, () => ""));
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateDigit(index: number, value: string) {
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError(null);
    if (value && index < otpLength - 1) {
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
      .slice(0, otpLength)
      .split("");
    if (!pasted.length) return;
    const next = Array.from({ length: otpLength }, () => "");
    pasted.forEach((digit, i) => {
      next[i] = digit;
    });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, otpLength - 1)]?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const otp = digits.join("");
    if (otp.length < otpLength) {
      setError(`Enter the ${otpLength}-digit code.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "signup") {
        const draft = readSignupDraft();
        if (!draft) {
          setError("Signup details expired. Please start again.");
          setSubmitting(false);
          return;
        }

        const response = await fetch("/api/auth/complete-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draft, otp }),
        });
        const data = (await response.json()) as AuthProfilePayload;

        if (!response.ok || !data.ok || !data.profile) {
          setError(data.error || "Could not create your account.");
          setSubmitting(false);
          return;
        }

        clearSignupDraft();
        saveAuthSession({
          id: data.profile.id,
          firstName: data.profile.firstName ?? undefined,
          lastName: data.profile.lastName ?? undefined,
          email: data.profile.email ?? undefined,
          gender: data.profile.gender ?? undefined,
          countryCode: data.profile.countryCode || countryCode,
          phoneNumber: data.profile.phoneNumber || phoneNumber,
        });
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ countryCode, phoneNumber, otp }),
        });
        const data = (await response.json()) as AuthProfilePayload & {
          code?: string;
        };

        if (!response.ok || !data.ok || !data.profile) {
          // Account checks belong on /login — send the user back there.
          if (data.code === "NOT_FOUND" || response.status === 404) {
            router.replace(
              `/login?error=${encodeURIComponent(
                data.error ||
                  "No account found for this mobile number. Please sign up.",
              )}`,
            );
            return;
          }
          setError(data.error || "Login failed.");
          setSubmitting(false);
          return;
        }

        saveAuthSession({
          id: data.profile.id,
          firstName: data.profile.firstName ?? undefined,
          lastName: data.profile.lastName ?? undefined,
          email: data.profile.email ?? undefined,
          gender: data.profile.gender ?? undefined,
          countryCode: data.profile.countryCode || countryCode,
          phoneNumber: data.profile.phoneNumber || phoneNumber,
        });
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <p className={styles.hint}>Preparing verification…</p>;
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <p className={styles.hint}>
        Code sent to <strong>{displayPhone}</strong>
      </p>
      <div
        className={styles.otpRow}
        style={{ gridTemplateColumns: `repeat(${otpLength}, minmax(0, 1fr))` }}
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
            aria-label={`Digit ${index + 1} of ${otpLength}`}
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
            setDigits(Array.from({ length: otpLength }, () => ""));
            setError(null);
          }}
        >
          Resend code
        </button>
      </p>
    </form>
  );
}