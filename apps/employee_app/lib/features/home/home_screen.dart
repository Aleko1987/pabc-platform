import 'package:flutter/material.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../data/customers_data.dart';
import '../../data/staff_directory.dart';
import '../../features/areas/area_detail_screen.dart';
import '../../features/customers/customer_detail_screen.dart';
import '../../features/roster/org_roster_screen.dart';
import '../../features/staff/staff_detail_screen.dart';
import '../../shared/widgets/pabc_card.dart';

class _NamedArea {
  const _NamedArea({required this.slug, required this.label});
  final String slug;
  final String label;
}

class _AreaGroup {
  const _AreaGroup({required this.region, required this.areas});
  final String region;
  final List<_NamedArea> areas;
}

/// Aligned with admin-web `areas.ts` — only places named on customer records.
const _kAreaGroups = <_AreaGroup>[
  _AreaGroup(
    region: 'Johannesburg',
    areas: [
      _NamedArea(slug: 'edenvale', label: 'Edenvale'),
      _NamedArea(slug: 'katlehong', label: 'Katlehong'),
      _NamedArea(slug: 'meadowdale', label: 'Meadowdale'),
      _NamedArea(slug: 'malboro', label: 'Malboro'),
      _NamedArea(slug: 'melrose', label: 'Melrose'),
      _NamedArea(slug: 'modderfontein', label: 'Modderfontein'),
      _NamedArea(slug: 'primrose', label: 'Primrose'),
      _NamedArea(slug: 'sandton', label: 'Sandton'),
    ],
  ),
];

enum _DashboardTab { customers, staff, areas }

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  _DashboardTab _tab = _DashboardTab.customers;
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<CustomerRecord> get _filteredCustomers {
    final q = _searchController.text.trim().toLowerCase();
    final list = List<CustomerRecord>.from(kCustomerRecords);
    if (q.isEmpty) return list;
    return list
        .where(
          (c) =>
              c.name.toLowerCase().contains(q) ||
              c.slug.toLowerCase().contains(q),
        )
        .toList(growable: false);
  }

  List<StaffRecord> get _filteredStaff {
    final q = _searchController.text.trim().toLowerCase();
    final list = List<StaffRecord>.from(kStaffRecords);
    if (q.isEmpty) return list;
    return list
        .where(
          (s) =>
              s.name.toLowerCase().contains(q) ||
              s.slug.toLowerCase().contains(q) ||
              s.role.toLowerCase().contains(q),
        )
        .toList(growable: false);
  }

  List<_NamedArea> get _filteredAreas {
    final flat =
        _kAreaGroups.expand((g) => g.areas).toList(growable: false);
    final q = _searchController.text.trim().toLowerCase();
    if (q.isEmpty) return flat;
    return flat
        .where(
          (a) =>
              a.label.toLowerCase().contains(q) ||
              a.slug.toLowerCase().contains(q),
        )
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.navy,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              _DashboardHeader(
                searchController: _searchController,
                onSearchChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 20),
              _TabRow(
                tab: _tab,
                onChanged: (t) => setState(() => _tab = t),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const OrgRosterScreen(),
                      ),
                    );
                  },
                  icon: const Icon(
                    Icons.groups_outlined,
                    color: AppColors.gold,
                    size: 20,
                  ),
                  label: const Text(
                    'Team roster',
                    style: TextStyle(
                      color: AppColors.gold,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: _tab == _DashboardTab.areas
                    ? (_filteredAreas.isEmpty
                        ? Center(
                            child: Text(
                              'No areas match your search.',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(color: AppColors.textSecondary),
                            ),
                          )
                        : ListView.separated(
                            itemCount: _filteredAreas.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final a = _filteredAreas[index];
                              return _PillListTile(
                                label: a.label,
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute<void>(
                                      builder: (_) => AreaDetailScreen(
                                        slug: a.slug,
                                        label: a.label,
                                      ),
                                    ),
                                  );
                                },
                              );
                            },
                          ))
                    : ListView.separated(
                        itemCount: _tab == _DashboardTab.customers
                            ? _filteredCustomers.length
                            : _filteredStaff.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          if (_tab == _DashboardTab.customers) {
                            final c = _filteredCustomers[index];
                            return _PillListTile(
                              label: c.name,
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) =>
                                        CustomerDetailScreen(slug: c.slug),
                                  ),
                                );
                              },
                            );
                          }
                          final staff = _filteredStaff[index];
                          return _PillListTile(
                            label: staff.name,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute<void>(
                                  builder: (_) =>
                                      StaffDetailScreen(slug: staff.slug),
                                ),
                              );
                            },
                          );
                        },
                      ),
              ),
              if (!AppConfig.hasSupabaseConfig) ...[
                const SizedBox(height: 12),
                PabcCard(
                  title: 'Development shell',
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.info_outline,
                        color: AppColors.spotlightBlue,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Supabase is not configured. Add SUPABASE_URL and '
                          'SUPABASE_ANON_KEY via --dart-define-from-file to enable auth and data.',
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardHeader extends StatelessWidget {
  const _DashboardHeader({
    required this.searchController,
    required this.onSearchChanged,
  });

  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final narrow = constraints.maxWidth < 400;
        if (narrow) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Dashboard',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.gold,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              _SearchField(
                controller: searchController,
                onChanged: onSearchChanged,
              ),
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'Dashboard',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: AppColors.gold,
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const Spacer(),
            SizedBox(
              width: 220,
              child: _SearchField(
                controller: searchController,
                onChanged: onSearchChanged,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({
    required this.controller,
    required this.onChanged,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
      decoration: InputDecoration(
        hintText: 'Search…',
        hintStyle: TextStyle(
          color: AppColors.textSecondary.withValues(alpha: 0.85),
        ),
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary, size: 20),
        filled: true,
        fillColor: AppColors.navySurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: AppColors.spotlightBlue),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: AppColors.spotlightBlue),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
        ),
      ),
    );
  }
}

