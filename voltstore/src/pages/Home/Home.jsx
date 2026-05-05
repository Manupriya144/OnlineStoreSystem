import { Link } from "react-router-dom";
import "./Home.css";

// TOP of file (after imports)
const testimonialsData = [
  {
    id: 1,
    name: "Kasun Perera",
    role: "Software Engineer",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "Excellent service! My phone was repaired within a day. Highly recommended."
  },
  {
    id: 2,
    name: "Nimal Silva",
    role: "Student",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    text: "Great quality products and fast delivery. Will definitely shop again!"
  },
  {
    id: 3,
    name: "Fathima Ahamed",
    role: "Designer",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    text: "Very professional repair service. My laptop works like new now."
  }
];

const featuredProducts = [
  {
    id: 1,
    name: "iPhone 13 Pro",
    price: "Rs. 285,000",
    image: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?q=80&w=600"
  },
  {
    id: 2,
    name: "Dell XPS 13 Laptop",
    price: "Rs. 320,000",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600"
  },
  {
    id: 3,
    name: "Wireless Headphones",
    price: "Rs. 18,500",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600"
  },
  {
    id: 4,
    name: "Smart Watch",
    price: "Rs. 45,000",
    image: "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?q=80&w=600"
  }
];

function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <p className="hero-tag">Electronics • Accessories • Repairs</p>

          <h1>
            Power Your Digital Life <br />
            With Tazz Electronics
          </h1>

          <p className="hero-text">
            Discover high-quality electronics, accessories, and reliable repair
            services — all in one place.
          </p>

          <div className="hero-buttons">
            <Link to="/shop" className="btn-primary">Shop Now</Link>
            <a href="#repair" className="btn-secondary">Repair Service</a>
          </div>

          <div className="hero-trust">
            <span>🚚 Free Delivery</span>
            <span>🛡 Warranty</span>
            <span>💳 Secure Payment</span>
          </div>
        </div>

        <div className="hero-right">
          <img
            src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop"
            alt="electronics"
          />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <p>Explore products by category</p>
        </div>

        <div className="category-grid">
          <div className="card">📱 Smartphones</div>
          <div className="card">💻 Laptops</div>
          <div className="card">🎧 Accessories</div>
          <div className="card">⌚ Gadgets</div>
          <div className="card">🔧 Repair</div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="section alt">
        <div className="section-header">
          <h2>Featured Products</h2>
          <p>Top trending items customers love</p>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <div className="product-card" key={product.id}>
              
              <div className="product-img">
                <img src={product.image} alt={product.name} />
              </div>

              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="price">{product.price}</p>

                <button className="add-btn">Add to Cart</button>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="section">
        <div className="section-header">
          <h2>Why Choose Tazz Electronics</h2>
          <p>We provide reliable products and trusted services for our customers</p>
        </div>

        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Get your orders delivered quickly and safely to your doorstep.</p>
          </div>

          <div className="why-card">
            <div className="why-icon">🛡</div>
            <h3>Warranty Protection</h3>
            <p>All products come with warranty and quality assurance.</p>
          </div>

          <div className="why-card">
            <div className="why-icon">🔒</div>
            <h3>Secure Payments</h3>
            <p>Your transactions are protected with safe payment methods.</p>
          </div>

          <div className="why-card">
            <div className="why-icon">⚡</div>
            <h3>Quick Service</h3>
            <p>Fast and reliable repair services handled by professionals.</p>
          </div>
        </div>
      </section>

      {/* REPAIR */}
      <section className="repair" id="repair">
        <div className="repair-left">
          <span className="repair-badge">Repair Service</span>

          <h2>Device Not Working? Let Our Experts Fix It</h2>

          <p>
            Book a repair for your smartphone, laptop, tablet, or accessories. Our
            technicians diagnose the issue, provide a clear price estimate, and repair
            your device with care.
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
              <p>Software Troubleshooting</p>
            </div>
          </div>

          <div className="repair-actions">
            <button className="btn-primary">Book Repair</button>
            <button className="repair-call">Call Technician</button>
          </div>
        </div>

        <div className="repair-right">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop"
            alt="Laptop repair service"
          />

          <div className="repair-info-card">
            <strong>Fast Diagnosis</strong>
            <span>Get repair status updates quickly</span>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="section alt">
        <div className="section-header">
          <h2>What Customers Say</h2>
          <p>Real feedback from our customers</p>
        </div>

        <div className="testimonial-grid">
          {testimonialsData.map((item) => (
            <div className="testimonial-card" key={item.id}>
              <p className="testimonial-text">“{item.text}”</p>

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