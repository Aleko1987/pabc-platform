import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/attendance/attendance_screen.dart';
import '../features/auth/auth_screen.dart';
import '../features/home/home_screen.dart';
import '../features/incidents/incidents_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/schedule/my_schedule_screen.dart';
import '../providers/auth_session_provider.dart';
import '../services/supabase_bootstrap.dart';
import '../shared/widgets/app_shell_scaffold.dart';
import 'go_router_refresh.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

final appRouterProvider = Provider<GoRouter>((ref) {
  final refresh = GoRouterRefreshStream(
    SupabaseBootstrap.isReady
        ? SupabaseBootstrap.authStateChanges()
        : const Stream<dynamic>.empty(),
  );
  ref.onDispose(refresh.dispose);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppShellRoute.home.path,
    refreshListenable: refresh,
    redirect: (context, state) {
      if (!SupabaseBootstrap.isReady) {
        return null;
      }
      final session = ref.read(authSessionProvider);
      final loggingIn = state.matchedLocation == AuthScreen.routePath;

      return session.when(
        data: (user) {
          final loggedIn = user != null;
          if (!loggedIn && !loggingIn) return AuthScreen.routePath;
          if (loggedIn && loggingIn) return AppShellRoute.home.path;
          return null;
        },
        loading: () => null,
        error: (_, __) => AuthScreen.routePath,
      );
    },
    routes: [
      GoRoute(
        path: AuthScreen.routePath,
        builder: (context, state) => const AuthScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            AppShellScaffold(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppShellRoute.home.path,
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: HomeScreen()),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppShellRoute.schedule.path,
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: MyScheduleScreen()),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppShellRoute.attendance.path,
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: AttendanceScreen()),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppShellRoute.incidents.path,
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: IncidentsScreen()),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppShellRoute.profile.path,
                pageBuilder: (context, state) =>
                    const NoTransitionPage<void>(child: ProfileScreen()),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

enum AppShellRoute {
  home('/home'),
  schedule('/schedule'),
  attendance('/attendance'),
  incidents('/incidents'),
  profile('/profile');

  const AppShellRoute(this.path);
  final String path;
}
