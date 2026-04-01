/// Mirrors `apps/admin-web/src/data/rosterAssignments.ts`.

import 'customers_data.dart';
import 'staff_directory.dart';

final class DayPosting {
  const DayPosting({
    required this.staffSlug,
    required this.staffName,
    required this.customerSlug,
    required this.customerName,
    required this.siteName,
  });

  final String staffSlug;
  final String staffName;
  final String customerSlug;
  final String customerName;
  final String siteName;
}

final class SiteColleagueGroup {
  const SiteColleagueGroup({
    required this.customerSlug,
    required this.customerName,
    required this.siteName,
    required this.colleagues,
  });

  final String customerSlug;
  final String customerName;
  final String siteName;
  final List<({String slug, String name})> colleagues;
}

int _hashString(String s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) {
    h = (31 * h + s.codeUnitAt(i)) & 0x7fffffff;
  }
  return h;
}

List<({String customerSlug, String customerName, String siteName})>
    eligiblePostingsForStaffName(String name) {
  final out = <({String customerSlug, String customerName, String siteName})>[];
  for (final c in kCustomerRecords) {
    for (final site in c.sites) {
      if (site.guards.contains(name)) {
        out.add((
          customerSlug: c.slug,
          customerName: c.name,
          siteName: site.siteName,
        ));
      }
    }
  }
  return out;
}

DayPosting postingForDay(String staffSlug, String staffName, String dateKey) {
  final eligible = eligiblePostingsForStaffName(staffName);
  if (eligible.isEmpty) {
    return DayPosting(
      staffSlug: staffSlug,
      staffName: staffName,
      customerSlug: 'unassigned',
      customerName: 'Unassigned',
      siteName: '—',
    );
  }
  final i = _hashString(dateKey + staffSlug) % eligible.length;
  final p = eligible[i];
  return DayPosting(
    staffSlug: staffSlug,
    staffName: staffName,
    customerSlug: p.customerSlug,
    customerName: p.customerName,
    siteName: p.siteName,
  );
}

DayPosting postingForShift(
  String staffSlug,
  String staffName,
  String dateKey,
  int shiftIndex,
) {
  final eligible = eligiblePostingsForStaffName(staffName);
  if (eligible.isEmpty) {
    return DayPosting(
      staffSlug: staffSlug,
      staffName: staffName,
      customerSlug: 'unassigned',
      customerName: 'Unassigned',
      siteName: '—',
    );
  }
  final i =
      _hashString('$dateKey:$staffSlug:shift$shiftIndex') % eligible.length;
  final p = eligible[i];
  return DayPosting(
    staffSlug: staffSlug,
    staffName: staffName,
    customerSlug: p.customerSlug,
    customerName: p.customerName,
    siteName: p.siteName,
  );
}

const List<String> kScheduleShiftLabels = [
  '00:00–08:00',
  '08:00–16:00',
  '16:00–00:00',
];

sealed class PersonalScheduleSegment {
  const PersonalScheduleSegment({required this.label});

  final String label;
}

final class OffSegment extends PersonalScheduleSegment {
  const OffSegment({required super.label});
}

final class WorkSegment extends PersonalScheduleSegment {
  const WorkSegment({required super.label, required this.posting});

  final DayPosting posting;
}

/// Five shifts per week: one day shift Mon–Fri; weekends & other bands off.
List<PersonalScheduleSegment> personalScheduleThreeSegments(
  String staffSlug,
  String staffName,
  String dateKey,
) {
  final parts = dateKey.split('-');
  final y = int.parse(parts[0]);
  final m = int.parse(parts[1]);
  final d = int.parse(parts[2]);
  final date = DateTime(y, m, d);
  final dow = date.weekday; // Mon=1 .. Sun=7
  final isWeekend = dow == DateTime.saturday || dow == DateTime.sunday;

  if (isWeekend) {
    return [
      OffSegment(label: kScheduleShiftLabels[0]),
      OffSegment(label: kScheduleShiftLabels[1]),
      OffSegment(label: kScheduleShiftLabels[2]),
    ];
  }

  final dayShift = postingForShift(staffSlug, staffName, dateKey, 1);
  return [
    OffSegment(label: kScheduleShiftLabels[0]),
    WorkSegment(label: kScheduleShiftLabels[1], posting: dayShift),
    OffSegment(label: kScheduleShiftLabels[2]),
  ];
}

List<DayPosting> buildAssignmentsForDay(String dateKey) {
  return kStaffRecords
      .map((s) => postingForDay(s.slug, s.name, dateKey))
      .toList(growable: false);
}

List<DayPosting> filterPostingsForClient(
  List<DayPosting> postings,
  String? clientSlug,
) {
  if (clientSlug == null) return postings;
  return postings.where((p) => p.customerSlug == clientSlug).toList();
}

List<String> staffSlugsForCustomer(String customerSlug) {
  final c = customerBySlug(customerSlug);
  if (c == null) return [];
  final names = <String>{};
  for (final site in c.sites) {
    names.addAll(site.guards);
  }
  final slugs = <String>[];
  for (final name in names) {
    final rec = staffByName(name);
    if (rec != null) slugs.add(rec.slug);
  }
  return slugs;
}

List<SiteColleagueGroup> sitesAndColleaguesForStaff(String staffName) {
  final groups = <SiteColleagueGroup>[];
  for (final c in kCustomerRecords) {
    for (final site in c.sites) {
      if (!site.guards.contains(staffName)) continue;
      final colleagues = <({String slug, String name})>[];
      for (final g in site.guards) {
        if (g == staffName) continue;
        final rec = staffByName(g);
        if (rec != null) colleagues.add((slug: rec.slug, name: rec.name));
      }
      groups.add(
        SiteColleagueGroup(
          customerSlug: c.slug,
          customerName: c.name,
          siteName: site.siteName,
          colleagues: colleagues,
        ),
      );
    }
  }
  return groups;
}

String dateKeyFromParts(int year, int monthIndex, int day) {
  final m = (monthIndex + 1).toString().padLeft(2, '0');
  final d = day.toString().padLeft(2, '0');
  return '$year-$m-$d';
}
