/// Authenticated user snapshot for routing and UI.
///
/// Phase 1: add `@freezed` + codegen for API DTOs; this type stays lean.
final class SessionUser {
  const SessionUser({required this.id, this.email});

  final String id;
  final String? email;
}
