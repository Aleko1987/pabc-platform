import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../data/staff_directory.dart';
import '../../widgets/staff_field_mini_map.dart';
import '../schedule/my_schedule_screen.dart';
import 'staff_timeline_workspace.dart';

/// Full officer sheet — mirrors admin `StaffDetailPage`.
class StaffDetailScreen extends StatefulWidget {
  const StaffDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  State<StaffDetailScreen> createState() => _StaffDetailScreenState();
}

class _StaffDetailScreenState extends State<StaffDetailScreen> {
  Timer? _timer;
  bool _clockedIn = false;
  DateTime? _clockInAt;
  final List<PlacedTask> _placedTasks = [];
  int _trackCount = 4;
  int? _dragOverTrack;
  String? _cameraNotice;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  StaffRecord? get _staff => staffBySlug(widget.slug);

  DateTime get _shiftEnd {
    final now = DateTime.now();
    var end = DateTime(now.year, now.month, now.day, 18, 0);
    if (!end.isAfter(now)) {
      end = end.add(const Duration(days: 1));
    }
    return end;
  }

  DateTime get _shiftStart {
    final e = _shiftEnd;
    return DateTime(e.year, e.month, e.day, 8, 0);
  }

  double _shiftProgress01() {
    final now = DateTime.now();
    final start = _shiftStart;
    final end = _shiftEnd;
    final total = end.difference(start).inMilliseconds;
    if (total <= 0) return 0;
    final elapsed = now.difference(start).inMilliseconds;
    return (elapsed / total).clamp(0.0, 1.0);
  }

  double? _playheadPct() {
    final now = DateTime.now();
    final start = _shiftStart;
    final end = _shiftEnd;
    if (now.isBefore(start) || !now.isBefore(end)) return null;
    final elapsedMin = now.difference(start).inMinutes;
    return (elapsedMin / kShiftTotalMin) * 100;
  }

  String _formatCountdown(Duration d) {
    if (d.isNegative) return '00:00:00';
    final h = d.inHours;
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return '${h.toString().padLeft(2, '0')}:'
        '${m.toString().padLeft(2, '0')}:'
        '${s.toString().padLeft(2, '0')}';
  }

  void _onDropTemplate(TaskTemplate t, int trackIndex, double dropXPct) {
    var startMin = (dropXPct * kShiftTotalMin).floor();
    final dur = t.durationMin;
    if (startMin + dur > kShiftTotalMin) {
      startMin = math.max(0, kShiftTotalMin - dur);
    }
    final id =
        'placed-${DateTime.now().microsecondsSinceEpoch}-${math.Random().nextInt(99999)}';
    setState(() {
      _placedTasks.add(
        PlacedTask(
          placedId: id,
          templateId: t.id,
          label: t.label,
          startMin: startMin,
          durationMin: dur,
          color: t.color,
          trackIndex: trackIndex,
        ),
      );
    });
  }

