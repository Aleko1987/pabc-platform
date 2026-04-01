import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../features/auth/auth_screen.dart';
import '../../features/roster/org_roster_screen.dart';
import '../../providers/auth_session_provider.dart';
import '../../routing/app_router.dart';
import '../../services/supabase_bootstrap.dart';
import '../../shared/widgets/pabc_card.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(authSessionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          PabcCard(
            title: 'Roster & schedule',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_month, color: AppColors.gold),
                  title: const Text('My schedule'),
                  subtitle: Text(
                    'Personal calendar & colleagues (demo: Nomsa Khumalo)',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  onTap: () => context.go(AppShellRoute.schedule.path),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.groups_outlined, color: AppColors.gold),
                  title: const Text('Team roster'),
                  subtitle: Text(
                    'Full deployment calendar & map',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const OrgRosterScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          PabcCard(
            title: 'Account',
            child: session.when(
              data: (user) {
                if (user == null) {
                  return Text(
                    AppConfig.hasSupabaseConfig
                        ? 'Not signed in.'
                        : 'Supabase not configured — local shell only.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  );
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('User ID: ${user.id}'),
                    if (user.email != null) Text('Email: ${user.email}'),
                  ],
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('Error: $e'),
            ),
          ),
          const SizedBox(height: 16),
          if (SupabaseBootstrap.clientOrNull != null)
            FilledButton.tonal(
              onPressed: () async {
                await SupabaseBootstrap.clientOrNull!.auth.signOut();
                if (context.mounted) context.go(AuthScreen.routePath);
              },
              child: const Text('Sign out'),
            ),
        ],
      ),
    );
  }
}
