/// Shared month grid helpers — mirrors `admin-web/src/utils/monthCalendar.ts`.

const List<String> kWeekdays = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

List<int?> calendarGrid(int year, int monthIndex) {
  final first = DateTime(year, monthIndex + 1, 1);
  final startPad = first.weekday % 7;
  final daysInMonth = DateTime(year, monthIndex + 2, 0).day;
  final cells = <int?>[];
  for (var i = 0; i < startPad; i++) {
    cells.add(null);
  }
  for (var d = 1; d <= daysInMonth; d++) {
    cells.add(d);
  }
  while (cells.length % 7 != 0) {
    cells.add(null);
  }
  return cells;
}

String monthTitle(int year, int monthIndex) {
  final d = DateTime(year, monthIndex + 1, 1);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return '${months[monthIndex]} $year';
}
