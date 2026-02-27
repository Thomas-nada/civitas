import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const toc = [
  { id: "cardano-governance", label: "Cardano Governance" },
  { id: "constitution", label: "The Constitution" },
  { id: "dreps", label: "DReps" },
  { id: "spos", label: "Stake Pool Operators" },
  { id: "committee", label: "Constitutional Committee" },
  { id: "governance-actions", label: "Governance Actions" },
  { id: "ncl", label: "Net Change Limit" },
  { id: "scoring", label: "How Scores Work" },
  { id: "history", label: "Snapshot History" },
];

export default function GuidePage() {
  const [history, setHistory] = useState([]);
  const [showAllSnapshots, setShowAllSnapshots] = useState(false);
  const [activeSection, setActiveSection] = useState("cardano-governance");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/snapshot-history")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setHistory(Array.isArray(data?.history) ? data.history : []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const visibleHistory = showAllSnapshots ? history : history.slice(0, 5);

  function renderSection() {
    switch (activeSection) {

      case "cardano-governance":
        return (
          <section className="wiki-section panel">
            <h2>How Cardano Governance Works</h2>
            <p>
              Cardano's governance model — introduced by the Conway era in 2024 — is one of the most
              sophisticated on-chain governance systems in the blockchain industry. Instead of a small
              team or foundation making all decisions, three independent bodies must agree before any
              change to the protocol takes effect.
            </p>

            <h3 className="guide-subhead">The Foundation: A Written Constitution</h3>
            <p>
              Underpinning the entire system is the <strong>Cardano Constitution</strong> — a ratified,
              on-chain document that defines the rules all governance participants must operate within.
              It sets the boundaries for what can be proposed, what the Constitutional Committee must
              enforce, and what the community agreed to when Conway-era governance was activated. Without
              the constitution, there would be no shared reference point for what is and is not legitimate.
            </p>

            <h3 className="guide-subhead">The Three Pillars</h3>
            <div className="guide-three-col">
              <div className="guide-card">
                <p className="guide-card-title">DReps</p>
                <p>Delegated Representatives. Ada holders delegate their voting power to a DRep they trust.
                DReps vote on most governance actions on behalf of their delegators.</p>
              </div>
              <div className="guide-card">
                <p className="guide-card-title">SPOs</p>
                <p>Stake Pool Operators. The people who run the nodes that secure Cardano's blockchain.
                SPOs have voting rights on a specific subset of governance actions that affect the protocol directly.</p>
              </div>
              <div className="guide-card">
                <p className="guide-card-title">Constitutional Committee</p>
                <p>A small group of elected members who act as constitutional guardians. They can veto
                any governance action they deem unconstitutional, regardless of how DReps and SPOs vote.</p>
              </div>
            </div>

            <h3 className="guide-subhead">Why Three Bodies?</h3>
            <p>
              The three-body design prevents any single group from having unchecked control. DReps represent
              the broader Ada-holding community. SPOs represent the infrastructure operators who run the
              network. The Constitutional Committee protects the foundational rules that all three bodies
              agreed to when Cardano's constitution was ratified.
            </p>
            <p>
              A governance action typically needs supermajority support from both DReps and SPOs (where
              applicable), <em>and</em> must not be vetoed by the Constitutional Committee. All three
              checks must pass for a proposal to be enacted.
            </p>

            <h3 className="guide-subhead">The Role of Ada Holders</h3>
            <p>
              If you hold Ada, you are part of Cardano governance — even if indirectly. You delegate your
              voting power to a DRep. If you do not actively choose one, your stake is effectively silent.
              Choosing a DRep who votes and explains their reasoning is the single most impactful governance
              decision most Ada holders will make.
            </p>
            <p>
              Civitas exists to make it easy to evaluate those choices. Who is actually showing up? Who votes
              with rationale? Who responds quickly? The data is all on-chain — we just make it readable.
            </p>
          </section>
        );

      case "constitution":
        return (
          <section className="wiki-section panel">
            <h2>The Cardano Constitution</h2>
            <p>
              The Cardano Constitution is the foundational legal and governance document of the Cardano
              blockchain. It was ratified by the community in late 2024 through a global series of
              constitutional conventions and an on-chain vote, making it one of the most broadly
              legitimised governance documents in the blockchain industry.
            </p>

            <h3 className="guide-subhead">What It Does</h3>
            <p>
              The constitution defines the rights and responsibilities of all Cardano participants,
              the rules by which governance actions must be evaluated, and the guardrails that protect
              the protocol from harmful changes. It is not just a philosophical statement — it contains
              concrete, enforceable rules. Protocol parameters must stay within constitution-defined
              ranges. Treasury withdrawals must comply with the Net Change Limit. The Constitutional
              Committee exists specifically to enforce these rules on every governance action.
            </p>
            <p>
              Critically, the constitution is itself subject to governance. It can be amended through
              a Constitutional Amendment action, which requires DRep supermajority approval and CC
              ratification. This means the community can evolve its own rules — but only through the
              same deliberate, checked process that governs everything else.
            </p>

            <h3 className="guide-subhead">On-Chain Anchoring</h3>
            <p>
              The constitution is anchored on-chain via a content hash. The hash stored on the Cardano
              ledger points to the canonical document, making it verifiable that the text has not been
              altered since ratification. When the CC reviews a governance action for constitutionality,
              they are evaluating it against this anchored text — not an informal understanding or
              social consensus.
            </p>

            <h3 className="guide-subhead">The Interim Constitution</h3>
            <p>
              Before the full constitution was ratified, Cardano operated under an interim constitution
              — a temporary document that allowed Conway-era governance to begin while the community
              worked through the convention process. The interim constitution was replaced by the
              ratified constitution once the on-chain vote concluded. Historical governance actions
              submitted under the interim constitution were reviewed against its rules at the time.
            </p>

            <h3 className="guide-subhead">Why It Matters for This Tool</h3>
            <p>
              Every metric on Civitas is ultimately a measure of how well governance participants are
              fulfilling their constitutional roles. A DRep who never votes is failing their delegators
              as defined by the governance model the constitution establishes. A CC member who votes
              without explanation is making constitutional judgements that the community cannot audit.
              The constitution is the standard — Civitas measures performance against it.
            </p>
          </section>
        );

      case "dreps":
        return (
          <section className="wiki-section panel">
            <h2>Delegated Representatives (DReps)</h2>
            <p>
              DReps are the primary voting actors in Cardano governance. Any Ada holder can register as a
              DRep. When you delegate to a DRep, your Ada's proportional weight is added to their voting
              power. DReps vote on the vast majority of governance actions, including treasury withdrawals,
              protocol parameter changes, and hard forks.
            </p>

            <h3 className="guide-subhead">How DRep Voting Power Works</h3>
            <p>
              Voting power is denominated in lovelace (1 ada = 1,000,000 lovelace). A DRep's power equals
              the total active stake delegated to them. Power is not fixed — it changes every epoch as
              delegators join or leave. A DRep with 2% of total active voting power effectively controls
              2% of the DRep vote on any proposal they vote on.
            </p>
            <p>
              Two special "DReps" exist by default: <strong>Always Abstain</strong> and{" "}
              <strong>Always No Confidence</strong>. Delegating to Always Abstain keeps your stake counted
              for quorum but never casts a directional vote. Always No Confidence is a permanent no-confidence
              signal. Both are excluded from active voting power calculations on this dashboard.
            </p>

            <h3 className="guide-subhead">What to Look For</h3>
            <p>
              A high attendance score means the DRep is actually voting — not just registered and collecting
              delegation rewards while being absent. Transparency tells you whether they are explaining their
              votes with a rationale. A DRep who votes but never explains why is harder to hold accountable
              than one who publishes clear reasoning on every vote.
            </p>
            <p>
              Alignment shows whether a DRep's yes/no votes tend to match final outcomes. A very high
              alignment score can mean the DRep is thoughtful and reads proposals well — or it can mean
              they are a late voter who waits to see which way the wind is blowing. Use it together with
              the responsiveness column to distinguish the two.
            </p>

            <h3 className="guide-subhead">Term and Eligibility</h3>
            <p>
              DReps become eligible from the epoch they first register. Actions submitted before a DRep
              registered are excluded from their attendance calculation — it would be unfair to count them
              as absent for proposals they had no standing to vote on. This makes the attendance figure
              an honest measure of participation since joining governance.
            </p>

          </section>
        );

      case "spos":
        return (
          <section className="wiki-section panel">
            <h2>Stake Pool Operators (SPOs)</h2>
            <p>
              Stake pool operators run the nodes that produce blocks and secure the Cardano network. In
              governance, SPOs have a focused but important role: they vote on a specific subset of
              governance actions where their infrastructure expertise is most relevant.
            </p>

            <h3 className="guide-subhead">What SPOs Vote On</h3>
            <p>
              SPOs vote on <strong>hard fork initiations</strong>, <strong>protocol parameter changes</strong>,{" "}
              <strong>motions of no confidence</strong>, and <strong>updates to the Constitutional Committee</strong>.
              They do not vote on treasury withdrawals or constitutional amendments — those are reserved for
              DReps and the Constitutional Committee. This design gives SPOs a meaningful check on changes
              that directly affect the network's operation and governance structure, without giving them
              authority over how treasury funds are spent.
            </p>

            <h3 className="guide-subhead">SPO Voting Power</h3>
            <p>
              SPO voting power is derived from the total active stake in their pool — not the stake the
              operator personally holds, but all stake delegated to that pool by the community. This ties
              governance influence directly to the trust the community places in each pool operator.
            </p>
            <p>
              A large pool with low governance participation is a meaningful signal: the operator's
              stake-weighted voice is being left unused. The SPO dashboard surface this directly through
              attendance and the active voting power summary at the top of the page.
            </p>

            <h3 className="guide-subhead">Rationale and Accountability</h3>
            <p>
              SPOs are not required to publish rationale for their votes — but the best operators do.
              Transparency scores on the SPO page reflect whether pools are attaching vote metadata or
              rationale anchors. An SPO who consistently votes with clear reasoning is a more accountable
              network participant than one who votes silently.
            </p>

          </section>
        );

      case "committee":
        return (
          <section className="wiki-section panel">
            <h2>Constitutional Committee</h2>
            <p>
              The Constitutional Committee (CC) is Cardano's constitutional safeguard. Members are elected
              through an off-chain election and then their credentials are ratified via a governance action.
              They serve fixed terms. Their role is not to represent the majority —
              it is to protect the constitution from being violated, even by a popular majority.
            </p>

            <h3 className="guide-subhead">How the CC Votes</h3>
            <p>
              CC members vote <strong>Constitutional</strong>, <strong>Unconstitutional</strong>, or{" "}
              <strong>Abstain</strong> on every governance action. If a threshold of CC members rule an
              action unconstitutional, it is blocked — regardless of DRep or SPO votes. This makes the CC
              a hard constitutional brake on the system.
            </p>
            <p>
              CC members do not vote "Yes" or "No" on policy — they vote on constitutionality. A CC member
              who thinks a treasury withdrawal is bad governance policy but constitutional should still vote
              Constitutional. Conflating these roles is one of the most common misunderstandings about the
              CC's function.
            </p>

            <h3 className="guide-subhead">Threshold and Confidence</h3>
            <p>
              The CC has a quorum threshold. If the committee falls below the minimum active members — whether
              through resignations, expired terms, or no-confidence votes — the entire governance system
              enters a protected state where most governance actions cannot be ratified. This incentivises the
              community to maintain an active, healthy CC at all times.
            </p>

            <h3 className="guide-subhead">What Civitas Measures for CC</h3>
            <p>
              CC scoring focuses on three things: <strong>Attendance</strong> (did they vote on every eligible
              action?), <strong>Rationale Quality</strong> (when they declared an action constitutional or
              unconstitutional, did they publish a reachable, structured, constitution-grounded rationale?),
              and <strong>Responsiveness</strong> (how quickly did they vote after a proposal was submitted?).
            </p>
            <p>
              Alignment (outcome matching) is excluded: a CC member's job is constitutional review, not
              predicting majority outcomes.
            </p>

            <h3 className="guide-subhead">Terms and Eligibility</h3>
            <p>
              Each CC member has a seat start epoch and an expiration epoch. Civitas uses these term boundaries
              to calculate eligibility accurately — a member cannot be marked absent for proposals that fell
              outside their active term. Members with expired terms are shown with a distinct status indicator.
            </p>

          </section>
        );

      case "governance-actions":
        return (
          <section className="wiki-section panel">
            <h2>Governance Actions</h2>
            <p>
              A governance action is a formal on-chain proposal to change something about Cardano. Anyone can
              submit one by depositing 100,000 ada (refunded if ratified; kept if the proposal expires). Once
              submitted, it enters a fixed 6-epoch voting window.
            </p>

            <h3 className="guide-subhead">Action Types</h3>
            <div className="guide-types-list">
              <div className="guide-type-row">
                <span className="guide-type-label">Hard Fork Initiation</span>
                <span className="guide-type-desc">Triggers an upgrade to a new protocol version. Requires DRep, SPO, and CC approval.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Protocol Parameter Change</span>
                <span className="guide-type-desc">Modifies a protocol parameter such as block size, fees, or staking rewards. DRep and CC required; SPO for security-group params.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Treasury Withdrawal</span>
                <span className="guide-type-desc">Moves Ada from the Cardano treasury to specified addresses. DRep and CC approval required. SPOs do not vote.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Info Action</span>
                <span className="guide-type-desc">A non-binding signal poll with no on-chain effect. Used to gauge community sentiment before a binding proposal.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">No Confidence</span>
                <span className="guide-type-desc">A vote of no confidence in the current Constitutional Committee. If passed, triggers a CC election process.</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">New Constitutional Committee</span>
                <span className="guide-type-desc">Proposes a new CC composition or threshold. Requires DRep and SPO approval; not reviewed by CC (conflict of interest).</span>
              </div>
              <div className="guide-type-row">
                <span className="guide-type-label">Constitutional Amendment</span>
                <span className="guide-type-desc">Changes the text of the Cardano constitution. Requires DRep and CC approval.</span>
              </div>
            </div>

            <h3 className="guide-subhead">Lifecycle of a Proposal</h3>
            <p>
              After submission, a proposal is <strong>Open</strong> while voting is in progress. At the end
              of the voting window it is either <strong>Ratified</strong> (thresholds met) or{" "}
              <strong>Expired</strong> (thresholds not met). Ratified actions are then{" "}
              <strong>Enacted</strong> in the following epoch. Actions can also be{" "}
              <strong>Dropped</strong> if a competing action of the same type was already enacted first.
            </p>
            <p>
              The Actions page shows per-proposal vote breakdowns for all three bodies, current threshold
              requirements, and the live vote power progression so you can see exactly how close each proposal
              is to passing or failing.
            </p>

          </section>
        );

      case "ncl":
        return (
          <section className="wiki-section panel">
            <h2>Net Change Limit (NCL)</h2>
            <p>
              The Net Change Limit is a guardrail on Cardano treasury spending. It defines the maximum total
              ada that can be withdrawn from the treasury within a given governance period — regardless of how
              many individual withdrawal proposals pass.
            </p>

            <h3 className="guide-subhead">Why It Exists</h3>
            <p>
              Without an NCL, a series of individually approved treasury withdrawals could collectively drain
              the treasury far beyond what the community would accept in aggregate. The NCL enforces a spending
              ceiling at the constitutional level, making treasury stewardship a bounded, predictable process.
            </p>
            <p>
              Even if every individual withdrawal proposal passes with full DRep and CC approval, the sum of
              all enacted withdrawals within the period cannot exceed the NCL. This is enforced by the protocol
              itself, not by social convention.
            </p>

            <h3 className="guide-subhead">What Civitas Tracks</h3>
            <p>
              The NCL page shows enacted treasury withdrawals for the current and previous NCL windows,
              measured against the limit for each period. You can see how much of the period's budget has
              been used, which proposals consumed it, and how much headroom remains.
            </p>
            <p>
              This is one of the most direct ways to understand treasury health: not just whether individual
              proposals passed, but what the cumulative draw on Cardano's shared funds has been.
            </p>

          </section>
        );

      case "scoring":
        return (
          <section className="wiki-section panel">
            <h2>How Scores Work</h2>
            <p>
              Every actor on Civitas receives an <strong>Accountability Score</strong> — a weighted composite
              of measurable, on-chain behaviors. The goal is not to produce a single "correct" ranking, but
              to surface objective signals that let you form your own view.
            </p>

            <h3 className="guide-subhead">Attendance (45%)</h3>
            <p>
              The share of eligible proposals an actor actually voted on.{" "}
              <code>cast votes ÷ eligible proposals</code>. Eligibility is role-aware and term-aware:
              DReps are only eligible from their registration epoch, CC members only within their seat term,
              SPOs only on actions requiring SPO participation. An actor cannot be penalised for proposals
              they had no standing to vote on.
            </p>

            <h3 className="guide-subhead">Transparency (30%) — DReps and SPOs only</h3>
            <p>
              The share of cast votes accompanied by a rationale signal —{" "}
              a metadata anchor, IPFS link, or other rationale reference.{" "}
              <code>votes with rationale ÷ votes cast</code>. Voting without explanation is legal
              but weakens democratic accountability. This metric rewards actors who communicate their reasoning.
            </p>

            <h3 className="guide-subhead">Consistency (15%) — DReps and SPOs only</h3>
            <p>
              On proposals with a final binary outcome (yes/no), consistency measures whether the actor's vote
              matched the result. <code>matching votes ÷ comparable votes</code>. Abstain votes are excluded.
              High consistency can mean either strong policy judgement or late voting — pair with responsiveness
              to tell them apart.
            </p>

            <h3 className="guide-subhead">Rationale Quality (35%) — CC only</h3>
            <p>
              For Constitutional Committee members, each vote gets a 0–100 rationale score:
              <br />
              <strong>Availability (0 or 25):</strong> full points only if the rationale URL is valid
              (<code>http(s)</code> or <code>ipfs://</code>) <em>and</em> reachable.
              <br />
              <strong>Structure (0–45):</strong> CIP-136-style fields and checks:
              summary present, rationaleStatement present, summary length ≤ 300 chars, rationaleStatement length ≥ 400 chars,
              optional sections (precedent/counterargument/conclusion), total body length band, and signature containing the member name.
              <br />
              <strong>Constitutional grounding (0–30):</strong> distinct constitution citations in text plus
              <code>RelevantArticles</code> references.
              <br />
              Total body-length band thresholds are: 2000 / 3300 / 4500 / 5900 chars.
              The displayed member value is the average across scoped CC votes.
            </p>

            <h3 className="guide-subhead">Responsiveness (10%)</h3>
            <p>
              How quickly an actor votes after a proposal is submitted.{" "}
              <code>average hours between proposal submission and vote</code>, normalized by:
              <code>max(0, 100 - (avgHours / (24*30))*100)</code>.{" "}
              A responsive actor is engaged and deliberate rather than waiting until the last moment.
            </p>

            <h3 className="guide-subhead">Toggling Metrics</h3>
            <p>
              Each metric can be toggled on or off in the dashboard. When you disable a metric, it is removed
              from the denominator — the score is renormalized over active weights only. This lets you see
              how rankings change when you prioritize different behaviors.
            </p>

            <h3 className="guide-subhead">A Score Is a Starting Point</h3>
            <p>
              A high score means an actor is active, communicative, and prompt — based on observable on-chain
              data. It does not mean their votes are correct, that their policy positions match yours, or that
              they are the right choice for your delegation. Read the individual vote history, check their
              rationales, and use the score as a filter, not a verdict.
            </p>
          </section>
        );

      case "history":
        return (
          <section className="wiki-section panel">
            <h2>Snapshot History</h2>
            <p>
              Civitas captures epoch-boundary snapshots of governance state. Each snapshot preserves the
              complete set of proposals, votes, and actor metrics as they stood at that point in time.
              Historical snapshots let you review how governance looked in a specific epoch without being
              affected by subsequent changes.
            </p>
            <p>
              Click any epoch link below to open that snapshot in the relevant dashboard.
            </p>

            <div className="wiki-history-box">
              {history.length === 0 ? (
                <p className="muted">No historical snapshots available yet.</p>
              ) : (
                <>
                  {visibleHistory.map((item) => (
                    <p key={item.key}>
                      <span className="mono">Epoch {item.epoch ?? "?"}</span>{" "}-{" "}
                      <Link className="inline-link" to={`/dreps?snapshot=${encodeURIComponent(item.key)}`}>DRep</Link>{" "}|{" "}
                      <Link className="inline-link" to={`/spos?snapshot=${encodeURIComponent(item.key)}`}>SPO</Link>{" "}|{" "}
                      <Link className="inline-link" to={`/committee?snapshot=${encodeURIComponent(item.key)}`}>Committee</Link>{" "}|{" "}
                      <Link className="inline-link" to={`/actions?snapshot=${encodeURIComponent(item.key)}`}>Actions</Link>
                    </p>
                  ))}
                  {history.length > 5 ? (
                    <button type="button" className="mode-btn" onClick={() => setShowAllSnapshots((v) => !v)}>
                      {showAllSnapshots ? "Collapse snapshot list" : `Show all ${history.length} snapshots`}
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </section>
        );

      default:
        return null;
    }
  }

  return (
    <main className="shell wiki-guide-shell">
      <header className="hero wiki-header">
        <h1>Governance Guide</h1>
        <p>Everything you need to understand Cardano governance and how to use Civitas to follow it.</p>
      </header>

      <section className="wiki-layout">
        <aside className="wiki-sidebar panel">
          <h3>Contents</h3>
          <nav aria-label="Guide sections" className="wiki-nav">
            {toc.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? "active" : ""}
                onClick={() => setActiveSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <article className="wiki-content">
          {renderSection()}
        </article>
      </section>
    </main>
  );
}
