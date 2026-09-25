import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppTopbar from "./components/AppTopbar";
import SignInDialog from "./components/SignInDialog";
import { WalletContext } from "./context/WalletContext";
import { useCardanoWallets, listCardanoWallets, rememberWallet } from "./lib/wallet/useCardanoWallets";
import { DEFAULT_ROLE, normalizeRole, roleByKey, roleLabel, signKeyForRole, recallRole, rememberRole } from "./lib/wallet/roles";
import { WalletFlowError, isUserDecline, readableError, walletErrorDetail } from "./lib/wallet/walletError";
import { APP_NETWORK_LABEL, expectedNetworkId, isExpectedNetwork, networkMismatchMessage } from "./lib/wallet/networkGuard";
import { readSession, writeWalletSession, writeSignerSession, clearSession } from "./lib/wallet/session";
import { loginOffline } from "./lib/wallet/offlineLogin";
import { PageSkeleton } from "./ui";
import { useSnapshotUpdates } from "./hooks/useSnapshotUpdates";
import { invalidateSnapshotQueries } from "./api/queries";

// Easter window: March 28 – April 7 (covers Holy Week through Easter Monday)
function isEasterPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const start = new Date(y, 2, 28);
  const end = new Date(y, 3, 7, 23, 59, 59);
  return now >= start && now <= end;
}

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GovernanceActionsPage = lazy(() => import("./pages/GovernanceActionsPage"));
const RationalesArchivePage = lazy(() => import("./pages/RationalesArchivePage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AboutChangelogPage = lazy(() => import("./pages/AboutChangelogPage"));
const TreasuryPage = lazy(() => import("./pages/TreasuryPage"));
const TreasuryExplorerPage = lazy(() => import("./pages/TreasuryExplorerPage"));
const TreasuryProjectPage = lazy(() => import("./pages/TreasuryProjectPage"));
const SurveysListPage = lazy(() => import("./pages/SurveysListPage"));
const SurveyDetailPage = lazy(() => import("./pages/SurveyDetailPage"));
const CreateSurveyPage = lazy(() => import("./pages/CreateSurveyPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const BugsPage = lazy(() => import("./pages/BugsPage"));
const ConstitutionPage = lazy(() => import("./pages/ConstitutionPage"));
const VoterProfilePage = lazy(() => import("./pages/VoterProfilePage"));
const DelegatePage = lazy(() => import("./pages/DelegatePage"));
const ProposalDetailPage = lazy(() => import("./pages/ProposalDetailPage"));
const EpochCalendarPage = lazy(() => import("./pages/EpochCalendarPage"));
const CipListPage = lazy(() => import("./pages/CipListPage"));
const CipDetailPage = lazy(() => import("./pages/CipDetailPage"));
const IntersectPage = lazy(() => import("./pages/IntersectPage"));
const BlockfrostPage = lazy(() => import("./pages/BlockfrostPage"));

function ScrollToTopOnRouteChange() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);
  return null;
}

// One SSE subscription for the whole app: a published snapshot invalidates
// every cached /api/v1 query, and pages refetch with a revalidated request.
function SnapshotInvalidator() {
  useSnapshotUpdates({ onUpdate: () => { invalidateSnapshotQueries(); } });
  return null;
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="shell app-footer__inner">
        <span>Civitas · Cardano governance, in one place. Data from Koios and on-chain anchors.</span>
        <nav className="app-footer__links" aria-label="Footer">
          <Link to="/about">About</Link>
          <Link to="/about/changelog">Changelog</Link>
          <Link to="/guide">Guides</Link>
          <a href="https://github.com/Thomas-nada/civitas" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://x.com/CivitasExplorer" target="_blank" rel="noreferrer">X</a>
        </nav>
      </div>
    </footer>
  );
}

function readInitialTheme() {
  try {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "light" || attr === "dark") return attr;
    const stored = window.localStorage.getItem("civitas.theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export default function App() {
  const [isEaster] = useState(isEasterPeriod);
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (isEaster) root.setAttribute("data-easter", "true");
    else root.removeAttribute("data-easter");
    return () => root.removeAttribute("data-easter");
  }, [isEaster]);

  const [theme, setTheme] = useState(readInitialTheme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { window.localStorage.setItem("civitas.theme", theme); } catch { /* ignore */ }
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // ── Global wallet state ──────────────────────────────────────────────────
  // Two ways in, one session shape. A browser wallet (CIP-30/95) is found by
  // a polling scan of window.cardano (extensions inject late, often after
  // React mounts). cardano-signer sign-in proves a key offline through
  // /api/auth/challenge + verify; it carries no walletApi, so it can identify
  // (DRep, SPO, CC member) but not build transactions. MeshSDK, bech32 and
  // blakejs load lazily on the first wallet connect so they stay out of the
  // initial JS bundle.
  const { wallets, selected: selectedWallet, setSelected: selectWallet, scanning: walletScanning } = useCardanoWallets();
  const [restoredSigner] = useState(() => {
    const session = readSession();
    return session?.kind === "signer" ? session : null;
  });
  const restoredDrep = restoredSigner && restoredSigner.role === "drep" && restoredSigner.identity?.drepId
    ? { pubDRepKey: restoredSigner.identity.publicKeyHex || "", dRepIDCip105: restoredSigner.identity.drepId }
    : null;
  const [walletApi, setWalletApi] = useState(null);
  const [walletKey, setWalletKey] = useState("");
  const [walletName, setWalletName] = useState(restoredSigner ? "cardano-signer" : "");
  const [walletIcon, setWalletIcon] = useState("");
  const [walletSupportsCip95, setWalletSupportsCip95] = useState(false);
  const [walletRewardAddress, setWalletRewardAddress] = useState("");
  const [walletNetworkId, setWalletNetworkId] = useState(restoredSigner ? expectedNetworkId() : null);
  const [walletLovelace, setWalletLovelace] = useState("");
  const [walletDrep, setWalletDrep] = useState(restoredDrep);
  const [walletDrepId, setWalletDrepId] = useState(restoredDrep ? restoredDrep.dRepIDCip105 : "");
  const rawCip95Ref = useRef(null);
  const [walletError, setWalletError] = useState("");
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [role, setRole] = useState(restoredSigner ? restoredSigner.role : DEFAULT_ROLE);
  const [signInRole, setSignInRole] = useState(() => recallRole());
  const [signerMode, setSignerMode] = useState(restoredSigner ? "cardano-signer" : "wallet");
  const [signerIdentity, setSignerIdentity] = useState(restoredSigner ? restoredSigner.identity : null);

  const resetWalletState = useCallback(() => {
    setWalletApi(null);
    setWalletKey("");
    setWalletName("");
    setWalletIcon("");
    setWalletSupportsCip95(false);
    setWalletRewardAddress("");
    setWalletNetworkId(null);
    setWalletLovelace("");
    setWalletDrep(null);
    setWalletDrepId("");
    rawCip95Ref.current = null;
    setRole(DEFAULT_ROLE);
    setSignerMode("wallet");
    setSignerIdentity(null);
  }, []);

  // Connects a CIP-30 wallet and signs the session in as `opts.role`.
  // Resolves to { ok: true } or { ok: false, error, code }; never throws.
  const connectWallet = useCallback(async (key, opts = {}) => {
    const nextRole = normalizeRole(opts.role);
    const roleMeta = roleByKey(nextRole);
    setWalletError("");
    try {
      const info = wallets.find((w) => w.key === key)
        || listCardanoWallets(window.cardano).find((w) => w.key === key);
      if (!info) throw new WalletFlowError("That wallet extension is no longer available. Pick another wallet.", "missing");

      let rawApi = null;
      try {
        const wantCip95 = info.supportsCip95 || Boolean(roleMeta?.requiresCip95);
        try {
          rawApi = await info.raw.enable(wantCip95 ? { extensions: [{ cip: 95 }] } : undefined);
        } catch (e) {
          if (!wantCip95 || isUserDecline(e)) throw e;
          rawApi = await info.raw.enable();
        }
      } catch (e) {
        throw new WalletFlowError(
          isUserDecline(e) || !walletErrorDetail(e)
            ? `Wallet connection was rejected. Approve the request in ${info.name} and try again.`
            : readableError(e),
          "rejected"
        );
      }

      const [{ BrowserWallet }, { bech32 }, blakejs] = await Promise.all([
        import("@meshsdk/core"),
        import("bech32"),
        import("blakejs")
      ]);
      let api;
      try {
        api = await BrowserWallet.enable(key, rawApi?.cip95 ? [{ cip: 95 }] : []);
      } catch (e) {
        if (!rawApi?.cip95 || isUserDecline(e)) throw e;
        api = await BrowserWallet.enable(key);
      }
      const netId = await api.getNetworkId();
      if (!isExpectedNetwork(netId)) throw new WalletFlowError(networkMismatchMessage(netId), "network");
      const [rewardAddresses, lovelace] = await Promise.all([api.getRewardAddresses(), api.getLovelace()]);

      let drep = null;
      let drepId = "";
      let registration = null;
      if (rawApi?.cip95) {
        const pubDRepKey = await rawApi.cip95.getPubDRepKey().catch(() => null);
        if (pubDRepKey) {
          const keyBytes = Uint8Array.from(pubDRepKey.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
          const keyHash = blakejs.blake2b(keyBytes, null, 28);
          const credBytes = new Uint8Array(29);
          credBytes[0] = 0x22;
          credBytes.set(keyHash, 1);
          drepId = bech32.encode("drep", bech32.toWords(credBytes), 1000);
          try {
            const reg = await fetch(`/api/auth/drep-status?id=${encodeURIComponent(drepId)}`);
            const data = reg.ok ? await reg.json() : null;
            if (data?.ok) {
              registration = { registered: data.registered === true && data.hasScript !== true, active: data.active !== false };
            }
          } catch {
            registration = null;
          }
          if (registration?.registered) drep = { pubDRepKey, dRepIDCip105: drepId };
        }
      }
      if (roleMeta?.requiresCip95) {
        if (!rawApi?.cip95) {
          throw new WalletFlowError(
            `${info.name} does not support CIP-95, which signing in as a DRep requires. Use a DRep-capable wallet such as Eternl, Lace or Typhon, sign in with cardano-signer, or sign in as a delegator.`,
            "no-cip95"
          );
        }
        if (!drep) {
          if (!registration) {
            throw new WalletFlowError(
              "Civitas could not check this DRep credential on-chain right now, so the DRep sign-in was not completed. Try again in a moment, or sign in as a delegator.",
              "lookup-failed"
            );
          }
          throw new WalletFlowError(
            `This wallet's DRep key is not a registered, active DRep on ${APP_NETWORK_LABEL}. Register as a DRep first, or sign in as a delegator.`,
            "not-a-drep"
          );
        }
      }

      rawCip95Ref.current = rawApi;
      setWalletApi(api);
      setWalletKey(key);
      setWalletName(info.name);
      setWalletIcon(info.icon);
      setWalletSupportsCip95(Boolean(rawApi?.cip95) || info.supportsCip95);
      setWalletRewardAddress(rewardAddresses?.[0] || "");
      setWalletNetworkId(netId);
      setWalletLovelace(lovelace);
      setWalletDrep(drep);
      setWalletDrepId(drepId);
      setRole(nextRole);
      setSignInRole(nextRole);
      setSignerMode("wallet");
      setSignerIdentity(null);
      setWalletMenuOpen(false);
      rememberWallet(key);
      rememberRole(nextRole);
      writeWalletSession({ walletKey: key, role: nextRole });
      return { ok: true };
    } catch (e) {
      resetWalletState();
      clearSession();
      const error = readableError(e, "Failed to connect wallet.");
      const code = e instanceof WalletFlowError ? e.code : "";
      if (!opts.silent) setWalletError(error);
      return { ok: false, error, code };
    }
  }, [wallets, resetWalletState]);

  const applySignerIdentity = useCallback((identity, nextRole) => {
    resetWalletState();
    setSignerMode("cardano-signer");
    setWalletName("cardano-signer");
    setWalletNetworkId(expectedNetworkId());
    setRole(nextRole);
    setSignInRole(nextRole);
    setSignerIdentity(identity);
    if (nextRole === "drep" && identity?.drepId) {
      setWalletDrepId(identity.drepId);
      setWalletDrep({ pubDRepKey: identity.publicKeyHex || "", dRepIDCip105: identity.drepId });
    }
    setWalletMenuOpen(false);
  }, [resetWalletState]);

  const signInWithSigner = useCallback(async ({ role: requestedRole, payload, pastedText }) => {
    const nextRole = normalizeRole(requestedRole);
    setWalletError("");
    const result = await loginOffline({ role: nextRole, payload, pastedText });
    if (!result.ok) {
      setWalletError(result.error);
      return { ok: false, error: result.error, code: "" };
    }
    applySignerIdentity(result.identity, nextRole);
    rememberRole(nextRole);
    writeSignerSession({ role: nextRole, identity: result.identity });
    return { ok: true };
  }, [applySignerIdentity]);

  const disconnectWallet = useCallback(() => {
    resetWalletState();
    setWalletError("");
    setWalletMenuOpen(false);
    clearSession();
  }, [resetWalletState]);

  const openSignIn = useCallback((requestedRole) => {
    setSignInRole(normalizeRole(requestedRole || recallRole()));
    setWalletError("");
    setWalletMenuOpen(true);
  }, []);

  const restoreAttemptedRef = useRef(false);
  useEffect(() => {
    if (restoreAttemptedRef.current) return;
    const session = readSession();
    if (!session || session.kind !== "wallet") { restoreAttemptedRef.current = true; return; }
    if (!wallets.some((w) => w.key === session.walletKey)) {
      if (!walletScanning) restoreAttemptedRef.current = true;
      return;
    }
    restoreAttemptedRef.current = true;
    connectWallet(session.walletKey, { role: session.role, silent: true }).catch(() => clearSession());
  }, [wallets, walletScanning, connectWallet]);

  const signDRepData = useCallback(async (payload, drepId) => {
    const cip95 = rawCip95Ref.current?.cip95;
    if (cip95?.signData) return cip95.signData(drepId, payload);
    return walletApi?.signData(payload, drepId, false);
  }, [walletApi]);

  const preferredSignKey = signKeyForRole(role);
  const isCliSession = signerMode === "cardano-signer";
  const walletContextValue = useMemo(() => ({
    wallets, selectedWallet, selectWallet, walletScanning,
    walletApi, walletKey, walletName, walletIcon, walletSupportsCip95, walletRewardAddress, walletNetworkId, walletLovelace,
    walletDrep, walletDrepId, walletError, walletMenuOpen, setWalletMenuOpen, openSignIn, signInRole,
    connectWallet, signInWithSigner, disconnectWallet, signDRepData,
    role, roleLabel: roleLabel(role), preferredSignKey, signerMode, isCliSession, signerIdentity,
    loggedIn: Boolean(walletName),
    actingAsDrep: Boolean(walletApi) && Boolean(walletDrep) && role === "drep",
    actingAsSpo: isCliSession && role === "spo" && Boolean(signerIdentity?.poolId),
    actingAsCc: isCliSession && role === "cc" && Boolean(signerIdentity?.ccHotId || signerIdentity?.ccColdId)
  }), [
    wallets, selectedWallet, selectWallet, walletScanning,
    walletApi, walletKey, walletName, walletIcon, walletSupportsCip95, walletRewardAddress, walletNetworkId, walletLovelace,
    walletDrep, walletDrepId, walletError, walletMenuOpen, openSignIn, signInRole,
    connectWallet, signInWithSigner, disconnectWallet, signDRepData,
    role, preferredSignKey, signerMode, isCliSession, signerIdentity
  ]);

  // Routes that share a component (the three dashboards, the three profile
  // routes, / and /actions) remount on change so per-page state never leaks.
  const routeKey = `${location.pathname.split("/").slice(0, 2).join("/")}`;

  return (
    <WalletContext.Provider value={walletContextValue}>
      <div className="global-watermark" aria-hidden="true"><div className="global-watermark-art" /></div>
      <ScrollToTopOnRouteChange />
      <SnapshotInvalidator />
      <AppTopbar theme={theme} onToggleTheme={toggleTheme} isEaster={isEaster} />
      <SignInDialog />
      <div id="main" className="app-main" style={{ display: "contents" }}>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<GovernanceActionsPage key="actions" />} />
            <Route path="/actions" element={<GovernanceActionsPage key="actions" />} />
            <Route path="/actions/:proposalId" element={<ProposalDetailPage />} />
            <Route path="/governance/rationales" element={<RationalesArchivePage />} />
            <Route path="/surveys" element={<SurveysListPage />} />
            <Route path="/surveys/create" element={<CreateSurveyPage />} />
            <Route path="/surveys/:txHash" element={<SurveyDetailPage />} />
            <Route path="/surveys/:txHash/:surveyIndex" element={<SurveyDetailPage />} />
            <Route path="/ncl" element={<Navigate to="/treasury" replace />} />
            <Route path="/treasury" element={<TreasuryPage />} />
            <Route path="/treasury/explorer" element={<TreasuryExplorerPage />} />
            <Route path="/treasury/explorer/:projectId" element={<TreasuryProjectPage />} />
            <Route path="/intersect" element={<IntersectPage />} />
            <Route path="/blockfrost" element={<BlockfrostPage />} />
            <Route path="/dreps" element={<DashboardPage key="drep" actorType="drep" />} />
            <Route path="/dreps/:actorId" element={<VoterProfilePage key={`drep-${routeKey}`} actorType="drep" />} />
            <Route path="/delegate/:drepId" element={<DelegatePage />} />
            <Route path="/spos" element={<DashboardPage key="spo" actorType="spo" />} />
            <Route path="/spos/:actorId" element={<VoterProfilePage key={`spo-${routeKey}`} actorType="spo" />} />
            <Route path="/committee" element={<DashboardPage key="committee" actorType="committee" />} />
            <Route path="/committee/:actorId" element={<VoterProfilePage key={`cc-${routeKey}`} actorType="committee" />} />
            <Route path="/epochs" element={<EpochCalendarPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/constitution" element={<ConstitutionPage />} />
            <Route path="/bugs" element={<BugsPage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/cips" element={<CipListPage />} />
            <Route path="/cips/:cipId" element={<CipDetailPage />} />
            <Route path="/about/changelog" element={<AboutChangelogPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/actions" replace />} />
          </Routes>
        </Suspense>
      </div>
      <AppFooter />
    </WalletContext.Provider>
  );
}
