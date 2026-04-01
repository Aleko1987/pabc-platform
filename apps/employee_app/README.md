# PABC Employee App (Flutter)

Android-first operational client. Generate platform folders after clone if missing:

```bash
cd apps/employee_app
flutter create . --platforms=android
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

## Environment (compile-time)

Copy `dart_defines.example.json` to `dart_defines.json` (gitignored) or pass defines manually:

```bash
flutter run --dart-define-from-file=dart_defines.json
```

Leave `SUPABASE_URL` / `SUPABASE_ANON_KEY` empty until your Supabase project is ready; the app runs in **offline shell** mode without initializing the client.

## Codegen

Models use `freezed` + `json_serializable`. After editing annotated files:

```bash
dart run build_runner build --delete-conflicting-outputs
```
