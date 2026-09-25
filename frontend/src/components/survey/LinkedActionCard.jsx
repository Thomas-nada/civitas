// A governance action that links a survey, shown on the survey's page with
// the action's type, state and expiry read from Civitas' own snapshot.
import { Link } from "react-router-dom";
import { useAction } from "../../api/queries";
import { StatusPill } from "../../ui";
import { truncateMiddle } from "../../lib/governance/format";

export default function LinkedActionCard({ link }) {
  const query = useAction(link?.actionId || "");
  const action = query.data?.action || null;
  const title = action?.actionName || link.title || link.actionId;
  return (
    <Link to={`/actions/${encodeURIComponent(link.actionId)}`} className="svy-lac">
      <div className="svy-lac__main">
        <span className="caps muted">Governance action{action?.governanceType ? ` · ${action.governanceType}` : ""}</span>
        <span className="svy-lac__title">{title}</span>
        <span className="c-hash">{truncateMiddle(link.actionId, 18, 8)}</span>
      </div>
      <div className="svy-lac__side">
        {action?.status ? <StatusPill status={action.status} size="sm" /> : null}
        <span className="tiny muted">Expires epoch {action?.expirationEpoch || link.endEpoch}</span>
        <span className="small" style={{ color: "var(--color-accent)" }}>Open action →</span>
      </div>
    </Link>
  );
}
