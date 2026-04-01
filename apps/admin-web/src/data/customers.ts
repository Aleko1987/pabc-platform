/** Mock customer → sites → security guards (names must match `staffDirectory.ts`). */

export type SiteWithGuards = {
  siteName: string;
  guards: string[];
};

export type CustomerRecord = {
  slug: string;
  name: string;
  /** Area slugs (from `areas.ts`) where this store appears on the Dashboard Areas map. */
  areaSlugs: string[];
  sites: SiteWithGuards[];
};

export const CUSTOMER_RECORDS: CustomerRecord[] = [
  {
    slug: "malboro-crane-hire",
    name: "Malboro Crane Hire",
    areaSlugs: ["malboro"],
    sites: [
      {
        siteName: "Main yard",
        guards: ["Thabo Mokoena", "Nomsa Khumalo", "David van der Berg"],
      },
      {
        siteName: "Depot",
        guards: ["Lerato Maseko", "Pieter Botha"],
      },
    ],
  },
  {
    slug: "edenvale-action-sports",
    name: "Edenvale Action Sports",
    areaSlugs: ["edenvale"],
    sites: [
      {
        siteName: "Arena",
        guards: ["Zanele Dlamini", "Kevin Naidoo"],
      },
      { siteName: "Parking", guards: ["Ayanda Ntuli"] },
    ],
  },
  {
    slug: "country-pies",
    name: "Country Pies HQ Modderfontein",
    areaSlugs: ["modderfontein"],
    sites: [
      {
        siteName: "HQ",
        guards: ["Michelle Fourie", "Thabo Mokoena"],
      },
    ],
  },
  {
    slug: "broll-real-estate",
    name: "Broll Real Estate Sandton",
    areaSlugs: ["sandton"],
    sites: [
      {
        siteName: "Head office",
        guards: ["Nomsa Khumalo", "David van der Berg"],
      },
      { siteName: "Branch hub", guards: ["Lerato Maseko"] },
    ],
  },
  {
    slug: "james-movers",
    name: "James Movers Primrose",
    areaSlugs: ["primrose"],
    sites: [
      {
        siteName: "Warehouse",
        guards: ["Pieter Botha", "Zanele Dlamini"],
      },
    ],
  },
  {
    slug: "peters-papers",
    name: "Peters Papers Meadowdale",
    areaSlugs: ["meadowdale"],
    sites: [
      {
        siteName: "Plant",
        guards: ["Kevin Naidoo", "Ayanda Ntuli"],
      },
    ],
  },
  {
    slug: "fnb-sandton",
    name: "FNB Sandton",
    areaSlugs: ["sandton"],
    sites: [
      {
        siteName: "Banking hall",
        guards: ["Thabo Mokoena", "Michelle Fourie", "Nomsa Khumalo"],
      },
      { siteName: "Parking basement", guards: ["David van der Berg"] },
    ],
  },
  {
    slug: "absa-melrose",
    name: "Absa Melrose",
    areaSlugs: ["melrose"],
    sites: [
      {
        siteName: "Branch",
        guards: ["Lerato Maseko", "Pieter Botha"],
      },
    ],
  },
  {
    slug: "peters-chickens",
    name: "Peters Chickens Katlehong",
    areaSlugs: ["katlehong"],
    sites: [
      {
        siteName: "Processing",
        guards: ["Zanele Dlamini", "Kevin Naidoo"],
      },
      { siteName: "Cold storage", guards: ["Ayanda Ntuli"] },
    ],
  },
];

export function getCustomerBySlug(slug: string): CustomerRecord | undefined {
  return CUSTOMER_RECORDS.find((c) => c.slug === slug);
}

export function getCustomersByAreaSlug(areaSlug: string): CustomerRecord[] {
  return CUSTOMER_RECORDS.filter((c) => c.areaSlugs.includes(areaSlug));
}
