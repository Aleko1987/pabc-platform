import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

const int kShiftTotalMin = 8 * 60;

const List<String> kTimelineRulerLabels = [
  '08:00',
  '10:00',
  '12:00',
  '14:00',
  '16:00',
  '18:00',
];

/// Master library + multi-track lanes — mirrors admin staff timeline.
class TaskTemplate {
  const TaskTemplate({
    required this.id,
    required this.label,
    required this.durationMin,
    required this.color,
  });

  final String id;
  final String label;
  final int durationMin;
  final Color color;
}

const List<TaskTemplate> kTaskLibrary = [
  TaskTemplate(
    id: 'patrol',
    label: 'Patrol perimeter',
    durationMin: 60,
    color: Color(0xE63D5A80),
  ),
  TaskTemplate(
    id: 'gate',
    label: 'Gate check',
    durationMin: 30,
    color: Color(0x73D4AF37),
  ),
  TaskTemplate(
    id: 'incident',
    label: 'Incident report',
    durationMin: 45,
    color: Color(0x8CE57373),
  ),
  TaskTemplate(
    id: 'handover',
    label: 'Shift handover',
    durationMin: 20,
    color: Color(0x7381C784),
  ),
  TaskTemplate(
    id: 'cctv',
    label: 'CCTV review',
    durationMin: 40,
    color: Color(0x8064B5F6),
  ),
  TaskTemplate(
    id: 'access',
    label: 'Access audit',
    durationMin: 35,
    color: Color(0x80BA68C8),
  ),
];

class PlacedTask {
  PlacedTask({
    required this.placedId,
    required this.templateId,
    required this.label,
    required this.startMin,
    required this.durationMin,
    required this.color,
    required this.trackIndex,
  });

  final String placedId;
  final String templateId;
  final String label;
  final int startMin;
  final int durationMin;
  final Color color;
  final int trackIndex;
}

class StaffTimelineWorkspace extends StatelessWidget {
  const StaffTimelineWorkspace({
    super.key,
    required this.placedTasks,
    required this.trackCount,
    required this.dragOverTrack,
    required this.playheadPct,
    required this.onDropTemplate,
    required this.onRemovePlaced,
    required this.onDragHoverTrack,
    required this.onDragLeaveLane,
    required this.onAddChannel,
  });

  final List<PlacedTask> placedTasks;
  final int trackCount;
  final int? dragOverTrack;
  final double? playheadPct;
  final void Function(TaskTemplate template, int trackIndex, double dropXPct) onDropTemplate;
  final void Function(String placedId) onRemovePlaced;
  final void Function(int? trackIndex) onDragHoverTrack;
  final VoidCallback onDragLeaveLane;
  final VoidCallback onAddChannel;

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 760;
    final library = _MasterLibrary();
    final panel = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'Multi-track shift · 08:00–18:00',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
            TextButton(
              onPressed: trackCount < 12 ? onAddChannel : null,
              child: const Text('+ Add channel'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        _TimelinePanel(
          placedTasks: placedTasks,
          trackCount: trackCount,
          dragOverTrack: dragOverTrack,
          playheadPct: playheadPct,
          onDropTemplate: onDropTemplate,
          onRemovePlaced: onRemovePlaced,
          onDragHoverTrack: onDragHoverTrack,
          onDragLeaveLane: onDragLeaveLane,
        ),
      ],
    );

    if (wide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 2, child: library),
          const SizedBox(width: 12),
          Expanded(flex: 3, child: panel),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        library,
        const SizedBox(height: 20),
        panel,
      ],
    );
  }
}

class _MasterLibrary extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Master library',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: AppColors.gold,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.06,
              ),
        ),
        const SizedBox(height: 6),
        Text(
          'Drag tasks onto a channel (row). Same row = sequence along the day; '
          'different rows = simultaneous work — like video tracks.',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
                height: 1.35,
              ),
        ),
        const SizedBox(height: 10),
        for (final t in kTaskLibrary)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Draggable<TaskTemplate>(
              data: t,
              feedback: Material(
                elevation: 4,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: t.color,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  constraints: const BoxConstraints(minWidth: 160),
                  child: Text(
                    t.label,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
              childWhenDragging: Opacity(
                opacity: 0.35,
                child: _LibraryChip(template: t),
              ),
              child: _LibraryChip(template: t),
            ),
          ),
      ],
    );
  }
}

class _LibraryChip extends StatelessWidget {
  const _LibraryChip({required this.template});

