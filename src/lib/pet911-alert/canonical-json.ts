import crypto from 'crypto';
import type { ReasonCode } from './types';

type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [k: string]: JsonValue };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function sortObjectKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  for (const k of keys) out[k] = obj[k];
  return out;
}

function canonicalize(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(v => {
      const c = canonicalize(v);
      return c === undefined ? null : c;
    });
  }

  if (isPlainObject(value)) {
    const sorted = sortObjectKeys(value);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(sorted)) {
      out[k] = canonicalize(v);
    }
    return out;
  }

  throw new Error('Non-JSON value encountered during canonicalization');
}

export function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256HexCanonicalJson(value: unknown): string {
  const str = canonicalJsonStringify(value);
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function sortEligibleChannels(channels: string[]): string[] {
  return [...channels].sort((a, b) => a.localeCompare(b));
}

export function sortPredictedIneligibility(
  items: { channel: string; reason_code: ReasonCode }[]
): { channel: string; reason_code: ReasonCode }[] {
  return [...items].sort((a, b) => a.channel.localeCompare(b.channel));
}

export function sortAuditStream<T extends { channel: string; audience_segment: string; idempotency_key: string }>(
  events: T[]
): T[] {
  return [...events].sort((a, b) => {
    const c = a.channel.localeCompare(b.channel);
    if (c !== 0) return c;
    const s = a.audience_segment.localeCompare(b.audience_segment);
    if (s !== 0) return s;
    return a.idempotency_key.localeCompare(b.idempotency_key);
  });
}
