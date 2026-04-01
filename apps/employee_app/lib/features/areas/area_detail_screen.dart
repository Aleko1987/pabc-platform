import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../data/customers_data.dart';
import '../customers/customer_detail_screen.dart';

/// Lists stores (customers) in an area — mirrors admin `AreaPage`.
class AreaDetailScreen extends StatelessWidget {
  const AreaDetailScreen({
    super.key,
    required this.slug,
    required this.label,
  });

  final String slug;
  final String label;

  @override
  Widget build(BuildContext context) {
    final stores = customersByAreaSlug(slug);

    return Scaffold(
      backgroundColor: AppColors.navy,
      appBar: AppBar(
        backgroundColor: AppColors.navySurface,
        foregroundColor: AppColors.textPrimary,
        title: Text(label),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        children: [
          Text(
            'Stores and sites in this area (mock).',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.45,
                ),
          ),
          const SizedBox(height: 20),
          Text(
            'STORES',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.14,
                ),
          ),
          const SizedBox(height: 12),
          if (stores.isEmpty)
            Text(
              'No stores in this area yet.',
              style: TextStyle(color: AppColors.textSecondary.withValues(alpha: 0.9)),
            )
          else
            for (final c in stores)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => CustomerDetailScreen(slug: c.slug),
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.spotlightBlue,
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      textStyle: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                        decoration: TextDecoration.underline,
                        decorationColor: AppColors.spotlightBlue,
                      ),
                    ),
                    child: Text(c.name),
                  ),
                ),
              ),
        ],
      ),
    );
  }
}
