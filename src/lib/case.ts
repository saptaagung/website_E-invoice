function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function toCamel<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => toCamel(v)) as T;
  if (typeof value === "object" && value instanceof Date) return value;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[snakeToCamelKey(k)] = toCamel(v);
    }
    return out as T;
  }
  return value;
}

export function toSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snake] = v;
  }
  return out;
}
