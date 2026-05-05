import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getProductImageUrl } from "../../lib/supabaseClient";
import { formatLKR } from "../../utils/format";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Cart.css";

function Cart() {
  const {
    cart,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeFromCart,
  } = useCart();

  if (cart.length === 0) {
    return (
      <section className="cart-page">
        <div className="empty-cart">
          <h1>Your cart is empty</h1>
          <p>Add products to your cart and they will appear here.</p>
          <Link to="/shop" className="shop-now-btn">Shop Now</Link>
        </div>
      </section>
    );
  }

  const navigate = useNavigate();
  const { user } = useAuth();

  function handleCheckout() {
    if (!user) {
      navigate("/login");
      return;
    }

    navigate("/checkout");
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
                      updateQuantity(item.product.id, item.quantity - 1)
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