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

  const [imageFiles, setImageFiles] = useState([]);
  const [addingProduct, setAddingProduct] = useState(false);
  const [productMessage, setProductMessage] = useState({ text: "", type: "" });
  const [toast, setToast] = useState({ text: "", type: "" });

  const [specs, setSpecs] = useState([{ spec_name: "", spec_value: "" }]);

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

  function showToast(text, type = "success") {
    setToast({ text, type });

    setTimeout(() => {
      setToast({ text: "", type: "" });
    }, 3000);
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }

  function updateProductField(key, value) {
    setProductForm((prev) => ({
      ...prev,
      [key]: value,
      slug: key === "name" ? slugify(value) : prev.slug,
    }));
  }

  function updateSpec(index, key, value) {
    setSpecs((prev) =>
      prev.map((spec, i) =>
        i === index ? { ...spec, [key]: value } : spec
      )
    );
  }

  function addSpecRow() {
    setSpecs((prev) => [...prev, { spec_name: "", spec_value: "" }]);
  }

  function removeSpecRow(index) {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
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
      .select(`
        *,
        categories(name),
        brands(name),
        product_images(id, image_path, is_primary, created_at),
        product_specs(id, spec_name, spec_value)
      `)
      .order("created_at", { ascending: false });

    const { data: categoryData } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    const { data: brandData } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    setOrders(orderData || []);
    setRepairs(repairData || []);
    setProducts(productData || []);
    setCategories(categoryData || []);
    setBrands(brandData || []);
    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) return;

    if (role === "admin") {
      loadAdminData();
    }
  }, [authLoading, role]);

  async function updateOrderStatus(orderId, status) {
    await supabase
      .from("orders")
      .update({ order_status: status })
      .eq("id", orderId);

    showToast("Order status updated", "success");
    loadAdminData();
  }

  async function updatePaymentStatus(orderId, status) {
    await supabase
      .from("orders")
      .update({ payment_status: status })
      .eq("id", orderId);

    await supabase
      .from("payments")
      .update({
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
      })
      .eq("order_id", orderId);

    showToast("Payment status updated", "success");
    loadAdminData();
  }

  async function updateRepairStatus(repairId, status) {
    await supabase
      .from("repair_requests")
      .update({ status })
      .eq("id", repairId);

    showToast("Repair status updated", "success");
    loadAdminData();
  }

  async function addProduct(e) {
    e.preventDefault();

    try {
      setAddingProduct(true);
      setProductMessage({ text: "", type: "" });

      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert({
          name: productForm.name,
          slug: productForm.slug,
          model: productForm.model || null,
          short_description: productForm.short_description || null,
          description: productForm.description || null,
          price: Number(productForm.price),
          stock_qty: Number(productForm.stock_qty),
          sku: productForm.sku || null,
          category_id: productForm.category_id || null,
          brand_id: productForm.brand_id || null,
          is_active: true,
        })
        .select()
        .single();

      if (productError) throw productError;

      if (imageFiles.length > 0) {
        const imageRows = [];

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `${productData.id}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("product")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          imageRows.push({
            product_id: productData.id,
            image_path: fileName,
            is_primary: i === 0,
          });
        }

        const { error: imageInsertError } = await supabase
          .from("product_images")
          .insert(imageRows);

        if (imageInsertError) throw imageInsertError;
      }

      const validSpecs = specs.filter(
        (spec) => spec.spec_name.trim() && spec.spec_value.trim()
      );

      if (validSpecs.length > 0) {
        const specRows = validSpecs.map((spec) => ({
          product_id: productData.id,
          spec_name: spec.spec_name.trim(),
          spec_value: spec.spec_value.trim(),
        }));

        const { error: specError } = await supabase
          .from("product_specs")
          .insert(specRows);

        if (specError) throw specError;
      }

      setProductMessage({
        text: "Product added successfully!",
        type: "success",
      });

      setImageFiles([]);
      setSpecs([{ spec_name: "", spec_value: "" }]);

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
    } catch (err) {
      setProductMessage({
        text: err.message || "Product adding failed",
        type: "error",
      });
    } finally {
      setAddingProduct(false);
    }
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(`Delete "${product.name}" permanently?`);

    if (!confirmed) return;

    try {
      if (product.product_images?.length > 0) {
        const paths = product.product_images.map((img) => img.image_path);

        const { error: storageError } = await supabase.storage
          .from("product")
          .remove(paths);

        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      showToast("Product deleted successfully!", "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to delete product", "error");
    }
  }

  async function updateProductStock(productId, stockQty) {
    await supabase
      .from("products")
      .update({ stock_qty: Number(stockQty) })
      .eq("id", productId);

    showToast("Stock updated", "success");
    loadAdminData();
  }

  async function updateProductStatus(productId, isActive) {
    await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", productId);

    showToast("Product status updated", "success");
    loadAdminData();
  }

  if (authLoading) return <div className="admin-loading">Checking access…</div>;
  if (!user) return <Navigate to="/login" />;

  if (role !== "admin") {
    return (
      <section className="admin-denied">
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </section>
    );
  }

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;

  return (
    <section className="admin-shell">
      {toast.text && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.text}
        </div>
      )}

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">TE</div>
          <div>
            <h2>Tazz Admin</h2>
            <p>Control Center</p>
          </div>
        </div>

        <span className="admin-nav-label">Manage</span>

        <button
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          <span className="nav-icon">📦</span> Products
        </button>

        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          <span className="nav-icon">🧾</span> Orders
        </button>

        <button
          className={activeTab === "repairs" ? "active" : ""}
          onClick={() => setActiveTab("repairs")}
        >
          <span className="nav-icon">🛠</span> Repairs
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-page-header">
          <span className="admin-section-lbl">Dashboard</span>
          <h1>
            Admin <em>Control</em> Center
          </h1>
          <p>Manage products, orders, repair requests, and store activity.</p>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Pending Orders</span>
            <strong>
              {orders.filter((o) => o.order_status === "pending").length}
            </strong>
          </div>

          <div className="admin-stat-card">
            <span>Repair Requests</span>
            <strong>{repairs.length}</strong>
          </div>

          <div className="admin-stat-card">
            <span>Total Products</span>
            <strong>{products.length}</strong>
          </div>
        </div>

        {activeTab === "products" && (
          <div className="admin-panel">
            <div className="panel-header">
              <div className="panel-header-text">
                <h2>Product Management</h2>
                <p>Add products, upload multiple photos, and manage stock.</p>
              </div>
              <div className="panel-header-icon">📦</div>
            </div>

            <form className="admin-product-form" onSubmit={addProduct}>
              <span className="form-section-title">Product Info</span>

              <div className="form-grid-2">
                <div className="field">
                  <label>Product Name</label>
                  <input
                    placeholder="e.g. iPhone 15 Pro Max"
                    value={productForm.name}
                    onChange={(e) => updateProductField("name", e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Slug</label>
                  <input
                    placeholder="auto-generated"
                    value={productForm.slug}
                    onChange={(e) => updateProductField("slug", e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Model</label>
                  <input
                    placeholder="e.g. A2849"
                    value={productForm.model}
                    onChange={(e) => updateProductField("model", e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>SKU</label>
                  <input
                    placeholder="e.g. APL-IP15PM-256"
                    value={productForm.sku}
                    onChange={(e) => updateProductField("sku", e.target.value)}
                  />
                </div>
              </div>

              <span className="form-section-title">Pricing & Stock</span>

              <div className="form-grid-2">
                <div className="field">
                  <label>Price (LKR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 299900"
                    value={productForm.price}
                    onChange={(e) => updateProductField("price", e.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={productForm.stock_qty}
                    onChange={(e) =>
                      updateProductField("stock_qty", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <span className="form-section-title">Category & Brand</span>

              <div className="form-grid-2">
                <div className="field">
                  <label>Category</label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) =>
                      updateProductField("category_id", e.target.value)
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Brand</label>
                  <select
                    value={productForm.brand_id}
                    onChange={(e) =>
                      updateProductField("brand_id", e.target.value)
                    }
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <span className="form-section-title">Description & Images</span>

              <div className="field">
                <label>Short Description</label>
                <input
                  placeholder="One-line product summary"
                  value={productForm.short_description}
                  onChange={(e) =>
                    updateProductField("short_description", e.target.value)
                  }
                />
              </div>

              <div className="field">
                <label>Full Description</label>
                <textarea
                  placeholder="Detailed product description…"
                  value={productForm.description}
                  onChange={(e) =>
                    updateProductField("description", e.target.value)
                  }
                />
              </div>

              <div className="field field-file">
                <label>Product Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files))}
                />

                {imageFiles.length > 0 && (
                  <p className="field-file-name">
                    📎 {imageFiles.length} image(s) selected. First image will be
                    primary.
                  </p>
                )}
              </div>

              <span className="form-section-title">Product Specifications</span>

              {specs.map((spec, index) => (
                <div className="form-grid-2" key={index}>
                  <div className="field">
                    <label>Spec Name</label>
                    <input
                      placeholder="e.g. RAM"
                      value={spec.spec_name}
                      onChange={(e) =>
                        updateSpec(index, "spec_name", e.target.value)
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Spec Value</label>
                    <input
                      placeholder="e.g. 8GB"
                      value={spec.spec_value}
                      onChange={(e) =>
                        updateSpec(index, "spec_value", e.target.value)
                      }
                    />
                  </div>

                  {specs.length > 1 && (
                    <button
                      type="button"
                      className="admin-remove-btn"
                      onClick={() => removeSpecRow(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="admin-secondary-btn"
                onClick={addSpecRow}
              >
                + Add Specification
              </button>

              {productMessage.text && (
                <div className={`admin-message ${productMessage.type}`}>
                  {productMessage.type === "success" ? "✓" : "✕"}{" "}
                  {productMessage.text}
                </div>
              )}

              <button
                type="submit"
                className="admin-submit-btn"
                disabled={addingProduct}
              >
                {addingProduct ? (
                  "Adding Product..."
                ) : (
                  <>
                    Add Product <span className="arr">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="product-admin-list">
              {products.map((product) => (
                <div className="product-admin-row" key={product.id}>
                  <div>
                    <p className="prod-name">{product.name}</p>
                    <p className="prod-meta">
                      {product.brands?.name || "No Brand"} ·{" "}
                      {product.categories?.name || "No Category"}
                    </p>
                    <p className="prod-price">{formatLKR(product.price)}</p>
                    <p className="prod-meta">
                      Images: {product.product_images?.length || 0} · Specs:{" "}
                      {product.product_specs?.length || 0}
                    </p>
                  </div>

                  <div className="product-actions">
                    <input
                      type="number"
                      defaultValue={product.stock_qty}
                      onBlur={(e) =>
                        updateProductStock(product.id, e.target.value)
                      }
                    />

                    <button
                      className={`status-pill ${
                        product.is_active ? "active" : "inactive"
                      }`}
                      onClick={() =>
                        updateProductStatus(product.id, !product.is_active)
                      }
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </button>

                    <button
                      className="delete-product-btn"
                      onClick={() => deleteProduct(product)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="panel-footer">
              <p>
                🔒 First uploaded image becomes primary. Stock changes save on
                blur.
              </p>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="admin-panel">
            <div className="panel-header">
              <div className="panel-header-text">
                <h2>Orders</h2>
                <p>Track customer orders and update delivery status.</p>
              </div>
              <div className="panel-header-icon">🧾</div>
            </div>

            <div className="admin-list">
              {orders.map((order) => (
                <div className="admin-card" key={order.id}>
                  <div className="admin-card-top">
                    <div>
                      <h3>{order.order_number}</h3>
                      <p>{new Date(order.created_at).toLocaleString()}</p>
                    </div>

                    <select
                      value={order.order_status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="admin-card-body">
                    <p>
                      <b>Total:</b> {formatLKR(order.total_amount)}
                    </p>

                    <div className="order-status-grid">
                      <p>
                        <b>Payment:</b>{" "}
                        <span className={`payment-pill ${order.payment_status}`}>
                          {order.payment_status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </p>

                      <label className="payment-update">
                        Update Payment
                        <select
                          value={order.payment_status}
                          onChange={(e) =>
                            updatePaymentStatus(order.id, e.target.value)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </label>
                    </div>

                    {order.addresses && (
                      <p>
                        <b>Address:</b> {order.addresses.line1},{" "}
                        {order.addresses.city}
                      </p>
                    )}

                    <div className="mini-items">
                      {order.order_items?.map((item) => (
                        <span key={item.id}>
                          {item.product_name} × {item.quantity}
                        </span>
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
            <div className="panel-header">
              <div className="panel-header-text">
                <h2>Repair Requests</h2>
                <p>Manage customer repair bookings and service progress.</p>
              </div>
              <div className="panel-header-icon">🛠</div>
            </div>

            <div className="admin-list">
              {repairs.map((repair) => (
                <div className="admin-card" key={repair.id}>
                  <div className="admin-card-top">
                    <div>
                      <h3>{repair.device_type} Repair</h3>
                      <p>
                        {repair.brand} {repair.model}
                      </p>
                    </div>

                    <select
                      value={repair.status}
                      onChange={(e) =>
                        updateRepairStatus(repair.id, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="admin-card-body">
                    <p>
                      <b>Issue:</b> {repair.issue_description}
                    </p>
                    <p>
                      <b>Customer:</b> {repair.contact_name}
                    </p>
                    <p>
                      <b>Phone:</b> {repair.contact_phone}
                    </p>
                    <p>
                      <b>Preferred Date:</b>{" "}
                      {repair.preferred_date || "Not selected"}
                    </p>
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