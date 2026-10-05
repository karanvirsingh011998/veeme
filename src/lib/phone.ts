import { findCountryByDialCode } from "@/lib/countries";

/**
 * Builds the full E.164-style phone string for auth/SMS only.
 */
export function buildFullPhoneNumber(countryCode: string, phoneNumber: string): string {
  const code = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
  const digits = sanitizePhoneNumber(phoneNumber);
  return `${code}${digits}`;
}

/**
 * Strips spaces, hyphens, and non-digits from the national number field.
 */
export function sanitizePhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Prevents users from typing a leading country code into the mobile field.
 */
export function stripLeadingCountryCodeFromInput(
  raw: string,
  countryCode: string,
): string {
  let digits = sanitizePhoneNumber(raw);
  const codeDigits = sanitizePhoneNumber(countryCode);
  if (codeDigits && digits.startsWith(codeDigits) && digits.length > codeDigits.length) {
    digits = digits.slice(codeDigits.length);
  }
  if (raw.trim().startsWith("+") || raw.trim().startsWith("00")) {
    return digits.slice(-Math.min(digits.length, 15));
  }
  return digits;
}

/**
 * Country-aware mobile validation (practical subset).
 */
export function validateMobileNumber(
  countryCode: string,
  phoneNumber: string,
): string | null {
  const digits = sanitizePhoneNumber(phoneNumber);
  if (!digits) return "Mobile number is required.";

  const country = findCountryByDialCode(countryCode);

  if (countryCode === "+91") {
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return "Enter a valid 10-digit Indian mobile number.";
    }
    return null;
  }

  if (countryCode === "+1") {
    if (!/^\d{10}$/.test(digits)) {
      return "Enter a valid 10-digit mobile number.";
    }
    return null;
  }

  if (countryCode === "+44") {
    if (!/^\d{10,11}$/.test(digits)) {
      return "Enter a valid UK mobile number.";
    }
    return null;
  }

  if (digits.length < 6 || digits.length > 15) {
    return "Enter a valid mobile number for the selected country.";
  }

  if (!country) {
    return "Select a valid country code.";
  }

  return null;
}