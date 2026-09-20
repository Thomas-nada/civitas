import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";
import { getSoftCoercedDrepMatch } from "../constants/softCoercedDreps";
import { SHOW_DELEGATION_AWARENESS_UI } from "../constants/featureFlags";
import { SIGN_KEY_LABELS, VISIBLE_ROLES } from "../lib/wallet/roles";
import { WalletMark } from "./wallet/WalletPicker";
import { ROLE_ICONS } from "./wallet/roleIcons";
import { IconCheck, IconChevronDown, IconCopy, IconLogout, IconProfile, IconSwap, IconTerminal, IconUsers, IconWallet } from "./wallet/icons";

const NAV_GROUPS = [
  {
    key: "governance",
    label: "Governance",
    links: [
      { to: "/actions", label: "Governance Actions" },
      // { to: "/actions/submit", label: "Submit Governance Action" }, // hidden: WIP
      { to: "/governance/rationales", label: "Rationales Archive" },
      { to: "/constitution", label: "Read the Cardano Constitution" },
      { to: "/treasury", label: "Treasury" },
      { to: "/surveys", label: "Surveys & Polls" }
    ]
  },
  {
    key: "participants",
    label: "Participants",
    links: [
      { to: "/dreps", label: "DReps" },
      { to: "/spos", label: "SPOs" },
      { to: "/committee", label: "Constitutional Committee" }
    ]
  },
  {
    key: "insights",
    label: "Insights",
    links: [
      { to: "/epochs", label: "Epoch Calendar" },
      { to: "/stats", label: "Governance Stats" },
      { to: "/guide", label: "Governance Guides" },
      { to: "/cips", label: "CIP Library" },
      { to: "/about", label: "About Civitas" }
    ]
  }
];

function isPathMatch(pathname, target) {
  if (!target) return false;
  if (pathname === target) return true;
  return pathname.startsWith(`${target}/`);
}

function getCurrentNavGroupKey(pathname) {
  const cleanPath = String(pathname || "");
  for (const group of NAV_GROUPS) {
    if (group.links.some((link) => isPathMatch(cleanPath, link.to))) {
      return group.key;
    }
  }
  return NAV_GROUPS[0]?.key || "";
}

function getCurrentNavItemPath(pathname) {
  const cleanPath = String(pathname || "");
  if (cleanPath === "/") return "/actions";
  let best = "";
  for (const group of NAV_GROUPS) {
    for (const link of group.links) {
      if (!isPathMatch(cleanPath, link.to)) continue;
      if (link.to.length > best.length) best = link.to;
    }
  }
  return best;
}

