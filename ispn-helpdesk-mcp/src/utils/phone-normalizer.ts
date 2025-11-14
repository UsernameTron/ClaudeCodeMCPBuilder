/**
 * Phone Number Normalizer
 *
 * ISPN API requires 10-digit phone numbers (e.g., "1234567890")
 * MCP tools may receive E.164 format (e.g., "+12345678900")
 */

/**
 * Normalize phone number to ISPN format (10 digits)
 *
 * Accepts:
 * - E.164: +12345678900
 * - National: (123) 456-7890
 * - Plain: 1234567890
 *
 * Returns: 1234567890 (10 digits, no formatting)
 *
 * @throws Error if phone number is invalid
 */
export function normalizePhoneForISPN(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different formats
  if (digits.length === 11 && digits.startsWith('1')) {
    // North American format with country code: 12345678900 → 2345678900
    return digits.substring(1);
  }

  if (digits.length === 10) {
    // Already in correct format
    return digits;
  }

  throw new Error(
    `Invalid phone number format. Expected 10 or 11 digits, got ${digits.length}. Input: ${phone}`
  );
}

/**
 * Validate phone number format
 *
 * @returns true if phone number is valid for ISPN API
 */
export function isValidISPNPhone(phone: string): boolean {
  try {
    normalizePhoneForISPN(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format phone number for display (US format)
 *
 * Input: 1234567890
 * Output: (123) 456-7890
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhoneForISPN(phone);

  return `(${normalized.substring(0, 3)}) ${normalized.substring(3, 6)}-${normalized.substring(6)}`;
}

/**
 * Convert ISPN phone to E.164 format
 *
 * Input: 1234567890
 * Output: +11234567890
 */
export function phoneToE164(phone: string): string {
  const normalized = normalizePhoneForISPN(phone);
  return `+1${normalized}`;
}
