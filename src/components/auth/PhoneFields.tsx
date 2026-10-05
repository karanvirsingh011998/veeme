"use client";

import { COUNTRY_CALLING_CODES, DEFAULT_COUNTRY_DIAL_CODE } from "@/lib/countries";
import { stripLeadingCountryCodeFromInput } from "@/lib/phone";
import styles from "./PhoneFields.module.css";

type PhoneFieldsProps = {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  countryCodeError?: string;
  phoneNumberError?: string;
  disabled?: boolean;
};

/**
 * Combined phone UX: separate country-code select + national number input.
 */
export function PhoneFields({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  countryCodeError,
  phoneNumberError,
  disabled,
}: PhoneFieldsProps) {
  const selected =
    COUNTRY_CALLING_CODES.find((c) => c.dialCode === countryCode) ??
    COUNTRY_CALLING_CODES[0];

  return (
    <div className={styles.wrap}>
      <span className={styles.groupLabel} id="phone-group-label">
        Mobile number
      </span>
      <div
        className={styles.row}
        role="group"
        aria-labelledby="phone-group-label"
      >
        <div className={styles.codeField}>
          <label className={styles.srOnly} htmlFor="country-code">
            Country code
          </label>
          <select
            id="country-code"
            name="countryCode"
            className={`${styles.select} ${countryCodeError ? styles.invalid : ""}`}
            value={countryCode || DEFAULT_COUNTRY_DIAL_CODE}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(countryCodeError)}
            aria-describedby={countryCodeError ? "country-code-error" : undefined}
          >
            {COUNTRY_CALLING_CODES.map((country) => (
              <option key={`${country.iso2}-${country.dialCode}`} value={country.dialCode}>
                {country.flag} {country.dialCode}
              </option>
            ))}
          </select>
          <span className={styles.codeHint} aria-hidden="true">
            {selected.flag} {selected.dialCode}
          </span>
        </div>

        <div className={styles.numberField}>
          <label className={styles.srOnly} htmlFor="phone-number">
            Mobile number
          </label>
          <input
            id="phone-number"
            name="phoneNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            className={phoneNumberError ? styles.invalidInput : ""}
            value={phoneNumber}
            onChange={(e) => {
              const next = stripLeadingCountryCodeFromInput(
                e.target.value,
                countryCode,
              );
              onPhoneNumberChange(next);
            }}
            disabled={disabled}
            aria-invalid={Boolean(phoneNumberError)}
            aria-describedby={phoneNumberError ? "phone-number-error" : undefined}
          />
        </div>
      </div>

      {countryCodeError ? (
        <p id="country-code-error" className={styles.error} role="alert">
          {countryCodeError}
        </p>
      ) : null}
      {phoneNumberError ? (
        <p id="phone-number-error" className={styles.error} role="alert">
          {phoneNumberError}
        </p>
      ) : null}
    </div>
  );
}