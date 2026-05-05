import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { formatLKR } from "../../utils/format";
import "./Orders.css";

function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [user, navigate]);

  if (loading) {
    return <section className="orders-page">Loading orders...</section>;
  }

  if (orders.length === 0) {
    return (
      <section className="orders-page">
        <div className="empty-orders">
          <h1>No orders yet</h1>
          <p>Your orders will appear here after you place an order.</p>
          <Link to="/shop">Start Shopping</Link>
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