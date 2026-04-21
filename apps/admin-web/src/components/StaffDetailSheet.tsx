import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getStaffBySlug } from "../data/staffDirectory";
import "../styles/staff-sheet.css";

/** 12-hour shift window for timeline (minutes). */
const SHIFT_TOTAL_MIN = 12 * 60;
const TRACK_TOTAL = 4;
const SCHEDULE_DND_MIME = "application/x-pabc-schedule-item";

type ShiftMode = "day" | "night";

type TaskTemplate = {
  id: string;
  label: string;
  durationMin: number;
  color: string;
};

const TASK_LIBRARY: TaskTemplate[] = [
  { id: "patrol", label: "Patrol perimeter", durationMin: 60, color: "rgba(61, 90, 128, 0.95)" },
  { id: "gate", label: "Gate check", durationMin: 30, color: "rgba(212, 175, 55, 0.45)" },
  { id: "incident", label: "Incident report", durationMin: 45, color: "rgba(229, 115, 115, 0.55)" },
  { id: "handover", label: "Shift handover", durationMin: 20, color: "rgba(129, 199, 132, 0.45)" },
  { id: "cctv", label: "CCTV review", durationMin: 40, color: "rgba(100, 181, 246, 0.5)" },
  { id: "access", label: "Access audit", durationMin: 35, color: "rgba(186, 104, 200, 0.5)" },
];

type PlacedTask = {
  placedId: string;
  templateId: string;
  label: string;
  startMin: number;
  durationMin: number;
  color: string;
  /** Row / channel index (0 = top). Simultaneous tasks use different tracks. */
  trackIndex: number;
};

type StaffDetailSheetProps = {
  staffSlug: string;
  showBackLink?: boolean;
  onBack?: () => void;
  backLabel?: string;
  compact?: boolean;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

function useShiftBounds(mode: ShiftMode): { start: Date; end: Date } {
  return useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    if (mode === "day") {
      end.setHours(18, 0, 0, 0);
      if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 1);
      const start = new Date(end);
      start.setHours(6, 0, 0, 0);
      return { start, end };
    }

    end.setHours(6, 0, 0, 0);
    if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 1);
    const start = new Date(end);
    start.setHours(18, 0, 0, 0);
    start.setDate(start.getDate() - 1);
    return { start, end };
  }, [mode]);
}

function usePlayheadPercent(shiftStart: Date): number | null {
  const [pct, setPct] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const t0 = shiftStart.getTime();
      const elapsedMin = (now - t0) / 60_000;
      if (elapsedMin < 0 || elapsedMin > SHIFT_TOTAL_MIN) {
        setPct(null);
        return;
      }
      setPct((elapsedMin / SHIFT_TOTAL_MIN) * 100);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [shiftStart]);
  return pct;
}

