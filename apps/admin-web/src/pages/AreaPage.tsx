import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getCustomersByAreaSlug } from "../data/customers";
import { getAreaBySlug } from "../data/areas";

export function AreaPage() {
  const { areaSlug } = useParams<{ areaSlug: string }>();
  const area = areaSlug ? getAreaBySlug(areaSlug) : undefined;
  const stores = areaSlug ? getCustomersByAreaSlug(areaSlug) : [];
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  const recipients = useMemo(() => {
    const names = stores.flatMap((c) => c.sites.flatMap((s) => s.guards));
    return Array.from(new Set(names.map((n) => n.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [stores]);

  const sendAreaMessage = () => {
    if (!area || recipients.length === 0) return;
    const body = window.prompt(`Message to all guards in ${area.label}:`, "Team check-in: confirm site status by 18:00.");
    if (!body || !body.trim()) return;
    setBroadcastNotice(`Message sent to ${area.label} (${recipients.length} guards).`);
  };

  const sendAreaVoice = () => {
    if (!area || recipients.length === 0) return;
    const note = window.prompt(`Voice note label for ${area.label}:`, "Shift handover briefing");
    if (!note || !note.trim()) return;
    setBroadcastNotice(`Voice note sent to ${area.label} (${recipients.length} guards).`);
  };

  if (!areaSlug || !area) {
    return (
      <div className="page">
        <h1>Area not found</h1>
        <p className="page-lead">No area matches this link.</p>
        <Link to="/dashboard" className="text-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/dashboard" className="text-link">
        ← Dashboard
      </Link>
      <div className="dashboard-header">
        <h1>{area.label}</h1>
        <div className="dashboard-broadcast-actions">
          <button
            type="button"
            className="dashboard-broadcast-btn"
            title={`Send message to all guards in this area (${recipients.length})`}
            aria-label="Send message to all guards in this area"
            onClick={sendAreaMessage}
            disabled={recipients.length === 0}
          >
            ✉
          </button>
          <button
            type="button"
            className="dashboard-broadcast-btn dashboard-broadcast-btn--voice"
            title={`Send voice note to all guards in this area (${recipients.length})`}
            aria-label="Send voice note to all guards in this area"
            onClick={sendAreaVoice}
            disabled={recipients.length === 0}
          >
            🎤
          </button>
        </div>
      </div>
      {broadcastNotice ? (
        <p className="dashboard-broadcast-notice" role="status">
          {broadcastNotice}
        </p>
      ) : null}
      <p className="page-lead">Stores and sites in this area (mock).</p>
      <h2 className="area-stores-heading">Stores</h2>
      <ul className="area-store-list">
        {stores.map((c) => (
          <li key={c.slug}>
            <Link to={`/customers/${c.slug}`} className="text-link area-store-link">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      {stores.length === 0 ? <p className="page-lead">No stores in this area yet.</p> : null}
    </div>
  );
}
