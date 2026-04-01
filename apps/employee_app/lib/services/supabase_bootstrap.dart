import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/config/app_config.dart';
import '../models/session_user.dart';

/// Initializes Supabase only when URL and anon key are provided.
abstract final class SupabaseBootstrap {
  static var _initialized = false;

  static bool get isReady => _initialized;

  static Future<void> init() async {
    if (!AppConfig.hasSupabaseConfig) {
      return;
    }
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      anonKey: AppConfig.supabaseAnonKey,
    );
    _initialized = true;
  }

  static SupabaseClient? get clientOrNull =>
      _initialized ? Supabase.instance.client : null;

  static SessionUser? mapUser(User? user) {
    if (user == null) return null;
    return SessionUser(id: user.id, email: user.email);
  }

  /// Current user plus subsequent auth changes.
  static Stream<SessionUser?> authStateChanges() {
    final client = clientOrNull;
    if (client == null) {
      return const Stream<SessionUser?>.empty();
    }
    return Stream.multi((controller) {
      controller.add(mapUser(client.auth.currentUser));
      final sub = client.auth.onAuthStateChange.listen(
        (event) => controller.add(mapUser(event.session?.user)),
        onError: controller.addError,
        onDone: controller.close,
      );
      controller.onCancel = () => sub.cancel();
    });
  }
}
