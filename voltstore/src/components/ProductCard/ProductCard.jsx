import { Link } from "react-router-dom";
import { formatLKR } from "../../utils/format";
import { getProductImageUrl } from "../../lib/supabaseClient";
import "./ProductCard.css";

function ProductCard({ product }) {
  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ||
    product.product_images?.[0];

  const imageUrl = getProductImageUrl(primaryImage?.image_path);

  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      <div className="product-image">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} />
        ) : (
          <span>No Image</span>
        )}
      </div>

      <div className="product-content">
        <p className="brand">{product.brands?.name}</p>
        <h3>{product.name}</h3>
        <p className="short">{product.short_description}</p>

        <div className="product-bottom">
          <strong>{formatLKR(product.price)}</strong>
          <span>{product.stock_qty > 0 ? "In Stock" : "Out of Stock"}</span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;