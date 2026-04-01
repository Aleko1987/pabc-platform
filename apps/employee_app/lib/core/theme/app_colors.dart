import 'package:flutter/material.dart';

/// Brand-aligned palette (navy, gold, light blue accents).
/// TODO: Align exact hex values with marketing once design tokens are finalized.
abstract final class AppColors {
  static const Color navy = Color(0xFF0A1628);
  static const Color navySurface = Color(0xFF111E33);
  static const Color spotlightBlue = Color(0xFF3D5A80);
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldMuted = Color(0xFFC9A227);
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFB8C5D6);
  static const Color danger = Color(0xFFE57373);
  static const Color success = Color(0xFF81C784);
}
