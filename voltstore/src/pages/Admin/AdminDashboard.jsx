import { useEffect, useState, useMemo, useRef } from "react";
import { Navigate } from "react-router-dom";
import { supabase, getProductImageUrl } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { formatLKR } from "../../utils/format";
import "./AdminDashboard.css";

const PRODUCTS_PER_PAGE = 20;

// ─── Inline-edit cell ────────────────────────────────────────────────────────
function EditableCell({ value, type = "text", onSave, className }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef();

  function commit() {
    setEditing(false);
    if (String(draft) !== String(value)) onSave(draft);
  }

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  if (!editing)
    return (
      <span
        className={`editable-cell ${className || ""}`}
        onClick={() => { setDraft(value); setEditing(true); }}
        title="Click to edit"
      >
        {className === "price" ? formatLKR(value) : value}
        <svg className="edit-pencil" viewBox="0 0 16 16" fill="none">
          <path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </span>
    );

  return (
    <input
      ref={ref}
      className="editable-input"
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function AdminDashboard() {
  const { user, role, authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("products");
  const [orders, setOrders] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product form state
  const [imageFiles, setImageFiles] = useState([]);
  const [addingProduct, setAddingProduct] = useState(false);
  const [productMessage, setProductMessage] = useState({ text: "", type: "" });
  const [toast, setToast] = useState({ text: "", type: "" });
  const [specs, setSpecs] = useState([{ spec_name: "", spec_value: "" }]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Product list filters + pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [productForm, setProductForm] = useState({
    name: "", slug: "", model: "", short_description: "",
    description: "", price: "", stock_qty: "", sku: "",
    category_id: "", brand_id: "",
  });

  function showToast(text, type = "success") {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3000);
  }

  function slugify(text) {
    return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  }

  function updateProductField(key, value) {
    setProductForm((prev) => ({
      ...prev, [key]: value,
      slug: key === "name" ? slugify(value) : prev.slug,
    }));
  }

  function updateSpec(index, key, value) {
    setSpecs((prev) => prev.map((spec, i) => i === index ? { ...spec, [key]: value } : spec));
  }

  function addSpecRow() { setSpecs((prev) => [...prev, { spec_name: "", spec_value: "" }]); }
  function removeSpecRow(index) { setSpecs((prev) => prev.filter((_, i) => i !== index)); }

  async function loadAdminData() {
    setLoading(true);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(`*, addresses(*), order_items(*), profiles(email, full_name)`)
      .order("created_at", { ascending: false });

    if (orderError) showToast(orderError.message, "error");

    const { data: repairData } = await supabase
      .from("repair_requests").select("*").order("created_at", { ascending: false });

    const { data: productData } = await supabase
      .from("products")
      .select(`*, categories(name), brands(name), product_images(id, image_path, is_primary, created_at), product_specs(id, spec_name, spec_value)`)
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
    if (authLoading) return;
    if (role === "admin") loadAdminData();
  }, [authLoading, role]);

  // ── Filtered & sorted products ──────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q) ||
        p.brands?.name?.toLowerCase().includes(q)
      );
    }
    if (filterBrand) list = list.filter((p) => String(p.brand_id) === filterBrand);
    if (filterCategory) list = list.filter((p) => String(p.category_id) === filterCategory);
    if (filterStatus === "active") list = list.filter((p) => p.is_active);
    if (filterStatus === "inactive") list = list.filter((p) => !p.is_active);
    if (filterStatus === "low") list = list.filter((p) => p.stock_qty <= 5);

    switch (sortBy) {
      case "name_asc": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name_desc": list.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "price_asc": list.sort((a, b) => a.price - b.price); break;
      case "price_desc": list.sort((a, b) => b.price - a.price); break;
      case "stock_asc": list.sort((a, b) => a.stock_qty - b.stock_qty); break;
      default: break; // created_at_desc (already sorted from DB)
    }

    return list;
  }, [products, searchQuery, filterBrand, filterCategory, filterStatus, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterBrand, filterCategory, filterStatus, sortBy]);

  // ── Order / repair / product mutations ─────────────────────────────────────
  async function updateOrderStatus(orderId, status) {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) { showToast("Order not found", "error"); return; }
      const previousStatus = order.order_status;

      const { error: updateError } = await supabase.from("orders").update({ order_status: status }).eq("id", orderId);
      if (updateError) { showToast(updateError.message, "error"); return; }

      if (status === "confirmed" && previousStatus !== "confirmed") {
        const customerEmail = order.profiles?.email;
        const customerName = order.profiles?.full_name || order.addresses?.full_name || "Customer";

        if (!customerEmail || !customerEmail.includes("@")) {
          showToast("Order confirmed, but customer email not found", "error");
          loadAdminData(); return;
        }

        const { error: emailError } = await supabase.functions.invoke("send-confirmed-order-email", {
          body: {
            email: customerEmail, customerName, orderNumber: order.order_number,
            paymentMethod: order.payment_status === "paid" ? "Card Payment" : "Cash on Delivery",
            paymentStatus: order.payment_status === "paid" ? "Paid" : "Pending",
            total: order.total_amount,
          },
        });

        if (emailError) { showToast("Order confirmed, but email failed", "error"); loadAdminData(); return; }
        showToast("Order confirmed and email sent", "success");
        loadAdminData(); return;
      }

      showToast("Order status updated", "success");
      loadAdminData();
    } catch (err) { showToast(err.message || "Failed to update order", "error"); }
  }

  async function updatePaymentStatus(orderId, status) {
    await supabase.from("orders").update({ payment_status: status }).eq("id", orderId);
    await supabase.from("payments").update({ status, paid_at: status === "paid" ? new Date().toISOString() : null }).eq("order_id", orderId);
    showToast("Payment status updated", "success");
    loadAdminData();
  }

  async function updateRepairStatus(repairId, status) {
    await supabase.from("repair_requests").update({ status }).eq("id", repairId);
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
          name: productForm.name, slug: productForm.slug,
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
        .select().single();

      if (productError) throw productError;

      if (imageFiles.length > 0) {
        const imageRows = [];
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `${productData.id}/${Date.now()}-${i}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from("product").upload(fileName, file);
          if (uploadError) throw uploadError;
          imageRows.push({ product_id: productData.id, image_path: fileName, is_primary: i === 0 });
        }
        const { error: imageInsertError } = await supabase.from("product_images").insert(imageRows);
        if (imageInsertError) throw imageInsertError;
      }

      const validSpecs = specs.filter((s) => s.spec_name.trim() && s.spec_value.trim());
      if (validSpecs.length > 0) {
        const { error: specError } = await supabase.from("product_specs").insert(
          validSpecs.map((s) => ({ product_id: productData.id, spec_name: s.spec_name.trim(), spec_value: s.spec_value.trim() }))
        );
        if (specError) throw specError;
      }

      setProductMessage({ text: "Product added successfully!", type: "success" });
      setImageFiles([]);
      setSpecs([{ spec_name: "", spec_value: "" }]);
      setProductForm({ name: "", slug: "", model: "", short_description: "", description: "", price: "", stock_qty: "", sku: "", category_id: "", brand_id: "" });
      setShowAddForm(false);
      loadAdminData();
    } catch (err) {
      setProductMessage({ text: err.message || "Product adding failed", type: "error" });
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
        const { error: storageError } = await supabase.storage.from("product").remove(paths);
        if (storageError) throw storageError;
      }
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
      showToast("Product deleted successfully!", "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to delete product", "error");
    }
  }

  async function updateProductField_db(productId, field, value) {
    const update = { [field]: field === "price" || field === "stock_qty" ? Number(value) : value };
    const { error } = await supabase.from("products").update(update).eq("id", productId);
    if (error) { showToast(error.message, "error"); return; }
    showToast(`${field.replace("_", " ")} updated`, "success");
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, ...update } : p));
  }

  async function updateProductStatus(productId, isActive) {
    await supabase.from("products").update({ is_active: isActive }).eq("id", productId);
    showToast("Product status updated", "success");
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_active: isActive } : p));
  }

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (authLoading) return <div className="admin-loading">Checking access…</div>;
  if (!user) return <Navigate to="/login" />;
  if (role !== "admin") return (
    <section className="admin-denied">
      <h1>Access Denied</h1>
      <p>You do not have permission to view this page.</p>
    </section>
  );
  if (loading) return <div className="admin-loading">Loading dashboard…</div>;

  // ── Render ─────────────────────────────────────────────────────────────────
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

        <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>
          <span className="nav-icon">📦</span> Products
        </button>
        <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
          <span className="nav-icon">🧾</span> Orders
        </button>
        <button className={activeTab === "repairs" ? "active" : ""} onClick={() => setActiveTab("repairs")}>
          <span className="nav-icon">🛠</span> Repairs
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-page-header">
          <span className="admin-section-lbl">Dashboard</span>
          <h1>Admin <em>Control</em> Center</h1>
          <p>Manage products, orders, repair requests, and store activity.</p>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <span>Total Orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="admin-stat-card">
            <span>Pending Orders</span>
            <strong>{orders.filter((o) => o.order_status === "pending").length}</strong>
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

        {/* ── PRODUCTS TAB ── */}
        {activeTab === "products" && (
          <div className="admin-panel">
            <div className="panel-header">
              <div className="panel-header-text">
                <h2>Product Management</h2>
                <p>Search, filter, inline-edit, and manage your catalog.</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className={showAddForm ? "admin-secondary-btn active-toggle" : "admin-secondary-btn"}
                  onClick={() => setShowAddForm((v) => !v)}
                  style={{ height: "40px", padding: "0 18px", fontSize: "13px" }}
                >
                  {showAddForm ? "✕ Cancel" : "+ Add Product"}
                </button>
                <div className="panel-header-icon">📦</div>
              </div>
            </div>

            {/* ── ADD PRODUCT FORM (collapsible) ── */}
            {showAddForm && (
              <form className="admin-product-form" onSubmit={addProduct}>
                <span className="form-section-title">Product Info</span>
                <div className="form-grid-2">
                  <div className="field">
                    <label>Product Name</label>
                    <input placeholder="e.g. iPhone 15 Pro Max" value={productForm.name} onChange={(e) => updateProductField("name", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Slug</label>
                    <input placeholder="auto-generated" value={productForm.slug} onChange={(e) => updateProductField("slug", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Model</label>
                    <input placeholder="e.g. A2849" value={productForm.model} onChange={(e) => updateProductField("model", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>SKU</label>
                    <input placeholder="e.g. APL-IP15PM-256" value={productForm.sku} onChange={(e) => updateProductField("sku", e.target.value)} />
                  </div>
                </div>

                <span className="form-section-title">Pricing & Stock</span>
                <div className="form-grid-2">
                  <div className="field">
                    <label>Price (LKR)</label>
                    <input type="number" placeholder="e.g. 299900" value={productForm.price} onChange={(e) => updateProductField("price", e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Stock Quantity</label>
                    <input type="number" placeholder="e.g. 12" value={productForm.stock_qty} onChange={(e) => updateProductField("stock_qty", e.target.value)} required />
                  </div>
                </div>

                <span className="form-section-title">Category & Brand</span>
                <div className="form-grid-2">
                  <div className="field">
                    <label>Category</label>
                    <select value={productForm.category_id} onChange={(e) => updateProductField("category_id", e.target.value)}>
                      <option value="">Select Category</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>Brand</label>
                    <select value={productForm.brand_id} onChange={(e) => updateProductField("brand_id", e.target.value)}>
                      <option value="">Select Brand</option>
                      {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                  </div>
                </div>

                <span className="form-section-title">Description & Images</span>
                <div className="field">
                  <label>Short Description</label>
                  <input placeholder="One-line product summary" value={productForm.short_description} onChange={(e) => updateProductField("short_description", e.target.value)} />
                </div>
                <div className="field">
                  <label>Full Description</label>
                  <textarea placeholder="Detailed product description…" value={productForm.description} onChange={(e) => updateProductField("description", e.target.value)} />
                </div>
                <div className="field field-file">
                  <label>Product Images</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files))} />
                  {imageFiles.length > 0 && <p className="field-file-name">📎 {imageFiles.length} image(s) selected. First image will be primary.</p>}
                </div>

                <span className="form-section-title">Product Specifications</span>
                {specs.map((spec, index) => (
                  <div className="form-grid-2" key={index}>
                    <div className="field">
                      <label>Spec Name</label>
                      <input placeholder="e.g. RAM" value={spec.spec_name} onChange={(e) => updateSpec(index, "spec_name", e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Spec Value</label>
                      <input placeholder="e.g. 8GB" value={spec.spec_value} onChange={(e) => updateSpec(index, "spec_value", e.target.value)} />
                    </div>
                    {specs.length > 1 && (
                      <button type="button" className="admin-remove-btn" onClick={() => removeSpecRow(index)}>Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" className="admin-secondary-btn" onClick={addSpecRow}>+ Add Specification</button>

                {productMessage.text && (
                  <div className={`admin-message ${productMessage.type}`}>
                    {productMessage.type === "success" ? "✓" : "✕"} {productMessage.text}
                  </div>
                )}

                <button type="submit" className="admin-submit-btn" disabled={addingProduct}>
                  {addingProduct ? "Adding Product..." : <>Add Product <span className="arr">→</span></>}
                </button>
              </form>
            )}

            {/* ── SEARCH + FILTER BAR ── */}
            <div className="product-toolbar">
              <div className="product-search-wrap">
                <svg className="search-icon" viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  className="product-search-input"
                  type="text"
                  placeholder="Search by name, SKU, model, brand…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>
                )}
              </div>

              <div className="product-filters">
                <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="filter-select">
                  <option value="">All Brands</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>

                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="low">Low Stock (≤5)</option>
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
                  <option value="created_at_desc">Newest First</option>
                  <option value="name_asc">Name A→Z</option>
                  <option value="name_desc">Name Z→A</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="stock_asc">Stock ↑</option>
                </select>
              </div>
            </div>

            {/* ── RESULTS META ── */}
            <div className="product-results-meta">
              <span>
                Showing <strong>{pagedProducts.length}</strong> of <strong>{filteredProducts.length}</strong> products
                {searchQuery && <> matching "<em>{searchQuery}</em>"</>}
              </span>
              {(searchQuery || filterBrand || filterCategory || filterStatus) && (
                <button
                  className="clear-filters-btn"
                  onClick={() => { setSearchQuery(""); setFilterBrand(""); setFilterCategory(""); setFilterStatus(""); }}
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* ── PRODUCT TABLE ── */}
            <div className="product-table-wrap">
              <table className="product-table">
                <thead>
                  <tr>
                    <th style={{ width: "52px" }}>Image</th>
                    <th>Product</th>
                    <th>Brand / Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th style={{ width: "80px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        <div className="table-empty-inner">
                          <span>🔍</span>
                          <p>No products match your search.</p>
                        </div>
                      </td>
                    </tr>
                  ) : pagedProducts.map((product) => {
                    const primaryImage =
                      product.product_images?.find((img) => img.is_primary) ||
                      product.product_images?.[0];
                    const imageUrl = getProductImageUrl(primaryImage?.image_path);
                    const isLowStock = product.stock_qty <= 5;

                    return (
                      <tr key={product.id} className={!product.is_active ? "row-inactive" : ""}>
                        <td>
                          <div className="product-thumb">
                            {imageUrl
                              ? <img src={imageUrl} alt={product.name} />
                              : <span className="thumb-placeholder">📦</span>
                            }
                          </div>
                        </td>
                        <td>
                          <div className="product-name-cell">
                            <EditableCell
                              value={product.name}
                              className="prod-table-name"
                              onSave={(v) => updateProductField_db(product.id, "name", v)}
                            />
                            {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="brand-cat-cell">
                            <span className="brand-badge">{product.brands?.name || "—"}</span>
                            <span className="cat-badge">{product.categories?.name || "—"}</span>
                          </div>
                        </td>
                        <td>
                          <EditableCell
                            value={product.price}
                            type="number"
                            className="price"
                            onSave={(v) => updateProductField_db(product.id, "price", v)}
                          />
                        </td>
                        <td>
                          <div className={`stock-cell ${isLowStock ? "low" : ""}`}>
                            <EditableCell
                              value={product.stock_qty}
                              type="number"
                              className="stock"
                              onSave={(v) => updateProductField_db(product.id, "stock_qty", v)}
                            />
                            {isLowStock && <span className="low-badge">Low</span>}
                          </div>
                        </td>
                        <td>
                          <button
                            className={`status-pill ${product.is_active ? "active" : "inactive"}`}
                            onClick={() => updateProductStatus(product.id, !product.is_active)}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <button className="delete-product-btn" onClick={() => deleteProduct(product)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >«</button>
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >‹</button>

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) page = i + 1;
                  else if (currentPage <= 4) page = i + 1;
                  else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
                  else page = currentPage - 3 + i;

                  return (
                    <button
                      key={page}
                      className={`page-btn ${page === currentPage ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >{page}</button>
                  );
                })}

                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >›</button>
                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >»</button>
              </div>
            )}

            <div className="panel-footer">
              <p>💡 Click any name, price, or stock value to edit inline. Stock changes save instantly.</p>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
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
                    <select value={order.order_status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="admin-card-body">
                    <div className="order-customer-row">
                      <span className="order-customer-name">👤 {order.addresses?.full_name || "—"}</span>
                      <a className="order-customer-phone" href={`tel:${order.addresses?.phone}`}>📞 {order.addresses?.phone || "No phone"}</a>
                    </div>
                    <div className="order-status-grid">
                      <p><b>Payment:</b> <span className={`payment-pill ${order.payment_status}`}>{order.payment_status === "paid" ? "Paid" : "Pending"}</span></p>
                      <label className="payment-update">
                        Update Payment
                        <select value={order.payment_status} onChange={(e) => updatePaymentStatus(order.id, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </label>
                    </div>
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

        {/* ── REPAIRS TAB ── */}
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