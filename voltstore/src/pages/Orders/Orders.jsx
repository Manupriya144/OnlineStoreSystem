import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { formatLKR } from "../../utils/format";
import "./Orders.css";

function Orders() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const EmptyOrdersIllustration = () => (
    <svg
      className="empty-orders-svg"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Box body */}
      <rect
        x="30" y="80" width="140" height="100"
        rx="14"
        fill="var(--bg-card)"
        stroke="var(--accent)"
        strokeWidth="3"
      />

      {/* Box lid */}
      <path
        d="M22,80 L178,80 L160,50 L40,50 Z"
        fill="var(--bg-soft)"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Lid crease */}
      <line
        x1="40" y1="50" x2="30" y2="80"
        stroke="var(--accent)" strokeWidth="1.5" opacity="0.4"
      />
      <line
        x1="160" y1="50" x2="178" y2="80"
        stroke="var(--accent)" strokeWidth="1.5" opacity="0.4"
      />

      {/* Tape strip on lid */}
      <rect
        x="85" y="48" width="30" height="34"
        rx="4"
        fill="var(--accent)"
        opacity="0.2"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />

      {/* Tape strip on body */}
      <rect
        x="85" y="80" width="30" height="40"
        rx="0"
        fill="var(--accent)"
        opacity="0.15"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />

      {/* Eyes on box face */}
      <circle cx="80"  cy="130" r="7" fill="var(--accent)"/>
      <circle cx="80"  cy="130" r="3" fill="var(--bg-card)"/>
      <circle cx="120" cy="130" r="7" fill="var(--accent)"/>
      <circle cx="120" cy="130" r="3" fill="var(--bg-card)"/>

      {/* Sad mouth */}
      <path
        d="M88,155 Q100,147 112,155"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Floating dots */}
      <circle cx="14"  cy="70"  r="3"   fill="var(--accent)" opacity="0.35"/>
      <circle cx="186" cy="85"  r="4"   fill="var(--accent)" opacity="0.28"/>
      <circle cx="20"  cy="120" r="2.5" fill="var(--accent)" opacity="0.3"/>
      <circle cx="182" cy="130" r="2"   fill="var(--accent)" opacity="0.32"/>
      <circle cx="170" cy="55"  r="3"   fill="var(--accent)" opacity="0.25"/>
    </svg>
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    async function loadOrders() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            addresses(*),
            order_items(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setOrders(data || []);
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return <section className="orders-page">Loading orders...</section>;
  }

  if (orders.length === 0) {
    return (
      <section className="orders-page">
        <div className="empty-orders">
          <EmptyOrdersIllustration />
          <h1>No orders yet</h1>
          <p>Your completed orders will show up here.</p>
          <Link to="/shop">Shop Now</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track your purchases and delivery progress.</p>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-top">
              <div>
                <h2>{order.order_number}</h2>
                <p>
                  {new Date(order.created_at).toLocaleDateString("en-LK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div className="order-statuses">
                <span className={`status ${order.order_status}`}>
                  {order.order_status}
                </span>
                <span className={`status ${order.payment_status}`}>
                  {order.payment_status}
                </span>
              </div>
            </div>

            <div className="order-body">
              <div className="order-items">
                <h3>Items</h3>

                {order.order_items?.map((item) => (
                  <div className="order-item" key={item.id}>
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <strong>{formatLKR(item.line_total)}</strong>
                  </div>
                ))}
              </div>

              <div className="order-address">
                <h3>Delivery Address</h3>

                {order.addresses ? (
                  <>
                    <p>{order.addresses.full_name}</p>
                    <p>{order.addresses.phone}</p>
                    <p>
                      {order.addresses.line1}
                      {order.addresses.line2 ? `, ${order.addresses.line2}` : ""}
                    </p>
                    <p>
                      {order.addresses.city}
                      {order.addresses.district
                        ? `, ${order.addresses.district}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p>No address found</p>
                )}
              </div>
            </div>

            <div className="order-bottom">
              <div>
                <span>Subtotal</span>
                <strong>{formatLKR(order.subtotal)}</strong>
              </div>

              <div>
                <span>Delivery</span>
                <strong>
                  {order.delivery_fee === 0
                    ? "Free"
                    : formatLKR(order.delivery_fee)}
                </strong>
              </div>

              <div className="order-total">
                <span>Total</span>
                <strong>{formatLKR(order.total_amount)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Orders;