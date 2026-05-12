import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getProductImageUrl } from "../../lib/supabaseClient";
import { formatLKR } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";
import "./Cart.css";

const EmptyCartIllustration = () => (
  <svg
    className="empty-cart-svg"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M30,60 Q30,30 60,30 L160,30" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
    <line x1="30" y1="60" x2="38" y2="105" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
    <rect x="38" y="105" width="138" height="60" rx="12" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="3" />
    <line x1="38" y1="130" x2="176" y2="130" stroke="var(--accent)" strokeWidth="1" opacity="0.25" />
    <line x1="38" y1="150" x2="176" y2="150" stroke="var(--accent)" strokeWidth="1" opacity="0.25" />
    <line x1="84" y1="105" x2="84" y2="165" stroke="var(--accent)" strokeWidth="1" opacity="0.25" />
    <line x1="130" y1="105" x2="130" y2="165" stroke="var(--accent)" strokeWidth="1" opacity="0.25" />
    <circle cx="80" cy="122" r="7" fill="var(--accent)" />
    <circle cx="80" cy="122" r="3" fill="var(--bg-card)" />
    <circle cx="126" cy="122" r="7" fill="var(--accent)" />
    <circle cx="126" cy="122" r="3" fill="var(--bg-card)" />
    <path d="M90,148 Q107,140 124,148" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    <line x1="176" y1="165" x2="183" y2="182" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    <line x1="38" y1="165" x2="31" y2="182" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    <circle cx="52" cy="186" r="12" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="3" />
    <circle cx="52" cy="186" r="5" fill="var(--bg-soft)" stroke="var(--accent)" strokeWidth="2" />
    <circle cx="162" cy="186" r="12" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="3" />
    <circle cx="162" cy="186" r="5" fill="var(--bg-soft)" stroke="var(--accent)" strokeWidth="2" />
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
          <Link to="/shop" className="shop-now-btn">
            Shop Now
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-header premium-cart-header">
        <div>
          <span className="cart-eyebrow">Tazz Electronics Cart</span>
          <h1>Your Tech Bag</h1>
          <p>
            Review your selected electronics, manage quantities, and continue to
            a secure checkout experience.
          </p>
        </div>

        <div className="cart-header-stat">
          <span>{cart.length}</span>
          <p>{cart.length === 1 ? "Item ready" : "Items ready"}</p>
        </div>
      </div>

      {/* <div className="cart-promo-strip">
        <div className="promo-icon">⚡</div>
        <div>
          <span>Premium checkout experience</span>
          <strong>Fast delivery, secure payments, and warranty support.</strong>
        </div>
        <p>Built for a smooth online shopping experience.</p>
      </div> */}

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map((item) => {
            const product = item.product;

            const primaryImage =
              product.product_images?.find((img) => img.is_primary) ||
              product.product_images?.[0];

            const imageUrl = getProductImageUrl(primaryImage?.image_path);

            return (
              <article className="cart-item" key={product.id}>
                <div className="cart-img">
                  <span className="image-glow"></span>

                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} />
                  ) : (
                    <span>No Image</span>
                  )}
                </div>

                <div className="cart-info">
                  <div className="cart-tags">
                    <span>{product.brands?.name || "Tazz"}</span>
                    <span>In Stock</span>
                    <span>Verified</span>
                  </div>

                  <h3>{product.name}</h3>

                  <p>
                    Premium tech product with secure ordering, delivery support,
                    and after-sales confidence.
                  </p>

                  <div className="cart-benefits">
                    <span>🚚 Fast Delivery</span>
                    <span>🔒 Secure Order</span>
                    <span>🛡 Warranty Support</span>
                  </div>

                  <strong className="mobile-item-price">
                    {formatLKR(product.price)}
                  </strong>

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFromCart(product.id)}
                  >
                    Remove item
                  </button>
                </div>

                <div className="item-price-box">
                  <span>Unit Price</span>
                  <strong>{formatLKR(product.price)}</strong>
                </div>

                <div className="qty-wrap">
                  <span>Quantity</span>

                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          product.id,
                          Math.max(1, item.quantity - 1)
                        )
                      }
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(product.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="line-total">
                  <span>Total</span>
                  <strong>{formatLKR(product.price * item.quantity)}</strong>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="cart-summary">
          <div className="summary-top">
            <span>Secure Checkout</span>
            <h2>Order Summary</h2>
            <p>Confirm your total before placing the order.</p>
          </div>

          <div className="summary-card-box">
            <div className="summary-row">
              <span>Items</span>
              <strong>{cart.length}</strong>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatLKR(subtotal)}</strong>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <strong>
                {deliveryFee === 0 ? "Free" : formatLKR(deliveryFee)}
              </strong>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <strong>{formatLKR(total)}</strong>
            </div>
          </div>

          <div className="payment-preview">
            <div>
              <span>Payment Options</span>
              <strong>COD / Online Card</strong>
            </div>
            <span className="payment-icon">💳</span>
          </div>

          <button className="checkout-btn" onClick={handleCheckout}>
            {authLoading ? "Checking..." : "Proceed to Checkout"}
          </button>

          <Link to="/shop" className="continue-link">
            Continue Shopping
          </Link>

          <div className="trust-list">
            <span>🔒 Secure checkout</span>
            <span>🚚 Islandwide delivery</span>
            <span>🛡 Warranty support</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Cart;