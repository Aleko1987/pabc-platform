import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getCustomerBySlug } from "../data/customers";
import { getStaffByName } from "../data/staffDirectory";

export function CustomerDetailPage() {
  const { customerSlug } = useParams<{ customerSlug: string }>();
  const customer = customerSlug ? getCustomerBySlug(customerSlug) : undefined;
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  const recipients = useMemo(() => {
    if (!customer) return [];
    const names = customer.sites.flatMap((s) => s.guards);
    return Array.from(new Set(names.map((n) => n.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [customer]);

  const sendCustomerMessage = () => {
    if (recipients.length === 0 || !customer) return;
    const body = window.prompt(`Message to all guards at ${customer.name}:`, "Team check-in: confirm site status by 18:00.");
    if (!body || !body.trim()) return;
    setBroadcastNotice(`Message sent to ${customer.name} (${recipients.length} guards).`);
  };

  const sendCustomerVoice = () => {
    if (recipients.length === 0 || !customer) return;
    const note = window.prompt(`Voice note label for ${customer.name}:`, "Shift handover briefing");
    if (!note || !note.trim()) return;
    setBroadcastNotice(`Voice note sent to ${customer.name} (${recipients.length} guards).`);
  };

  if (!customer) {
    return (
      <div className="page">
        <h1>Customer not found</h1>
        <p className="page-lead">No customer matches this link.</p>
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
        <h1>{customer.name}</h1>
        <div className="dashboard-broadcast-actions">
          <button
            type="button"
            className="dashboard-broadcast-btn"
            title={`Send message to all guards on this customer (${recipients.length})`}
            aria-label="Send message to all guards on this customer"
            onClick={sendCustomerMessage}
            disabled={recipients.length === 0}
          >
            ✉
          </button>
          <button
            type="button"
            className="dashboard-broadcast-btn dashboard-broadcast-btn--voice"
            title={`Send voice note to all guards on this customer (${recipients.length})`}
            aria-label="Send voice note to all guards on this customer"
            onClick={sendCustomerVoice}
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
      <p className="page-lead">Sites and assigned guards (mock).</p>
      <section className="customer-sites">
        {customer.sites.map((site) => (
          <div key={site.siteName} className="customer-site-block">
            <h2 className="customer-site-title">{site.siteName}</h2>
            <div className="customer-guards">
              {site.guards.map((name) => {
                const staff = getStaffByName(name);
                return staff ? (
                  <Link key={name} to={`/staff/${staff.slug}`} className="customer-guard-pill">
                    {name}
                  </Link>
                ) : (
                  <span key={name} className="customer-guard-pill customer-guard-pill--muted">
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
