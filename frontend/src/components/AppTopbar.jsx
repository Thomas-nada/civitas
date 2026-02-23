import { Link, NavLink, useLocation } from "react-router-dom";

export default function AppTopbar({ theme = "dark", onToggleTheme }) {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const logoSrc = theme === "light" ? "/civitas-logo-light.svg" : "/civitas-logo.svg";

  return (
    <header className="topbar">
      <div className="topbar-inner shell">
        <div className={`topbar-row-main${isLanding ? " is-landing" : ""}`}>
          {!isLanding ? (
            <Link to="/" className="brand-home-link" aria-label="Go to Civitas home">
              <div className="brand-lockup" aria-label="Civitas">
                <img className="brand-mark" src={logoSrc} alt="Civitas logo" />
                <div className="brand-text">
                  <p className="brand">Civitas</p>
                  <p className="brand-slogan">Track power. Trust decisions.</p>
                </div>
              </div>
            </Link>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
        <nav className="topnav topnav-row">
          <NavLink to="/dreps" className={({ isActive }) => (isActive ? "active" : "")}>
            DReps
          </NavLink>
          <NavLink to="/spos" className={({ isActive }) => (isActive ? "active" : "")}>
            SPOs
          </NavLink>
          <NavLink to="/committee" className={({ isActive }) => (isActive ? "active" : "")}>
            Committee
          </NavLink>
          <NavLink to="/actions" className={({ isActive }) => (isActive ? "active" : "")}>
            Actions
          </NavLink>
          <NavLink to="/ncl" className={({ isActive }) => (isActive ? "active" : "")}>
            NCL
          </NavLink>
          <NavLink to="/guide" className={({ isActive }) => (isActive ? "active" : "")}>
            Guide
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
            About
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
