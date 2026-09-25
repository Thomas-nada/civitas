import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { WalletContext } from "../context/WalletContext";
import { getSoftCoercedDrepMatch } from "../constants/softCoercedDreps";
import { SHOW_DELEGATION_AWARENESS_UI } from "../constants/featureFlags";
import { SIGN_KEY_LABELS, VISIBLE_ROLES } from "../lib/wallet/roles";
import { WalletMark } from "./wallet/WalletPicker";
import { ROLE_ICONS } from "./wallet/roleIcons";
import { IconLogout, IconProfile, IconSwap, IconTerminal, IconUsers as IconUsersLegacy, IconWallet } from "./wallet/icons";
import { Button, Field, Input, Modal, Select, Textarea, Menu, MenuItem, MenuSeparator } from "../ui";
import { IconBug, IconCheck, IconChevronDown, IconClose, IconCopy, IconMenu, IconMoon, IconSun, IconX } from "../ui/icons";
import { truncateMiddle } from "../lib/governance/format";
import { NAV_GROUPS } from "../constants/nav";

// Navigation groups live in constants/nav.js (shared with the drawer and footer).

function isPathMatch(pathname, target) {
  if (!target) return false;
  if (pathname === target) return true;
  return pathname.startsWith(`${target}/`);
}

function currentGroupKey(pathname) {
  const p = pathname === "/" ? "/actions" : String(pathname || "");
  for (const group of NAV_GROUPS) {
    if (group.links.some((link) => isPathMatch(p, link.to))) return group.key;
  }
  return "";
}

