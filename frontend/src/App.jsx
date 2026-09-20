import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

// Easter window: March 28 – April 7 (covers Holy Week through Easter Monday)
function isEasterPeriod() {
  const now = new Date();
  const y = now.getFullYear();
  const start = new Date(y, 2, 28); // March 28
  const end   = new Date(y, 3,  7, 23, 59, 59); // April 7
  return now >= start && now <= end;
}
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
// MeshSDK, bech32, and blakejs are loaded lazily on first wallet interaction
// to keep them out of the initial JS bundle and improve page load performance.
import AppTopbar from "./components/AppTopbar";
import SignInDialog from "./components/SignInDialog";
import InfoBanner from "./components/InfoBanner";
import { WalletContext } from "./context/WalletContext";
import { useCardanoWallets, listCardanoWallets, rememberWallet } from "./lib/wallet/useCardanoWallets";
import { DEFAULT_ROLE, normalizeRole, roleByKey, roleLabel, signKeyForRole, recallRole, rememberRole } from "./lib/wallet/roles";
import { WalletFlowError, isUserDecline, readableError, walletErrorDetail } from "./lib/wallet/walletError";
import { APP_NETWORK_LABEL, expectedNetworkId, isExpectedNetwork, networkMismatchMessage } from "./lib/wallet/networkGuard";
import { readSession, writeWalletSession, writeSignerSession, clearSession } from "./lib/wallet/session";
import { loginOffline } from "./lib/wallet/offlineLogin";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GovernanceActionsPage = lazy(() => import("./pages/GovernanceActionsPage"));
const SubmitGovernanceActionPage = lazy(() => import("./pages/SubmitGovernanceActionPage"));
const RationalesArchivePage = lazy(() => import("./pages/RationalesArchivePage"));
const BudgetPage = lazy(() => import("./pages/EkklesiaPage"));
const BudgetSubmitPage = lazy(() => import("./pages/EkklesiaPage").then(m => ({ default: m.EkklesiaSubmitPage })));
const BudgetResultsPage = lazy(() => import("./pages/EkklesiaPage").then(m => ({ default: m.BudgetResultsPage })));
const CcElectionPage = lazy(() => import("./pages/CcElectionPage"));
const CcElectionSubmitPage = lazy(() => import("./pages/CcElectionPage").then(m => ({ default: m.CcElectionSubmitPage })));
const CcElectionResultsPage = lazy(() => import("./pages/CcElectionPage").then(m => ({ default: m.CcElectionResultsPage })));
const CcAdminPage = lazy(() => import("./pages/CcElectionPage").then(m => ({ default: m.CcAdminPage })));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AboutChangelogPage = lazy(() => import("./pages/AboutChangelogPage"));
const NclPage = lazy(() => import("./pages/NclPage"));
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
  }, [location.pathname, location.search]);

  return null;
}

function ZoomCompensation() {
  useEffect(() => {
    const root = document.documentElement;
    const baselineDpr = window.devicePixelRatio || 1;
    let rafId = 0;

    const apply = () => {
      const currentDpr = window.devicePixelRatio || baselineDpr || 1;
      const zoomFactor = currentDpr / baselineDpr;
      const inverseScale = zoomFactor > 0 ? 1 / zoomFactor : 1;
      root.style.setProperty("--zoom-compensation", String(inverseScale));
    };

    const scheduleApply = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("resize", scheduleApply);
    window.visualViewport?.addEventListener("resize", scheduleApply);
    const pollId = window.setInterval(apply, 400);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(pollId);
      window.removeEventListener("resize", scheduleApply);
      window.visualViewport?.removeEventListener("resize", scheduleApply);
      root.style.removeProperty("--zoom-compensation");
    };
  }, []);

  return null;
}

