import { Link, useParams } from "react-router-dom";
import "./OrderSuccess.css";

function OrderSuccess() {
  const { orderNumber } = useParams();

  return (
    <section className="success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully</h1>
        <p>
          Thank you for your purchase. Your order has been received and is now
          being processed.
        </p>

        <div className="order-number">
          <span>Order Number</span>
          <strong>{orderNumber}</strong>
        </div>

        <div className="success-actions">
          <Link to="/shop" className="primary-action">
            Continue Shopping
          </Link>

          <Link to="/" className="secondary-action">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}

export default OrderSuccess;