class _TabRow extends StatelessWidget {
  const _TabRow({
    required this.tab,
    required this.onChanged,
  });

  final _DashboardTab tab;
  final ValueChanged<_DashboardTab> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _TabPill(
            label: 'Customers',
            selected: tab == _DashboardTab.customers,
            onTap: () => onChanged(_DashboardTab.customers),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _TabPill(
            label: 'Staff',
            selected: tab == _DashboardTab.staff,
            onTap: () => onChanged(_DashboardTab.staff),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _TabPill(
            label: 'Areas',
            selected: tab == _DashboardTab.areas,
            onTap: () => onChanged(_DashboardTab.areas),
          ),
        ),
      ],
    );
  }
}

class _TabPill extends StatelessWidget {
  const _TabPill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final narrow = constraints.maxWidth < 96;
        final fontSize = narrow ? 11.0 : 13.0;
        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(999),
            child: Ink(
              decoration: BoxDecoration(
                color: selected ? AppColors.gold : AppColors.navySurface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: selected ? AppColors.gold : AppColors.gold.withValues(alpha: 0.45),
                  width: 1.5,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                child: Center(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      label,
                      maxLines: 1,
                      style: TextStyle(
                        color: selected ? Colors.black : AppColors.gold,
                        fontWeight: FontWeight.w600,
                        fontSize: fontSize,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _PillListTile extends StatelessWidget {
  const _PillListTile({required this.label, this.onTap});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final text = Text(
      label,
      textAlign: TextAlign.center,
      style: const TextStyle(
        color: Colors.black87,
        fontWeight: FontWeight.w600,
        fontSize: 15,
      ),
    );

    if (onTap == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.gold,
          borderRadius: BorderRadius.circular(999),
        ),
        alignment: Alignment.center,
        child: text,
      );
    }

    return Material(
      color: AppColors.gold,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Center(child: text),
        ),
      ),
    );
  }
}
