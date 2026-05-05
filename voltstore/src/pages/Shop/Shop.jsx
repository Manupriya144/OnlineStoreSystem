import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import ProductCard from "../../components/ProductCard/ProductCard";
import "./Shop.css";

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(id, name, slug),
        brands(id, name, slug),
        product_images(id, image_path, is_primary),
        product_specs(id, spec_name, spec_value)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="shop-page">Loading products...</div>;
  }

  return (
    <section className="shop-page">
      <div className="shop-header">
        <h1>Shop Products</h1>
        <p>Explore the latest electronics and accessories.</p>
      </div>

      <div className="shop-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default Shop;