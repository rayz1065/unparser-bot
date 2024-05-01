/**
 * Hash function using JSON.stringify.
 */
export function stringifyHash(obj: any): string {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }

  const res: Record<string, string> = {};
  Object.keys(obj).forEach((key) => {
    res[key] = stringifyHash(obj[key]);
  });

  return JSON.stringify(obj, Object.keys(obj).sort());
}
