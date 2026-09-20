// The badges every survey surface shows (lifecycle, sealed, linked) in one
// place, so the list row and the survey page cannot name the same state
// differently. Wording follows DRepTalk: Open / Closed / Cancelled / Invalid
// definition.
import { lifecycleLabel } from "../../services/surveyPresentation";

export default function SurveyBadges({ survey, showLinked = true }) {
  if (!survey) return null;
  const lifecycle = survey.lifecycle || "closed";
  return (
    <span className="svy-badges">
      <span className={`svy-badge svy-badge--${lifecycle}`}>{lifecycleLabel(lifecycle)}</span>
      {survey.sealed ? <span className="svy-badge svy-badge--sealed" title="Answers stay encrypted until the survey's reveal time">Sealed</span> : null}
      {showLinked && survey.govLinks?.length ? (
        <span className="svy-badge svy-badge--linked" title="Linked from a governance action">Linked</span>
      ) : null}
    </span>
  );
}
