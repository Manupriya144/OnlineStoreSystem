import { useEffect, useState, useRef } from "react";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getActiveProducts, getCategories } from "../../service/productService";
import "./Shop.css";

/* ── Skeleton card placeholder ── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line shimmer" style={{ width: "60%", height: "10px" }} />
        <div className="skeleton-line shimmer" style={{ width: "85%", height: "16px", marginTop: "8px" }} />
        <div className="skeleton-line shimmer" style={{ width: "40%", height: "14px", marginTop: "10px" }} />
        <div className="skeleton-footer">
          <div className="skeleton-line shimmer" style={{ width: "50%", height: "20px" }} />
          <div className="skeleton-btn shimmer" />
        </div>
      </div>
    </div>
  );
}

function Shop() {
  const [products,    setProducts]    = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [sort,     setSort]     = useState("default");
  const [price,    setPrice]    = useState(1000000);

  const [gridKey, setGridKey] = useState(0);
  const prevFiltered = useRef([]);

  useEffect(() => {
    async function loadData() {
      try {
        const prod = await getActiveProducts();
        const cats = await getCategories();
        setProducts(prod);
        setFiltered(prod);
        setCategories(cats);
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let temp = [...products];

    if (search)
      temp = temp.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );

    if (category !== "all")
      temp = temp.filter((p) => p.categories?.slug === category);

    temp = temp.filter((p) => p.price <= price);

    if (sort === "low")  temp.sort((a, b) => a.price - b.price);
    if (sort === "high") temp.sort((a, b) => b.price - a.price);

    if (
      temp.length !== prevFiltered.current.length ||
      temp.some((p, i) => p.id !== prevFiltered.current[i]?.id)
    ) {
      setGridKey((k) => k + 1);
    }

    prevFiltered.current = temp;
    setFiltered(temp);
  }, [search, category, sort, price, products]);

  const activeFilterCount = [
    search !== "",
    category !== "all",
    price < 1000000,
  ].filter(Boolean).length;

  function resetFilters() {
    setSearch("");
    setCategory("all");
    setSort("default");
    setPrice(1000000);
  }

  /* ── LOADING ── */
  if (loading) {
    return (
      <section className="shop-page">
        <div className="shop-header shop-header--anim">
          <span className="shop-header-eyebrow">Store</span>
          <h1>Browse <em>Products</em></h1>
        </div>
        <div className="shop-layout">
          <aside className="filters">
            <div className="filters-header">
              <div className="skeleton-line shimmer" style={{ width: "60px", height: "18px" }} />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="filter-section">
                <div className="skeleton-line shimmer" style={{ width: "40%", height: "10px", marginBottom: "10px" }} />
                <div className="skeleton-line shimmer" style={{ width: "100%", height: "44px", borderRadius: "14px" }} />
              </div>
            ))}
          </aside>
          <div className="shop-content">
            <div className="shop-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* ── RENDER ── */
  return (
    <section className="shop-page">

      {/* HEADER */}
      <div className="shop-header shop-header--anim">
        <span className="shop-header-eyebrow">Store</span>
        <h1>Browse <em>Products</em></h1>
        <div className="shop-header-meta">
          <p>Everything in one place.</p>
          <span className="result-count">{filtered.length} results</span>
        </div>
      </div>

      <div className="shop-layout">

        {/* SIDEBAR */}
        <aside className="filters filters--anim">
          <div className="filters-header">
            <h3>Filters</h3>
            {activeFilterCount > 0 && (
              <span className="filters-badge">{activeFilterCount} active</span>
            )}
          </div>

          {/* SEARCH */}
          <div className="filter-section">
            <p className="filter-label">Search</p>
            <div className="filter-search-wrap">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>
          </div>

          {/* CATEGORY */}
          <div className="filter-section">
            <p className="filter-label">Category</p>
            <ul className="category-list">
              <li
                className={category === "all" ? "active" : ""}
                onClick={() => setCategory("all")}
              >
                All Products
                <span className="category-count">{products.length}</span>
              </li>
              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.categories?.slug === cat.slug
                ).length;
                return (
                  <li
                    key={cat.id}
                    className={category === cat.slug ? "active" : ""}
                    onClick={() => setCategory(cat.slug)}
                  >
                    {cat.name}
                    <span className="category-count">{count}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* PRICE */}
          <div className="filter-section">
            <div className="filter-price-header">
              <p className="filter-label" style={{ margin: 0 }}>Max Price</p>
              <span className="filter-price-value">
                Rs {price.toLocaleString()}
              </span>
            </div>
            <div className="range-wrap">
              <input
                type="range"
                className="price-range"
                min="0"
                max="1000000"
                step="1000"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                style={{ "--fill": `${(price / 1000000) * 100}%` }}
              />
            </div>
            <div className="range-ends">
              <span>Rs 0</span>
              <span>Rs 10,00,000</span>
            </div>
          </div>

          {/* RESET */}
          <button
            className={`reset-btn ${activeFilterCount > 0 ? "reset-btn--active" : ""}`}
            onClick={resetFilters}
          >
            {activeFilterCount > 0
              ? `Clear ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""}`
              : "Reset Filters"}
          </button>
        </aside>

        {/* CONTENT */}
        <div className="shop-content">

          {/* TOPBAR */}
          <div className="shop-topbar">
            <div className="active-filters">
              {category !== "all" && (
                <span className="filter-chip" onClick={() => setCategory("all")}>
                  {category} ✕
                </span>
              )}
              {search && (
                <span className="filter-chip" onClick={() => setSearch("")}>
                  "{search}" ✕
                </span>
              )}
              {price < 1000000 && (
                <span className="filter-chip" onClick={() => setPrice(1000000)}>
                  Max Rs {price.toLocaleString()} ✕
                </span>
              )}
            </div>

            <div className="topbar-right">
              <span className="topbar-count">{filtered.length} items</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Sort by</option>
                <option value="low">Price: Low → High</option>
                <option value="high">Price: High → Low</option>
              </select>
            </div>
          </div>

          {/* PRODUCTS */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search term</p>
              <button className="empty-reset-btn" onClick={resetFilters}>
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="shop-grid" key={gridKey}>
              {filtered.map((product, i) => (
                <div
                  className="product-card-wrap"
                  key={product.id}
                  style={{ "--i": i }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

export default Shop;