import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../data/customers_data.dart';
import '../../data/roster_assignments.dart';
import '../../data/staff_directory.dart';
import '../../utils/month_calendar.dart';
import '../../widgets/deployment_map_widget.dart';

/// Org-wide roster calendar — mirrors admin `RosterPage` (mobile layout).
class OrgRosterScreen extends StatefulWidget {
  const OrgRosterScreen({super.key});

  @override
  State<OrgRosterScreen> createState() => _OrgRosterScreenState();
}

class _OrgRosterScreenState extends State<OrgRosterScreen> {
  late DateTime _cursor;
  String _clientSearch = '';
  String? _filterClientSlug;

  @override
  void initState() {
    super.initState();
    _cursor = DateTime.now();
  }

  void _addMonths(int delta) {
    setState(() {
      _cursor = DateTime(_cursor.year, _cursor.month + delta, 1);
    });
  }

  List<CustomerRecord> get _filteredClients {
    final q = _clientSearch.trim().toLowerCase();
    if (q.isEmpty) return kCustomerRecords;
    return kCustomerRecords
        .where(
          (c) =>
              c.name.toLowerCase().contains(q) ||
              c.slug.toLowerCase().contains(q),
        )
        .toList(growable: false);
  }

  Set<String>? get _mapSlugs =>
      _filterClientSlug == null ? null : staffSlugsForCustomer(_filterClientSlug!).toSet();

  @override
  Widget build(BuildContext context) {
    final year = _cursor.year;
    final monthIndex = _cursor.month - 1;
    final grid = calendarGrid(year, monthIndex);

    return Scaffold(
      backgroundColor: AppColors.navy,
      appBar: AppBar(
        title: const Text('Team roster'),
        backgroundColor: AppColors.navySurface,
        foregroundColor: AppColors.textPrimary,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Monthly deployment (mock). Select all clients for the full map; '
            'search and tap one client to filter.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
          ),
          const SizedBox(height: 12),
          SwitchListTile(
            value: _filterClientSlug == null,
            onChanged: (v) {
              setState(() {
                if (v) {
                  _filterClientSlug = null;
                } else {
                  _filterClientSlug = _filteredClients.isEmpty
                      ? kCustomerRecords.first.slug
                      : _filteredClients.first.slug;
                }
              });
            },
            activeThumbColor: AppColors.gold,
            title: const Text(
              'Select all clients',
              style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
            ),
            subtitle: const Text(
              'Full calendar & deployment map',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
          ),
          TextField(
            onChanged: (s) => setState(() => _clientSearch = s),
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Search clients…',
              hintStyle: TextStyle(color: AppColors.textSecondary.withValues(alpha: 0.7)),
              filled: true,
              fillColor: AppColors.navySurface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.spotlightBlue),
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 120,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _filteredClients.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final c = _filteredClients[i];
                final sel = _filterClientSlug == c.slug;
                return ChoiceChip(
                  label: Text(
                    c.name,
                    style: TextStyle(
                      fontSize: 11,
                      color: sel ? Colors.black : AppColors.textPrimary,
                    ),
                  ),
                  selected: sel,
                  onSelected: (v) {
                    if (v) setState(() => _filterClientSlug = c.slug);
                  },
                  selectedColor: AppColors.gold,
                  backgroundColor: AppColors.navySurface,
                );
              },
            ),
          ),
          if (_filterClientSlug != null) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => setState(() => _filterClientSlug = null),
              child: const Text('Clear · show all clients'),
            ),
          ],
          const SizedBox(height: 12),
          const Text(
            'Deployment map',
            style: TextStyle(
              color: AppColors.gold,
              fontWeight: FontWeight.w700,
              fontSize: 12,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: DeploymentMapWidget(
              allStaff: kStaffRecords,
              visibleSlugs: _mapSlugs,
              size: 220,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              IconButton(
                onPressed: () => _addMonths(-1),
                icon: const Icon(Icons.chevron_left, color: AppColors.gold),
              ),
              Expanded(
                child: Text(
                  monthTitle(year, monthIndex),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.w700,
                    fontSize: 17,
                  ),
                ),
              ),
              IconButton(
                onPressed: () => _addMonths(1),
                icon: const Icon(Icons.chevron_right, color: AppColors.gold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _OrgMonthGrid(
            year: year,
            monthIndex: monthIndex,
            grid: grid,
            filterClientSlug: _filterClientSlug,
          ),
        ],
      ),
    );
  }
}

class _OrgMonthGrid extends StatelessWidget {
  const _OrgMonthGrid({
    required this.year,
    required this.monthIndex,
    required this.grid,
    required this.filterClientSlug,
  });

  final int year;
  final int monthIndex;
  final List<int?> grid;
  final String? filterClientSlug;

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
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
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
            childAspectRatio: 0.42,
          ),
          itemCount: grid.length,
          itemBuilder: (context, i) {
            final day = grid[i];
            if (day == null) {
              return Container(
                decoration: BoxDecoration(
                  color: AppColors.navySurface.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }
            final dateKey = dateKeyFromParts(year, monthIndex, day);
            var postings = buildAssignmentsForDay(dateKey);
            postings = filterPostingsForClient(postings, filterClientSlug);

            return Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: AppColors.navySurface.withValues(alpha: 0.88),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: AppColors.spotlightBlue.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$day',
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  Expanded(
                    child: ListView(
                      padding: EdgeInsets.zero,
                      children: postings.take(6).map((p) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 2),
                          child: Text(
                            filterClientSlug == null
                                ? '${p.staffName.split(' ').first} · ${p.customerName}'
                                : '${p.staffName.split(' ').first} · ${p.siteName}',
                            style: const TextStyle(
                              fontSize: 7,
                              height: 1.15,
                              color: AppColors.textSecondary,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  if (postings.length > 6)
                    Text(
                      '+${postings.length - 6}',
                      style: TextStyle(
                        fontSize: 6,
                        color: AppColors.gold.withValues(alpha: 0.8),
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
