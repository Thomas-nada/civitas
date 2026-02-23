import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import GovernanceActionsPage from "./pages/GovernanceActionsPage";
import GuidePage from "./pages/GuidePage";
import AboutPage from "./pages/AboutPage";
import NclPage from "./pages/NclPage";
import AppTopbar from "./components/AppTopbar";

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

  return (
    <>
      <BackgroundMotionClock />
      <ZoomCompensation />
      <div className="global-watermark" aria-hidden="true">
        <div className="global-watermark-art" />
      </div>
      <ScrollToTopOnRouteChange />
      <AppTopbar theme={theme} onToggleTheme={toggleTheme} />
      {routeTransitionEnabled ? <RouteTransitionFade /> : null}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/actions" element={<GovernanceActionsPage />} />
        <Route path="/ncl" element={<NclPage />} />
        <Route path="/dreps" element={<DashboardPage actorType="drep" />} />
        <Route path="/spos" element={<DashboardPage actorType="spo" />} />
        <Route path="/committee" element={<DashboardPage actorType="committee" />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
