"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { requestOtp } from "@/lib/auth/otp";
import { buildOtpRoute } from "@/lib/auth/routes";
import { saveSignupDraft } from "@/lib/auth/signup-draft";
import { DEFAULT_COUNTRY_DIAL_CODE } from "@/lib/countries";
import { validateMobileNumber } from "@/lib/phone";
import {
  GENDER_OPTIONS,
  validateSignupForm,
  type GenderOption,
  type SignupFormValues,
} from "@/lib/validation/auth";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/auth/FieldError";
import { PhoneFields } from "@/components/auth/PhoneFields";
import styles from "./auth-forms.module.css";

/**
 * Signup with required profile fields before OTP verification.
 */
export function SignupForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState<SignupFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    gender: "",
    countryCode: DEFAULT_COUNTRY_DIAL_CODE,
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupFormValues, string>>
  >({});

  function updateField<K extends keyof SignupFormValues>(
    key: K,
    value: SignupFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const mobileError = validateMobileNumber(values.countryCode, values.phoneNumber);
    const nextErrors = validateSignupForm(values, mobileError);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const otpResult = await requestOtp(values.countryCode, values.phoneNumber);
    setSubmitting(false);

    if (!otpResult.ok) {
      setFormError(otpResult.error);
      return;
    }

    saveSignupDraft({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      gender: values.gender as GenderOption,
      countryCode: values.countryCode,
      phoneNumber: values.phoneNumber.replace(/\D/g, ""),
    });

    router.push(
      buildOtpRoute({
        mode: "signup",
        countryCode: values.countryCode,
        phoneNumber: values.phoneNumber.replace(/\D/g, ""),
      }),
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.nameRow}>
        <div className={styles.field}>
          <label htmlFor="first-name">First name</label>
          <input
            id="first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Priya"
            value={values.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? "first-name-error" : undefined}
          />
          <FieldError id="first-name-error" message={errors.firstName} />
        </div>
        <div className={styles.field}>
          <label htmlFor="last-name">Last name</label>
          <input
            id="last-name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Sharma"
            value={values.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? "last-name-error" : undefined}
          />
          <FieldError id="last-name-error" message={errors.lastName} />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="priya@example.com"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div className={styles.field}>
        <label htmlFor="gender">Gender</label>
        <select
          id="gender"
          name="gender"
          className={styles.select}
          value={values.gender}
          onChange={(e) => updateField("gender", e.target.value as GenderOption | "")}
          aria-invalid={Boolean(errors.gender)}
          aria-describedby={errors.gender ? "gender-error" : undefined}
        >
          <option value="">Select gender</option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FieldError id="gender-error" message={errors.gender} />
      </div>

      <PhoneFields
        countryCode={values.countryCode}
        phoneNumber={values.phoneNumber}
        onCountryCodeChange={(code) => updateField("countryCode", code)}
        onPhoneNumberChange={(num) => updateField("phoneNumber", num)}
        countryCodeError={errors.countryCode}
        phoneNumberError={errors.phoneNumber}
        disabled={submitting}
      />

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