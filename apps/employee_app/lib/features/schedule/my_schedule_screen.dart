import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../data/roster_assignments.dart';
import '../../data/staff_directory.dart';
import '../../utils/month_calendar.dart';

/// Personal schedule — mirrors admin `StaffSchedulePage`.
class MyScheduleScreen extends StatefulWidget {
  const MyScheduleScreen({super.key});

  @override
  State<MyScheduleScreen> createState() => _MyScheduleScreenState();
}

class _MyScheduleScreenState extends State<MyScheduleScreen> {
  late DateTime _cursor;
  late StaffRecord _staff;

  @override
  void initState() {
    super.initState();
    _cursor = DateTime.now();
    _staff = staffBySlug(kDemoStaffSlug) ?? kStaffRecords.first;
  }

  void _addMonths(int delta) {
    setState(() {
      _cursor = DateTime(_cursor.year, _cursor.month + delta, 1);
    });
  }

  @override
  Widget build(BuildContext context) {
    final year = _cursor.year;
    final monthIndex = _cursor.month - 1;
    final grid = calendarGrid(year, monthIndex);
    final siteGroups = sitesAndColleaguesForStaff(_staff.name);

    return Scaffold(
      backgroundColor: AppColors.navy,
      appBar: AppBar(
        title: const Text('My schedule'),
        backgroundColor: AppColors.navySurface,
        foregroundColor: AppColors.textPrimary,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          Text(
            '${_staff.name} · ${_staff.role}',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Five shifts per week: one day shift (08:00–16:00) Monday–Friday; '
            'other bands and weekends off. Mock postings from eligible sites.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              IconButton(
                onPressed: () => _addMonths(-1),
                icon: const Icon(Icons.chevron_left, color: AppColors.gold),
                tooltip: 'Previous month',
              ),
              Expanded(
                child: Text(
                  monthTitle(year, monthIndex),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.w700,
                    fontSize: 18,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => _addMonths(1),
                icon: const Icon(Icons.chevron_right, color: AppColors.gold),
                tooltip: 'Next month',
              ),
            ],
          ),
          const SizedBox(height: 8),
          _MonthGrid(
            year: year,
            monthIndex: monthIndex,
            grid: grid,
            staff: _staff,
          ),
          const SizedBox(height: 24),
          Text(
            'Who is at your company & sites',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Other officers on the same client roster — handovers and shift overlap.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: 12),
          if (siteGroups.isEmpty)
            Text(
              'No customer sites linked to this profile yet.',
              style: TextStyle(color: AppColors.textSecondary.withValues(alpha: 0.9)),
            )
          else
            ...siteGroups.map((g) => _SiteCard(group: g)),
        ],
      ),
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.year,
    required this.monthIndex,
    required this.grid,
    required this.staff,
  });

  final int year;
  final int monthIndex;
  final List<int?> grid;
  final StaffRecord staff;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: kWeekdays
              .map(
                (w) => Expanded(
                  child: Center(
                    child: Text(
                      w,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                        color: AppColors.spotlightBlue,
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 4),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 7,
            mainAxisSpacing: 2,
            crossAxisSpacing: 2,
            childAspectRatio: 0.52,
          ),
          itemCount: grid.length,
          itemBuilder: (context, i) {
            final day = grid[i];
            if (day == null) {
              return Container(
                decoration: BoxDecoration(
                  color: AppColors.navySurface.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(6),
                ),
              );
            }
            final dateKey = dateKeyFromParts(year, monthIndex, day);
            final segments = personalScheduleThreeSegments(
              staff.slug,
              staff.name,
              dateKey,
            );

            return Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.navySurface.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: AppColors.spotlightBlue.withValues(alpha: 0.35),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$day',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: AppColors.spotlightBlue.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Column(
                        children: List.generate(segments.length, (si) {
                          final seg = segments[si];
                          final isLast = si == segments.length - 1;
                          return Expanded(
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 2,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                border: isLast
                                    ? null
                                    : Border(
                                        bottom: BorderSide(
                                          color: AppColors.spotlightBlue
                                              .withValues(alpha: 0.2),
                                        ),
                                      ),
                              ),
                              child: seg is WorkSegment
                                  ? Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          seg.label,
                                          style: TextStyle(
                                            fontSize: 7,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.textSecondary
                                                .withValues(alpha: 0.75),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          seg.posting.customerName,
                                          style: const TextStyle(
                                            fontSize: 8,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.gold,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        Text(
                                          seg.posting.siteName,
                                          style: TextStyle(
                                            fontSize: 7,
                                            color: AppColors.textSecondary
                                                .withValues(alpha: 0.95),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    )
                                  : Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          seg.label,
                                          style: TextStyle(
                                            fontSize: 7,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.textSecondary
                                                .withValues(alpha: 0.55),
                                          ),
                                        ),
                                        Text(
                                          'Off',
                                          style: TextStyle(
                                            fontSize: 8,
                                            fontWeight: FontWeight.w600,
                                            fontStyle: FontStyle.italic,
                                            color: AppColors.textSecondary
                                                .withValues(alpha: 0.45),
                                          ),
                                        ),
                                      ],
                                    ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class _SiteCard extends StatelessWidget {
  const _SiteCard({required this.group});

  final SiteColleagueGroup group;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.navySurface.withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.spotlightBlue.withValues(alpha: 0.4),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    group.customerName,
                    style: const TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: AppColors.spotlightBlue.withValues(alpha: 0.5),
                    ),
                  ),
                  child: Text(
                    group.siteName,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                      color: AppColors.spotlightBlue,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (group.colleagues.isEmpty)
              Text(
                'No other guards listed at this site.',
                style: TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: AppColors.textSecondary.withValues(alpha: 0.9),
                ),
              )
            else
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: group.colleagues
                    .map(
                      (c) => Text(
                        c.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                    )
                    .toList(),
              ),
          ],
        ),
      ),
    );
  }
}