function BackgroundMotionClock() {
  useEffect(() => {
    const root = document.documentElement;
    const sessionKey = "civitas_bg_motion_origin_ms";
    const storedOrigin = Number(window.sessionStorage.getItem(sessionKey) || 0);
    const originMs = Number.isFinite(storedOrigin) && storedOrigin > 0 ? storedOrigin : Date.now();
    if (!storedOrigin || storedOrigin <= 0) {
      window.sessionStorage.setItem(sessionKey, String(originMs));
    }
    let rafId = 0;

    const tick = () => {
      const t = (Date.now() - originMs) / 1000;

      const auraAX = Math.sin(t / 12) * 14;
      const auraAY = Math.cos(t / 15) * 10;
      const auraAS = 1 + Math.sin(t / 19) * 0.04;
      const auraAOpacity = 0.9 + Math.sin(t / 14) * 0.1;

      const auraBX = Math.cos(t / 14) * 16;
      const auraBY = Math.sin(t / 17) * 9;
      const auraBS = 1 + Math.cos(t / 21) * 0.03;
      const auraBOpacity = 0.65 + Math.cos(t / 16) * 0.1;

      const wmX = Math.sin(t / 18) * 15;
      const wmY = Math.cos(t / 23) * 10;
      const wmScale = 1 + Math.sin(t / 20) * 0.02;

      const landingX = Math.sin(t / 16) * 13;
      const landingY = Math.cos(t / 20) * 8;

      root.style.setProperty("--aura-a-x", `${auraAX.toFixed(2)}px`);
      root.style.setProperty("--aura-a-y", `${auraAY.toFixed(2)}px`);
      root.style.setProperty("--aura-a-scale", auraAS.toFixed(4));
      root.style.setProperty("--aura-a-opacity", auraAOpacity.toFixed(4));

      root.style.setProperty("--aura-b-x", `${auraBX.toFixed(2)}px`);
      root.style.setProperty("--aura-b-y", `${auraBY.toFixed(2)}px`);
      root.style.setProperty("--aura-b-scale", auraBS.toFixed(4));
      root.style.setProperty("--aura-b-opacity", auraBOpacity.toFixed(4));

      root.style.setProperty("--wm-x", `${wmX.toFixed(2)}px`);
      root.style.setProperty("--wm-y", `${wmY.toFixed(2)}px`);
      root.style.setProperty("--wm-scale", wmScale.toFixed(4));

      root.style.setProperty("--landing-aura-x", `${landingX.toFixed(2)}px`);
      root.style.setProperty("--landing-aura-y", `${landingY.toFixed(2)}px`);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      [
        "--aura-a-x",
        "--aura-a-y",
        "--aura-a-scale",
        "--aura-a-opacity",
        "--aura-b-x",
        "--aura-b-y",
        "--aura-b-scale",
        "--aura-b-opacity",
        "--wm-x",
        "--wm-y",
        "--wm-scale",
        "--landing-aura-x",
        "--landing-aura-y"
      ].forEach((key) => root.style.removeProperty(key));
    };
  }, []);

  return null;
}


function RouteTransitionFade() {
  const location = useLocation();
  const animationKey = `${location.pathname}${location.search}`;

  return (
    <div
      key={animationKey}
      className="route-transition-overlay"
      aria-hidden="true"
    />
  );
}

