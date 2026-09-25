// The badges every survey surface shows (lifecycle, sealed, linked) in one
// place, so the list row and the survey page cannot name the same state
// differently. Wording follows DRepTalk: Open / Closed / Cancelled / Invalid
// definition.
import { Pill } from "../../ui";
import { lifecycleLabel } from "../../services/surveyPresentation";

const TONE = { open: "success", closed: "neutral", cancelled: "danger", untalliable: "warning" };

export default function SurveyBadges({ survey, showLinked = true, size = "sm" }) {
  if (!survey) return null;
  const lifecycle = survey.lifecycle || "closed";
  return (
    <span className="row" style={{ gap: 6 }}>
      <Pill tone={TONE[lifecycle] || "neutral"} size={size}>{lifecycleLabel(lifecycle)}</Pill>
      {survey.sealed ? <Pill tone="info" size={size} outline title="Answers stay encrypted until the survey's reveal time">Sealed</Pill> : null}
      {showLinked && survey.govLinks?.length ? <Pill tone="accent" size={size} outline title="Linked from a governance action">Linked</Pill> : null}
    </span>
  );
}
