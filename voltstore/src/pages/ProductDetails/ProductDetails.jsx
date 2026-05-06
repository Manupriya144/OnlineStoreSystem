import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProductBySlug } from "../../service/productService";
import { getProductImageUrl } from "../../lib/supabaseClient";
import { formatLKR } from "../../utils/format";
import { useCart } from "../../context/CartContext";
import "./ProductDetails.css";

function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await getProductBySlug(slug);

        if (!data) {
          setProduct(null);
          return;
        }

        setProduct(data);

        const primary =
          data.product_images?.find((img) => img.is_primary) ||
          data.product_images?.[0];

        setSelectedImage(primary?.image_path || "");
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return <div className="details-page">Loading product...</div>;
  }

  if (!product) {
    return <div className="details-page">Product not found.</div>;
  }

  const mainImage = getProductImageUrl(selectedImage);
  const inStock = product.stock_qty > 0;

  function handleAddToCart() {
    addToCart(product, qty);
  }

  function handleBuyNow() {
    addToCart(product, qty);
    navigate("/cart");
  }

  return (
    <section className="details-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <p>{product.name}</p>
      </div>

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
                className={
                  selectedImage === img.image_path ? "thumb active" : "thumb"
                }
                onClick={() => setSelectedImage(img.image_path)}
              >
                <img
                  src={getProductImageUrl(img.image_path)}
                  alt={product.name}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="details-info">
          <div className="product-meta">
            <span>{product.brands?.name || "Tazz Electronics"}</span>

            <span className={inStock ? "stock in" : "stock out"}>
              {inStock ? `${product.stock_qty} In Stock` : "Out of Stock"}
            </span>
          </div>

          <h1>{product.name}</h1>

          {product.model && <p className="model">Model: {product.model}</p>}

          <div className="rating-row">
            <span>★★★★★</span>
            <p>4.8 rating • 128 reviews</p>
          </div>

          <h2>{formatLKR(product.price)}</h2>

          <p className="description">
            {product.description || product.short_description}
          </p>

          <div className="delivery-box">
            <div>
              <strong>🚚 Islandwide Delivery</strong>
              <p>Delivery available within 2–5 working days.</p>
            </div>

            <div>
              <strong>🛡 Warranty Support</strong>
              <p>Warranty available for eligible products.</p>
            </div>

            <div>
              <strong>💵 Cash on Delivery</strong>
              <p>Pay safely when your order arrives.</p>
            </div>
          </div>

          {inStock ? (
            <div className="purchase-box">
              <div className="qty-box">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>

                <span>{qty}</span>

                <button
                  onClick={() =>
                    setQty((q) => Math.min(product.stock_qty, q + 1))
                  }
                >
                  +
                </button>
              </div>

              <button className="add-cart-btn" onClick={handleAddToCart}>
                Add to Cart
              </button>

              <button className="buy-btn" onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          ) : (
            <button className="disabled-btn">Currently Unavailable</button>
          )}

          <div className="service-note">
            <strong>Need help choosing?</strong>
            <p>
              Contact our support team before buying. We can recommend the best
              option for your budget.
            </p>
          </div>

          {product.product_specs?.length > 0 && (
            <div className="specs">
              <h3>Key Specifications</h3>

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