import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { cartCount } = useCart();
  const { user, role, logout, authLoading } = useAuth();

  const normalizedRole = role ? role.trim().toLowerCase() : "";

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        Tazz<span>Electronics</span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/shop">Shop</NavLink>
        <NavLink to="/repair">Repair</NavLink>

        {!authLoading && user && <NavLink to="/orders">Orders</NavLink>}

        {!authLoading && normalizedRole === "admin" && (
          <NavLink to="/admin">Admin</NavLink>
        )}
      </nav>

      <div className="nav-actions">
        {authLoading ? (
          <span className="login-btn">Loading...</span>
        ) : user ? (
          <button className="login-btn" onClick={logout}>
            Logout
          </button>
        ) : (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}

        <Link to="/cart" className="cart-btn">
          Cart
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </Link>
      </div>
    </header>
  );
}

export default Navbar;