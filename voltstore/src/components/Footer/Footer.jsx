import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-top">

        {/* BRAND */}
        <div className="footer-brand">
          <div className="footer-logo">
            <span>Tazz</span> Electronics
          </div>

          <p>
            Premium electronics store in Sri Lanka offering smartphones,
            laptops, accessories, and trusted repair services with fast delivery.
          </p>

          <div className="footer-socials">
            <a href="/">FB</a>
            <a href="/">IG</a>
            <a href="/">TW</a>
            <a href="/">YT</a>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="footer-column">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/repair">Repair</Link>
          <Link to="/orders">Orders</Link>
        </div>

        {/* SERVICES */}
        <div className="footer-column">
          <h4>Services</h4>
          <p>Phone Repair</p>
          <p>Laptop Repair</p>
          <p>Battery Replacement</p>
          <p>Software Support</p>
        </div>

        {/* CONTACT */}
        <div className="footer-column">
          <h4>Contact</h4>
          <p>support@tazz.lk</p>
          <p>+94 77 123 4567</p>
          <p>Colombo, Sri Lanka</p>

          <div className="footer-badge">
            24/7 Customer Support
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2026 Tazz Electronics. All rights reserved.</p>
        <div>
          <span>Privacy Policy</span>
          <span>Terms</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;