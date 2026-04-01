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
  const [messageBody, setMessageBody] = useState("Team check-in: confirm site status by 18:00.");
  const [voiceNoteLabel, setVoiceNoteLabel] = useState("Shift handover briefing");
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
  const allRecipients = useMemo(() => uniqNames(allGroups.flatMap((g) => g.recipients)), [allGroups]);

  const appendLog = (line: string) => {
    setDispatchLog((prev) => [line, ...prev].slice(0, 18));
  };

  const sendMessage = (targetLabel: string, recipients: string[]) => {
    const body = messageBody.trim();
    if (!body || recipients.length === 0) return;
    appendLog(`Message sent to ${targetLabel} (${recipients.length})`);
  };

  const sendVoice = (targetLabel: string, recipients: string[]) => {
    const note = voiceNoteLabel.trim();
    if (!note || recipients.length === 0) return;
    appendLog(`Voice note "${note}" sent to ${targetLabel} (${recipients.length})`);
  };

  const canSendMessageAll = messageBody.trim().length > 0 && allRecipients.length > 0;
  const canSendVoiceAll = voiceNoteLabel.trim().length > 0 && allRecipients.length > 0;

  return (
    <div className="page operations-page">
      <h1>Operations communications</h1>
      <p className="page-lead">
        Global actions at the top send to all recipients listed in the subcategories below. This is a shell flow for
        WhatsApp/Supabase Edge Function wiring.
      </p>

      <section className="operations-global-card" aria-label="Global communications actions">
        <div className="operations-field-row">
          <label className="operations-label" htmlFor="global-message">
            Global message
          </label>
          <textarea
            id="global-message"
            className="operations-textarea"
            rows={3}
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type the message to send to all recipients below…"
          />
        </div>
        <div className="operations-field-row">
          <label className="operations-label" htmlFor="global-voice-note">
            Voice note label
          </label>
          <input
            id="global-voice-note"
            className="operations-input"
            value={voiceNoteLabel}
            onChange={(e) => setVoiceNoteLabel(e.target.value)}
            placeholder="e.g. Security lead update"
          />
        </div>
        <div className="operations-global-actions">
          <button
            type="button"
            className="operations-btn operations-btn--message"
            onClick={() => sendMessage("all subcategories", allRecipients)}
            disabled={!canSendMessageAll}
          >
            Send message to all ({allRecipients.length})
          </button>
          <button
            type="button"
            className="operations-btn operations-btn--voice"
            onClick={() => sendVoice("all subcategories", allRecipients)}
            disabled={!canSendVoiceAll}
          >
            Send voice note to all ({allRecipients.length})
          </button>
        </div>
      </section>

      <section className="operations-groups" aria-label="Recipient subcategories">
        {allGroups.map((g) => (
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
                disabled={messageBody.trim().length === 0 || g.recipients.length === 0}
              >
                Message group
              </button>
              <button
                type="button"
                className="operations-btn operations-btn--ghost"
                onClick={() => sendVoice(g.label, g.recipients)}
                disabled={voiceNoteLabel.trim().length === 0 || g.recipients.length === 0}
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
