export interface EntitlementRow {
  provider: string;
  planId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  autoRenewing: boolean;
}

export interface Entitlement {
  premium: boolean;
  expiresAt: string | null;
  provider: string | null;
  planId: string | null;
  autoRenewing: boolean;
}

/** Premium = at least one non-revoked grant whose expiry is in the future.
 *  Reports the grant that lasts longest so the UI can show "valid until". */
export const computeEntitlement = (rows: EntitlementRow[], now: Date = new Date()): Entitlement => {
  const active = rows
    .filter((r) => !r.revokedAt && r.expiresAt.getTime() > now.getTime())
    .sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime());
  const best = active[0];
  if (!best) return { premium: false, expiresAt: null, provider: null, planId: null, autoRenewing: false };
  return {
    premium: true,
    expiresAt: best.expiresAt.toISOString(),
    provider: best.provider,
    planId: best.planId,
    autoRenewing: best.autoRenewing,
  };
};

/** Stacking rule for one-off passes: buying a new pass while one is still
 *  active extends from the current expiry instead of wasting the overlap. */
export const stackedStart = (rows: EntitlementRow[], now: Date = new Date()): Date => {
  const current = computeEntitlement(rows, now);
  return current.expiresAt ? new Date(current.expiresAt) : now;
};
