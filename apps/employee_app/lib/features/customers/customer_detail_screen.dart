import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../data/customers_data.dart';
import '../../data/staff_directory.dart';
import '../staff/staff_detail_screen.dart';

/// Sites and guards — mirrors admin `CustomerDetailPage`.
class CustomerDetailScreen extends StatelessWidget {
  const CustomerDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context) {
    final customer = customerBySlug(slug);
    if (customer == null) {
      return Scaffold(
        backgroundColor: AppColors.navy,
        appBar: AppBar(
          backgroundColor: AppColors.navySurface,
          foregroundColor: AppColors.textPrimary,
          title: const Text('Customer'),
        ),
        body: Center(
          child: Text(
            'No customer matches “$slug”.',
            style: TextStyle(color: AppColors.textSecondary.withValues(alpha: 0.95)),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.navy,
      appBar: AppBar(
        backgroundColor: AppColors.navySurface,
        foregroundColor: AppColors.textPrimary,
        title: Text(customer.name),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          Text(
            'Sites and assigned guards (mock).',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.45,
                ),
          ),
          const SizedBox(height: 20),
          for (final site in customer.sites) ...[
            _SiteCard(
              siteName: site.siteName,
              guards: site.guards,
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }
}

class _SiteCard extends StatelessWidget {
  const _SiteCard({
    required this.siteName,
    required this.guards,
  });

  final String siteName;
  final List<String> guards;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.navySurface.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.spotlightBlue.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            siteName,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final name in guards)
                _GuardPill(name: name),
            ],
          ),
        ],
      ),
    );
  }
}

class _GuardPill extends StatelessWidget {
  const _GuardPill({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final staff = staffByName(name);
    if (staff == null) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.navySurface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.textSecondary.withValues(alpha: 0.35)),
        ),
        child: Text(
          name,
          style: TextStyle(
            color: AppColors.textSecondary.withValues(alpha: 0.85),
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
        ),
      );
    }

    return Material(
      color: AppColors.gold,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute<void>(
              builder: (_) => StaffDetailScreen(slug: staff.slug),
            ),
          );
        },
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(
            name,
            style: const TextStyle(
              color: Colors.black87,
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }
}
