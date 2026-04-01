/// Mock map coordinates — mirrors `staffFieldMap.ts`.

import 'dart:ui';

const Map<String, Offset> kStaffFieldPositions = {
  'thabo-mokoena': Offset(52, 44),
  'nomsa-khumalo': Offset(38, 58),
  'david-van-der-berg': Offset(68, 40),
  'lerato-maseko': Offset(48, 72),
  'pieter-botha': Offset(62, 55),
  'zanele-dlamini': Offset(45, 48),
  'kevin-naidoo': Offset(30, 35),
  'ayanda-ntuli': Offset(72, 62),
  'michelle-fourie': Offset(55, 28),
};

Offset fieldPositionForSlug(String slug) {
  return kStaffFieldPositions[slug] ?? const Offset(50, 50);
}
