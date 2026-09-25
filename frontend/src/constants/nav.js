// Primary navigation, shared by the topbar, the mobile drawer and the footer.
export const NAV_GROUPS = [
  {
    key: "governance",
    label: "Governance",
    links: [
      { to: "/actions", label: "Governance Actions", hint: "Every proposal, its votes and thresholds" },
      { to: "/governance/rationales", label: "Rationales Archive", hint: "Vote rationales, mirrored and searchable" },
      { to: "/constitution", label: "Constitution", hint: "The current text, verified against its on-chain hash" },
      { to: "/treasury", label: "Treasury", hint: "Withdrawals, budgets and the net-change limit" },
      { to: "/surveys", label: "Surveys & Polls", hint: "CIP-179 surveys and their results" }
    ]
  },
  {
    key: "participants",
    label: "Participants",
    links: [
      { to: "/dreps", label: "DReps", hint: "Delegated representatives and their records" },
      { to: "/spos", label: "SPOs", hint: "Stake pool operators in governance" },
      { to: "/committee", label: "Constitutional Committee", hint: "Members, terms and constitutionality votes" }
    ]
  },
  {
    key: "insights",
    label: "Insights",
    links: [
      { to: "/epochs", label: "Epoch Calendar", hint: "Deadlines and expiries by epoch" },
      { to: "/stats", label: "Governance Stats", hint: "Participation, power and trends" },
      { to: "/guide", label: "Guides", hint: "How Cardano governance works" },
      { to: "/cips", label: "CIP Library", hint: "Improvement proposals, searchable" },
      { to: "/about", label: "About Civitas", hint: "The project, the data and the team" }
    ]
  }
];
