import { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getActiveProducts, getCategories } from "../../service/productService";
import "./Shop.css";

function Shop() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");
  const [price, setPrice] = useState(1000000);

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

    if (search) {
      temp = temp.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category !== "all") {
      temp = temp.filter((p) => p.categories?.slug === category);
    }

    temp = temp.filter((p) => p.price <= price);

    if (sort === "low") temp.sort((a, b) => a.price - b.price);
    if (sort === "high") temp.sort((a, b) => b.price - a.price);

    setFiltered(temp);
  }, [search, category, sort, price, products]);

  if (loading) return <div className="shop-page">Loading...</div>;

  return (
    <section className="shop-page">

      {/* HEADER */}
      <div className="shop-header">
        <h1>Shop Products</h1>
        <p>{filtered.length} results found</p>
      </div>

      <div className="shop-layout">

        {/* SIDEBAR */}
        <aside className="filters">

          <h3>Filters</h3>

          {/* SEARCH */}
          <div className="filter-group">
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* CATEGORY */}
          <div className="filter-group">
            <h4>Category</h4>

            <ul className="category-list">
              <li
                className={category === "all" ? "active" : ""}
                onClick={() => setCategory("all")}
              >
                All ({products.length})
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
                    {cat.name} ({count})
                  </li>
                );
              })}
            </ul>
          </div>

          {/* PRICE */}
          <div className="filter-group">
            <h4>Max Price: Rs {price}</h4>
            <input
              type="range"
              min="0"
              max="1000000"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          <button
            className="reset-btn"
            onClick={() => {
              setSearch("");
              setCategory("all");
              setSort("default");
              setPrice(1000000);
            }}
          >
            Reset Filters
          </button>

        </aside>

        {/* CONTENT */}
        <div className="shop-content">

          {/* TOP BAR */}
          <div className="shop-topbar">
            <div className="active-filters">
              {category !== "all" && (
                <span onClick={() => setCategory("all")}>
                  {category} ✕
                </span>
              )}
              {search && (
                <span onClick={() => setSearch("")}>
                  {search} ✕
                </span>
              )}
            </div>

            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="default">Sort</option>
              <option value="low">Price Low → High</option>
              <option value="high">Price High → Low</option>
            </select>
          </div>

          {/* PRODUCTS */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="shop-grid">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>

      </div>
    </section>
  );
}

export default Shop;