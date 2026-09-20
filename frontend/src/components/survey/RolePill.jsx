// A CIP-179 role, coloured the same wherever a survey names one.
const ROLE_COLORS = {
  DRep: "var(--mint)",
  SPO: "var(--amber)",
  CC: "#a78bfa",
  Stakeholder: "rgba(200,200,210,0.6)",
  Keyholder: "rgba(200,200,210,0.6)"
};

export default function RolePill({ role }) {
  const color = ROLE_COLORS[role] || "rgba(200,200,210,0.5)";
  return (
    <span className="pill" style={{ background: `${color}22`, borderColor: `${color}88`, color }}>{role}</span>
  );
}
