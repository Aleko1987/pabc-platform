import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/widgets/pabc_card.dart';

class IncidentsScreen extends StatelessWidget {
  const IncidentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Incidents')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          PabcCard(
            title: 'Report',
            child: Text(
              'TODO: Create incidents row + optional Storage upload for media; notify supervisors via Realtime.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
