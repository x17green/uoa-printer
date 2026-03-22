/**
 * Staff ID generator.
 *
 * The goal is to produce a deterministic, unique, 8-character ID based on
 * employee metadata. The ID is not intended to be immutable (it can change if
 * the source data changes), but it must never collide within a single payroll
 * upload.
 */

export function normalizeNamePart(value: string, length: number): string {
  const letters = value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, length);
  return letters.padEnd(length, "X");
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function toBase36(value: number, length: number): string {
  const s = value.toString(36).toUpperCase();
  if (s.length >= length) return s.slice(0, length);
  return s.padStart(length, "0");
}

export function generateStaffId(
  fullName: string,
  dob?: string,
  existing = new Set<string>(),
): string {
  const parts = fullName
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter((p) => p.length > 0);

  const first = normalizeNamePart(parts[0] ?? "", 2);
  const last = normalizeNamePart(parts[parts.length - 1] ?? "", 2);

  const dobPart = dob
    ? dob.replace(/\D/g, "").slice(-4).padStart(4, "0")
    : "0000";

  const base = (first + last + dobPart).slice(0, 8).padEnd(8, "X");

  let candidate = base;
  let suffix = 0;

  while (existing.has(candidate) && suffix < 1000) {
    const hash = hashString(`${base}|${suffix}`);
    candidate = toBase36(hash, 8);
    suffix += 1;
  }

  if (existing.has(candidate)) {
    const fallbackHash = hashString(`${base}|FALLBACK`);
    candidate = toBase36(fallbackHash, 8);
  }

  existing.add(candidate);
  return candidate;
}
