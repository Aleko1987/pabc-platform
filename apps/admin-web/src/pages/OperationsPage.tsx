import { useMemo, useState } from "react";

import { ALL_AREAS_FLAT } from "../data/areas";
import { CUSTOMER_RECORDS } from "../data/customers";
import { STAFF_RECORDS } from "../data/staffDirectory";

type CommGroup = {
  id: string;
  label: string;
  kind: "area" | "customer" | "role";
  recipients: string[];
};

function uniqNames(names: string[]): string[] {
  return Array.from(new Set(names.map((n) => n.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function titleCaseWords(input: string): string {
  return input
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function OperationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dispatchLog, setDispatchLog] = useState<string[]>([]);

  const areaGroups = useMemo<CommGroup[]>(() => {
    return ALL_AREAS_FLAT.map((a) => {
      const recipients = CUSTOMER_RECORDS.filter((c) => c.areaSlugs.includes(a.slug)).flatMap((c) =>
        c.sites.flatMap((s) => s.guards),
      );
      return {
        id: `area-${a.slug}`,
        label: `Area: ${a.label}`,
        kind: "area" as const,
        recipients: uniqNames(recipients),
      };
    }).filter((g) => g.recipients.length > 0);
  }, []);

  const customerGroups = useMemo<CommGroup[]>(() => {
    return CUSTOMER_RECORDS.map((c) => ({
      id: `customer-${c.slug}`,
      label: `Customer: ${c.name}`,
      kind: "customer" as const,
      recipients: uniqNames(c.sites.flatMap((s) => s.guards)),
    }));
  }, []);

  const roleGroups = useMemo<CommGroup[]>(() => {
    const map = new Map<string, string[]>();
    for (const s of STAFF_RECORDS) {
      const key = s.role.trim().toLowerCase();
      const list = map.get(key) ?? [];
      list.push(s.name);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .map(([role, names]) => ({
        id: `role-${role.replace(/\s+/g, "-")}`,
        label: `Role: ${titleCaseWords(role)}`,
        kind: "role" as const,
        recipients: uniqNames(names),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const allGroups = useMemo(() => [...areaGroups, ...customerGroups, ...roleGroups], [areaGroups, customerGroups, roleGroups]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allGroups;
    return allGroups.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.recipients.some((r) => r.toLowerCase().includes(q)),
    );
  }, [allGroups, searchQuery]);

  const allFilteredRecipients = useMemo(
    () => uniqNames(filteredGroups.flatMap((g) => g.recipients)),
    [filteredGroups],
  );

  const appendLog = (line: string) => {
    setDispatchLog((prev) => [line, ...prev].slice(0, 18));
  };

  const sendMessage = (targetLabel: string, recipients: string[]) => {
    if (recipients.length === 0) return;
    const body = window.prompt("Message to send to all listed recipients:", "Team check-in: confirm site status by 18:00.");
    if (!body || !body.trim()) return;
    appendLog(`Message sent to ${targetLabel} (${recipients.length})`);
  };

  const sendVoice = (targetLabel: string, recipients: string[]) => {
    if (recipients.length === 0) return;
    const note = window.prompt("Voice note label:", "Shift handover briefing");
    if (!note || !note.trim()) return;
    appendLog(`Voice note "${note.trim()}" sent to ${targetLabel} (${recipients.length})`);
  };

  return (
    <div className="page operations-page">
      <h1>Operations communications</h1>
      <p className="page-lead">
        Use the top-right icon buttons to broadcast to all subcategories currently listed below.
      </p>

      <section className="operations-toolbar-card" aria-label="Global communications actions">
        <div className="operations-toolbar">
          <input
            className="operations-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subcategories or recipients…"
            aria-label="Search communications subcategories"
          />
          <button
            type="button"
            className="operations-icon-btn"
            title={`Send message to all listed recipients (${allFilteredRecipients.length})`}
            onClick={() => sendMessage("all listed subcategories", allFilteredRecipients)}
            disabled={allFilteredRecipients.length === 0}
            aria-label="Send message to all listed subcategories"
          >
            ✉
          </button>
          <button
            type="button"
            className="operations-icon-btn operations-icon-btn--voice"
            title={`Send voice note to all listed recipients (${allFilteredRecipients.length})`}
            onClick={() => sendVoice("all listed subcategories", allFilteredRecipients)}
            disabled={allFilteredRecipients.length === 0}
            aria-label="Send voice note to all listed subcategories"
          >
            🎤
          </button>
        </div>
      </section>

      <section className="operations-groups" aria-label="Recipient subcategories">
        {filteredGroups.map((g) => (
          <article key={g.id} className="operations-group-card">
            <div className="operations-group-head">
              <h2>{g.label}</h2>
              <span className="operations-group-count">{g.recipients.length} recipients</span>
            </div>
            <div className="operations-group-actions">
              <button
                type="button"
                className="operations-btn operations-btn--ghost"
                onClick={() => sendMessage(g.label, g.recipients)}
                disabled={g.recipients.length === 0}
              >
                Message group
              </button>
              <button
                type="button"
                className="operations-btn operations-btn--ghost"
                onClick={() => sendVoice(g.label, g.recipients)}
                disabled={g.recipients.length === 0}
              >
                Voice note group
              </button>
            </div>
            <ul className="operations-recipient-list">
              {g.recipients.map((name) => (
                <li key={`${g.id}-${name}`} className="operations-recipient-pill">
                  {name}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="operations-log-card" aria-label="Dispatch preview log">
        <h2>Dispatch log</h2>
        {dispatchLog.length === 0 ? (
          <p className="operations-log-empty">No sends yet.</p>
        ) : (
          <ul className="operations-log-list">
            {dispatchLog.map((line, i) => (
              <li key={`${line}-${i}`}>{line}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
