import { useMemo, useState } from "react";

const CC_ELECTION_REGISTRATION_END_MS = Date.UTC(2026, 5, 21, 21, 45, 0);
const CC_ELECTION_VOTING_END_MS      = Date.UTC(2026, 6, 23, 21, 45, 0);
const CC_ELECTION_RESULTS_END_MS     = Date.UTC(2026, 6, 27, 23, 59, 0);
const CC_ELECTION_UPDATE_END_MS      = Date.UTC(2026, 8,  7, 0, 0, 0);

function getCcElectionBanner(nowMs) {
  if (nowMs < CC_ELECTION_REGISTRATION_END_MS) {
    return <>Candidate registration is open from <strong>8 May 2026 at 21:45 UTC</strong> to <strong>21 June 2026 at 21:45 UTC</strong>.</>;

  }
  if (nowMs < CC_ELECTION_VOTING_END_MS) {
    return <>CC Elections voting on the Hydra platform runs from <strong>28 June 2026</strong> to{" "}<strong>23 July 2026</strong>.</>;
  }
  if (nowMs < CC_ELECTION_RESULTS_END_MS) {
    return <>CC Elections voting has closed. Final results are scheduled for <strong>27 July 2026</strong>.</>;
  }
  if (nowMs < CC_ELECTION_UPDATE_END_MS) {
    return <>The Update Committee governance action submission is scheduled for <strong>1 August 2026</strong>.</>;
  }
  return <>The 2026 CC Elections timeline has concluded. The published timeline remains available for reference.</>;
}

export default function InfoBanner() {
  const [nowMs] = useState(() => Date.now());
  const ccElectionBanner = useMemo(() => getCcElectionBanner(nowMs), [nowMs]);

  return (
    <section className="budget-process-banner" aria-label="Current governance process information">
      <article className="info-banner-item">
        <div>
          <p className="budget-process-banner-title">Intersect facilitated CC Elections</p>
          <p>{ccElectionBanner}</p>
        </div>
        <a className="budget-process-banner-link" href="/cc-election">
          View CC Elections
        </a>
      </article>
    </section>
  );
}
