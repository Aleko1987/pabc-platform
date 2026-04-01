import '../models/session_user.dart';

/// Reads/writes [attendance_events] through Supabase with org-scoped RLS.
///
/// TODO: Implement after profiles + employee linkage are enforced in Phase 1.
abstract class AttendanceRepository {
  Future<void> recordClockEvent({
    required SessionUser user,
    required String siteId,
    required String eventType,
  });
}
