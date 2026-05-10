import { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard/ProductCard";
import { getActiveProducts } from "../../service/productService";
import { Link } from "react-router-dom";
import "./Home.css";

const testimonialsData = [
  {
    id: 1,
    name: "Kasun Perera",
    role: "Software Engineer",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "Excellent service! My phone was repaired within a day. The team was professional and kept me updated throughout. Highly recommended.",
    rating: 5,
  },
  {
    id: 2,
    name: "Nimal Silva",
    role: "Student",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    text: "Great quality products and fast delivery. Ordered a laptop and it arrived perfectly packaged. Will definitely shop again!",
    rating: 5,
  },
  {
    id: 3,
    name: "Fathima Ahamed",
    role: "UX Designer",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    text: "Very professional repair service. My MacBook works like new now. Transparent pricing and no surprise fees.",
    rating: 5,
  },
];

const categoriesData = [
  {
    id: 1,
    name: "Smartphones",
    desc: "Latest Android & iPhone",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=600",
  },
  {
    id: 2,
    name: "Laptops",
    desc: "Work & gaming powerhouses",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=600",
  },
  {
    id: 3,
    name: "Accessories",
    desc: "Headphones & chargers",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600",
  },
  {
    id: 4,
    name: "Gadgets",
    desc: "Smart devices & tech gear",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=600",
  },
  {
    id: 5,
    name: "Repair",
    desc: "Fix phones & laptops",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600",
  },
];

const tickerItems = [
  { label: "Free Delivery", value: "Orders Over Rs. 5,000" },
  { label: "Happy Customers", value: "10,000+" },
  { label: "Warranty", value: "All Products" },
  { label: "Repair Turnaround", value: "Same Day" },
  { label: "Brands Stocked", value: "50+" },
  { label: "Secure Payment", value: "256-bit SSL" },
  { label: "Free Delivery", value: "Orders Over Rs. 5,000" },
  { label: "Happy Customers", value: "10,000+" },
  { label: "Warranty", value: "All Products" },
  { label: "Repair Turnaround", value: "Same Day" },
  { label: "Brands Stocked", value: "50+" },
  { label: "Secure Payment", value: "256-bit SSL" },
];

function StarRating({ count }) {
  return (
    <div className="testimonial-stars">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getActiveProducts();
        setProducts(data.slice(0, 4));
      } catch (error) {
        console.log(error.message);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="stats-ticker" aria-hidden="true">
        <div className="ticker-track">
          {tickerItems.map((item, i) => (
            <div className="ticker-item" key={i}>
              <span className="dot" />
              {item.label} — <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <p className="hero-tag">Electronics · Accessories · Repairs</p>

          <h1>
            Less Searching.<br />
            <em>More Living.</em>
          </h1>

          <p className="hero-text">
            Discover high-quality electronics, accessories, and reliable repair
            services — all in one place, delivered to your door.
          </p>

          <div className="hero-buttons">
            <Link to="/shop" className="btn-primary">
              Shop Now →
            </Link>
            <Link to="/repair" className="btn-secondary">
              Book Repair
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat-block">
              <div className="hero-stat-value">10K<span>+</span></div>
              <div className="hero-stat-label">Happy customers</div>
            </div>
            <div className="hero-stat-block">
              <div className="hero-stat-value">50<span>+</span></div>
              <div className="hero-stat-label">Brands stocked</div>
            </div>
            <div className="hero-stat-block">
              <div className="hero-stat-value">4.9<span>★</span></div>
              <div className="hero-stat-label">Average rating</div>
            </div>
          </div>
        </div>

        <div className="showcase">
          <div className="sc-ring" />

          <div className="sc-card sc-c1">
            <img src="https://images.unsplash.com/photo-1585386959984-a4155224a1ad?q=80&w=200" alt="Headphones" />
            <div className="p-name">Sony WH-1000XM5</div>
            <div className="p-price">Rs. 64,999</div>
          </div>

          <div className="sc-card sc-c2">
            <img src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=200" alt="Earbuds" />
            <div className="p-name">AirPods Pro</div>
            <div className="p-price">Rs. 38,500</div>
          </div>

          <div className="sc-card sc-c3">
            <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200" alt="Smartwatch" />
            <div className="p-name">Smart Watch Pro</div>
            <div className="p-price">Rs. 22,000</div>
          </div>

          <div className="sc-card sc-c4">
            <img src="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=200" alt="Laptop" />
            <div className="p-name">MacBook Air M2</div>
            <div className="p-price">Rs. 298,000</div>
          </div>

          <div className="sc-main">
            <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=300" alt="iPhone 15 Pro Max" />
            <div className="p-name">iPhone 15 Pro Max</div>
            <div className="p-price">Rs. 189,900</div>
          </div>

          <div className="sc-badge sb1"><span className="sc-dot" />Free Delivery</div>
          <div className="sc-badge sb2"><span className="sc-dot" />Warranty Included</div>
          <div className="sc-badge sb3"><span className="sc-dot" />Same-Day Repair</div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="section-header">
          <div className="section-label">Browse</div>
          <h2>Shop by Category</h2>
          <p>From flagship smartphones to expert repairs — find everything you need</p>
        </div>

        <div className="category-grid">
          {categoriesData.map((cat) => (
            <div className="category-card" key={cat.id}>
              <div className="category-img">
                <img src={cat.image} alt={cat.name} />
              </div>
              <div className="category-info">
                <h3>{cat.name}</h3>
                <p>{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section alt">
        <div className="section-header">
          <div className="section-label">Trending</div>
          <h2>Featured Products</h2>
          <p>Top-rated items our customers keep coming back for</p>
        </div>

        {loadingProducts ? (
          <p className="loading-text">Loading products…</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* WHY US */}
      <section className="section">
        <div className="section-header">
          <div className="section-label">Our Promise</div>
          <h2>Why Choose Tazz Electronics</h2>
          <p>Reliable products, trusted services, and a team that cares</p>
        </div>

        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Orders dispatched within 24 hours and delivered safely to your doorstep.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">🛡</div>
            <h3>Warranty Protection</h3>
            <p>Every product comes with full warranty and quality assurance backing.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">🔒</div>
            <h3>Secure Payments</h3>
            <p>All transactions are protected with 256-bit SSL encryption technology.</p>
          </div>
          <div className="why-card">
            <div className="why-icon">⚡</div>
            <h3>Expert Repairs</h3>
            <p>Same-day diagnosis and repairs handled by certified professionals.</p>
          </div>
        </div>
      </section>

      {/* REPAIR */}
      <section className="repair" id="repair">
        <div className="repair-left">
          <span className="repair-badge">Repair Service</span>

          <h2>Device Not Working?<br />Let Our Experts Fix It.</h2>

          <p>
            Book a repair for your smartphone, laptop, tablet, or accessories. Our
            technicians diagnose the issue, provide a transparent price estimate,
            and repair your device with care — usually same day.
          </p>

          <div className="repair-points">
            <div className="repair-item">
              <span className="icon">🛠</span>
              <p>Screen Replacement</p>
            </div>
            <div className="repair-item">
              <span className="icon">🔋</span>
              <p>Battery Replacement</p>
            </div>
            <div className="repair-item">
              <span className="icon">💻</span>
              <p>Laptop Servicing</p>
            </div>
            <div className="repair-item">
              <span className="icon">⚙️</span>
              <p>Software Fix</p>
            </div>
          </div>

          <div className="repair-actions">
            <Link to="/repair" className="btn-primary">
              Book Repair →
            </Link>
            <Link to="/" className="repair-call">
              📞 Call Technician
            </Link>
          </div>
        </div>

        <div className="repair-right">
          <div className="repair-info-card-2">
            <strong>500+</strong>
            <span>Repairs completed</span>
          </div>

          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop"
            alt="Laptop repair technician at work"
          />

          <div className="repair-info-card">
            <strong>Fast Diagnosis</strong>
            <span>Get a quote within 30 minutes</span>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section alt">
        <div className="section-header">
          <div className="section-label">Reviews</div>
          <h2>What Customers Say</h2>
          <p>Real feedback from thousands of happy customers</p>
        </div>

        <div className="testimonial-grid">
          {testimonialsData.map((item) => (
            <div className="testimonial-card" key={item.id}>
              <StarRating count={item.rating} />
              <p className="testimonial-text">{item.text}</p>
              <div className="testimonial-user">
                <img src={item.image} alt={item.name} />
                <div>
                  <h4>{item.name}</h4>
                  <span>{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;