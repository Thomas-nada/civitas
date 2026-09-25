// Small inline icon set (stroke icons, 1.75px), sized by the `size` prop.
function Svg({ size = 16, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconChevronDown = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const IconChevronUp = (p) => <Svg {...p}><path d="m18 15-6-6-6 6" /></Svg>;
export const IconChevronLeft = (p) => <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>;
export const IconChevronRight = (p) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>;
export const IconClose = (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>;
export const IconSearch = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>;
export const IconSun = (p) => <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Svg>;
export const IconMoon = (p) => <Svg {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></Svg>;
export const IconMenu = (p) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>;
export const IconExternal = (p) => <Svg {...p}><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></Svg>;
export const IconCopy = (p) => <Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></Svg>;
export const IconCheck = (p) => <Svg {...p}><path d="m5 12 5 5L20 7" /></Svg>;
export const IconInfo = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>;
export const IconAlert = (p) => <Svg {...p}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></Svg>;
export const IconArrowUp = (p) => <Svg {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Svg>;
export const IconArrowDown = (p) => <Svg {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></Svg>;
export const IconArrowLeft = (p) => <Svg {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Svg>;
export const IconArrowRight = (p) => <Svg {...p}><path d="M5 12h14M12 5l7 7-7 7" /></Svg>;
export const IconSort = (p) => <Svg {...p}><path d="M8 5v14M5 8l3-3 3 3M16 19V5M13 16l3 3 3-3" /></Svg>;
export const IconFilter = (p) => <Svg {...p}><path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" /></Svg>;
export const IconBug = (p) => <Svg {...p}><path d="M8 9a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0V9Z" /><path d="M3 13h5M16 13h5M5 7l3 2M19 7l-3 2M5 19l3-2M19 19l-3-2M10 4l1 2M14 4l-1 2" /></Svg>;
export const IconCalendar = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></Svg>;
export const IconRefresh = (p) => <Svg {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" /></Svg>;
export const IconDownload = (p) => <Svg {...p}><path d="M12 3v12M6 11l6 6 6-6M4 21h16" /></Svg>;
export const IconLink = (p) => <Svg {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></Svg>;
export const IconUser = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>;
export const IconUsers = (p) => <Svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-5-6.7" /></Svg>;
export const IconVote = (p) => <Svg {...p}><path d="m9 12 2 2 4-5" /><rect x="3" y="4" width="18" height="16" rx="2" /></Svg>;
export const IconClock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const IconDots = (p) => <Svg {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></Svg>;
export const IconX = (p) => (
  <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true" focusable="false">
    <path d="M714.2 519.3 1160.9 0H1055L667.1 450.9 357.5 0H0L468.5 681.8 0 1226.4h105.9l409.6-476.2 327 476.2H1200L714.2 519.3zM569.2 687.9l-47.5-68L149.4 87.2h162.6l300.5 430.3 47.5 68 390.8 559.4H888.2L569.2 687.9z" />
  </svg>
);
