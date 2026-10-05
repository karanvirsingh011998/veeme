/**
 * International calling codes for the phone auth UI.
 * Default market: India (+91).
 */

export type CountryCallingCode = {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
};

export const DEFAULT_COUNTRY_DIAL_CODE = "+91";

export const COUNTRY_CALLING_CODES: CountryCallingCode[] = [
  { iso2: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { iso2: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { iso2: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { iso2: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { iso2: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { iso2: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { iso2: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { iso2: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { iso2: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { iso2: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { iso2: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { iso2: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { iso2: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { iso2: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { iso2: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { iso2: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { iso2: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
  { iso2: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
  { iso2: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵" },
  { iso2: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
];

export function findCountryByDialCode(dialCode: string): CountryCallingCode | undefined {
  return COUNTRY_CALLING_CODES.find((c) => c.dialCode === dialCode);
}