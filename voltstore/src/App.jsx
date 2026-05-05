import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home/Home";
import Shop from "./pages/Shop/Shop";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;