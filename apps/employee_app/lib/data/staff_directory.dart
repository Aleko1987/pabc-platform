/// Mirrors `apps/admin-web/src/data/staffDirectory.ts`.

final class StaffRecord {
  const StaffRecord({
    required this.slug,
    required this.name,
    required this.role,
    this.phone,
  });

  final String slug;
  final String name;
  final String role;
  final String? phone;
}

const List<StaffRecord> kStaffRecords = [
  StaffRecord(
    slug: 'thabo-mokoena',
    name: 'Thabo Mokoena',
    role: 'Site supervisor',
    phone: '+27 82 000 1001',
  ),
  StaffRecord(
    slug: 'nomsa-khumalo',
    name: 'Nomsa Khumalo',
    role: 'Security officer',
    phone: '+27 83 000 1002',
  ),
  StaffRecord(
    slug: 'david-van-der-berg',
    name: 'David van der Berg',
    role: 'Armed response',
    phone: '+27 84 000 1003',
  ),
  StaffRecord(
    slug: 'lerato-maseko',
    name: 'Lerato Maseko',
    role: 'Control room',
    phone: '+27 82 000 1004',
  ),
  StaffRecord(
    slug: 'pieter-botha',
    name: 'Pieter Botha',
    role: 'Security officer',
    phone: '+27 83 000 1005',
  ),
  StaffRecord(
    slug: 'zanele-dlamini',
    name: 'Zanele Dlamini',
    role: 'Team lead',
    phone: '+27 84 000 1006',
  ),
  StaffRecord(
    slug: 'kevin-naidoo',
    name: 'Kevin Naidoo',
    role: 'Patrol',
    phone: '+27 82 000 1007',
  ),
  StaffRecord(
    slug: 'ayanda-ntuli',
    name: 'Ayanda Ntuli',
    role: 'Security officer',
    phone: '+27 83 000 1008',
  ),
  StaffRecord(
    slug: 'michelle-fourie',
    name: 'Michelle Fourie',
    role: 'Site supervisor',
    phone: '+27 84 000 1009',
  ),
];

final Map<String, StaffRecord> kStaffBySlug = {
  for (final s in kStaffRecords) s.slug: s,
};

StaffRecord? staffBySlug(String slug) => kStaffBySlug[slug];

StaffRecord? staffByName(String displayName) {
  final key = displayName.trim().toLowerCase();
  for (final s in kStaffRecords) {
    if (s.name.toLowerCase() == key) return s;
  }
  return null;
}

/// Default signed-in demo profile until Supabase maps users → staff rows.
const String kDemoStaffSlug = 'nomsa-khumalo';