  void _removePlaced(String id) {
    setState(() {
      _placedTasks.removeWhere((p) => p.placedId == id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final staff = _staff;
    if (staff == null) {
      return Scaffold(
        backgroundColor: AppColors.navy,
        appBar: AppBar(
          backgroundColor: AppColors.navySurface,
          foregroundColor: AppColors.textPrimary,
          title: const Text('Officer'),
        ),
        body: Center(
          child: Text(
            'No officer found for “${widget.slug}”.',
            style: TextStyle(color: AppColors.textSecondary.withValues(alpha: 0.95)),
          ),
        ),
      );
    }

    final nameParts = staff.name.trim().split(RegExp(r'\s+'));
    final firstName = nameParts.isNotEmpty ? nameParts.first : staff.name;
    final now = DateTime.now();
    final msToShiftEnd = _shiftEnd.difference(now);
    final shiftProgress01 = _shiftProgress01();

    return Scaffold(
      backgroundColor: AppColors.navy,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: AppColors.navySurface,
            foregroundColor: AppColors.textPrimary,
            title: Text(staff.name),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('← Dashboard'),
                  ),
                ),
                Text(
                  'Role — ${staff.role}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                if (staff.phone != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Comms — ${staff.phone}',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: AppColors.textPrimary,
                        ),
                  ),
                ],
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => MyScheduleScreen(staffSlug: staff.slug),
                          ),
                        );
                      },
                      child: const Text('View schedule'),
                    ),
                    FilledButton(
                      onPressed: () {
                        setState(() {
                          _cameraNotice =
                              'Live room feed is not connected yet (staff: ${staff.slug}). '
                              'Next: map this officer to a site/room, then open the CCTV stream for that camera.';
                        });
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: Colors.black87,
                      ),
                      child: Text('View $firstName'),
                    ),
                  ],
                ),
                if (_cameraNotice != null) ...[
                  const SizedBox(height: 12),
                  Material(
                    color: AppColors.navySurface.withValues(alpha: 0.95),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              _cameraNotice!,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textSecondary,
                                    height: 1.35,
                                  ),
                            ),
                          ),
                          IconButton(
                            onPressed: () => setState(() => _cameraNotice = null),
                            icon: const Icon(Icons.close, size: 20),
                            color: AppColors.textSecondary,
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                LayoutBuilder(
                  builder: (context, c) {
                    final narrow = c.maxWidth < 520;
                    final cards = [
                      _ClockCard(
                        clockedIn: _clockedIn,
                        clockInAt: _clockInAt,
                        onToggle: () {
                          setState(() {
                            if (_clockedIn) {
                              _clockedIn = false;
                              _clockInAt = null;
                            } else {
                              _clockedIn = true;
                              _clockInAt = DateTime.now();
                            }
                          });
                        },
                      ),
                      _CountdownCard(
                        label: _formatCountdown(msToShiftEnd),
                        shiftEnd: _shiftEnd,
                      ),
                      _FieldCard(
                        staff: staff,
                        shiftProgress01: shiftProgress01,
                        onOpenStaff: (slug) {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => StaffDetailScreen(slug: slug),
                            ),
                          );
                        },
                      ),
                    ];
                    if (narrow) {
                      return Column(
                        children: [
                          for (var i = 0; i < cards.length; i++) ...[
                            if (i > 0) const SizedBox(height: 12),
                            cards[i],
                          ],
                        ],
                      );
                    }
                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(child: cards[0]),
                        const SizedBox(width: 10),
                        Expanded(child: cards[1]),
                        const SizedBox(width: 10),
                        Expanded(child: cards[2]),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 24),
                StaffTimelineWorkspace(
                  placedTasks: _placedTasks,
                  trackCount: _trackCount,
                  dragOverTrack: _dragOverTrack,
                  playheadPct: _playheadPct(),
                  onDropTemplate: _onDropTemplate,
                  onRemovePlaced: _removePlaced,
                  onDragHoverTrack: (t) => setState(() => _dragOverTrack = t),
                  onDragLeaveLane: () => setState(() => _dragOverTrack = null),
                  onAddChannel: () {
                    setState(() {
                      if (_trackCount < 12) _trackCount++;
                    });
                  },
                ),
                const SizedBox(height: 20),
                Text(
                  'HR records and live sync will connect to Supabase later. '
                  'Channels are in-memory until refresh (max 12).',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary.withValues(alpha: 0.85),
                        height: 1.4,
                      ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _ClockCard extends StatelessWidget {
  const _ClockCard({
    required this.clockedIn,
    required this.clockInAt,
    required this.onToggle,
  });

  final bool clockedIn;
  final DateTime? clockInAt;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return _SheetCard(
      title: 'Clock in',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          OutlinedButton(
            onPressed: onToggle,
            style: OutlinedButton.styleFrom(
              foregroundColor: clockedIn ? AppColors.gold : AppColors.textPrimary,
              side: BorderSide(
                color: clockedIn ? AppColors.gold : AppColors.spotlightBlue,
                width: clockedIn ? 2 : 1,
              ),
            ),
            child: Text(clockedIn ? 'Clock out' : 'Clock in'),
          ),
          const SizedBox(height: 8),
          Text(
            clockedIn && clockInAt != null
                ? 'Clocked in at ${_fmtTime(clockInAt!)}'
                : 'Not clocked in',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }

  String _fmtTime(DateTime d) {
    final h = d.hour.toString().padLeft(2, '0');
    final m = d.minute.toString().padLeft(2, '0');
    final s = d.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }
}

class _CountdownCard extends StatelessWidget {
  const _CountdownCard({
    required this.label,
    required this.shiftEnd,
  });

  final String label;
  final DateTime shiftEnd;

  @override
  Widget build(BuildContext context) {
    return _SheetCard(
      title: 'Shift ends',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            label,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            _targetLine(shiftEnd),
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      ),
    );
  }

  static const _wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  String _targetLine(DateTime t) {
    final w = _wd[t.weekday - 1];
    var h = t.hour;
    final m = t.minute.toString().padLeft(2, '0');
    final am = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h == 0) h = 12;
    return 'Target $w $h:$m $am';
  }
}

class _FieldCard extends StatelessWidget {
  const _FieldCard({
    required this.staff,
    required this.shiftProgress01,
    required this.onOpenStaff,
  });

  final StaffRecord staff;
  final double shiftProgress01;
  final void Function(String slug) onOpenStaff;

  @override
  Widget build(BuildContext context) {
    return _SheetCard(
      title: 'Field view',
      child: Column(
        children: [
          StaffFieldMiniMap(
            current: staff,
            allStaff: kStaffRecords,
            shiftProgress01: shiftProgress01,
            onOpenStaff: onOpenStaff,
            size: 160,
          ),
          const SizedBox(height: 8),
          Text(
            'You at centre · gold dots = team · tap dot to open',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 11,
                  height: 1.3,
                ),
          ),
        ],
      ),
    );
  }
}

class _SheetCard extends StatelessWidget {
  const _SheetCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.navySurface.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.spotlightBlue.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.08,
                ),
          ),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}
