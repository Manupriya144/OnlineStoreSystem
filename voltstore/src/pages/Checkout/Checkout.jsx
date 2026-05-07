import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatLKR } from "../../utils/format";
import "./Checkout.css"

function generateOrderNumber() {
  return "TZ-" + Date.now().toString(36).toUpperCase();
}

function generateTransactionId() {
  return "TXN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Luhn's Algorithm — validates card number checksums
function luhnCheck(number) {
  const clean = number.replace(/\D/g, "");
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function detectCardBrand(number) {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "VISA";
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "MASTERCARD";
  if (/^3[47]/.test(clean)) return "AMEX";
  if (/^6(?:011|5)/.test(clean)) return "DISCOVER";
  return "CARD";
}

function formatCardNumber(raw) {
  const clean = raw.replace(/\D/g, "").slice(0, 16);
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw) {
  const clean = raw.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) return clean.slice(0, 2) + "/" + clean.slice(2);
  return clean;
}

// ─── Card Payment Modal ──────────────────────────────────────────────────────
function CardModal({ onClose, onConfirm, total }) {
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvv: "",
  });
  const [flipped, setFlipped] = useState(false);
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const overlayRef = useRef(null);

  const brand = detectCardBrand(cardData.cardNumber);

  function updateCard(key, raw) {
    let value = raw;
    if (key === "cardNumber") value = formatCardNumber(raw);
    if (key === "expiry") value = formatExpiry(raw);
    if (key === "cvv") value = raw.replace(/\D/g, "").slice(0, 4);
    setCardData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate() {
    const errs = {};
    const cleanNum = cardData.cardNumber.replace(/\D/g, "");
    if (!cleanNum) errs.cardNumber = "Card number is required.";
    else if (!luhnCheck(cleanNum)) errs.cardNumber = "Invalid card number (failed Luhn check).";
    if (!cardData.cardHolder.trim()) errs.cardHolder = "Card holder name is required.";
    const [mm, yy] = (cardData.expiry || "").split("/");
    if (!mm || !yy || parseInt(mm) < 1 || parseInt(mm) > 12)
      errs.expiry = "Enter a valid expiry (MM/YY).";
    else {
      const now = new Date();
      const exp = new Date(2000 + parseInt(yy), parseInt(mm) - 1);
      if (exp < now) errs.expiry = "Card has expired.";
    }
    if (!cardData.cvv || cardData.cvv.length < 3) errs.cvv = "CVV must be 3–4 digits.";
    return errs;
  }

  async function handlePay() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2600));
    setProcessing(false);
    onConfirm(cardData);
  }

  // Close on outside click
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current && !processing) onClose();
  }

  const maskedNum = cardData.cardNumber
    ? cardData.cardNumber.padEnd(19, " ").slice(0, 19)
    : "**** **** **** ****";

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-box">
        {processing ? (
          <div className="modal-processing">
            <div className="processing-ring">
              <svg viewBox="0 0 80 80" className="ring-svg">
                <circle cx="40" cy="40" r="34" className="ring-track" />
                <circle cx="40" cy="40" r="34" className="ring-fill" />
              </svg>
              <span className="ring-lock">🔒</span>
            </div>
            <h3>Authorising Payment</h3>
            <p>Communicating with secure gateway…</p>
            <div className="processing-steps">
              <span className="step done">✓ Validating card</span>
              <span className="step active">⟳ Authorising transaction</span>
              <span className="step">  Confirming order</span>
            </div>
          </div>
        ) : (
          <>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>

            <div className="modal-header">
              <div className="modal-title-row">
                <span className="modal-lock-icon">🔒</span>
                <h2>Secure Payment</h2>
              </div>
              <p className="modal-subtitle">Demo payment gateway — no real charges</p>
            </div>

            {/* Card Visual */}
            <div
              className={`card-scene ${flipped ? "flipped" : ""}`}
              onClick={() => setFlipped((f) => !f)}
              title="Click to flip"
            >
              <div className="card-3d">
                {/* Front */}
                <div className="card-face card-front">
                  <div className="card-glow" />
                  <div className="card-top-row">
                    <div className="card-chip">
                      <div className="chip-lines">
                        {[...Array(4)].map((_, i) => <span key={i} />)}
                      </div>
                    </div>
                    <div className="card-brand-logo">{brand}</div>
                  </div>
                  <div className="card-number-display">{maskedNum}</div>
                  <div className="card-bottom-row">
                    <div>
                      <div className="card-meta-label">Card Holder</div>
                      <div className="card-meta-value">
                        {cardData.cardHolder || "YOUR NAME"}
                      </div>
                    </div>
                    <div>
                      <div className="card-meta-label">Expires</div>
                      <div className="card-meta-value">{cardData.expiry || "MM/YY"}</div>
                    </div>
                  </div>
                  <div className="card-holographic" />
                </div>
                {/* Back */}
                <div className="card-face card-back">
                  <div className="card-stripe" />
                  <div className="card-sig-row">
                    <div className="card-sig-box">
                      <span>{cardData.cvv ? "•".repeat(cardData.cvv.length) : "CVV"}</span>
                    </div>
                    <div className="card-cvv-label">CVV</div>
                  </div>
                  <div className="card-back-brand">{brand}</div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="modal-fields">
              <div className="mfield">
                <label>Card Number</label>
                <div className={`minput-wrap ${errors.cardNumber ? "err" : ""}`}>
                  <input
                    value={cardData.cardNumber}
                    onChange={(e) => updateCard("cardNumber", e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    inputMode="numeric"
                    maxLength={19}
                  />
                  {cardData.cardNumber && (
                    <span className={`luhn-badge ${luhnCheck(cardData.cardNumber.replace(/\D/g, "")) ? "valid" : "invalid"}`}>
                      {luhnCheck(cardData.cardNumber.replace(/\D/g, "")) ? "✓ Valid" : "✗"}
                    </span>
                  )}
                </div>
                {errors.cardNumber && <p className="field-err">{errors.cardNumber}</p>}
              </div>

              <div className="mfield">
                <label>Card Holder Name</label>
                <div className={`minput-wrap ${errors.cardHolder ? "err" : ""}`}>
                  <input
                    value={cardData.cardHolder}
                    onChange={(e) => updateCard("cardHolder", e.target.value.toUpperCase())}
                    placeholder="JOHN DOE"
                  />
                </div>
                {errors.cardHolder && <p className="field-err">{errors.cardHolder}</p>}
              </div>

              <div className="mfield-row">
                <div className="mfield">
                  <label>Expiry</label>
                  <div className={`minput-wrap ${errors.expiry ? "err" : ""}`}>
                    <input
                      value={cardData.expiry}
                      onChange={(e) => updateCard("expiry", e.target.value)}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      maxLength={5}
                    />
                  </div>
                  {errors.expiry && <p className="field-err">{errors.expiry}</p>}
                </div>

                <div className="mfield">
                  <label>CVV</label>
                  <div className={`minput-wrap ${errors.cvv ? "err" : ""}`}>
                    <input
                      value={cardData.cvv}
                      onChange={(e) => {
                        updateCard("cvv", e.target.value);
                        setFlipped(true);
                      }}
                      onBlur={() => setFlipped(false)}
                      placeholder="•••"
                      inputMode="numeric"
                      maxLength={4}
                      type="password"
                    />
                  </div>
                  {errors.cvv && <p className="field-err">{errors.cvv}</p>}
                </div>
              </div>
            </div>

            <div className="modal-total-row">
              <span>Total to pay</span>
              <strong>{formatLKR(total)}</strong>
            </div>

            <button className="modal-pay-btn" onClick={handlePay}>
              <span className="pay-lock">🔒</span>
              Pay {formatLKR(total)}
            </button>

            <p className="modal-disclaimer">
              256-bit SSL encrypted · Demo only · No real transaction
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Checkout ────────────────────────────────────────────────────────────
function Checkout() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const { cart, subtotal, deliveryFee, total, clearCart } = useCart();

  const [form, setForm] = useState({
    fullName: "", phone: "", line1: "", line2: "",
    city: "", district: "", postalCode: "", notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showCardModal, setShowCardModal] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1); // 1 = delivery, 2 = payment

  if (authLoading) return <section className="checkout-page"><div className="checkout-loading"><div className="loading-ring" /><p>Loading checkout…</p></div></section>;
  if (!user) { navigate("/login"); return null; }
  if (cart.length === 0) return (
    <section className="checkout-page">
      <div className="checkout-empty">
        <div className="empty-icon">🛒</div>
        <h1>Your cart is empty</h1>
        <p>Add some products before checking out.</p>
        <Link to="/shop">Browse Shop</Link>
      </div>
    </section>
  );

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateDelivery() {
    if (!form.fullName || !form.phone || !form.line1 || !form.city) {
      setMessage("Please fill all required fields marked with *");
      return false;
    }
    setMessage("");
    return true;
  }

  function handleContinue() {
    if (validateDelivery()) setStep(2);
  }

  async function finaliseOrder(cardData = null) {
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
          order_status: paymentMethod === "online" ? "confirmed" : "pending",
          payment_status: paymentMethod === "online" ? "paid" : "pending",
          subtotal,
          delivery_fee: deliveryFee,
          total_amount: total,
          currency: "LKR",
          notes: form.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: itemError } = await supabase
        .from("order_items")
        .insert(cart.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          product_slug: item.product.slug,
          unit_price: item.product.price,
          quantity: item.quantity,
          line_total: item.product.price * item.quantity,
        })));

      if (itemError) throw itemError;

      const transactionId = generateTransactionId();

      const { error: paymentError } = await supabase.from("payments").insert({
        order_id: order.id,
        provider: paymentMethod === "online" ? "demo_gateway" : "cash_on_delivery",
        payment_method: paymentMethod === "online" ? "Card" : "COD",
        provider_ref: paymentMethod === "online" ? transactionId : null,
        amount: total,
        currency: "LKR",
        status: paymentMethod === "online" ? "paid" : "pending",
        gateway_payload: paymentMethod === "online" && cardData
          ? { simulated: true, card_last_four: cardData.cardNumber.replace(/\D/g, "").slice(-4), brand: detectCardBrand(cardData.cardNumber) }
          : null,
        paid_at: paymentMethod === "online" ? new Date().toISOString() : null,
      });

      if (paymentError) throw paymentError;

      clearCart();
      navigate(`/order-success/${orderNumber}`);
    } catch (error) {
      setMessage(error.message);
      setPlacing(false);
    }
  }

  async function handlePlaceCOD(e) {
    e.preventDefault();
    if (!validateDelivery()) return;
    await finaliseOrder(null);
  }

  return (
    <section className="checkout-page">
      {showCardModal && (
        <CardModal
          total={total}
          onClose={() => setShowCardModal(false)}
          onConfirm={async (cardData) => {
            setShowCardModal(false);
            await finaliseOrder(cardData);
          }}
        />
      )}

      <div className="checkout-header">
        <div className="checkout-breadcrumb">
          <Link to="/cart">Cart</Link>
          <span className="bc-sep">›</span>
          <span className={step === 1 ? "bc-active" : ""}>Delivery</span>
          <span className="bc-sep">›</span>
          <span className={step === 2 ? "bc-active" : ""}>Payment</span>
        </div>
        <h1>Checkout</h1>
        <p>Review your order and complete your purchase securely.</p>
      </div>

      <div className="checkout-layout">
        <div className="checkout-form">

          {/* Step Indicator */}
          <div className="step-bar">
            <div className={`step-item ${step >= 1 ? "done" : ""}`}>
              <div className="step-dot">1</div>
              <span>Delivery</span>
            </div>
            <div className="step-line" />
            <div className={`step-item ${step >= 2 ? "done" : ""}`}>
              <div className="step-dot">2</div>
              <span>Payment</span>
            </div>
          </div>

          {/* Step 1 — Delivery */}
          <div className={`form-card animated-card ${step === 1 ? "card-visible" : "card-hidden"}`}>
            <div className="card-header">
              <div className="card-icon">📦</div>
              <div>
                <h2>Delivery Information</h2>
                <p>Where should we send your order?</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Full Name <span className="req">*</span></label>
                <input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} placeholder="Mohamed Irfan" />
              </div>
              <div className="field">
                <label>Phone <span className="req">*</span></label>
                <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+94 77 123 4567" />
              </div>
              <div className="field span-2">
                <label>Address Line 1 <span className="req">*</span></label>
                <input value={form.line1} onChange={(e) => updateField("line1", e.target.value)} placeholder="No 12, Main Street" />
              </div>
              <div className="field span-2">
                <label>Address Line 2 <span className="optional">optional</span></label>
                <input value={form.line2} onChange={(e) => updateField("line2", e.target.value)} placeholder="Apartment, building, landmark" />
              </div>
              <div className="field">
                <label>City <span className="req">*</span></label>
                <input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Colombo" />
              </div>
              <div className="field">
                <label>District <span className="optional">optional</span></label>
                <input value={form.district} onChange={(e) => updateField("district", e.target.value)} placeholder="Western" />
              </div>
              <div className="field">
                <label>Postal Code <span className="optional">optional</span></label>
                <input value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} placeholder="00100" />
              </div>
            </div>

            {message && <p className="checkout-message">{message}</p>}

            <button className="continue-btn" onClick={handleContinue}>
              Continue to Payment →
            </button>
          </div>

          {/* Step 2 — Payment */}
          <div className={`form-card animated-card ${step === 2 ? "card-visible" : "card-hidden"}`}>
            <div className="card-header">
              <div className="card-icon">💳</div>
              <div>
                <h2>Payment Method</h2>
                <p>How would you like to pay?</p>
              </div>
            </div>

            <div className="payment-options">
              <div
                className={`payment-tile ${paymentMethod === "cod" ? "active" : ""}`}
                onClick={() => setPaymentMethod("cod")}
              >
                <div className="payment-tile-icon">🏠</div>
                <div className="payment-tile-body">
                  <strong>Cash on Delivery</strong>
                  <p>Pay when your order arrives at your doorstep.</p>
                </div>
                <div className={`payment-radio ${paymentMethod === "cod" ? "checked" : ""}`} />
              </div>

              <div
                className={`payment-tile ${paymentMethod === "online" ? "active" : ""}`}
                onClick={() => setPaymentMethod("online")}
              >
                <div className="payment-tile-icon">🔒</div>
                <div className="payment-tile-body">
                  <strong>Card Payment</strong>
                  <p>Visa, Mastercard, Amex — secure demo gateway.</p>
                </div>
                <div className={`payment-radio ${paymentMethod === "online" ? "checked" : ""}`} />
              </div>
            </div>

            {/* Notes */}
            <div className="notes-section">
              <label>Order Notes <span className="optional">optional</span></label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Any special delivery instructions, access codes, etc."
              />
            </div>

            <div className="step2-actions">
              <button className="back-btn" onClick={() => setStep(1)}>
                ← Back
              </button>
              {paymentMethod === "online" ? (
                <button
                  className="place-order-btn"
                  onClick={() => setShowCardModal(true)}
                  disabled={placing}
                >
                  {placing ? "Processing…" : "Enter Card Details →"}
                </button>
              ) : (
                <button className="place-order-btn" onClick={handlePlaceCOD} disabled={placing}>
                  {placing ? "Placing Order…" : "Place Order →"}
                </button>
              )}
            </div>

            {message && <p className="checkout-message">{message}</p>}
          </div>

        </div>

        {/* Order Summary Sidebar */}
        <aside className="checkout-summary">
          <div className="summary-header">
            <h2>Order Summary</h2>
            <span className="summary-count">{cart.reduce((a, i) => a + i.quantity, 0)} items</span>
          </div>

          <div className="summary-items">
            {cart.map((item) => (
              <div className="summary-item" key={item.product.id}>
                <div className="si-info">
                  <span className="si-name">{item.product.name}</span>
                  <span className="si-qty">× {item.quantity}</span>
                </div>
                <strong>{formatLKR(item.product.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="summary-divider" />

          <div className="summary-line">
            <span>Subtotal</span>
            <strong>{formatLKR(subtotal)}</strong>
          </div>
          <div className="summary-line">
            <span>Delivery</span>
            <strong className={deliveryFee === 0 ? "free" : ""}>{deliveryFee === 0 ? "Free" : formatLKR(deliveryFee)}</strong>
          </div>

          <div className="summary-divider" />

          <div className="summary-line total">
            <span>Total</span>
            <strong>{formatLKR(total)}</strong>
          </div>

          <div className="summary-method-badge">
            {paymentMethod === "cod" ? "💵 Cash on Delivery" : "🔒 Card Payment"}
          </div>

          <div className="summary-trust">
            <span>🛡️ Secure checkout</span>
            <span>📦 Tracked delivery</span>
            <span>↩️ Easy returns</span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;