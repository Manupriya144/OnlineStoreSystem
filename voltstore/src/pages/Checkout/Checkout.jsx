import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatLKR } from "../../utils/format";
import "./Checkout.css";

function generateOrderNumber() {
  return "TZ-" + Date.now().toString(36).toUpperCase();
}

function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, subtotal, deliveryFee, total, clearCart } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    district: "",
    postalCode: "",
    notes: "",
  });

  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");

  if (!user) {
    navigate("/login");
    return null;
  }

  if (cart.length === 0) {
    return (
      <section className="checkout-page">
        <div className="checkout-empty">
          <h1>Your cart is empty</h1>
          <p>Add products before checkout.</p>
          <Link to="/shop">Go to Shop</Link>
        </div>
      </section>
    );
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function placeOrder(e) {
    e.preventDefault();

    if (!form.fullName || !form.phone || !form.line1 || !form.city) {
      setMessage("Please fill all required fields.");
      return;
    }

    try {
      setPlacing(true);
      setMessage("");

      const { data: address, error: addressError } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          full_name: form.fullName,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          district: form.district,
          postal_code: form.postalCode,
          country: "Sri Lanka",
          is_default: false,
        })
        .select()
        .single();

      if (addressError) throw addressError;

      const orderNumber = generateOrderNumber();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          address_id: address.id,
          order_status: "pending",
          payment_status: "pending",
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: total,
          currency: "LKR",
          notes: form.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_slug: item.product.slug,
        unit_price: item.product.price,
        quantity: item.quantity,
        line_total: item.product.price * item.quantity,
      }));

      const { error: itemError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemError) throw itemError;

      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: order.id,
        provider: "cash_on_delivery",
        payment_method: "COD",
        amount: total,
        currency: "LKR",
        status: "pending",
      });

      if (paymentError) throw paymentError;

      clearCart();
      navigate(`/order-success/${orderNumber}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <section className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Complete your order with delivery details.</p>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={placeOrder}>
          <div className="form-card">
            <h2>Delivery Information</h2>

            <div className="form-grid">
              <div className="field">
                <label>Full Name *</label>
                <input
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Mohamed Irfan"
                />
              </div>

              <div className="field">
                <label>Phone *</label>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+94 77 123 4567"
                />
              </div>

              <div className="field span-2">
                <label>Address Line 1 *</label>
                <input
                  value={form.line1}
                  onChange={(e) => updateField("line1", e.target.value)}
                  placeholder="No 12, Main Street"
                />
              </div>

              <div className="field span-2">
                <label>Address Line 2</label>
                <input
                  value={form.line2}
                  onChange={(e) => updateField("line2", e.target.value)}
                  placeholder="Apartment, building, landmark"
                />
              </div>

              <div className="field">
                <label>City *</label>
                <input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Colombo"
                />
              </div>

              <div className="field">
                <label>District</label>
                <input
                  value={form.district}
                  onChange={(e) => updateField("district", e.target.value)}
                  placeholder="Western"
                />
              </div>

              <div className="field">
                <label>Postal Code</label>
                <input
                  value={form.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  placeholder="00100"
                />
              </div>
            </div>
          </div>

          <div className="form-card">
            <h2>Payment Method</h2>

            <div className="payment-method">
              <div>
                <strong>Cash on Delivery</strong>
                <p>Pay when your order arrives.</p>
              </div>
              <span>Selected</span>
            </div>
          </div>

          <div className="form-card">
            <h2>Order Notes</h2>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any delivery instructions..."
            />
          </div>

          {message && <p className="checkout-message">{message}</p>}
        </form>

        <aside className="checkout-summary">
          <h2>Order Summary</h2>

          <div className="summary-items">
            {cart.map((item) => (
              <div className="summary-item" key={item.product.id}>
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <strong>{formatLKR(item.product.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="summary-line">
            <span>Subtotal</span>
            <strong>{formatLKR(subtotal)}</strong>
          </div>

          <div className="summary-line">
            <span>Delivery</span>
            <strong>{deliveryFee === 0 ? "Free" : formatLKR(deliveryFee)}</strong>
          </div>

          <div className="summary-line total">
            <span>Total</span>
            <strong>{formatLKR(total)}</strong>
          </div>

          <button
            className="place-order-btn"
            onClick={placeOrder}
            disabled={placing}
          >
            {placing ? "Placing Order..." : "Place Order"}
          </button>

          <p className="secure-note">
            Your order will be saved securely. Payment is Cash on Delivery.
          </p>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;