// A CIP-179 role, coloured the same wherever a survey names one.
import { Pill } from "../../ui";

const TONE = { DRep: "drep", SPO: "spo", CC: "cc", Stakeholder: "neutral", Keyholder: "neutral" };

export default function RolePill({ role, size = "sm" }) {
  return <Pill tone={TONE[role] || "neutral"} size={size}>{role}</Pill>;
}