  final TaskTemplate template;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: template.color,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              template.label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
          Text(
            '${template.durationMin} min',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _TimelinePanel extends StatelessWidget {
  const _TimelinePanel({
    required this.placedTasks,
    required this.trackCount,
    required this.dragOverTrack,
    required this.playheadPct,
    required this.onDropTemplate,
    required this.onRemovePlaced,
    required this.onDragHoverTrack,
    required this.onDragLeaveLane,
  });

  final List<PlacedTask> placedTasks;
  final int trackCount;
  final int? dragOverTrack;
  final double? playheadPct;
  final void Function(TaskTemplate template, int trackIndex, double dropXPct) onDropTemplate;
  final void Function(String placedId) onRemovePlaced;
  final void Function(int? trackIndex) onDragHoverTrack;
  final VoidCallback onDragLeaveLane;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _RulerRow(playheadPct: playheadPct),
        const SizedBox(height: 4),
        for (var trackIndex = 0; trackIndex < trackCount; trackIndex++)
          _TrackRow(
            trackIndex: trackIndex,
            rowTasks: placedTasks.where((p) => p.trackIndex == trackIndex).toList(),
            dragOver: dragOverTrack == trackIndex,
            onDropTemplate: onDropTemplate,
            onRemovePlaced: onRemovePlaced,
            onDragHoverTrack: onDragHoverTrack,
            onDragLeaveLane: onDragLeaveLane,
          ),
      ],
    );
  }
}

class _RulerRow extends StatelessWidget {
  const _RulerRow({required this.playheadPct});

  final double? playheadPct;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 40,
          child: Text(
            '',
            style: TextStyle(color: AppColors.textSecondary.withValues(alpha: 0.5), fontSize: 10),
          ),
        ),
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              return Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    height: 28,
                    decoration: BoxDecoration(
                      color: AppColors.navySurface.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: AppColors.spotlightBlue.withValues(alpha: 0.25)),
                    ),
                    child: Row(
                      children: [
                        for (var i = 0; i < kTimelineRulerLabels.length; i++)
                          Expanded(
                            child: Center(
                              child: Text(
                                kTimelineRulerLabels[i],
                                style: const TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.spotlightBlue,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (playheadPct != null)
                    Positioned(
                      left: (playheadPct! / 100) * constraints.maxWidth - 1,
                      top: 0,
                      bottom: 0,
                      child: Container(
                        width: 2,
                        color: AppColors.gold.withValues(alpha: 0.95),
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}

class _TrackRow extends StatelessWidget {
  const _TrackRow({
    required this.trackIndex,
    required this.rowTasks,
    required this.dragOver,
    required this.onDropTemplate,
    required this.onRemovePlaced,
    required this.onDragHoverTrack,
    required this.onDragLeaveLane,
  });

  final int trackIndex;
  final List<PlacedTask> rowTasks;
  final bool dragOver;
  final void Function(TaskTemplate template, int trackIndex, double dropXPct) onDropTemplate;
  final void Function(String placedId) onRemovePlaced;
  final void Function(int? trackIndex) onDragHoverTrack;
  final VoidCallback onDragLeaveLane;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 40,
            child: Align(
              alignment: Alignment.topCenter,
              child: Text(
                'T${trackIndex + 1}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.spotlightBlue,
                ),
              ),
            ),
          ),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final w = constraints.maxWidth;
                return DragTarget<TaskTemplate>(
                  onWillAcceptWithDetails: (_) {
                    onDragHoverTrack(trackIndex);
                    return true;
                  },
                  onLeave: (_) => onDragLeaveLane(),
                  onAcceptWithDetails: (details) {
                    onDragLeaveLane();
                    final ro = context.findRenderObject();
                    if (ro is! RenderBox || !ro.hasSize) return;
                    final local = ro.globalToLocal(details.offset);
                    final pct = (local.dx / ro.size.width).clamp(0.0, 1.0);
                    onDropTemplate(details.data, trackIndex, pct);
                  },
                  builder: (context, candidate, rejected) {
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 120),
                      height: 56,
                      decoration: BoxDecoration(
                        color: dragOver || candidate.isNotEmpty
                            ? AppColors.gold.withValues(alpha: 0.08)
                            : AppColors.navySurface.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: dragOver || candidate.isNotEmpty
                              ? AppColors.gold.withValues(alpha: 0.45)
                              : AppColors.spotlightBlue.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Stack(
                        clipBehavior: Clip.hardEdge,
                        children: [
                          if (rowTasks.isEmpty)
                            Center(
                              child: Text(
                                'Drop tasks here · channel ${trackIndex + 1}',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppColors.textSecondary.withValues(alpha: 0.65),
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ),
                          for (final p in rowTasks)
                            Positioned(
                              left: (p.startMin / kShiftTotalMin) * w,
                              width: (p.durationMin / kShiftTotalMin) * w,
                              top: 4,
                              bottom: 4,
                              child: _PlacedBlock(
                                task: p,
                                onRemove: () => onRemovePlaced(p.placedId),
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PlacedBlock extends StatelessWidget {
  const _PlacedBlock({
    required this.task,
    required this.onRemove,
  });

  final PlacedTask task;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: task.color,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
        child: Row(
          children: [
            Expanded(
              child: Text(
                task.label,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            InkWell(
              onTap: onRemove,
              child: Padding(
                padding: const EdgeInsets.only(left: 2),
                child: Text(
                  '×',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.95),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
