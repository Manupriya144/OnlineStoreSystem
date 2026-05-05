import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./Repair.css";

function Repair() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    device: "",
    brand: "",
    model: "",
    issue: "",
    date: "",
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      // Ensure profile exists before inserting repair request
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: form.name || user.user_metadata?.full_name || user.email,
        phone: form.phone,
        role: "customer",
      });

      if (profileError) throw profileError;

      const { error } = await supabase.from("repair_requests").insert({
        user_id: user.id,
        device_type: form.device,
        brand: form.brand,
        model: form.model,
        issue_description: form.issue,
        preferred_date: form.date || null,
        contact_name: form.name,
        contact_phone: form.phone,
      });

      if (error) throw error;

      setMessage("Repair request submitted successfully.");

      setForm({
        device: "",
        brand: "",
        model: "",
        issue: "",
        date: "",
        name: "",
        phone: "",
      });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="repair-page">
      <div className="repair-card">
        <h1>Book a Repair Service</h1>
        <p>Fill the form and our technicians will contact you.</p>

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Device (Phone, Laptop)"
            value={form.device}
            onChange={(e) => update("device", e.target.value)}
            required
          />

          <input
            placeholder="Brand"
            value={form.brand}
            onChange={(e) => update("brand", e.target.value)}
          />

          <input
            placeholder="Model"
            value={form.model}
            onChange={(e) => update("model", e.target.value)}
          />

          <textarea
            placeholder="Describe the issue..."
            value={form.issue}
            onChange={(e) => update("issue", e.target.value)}
            required
          />

          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />

          <input
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />

          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
          />

          {message && <p className="repair-msg">{message}</p>}

          <button disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Repair;