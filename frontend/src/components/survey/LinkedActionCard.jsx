// A governance action that links a survey, shown on the survey's page with
// the action's type, state and expiry read from Civitas' own snapshot.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { actionStatus, actionStatusPill } from "../../services/surveyPresentation";

export default function LinkedActionCard({ link }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!link?.actionId) return undefined;
    const params = new URLSearchParams({ view: "actions", proposalId: link.actionId });
    fetch(`/api/accountability?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => { if (alive) setInfo(payload?.proposalInfo?.[link.actionId] || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [link?.actionId]);

  const status = actionStatus(info);
  const title = info?.actionName || link.title || link.actionId;
  const to = `/actions/${encodeURIComponent(link.actionId)}`;

  return (
    <Link to={to} className="lac">
      <div className="lac-main">
        <span className="lac-kicker">Governance action{info?.governanceType ? ` · ${info.governanceType}` : ""}</span>
        <span className="lac-title">{title}</span>
        <span className="mono muted lac-id">{link.actionId}</span>
      </div>
      <div className="lac-side">
        {status ? <span className={`pill ${actionStatusPill(status)}`}>{status}</span> : null}
        <span className="muted lac-expiry">Expires epoch {info?.expirationEpoch || link.endEpoch}</span>
        <span className="lac-cta">Open action →</span>
      </div>
    </Link>
  );
}
