const NAME_PATTERN = /^[\p{L}\p{M}' -]{1,50}$/u;

export const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
] as const;

export type GenderOption = (typeof GENDER_OPTIONS)[number];

export type SignupFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  gender: GenderOption | "";
  countryCode: string;
  phoneNumber: string;
  acceptedLegal: boolean;
};

export type FieldErrors = Partial<Record<keyof SignupFormValues, string>>;

export function validateFirstName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "First name is required.";
  if (trimmed.length < 2) return "First name must be at least 2 characters.";
  if (!NAME_PATTERN.test(trimmed)) return "First name contains invalid characters.";
  return null;
}

export function validateLastName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Last name is required.";
  if (trimmed.length < 2) return "Last name must be at least 2 characters.";
  if (!NAME_PATTERN.test(trimmed)) return "Last name contains invalid characters.";
  return null;
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) return "Enter a valid email address.";
  return null;
}

export function validateGender(value: string): string | null {
  if (!value) return "Please select a gender.";
  if (!GENDER_OPTIONS.includes(value as GenderOption)) {
    return "Please select a valid gender.";
  }
  return null;
}

export function validateCountryCode(value: string): string | null {
  if (!value) return "Country code is required.";
  if (!/^\+\d{1,4}$/.test(value)) return "Select a valid country code.";
  return null;
}

export function validateLegalAcceptance(accepted: boolean): string | null {
  if (!accepted) {
    return "Please accept the Terms & Conditions and Privacy Policy to continue.";
  }
  return null;
}

export function validateSignupForm(
  values: SignupFormValues,
  mobileError: string | null,
): FieldErrors {
  const errors: FieldErrors = {};
  const firstNameError = validateFirstName(values.firstName);
  const lastNameError = validateLastName(values.lastName);
  const emailError = validateEmail(values.email);
  const genderError = validateGender(values.gender);
  const countryCodeError = validateCountryCode(values.countryCode);
  const legalError = validateLegalAcceptance(values.acceptedLegal);

  if (firstNameError) errors.firstName = firstNameError;
  if (lastNameError) errors.lastName = lastNameError;
  if (emailError) errors.email = emailError;
  if (genderError) errors.gender = genderError;
  if (countryCodeError) errors.countryCode = countryCodeError;
  if (mobileError) errors.phoneNumber = mobileError;
  if (legalError) errors.acceptedLegal = legalError;

  return errors;
}