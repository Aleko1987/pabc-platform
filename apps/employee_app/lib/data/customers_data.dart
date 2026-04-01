/// Mirrors `apps/admin-web/src/data/customers.ts`.

final class SiteWithGuards {
  const SiteWithGuards({required this.siteName, required this.guards});

  final String siteName;
  final List<String> guards;
}

final class CustomerRecord {
  const CustomerRecord({
    required this.slug,
    required this.name,
    required this.areaSlugs,
    required this.sites,
  });

  final String slug;
  final String name;
  final List<String> areaSlugs;
  final List<SiteWithGuards> sites;
}

const List<CustomerRecord> kCustomerRecords = [
  CustomerRecord(
    slug: 'malboro-crane-hire',
    name: 'Malboro Crane Hire',
    areaSlugs: ['malboro'],
    sites: [
      SiteWithGuards(
        siteName: 'Main yard',
        guards: ['Thabo Mokoena', 'Nomsa Khumalo', 'David van der Berg'],
      ),
      SiteWithGuards(
        siteName: 'Depot',
        guards: ['Lerato Maseko', 'Pieter Botha'],
      ),
    ],
  ),
  CustomerRecord(
    slug: 'edenvale-action-sports',
    name: 'Edenvale Action Sports',
    areaSlugs: ['edenvale'],
    sites: [
      SiteWithGuards(
        siteName: 'Arena',
        guards: ['Zanele Dlamini', 'Kevin Naidoo'],
      ),
      SiteWithGuards(siteName: 'Parking', guards: ['Ayanda Ntuli']),
    ],
  ),
  CustomerRecord(
    slug: 'country-pies',
    name: 'Country Pies HQ Modderfontein',
    areaSlugs: ['modderfontein'],
    sites: [
      SiteWithGuards(
        siteName: 'HQ',
        guards: ['Michelle Fourie', 'Thabo Mokoena'],
      ),
    ],
  ),
  CustomerRecord(
    slug: 'broll-real-estate',
    name: 'Broll Real Estate Sandton',
    areaSlugs: ['sandton'],
    sites: [
      SiteWithGuards(
        siteName: 'Head office',
        guards: ['Nomsa Khumalo', 'David van der Berg'],
      ),
      SiteWithGuards(
        siteName: 'Branch hub',
        guards: ['Lerato Maseko'],
      ),
    ],
  ),
  CustomerRecord(
    slug: 'james-movers',
    name: 'James Movers Primrose',
    areaSlugs: ['primrose'],
    sites: [
      SiteWithGuards(
        siteName: 'Warehouse',
        guards: ['Pieter Botha', 'Zanele Dlamini'],
      ),
    ],
  ),
  CustomerRecord(
    slug: 'peters-papers',
    name: 'Peters Papers Meadowdale',
    areaSlugs: ['meadowdale'],
    sites: [
      SiteWithGuards(
        siteName: 'Plant',
        guards: ['Kevin Naidoo', 'Ayanda Ntuli'],
      ),
    ],
  ),
  CustomerRecord(
    slug: 'fnb-sandton',
    name: 'FNB Sandton',
    areaSlugs: ['sandton'],
    sites: [
      SiteWithGuards(
        siteName: 'Banking hall',
        guards: ['Thabo Mokoena', 'Michelle Fourie', 'Nomsa Khumalo'],
      ),
      SiteWithGuards(
        siteName: 'Parking basement',
        guards: ['David van der Berg'],
      ),
    ],
  ),
  CustomerRecord(
    slug: 'absa-melrose',
    name: 'Absa Melrose',
    areaSlugs: ['melrose'],
    sites: [
      SiteWithGuards(
        siteName: 'Branch',
        guards: ['Lerato Maseko', 'Pieter Botha'],
      ),
    ],
  ),
  CustomerRecord(
    slug: 'peters-chickens',
    name: 'Peters Chickens Katlehong',
    areaSlugs: ['katlehong'],
    sites: [
      SiteWithGuards(
        siteName: 'Processing',
        guards: ['Zanele Dlamini', 'Kevin Naidoo'],
      ),
      SiteWithGuards(
        siteName: 'Cold storage',
        guards: ['Ayanda Ntuli'],
      ),
    ],
  ),
];

CustomerRecord? customerBySlug(String slug) {
  for (final c in kCustomerRecords) {
    if (c.slug == slug) return c;
  }
  return null;
}
