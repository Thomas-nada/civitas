import { createContext, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BrowserWallet } from "@meshsdk/core";
import AppTopbar from "./components/AppTopbar";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GovernanceActionsPage = lazy(() => import("./pages/GovernanceActionsPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const NclPage = lazy(() => import("./pages/NclPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));

// ── Global Wallet Context ──────────────────────────────────────────────────
export const WalletContext = createContext(null);

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
  const isFirstRender = useRef(true);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setAnimationKey((prev) => prev + 1);
  }, [location.pathname, location.search]);

  return (
    <div
      key={animationKey}
      className="route-transition-overlay"
      aria-hidden="true"
    />
  );
}

export default function App() {
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
  const [wallets, setWallets] = useState([]);
  const [walletApi, setWalletApi] = useState(null);
  const [walletName, setWalletName] = useState("");
  const [walletRewardAddress, setWalletRewardAddress] = useState("");
  const [walletNetworkId, setWalletNetworkId] = useState(null);
  const [walletLovelace, setWalletLovelace] = useState("");
  const [walletDrep, setWalletDrep] = useState(null); // { dRepIDCip105, ... } or null if not a DRep
  const [walletError, setWalletError] = useState("");
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);

  // Discover installed wallets once on mount
  useEffect(() => {
    try {
      const discovered = BrowserWallet.getInstalledWallets().map((w) => ({
        key: w.id,
        displayName: w.name || w.id
      }));
      setWallets(discovered);
    } catch {
      // Extension not present or blocked
    }
  }, []);

  const connectWallet = useCallback(async (walletKey) => {
    try {
      setWalletError("");
      const api = await BrowserWallet.enable(walletKey);
      const found = wallets.find((w) => w.key === walletKey);
      setWalletName(found?.displayName || walletKey);
      setWalletMenuOpen(false);

      const [rewardAddresses, netId, lovelace, drep] = await Promise.all([
        api.getRewardAddresses(),
        api.getNetworkId(),
        api.getLovelace(),
        api.getDRep().catch(() => null)
      ]);

      setWalletApi(api);
      setWalletRewardAddress(rewardAddresses?.[0] || "");
      setWalletNetworkId(netId);
      setWalletLovelace(lovelace);
      setWalletDrep(drep?.dRepIDCip105 ? drep : null);
    } catch (e) {
      setWalletApi(null);
      setWalletName("");
      setWalletRewardAddress("");
      setWalletNetworkId(null);
      setWalletLovelace("");
      setWalletDrep(null);
      setWalletError(e?.message || "Failed to connect wallet.");
    }
  }, [wallets]);

  const disconnectWallet = useCallback(() => {
    setWalletApi(null);
    setWalletName("");
    setWalletRewardAddress("");
    setWalletNetworkId(null);
    setWalletLovelace("");
    setWalletDrep(null);
    setWalletError("");
    setWalletMenuOpen(false);
  }, []);

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
    disconnectWallet
  }), [
    wallets, walletApi, walletName, walletRewardAddress, walletNetworkId,
    walletLovelace, walletDrep, walletError, walletMenuOpen,
    connectWallet, disconnectWallet
  ]);

  return (
    <WalletContext.Provider value={walletContextValue}>
      <BackgroundMotionClock />
      <ZoomCompensation />
      <div className="global-watermark" aria-hidden="true">
        <div className="global-watermark-art" />
      </div>
      <ScrollToTopOnRouteChange />
      <AppTopbar theme={theme} onToggleTheme={toggleTheme} />
      {routeTransitionEnabled ? <RouteTransitionFade /> : null}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/actions" element={<GovernanceActionsPage />} />
          <Route path="/ncl" element={<NclPage />} />
          <Route path="/dreps" element={<DashboardPage actorType="drep" />} />
          <Route path="/spos" element={<DashboardPage actorType="spo" />} />
          <Route path="/committee" element={<DashboardPage actorType="committee" />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </WalletContext.Provider>
  );
}
