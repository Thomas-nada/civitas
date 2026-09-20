// Two-or-more button toggle for role and method choices. The active state is a
// subtle tint, not a solid fill, so it never competes with the primary button.
// `wrap` lets a control with long labels stack on narrow screens.
export default function SegmentedControl({ value, onChange, options, disabled = false, ariaLabel, wrap = false }) {
  return (
    <fieldset className={`segmented${wrap ? " segmented--wrap" : ""}`} aria-label={ariaLabel} disabled={disabled}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            className={`segmented-btn${active ? " is-active" : ""}`}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            disabled={disabled}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </fieldset>
  );
}
