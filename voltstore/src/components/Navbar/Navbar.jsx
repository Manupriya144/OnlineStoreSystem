import { Link, NavLink } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo">
        Tazz<span>Electronics</span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/shop">Shop</NavLink>
        <a href="#repair">Repair</a>
        <a href="#contact">Contact</a>
      </nav>

      <div className="nav-actions">
        <button className="login-btn">Login</button>
        <button className="cart-btn">Cart</button>
      </div>
    </header>
  );
}

export default Navbar;