function currentItemPath(pathname) {
  const p = pathname === "/" ? "/actions" : String(pathname || "");
  let best = "";
  for (const group of NAV_GROUPS) {
    for (const link of group.links) {
      if (isPathMatch(p, link.to) && link.to.length > best.length) best = link.to;
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
    <Button size="sm" variant="ghost" icon={copied ? <IconCheck size={14} /> : <IconCopy size={14} />} onClick={copy} aria-label={copied ? "Copied" : "Copy your id"} title={copied ? "Copied" : "Copy your id"} />
  );
}

function BrandMark({ alertActive }) {
  const glowCore = alertActive ? "#ff4d4d" : "var(--brand-glow-core)";
  const glowMid = alertActive ? "#ff3b30" : "var(--brand-glow-mid)";
  const centerDot = alertActive ? "#ff1e1e" : "var(--brand-dot)";
  return (
    <svg viewBox="24 48 208 164" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="topbarLaserGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={glowCore} stopOpacity="1" />
          <stop offset="45%" stopColor={glowMid} stopOpacity="0.9" />
          <stop offset="100%" stopColor={glowMid} stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M38 160c24 24 54 36 90 36 39 0 68-15 90-41" fill="none" stroke="var(--brand-arc-a)" strokeWidth="12" strokeLinecap="round" />
      <path d="M38 106c24-31 53-46 89-46 38 0 68 15 91 44" fill="none" stroke="var(--brand-arc-b)" strokeWidth="12" strokeLinecap="round" />
      <circle cx="128" cy="128" r="48" fill="none" stroke="var(--brand-ring)" strokeWidth="10" />
      <circle cx="128" cy="128" r="22" fill="none" stroke="var(--brand-ring)" strokeWidth="10" />
      <circle cx="128" cy="128" r="18" fill="url(#topbarLaserGlow)" />
      <circle cx="128" cy="128" r="5" fill={centerDot} />
    </svg>
  );
}

function EasterBrandMark({ alertActive }) {
  const body = alertActive ? "#ff6b6b" : "#fde047";
  const bodyShade = alertActive ? "#ff3b30" : "#facc15";
  const wing = alertActive ? "#ff8080" : "#fef08a";
  const beak = alertActive ? "#ff3b30" : "#f97316";
  return (
    <svg viewBox="24 48 208 164" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="chickBodyGrad" cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="55%" stopColor={body} />
          <stop offset="100%" stopColor={bodyShade} />
        </radialGradient>
      </defs>
      <ellipse cx="116" cy="58" rx="7" ry="13" fill={body} transform="rotate(-18,116,58)" />
      <ellipse cx="128" cy="54" rx="7" ry="14" fill={body} />
      <ellipse cx="140" cy="58" rx="7" ry="13" fill={body} transform="rotate(18,140,58)" />
      <ellipse cx="128" cy="154" rx="54" ry="46" fill="url(#chickBodyGrad)" />
      <circle cx="128" cy="93" r="37" fill="url(#chickBodyGrad)" />
      <ellipse cx="74" cy="150" rx="22" ry="15" fill={wing} opacity="0.92" transform="rotate(-22,74,150)" />
      <ellipse cx="182" cy="150" rx="22" ry="15" fill={wing} opacity="0.92" transform="rotate(22,182,150)" />
      <polygon points="128,106 117,119 139,119" fill={beak} />
      <circle cx="113" cy="85" r="5.5" fill="#1c0a00" />
      <circle cx="143" cy="85" r="5.5" fill="#1c0a00" />
      <circle cx="115" cy="83" r="2" fill="white" opacity="0.85" />
      <circle cx="145" cy="83" r="2" fill="white" opacity="0.85" />
      <line x1="112" y1="197" x2="100" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="112" y1="197" x2="112" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="112" y1="197" x2="124" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="144" y1="197" x2="132" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="144" y1="197" x2="144" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
      <line x1="144" y1="197" x2="156" y2="210" stroke={beak} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

const EMPTY_BUG_FORM = { category: "ui", title: "", description: "", expected: "", steps: "", contact: "" };

export default function AppTopbar({ theme = "dark", onToggleTheme, isEaster = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const groupKey = useMemo(() => currentGroupKey(location.pathname), [location.pathname]);
  const itemPath = useMemo(() => currentItemPath(location.pathname), [location.pathname]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const wallet = useContext(WalletContext);

  // Close the drawer on navigation and lock scroll while it is open.
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    document.body.classList.add("c-scroll-locked");
    const onKey = (e) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("c-scroll-locked"); document.removeEventListener("keydown", onKey); };
  }, [drawerOpen]);

  // Account menu (signed in) shares wallet.walletMenuOpen so other components can open it.
  const accountMenuOpen = Boolean(wallet?.walletMenuOpen && wallet?.loggedIn);
  const accountRef = useRef(null);
  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const onDown = (e) => { if (accountRef.current && !accountRef.current.contains(e.target)) wallet.setWalletMenuOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") wallet.setWalletMenuOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [accountMenuOpen, wallet]);

  // The id shown (and copied) in the account menu.
  const signerIdentity = wallet?.signerIdentity;
  const accountId = wallet?.isCliSession
    ? String(signerIdentity?.drepId || signerIdentity?.poolId || signerIdentity?.ccHotId || signerIdentity?.ccColdId || "")
    : wallet?.actingAsDrep
      ? String(wallet.walletDrep?.dRepIDCip105 || "")
      : String(wallet?.walletRewardAddress || "");

  function switchToDrepRole() {
    wallet.disconnectWallet();
    wallet.openSignIn("drep");
  }

  // Bug report modal.
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [bugNotice, setBugNotice] = useState("");
  const [bugForm, setBugForm] = useState(EMPTY_BUG_FORM);
  const [hasNewBugSignal, setHasNewBugSignal] = useState(false);
  const [latestBugId, setLatestBugId] = useState("");

  // Wallet delegation lookup for the account menu.
  const [walletDelegation, setWalletDelegation] = useState(null);
  const [walletDelegationLoading, setWalletDelegationLoading] = useState(false);
  const [walletDelegationError, setWalletDelegationError] = useState("");
  const [softCoercedDismissed, setSoftCoercedDismissed] = useState(false);
  const matchedSoftCoercedDrep = useMemo(() => getSoftCoercedDrepMatch(walletDelegation?.delegatedDrepLiteralRaw), [walletDelegation]);
  const isRegisteredDrep = Boolean(wallet?.walletDrep);
  const actingAsDrep = Boolean(wallet?.actingAsDrep);
  const softCoercedDismissKey = useMemo(() => {
    const reward = String(wallet?.walletRewardAddress || "").trim().toLowerCase();
    const drepId = String(matchedSoftCoercedDrep?.id || "").trim().toLowerCase();
    if (!reward || !drepId) return "";
    return `civitas.softCoercedDrep.dismissed:${reward}:${drepId}`;
  }, [wallet?.walletRewardAddress, matchedSoftCoercedDrep]);

  useEffect(() => {
    const rewardAddress = String(wallet?.walletRewardAddress || "").trim();
    if (!wallet?.walletApi || !rewardAddress) {
      setWalletDelegation(null);
      setWalletDelegationLoading(false);
      setWalletDelegationError("");
      return undefined;
    }
    let active = true;
    const controller = new AbortController();
    (async () => {
      setWalletDelegationLoading(true);
      setWalletDelegationError("");
      try {
        const res = await fetch(`/api/wallet-delegation?rewardAddress=${encodeURIComponent(rewardAddress)}`, { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to lookup wallet delegation.");
        if (active) setWalletDelegation(data);
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setWalletDelegation(null);
        setWalletDelegationError(String(error?.message || "Failed to lookup wallet delegation."));
      } finally {
        if (active) setWalletDelegationLoading(false);
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [wallet?.walletApi, wallet?.walletRewardAddress]);

  useEffect(() => {
    if (!softCoercedDismissKey) { setSoftCoercedDismissed(false); return; }
    try { setSoftCoercedDismissed(window.localStorage.getItem(softCoercedDismissKey) === "1"); } catch { setSoftCoercedDismissed(false); }
  }, [softCoercedDismissKey]);

  function dismissSoftCoercedPrompt() {
    if (!softCoercedDismissKey) return;
    try { window.localStorage.setItem(softCoercedDismissKey, "1"); } catch { /* ignore */ }
    setSoftCoercedDismissed(true);
  }

  // Admin bug signal: the logo turns red when a new report exists (admin token in session storage).
  useEffect(() => {
    let stop = false;
    async function pollBugSignal() {
      let token = ""; let seenId = "";
      try {
        token = String(sessionStorage.getItem("civitas.bugs.token") || "").trim();
        seenId = String(sessionStorage.getItem("civitas.bugs.lastSeenId") || "").trim();
      } catch { token = ""; seenId = ""; }
      if (!token) { if (!stop) setHasNewBugSignal(false); return; }
      try {
        const res = await fetch("/api/bug-reports?limit=1", { headers: { "x-bug-admin-token": token } });
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        const newestId = String(data?.reports?.[0]?.id || "").trim();
        if (!newestId || stop) return;
        setLatestBugId(newestId);
        setHasNewBugSignal(!seenId || newestId !== seenId);
      } catch { /* ignore */ }
    }
    pollBugSignal();
    const id = setInterval(pollBugSignal, 20_000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (location.pathname !== "/bugs" || !latestBugId) return;
    try { sessionStorage.setItem("civitas.bugs.lastSeenId", latestBugId); } catch { /* ignore */ }
    setHasNewBugSignal(false);
  }, [location.pathname, latestBugId]);

  function updateBugField(key, value) { setBugForm((prev) => ({ ...prev, [key]: value })); }

  async function submitBugReport(event) {
    event.preventDefault();
    if (bugSubmitting) return;
    setBugNotice("");
    const title = String(bugForm.title || "").trim();
    const description = String(bugForm.description || "").trim();
    if (title.length < 3) { setBugNotice("Title must be at least 3 characters."); return; }
    if (description.length < 10) { setBugNotice("Description must be at least 10 characters."); return; }
    try {
      setBugSubmitting(true);
      const payload = { ...bugForm, page: `${location.pathname}${location.search || ""}`, userAgent: navigator.userAgent || "", viewport: `${window.innerWidth}x${window.innerHeight}` };
      const res = await fetch("/api/bug-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit bug report.");
      const submittedId = String(data?.id || "").trim();
      if (submittedId) { setLatestBugId(submittedId); setHasNewBugSignal(true); }
      setBugNotice("Bug report submitted. Thank you.");
      setBugForm(EMPTY_BUG_FORM);
    } catch (error) {
      setBugNotice(error?.message || "Failed to submit bug report.");
    } finally {
      setBugSubmitting(false);
    }
  }

  const themeButton = (
    <Button variant="ghost" icon={theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />} onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} />
  );

  const accountMenu = wallet?.loggedIn && wallet.walletMenuOpen ? (
    <div className="c-menu account-menu" role="dialog" aria-label="Account" style={{ right: 0, top: "calc(100% + 6px)" }}>
      <div className="account-menu__head">
        <SessionMark wallet={wallet} size={36} />
        <div className="account-menu__text">
          <span className="account-menu__name">
            {wallet.walletName}
            <span className={`session-role session-role--${wallet.role}`}>{wallet.roleLabel}</span>
          </span>
          <span className="account-menu__id mono" title={accountId}>
            {accountId ? truncateMiddle(accountId, 14, 8) : "No reward address exposed by wallet."}
          </span>
        </div>
        {accountId ? <CopyIdButton value={accountId} /> : null}
      </div>
      <MenuSeparator />
      {wallet.role === "drep" && wallet.walletDrep ? (
        <MenuItem to={`/dreps/${encodeURIComponent(wallet.walletDrep.dRepIDCip105)}`} icon={<IconProfile size={16} />} close={() => wallet.setWalletMenuOpen(false)}>My DRep profile</MenuItem>
      ) : null}
      {wallet.actingAsSpo ? (
        <MenuItem to={`/spos/${encodeURIComponent(wallet.signerIdentity.poolId)}`} icon={<IconProfile size={16} />} close={() => wallet.setWalletMenuOpen(false)}>My pool profile</MenuItem>
      ) : null}
      {wallet.actingAsCc && wallet.signerIdentity.ccHotId ? (
        <MenuItem to={`/committee/${encodeURIComponent(wallet.signerIdentity.ccHotId)}`} icon={<IconProfile size={16} />} close={() => wallet.setWalletMenuOpen(false)}>My committee profile</MenuItem>
      ) : null}
      {!wallet.isCliSession && isRegisteredDrep && !actingAsDrep ? (
        <MenuItem onClick={switchToDrepRole} icon={<IconSwap size={16} />}>Switch to your DRep key</MenuItem>
      ) : null}
      {!wallet.isCliSession && !isRegisteredDrep ? (
        <MenuItem to="/dreps" icon={<IconUsersLegacy size={16} />} close={() => wallet.setWalletMenuOpen(false)}>Find a DRep to delegate to</MenuItem>
      ) : null}
      <div className="account-menu__meta">
        <dl className="c-kv">
          <div style={{ display: "contents" }}><dt>Network</dt><dd>{networkLabel(wallet.walletNetworkId)}</dd></div>
          {wallet.walletApi ? <div style={{ display: "contents" }}><dt>Balance</dt><dd>{formatAda(wallet.walletLovelace)}</dd></div> : null}
          <div style={{ display: "contents" }}><dt>Signing with</dt><dd>{SIGN_KEY_LABELS[wallet.preferredSignKey] || wallet.preferredSignKey}</dd></div>
        </dl>
        <p className="account-menu__note">
          {wallet.isCliSession
            ? "Signed in with cardano-signer. Civitas shows your profile and tools; voting and delegation happen from your CLI."
            : actingAsDrep
              ? "DRep credential detected: you can vote on governance actions."
              : isRegisteredDrep
                ? "Signed in with your stake key. Switch to the DRep key to vote as your DRep."
                : "No DRep credential: you can delegate to a DRep."}
        </p>
        {walletDelegationLoading ? <p className="account-menu__note">Checking delegation…</p> : null}
        {walletDelegationError ? <p className="account-menu__note">Delegation check: {walletDelegationError}</p> : null}
        {SHOW_DELEGATION_AWARENESS_UI && matchedSoftCoercedDrep && !softCoercedDismissed ? (
          <div className="c-alert c-alert--warning" role="alert" style={{ marginTop: 8 }}>
            <div className="c-alert__body">
              <p>This wallet is delegated to a DRep in the local delegation-awareness list. This does not judge the DRep, but helps surface cases where users may have delegated via default flows.</p>
              {matchedSoftCoercedDrep.reason ? <p className="muted">Reason: {matchedSoftCoercedDrep.reason}</p> : null}
              <p className="muted">If this was intentional, you can ignore this. If not, you can re-delegate at any time.</p>
              <div className="row" style={{ marginTop: 8 }}>
                <Button size="sm" variant="primary" onClick={() => { wallet.setWalletMenuOpen(false); navigate("/dreps"); }}>Review DRep options</Button>
                <Button size="sm" onClick={dismissSoftCoercedPrompt}>Dismiss</Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <MenuSeparator />
      <MenuItem onClick={wallet.disconnectWallet} icon={<IconLogout size={16} />} danger>{wallet.isCliSession ? "Sign out" : "Disconnect"}</MenuItem>
      {wallet.walletError ? <p className="c-field__error" style={{ padding: "4px 12px 8px" }}>{wallet.walletError}</p> : null}
    </div>
  ) : null;

  const sessionControl = wallet ? (
    <div ref={accountRef} style={{ position: "relative", display: "inline-flex" }}>
      {wallet.loggedIn ? (
        <button
          type="button"
          className="session-pill"
          onClick={() => wallet.setWalletMenuOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={wallet.walletMenuOpen}
          aria-label={`Account: ${wallet.walletName}, signed in as ${wallet.roleLabel}`}
        >
          <SessionMark wallet={wallet} size={22} />
          <span className="session-pill__name hide-mobile">{wallet.walletName}</span>
          <span className={`session-role session-role--${wallet.role}`}>{wallet.roleLabel}</span>
          <IconChevronDown size={14} />
        </button>
      ) : (
        <div className="signin-split">
          <Button variant="primary" icon={<IconWallet size={15} />} onClick={() => wallet.openSignIn()}>Sign in</Button>
          <Menu align="right" label="Sign in as" trigger={({ props }) => (
            <Button variant="primary" aria-label="Sign-in options" {...props}><IconChevronDown size={14} /></Button>
          )}>
            {({ close }) => VISIBLE_ROLES.map((r) => (
              <MenuItem key={r.key} icon={ROLE_ICONS[r.key]} close={close} onClick={() => wallet.openSignIn(r.key)}>Enter as {r.label}</MenuItem>
            ))}
          </Menu>
        </div>
      )}
      {accountMenu}
    </div>
  ) : null;

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="app-topbar">
        <div className="app-topbar__inner shell">
          <Link to="/" className="app-topbar__brand" aria-label="Civitas home">
            <span className={`app-brand-mark${hasNewBugSignal ? " is-alert" : ""}`} title={hasNewBugSignal ? "New bug report" : "Civitas"}>
              {isEaster ? <EasterBrandMark alertActive={hasNewBugSignal} /> : <BrandMark alertActive={hasNewBugSignal} />}
            </span>
            <span className="app-brand-word">Civitas</span>
          </Link>

          <nav className="topnav" aria-label="Primary">
            {NAV_GROUPS.map((group) => (
              <div key={group.key} className="topnav__group">
                <Menu label={`${group.label} links`} trigger={({ props }) => (
                  <button type="button" className={`topnav__trigger${groupKey === group.key ? " is-current" : ""}`} {...props}>
                    {group.label}
                    <IconChevronDown size={14} />
                  </button>
                )}>
                  {({ close }) => group.links.map((item) => (
                    <MenuItem key={item.to} to={item.to} active={itemPath === item.to} close={close}>
                      <span>
                        <span style={{ display: "block" }}>{item.label}</span>
                        {item.hint ? <span className="tiny muted" style={{ display: "block", fontWeight: 400 }}>{item.hint}</span> : null}
                      </span>
                    </MenuItem>
                  ))}
                </Menu>
              </div>
            ))}
          </nav>

          <div className="app-topbar__controls">
            <span className="hide-under-900">{themeButton}</span>
            <Button variant="ghost" className="hide-under-900" icon={<IconBug size={18} />} onClick={() => { setBugNotice(""); setBugModalOpen(true); }} aria-label="Report a bug" title="Report a bug" />
            {sessionControl}
            <a className="c-btn c-btn--ghost c-btn--icon app-topbar__x hide-under-900" href="https://x.com/CivitasExplorer" target="_blank" rel="noreferrer" aria-label="Civitas on X" title="Civitas on X">
              <IconX size={16} />
            </a>
            <Button variant="ghost" className="app-topbar__menu-btn" icon={<IconMenu size={20} />} onClick={() => setDrawerOpen(true)} aria-label="Open navigation" aria-expanded={drawerOpen} aria-controls="app-drawer" />
          </div>
        </div>
      </header>

      {drawerOpen ? createPortal(
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside id="app-drawer" className="drawer" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="drawer__head">
              <span className="app-brand-word">Civitas</span>
              <Button variant="ghost" icon={<IconClose size={18} />} onClick={() => setDrawerOpen(false)} aria-label="Close navigation" />
            </div>
            <div className="drawer__body">
              {NAV_GROUPS.map((group) => (
                <div key={group.key} className="drawer__group">
                  <div className="drawer__label">{group.label}</div>
                  {group.links.map((item) => (
                    <Link key={item.to} to={item.to} className={`drawer__link${itemPath === item.to ? " is-active" : ""}`} onClick={() => setDrawerOpen(false)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="drawer__actions">
                <Button icon={theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />} onClick={onToggleTheme}>
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </Button>
                <Button icon={<IconBug size={16} />} onClick={() => { setDrawerOpen(false); setBugNotice(""); setBugModalOpen(true); }}>Report a bug</Button>
                <Button href="https://x.com/CivitasExplorer" target="_blank" rel="noreferrer" icon={<IconX size={14} />}>Civitas on X</Button>
              </div>
            </div>
          </aside>
        </>,
        document.body
      ) : null}

      <Modal open={bugModalOpen} onClose={() => setBugModalOpen(false)} title="Report a bug" footer={(
        <>
          <Button onClick={() => setBugModalOpen(false)} disabled={bugSubmitting}>Cancel</Button>
          <Button variant="primary" form="bug-report-form" type="submit" loading={bugSubmitting}>Submit report</Button>
        </>
      )}>
        <form id="bug-report-form" className="stack" onSubmit={submitBugReport}>
          <Field label="Category">{(id) => (
            <Select id={id} value={bugForm.category} onChange={(e) => updateBugField("category", e.target.value)}>
              <option value="ui">UI / UX</option>
              <option value="data">Data issue</option>
              <option value="performance">Performance</option>
              <option value="mobile">Mobile</option>
              <option value="other">Other</option>
            </Select>
          )}</Field>
          <Field label="Title">{(id) => <Input id={id} value={bugForm.title} onChange={(e) => updateBugField("title", e.target.value)} placeholder="Short summary" maxLength={140} required />}</Field>
          <Field label="Description">{(id) => <Textarea id={id} value={bugForm.description} onChange={(e) => updateBugField("description", e.target.value)} placeholder="What happened?" rows={4} maxLength={4000} required />}</Field>
          <Field label="Expected (optional)">{(id) => <Textarea id={id} value={bugForm.expected} onChange={(e) => updateBugField("expected", e.target.value)} placeholder="What should have happened?" rows={2} maxLength={2000} />}</Field>
          <Field label="Steps (optional)">{(id) => <Textarea id={id} value={bugForm.steps} onChange={(e) => updateBugField("steps", e.target.value)} placeholder="How can we reproduce it?" rows={3} maxLength={2000} />}</Field>
          <Field label="Contact (optional)">{(id) => <Input id={id} value={bugForm.contact} onChange={(e) => updateBugField("contact", e.target.value)} placeholder="Email or handle" maxLength={200} />}</Field>
          <p className="tiny muted mono">Page: {location.pathname}{location.search || ""}</p>
          {bugNotice ? <p className="small" role="status">{bugNotice}</p> : null}
        </form>
      </Modal>
    </>
  );
}
