import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// Simple Sun/Moon SVG Icons
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { isLightMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      {/* Top link row */}
      <div className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 overflow-x-auto">
          <div className="flex items-center justify-start md:justify-center gap-4 text-sm text-indigo-300 whitespace-nowrap min-w-max">
          <NavSimple to="/">Index</NavSimple>
          <NavSimple to="/pricing">Pricing</NavSimple>
          <NavSimple to="/speedtest">Speedtest</NavSimple>
          <NavSimple to="/developers">Developers</NavSimple>
          <NavSimple to="/privacy">Privacy</NavSimple>
          <NavSimple to="/terms">Terms</NavSimple>
          <NavSimple to="/contact">Contact</NavSimple>
          <NavSimple to="/help">Help</NavSimple>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-3">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="INeedStorage logo" className="h-9 w-9 rounded" />
          <span className="font-semibold text-base md:text-lg hover:text-indigo-400 transition-colors">INeedStorages</span>
        </NavLink>

        {/* Secondary Navigation (center) - only visible when authenticated */}
        {isAuthenticated ? (
          <div className="hidden md:flex gap-6 text-sm">
            <NavItem to="/">Overview</NavItem>
            <NavItem to="/files">Files</NavItem>
            <NavItem to="/upload-links">Upload Links</NavItem>
            <NavItem to="/subscriptions">Subscriptions</NavItem>
            <NavItem to="/settings">Settings</NavItem>
          </div>
        ) : null}

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition-colors"
            data-no-invert="true"
            aria-label="Toggle theme"
          >
            {isLightMode ? <MoonIcon /> : <SunIcon />}
          </button>
          
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white text-sm"
            >
              Logout
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-zinc-400 hover:text-white text-sm"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
              >
                Signup
              </button>
            </>
          )}
        </div>
      </nav>
      {isAuthenticated && (
        <div className="md:hidden border-t border-zinc-900 px-4 py-2 overflow-x-auto">
          <div className="flex gap-4 text-sm whitespace-nowrap min-w-max">
            <NavItem to="/">Overview</NavItem>
            <NavItem to="/files">Files</NavItem>
            <NavItem to="/upload-links">Upload Links</NavItem>
            <NavItem to="/subscriptions">Subscriptions</NavItem>
            <NavItem to="/settings">Settings</NavItem>
          </div>
        </div>
      )}
    </header>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? "text-white font-medium" : "text-zinc-400 hover:text-white"
      }
    >
      {children}
    </NavLink>
  );
}

function NavSimple({ to, children }) {
  return (
    <NavLink to={to} className="hover:underline">
      {children}
    </NavLink>
  );
}
