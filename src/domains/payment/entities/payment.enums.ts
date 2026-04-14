/**
 * Check type enum.
 */
export enum CheckType {
  RECEIVED = 'received',  // Gelen çek
  GIVEN = 'given',        // Verilen çek
}

/**
 * Check status enum.
 */
export enum CheckStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  BOUNCED = 'bounced',    // Karşılıksız
}
