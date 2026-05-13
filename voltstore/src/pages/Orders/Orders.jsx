import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase, getProductImageUrl } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { formatLKR } from "../../utils/format";
import "./Orders.css";

const STATUS_LABEL = {
  pending:   "Pending",
  confirmed: "Confirmed",
  shipped:   "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  paid:      "Paid",
  unpaid:    "Unpaid",
  failed:    "Failed",
};

const DELIVERY_STEPS = ["confirmed", "shipped", "delivered"];

const STEP_META = {
  confirmed: { icon: "✓", label: "Confirmed",  sub: "Order accepted" },
  shipped:   { icon: "→", label: "Shipped",    sub: "On the way"     },
  delivered: { icon: "★", label: "Delivered",  sub: "Handed over"    },
};

function ChevronIcon({ open }) {
  return (
    <svg
      className={`chevron-icon${open ? " open" : ""}`}
      width="16" height="16" viewBox="0 0 16 16" fill="none"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressTracker({ status }) {
  const activeIdx = DELIVERY_STEPS.indexOf(status);

  return (
    <div className="tracker-row">
      <p className="sec-label">Delivery Progress</p>
      <div className="tracker">
        {DELIVERY_STEPS.map((step, i) => {
          const done   = i <= activeIdx;
          const active = i === activeIdx;
          const meta   = STEP_META[step];

          return (
            <div key={step} className={`t-step${done ? " done" : ""}${active ? " active" : ""}`}>
              {/* connector line before (except first) */}
              {i > 0 && (
                <div className={`t-line-before${done ? " done" : ""}`} />
              )}

              <div className="t-dot-wrap">
                <div className="t-dot">
                  {done ? <span className="t-check">{meta.icon}</span> : <span className="t-idx">{i + 1}</span>}
                </div>
                {active && <div className="t-pulse" />}
              </div>

              <div className="t-labels">
                <span className="t-name">{meta.label}</span>
                <span className="t-sub">{meta.sub}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const showTracker = DELIVERY_STEPS.includes(order.order_status);
  const itemCount   = order.order_items?.length ?? 0;

  return (
    <div className={`order-card${open ? " open" : ""}`}>

      {/* ── Header ── */}
      <button className="card-header" onClick={() => setOpen(v => !v)} aria-expanded={open}>

        {/* Thumb stack */}
        <div className="thumb-stack">
          {order.order_items?.slice(0, 3).map((item) => {
            const primary =
              item.product?.product_images?.find(img => img.is_primary) ||
              item.product?.product_images?.[0];
            const url = primary ? getProductImageUrl(primary.image_path) : null;
            return (
              <div className="thumb" key={item.id}>
                {url
                  ? <img src={url} alt={item.product_name} />
                  : <span>{item.product_name?.[0]?.toUpperCase() ?? "?"}</span>
                }
              </div>
            );
          })}
          {itemCount > 3 && (
            <div className="thumb thumb-more">+{itemCount - 3}</div>
          )}
        </div>

        {/* Meta */}
        <div className="card-meta">
          <div className="meta-top">
            <span className="order-num">{order.order_number}</span>
            <span className="meta-dot" />
            <span className="order-date">
              {new Date(order.created_at).toLocaleDateString("en-LK", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </span>
            <span className="item-count-tag">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
          </div>
          <div className="pills">
            <span className={`pill status-${order.order_status}`}>
              {STATUS_LABEL[order.order_status] ?? order.order_status}
            </span>
            <span className={`pill pay-${order.payment_status}`}>
              {STATUS_LABEL[order.payment_status] ?? order.payment_status}
            </span>
          </div>
        </div>

        {/* Total + toggle */}
        <div className="card-right">
          <div className="total-block">
            <span className="total-label">Total</span>
            <strong className="header-total">{formatLKR(order.total_amount)}</strong>
          </div>
          <div className={`chevron-wrap${open ? " open" : ""}`}>
            <ChevronIcon open={open} />
          </div>
        </div>
      </button>

      {/* ── Body ── */}
      <div className="card-body">
        <div className="card-body-inner">
          <div className="card-body-content">

            {/* Tracker */}
            {showTracker && <ProgressTracker status={order.order_status} />}

            {/* Items */}
            <div className="items-section">
              <p className="sec-label">
                Items Ordered
                <span className="sec-count">{itemCount}</span>
              </p>
              <div className="items-list">
                {order.order_items?.map((item) => {
                  const primary =
                    item.product?.product_images?.find(img => img.is_primary) ||
                    item.product?.product_images?.[0];
                  const url = primary ? getProductImageUrl(primary.image_path) : null;
                  return (
                    <div className="item-row" key={item.id}>
                      <div className="item-img">
                        {url
                          ? <img src={url} alt={item.product_name} />
                          : <span>{item.product_name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className="item-info">
                        <span className="item-name">{item.product_name}</span>
                        <span className="item-qty">Qty · {item.quantity}</span>
                      </div>
                      <div className="item-price-col">
                        <strong className="item-price">{formatLKR(item.line_total)}</strong>
                        {item.quantity > 1 && (
                          <span className="item-unit">{formatLKR(item.line_total / item.quantity)} each</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="footer-grid">
              <div className="footer-section">
                <p className="sec-label">Delivery Address</p>
                {order.addresses ? (
                  <address className="addr-block">
                    <span className="addr-name">{order.addresses.full_name}</span>
                    <span className="addr-phone">{order.addresses.phone}</span>
                    <span>{order.addresses.line1}{order.addresses.line2 ? `, ${order.addresses.line2}` : ""}</span>
                    <span>{order.addresses.city}{order.addresses.district ? `, ${order.addresses.district}` : ""}</span>
                  </address>
                ) : (
                  <p className="no-data">No address on file</p>
                )}
              </div>

              <div className="footer-section">
                <p className="sec-label">Order Summary</p>
                <div className="summary-card">
                  <div className="sum-row">
                    <span>Subtotal</span>
                    <span>{formatLKR(order.subtotal)}</span>
                  </div>
                  <div className="sum-row">
                    <span>Delivery</span>
                    <span>{order.delivery_fee === 0 ? "Free" : formatLKR(order.delivery_fee)}</span>
                  </div>
                  <div className="sum-row sum-total">
                    <span>Total</span>
                    <strong>{formatLKR(order.total_amount)}</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty illustration ── */
const EmptyIllustration = () => (
  <svg className="empty-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="30" y="80" width="140" height="100" rx="14" fill="var(--bg-card)" stroke="var(--acc)" strokeWidth="3" />
    <path d="M22,80 L178,80 L160,50 L40,50 Z" fill="var(--bg-soft)" stroke="var(--acc)" strokeWidth="3" strokeLinejoin="round" />
    <rect x="85" y="80" width="30" height="40" fill="var(--acc)" opacity="0.12" stroke="var(--acc)" strokeWidth="1.5" />
    <circle cx="80" cy="130" r="7" fill="var(--acc)" />
    <circle cx="80" cy="130" r="3" fill="var(--bg-card)" />
    <circle cx="120" cy="130" r="7" fill="var(--acc)" />
    <circle cx="120" cy="130" r="3" fill="var(--bg-card)" />
    <path d="M88,155 Q100,147 112,155" fill="none" stroke="var(--acc)" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

/* ── Page ── */
export default function Orders() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            addresses(*),
            order_items(
              *,
              product:products(
                id, name,
                product_images(*)
              )
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data ?? []);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <section className="orders-page">
        <div className="skeleton-wrap">
          {[78, 92, 78].map((h, i) => (
            <div key={i} className="skeleton-card" style={{ height: h }} />
          ))}
        </div>
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="orders-page">
        <div className="empty-state">
          <EmptyIllustration />
          <div className="empty-text">
            <h1>No orders yet</h1>
            <p>Your completed purchases will appear here.</p>
          </div>
          <Link to="/shop" className="shop-btn">Browse Collection</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-page">
      <header className="page-header">
        <div className="title-row">
          <h1>My Orders</h1>
          <span className="count-badge">{orders.length}</span>
        </div>
        <p>Track your purchases and delivery progress</p>
      </header>

      <div className="orders-list">
        {orders.map((order, idx) => (
          <OrderCard
            key={order.id}
            order={order}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </section>
  );
}