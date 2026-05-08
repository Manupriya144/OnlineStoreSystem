import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getProductImageUrl } from "../../lib/supabaseClient";
import { formatLKR } from "../../utils/format";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Cart.css";

const EmptyCartIllustration = () => (
  <svg
    className="empty-cart-svg"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Handle */}
    <path
      d="M30,60 Q30,30 60,30 L160,30"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="5"
      strokeLinecap="round"
    />
    {/* Handle stem */}
    <line
      x1="30" y1="60" x2="38" y2="105"
      stroke="var(--accent)" strokeWidth="5" strokeLinecap="round"
    />

    {/* Cart body */}
    <rect
      x="38" y="105" width="138" height="60"
      rx="12"
      fill="var(--bg-card)"
      stroke="var(--accent)"
      strokeWidth="3"
    />

    {/* Grid lines */}
    <line x1="38" y1="130" x2="176" y2="130" stroke="var(--accent)" strokeWidth="1" opacity="0.25"/>
    <line x1="38" y1="150" x2="176" y2="150" stroke="var(--accent)" strokeWidth="1" opacity="0.25"/>
    <line x1="84" y1="105" x2="84" y2="165" stroke="var(--accent)" strokeWidth="1" opacity="0.25"/>
    <line x1="130" y1="105" x2="130" y2="165" stroke="var(--accent)" strokeWidth="1" opacity="0.25"/>

    {/* Eyes */}
    <circle cx="80" cy="122" r="7" fill="var(--accent)"/>
    <circle cx="80" cy="122" r="3" fill="var(--bg-card)"/>
    <circle cx="126" cy="122" r="7" fill="var(--accent)"/>
    <circle cx="126" cy="122" r="3" fill="var(--bg-card)"/>

    {/* Sad mouth */}
    <path
      d="M90,148 Q107,140 124,148"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Legs */}
    <line x1="176" y1="165" x2="183" y2="182" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"/>
    <line x1="38"  y1="165" x2="31"  y2="182" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"/>

    {/* Wheels */}
    <circle cx="52"  cy="186" r="12" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="3"/>
    <circle cx="52"  cy="186" r="5"  fill="var(--bg-soft)" stroke="var(--accent)" strokeWidth="2"/>
    <circle cx="162" cy="186" r="12" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="3"/>
    <circle cx="162" cy="186" r="5"  fill="var(--bg-soft)" stroke="var(--accent)" strokeWidth="2"/>

    {/* Floating stars / sparkles */}
    <circle cx="12"  cy="50"  r="3" fill="var(--accent)" opacity="0.4"/>
    <circle cx="188" cy="65"  r="4" fill="var(--accent)" opacity="0.3"/>
    <circle cx="20"  cy="95"  r="2" fill="var(--accent)" opacity="0.3"/>
    <circle cx="180" cy="100" r="2.5" fill="var(--accent)" opacity="0.35"/>
  </svg>
);

function Cart() {
  const {
    cart,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  function handleCheckout() {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/checkout");
  }

  if (cart.length === 0) {
    return (
      <section className="cart-page">
        <div className="empty-cart">
          <EmptyCartIllustration />
          <h1>Your cart is empty</h1>
          <p>Add products to your cart and they will appear here.</p>
          <Link to="/shop" className="shop-now-btn">Shop Now</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <p>{cart.length} product(s) in your cart</p>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => {
            const primaryImage =
              item.product.product_images?.find((img) => img.is_primary) ||
              item.product.product_images?.[0];

            const imageUrl = getProductImageUrl(primaryImage?.image_path);

            return (
              <div className="cart-item" key={item.product.id}>
                <div className="cart-img">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.product.name} />
                  ) : (
                    <span>No Image</span>
                  )}
                </div>

                <div className="cart-info">
                  <h3>{item.product.name}</h3>
                  <p>{item.product.brands?.name}</p>
                  <strong>{formatLKR(item.product.price)}</strong>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="qty-control">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>

                <div className="line-total">
                  {formatLKR(item.product.price * item.quantity)}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatLKR(subtotal)}</strong>
          </div>

          <div className="summary-row">
            <span>Delivery</span>
            <strong>{deliveryFee === 0 ? "Free" : formatLKR(deliveryFee)}</strong>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatLKR(total)}</strong>
          </div>

          <button className="checkout-btn" onClick={handleCheckout}>
            Proceed to Checkout
          </button>
          <Link to="/shop" className="continue-link">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </section>
  );
}

export default Cart;