function formatAda(lovelace) {
  const amount = Number(lovelace || 0) / 1_000_000;
  if (!Number.isFinite(amount)) return "N/A";
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ada`;
}

function networkLabel(netId) {
  if (netId === 1) return "Mainnet";
  if (netId === 0) return "Testnet";
  return "Unknown";
}

/** Shortens a long id (drep1…, stake1…) for the account menu; the full value stays in the title. */
function truncateMiddle(id, head = 12, tail = 6) {
  const s = String(id || "");
  return s.length <= head + tail + 1 ? s : `${s.slice(0, head)}…${s.slice(-tail)}`;
}

/** The session's mark: the wallet's logo, or a terminal glyph for a cardano-signer session. */
function SessionMark({ wallet, size }) {
  if (!wallet.isCliSession) return <WalletMark name={wallet.walletName} icon={wallet.walletIcon} size={size} />;
  return (
    <span className="wallet-mark wallet-mark--mono wallet-mark--signer" aria-hidden="true" style={{ width: size, height: size }}>
      <IconTerminal size={Math.round(size * 0.55)} />
    </span>
  );
}

function CopyIdButton({ value }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked in an insecure context; the id stays selectable.
    }
  }
  return (
    <button
      type="button"
      className={`copy-id-btn${copied ? " is-copied" : ""}`}
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy your id"}
      title={copied ? "Copied" : "Copy your id"}
    >
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
    </button>
  );
}


function BrandMark({ theme, alertActive }) {
  const dark = theme !== "light";
  const outerA = dark ? "#50c4ff" : "#1f7fc8";
  const outerB = dark ? "#55f2c9" : "#129f8d";
  const ring = dark ? "#ecfffc" : "#000000";
  const glowCore = alertActive ? "#ff4d4d" : (dark ? "#caffea" : "#000000");
  const glowMid = alertActive ? "#ff3b30" : (dark ? "#46ff9b" : "#12b886");
  const glowOpacity = alertActive ? "0.95" : (dark ? "0.95" : "0.62");
  const centerDot = alertActive ? "#ff1e1e" : (dark ? "#59ff9d" : "#0f8f73");

  return (
    <svg className="brand-mark-svg" viewBox="24 48 208 164" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="topbarLaserGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={glowCore} stopOpacity={dark ? "1" : "0.35"} />
          <stop offset="45%" stopColor={glowMid} stopOpacity={glowOpacity} />
          <stop offset="100%" stopColor={glowMid} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M38 160c24 24 54 36 90 36 39 0 68-15 90-41" fill="none" stroke={outerA} strokeWidth="12" strokeLinecap="round" />
      <path d="M38 106c24-31 53-46 89-46 38 0 68 15 91 44" fill="none" stroke={outerB} strokeWidth="12" strokeLinecap="round" />
      <circle cx="128" cy="128" r="48" fill="none" stroke={ring} strokeWidth="10" />
      <circle cx="128" cy="128" r="22" fill="none" stroke={ring} strokeWidth="10" />
      <circle cx="128" cy="128" r="18" fill="url(#topbarLaserGlow)" />
      <circle cx="128" cy="128" r="5" fill={centerDot} />
    </svg>
  );
}

function EasterBrandMark({ alertActive }) {
  const body      = alertActive ? "#ff6b6b" : "#fde047";
  const bodyShade = alertActive ? "#ff3b30" : "#facc15";
  const wing      = alertActive ? "#ff8080" : "#fef08a";
  const beak      = alertActive ? "#ff3b30" : "#f97316";

  return (
    <svg className="brand-mark-svg" viewBox="24 48 208 164" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="chickBodyGrad" cx="38%" cy="32%" r="62%">
          <stop offset="0%"   stopColor="#fefce8" />
          <stop offset="55%"  stopColor={body} />
          <stop offset="100%" stopColor={bodyShade} />
        </radialGradient>
      </defs>
      <ellipse cx="116" cy="58" rx="7" ry="13" fill={body} transform="rotate(-18,116,58)" />
      <ellipse cx="128" cy="54" rx="7" ry="14" fill={body} />
      <ellipse cx="140" cy="58" rx="7" ry="13" fill={body} transform="rotate(18,140,58)" />
      <ellipse cx="128" cy="154" rx="54" ry="46" fill="url(#chickBodyGrad)" />
      <circle cx="128" cy="93" r="37" fill="url(#chickBodyGrad)" />
      <ellipse cx="74"  cy="150" rx="22" ry="15" fill={wing} opacity="0.92" transform="rotate(-22,74,150)" />
      <ellipse cx="182" cy="150" rx="22" ry="15" fill={wing} opacity="0.92" transform="rotate(22,182,150)" />
      <polygon points="128,106 117,119 139,119" fill={beak} />
      <circle cx="113" cy="85" r="5.5" fill="#1c0a00" />
      <circle cx="143" cy="85" r="5.5" fill="#1c0a00" />
      <circle cx="115" cy="83" r="2"   fill="white" opacity="0.85" />
      <circle cx="145" cy="83" r="2"   fill="white" opacity="0.85" />
      <line x1="112" y1="197" x2="100" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="112" y1="197" x2="112" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="112" y1="197" x2="124" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="144" y1="197" x2="132" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="144" y1="197" x2="144" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="144" y1="197" x2="156" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export default function AppTopbar({ theme = "dark", onToggleTheme, isEaster = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentNavGroupKey = useMemo(
    () => getCurrentNavGroupKey(location.pathname),
    [location.pathname]
  );
  const currentNavItemPath = useMemo(
    () => getCurrentNavItemPath(location.pathname),
    [location.pathname]
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const headerRef = useRef(null);
  const wallet = useContext(WalletContext);
  // Signed-out role shortcuts (the chevron next to "Sign in") and the signed-in
  // account menu share one anchor so an outside click or Escape closes either.
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const walletMenuRef = useRef(null);
  const accountMenuOpen = Boolean(wallet?.walletMenuOpen && wallet?.loggedIn);
  useEffect(() => {
    if (!accountMenuOpen && !roleMenuOpen) return;
    function closeMenus() {
      setRoleMenuOpen(false);
      if (accountMenuOpen) wallet.setWalletMenuOpen(false);
    }
    function handleOutside(e) {
      if (walletMenuRef.current && !walletMenuRef.current.contains(e.target)) closeMenus();
    }
    function handleKey(e) {
      if (e.key === "Escape") closeMenus();
    }
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [accountMenuOpen, roleMenuOpen, wallet]);

  // The id shown (and copied) in the account menu: the credential the session
  // proved (DRep id, pool id or CC hot id) for a cardano-signer session, the
  // DRep id when acting as a DRep, else the reward address.
  const signerIdentity = wallet?.signerIdentity;
  const accountId = wallet?.isCliSession
    ? String(signerIdentity?.drepId || signerIdentity?.poolId || signerIdentity?.ccHotId || signerIdentity?.ccColdId || "")
    : wallet?.actingAsDrep
      ? String(wallet.walletDrep?.dRepIDCip105 || "")
      : String(wallet?.walletRewardAddress || "");

  // Re-enters the sign-in dialog on the DRep role; the current session ends
  // because the DRep key is a different signer.
  function switchToDrepRole() {
    wallet.disconnectWallet();
    wallet.openSignIn("drep");
  }
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugNotice, setBugNotice] = useState("");
  const [bugForm, setBugForm] = useState({
    category: "ui",
    title: "",
    description: "",
    expected: "",
    steps: "",
    contact: ""
  });
  const [hasNewBugSignal, setHasNewBugSignal] = useState(false);
  const [latestBugId, setLatestBugId] = useState("");
  const [walletDelegation, setWalletDelegation] = useState(null);
  const [walletDelegationLoading, setWalletDelegationLoading] = useState(false);
  const [walletDelegationError, setWalletDelegationError] = useState("");
  const [softCoercedDismissed, setSoftCoercedDismissed] = useState(false);

  const matchedSoftCoercedDrep = useMemo(() => {
    return getSoftCoercedDrepMatch(walletDelegation?.delegatedDrepLiteralRaw);
  }, [walletDelegation]);

  // "Acting as a DRep" model: the wallet may be a registered DRep, but the DRep
  // profile/badge only surface when the user signed in with the DRep key.
  const isRegisteredDrep = Boolean(wallet?.walletDrep);
  const actingAsDrep = Boolean(wallet?.actingAsDrep);

  const softCoercedDismissKey = useMemo(() => {
    const reward = String(wallet?.walletRewardAddress || "").trim().toLowerCase();
    const drepId = String(matchedSoftCoercedDrep?.id || "").trim().toLowerCase();
    if (!reward || !drepId) return "";
    return `civitas.softCoercedDrep.dismissed:${reward}:${drepId}`;
  }, [wallet?.walletRewardAddress, matchedSoftCoercedDrep]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileNavOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [mobileNavOpen]);

  useEffect(() => {
    const rewardAddress = String(wallet?.walletRewardAddress || "").trim();
    if (!wallet?.walletApi || !rewardAddress) {
      setWalletDelegation(null);
      setWalletDelegationLoading(false);
      setWalletDelegationError("");
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function loadWalletDelegation() {
      setWalletDelegationLoading(true);
      setWalletDelegationError("");
      try {
        const res = await fetch(`/api/wallet-delegation?rewardAddress=${encodeURIComponent(rewardAddress)}`, {
          signal: controller.signal
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to lookup wallet delegation.");
        if (!active) return;
        setWalletDelegation(data);
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setWalletDelegation(null);
        setWalletDelegationError(String(error?.message || "Failed to lookup wallet delegation."));
      } finally {
        if (active) setWalletDelegationLoading(false);
      }
    }

    loadWalletDelegation();
    return () => {
      active = false;
      controller.abort();
    };
  }, [wallet?.walletApi, wallet?.walletRewardAddress]);

  useEffect(() => {
    if (!softCoercedDismissKey) {
      setSoftCoercedDismissed(false);
      return;
    }
    try {
      setSoftCoercedDismissed(window.localStorage.getItem(softCoercedDismissKey) === "1");
    } catch {
      setSoftCoercedDismissed(false);
    }
  }, [softCoercedDismissKey]);

  function dismissSoftCoercedPrompt() {
    if (!softCoercedDismissKey) return;
    try {
      window.localStorage.setItem(softCoercedDismissKey, "1");
    } catch {
      // Ignore storage failures.
    }
    setSoftCoercedDismissed(true);
  }

  function openDrepListForRedelegation() {
    wallet?.setWalletMenuOpen(false);
    navigate("/dreps");
  }

  useEffect(() => {
    let stop = false;

    async function pollBugSignal() {
      let token = "";
      let seenId = "";
      try {
        token = String(sessionStorage.getItem("civitas.bugs.token") || "").trim();
        seenId = String(sessionStorage.getItem("civitas.bugs.lastSeenId") || "").trim();
      } catch {
        token = "";
        seenId = "";
      }
      if (!token) {
        if (!stop) setHasNewBugSignal(false);
        return;
      }
      try {
        const res = await fetch("/api/bug-reports?limit=1", {
          headers: { "x-bug-admin-token": token }
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const newestId = String(data?.reports?.[0]?.id || "").trim();
        if (!newestId || stop) return;
        setLatestBugId(newestId);
        if (!seenId) {
          setHasNewBugSignal(true);
          return;
        }
        setHasNewBugSignal(newestId !== seenId);
      } catch {
        // Ignore background signal errors.
      }
    }

    pollBugSignal();
    const id = setInterval(pollBugSignal, 20_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (location.pathname !== "/bugs") return;
    if (!latestBugId) return;
    try {
      sessionStorage.setItem("civitas.bugs.lastSeenId", latestBugId);
    } catch {
      // Ignore storage failures.
    }
    setHasNewBugSignal(false);
  }, [location.pathname, latestBugId]);

  function updateBugField(key, value) {
    setBugForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitBugReport(event) {
    event.preventDefault();
    if (bugSubmitting) return;
    setBugNotice("");
    const title = String(bugForm.title || "").trim();
    const description = String(bugForm.description || "").trim();
    if (title.length < 3) {
      setBugNotice("Title must be at least 3 characters.");
      return;
    }
    if (description.length < 10) {
      setBugNotice("Description must be at least 10 characters.");
      return;
    }
    try {
      setBugSubmitting(true);
      const payload = {
        ...bugForm,
        page: `${location.pathname}${location.search || ""}`,
        userAgent: navigator.userAgent || "",
        viewport: `${window.innerWidth}x${window.innerHeight}`
      };
      const res = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit bug report.");
      const submittedId = String(data?.id || "").trim();
      if (submittedId) {
        setLatestBugId(submittedId);
        setHasNewBugSignal(true);
      }
      setBugNotice("Bug report submitted. Thank you.");
      setBugForm({
        category: "ui",
        title: "",
        description: "",
        expected: "",
        steps: "",
        contact: ""
      });
    } catch (error) {
      setBugNotice(error?.message || "Failed to submit bug report.");
    } finally {
      setBugSubmitting(false);
    }
  }

  return (
    <>
    <header className="topbar" ref={headerRef}>
      <div className="topbar-inner shell">
        <div className="topbar-row-main">
          <div className="topbar-left">
            <Link to="/" className="brand-home-link" aria-label="Go to Civitas home">
              <div className="brand-lockup" aria-label="Civitas">
                <span className={`brand-mark${hasNewBugSignal ? " is-alert" : ""}`} title={hasNewBugSignal ? "New bug report signal" : "Civitas logo"}>
                  {isEaster
                    ? <EasterBrandMark alertActive={hasNewBugSignal} />
                    : <BrandMark theme={theme} alertActive={hasNewBugSignal} />
                  }
                </span>
                <div className="brand-text">
                  <p className="brand">Civitas</p>
                </div>
              </div>
            </Link>
          </div>

          <button
            type="button"
            className={`mobile-nav-toggle${mobileNavOpen ? " is-open" : ""}`}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>

          <nav className={`topnav topnav-row${mobileNavOpen ? " mobile-nav-open" : ""}`}>
            {NAV_GROUPS.map((group) => (
              <div
                key={group.key}
                className={`topnav-group${currentNavGroupKey === group.key ? " is-current" : ""}`}
              >
                <button
                  type="button"
                  className="topnav-group-label"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {group.label}
                </button>
                <div className="topnav-group-links" role="menu" aria-label={`${group.label} links`}>
                  {group.links.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={currentNavItemPath === item.to ? "topnav-link active" : "topnav-link"}
                      role="menuitem"
                      onClick={(e) => { setMobileNavOpen(false); e.currentTarget.blur(); }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="topbar-controls">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={() => {
                setBugNotice("");
                setBugModalOpen(true);
              }}
              aria-label="Report a bug"
              title="Report a bug"
            >
              Report Bug
            </button>

            {/* Sign-in / account control (DRepTalk-style: role shortcuts when
                signed out, an identity pill with an account menu when signed in) */}
            {wallet ? (
              <div className="wallet-menu-wrap topbar-wallet" ref={walletMenuRef}>
                {wallet.loggedIn ? (
                  <button
                    type="button"
                    className={`wallet-pill${wallet.walletMenuOpen ? " is-open" : ""}`}
                    onClick={() => wallet.setWalletMenuOpen((v) => !v)}
                    aria-haspopup="dialog"
                    aria-expanded={wallet.walletMenuOpen}
                    aria-label={`Account: ${wallet.walletName}, signed in as ${wallet.roleLabel}`}
                  >
                    <SessionMark wallet={wallet} size={20} />
                    <span className="wallet-pill-name">{wallet.walletName}</span>
                    <span className={`role-badge role-badge--${wallet.role}`}>{wallet.roleLabel}</span>
                    <IconChevronDown size={14} />
                  </button>
                ) : (
                  <div className="signin-entry">
                    <button
                      type="button"
                      className="wallet-trigger signin-entry-main"
                      onClick={() => { setRoleMenuOpen(false); wallet.openSignIn(); }}
                    >
                      <IconWallet size={15} />
                      <span>Sign in</span>
                    </button>
                    <button
                      type="button"
                      className="wallet-trigger signin-entry-more"
                      aria-label="Sign-in options"
                      aria-haspopup="menu"
                      aria-expanded={roleMenuOpen}
                      onClick={() => setRoleMenuOpen((v) => !v)}
                    >
                      <IconChevronDown size={14} />
                    </button>
                  </div>
                )}

                {!wallet.loggedIn && roleMenuOpen ? (
                  <div className="wallet-popover panel account-menu role-menu" role="menu" aria-label="Sign in as">
                    {VISIBLE_ROLES.map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        role="menuitem"
                        className="account-menu-item"
                        onClick={() => { setRoleMenuOpen(false); wallet.openSignIn(r.key); }}
                      >
                        {ROLE_ICONS[r.key]}
                        Enter as {r.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {wallet.walletMenuOpen && wallet.loggedIn ? (
                  <div className="wallet-popover panel account-menu" role="dialog" aria-label="Account">
                    <div className="account-menu-head">
                      <SessionMark wallet={wallet} size={36} />
                      <div className="account-menu-head-text">
                        <span className="account-menu-name">
                          {wallet.walletName}
                          <span className={`role-badge role-badge--${wallet.role}`}>{wallet.roleLabel}</span>
                        </span>
                        <span className="account-menu-id mono" title={accountId}>
                          {accountId ? truncateMiddle(accountId) : "No reward address exposed by wallet."}
                        </span>
                      </div>
                      {accountId ? <CopyIdButton value={accountId} /> : null}
                    </div>

                    {wallet.role === "drep" && wallet.walletDrep ? (
                      <Link
                        to={`/dreps/${encodeURIComponent(wallet.walletDrep.dRepIDCip105)}`}
                        className="account-menu-item"
                        onClick={() => wallet.setWalletMenuOpen(false)}
                      >
                        <IconProfile size={16} />
                        My DRep profile
                      </Link>
                    ) : null}
                    {wallet.actingAsSpo ? (
                      <Link
                        to={`/spos/${encodeURIComponent(wallet.signerIdentity.poolId)}`}
                        className="account-menu-item"
                        onClick={() => wallet.setWalletMenuOpen(false)}
                      >
                        <IconProfile size={16} />
                        My pool profile
                      </Link>
                    ) : null}
                    {wallet.actingAsCc && wallet.signerIdentity.ccHotId ? (
                      <Link
                        to={`/committee/${encodeURIComponent(wallet.signerIdentity.ccHotId)}`}
                        className="account-menu-item"
                        onClick={() => wallet.setWalletMenuOpen(false)}
                      >
                        <IconProfile size={16} />
                        My committee profile
                      </Link>
                    ) : null}
                    {!wallet.isCliSession && isRegisteredDrep && !actingAsDrep ? (
                      <button type="button" className="account-menu-item" onClick={switchToDrepRole}>
                        <IconSwap size={16} />
                        Switch to your DRep key
                      </button>
                    ) : null}
                    {!wallet.isCliSession && !isRegisteredDrep ? (
                      <Link to="/dreps" className="account-menu-item" onClick={() => wallet.setWalletMenuOpen(false)}>
                        <IconUsers size={16} />
                        Find a DRep to delegate to
                      </Link>
                    ) : null}

                    <div className="account-menu-meta">
                      <dl>
                        <div>
                          <dt>Network</dt>
                          <dd>{networkLabel(wallet.walletNetworkId)}</dd>
                        </div>
                        {wallet.walletApi ? (
                          <div>
                            <dt>Balance</dt>
                            <dd>{formatAda(wallet.walletLovelace)}</dd>
                          </div>
                        ) : null}
                        <div>
                          <dt>Signing with</dt>
                          <dd>{SIGN_KEY_LABELS[wallet.preferredSignKey] || wallet.preferredSignKey}</dd>
                        </div>
                      </dl>
                      <p className="muted account-menu-note">
                        {wallet.isCliSession
                          ? "Signed in with cardano-signer. Civitas shows your profile and tools; voting and delegation happen from your CLI."
                          : actingAsDrep
                            ? "DRep credential detected — you can vote on governance actions."
                            : isRegisteredDrep
                              ? "Signed in with your stake key. Switch to the DRep key to vote as your DRep."
                              : "No DRep credential — you can delegate to a DRep."}
                      </p>
                      {walletDelegationLoading ? <p className="muted account-menu-note">Checking delegation…</p> : null}
                      {walletDelegationError ? <p className="muted account-menu-note">Delegation check: {walletDelegationError}</p> : null}
                      {SHOW_DELEGATION_AWARENESS_UI && matchedSoftCoercedDrep && !softCoercedDismissed ? (
                        <div className="wallet-antitrust-alert" role="alert">
                          <p>
                            This wallet is delegated to a DRep in the local delegation-awareness list. This does not judge
                            the DRep, but helps surface cases where users may have delegated via default flows.
                          </p>
                          {matchedSoftCoercedDrep.reason ? (
                            <p className="muted">
                              Reason: {matchedSoftCoercedDrep.reason}
                            </p>
                          ) : null}
                          <p className="muted">
                            If this was intentional, you can ignore this. If not, you can re-delegate at any time.
                          </p>
                          <div className="wallet-antitrust-actions">
                            <button type="button" className="mode-btn active" onClick={openDrepListForRedelegation}>
                              Review DRep options
                            </button>
                            <button type="button" className="mode-btn" onClick={dismissSoftCoercedPrompt}>
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <button type="button" className="account-menu-item account-menu-logout" onClick={wallet.disconnectWallet}>
                      <IconLogout size={16} />
                      {wallet.isCliSession ? "Sign out" : "Disconnect"}
                    </button>
                    {wallet.walletError ? <p className="vote-error">{wallet.walletError}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
            <a
              className="social-x-link"
              href="https://x.com/CivitasExplorer"
              target="_blank"
              rel="noreferrer"
              aria-label="Civitas on X"
              title="Civitas on X"
            >
              <svg viewBox="0 0 1200 1227" role="img" aria-hidden="true">
                <path d="M714.2 519.3 1160.9 0H1055L667.1 450.9 357.5 0H0L468.5 681.8 0 1226.4h105.9l409.6-476.2 327 476.2H1200L714.2 519.3zM569.2 687.9l-47.5-68L149.4 87.2h162.6l300.5 430.3 47.5 68 390.8 559.4H888.2L569.2 687.9z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
    {bugModalOpen ? (
      <div className="image-modal-backdrop" role="presentation" onClick={() => setBugModalOpen(false)}>
        <div className="image-modal bug-report-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="image-modal-close" onClick={() => setBugModalOpen(false)}>
            Close
          </button>
          <h3 className="rationale-modal-title">Report a Bug</h3>
          <form className="bug-report-form" onSubmit={submitBugReport}>
            <label>
              Category
              <select value={bugForm.category} onChange={(e) => updateBugField("category", e.target.value)}>
                <option value="ui">UI / UX</option>
                <option value="data">Data issue</option>
                <option value="performance">Performance</option>
                <option value="mobile">Mobile</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Title
              <input
                type="text"
                value={bugForm.title}
                onChange={(e) => updateBugField("title", e.target.value)}
                placeholder="Short summary"
                maxLength={140}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={bugForm.description}
                onChange={(e) => updateBugField("description", e.target.value)}
                placeholder="What happened?"
                rows={4}
                maxLength={4000}
                required
              />
            </label>
            <label>
              Expected (optional)
              <textarea
                value={bugForm.expected}
                onChange={(e) => updateBugField("expected", e.target.value)}
                placeholder="What should have happened?"
                rows={2}
                maxLength={2000}
              />
            </label>
            <label>
              Steps (optional)
              <textarea
                value={bugForm.steps}
                onChange={(e) => updateBugField("steps", e.target.value)}
                placeholder="How can we reproduce it?"
                rows={3}
                maxLength={2000}
              />
            </label>
            <label>
              Contact (optional)
              <input
                type="text"
                value={bugForm.contact}
                onChange={(e) => updateBugField("contact", e.target.value)}
                placeholder="Email or handle"
                maxLength={200}
              />
            </label>
            <p className="mono">Page: {location.pathname}{location.search || ""}</p>
            {bugNotice ? <p className="muted">{bugNotice}</p> : null}
            <div className="vote-confirm-actions">
              <button type="button" className="mode-btn" onClick={() => setBugModalOpen(false)} disabled={bugSubmitting}>
                Cancel
              </button>
              <button type="submit" className="mode-btn active" disabled={bugSubmitting}>
                {bugSubmitting ? "Submitting..." : "Submit Bug Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null}
    </>
  );
}
