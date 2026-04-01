import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:pabc_employee_app/app/app.dart';

void main() {
  testWidgets('App builds', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: PabcEmployeeApp()));
    await tester.pump();
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
