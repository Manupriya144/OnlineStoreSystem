import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase, getProductImageUrl } from "../../lib/supabaseClient";
import { formatLKR } from "../../utils/format";
import "./ProductDetails.css";

function ProductDetails() {
  const { slug } = useParams();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchProduct() {
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
      .eq("slug", slug)
      .single();

    if (error) {
      console.log(error.message);
    } else {
      setProduct(data);

      const primary =
        data.product_images?.find((img) => img.is_primary) ||
        data.product_images?.[0];

      setSelectedImage(primary?.image_path || "");
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  if (loading) return <div className="details-page">Loading product...</div>;

  if (!product) return <div className="details-page">Product not found.</div>;

  const mainImage = getProductImageUrl(selectedImage);

  return (
    <section className="details-page">
      <div className="details-layout">
        <div className="gallery">
          <div className="main-image">
            {mainImage ? (
              <img src={mainImage} alt={product.name} />
            ) : (
              <span>No Image</span>
            )}
          </div>

          <div className="thumbnail-row">
            {product.product_images?.map((img) => (
              <button
                key={img.id}
                className={selectedImage === img.image_path ? "thumb active" : "thumb"}
                onClick={() => setSelectedImage(img.image_path)}
              >
                <img src={getProductImageUrl(img.image_path)} alt={product.name} />
              </button>
            ))}
          </div>
        </div>

        <div className="details-info">
          <p className="details-brand">{product.brands?.name}</p>
          <h1>{product.name}</h1>

          {product.model && <p className="model">Model: {product.model}</p>}

          <h2>{formatLKR(product.price)}</h2>

          <p className="description">
            {product.description || product.short_description}
          </p>

          <div className="trust-box">
            <span>Islandwide Delivery</span>
            <span>Warranty Support</span>
            <span>Cash on Delivery</span>
          </div>

          <button className="add-cart-btn">Add to Cart</button>

          {product.product_specs?.length > 0 && (
            <div className="specs">
              <h3>Specifications</h3>

              <div className="spec-grid">
                {product.product_specs.map((spec) => (
                  <div className="spec-item" key={spec.id}>
                    <span>{spec.spec_name}</span>
                    <strong>{spec.spec_value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductDetails;