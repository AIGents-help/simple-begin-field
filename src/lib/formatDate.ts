/**
 * App-wide safe date formatter.
 *
 * Returns a human-readable date string, or `fallback` (default: "Not provided")
 * for any value that is null, empty, the literal strings "null"/"undefined",
 * an unparseable date, the epoch `0000-..` / `0001-01-01` placeholder, or any
 * date earlier than 1900 (treated as a placeholder/garbage value).
 */
export const formatHumanDate = (
  value: unknown,
  options?: Intl.DateTimeFormatOptions,
  fallback = 'Not provided',
): string => {
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;
  const lower = raw.toLowerCase();
  if (lower === 'null' || lower === 'undefined') return fallback;
  // Common placeholder/garbage dates that should never display.
  if (raw.startsWith('0000-') || raw.startsWith('0001-')) return fallback;

  const d = new Date(raw);
  if (isNaN(d.getTime())) return fallback;
  if (d.getFullYear() < 1900) return fallback;

  return d.toLocaleDateString(
    undefined,
    options ?? { year: 'numeric', month: 'short', day: 'numeric' },
  );
};

/**
 * Returns true when a value represents a valid, displayable real-world date
 * (not null, not the 0001-01-01 placeholder, not pre-1900).
 */
export const isValidDisplayDate = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  const raw = String(value).trim();
  if (!raw) return false;
  const lower = raw.toLowerCase();
  if (lower === 'null' || lower === 'undefined') return false;
  if (raw.startsWith('0000-') || raw.startsWith('0001-')) return false;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return false;
  return d.getFullYear() >= 1900;
};
