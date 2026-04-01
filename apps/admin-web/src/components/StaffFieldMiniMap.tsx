import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import type { StaffRecord } from "../data/staffDirectory";
import { getFieldPositionForSlug } from "../data/staffFieldMap";

type Props = {
  current: StaffRecord;
  allStaff: StaffRecord[];
  /** 0–1 progress through the current shift window (left status arc). */
  shiftProgress01: number;
  /** 0–1 mock uplink strength (right status arc). */
  commsStrength01?: number;
};

const MAP_SCALE = 2.4;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function StaffFieldMiniMap({
  current,
  allStaff,
  shiftProgress01,
  commsStrength01 = 0.82,
}: Props) {
  const navigate = useNavigate();
  const origin = getFieldPositionForSlug(current.slug);
  const others = allStaff.filter((s) => s.slug !== current.slug);

  const dots = others.map((s) => {
    const p = getFieldPositionForSlug(s.slug);
    const dx = (p.x - origin.x) * MAP_SCALE;
    const dy = (p.y - origin.y) * MAP_SCALE;
    return {
      staff: s,
      x: clamp(50 + dx, 10, 90),
      y: clamp(50 + dy, 10, 90),
    };
  });

  const leftDeg = clamp(shiftProgress01, 0, 1) * 85;
  const rightDeg = clamp(commsStrength01, 0, 1) * 85;

  const ringStyle = {
    "--staff-ring-left-deg": `${leftDeg}deg`,
    "--staff-ring-right-deg": `${rightDeg}deg`,
  } as CSSProperties;

  const first = dots[0];

  return (
    <div
      className="staff-minimap-hud"
      style={ringStyle}
      aria-label="Field map — you at centre, tap a dot for another officer"
    >
      <div className="staff-minimap-status-ring" aria-hidden />
      <div className="staff-minimap-lens">
        <svg className="staff-minimap-svg" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id="staff-mm-water" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(100, 181, 246, 0.38)" />
              <stop offset="100%" stopColor="rgba(66, 165, 245, 0.22)" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="#2e3238" />
          <path
            d="M 8 78 Q 22 68 18 52 Q 14 38 28 30 L 38 28 Q 52 26 58 38 L 62 52 Q 58 66 42 72 Q 26 80 8 78 Z"
            fill="url(#staff-mm-water)"
            opacity={0.92}
          />
          <g stroke="rgba(210, 215, 220, 0.32)" strokeWidth="0.35" fill="none">
            <path d="M 12 32 H 88 M 12 42 H 88 M 12 58 H 88 M 12 68 H 88" />
            <path d="M 28 12 V 88 M 44 12 V 88 M 58 12 V 88 M 74 12 V 88" />
            <path d="M 18 22 L 82 78 M 82 22 L 18 78" opacity={0.22} />
          </g>
          {first ? (
            <line
              x1={50}
              y1={50}
              x2={first.x}
              y2={first.y}
              stroke="rgba(76, 175, 80, 0.5)"
              strokeWidth="0.45"
              strokeDasharray="2 1.5"
            />
          ) : null}
          {dots.map(({ staff, x, y }) => (
            <a
              key={staff.slug}
              href={`/staff/${staff.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/staff/${staff.slug}`);
              }}
            >
              <title>{staff.name}</title>
              <circle className="staff-minimap-dot" cx={x} cy={y} r={2.6} />
            </a>
          ))}
          <polygon
            className="staff-minimap-player"
            points="50,45.5 53.4,54.5 46.6,54.5"
            fill="#f2f2f2"
            stroke="#0b0b0b"
            strokeWidth="0.4"
          />
        </svg>
      </div>
      <span className="staff-minimap-compass" aria-hidden>
        N
      </span>
    </div>
  );
}