export function StaffDetailSheet({
  staffSlug,
  showBackLink = false,
  onBack,
  backLabel = "← Dashboard",
  compact = false,
}: StaffDetailSheetProps) {
  const staff = getStaffBySlug(staffSlug);
  const [shiftMode, setShiftMode] = useState<ShiftMode>("day");

  const { start: shiftStart, end: shiftEnd } = useShiftBounds(shiftMode);
  const playheadPct = usePlayheadPercent(shiftStart);

  const [now, setNow] = useState(() => Date.now());
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInAt, setClockInAt] = useState<Date | null>(null);
  const [placedTasks, setPlacedTasks] = useState<PlacedTask[]>([]);
  const [dragOverTrack, setDragOverTrack] = useState<number | null>(null);
  const [dragOverGuardHourIndex, setDragOverGuardHourIndex] = useState<number | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);
  const [showCoordinationCalendar, setShowCoordinationCalendar] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const msToShiftEnd = shiftEnd.getTime() - now;

  const handleClockToggle = () => {
    if (clockedIn) {
      setClockedIn(false);
      setClockInAt(null);
    } else {
      setClockedIn(true);
      setClockInAt(new Date());
    }
  };

  const onDragStartLib = useCallback((e: React.DragEvent, t: TaskTemplate) => {
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        kind: "template",
        templateId: t.id,
        label: t.label,
        durationMin: t.durationMin,
        color: t.color,
      }),
    );
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const onDragOverLane = useCallback((e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setDragOverTrack(trackIndex);
  }, []);

  const onDragLeaveLane = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDragOverTrack(null);
  }, []);

  const onDropLane = useCallback((e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    setDragOverTrack(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    let payload: {
      kind: string;
      templateId: string;
      label: string;
      durationMin: number;
      color: string;
    };
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }
    if (payload.kind !== "template") return;

    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    let startMin = Math.floor(pct * SHIFT_TOTAL_MIN);
    const dur = payload.durationMin;
    if (startMin + dur > SHIFT_TOTAL_MIN) {
      startMin = Math.max(0, SHIFT_TOTAL_MIN - dur);
    }

    const placedId = `placed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setPlacedTasks((prev) => [
      ...prev,
      {
        placedId,
        templateId: payload.templateId,
        label: payload.label,
        startMin,
        durationMin: dur,
        color: payload.color,
        trackIndex,
      },
    ]);
  }, []);

  const onClickLane = useCallback(
    (e: React.MouseEvent, trackIndex: number) => {
      if (!selectedTemplateId) return;
      const t = TASK_LIBRARY.find((task) => task.id === selectedTemplateId);
      if (!t) return;

      const el = e.currentTarget as HTMLElement;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      let startMin = Math.floor(pct * SHIFT_TOTAL_MIN);
      const dur = t.durationMin;
      if (startMin + dur > SHIFT_TOTAL_MIN) {
        startMin = Math.max(0, SHIFT_TOTAL_MIN - dur);
      }

      const placedId = `placed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setPlacedTasks((prev) => [
        ...prev,
        {
          placedId,
          templateId: t.id,
          label: t.label,
          startMin,
          durationMin: dur,
          color: t.color,
          trackIndex,
        },
      ]);
      setSelectedTemplateId(null);
    },
    [selectedTemplateId],
  );

  const removePlaced = useCallback((placedId: string) => {
    setPlacedTasks((prev) => prev.filter((p) => p.placedId !== placedId));
  }, []);

  const sendStaffMessage = useCallback(() => {
    if (!staff) return;
    const body = window.prompt(`Message to ${staff.name}:`, "Team check-in: confirm site status by 18:00.");
    if (!body || !body.trim()) return;
    setBroadcastNotice(`Message sent to ${staff.name}.`);
  }, [staff]);

  const sendStaffVoice = useCallback(() => {
    if (!staff) return;
    const note = window.prompt(`Voice note label for ${staff.name}:`, "Shift handover briefing");
    if (!note || !note.trim()) return;
    setBroadcastNotice(`Voice note sent to ${staff.name}.`);
  }, [staff]);

  if (!staff) {
    return (
      <div className="page">
        <h1>Staff not found</h1>
        <p className="page-lead">No profile matches this link.</p>
        {onBack ? (
          <button type="button" className="text-link staff-sheet-back-btn" onClick={onBack}>
            {backLabel}
          </button>
        ) : (
          <Link to="/dashboard" className="text-link">
            ← Back to Dashboard
          </Link>
        )}
      </div>
    );
  }

  const rulerLabels = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(shiftStart);
      d.setHours(d.getHours() + i * 2);
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    });
  }, [shiftStart]);

  const tracks = Array.from({ length: TRACK_TOTAL }, (_, i) => i);
  const hourSlots = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => new Date(shiftStart.getTime() + i * 60 * 60 * 1000));
  }, [shiftStart]);
  const guardsPlanSlots = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const slot = new Date(shiftStart.getTime() + i * 60 * 60 * 1000);
      return slot.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    });
  }, [shiftStart]);
  const placedByHourIndex = useMemo(() => {
    const grouped = new Map<number, PlacedTask[]>();
    for (const task of placedTasks) {
      const hourIndex = Math.floor(task.startMin / 60);
      if (hourIndex < 0 || hourIndex > 12) continue;
      const list = grouped.get(hourIndex) ?? [];
      list.push(task);
      grouped.set(hourIndex, list);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.startMin - b.startMin);
    }
    return grouped;
  }, [placedTasks]);
  const t1PlacedByHourIndex = useMemo(() => {
    const grouped = new Map<number, PlacedTask[]>();
    for (const task of placedTasks) {
      if (task.trackIndex !== 0) continue;
      const hourIndex = Math.floor(task.startMin / 60);
      if (hourIndex < 0 || hourIndex > 12) continue;
      const list = grouped.get(hourIndex) ?? [];
      list.push(task);
      grouped.set(hourIndex, list);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.startMin - b.startMin);
    }
    return grouped;
  }, [placedTasks]);

  const placeTemplateSequential = useCallback(
    (templateId: string) => {
      const t = TASK_LIBRARY.find((task) => task.id === templateId);
      if (!t) return;

      setPlacedTasks((prev) => {
        for (let trackIndex = 0; trackIndex < TRACK_TOTAL; trackIndex += 1) {
          const rowTasks = prev
            .filter((p) => p.trackIndex === trackIndex)
            .sort((a, b) => a.startMin - b.startMin);
          let rowEnd = 0;
          for (const task of rowTasks) {
            if (task.startMin > rowEnd) break;
            rowEnd = Math.max(rowEnd, task.startMin + task.durationMin);
          }

          if (rowEnd + t.durationMin <= SHIFT_TOTAL_MIN) {
            const placedId = `placed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            return [
              ...prev,
              {
                placedId,
                templateId: t.id,
                label: t.label,
                startMin: rowEnd,
                durationMin: t.durationMin,
                color: t.color,
                trackIndex,
              },
            ];
          }
        }
        return prev;
      });
    },
    [],
  );

  const scheduleAtHour = useCallback(
    (hourIndex: number, durationMin: number, tasks: PlacedTask[]) => {
      const hourStart = hourIndex * 60;
      const rowTasks = tasks
        .filter((t) => t.trackIndex === 0 && t.startMin >= hourStart)
        .sort((a, b) => a.startMin - b.startMin);
      let startMin = hourStart;
      for (const t of rowTasks) {
        if (t.startMin > startMin) break;
        startMin = Math.max(startMin, t.startMin + t.durationMin);
      }
      if (startMin + durationMin > SHIFT_TOTAL_MIN) {
        return null;
      }
      return startMin;
    },
    [],
  );

  const onDropGuardHour = useCallback(
    (e: React.DragEvent, hourIndex: number) => {
      e.preventDefault();
      setDragOverGuardHourIndex(null);
      const raw = e.dataTransfer.getData(SCHEDULE_DND_MIME) || e.dataTransfer.getData("application/json");
      if (!raw) return;

      let payload: { kind: string; templateId?: string; placedId?: string; durationMin?: number };
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }

      if (payload.kind === "guards-entry" && payload.placedId) {
        setPlacedTasks((prev) => {
          const existing = prev.find((p) => p.placedId === payload.placedId);
          if (!existing) return prev;
          const nextStart = scheduleAtHour(hourIndex, existing.durationMin, prev.filter((p) => p.placedId !== payload.placedId));
          if (nextStart == null) return prev;
          return prev.map((p) =>
            p.placedId === payload.placedId ? { ...p, trackIndex: 0, startMin: nextStart } : p,
          );
        });
        return;
      }

      if (payload.kind === "template" && payload.templateId && typeof payload.durationMin === "number") {
        const t = TASK_LIBRARY.find((task) => task.id === payload.templateId);
        if (!t) return;
        setPlacedTasks((prev) => {
          const nextStart = scheduleAtHour(hourIndex, t.durationMin, prev);
          if (nextStart == null) return prev;
          const placedId = `placed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          return [
            ...prev,
            {
              placedId,
              templateId: t.id,
              label: t.label,
              startMin: nextStart,
              durationMin: t.durationMin,
              color: t.color,
              trackIndex: 0,
            },
          ];
        });
      }
    },
    [scheduleAtHour],
  );

  if (compact && showCoordinationCalendar) {
    return (
      <div className={`page staff-sheet ${compact ? "staff-sheet--compact" : ""} staff-sheet--guards-plan`}>
        <section className="staff-guards-plan" aria-label="Guards plan calendar">
          <div className="staff-guards-plan-head">
            <h3>
              Guards plan ·{" "}
              {shiftStart.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
              –
              {shiftEnd.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
            </h3>
            <button
              type="button"
              className="staff-btn-collapse-calendar"
              onClick={() => setShowCoordinationCalendar(false)}
              aria-label="Collapse guards plan calendar"
            >
              ←
            </button>
          </div>
          <div className="staff-guards-plan-body">
            {guardsPlanSlots.map((timeLabel, idx) => {
              const hourTasks = t1PlacedByHourIndex.get(idx) ?? [];
              return (
                <div key={timeLabel} className="staff-guards-plan-row">
                  <div className="staff-guards-plan-time">{timeLabel}</div>
                  <div
                    className={`staff-guards-plan-slot-wrap ${
                      dragOverGuardHourIndex === idx ? "staff-guards-plan-slot-wrap--dragover" : ""
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverGuardHourIndex(idx);
                    }}
                    onDragLeave={() => setDragOverGuardHourIndex((prev) => (prev === idx ? null : prev))}
                    onDrop={(e) => onDropGuardHour(e, idx)}
                  >
                    {hourTasks.length > 0 ? (
                      hourTasks.map((task) => (
                        <article
                          key={task.placedId}
                          className="staff-guards-plan-entry"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              SCHEDULE_DND_MIME,
                              JSON.stringify({ kind: "guards-entry", placedId: task.placedId }),
                            );
                            e.dataTransfer.effectAllowed = "move";
                          }}
                        >
                          <strong>{task.label}</strong>
                          <span>
                            T1 · {task.durationMin} min
                          </span>
                        </article>
                      ))
                    ) : (
                      <button type="button" className="staff-guards-plan-slot">
                        Click to add event
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`page staff-sheet ${compact ? "staff-sheet--compact" : ""}`}>
      {onBack && !compact ? (
        <button type="button" className="text-link staff-sheet-back staff-sheet-back-btn" onClick={onBack}>
          {backLabel}
        </button>
      ) : showBackLink ? (
        <Link to="/dashboard" className="text-link staff-sheet-back">
          ← Dashboard
        </Link>
      ) : null}

      <header className="staff-sheet-hero">
        <div className="staff-sheet-hero-top">
          {compact ? (
            <div className="staff-sheet-compact-head">
              <div className="staff-sheet-compact-title-row">
                <h1 className="staff-sheet-name">{staff.name}</h1>
                {onBack ? (
                  <button type="button" className="staff-sheet-inline-back" onClick={onBack} aria-label={backLabel}>
                    ←
                  </button>
                ) : null}
              </div>
              <div className="staff-sheet-compact-subrow">
                <div className="staff-sheet-hero-actions staff-sheet-hero-actions--compact">
                  <button
                    type="button"
                    className="staff-btn-comm-icon"
                    onClick={sendStaffMessage}
                    title={`Send message to ${staff.name}`}
                    aria-label={`Send message to ${staff.name}`}
                  >
                    ✉
                  </button>
                  <button
                    type="button"
                    className="staff-btn-comm-icon staff-btn-comm-icon--voice"
                    onClick={sendStaffVoice}
                    title={`Send voice note to ${staff.name}`}
                    aria-label={`Send voice note to ${staff.name}`}
                  >
                    🎤
                  </button>
                </div>
                <div className="staff-sheet-meta">
                  <span>
                    <strong>Role</strong> — {staff.role}
                  </span>
                  {staff.phone ? (
                    <span>
                      <strong>Comms</strong> — {staff.phone}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="staff-sheet-hero-text">
                <h1 className="staff-sheet-name">{staff.name}</h1>
                <div className="staff-sheet-meta">
                  <span>
                    <strong>Role</strong> — {staff.role}
                  </span>
                  {staff.phone ? (
                    <span>
                      <strong>Comms</strong> — {staff.phone}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="staff-sheet-hero-actions">
                <button
                  type="button"
                  className="staff-btn-comm-icon"
                  onClick={sendStaffMessage}
                  title={`Send message to ${staff.name}`}
                  aria-label={`Send message to ${staff.name}`}
                >
                  ✉
                </button>
                <button
                  type="button"
                  className="staff-btn-comm-icon staff-btn-comm-icon--voice"
                  onClick={sendStaffVoice}
                  title={`Send voice note to ${staff.name}`}
                  aria-label={`Send voice note to ${staff.name}`}
                >
                  🎤
                </button>
              <Link
                to={`/staff/${staff.slug}/schedule`}
                className="staff-btn-view-schedule"
                title="Your postings and who else is at your sites"
              >
                View schedule
              </Link>
              </div>
            </>
          )}
        </div>
        {broadcastNotice ? (
          <div className="staff-camera-notice" role="status">
            <span>{broadcastNotice}</span>
            <button type="button" className="staff-camera-notice-dismiss" onClick={() => setBroadcastNotice(null)}>
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="staff-sheet-actions">
          <div className="staff-clock-card">
            <div className="staff-clock-columns" role="group" aria-label="Clock in and shift end">
              <div className="staff-clock-col">
                <p className="staff-clock-col-label">Clock in</p>
                <button
                  type="button"
                  className={`staff-btn-clock ${clockedIn ? "staff-btn-clock--active" : ""}`}
                  onClick={handleClockToggle}
                >
                  {clockedIn ? "Clock out" : "Clock in"}
                </button>
              </div>
              <div className="staff-clock-col">
                <p className="staff-clock-col-label">Shift ends</p>
                <div className="staff-countdown-display staff-countdown-display--inline" aria-live="polite">
                  {formatCountdown(msToShiftEnd)}
                </div>
              </div>
            </div>
            <div className="staff-clock-footer">
              {clockedIn && clockInAt ? (
                <p className="staff-clock-status">
                  Clocked in at{" "}
                  {clockInAt.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              ) : (
                <p className="staff-clock-status">Not clocked in</p>
              )}
              <p className="staff-countdown-label">
                Target {shiftEnd.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="staff-timeline-workspace" aria-label="Schedule timeline">
        <div className="staff-library staff-library--top">
          <p className="staff-library-title">Master library</p>
          <p className="staff-library-hint">
            Drag tasks onto a <strong>channel</strong> (row), or tap one task then tap a lane to place it. Same row =
            sequence along the day; different rows = simultaneous work — like video tracks.
          </p>
          <div className="staff-library-list">
            {TASK_LIBRARY.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`staff-library-item ${selectedTemplateId === t.id ? "staff-library-item--selected" : ""}`}
                draggable
                onDragStart={(e) => onDragStartLib(e, t)}
                onClick={(e) => {
                  if (e.detail > 1) return;
                  setSelectedTemplateId((prev) => (prev === t.id ? null : t.id));
                }}
                onDoubleClick={() => placeTemplateSequential(t.id)}
                style={{ backgroundColor: t.color }}
              >
                {t.label}
                <span>{t.durationMin} min</span>
              </button>
            ))}
          </div>
        </div>

        <div className="staff-shift-mode-row">
          <p className="staff-shift-mode-label">Shift mode</p>
          <div className="staff-shift-toggle" role="group" aria-label="Select shift mode">
            <button
              type="button"
              className={`staff-shift-toggle-btn ${shiftMode === "day" ? "staff-shift-toggle-btn--active" : ""}`}
              onClick={() => setShiftMode("day")}
            >
              Day shift
            </button>
            <button
              type="button"
              className={`staff-shift-toggle-btn ${shiftMode === "night" ? "staff-shift-toggle-btn--active" : ""}`}
              onClick={() => setShiftMode("night")}
            >
              Night shift
            </button>
          </div>
        </div>

        <div className="staff-timeline-panel">
          <div className="staff-timeline-panel-head">
            <h3>
              Multi-track shift ·{" "}
              {shiftStart.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
              –
              {shiftEnd.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
            </h3>
          </div>

          {showCoordinationCalendar ? (
            <div className="staff-coord-calendar" aria-label="Coordination day calendar">
              {hourSlots.map((slot, idx) => {
                const hourTasks = placedByHourIndex.get(idx) ?? [];
                return (
                  <div key={slot.toISOString()} className="staff-coord-row">
                    <div className="staff-coord-time">
                      {slot.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </div>
                    <div className="staff-coord-cell">
                      {hourTasks.length > 0 ? (
                        hourTasks.map((task) => (
                          <article key={task.placedId} className="staff-coord-card">
                            <div className="staff-coord-card-main">
                              <strong>{task.label}</strong>
                              <span>
                                {staff.name} · Track {task.trackIndex + 1}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="staff-coord-card-remove"
                              onClick={() => removePlaced(task.placedId)}
                              aria-label="Remove task"
                            >
                              🗑
                            </button>
                          </article>
                        ))
                      ) : (
                        <p className="staff-coord-empty">Click to add event</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="staff-timeline-editor">
              <div className="staff-timeline-ruler-row">
                <div className="staff-timeline-corner staff-timeline-corner--action">
                  <button
                    type="button"
                    className="staff-btn-expand-calendar"
                    onClick={() => setShowCoordinationCalendar(true)}
                    aria-label="Expand guards plan calendar"
                    title="Expand guards plan calendar"
                  >
                    ⤢
                  </button>
                </div>
                <div className="staff-timeline-ruler-area">
                  <div className="staff-timeline-ruler-ticks" />
                  <div className="staff-timeline-ruler-labels">
                    {rulerLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  {playheadPct != null ? (
                    <div
                      className="staff-playhead"
                      style={{ left: `${playheadPct}%` }}
                      title="Now (within shift window)"
                    />
                  ) : null}
                </div>
              </div>

              {tracks.map((trackIndex) => {
                const rowTasks = placedTasks.filter((p) => p.trackIndex === trackIndex);
                return (
                  <div key={trackIndex} className="staff-track-row">
                    <div className="staff-track-label">
                      <span className="staff-track-name">T{trackIndex + 1}</span>
                      <span className="staff-track-icons" aria-hidden>
                        <span className="staff-track-icon" title="Lock track">
                          ○
                        </span>
                      </span>
                    </div>
                    <div
                      className={`staff-track-lane ${dragOverTrack === trackIndex ? "staff-track-lane--drag" : ""} ${
                        selectedTemplateId ? "staff-track-lane--armed" : ""
                      }`}
                      onDragOver={(e) => onDragOverLane(e, trackIndex)}
                      onDragLeave={onDragLeaveLane}
                      onDrop={(e) => onDropLane(e, trackIndex)}
                      onClick={(e) => onClickLane(e, trackIndex)}
                    >
                      <div className="staff-track-lane-grid" aria-hidden />
                      {rowTasks.length === 0 ? (
                        <div className="staff-track-lane-hint">Drop tasks here · channel {trackIndex + 1}</div>
                      ) : null}
                      {rowTasks.map((p) => {
                        const leftPct = (p.startMin / SHIFT_TOTAL_MIN) * 100;
                        const widthPct = (p.durationMin / SHIFT_TOTAL_MIN) * 100;
                        return (
                          <div
                            key={p.placedId}
                            className="staff-timeline-block"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: p.color,
                              color: "#fff",
                            }}
                            title={`${p.label} · ${p.startMin}m–${p.startMin + p.durationMin}m · T${trackIndex + 1}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removePlaced(p.placedId);
                            }}
                          >
                            <span className="staff-timeline-block-label">{p.label}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePlaced(p.placedId);
                              }}
                              aria-label="Remove task"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {!compact ? (
        <p className="staff-sheet-footnote">
          HR records and live sync will connect to Supabase later. Channels are in-memory until refresh (max 12).
        </p>
      ) : null}
    </div>
  );
}
