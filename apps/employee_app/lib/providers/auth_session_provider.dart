import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/session_user.dart';
import '../services/supabase_bootstrap.dart';

final authSessionProvider = StreamProvider<SessionUser?>((ref) {
  if (!SupabaseBootstrap.isReady) {
    return Stream.value(null);
  }
  return SupabaseBootstrap.authStateChanges();
});
