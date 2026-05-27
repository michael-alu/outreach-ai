/** Validates and normalizes phone numbers — Rwanda (+250) and US (+1) */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  // Rwanda: +250XXXXXXXXX, 250XXXXXXXXX, 07XXXXXXXX, 7XXXXXXXX
  if (/^250\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0[7]\d{8}$/.test(digits)) return `+250${digits.slice(1)}`;
  if (/^[7]\d{8}$/.test(digits)) return `+250${digits}`;

  // US: +1XXXXXXXXXX, 1XXXXXXXXXX, XXXXXXXXXX (10 digits)
  if (/^1[2-9]\d{9}$/.test(digits)) return `+${digits}`;
  if (/^[2-9]\d{9}$/.test(digits)) return `+1${digits}`;

  // Already E.164 with a known country code
  if (/^\+\d{7,15}$/.test(raw.trim())) return raw.trim();

  return null;
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

// Keep old names as aliases so existing callers don't break
export const normalizeRwandaPhone = normalizePhone;
export const isValidRwandaPhone = isValidPhone;
