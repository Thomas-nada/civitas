import { useMemo, useState } from "react";

const CC_ELECTION_REGISTRATION_END_MS = Date.UTC(2026, 5,  7, 21, 45, 0);
const CC_ELECTION_VOTING_END_MS      = Date.UTC(2026, 6, 14, 0, 0, 0);
const CC_ELECTION_RESULTS_END_MS     = Date.UTC(2026, 6, 17, 0, 0, 0);
const CC_ELECTION_UPDATE_END_MS      = Date.UTC(2026, 8,  7, 0, 0, 0);
const BUDGET_PROCESS_PROPOSAL_END_MS = Date.UTC(2026, 4,  8, 12, 0, 0);
const BUDGET_PROCESS_REVIEW_END_MS   = Date.UTC(2026, 4, 22, 12, 0, 0);
const BUDGET_PROCESS_VOTING_START_MS = Date.UTC(2026, 4, 26, 12, 0, 0);
const BUDGET_PROCESS_VOTING_END_MS   = Date.UTC(2026, 5, 12, 12, 0, 0);
const BUDGET_PROCESS_RESULTS_END_MS  = Date.UTC(2026, 5, 20,  0, 0, 0);

function getBudgetProcessBanner(nowMs) {
  if (nowMs < BUDGET_PROCESS_PROPOSAL_END_MS) {
    return <>Proposal submissions are open from <strong>16 April 2026 at 12:00 UTC</strong> to{" "}<strong>8 May 2026 at 12:00 UTC</strong>.</>;
  }
  if (nowMs < BUDGET_PROCESS_REVIEW_END_MS) {
    return <>Budget proposals are in final feedback and review from <strong>8 May 2026 at 12:00 UTC</strong> to{" "}<strong>22 May 2026 at 12:00 UTC</strong>.</>;
  }
  if (nowMs < BUDGET_PROCESS_VOTING_START_MS) {
    return <>Budget Hydra voting opens <strong>26 May 2026 at 12:00 UTC</strong> and remains open until{" "}<strong>12 June 2026 at 12:00 UTC</strong>.</>;
  }
  if (nowMs < BUDGET_PROCESS_VOTING_END_MS) {
    return <>Budget Hydra voting is open from <strong>26 May 2026 at 12:00 UTC</strong> to{" "}<strong>12 June 2026 at 12:00 UTC</strong>.</>;
  }
  if (nowMs < BUDGET_PROCESS_RESULTS_END_MS) {
    return <>Budget Hydra voting has closed. Audited voting results are scheduled for{" "}<strong>19 June 2026 at 12:00 UTC</strong>.</>;
  }
  return <>Treasury withdrawal submission timing is <strong>to be determined</strong>.</>;
}

function getCcElectionBanner(nowMs) {
  if (nowMs < CC_ELECTION_REGISTRATION_END_MS) {
    return <>Candidate registration is open from <strong>8 May 2026 at 21:45 UTC</strong> to <strong>7 June 2026 at 21:45 UTC</strong>.</>;

  }
  if (nowMs < CC_ELECTION_VOTING_END_MS) {
    return <>CC Elections voting on the Hydra platform runs from <strong>13 June 2026</strong> to{" "}<strong>13 July 2026</strong>.</>;
  }
  if (nowMs < CC_ELECTION_RESULTS_END_MS) {
    return <>CC Elections voting has closed. Final results are scheduled for <strong>16 July 2026</strong>.</>;
  }
  if (nowMs < CC_ELECTION_UPDATE_END_MS) {
    return <>The Update Committee governance action submission is scheduled for <strong>1 August 2026</strong>.</>;
  }
  return <>The 2026 CC Elections timeline has concluded. The published timeline remains available for reference.</>;
}

export default function InfoBanner() {
  const [nowMs] = useState(() => Date.now());
  const budgetProcessBanner = useMemo(() => getBudgetProcessBanner(nowMs), [nowMs]);
  const ccElectionBanner    = useMemo(() => getCcElectionBanner(nowMs),    [nowMs]);

  return (
    <section className="budget-process-banner" aria-label="Current governance process information">
      <article className="info-banner-item">
        <div>
          <p className="budget-process-banner-title">Intersect Facilitated Cardano Budget Process</p>
          <p>{budgetProcessBanner}</p>
        </div>
        <a className="budget-process-banner-link" href="/budget">
          View Budget Process
        </a>
      </article>
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
