# Models

Use `freezed` + `json_serializable` for API and database DTOs.

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'my_model.freezed.dart';
part 'my_model.g.dart';

@freezed
class MyModel with _$MyModel {
  const factory MyModel({required String id}) = _MyModel;

  factory MyModel.fromJson(Map<String, dynamic> json) => _$MyModelFromJson(json);
}
```

Run:

```bash
dart run build_runner build --delete-conflicting-outputs
```

`SessionUser` in `session_user.dart` is intentionally hand-written for the auth shell until DTOs land.
