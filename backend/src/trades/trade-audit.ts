export type TradeAuditAction = 'CREATED' | 'UPDATED' | 'CANCELLED';

export type AuditActor = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  traderId?: string;
};

export type FieldChange = {
  from: string | number | null;
  to: string | number | null;
};

export const AUDITED_FIELDS = [
  'symbol',
  'side',
  'status',
  'quantity',
  'price',
  'trader',
  'book',
  'counterparty',
  'tradeDate',
] as const;

export type AuditedField = (typeof AUDITED_FIELDS)[number];

export function actorDisplayName(actor: AuditActor): string {
  const firstName = actor.firstName?.trim();
  const lastName = actor.lastName?.trim();
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  const traderId = actor.traderId?.trim();
  if (traderId) {
    return traderId;
  }
  return actor.email;
}

export function snapshotField(field: AuditedField, value: unknown): string | number | null {
  if (value == null || value === '') {
    return null;
  }

  if (field === 'quantity') {
    return Number(value);
  }

  if (field === 'price') {
    return Number(value);
  }

  if (field === 'tradeDate') {
    const date = new Date(value as string | Date);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return String(value);
}

export function diffTradeFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, FieldChange> {
  const changes: Record<string, FieldChange> = {};

  for (const field of AUDITED_FIELDS) {
    const from = snapshotField(field, before[field]);
    const to = snapshotField(field, after[field]);
    if (from !== to) {
      changes[field] = { from, to };
    }
  }

  return changes;
}
