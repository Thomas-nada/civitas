import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";

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
import LoginModal from "./components/LoginModal";
import InfoBanner from "./components/InfoBanner";
import { WalletContext } from "./context/WalletContext";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GovernanceActionsPage = lazy(() => import("./pages/GovernanceActionsPage"));
const SubmitGovernanceActionPage = lazy(() => import("./pages/SubmitGovernanceActionPage"));
const RationalesArchivePage = lazy(() => import("./pages/RationalesArchivePage"));
const BudgetPage = lazy(() => import("./pages/EkklesiaPage"));
const BudgetSubmitPage = lazy(() => import("./pages/EkklesiaPage").then(m => ({ default: m.EkklesiaSubmitPage })));
const BudgetResultsPage = lazy(() => import("./pages/EkklesiaPage").then(m => ({ default: m.BudgetResultsPage })));
const CcElectionPage = lazy(() => import("./pages/CcElectionPage"));
const CcElectionSubmitPage = lazy(() => import("./pages/CcElectionPage").then(m => ({ default: m.CcElectionSubmitPage })));
const CcAdminPage = lazy(() => import("./pages/CcElectionPage").then(m => ({ default: m.CcAdminPage })));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const AboutChangelogPage = lazy(() => import("./pages/AboutChangelogPage"));
const NclPage = lazy(() => import("./pages/NclPage"));
const TreasuryPage = lazy(() => import("./pages/TreasuryPage"));
const SurveysListPage = lazy(() => import("./pages/SurveysListPage"));
const SurveyDetailPage = lazy(() => import("./pages/SurveyDetailPage"));
const CreateSurveyPage = lazy(() => import("./pages/CreateSurveyPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const BugsPage = lazy(() => import("./pages/BugsPage"));
const ConstitutionPage = lazy(() => import("./pages/ConstitutionPage"));
const VoterProfilePage = lazy(() => import("./pages/VoterProfilePage"));
const ProposalDetailPage = lazy(() => import("./pages/ProposalDetailPage"));
const CipListPage = lazy(() => import("./pages/CipListPage"));
const CipDetailPage = lazy(() => import("./pages/CipDetailPage"));

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
  // Wallet list is populated lazily after MeshSDK loads, keeping it out of
  // the initial JS bundle for better page-load performance.
  const [wallets, setWallets] = useState([]);
  useEffect(() => {
    let cancelled = false;
    import("@meshsdk/core").then(({ BrowserWallet }) => {
      if (cancelled) return;
      try {
        setWallets(BrowserWallet.getInstalledWallets().map((w) => ({
          key: w.id,
          displayName: w.name || w.id
        })));
      } catch { /* no wallet extensions installed */ }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const [walletApi, setWalletApi] = useState(null);
  const [walletName, setWalletName] = useState("");
  const [walletRewardAddress, setWalletRewardAddress] = useState("");
  const [walletNetworkId, setWalletNetworkId] = useState(null);
  const [walletLovelace, setWalletLovelace] = useState("");
  const [walletDrep, setWalletDrep] = useState(null); // { dRepIDCip105, ... } or null if not a DRep
  const [walletError, setWalletError] = useState("");
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  // Login chooser preferences (richer sign-in UI)
  const [preferredSignKey, setPreferredSignKey] = useState("stake"); // 'drep' | 'stake' | 'calidus'
  const [signerMode, setSignerMode] = useState("wallet");            // 'wallet' | 'cardano-signer'
  const [multiSigDRepId, setMultiSigDRepId] = useState("");          // optional MultiSig DRep-ID

  const connectWallet = useCallback(async (walletKey, opts = {}) => {
    try {
      setWalletError("");
      if (opts.signKey) setPreferredSignKey(opts.signKey);
      setMultiSigDRepId(opts.multiSigDRepId || "");
      setSignerMode("wallet");
      // Lazy-load MeshSDK, bech32, and blakejs only when the user connects a wallet.
      const [{ BrowserWallet }, { bech32 }, blakejs] = await Promise.all([
        import("@meshsdk/core"),
        import("bech32"),
        import("blakejs")
      ]);
      const api = await BrowserWallet.enable(walletKey);
      const found = wallets.find((w) => w.key === walletKey);
      setWalletName(found?.displayName || walletKey);
      setWalletMenuOpen(false);

      const [rewardAddresses, netId, lovelace] = await Promise.all([
        api.getRewardAddresses(),
        api.getNetworkId(),
        api.getLovelace(),
      ]);

      // CIP-95: request DRep extension via raw wallet API (MeshSDK doesn't expose this)
      let drep = null;
      try {
        const rawWallet = window.cardano?.[walletKey];
        const rawApi = rawWallet
          ? await rawWallet.enable({ extensions: [{ cip: 95 }] }).catch(() => null)
          : null;
        if (rawApi?.cip95) {
          const pubDRepKey = await rawApi.cip95.getPubDRepKey().catch(() => null);
          if (pubDRepKey) {
            // Derive CIP-105 dRepIDCip105: bech32("drep", blake2b-224(pubKey))
            const keyBytes = Uint8Array.from(
              pubDRepKey.match(/.{1,2}/g).map((b) => parseInt(b, 16))
            );
            const keyHash = blakejs.blake2b(keyBytes, null, 28);
            // CIP-129: prepend 0x22 (key-hash credential type byte) before bech32 encoding
            const credBytes = new Uint8Array(29);
            credBytes[0] = 0x22;
            credBytes.set(keyHash, 1);
            const dRepIDCip105 = bech32.encode("drep", bech32.toWords(credBytes), 1000);
            // Every CIP-95 wallet exposes a DRep key even if the user never
            // registered as a DRep. Only treat the wallet as a DRep when the
            // credential is actually registered on-chain.
            let registered = false;
            try {
              const reg = await fetch(`/api/drep-live?id=${encodeURIComponent(dRepIDCip105)}`);
              registered = reg.ok;
            } catch { registered = false; }
            if (registered) {
              drep = { pubDRepKey, dRepIDCip105 };
            }
          }
        }
      } catch {
        // wallet doesn't support CIP-95 — drep stays null
      }

      setWalletApi(api);
      setWalletRewardAddress(rewardAddresses?.[0] || "");
      setWalletNetworkId(netId);
      setWalletLovelace(lovelace);
      setWalletDrep(drep);
      localStorage.setItem("civitas.wallet", walletKey);
    } catch (e) {
      setWalletApi(null);
      setWalletName("");
      setWalletRewardAddress("");
      setWalletNetworkId(null);
      setWalletLovelace("");
      setWalletDrep(null);
      setWalletError(e?.message || "Failed to connect wallet.");
      localStorage.removeItem("civitas.wallet");
    }
  }, [wallets]);

  // CardanoSigner: a read-only identity from a manually entered stake address.
  // No walletApi, so it can browse/identify but not submit transactions.
  const connectCardanoSigner = useCallback(async (stakeAddress, opts = {}) => {
    setWalletError("");
    const addr = String(stakeAddress || "").trim();
    try {
      const { bech32 } = await import("bech32");
      const decoded = bech32.decode(addr, 200);
      if (decoded.prefix !== "stake" && decoded.prefix !== "stake_test") {
        throw new Error("Enter a valid stake address (stake1… or stake_test1…).");
      }
      setWalletApi(null);
      setSignerMode("cardano-signer");
      setWalletName("CardanoSigner");
      setWalletRewardAddress(addr);
      setWalletNetworkId(decoded.prefix === "stake_test" ? 0 : 1);
      setWalletLovelace("");
      setWalletDrep(null);
      if (opts.signKey) setPreferredSignKey(opts.signKey);
      setMultiSigDRepId(opts.multiSigDRepId || "");
      setWalletMenuOpen(false);
      return true;
    } catch (e) {
      setWalletError(e?.message?.includes("valid") ? e.message : "Invalid stake address.");
      return false;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletApi(null);
    setWalletName("");
    setWalletRewardAddress("");
    setWalletNetworkId(null);
    setWalletLovelace("");
    setWalletDrep(null);
    setWalletError("");
    setWalletMenuOpen(false);
    setSignerMode("wallet");
    setMultiSigDRepId("");
    setPreferredSignKey("stake");
    localStorage.removeItem("civitas.wallet");
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("civitas.wallet");
    if (saved) connectWallet(saved).catch(() => localStorage.removeItem("civitas.wallet"));
  }, [connectWallet]);

  const walletContextValue = useMemo(() => ({
    wallets,
    walletApi,
    walletName,
    walletRewardAddress,
    walletNetworkId,
    walletLovelace,
    walletDrep,
    walletError,
    walletMenuOpen,
    setWalletMenuOpen,
    connectWallet,
    disconnectWallet,
    // richer login chooser
    preferredSignKey,
    setPreferredSignKey,
    signerMode,
    multiSigDRepId,
    connectCardanoSigner,
    loggedIn: Boolean(walletName),
  }), [
    wallets, walletApi, walletName, walletRewardAddress, walletNetworkId,
    walletLovelace, walletDrep, walletError, walletMenuOpen,
    connectWallet, disconnectWallet,
    preferredSignKey, signerMode, multiSigDRepId, connectCardanoSigner
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
      <LoginModal />
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
          <Route path="/cc-election" element={<CcElectionPage />} />
          <Route path="/cc-election/:candidateId" element={<CcElectionPage />} />
          <Route path="/ccadmin" element={<CcAdminPage />} />
          <Route path="/surveys" element={<SurveysListPage />} />
          <Route path="/surveys/create" element={<CreateSurveyPage />} />
          <Route path="/surveys/:txHash" element={<SurveyDetailPage />} />
          <Route path="/ncl" element={<Navigate to="/treasury" replace />} />
          <Route path="/treasury" element={<TreasuryPage />} />
          <Route path="/dreps" element={<DashboardPage actorType="drep" />} />
          <Route path="/dreps/:actorId" element={<VoterProfilePage actorType="drep" />} />
          <Route path="/spos" element={<DashboardPage actorType="spo" />} />
          <Route path="/spos/:actorId" element={<VoterProfilePage actorType="spo" />} />
          <Route path="/committee" element={<DashboardPage actorType="committee" />} />
          <Route path="/committee/:actorId" element={<VoterProfilePage actorType="committee" />} />
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
