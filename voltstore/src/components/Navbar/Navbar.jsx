import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { cartCount } = useCart();
  const { user, role, logout, authLoading } = useAuth();
  const location = useLocation();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const normalizedRole = role ? role.trim().toLowerCase() : "";

  /* ── shrink on scroll ── */
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── close drawer on route change ── */
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  /* ── close user dropdown on outside click ── */
  useEffect(() => {
    function onClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* ── lock body scroll when drawer open ── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* user initial for avatar */
  const userInitial = user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        {/* ── LOGO ── */}
        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark">TE</span>
          <span className="nav-logo-text">
            Tazz<em>Electronics</em>
          </span>
        </Link>

        {/* ── DESKTOP LINKS ── */}
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/"      end>Home</NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/repair">Repair</NavLink>
          {!authLoading && user && (
            <NavLink to="/orders">Orders</NavLink>
          )}
          {!authLoading && normalizedRole === "admin" && (
            <NavLink to="/admin">
              <span className="nav-admin-pill">Admin</span>
            </NavLink>
          )}
        </nav>

        {/* ── DESKTOP ACTIONS ── */}
        <div className="nav-actions">

          {/* cart */}
          <Link to="/cart" className="nav-cart" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span className="nav-cart-count">{cartCount > 99 ? "99+" : cartCount}</span>
            )}
          </Link>

          {/* auth */}
          {authLoading ? (
            <div className="nav-auth-skeleton" />
          ) : user ? (
            <div className="nav-user" ref={userMenuRef}>
              <button
                className="nav-avatar"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-expanded={userMenuOpen}
                aria-label="User menu"
              >
                {userInitial}
                <span className="nav-avatar-chevron" data-open={userMenuOpen}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </button>

              {userMenuOpen && (
                <div className="nav-user-menu">
                  <div className="nav-user-menu-email">{user.email}</div>
                  <div className="nav-user-menu-divider" />
                  <Link to="/orders" className="nav-user-menu-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    My Orders
                  </Link>
                  {normalizedRole === "admin" && (
                    <Link to="/admin" className="nav-user-menu-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <div className="nav-user-menu-divider" />
                  <button className="nav-user-menu-item nav-user-menu-logout" onClick={logout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="nav-login-btn">
              Login
            </Link>
          )}

          {/* mobile hamburger */}
          <button
            className={`nav-hamburger ${menuOpen ? "nav-hamburger--open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      <div
        className={`nav-drawer-overlay ${menuOpen ? "nav-drawer-overlay--open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`nav-drawer ${menuOpen ? "nav-drawer--open" : ""}`} aria-label="Mobile menu">
        <div className="nav-drawer-header">
          <Link to="/" className="nav-logo">
            <span className="nav-logo-mark">TE</span>
            <span className="nav-logo-text">Tazz<em>Electronics</em></span>
          </Link>
          <button className="nav-drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="nav-drawer-links">
          <NavLink to="/" end className="nav-drawer-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </NavLink>
          <NavLink to="/shop" className="nav-drawer-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Shop
          </NavLink>
          <NavLink to="/repair" className="nav-drawer-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            Repair
          </NavLink>
          {!authLoading && user && (
            <NavLink to="/orders" className="nav-drawer-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              My Orders
            </NavLink>
          )}
          {!authLoading && normalizedRole === "admin" && (
            <NavLink to="/admin" className="nav-drawer-link nav-drawer-link--admin">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="nav-drawer-footer">
          {user ? (
            <>
              <div className="nav-drawer-user">
                <div className="nav-drawer-avatar">{userInitial}</div>
                <div className="nav-drawer-user-info">
                  <span>Signed in as</span>
                  <strong>{user.email}</strong>
                </div>
              </div>
              <button className="nav-drawer-logout" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-drawer-login">
              Login →
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

export default Navbar;