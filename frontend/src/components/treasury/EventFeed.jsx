// On-chain activity from the Intersect Administration API, newest first.
import { Link } from "react-router-dom";
import { csTx, eventMeta, fmtAda, fmtAdaShort, fmtAgo, fmtDateTime, shortHash } from "../../lib/treasuryAdmin";

export default function EventFeed({ events, max = 60, detailed = false, linkProjects = true, emptyMessage = "No recent events." }) {
  const rows = (events || []).slice(0, max);
  if (rows.length === 0) return <p className="muted small">{emptyMessage}</p>;
  return (
    <ol className="t-feed">
      {rows.map((e, i) => {
        const meta = eventMeta(e.type);
        return (
          <li key={`${e.txHash || "tx"}-${i}`} className="t-feed__item">
            <span className="t-feed__dot" style={{ background: meta.color }} aria-hidden="true" />
            <div className="t-feed__body">
              <div className="t-feed__head">
                <span style={{ color: meta.color, fontWeight: 600 }}>{meta.label}</span>
                {e.amountAda ? <span> · ₳{detailed ? fmtAda(e.amountAda) : fmtAdaShort(e.amountAda)}</span> : null}
                <span className="muted"> · {detailed ? `${fmtDateTime(e.dateIso)} (${fmtAgo(e.dateIso)})` : fmtAgo(e.dateIso)}</span>
                {detailed && e.txHash ? <span> · <a className="mono" href={csTx(e.txHash)} target="_blank" rel="noreferrer">{shortHash(e.txHash)}</a></span> : null}
              </div>
              {e.project ? <div className="t-feed__project">{linkProjects && e.projectId ? <Link to={`/treasury/explorer/${encodeURIComponent(e.projectId)}`}>{e.project}</Link> : e.project}</div> : null}
              {e.milestone ? <div className="tiny muted t-feed__clip">{e.milestone}</div> : null}
              {e.reason ? <div className="tiny muted" style={{ fontStyle: "italic" }}>{detailed || e.reason.length <= 140 ? e.reason : `${e.reason.slice(0, 140)}…`}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
