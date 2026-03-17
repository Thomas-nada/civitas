export const SOFT_COERCED_DREPS = [
  {
    id: "drep1ygr9tuapcanc3kpeyy4dc3vmrz9cfe5q7v9wj3x9j0ap3tswtre9j",
    label: "Default Delegation Monitor List",
    reason:
      "Included in the local awareness list because some users may have delegated through default wallet flows rather than an explicit DRep comparison flow."
  }
];

export function getSoftCoercedDrepMatch(drepIdRaw) {
  const target = String(drepIdRaw || "").trim().toLowerCase();
  if (!target) return null;
  return (
    SOFT_COERCED_DREPS.find(
      (entry) => String(entry?.id || "").trim().toLowerCase() === target
    ) || null
  );
}
