import { useContext, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";

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

export default function AppTopbar({ theme = "dark", onToggleTheme }) {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const logoSrc = theme === "light" ? "/civitas-logo-light.svg" : "/civitas-logo.svg";
  const wallet = useContext(WalletContext);
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
    <header className="topbar">
      <div className="topbar-inner shell">
        <div className={`topbar-row-main${isLanding ? " is-landing" : ""}`}>
          <div className="topbar-left">
            {!isLanding ? (
              <Link to="/" className="brand-home-link" aria-label="Go to Civitas home">
                <div className="brand-lockup" aria-label="Civitas">
                  <img className="brand-mark" src={logoSrc} alt="Civitas logo" />
                  <div className="brand-text">
                    <p className="brand">Civitas</p>
                  </div>
                </div>
              </Link>
            ) : (
              <span className="topbar-left-spacer" />
            )}
          </div>

          <nav className="topnav topnav-row">
            <NavLink to="/actions" className={({ isActive }) => (isActive ? "active" : "")}>
              Actions
            </NavLink>
            <NavLink to="/dreps" className={({ isActive }) => (isActive ? "active" : "")}>
              DReps
            </NavLink>
            <NavLink to="/spos" className={({ isActive }) => (isActive ? "active" : "")}>
              SPOs
            </NavLink>
            <NavLink to="/committee" className={({ isActive }) => (isActive ? "active" : "")}>
              Committee
            </NavLink>
            <NavLink to="/ncl" className={({ isActive }) => (isActive ? "active" : "")}>
              NCL
            </NavLink>
            <NavLink to="/stats" className={({ isActive }) => (isActive ? "active" : "")}>
              Stats
            </NavLink>
            <NavLink to="/guide" className={({ isActive }) => (isActive ? "active" : "")}>
              Guide
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
              About
            </NavLink>
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
            {!isLanding ? (
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
            ) : null}

            {/* Global Wallet Button — hidden on landing page */}
            {!isLanding && wallet ? (
              <div className="wallet-menu-wrap topbar-wallet">
                <button
                  type="button"
                  className="wallet-trigger"
                  onClick={() => wallet.setWalletMenuOpen((v) => !v)}
                  aria-label={wallet.walletApi ? `Wallet: ${wallet.walletName}` : "Connect wallet"}
                >
                  {wallet.walletApi
                    ? `${wallet.walletName}${wallet.walletDrep ? " · DRep" : ""}`
                    : "Connect Wallet"}
                </button>

                {wallet.walletMenuOpen ? (
                  <div className="wallet-popover panel">
                    {!wallet.walletApi ? (
                      <>
                        <p className="muted">Connect a CIP-30 wallet extension:</p>
                        <div className="wallet-connect-list">
                          {wallet.wallets.length === 0 ? (
                            <p className="muted">No wallet extension detected.</p>
                          ) : (
                            wallet.wallets.map((w) => (
                              <button
                                key={w.key}
                                type="button"
                                className="mode-btn"
                                onClick={() => wallet.connectWallet(w.key)}
                              >
                                {w.displayName}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="wallet-connected">
                        <p>
                          Connected: <strong>{wallet.walletName}</strong>
                        </p>
                        <p>
                          Network: <strong>{networkLabel(wallet.walletNetworkId)}</strong>
                        </p>
                        <p>
                          Balance: <strong>{formatAda(wallet.walletLovelace)}</strong>
                        </p>
                        {wallet.walletDrep ? (
                          <p className="muted">DRep credential detected — you can vote on governance actions.</p>
                        ) : (
                          <p className="muted">No DRep credential — you can delegate to a DRep.</p>
                        )}
                        <p className="mono">{wallet.walletRewardAddress || "No reward address exposed by wallet."}</p>
                        <button type="button" className="mode-btn" onClick={wallet.disconnectWallet}>
                          Disconnect
                        </button>
                      </div>
                    )}
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
