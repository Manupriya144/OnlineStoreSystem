import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { formatLKR } from "../../utils/format";
import "./AdminDashboard.css";

function AdminDashboard() {
  const { user, role, authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("products");
  const [orders, setOrders] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    model: "",
    short_description: "",
    description: "",
    price: "",
    stock_qty: "",
    sku: "",
    category_id: "",
    brand_id: "",
  });

  function slugify(text) {
    return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  }

  function updateProductField(key, value) {
    setProductForm((prev) => ({
      ...prev,
      [key]: value,
      slug: key === "name" ? slugify(value) : prev.slug,
    }));
  }

  async function loadAdminData() {
    setLoading(true);

    const { data: orderData } = await supabase
      .from("orders")
      .select(`*, addresses(*), order_items(*)`)
      .order("created_at", { ascending: false });

    const { data: repairData } = await supabase
      .from("repair_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: productData } = await supabase
      .from("products")
      .select(`*, categories(name), brands(name)`)
      .order("created_at", { ascending: false });

    const { data: categoryData } = await supabase.from("categories").select("*").order("name");
    const { data: brandData } = await supabase.from("brands").select("*").order("name");

    setOrders(orderData || []);
    setRepairs(repairData || []);
    setProducts(productData || []);
    setCategories(categoryData || []);
    setBrands(brandData || []);
    setLoading(false);
  }

  useEffect(() => {
    if (role === "admin") loadAdminData();
  }, [role]);

  async function updateOrderStatus(orderId, status) {
    await supabase.from("orders").update({ order_status: status }).eq("id", orderId);
    loadAdminData();
  }

  async function updateRepairStatus(repairId, status) {
    await supabase.from("repair_requests").update({ status }).eq("id", repairId);
    loadAdminData();
  }

  async function addProduct(e) {
    e.preventDefault();

    const { error } = await supabase.from("products").insert({
      name: productForm.name,
      slug: productForm.slug,
      model: productForm.model,
      short_description: productForm.short_description,
      description: productForm.description,
      price: Number(productForm.price),
      stock_qty: Number(productForm.stock_qty),
      sku: productForm.sku || null,
      category_id: productForm.category_id || null,
      brand_id: productForm.brand_id || null,
      is_active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setProductForm({
      name: "",
      slug: "",
      model: "",
      short_description: "",
      description: "",
      price: "",
      stock_qty: "",
      sku: "",
      category_id: "",
      brand_id: "",
    });

    loadAdminData();
  }

  async function updateProductStock(productId, stockQty) {
    await supabase.from("products").update({ stock_qty: Number(stockQty) }).eq("id", productId);
    loadAdminData();
  }

  async function updateProductStatus(productId, isActive) {
    await supabase.from("products").update({ is_active: isActive }).eq("id", productId);
    loadAdminData();
  }

  if (authLoading) return <div className="admin-loading">Checking access...</div>;
  if (!user) return <Navigate to="/login" />;

  if (role !== "admin") {
    return (
      <section className="admin-denied">
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </section>
    );
  }

  if (loading) return <div className="admin-loading">Loading admin dashboard...</div>;

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>TE</span>
          <div>
            <h2>Tazz Admin</h2>
            <p>Control Center</p>
          </div>
        </div>

        <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>
          📦 Products
        </button>
        <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
          🧾 Orders
        </button>
        <button className={activeTab === "repairs" ? "active" : ""} onClick={() => setActiveTab("repairs")}>
          🛠 Repairs
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-hero">
          <div>
            <span className="admin-badge">Dashboard</span>
            <h1>Admin Control Center</h1>
            <p>Manage products, orders, repair requests, and store activity.</p>
          </div>
        </div>

        <div className="admin-stats">
          <div>
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <span>Pending Orders</span>
            <strong>{orders.filter((o) => o.order_status === "pending").length}</strong>
          </div>
          <div>
            <span>Repair Requests</span>
            <strong>{repairs.length}</strong>
          </div>
          <div>
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>
        </div>

        {activeTab === "products" && (
          <div className="admin-panel">
            <div className="panel-title">
              <h2>Product Management</h2>
              <p>Add new products and control product availability.</p>
            </div>

            <form className="admin-product-form" onSubmit={addProduct}>
              <input placeholder="Product name" value={productForm.name} onChange={(e) => updateProductField("name", e.target.value)} required />
              <input placeholder="Slug" value={productForm.slug} onChange={(e) => updateProductField("slug", e.target.value)} required />
              <input placeholder="Model" value={productForm.model} onChange={(e) => updateProductField("model", e.target.value)} />
              <input placeholder="SKU" value={productForm.sku} onChange={(e) => updateProductField("sku", e.target.value)} />
              <input type="number" placeholder="Price" value={productForm.price} onChange={(e) => updateProductField("price", e.target.value)} required />
              <input type="number" placeholder="Stock quantity" value={productForm.stock_qty} onChange={(e) => updateProductField("stock_qty", e.target.value)} required />

              <select value={productForm.category_id} onChange={(e) => updateProductField("category_id", e.target.value)}>
                <option value="">Select Category</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>

              <select value={productForm.brand_id} onChange={(e) => updateProductField("brand_id", e.target.value)}>
                <option value="">Select Brand</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>

              <input className="span-2" placeholder="Short description" value={productForm.short_description} onChange={(e) => updateProductField("short_description", e.target.value)} />
              <textarea className="span-2" placeholder="Full description" value={productForm.description} onChange={(e) => updateProductField("description", e.target.value)} />

              <button className="span-2">Add Product →</button>
            </form>

            <div className="product-admin-grid">
              {products.map((product) => (
                <div className="product-admin-card" key={product.id}>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.brands?.name || "No Brand"} • {product.categories?.name || "No Category"}</p>
                    <strong>{formatLKR(product.price)}</strong>
                  </div>

                  <div className="product-actions">
                    <input type="number" defaultValue={product.stock_qty} onBlur={(e) => updateProductStock(product.id, e.target.value)} />
                    <button className={product.is_active ? "active-btn" : "inactive-btn"} onClick={() => updateProductStatus(product.id, !product.is_active)}>
                      {product.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="admin-panel">
            <div className="panel-title">
              <h2>Orders</h2>
              <p>Track customer orders and update delivery status.</p>
            </div>

            <div className="admin-list">
              {orders.map((order) => (
                <div className="admin-card" key={order.id}>
                  <div className="admin-card-top">
                    <div>
                      <h3>{order.order_number}</h3>
                      <p>{new Date(order.created_at).toLocaleString()}</p>
                    </div>

                    <select value={order.order_status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="admin-card-body">
                    <p><b>Total:</b> {formatLKR(order.total_amount)}</p>
                    <p><b>Payment:</b> {order.payment_status}</p>
                    {order.addresses && <p><b>Address:</b> {order.addresses.line1}, {order.addresses.city}</p>}

                    <div className="mini-items">
                      {order.order_items?.map((item) => (
                        <span key={item.id}>{item.product_name} × {item.quantity}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "repairs" && (
          <div className="admin-panel">
            <div className="panel-title">
              <h2>Repair Requests</h2>
              <p>Manage customer repair bookings and service progress.</p>
            </div>

            <div className="admin-list">
              {repairs.map((repair) => (
                <div className="admin-card" key={repair.id}>
                  <div className="admin-card-top">
                    <div>
                      <h3>{repair.device_type} Repair</h3>
                      <p>{repair.brand} {repair.model}</p>
                    </div>

                    <select value={repair.status} onChange={(e) => updateRepairStatus(repair.id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="admin-card-body">
                    <p><b>Issue:</b> {repair.issue_description}</p>
                    <p><b>Customer:</b> {repair.contact_name}</p>
                    <p><b>Phone:</b> {repair.contact_phone}</p>
                    <p><b>Preferred Date:</b> {repair.preferred_date || "Not selected"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </section>
  );
}

export default AdminDashboard;