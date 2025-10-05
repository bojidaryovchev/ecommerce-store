import type { Address } from "@prisma/client";

/**
 * Common countries with their ISO codes
 */
export const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "ZA", name: "South Africa" },
] as const;

/**
 * Format address as a single line
 */
export function formatAddressOneLine(address: Address): string {
  const parts = [
    address.address1,
    address.address2,
    address.city,
    address.state,
    address.postalCode,
    getCountryName(address.country),
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Format address as multiple lines for display
 */
export function formatAddressMultiLine(address: Address): string[] {
  const lines: string[] = [];

  // Name and company
  lines.push(address.fullName);
  if (address.company) {
    lines.push(address.company);
  }

  // Street address
  lines.push(address.address1);
  if (address.address2) {
    lines.push(address.address2);
  }

  // City, State, Postal Code
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(", ");
  lines.push(cityLine);

  // Country
  lines.push(getCountryName(address.country));

  // Phone
  if (address.phone) {
    lines.push(formatPhoneNumber(address.phone));
  }

  return lines;
}

/**
 * Get country name from code
 */
export function getCountryName(code: string): string {
  const country = COUNTRIES.find((c) => c.code === code);
  return country?.name || code;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // If it starts with +1 (US/Canada), format as +1 (XXX) XXX-XXXX
  if (cleaned.startsWith("+1") && cleaned.length === 12) {
    return `+1 (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }

  // For other formats, just ensure it has the + prefix
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Validate postal code format by country
 */
export function validatePostalCode(postalCode: string, countryCode: string): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/, // 12345 or 12345-6789
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, // A1A 1A1 or A1A1A1
    GB: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, // SW1A 1AA
    AU: /^\d{4}$/, // 1234
    DE: /^\d{5}$/, // 12345
    FR: /^\d{5}$/, // 12345
    IT: /^\d{5}$/, // 12345
    ES: /^\d{5}$/, // 12345
    NL: /^\d{4}\s?[A-Z]{2}$/i, // 1234 AB
    JP: /^\d{3}-?\d{4}$/, // 123-4567
  };

  const pattern = patterns[countryCode];
  return pattern ? pattern.test(postalCode) : true; // If no pattern, assume valid
}

/**
 * Check if address is complete (all required fields filled)
 */
export function isAddressComplete(address: Partial<Address>): boolean {
  return !!(address.fullName && address.address1 && address.city && address.postalCode && address.country);
}

/**
 * Format address for API (ensure proper E.164 phone format)
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Ensure it starts with +
  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}

/**
 * Get initials from full name
 */
export function getInitials(fullName: string): string {
  const names = fullName.trim().split(/\s+/);
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: Address, maxLength: number = 50): string {
  const formatted = formatAddressOneLine(address);
  if (formatted.length <= maxLength) {
    return formatted;
  }
  return formatted.slice(0, maxLength - 3) + "...";
}

/**
 * Check if two addresses are the same
 */
export function isSameAddress(addr1: Address, addr2: Address): boolean {
  return (
    addr1.address1 === addr2.address1 &&
    addr1.address2 === addr2.address2 &&
    addr1.city === addr2.city &&
    addr1.state === addr2.state &&
    addr1.postalCode === addr2.postalCode &&
    addr1.country === addr2.country
  );
}
