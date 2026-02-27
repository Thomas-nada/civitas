import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const [showIntroFade] = useState(() => {
    if (typeof window === "undefined") return false;
    const key = "civitas_landing_intro_seen";
    const seen = window.sessionStorage.getItem(key) === "1";
    if (!seen) {
      window.sessionStorage.setItem(key, "1");
      return true;
    }
    return false;
  });

  useEffect(() => {
    document.body.classList.add("landing-watermark-pulse");
    return () => {
      document.body.classList.remove("landing-watermark-pulse");
    };
  }, []);

  return (
    <div className={`landing-page minimal-landing${showIntroFade ? " minimal-landing-intro" : ""}`}>
      <main className="shell minimal-landing-shell">
        <section className="minimal-logo-hero" aria-label="Civitas">
          <div className="minimal-logo-lockup">
            <p className="brand minimal-hero-brand">Civitas</p>
          </div>
          <p className="minimal-slogan">Track power. Trust decisions.</p>
          <Link className="minimal-enter-btn" to="/actions">
            Enter Civitas
          </Link>
        </section>
      </main>
    </div>
  );
}
