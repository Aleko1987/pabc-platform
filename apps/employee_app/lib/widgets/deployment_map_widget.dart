import 'package:flutter/material.dart';

import '../data/staff_directory.dart';
import '../data/staff_field_positions.dart';

/// GTA-style circular deployment map (all dots or filtered).
class DeploymentMapWidget extends StatelessWidget {
  const DeploymentMapWidget({
    super.key,
    required this.allStaff,
    this.visibleSlugs,
    this.size = 200,
  });

  final List<StaffRecord> allStaff;
  final Set<String>? visibleSlugs;
  final double size;

  @override
  Widget build(BuildContext context) {
    final list = visibleSlugs == null
        ? allStaff
        : allStaff.where((s) => visibleSlugs!.contains(s.slug)).toList();

    return Semantics(
      label: 'Deployment map',
      child: SizedBox(
        width: size,
        height: size,
        child: CustomPaint(
          painter: _MapPainter(staff: list),
          child: Stack(
            alignment: Alignment.topCenter,
            children: [
              Positioned(
                top: 6,
                child: Text(
                  'N',
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
      ),
    );
  }
}

class _MapPainter extends CustomPainter {
  _MapPainter({required this.staff});

  final List<StaffRecord> staff;

  @override
  void paint(Canvas canvas, Size size) {
    final r = Rect.fromLTWH(0, 0, size.width, size.height);
    final cx = r.center.dx;
    final cy = r.center.dy;
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

    final dotPaint = Paint()
      ..color = const Color(0xFFD4AF37)
      ..style = PaintingStyle.fill;
    final stroke = Paint()
      ..color = const Color(0xFF0A0A0A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    for (final s in staff) {
      final p = fieldPositionForSlug(s.slug);
      final dx = p.dx / 100 * size.width;
      final dy = p.dy / 100 * size.height;
      canvas.drawCircle(Offset(dx, dy), 4, dotPaint);
      canvas.drawCircle(Offset(dx, dy), 4, stroke);
    }

    final border = Paint()
      ..color = const Color(0xFF0A0A0A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(Offset(cx, cy), radius, border);
  }

  @override
  bool shouldRepaint(covariant _MapPainter oldDelegate) =>
      oldDelegate.staff != staff;
}
