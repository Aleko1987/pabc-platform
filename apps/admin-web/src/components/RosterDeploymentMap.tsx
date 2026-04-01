import { useId } from "react";
import { useNavigate } from "react-router-dom";

import type { StaffRecord } from "../data/staffDirectory";
import { getFieldPositionForSlug } from "../data/staffFieldMap";

type Props = {
  /** When set, only these staff are shown (e.g. one client’s guards). When null, show everyone. */
  visibleSlugs: Set<string> | null;
  allStaff: StaffRecord[];
};

export function RosterDeploymentMap({ visibleSlugs, allStaff }: Props) {
  const navigate = useNavigate();
  const uid = useId();
  const gradId = `roster-mm-water-${uid}`;

  const list = visibleSlugs == null ? allStaff : allStaff.filter((s) => visibleSlugs.has(s.slug));

  return (
    <div className="roster-map-hud" aria-label="Deployment map — officer positions">
      <div className="roster-map-lens">
        <svg className="roster-map-svg" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(100, 181, 246, 0.38)" />
              <stop offset="100%" stopColor="rgba(66, 165, 245, 0.22)" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="#2e3238" />
          <path
            d="M 8 78 Q 22 68 18 52 Q 14 38 28 30 L 38 28 Q 52 26 58 38 L 62 52 Q 58 66 42 72 Q 26 80 8 78 Z"
            fill={`url(#${gradId})`}
            opacity={0.92}
          />
          <g stroke="rgba(210, 215, 220, 0.32)" strokeWidth="0.35" fill="none">
            <path d="M 12 32 H 88 M 12 42 H 88 M 12 58 H 88 M 12 68 H 88" />
            <path d="M 28 12 V 88 M 44 12 V 88 M 58 12 V 88 M 74 12 V 88" />
            <path d="M 18 22 L 82 78 M 82 22 L 18 78" opacity={0.22} />
          </g>
          {list.map((staff) => {
            const p = getFieldPositionForSlug(staff.slug);
            return (
              <a
                key={staff.slug}
                href={`/staff/${staff.slug}`}
                className="roster-map-hit"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/staff/${staff.slug}`);
                }}
              >
                <title>{staff.name}</title>
                <circle className="roster-map-dot" cx={p.x} cy={p.y} r={2.8} />
              </a>
            );
          })}
        </svg>
      </div>
      <span className="roster-map-compass" aria-hidden>
        N
      </span>
    </div>
  );
}
