/**
 * Mock aerial layout (0–100 × 0–100 “site” coordinates).
 * Used by the field mini-map; replace with live GPS / indoor positioning later.
 */
export const STAFF_FIELD_POSITIONS: Record<string, { x: number; y: number }> = {
  "thabo-mokoena": { x: 52, y: 44 },
  "nomsa-khumalo": { x: 38, y: 58 },
  "david-van-der-berg": { x: 68, y: 40 },
  "lerato-maseko": { x: 48, y: 72 },
  "pieter-botha": { x: 62, y: 55 },
  "zanele-dlamini": { x: 45, y: 48 },
  "kevin-naidoo": { x: 30, y: 35 },
  "ayanda-ntuli": { x: 72, y: 62 },
  "michelle-fourie": { x: 55, y: 28 },
};

export function getFieldPositionForSlug(slug: string): { x: number; y: number } {
  return STAFF_FIELD_POSITIONS[slug] ?? { x: 50, y: 50 };
}
