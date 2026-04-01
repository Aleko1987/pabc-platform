/** Areas reflected in customer `areaSlugs` — used by Dashboard Areas tab. */

export type AreaItem = {
  slug: string;
  label: string;
};

const _jhb: AreaItem[] = [
  { slug: "edenvale", label: "Edenvale" },
  { slug: "katlehong", label: "Katlehong" },
  { slug: "meadowdale", label: "Meadowdale" },
  { slug: "malboro", label: "Malboro" },
  { slug: "melrose", label: "Melrose" },
  { slug: "modderfontein", label: "Modderfontein" },
  { slug: "primrose", label: "Primrose" },
  { slug: "sandton", label: "Sandton" },
];

export const ALL_AREAS_FLAT: AreaItem[] = _jhb;

export function getAreaBySlug(slug: string): AreaItem | undefined {
  return ALL_AREAS_FLAT.find((a) => a.slug === slug);
}