export default function App() {
  const [isEaster] = useState(isEasterPeriod);

  useEffect(() => {
    const root = document.documentElement;
    if (isEaster) {
      root.setAttribute("data-easter", "true");
    } else {
      root.removeAttribute("data-easter");
    }
    return () => root.removeAttribute("data-easter");
  }, [isEaster]);

  const [theme, setTheme] = useState(() => {
    try {
      const stored = window.localStorage.getItem("civitas.theme");
      return stored === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const routeTransitionEnabled = false;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem("civitas.theme", theme);
    } catch {
      // Ignore storage write failures.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // ── Global Wallet State ──────────────────────────────────────────────────
  // Two ways in, one session shape. A browser wallet (CIP-30/95) is found by
  // a polling scan of window.cardano (extensions inject late, often after
  // React mounts). cardano-signer sign-in proves a key offline through
  // /api/auth/challenge + verify; it carries no walletApi, so it can identify
  // (DRep, SPO, CC member) but not build transactions. MeshSDK, bech32 and
  // blakejs still load lazily on the first wallet connect so they stay out of
  // the initial JS bundle.
  const {
    wallets,
    selected: selectedWallet,
    setSelected: selectWallet,
    scanning: walletScanning
  } = useCardanoWallets();
  // A cardano-signer session is restored synchronously from storage (the
  // proof was verified when it was made and is kept for a bounded time), so
  // the first render already shows the signed-in state. Wallet sessions need
  // the wallet to re-approve and are restored in the effect below.
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
  const [walletDrep, setWalletDrep] = useState(restoredDrep); // { pubDRepKey, dRepIDCip105 } when the session is a registered DRep, else null
  const [walletDrepId, setWalletDrepId] = useState(restoredDrep ? restoredDrep.dRepIDCip105 : ""); // drep1... bech32, set whenever a DRep key is known (regardless of registration)
  const rawCip95Ref = useRef(null); // raw CIP-95 wallet API for DRep signing
  const [walletError, setWalletError] = useState("");
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  // Role the active session signed in as; decides which key signs (see lib/wallet/roles).
  const [role, setRole] = useState(restoredSigner ? restoredSigner.role : DEFAULT_ROLE);
  // Role the sign-in dialog opens with: the last one used, or one requested via openSignIn().
  const [signInRole, setSignInRole] = useState(() => recallRole());
  const [signerMode, setSignerMode] = useState(restoredSigner ? "cardano-signer" : "wallet"); // 'wallet' | 'cardano-signer'
  // Identity proven with cardano-signer: { role, publicKeyHex, drepId | poolId, calidusId | ccHotId, ccColdId }.
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
  // `code` lets the dialog offer a next step ("not-a-drep" → sign in as a
  // delegator instead). `opts.silent` (session restore) keeps a failure out
  // of the visible error slot.
  const connectWallet = useCallback(async (key, opts = {}) => {
    const nextRole = normalizeRole(opts.role);
    const roleMeta = roleByKey(nextRole);
    setWalletError("");
    try {
      const info = wallets.find((w) => w.key === key)
        || listCardanoWallets(window.cardano).find((w) => w.key === key);
      if (!info) throw new WalletFlowError("That wallet extension is no longer available. Pick another wallet.", "missing");

      // Ask for the CIP-95 extension whenever the wallet advertises it or the
      // role needs it; the raw API is what exposes the DRep key and signData.
      // A wallet that doesn't know the extension may reject the request
      // outright, so fall back to a plain enable() unless the user declined.
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

      // Lazy-load MeshSDK, bech32 and blakejs only once a user connects.
      const [{ BrowserWallet }, { bech32 }, blakejs] = await Promise.all([
        import("@meshsdk/core"),
        import("bech32"),
        import("blakejs")
      ]);
      const api = await BrowserWallet.enable(key);
      const netId = await api.getNetworkId();
      if (!isExpectedNetwork(netId)) throw new WalletFlowError(networkMismatchMessage(netId), "network");
      const [rewardAddresses, lovelace] = await Promise.all([
        api.getRewardAddresses(),
        api.getLovelace()
      ]);

      // CIP-95: derive the DRep id from the wallet's DRep key. Every CIP-95
      // wallet exposes one even if the user never registered, so the wallet
      // only counts as a DRep when /api/auth/drep-status (Koios) confirms the
      // credential is registered. When that lookup is unavailable the answer
      // is "unknown", which never grants the DRep role: a DRep sign-in fails
      // closed and a delegator sign-in simply carries no DRep credential.
      let drep = null;
      let drepId = "";
      let registration = null; // { registered, active } | null when the lookup failed
      if (rawApi?.cip95) {
        const pubDRepKey = await rawApi.cip95.getPubDRepKey().catch(() => null);
        if (pubDRepKey) {
          const keyBytes = Uint8Array.from(
            pubDRepKey.match(/.{1,2}/g).map((b) => parseInt(b, 16))
          );
          const keyHash = blakejs.blake2b(keyBytes, null, 28);
          // CIP-129: prepend 0x22 (key-hash credential type byte) before bech32 encoding
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
          if (registration?.registered) {
            drep = { pubDRepKey, dRepIDCip105: drepId };
          }
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

  // Signs the session in from an identity the server verified from a
  // cardano-signer proof (see lib/wallet/offlineLogin). No walletApi: the
  // keys stay on the user's machine, so Civitas can identify them but any
  // transaction still happens from their CLI.
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

  // Completes a cardano-signer sign-in from the pasted signer output.
  // Resolves to { ok: true } or { ok: false, error }; never throws.
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
    // The session is gone, but the wallet stays remembered so the picker
    // preselects it next time.
    clearSession();
  }, [resetWalletState]);

  // Opens the sign-in dialog, optionally on a specific role (topbar shortcuts).
  const openSignIn = useCallback((requestedRole) => {
    setSignInRole(normalizeRole(requestedRole || recallRole()));
    setWalletError("");
    setWalletMenuOpen(true);
  }, []);

  // Restore a wallet session once its wallet shows up in the scan (or give
  // up quietly once the scan closes without it). Runs at most once; a
  // cardano-signer session was already restored in the state initialisers.
  const restoreAttemptedRef = useRef(false);
  useEffect(() => {
    if (restoreAttemptedRef.current) return;
    const session = readSession();
    if (!session || session.kind !== "wallet") {
      restoreAttemptedRef.current = true;
      return;
    }
    if (!wallets.some((w) => w.key === session.walletKey)) {
      if (!walletScanning) restoreAttemptedRef.current = true;
      return;
    }
    restoreAttemptedRef.current = true;
    connectWallet(session.walletKey, { role: session.role, silent: true }).catch(() => clearSession());
  }, [wallets, walletScanning, connectWallet]);

  // Signs payload with the DRep key via CIP-95 if available, otherwise falls back to stake key signData.
  // Returns { signature, key } (CIP-30 DataSignature shape).
  const signDRepData = useCallback(async (payload, drepId) => {
    const cip95 = rawCip95Ref.current?.cip95;
    if (cip95?.signData) {
      return cip95.signData(drepId, payload);
    }
    // Fallback: MeshJS BrowserWallet signData (works for stake key; may work for some wallets with drep addr)
    return walletApi?.signData(payload, drepId, false);
  }, [walletApi]);

  const preferredSignKey = signKeyForRole(role);
  const isCliSession = signerMode === "cardano-signer";
  const walletContextValue = useMemo(() => ({
    // discovery
    wallets,
    selectedWallet,
    selectWallet,
    walletScanning,
    // session
    walletApi,
    walletKey,
    walletName,
    walletIcon,
    walletSupportsCip95,
    walletRewardAddress,
    walletNetworkId,
    walletLovelace,
    walletDrep,
    walletDrepId,
    walletError,
    walletMenuOpen,
    setWalletMenuOpen,
    openSignIn,
    signInRole,
    connectWallet,
    signInWithSigner,
    disconnectWallet,
    signDRepData,
    // role the session signed in as, and the key it therefore signs with
    role,
    roleLabel: roleLabel(role),
    preferredSignKey,
    signerMode,
    isCliSession,
    signerIdentity,
    loggedIn: Boolean(walletName),
    // Acting as a DRep = a real connected wallet that is a registered DRep
    // on-chain AND signed in with the DRep key. Gates DRep-only actions that
    // build transactions in the browser (voting); a cardano-signer DRep has
    // the identity (walletDrep, role) but votes from the CLI.
    actingAsDrep: Boolean(walletApi) && Boolean(walletDrep) && role === "drep",
    actingAsSpo: isCliSession && role === "spo" && Boolean(signerIdentity?.poolId),
    actingAsCc: isCliSession && role === "cc" && Boolean(signerIdentity?.ccHotId || signerIdentity?.ccColdId),
  }), [
    wallets, selectedWallet, selectWallet, walletScanning,
    walletApi, walletKey, walletName, walletIcon, walletSupportsCip95,
    walletRewardAddress, walletNetworkId, walletLovelace, walletDrep, walletDrepId,
    walletError, walletMenuOpen, openSignIn, signInRole,
    connectWallet, signInWithSigner, disconnectWallet, signDRepData,
    role, preferredSignKey, signerMode, isCliSession, signerIdentity
  ]);

  return (
    <WalletContext.Provider value={walletContextValue}>
      <BackgroundMotionClock />
      <ZoomCompensation />
      <div className="global-watermark" aria-hidden="true">
        <div className="global-watermark-art" />
      </div>
      <ScrollToTopOnRouteChange />
      <AppTopbar theme={theme} onToggleTheme={toggleTheme} isEaster={isEaster} />
      <SignInDialog />
      <InfoBanner />
      {routeTransitionEnabled ? <RouteTransitionFade /> : null}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<GovernanceActionsPage />} />
          <Route path="/actions" element={<GovernanceActionsPage />} />
          <Route path="/actions/:proposalId" element={<ProposalDetailPage />} />
          {/* <Route path="/actions/submit" element={<SubmitGovernanceActionPage />} /> */}{/* hidden: WIP */}
          <Route path="/governance/rationales" element={<RationalesArchivePage />} />
          <Route path="/budget/results" element={<BudgetResultsPage voteSlug="cardano-budget-2026" basePath="/budget" />} />
          <Route path="/budget/submit" element={<BudgetSubmitPage voteSlug="cardano-budget-2026" basePath="/budget" />} />
          <Route path="/budget/submit/:proposalId" element={<BudgetSubmitPage voteSlug="cardano-budget-2026" basePath="/budget" />} />
          <Route path="/budget" element={<BudgetPage voteSlug="cardano-budget-2026" basePath="/budget" />} />
          <Route path="/budget/:proposalId" element={<BudgetPage voteSlug="cardano-budget-2026" basePath="/budget" />} />
          <Route path="/ekklesia" element={<Navigate to="/budget" replace />} />
          <Route path="/cc-election/submit" element={<CcElectionSubmitPage />} />
          <Route path="/cc-election/submit/:nominationId" element={<CcElectionSubmitPage />} />
          <Route path="/cc-election/results" element={<CcElectionResultsPage />} />
          <Route path="/cc-election" element={<CcElectionPage />} />
          <Route path="/cc-election/:candidateId" element={<CcElectionPage />} />
          <Route path="/ccadmin" element={<CcAdminPage />} />
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
          <Route path="/dreps" element={<DashboardPage actorType="drep" />} />
          <Route path="/dreps/:actorId" element={<VoterProfilePage actorType="drep" />} />
          <Route path="/delegate/:drepId" element={<DelegatePage />} />
          <Route path="/spos" element={<DashboardPage actorType="spo" />} />
          <Route path="/spos/:actorId" element={<VoterProfilePage actorType="spo" />} />
          <Route path="/committee" element={<DashboardPage actorType="committee" />} />
          <Route path="/committee/:actorId" element={<VoterProfilePage actorType="committee" />} />
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
    </WalletContext.Provider>
  );
}
