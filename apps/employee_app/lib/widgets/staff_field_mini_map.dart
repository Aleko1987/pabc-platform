import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../data/staff_directory.dart';
import '../data/staff_field_positions.dart';

const double _kMapScale = 2.4;

/// Field view with “you” at centre and team dots — mirrors admin `StaffFieldMiniMap`.
class StaffFieldMiniMap extends StatelessWidget {
  const StaffFieldMiniMap({
    super.key,
    required this.current,
    required this.allStaff,
    required this.shiftProgress01,
    required this.onOpenStaff,
    this.size = 200,
  });

  final StaffRecord current;
  final List<StaffRecord> allStaff;
  final double shiftProgress01;
  final void Function(String slug) onOpenStaff;
  final double size;

  @override
  Widget build(BuildContext context) {
    final origin = fieldPositionForSlug(current.slug);
    final others = allStaff.where((s) => s.slug != current.slug).toList();

    final dots = <_Dot>[];
    for (final s in others) {
      final p = fieldPositionForSlug(s.slug);
      final dx = (p.dx - origin.dx) * _kMapScale;
      final dy = (p.dy - origin.dy) * _kMapScale;
      final x = (50 + dx).clamp(10.0, 90.0);
      final y = (50 + dy).clamp(10.0, 90.0);
      dots.add(_Dot(slug: s.slug, x: x, y: y));
    }

    return Semantics(
      label: 'Field map — you at centre, tap a dot for another officer',
      child: SizedBox(
        width: size,
        height: size,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            CustomPaint(
              size: Size(size, size),
              painter: _MiniMapPainter(
                dots: dots,
                shiftProgress01: shiftProgress01,
                lineToFirst: dots.isNotEmpty,
              ),
            ),
            for (final d in dots)
              Positioned(
                left: d.x / 100 * size - 18,
                top: d.y / 100 * size - 18,
                width: 36,
                height: 36,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => onOpenStaff(d.slug),
                    customBorder: const CircleBorder(),
                    child: const SizedBox.expand(),
                  ),
                ),
              ),
            Positioned(
              top: 4,
              left: 0,
              right: 0,
              child: Text(
                'N',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: Colors.white.withValues(alpha: 0.55),
                  shadows: const [
                    Shadow(offset: Offset(0, 1), blurRadius: 2, color: Colors.black),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Dot {
  const _Dot({required this.slug, required this.x, required this.y});

  final String slug;
  final double x;
  final double y;
}

class _MiniMapPainter extends CustomPainter {
  _MiniMapPainter({
    required this.dots,
    required this.shiftProgress01,
    required this.lineToFirst,
  });

  final List<_Dot> dots;
  final double shiftProgress01;
  final bool lineToFirst;

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final radius = size.width / 2 - 3;

    final bg = Paint()..color = const Color(0xFF2E3238);
    canvas.drawCircle(Offset(cx, cy), radius, bg);

    final water = Path()
      ..moveTo(size.width * 0.08, size.height * 0.78)
      ..quadraticBezierTo(
        size.width * 0.22,
        size.height * 0.68,
        size.width * 0.18,
        size.height * 0.52,
      )
      ..quadraticBezierTo(
        size.width * 0.14,
        size.height * 0.38,
        size.width * 0.28,
        size.height * 0.30,
      )
      ..lineTo(size.width * 0.38, size.height * 0.28)
      ..quadraticBezierTo(
        size.width * 0.52,
        size.height * 0.26,
        size.width * 0.58,
        size.height * 0.38,
      )
      ..lineTo(size.width * 0.62, size.height * 0.52)
      ..quadraticBezierTo(
        size.width * 0.58,
        size.height * 0.66,
        size.width * 0.42,
        size.height * 0.72,
      )
      ..quadraticBezierTo(
        size.width * 0.26,
        size.height * 0.80,
        size.width * 0.08,
        size.height * 0.78,
      )
      ..close();
    final waterPaint = Paint()
      ..color = const Color(0xFF64B5F6).withValues(alpha: 0.35)
      ..style = PaintingStyle.fill;
    canvas.drawPath(water, waterPaint);

    final gridPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.12)
      ..strokeWidth = 0.5;
    for (var i = 1; i < 5; i++) {
      final y = size.height * (0.12 + i * 0.16);
      canvas.drawLine(Offset(size.width * 0.12, y), Offset(size.width * 0.88, y), gridPaint);
    }
    for (var i = 1; i < 5; i++) {
      final x = size.width * (0.28 + i * 0.16);
      canvas.drawLine(Offset(x, size.height * 0.12), Offset(x, size.height * 0.88), gridPaint);
    }

    if (lineToFirst && dots.isNotEmpty) {
      final d = dots.first;
      final dx = d.x / 100 * size.width;
      final dy = d.y / 100 * size.height;
      final line = Paint()
        ..color = const Color(0xFF4CAF50).withValues(alpha: 0.5)
        ..strokeWidth = 1.2
        ..style = PaintingStyle.stroke;
      final dashPath = Path()
        ..moveTo(cx, cy)
        ..lineTo(dx, dy);
      canvas.drawPath(dashPath, line);
    }

    final dotPaint = Paint()
      ..color = const Color(0xFFD4AF37)
      ..style = PaintingStyle.fill;
    final stroke = Paint()
      ..color = const Color(0xFF0A0A0A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    for (final d in dots) {
      final dx = d.x / 100 * size.width;
      final dy = d.y / 100 * size.height;
      canvas.drawCircle(Offset(dx, dy), 4.2, dotPaint);
      canvas.drawCircle(Offset(dx, dy), 4.2, stroke);
    }

    final player = Path()
      ..moveTo(cx, cy - size.height * 0.045)
      ..lineTo(cx + size.width * 0.034, cy + size.height * 0.045)
      ..lineTo(cx - size.width * 0.034, cy + size.height * 0.045)
      ..close();
    final playerPaint = Paint()
      ..color = const Color(0xFFF2F2F2)
      ..style = PaintingStyle.fill;
    final playerStroke = Paint()
      ..color = const Color(0xFF0B0B0B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.4;
    canvas.drawPath(player, playerPaint);
    canvas.drawPath(player, playerStroke);

    final ringPaint = Paint()
      ..color = const Color(0xFF4CAF50).withValues(alpha: 0.65)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    final sweep = (shiftProgress01.clamp(0.0, 1.0)) * 1.5 * math.pi;
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: radius - 2),
      -math.pi / 2,
      sweep,
      false,
      ringPaint,
    );

    final border = Paint()
      ..color = const Color(0xFF0A0A0A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(Offset(cx, cy), radius, border);
  }

  @override
  bool shouldRepaint(covariant _MiniMapPainter oldDelegate) => true;
}
