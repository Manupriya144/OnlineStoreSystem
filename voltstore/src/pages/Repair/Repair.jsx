import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./Repair.css";

const DEVICE_TYPES = [
  { icon: "📱", label: "Smartphone" },
  { icon: "💻", label: "Laptop" },
  { icon: "📟", label: "Tablet" },
  { icon: "⌚", label: "Smartwatch" },
  { icon: "🖥", label: "Desktop" },
  { icon: "📷", label: "Camera" },
];

const SERVICE_TYPES = [
  "Screen Replacement",
  "Battery Replacement",
  "Software Fix",
  "Water Damage",
  "Charging Port Fix",
  "Other",
];

const STEPS = [
  {
    num: "1",
    title: "Submit Request",
    desc: "Fill in your device details and issue description.",
  },
  {
    num: "2",
    title: "Get a Quote",
    desc: "We'll call you within 30 minutes with a price estimate.",
  },
  {
    num: "3",
    title: "Device Repaired",
    desc: "Drop off or we collect. Ready same day in most cases.",
  },
];

const TRUST = [
  { icon: "🛡", title: "Warranty", desc: "30-day repair guarantee" },
  { icon: "⚡", title: "Same Day", desc: "Most repairs done fast" },
  { icon: "💳", title: "Fair Price", desc: "Transparent quotation" },
  { icon: "📞", title: "Support", desc: "We keep you updated" },
];

function Repair() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    device: "Smartphone",
    brand: "",
    model: "",
    issue: "",
    serviceType: "",
    date: "",
    name: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function sendRepairEmail(repairData) {
    const { error } = await supabase.functions.invoke("send-repair-email", {
      body: {
        email: user.email,
        customerName: form.name,
        type: "received",
        deviceType: form.device,
        brand: form.brand,
        model: form.model,
        issueDescription: form.issue,
        preferredDate: form.date,
        status: repairData.status || "pending",
      },
    });

    if (error) {
      console.error("Repair email error:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (authLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          phone: form.phone,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from("repair_requests")
        .insert({
          user_id: user.id,
          device_type: form.device,
          brand: form.brand,
          model: form.model,
          issue_description: form.issue,
          preferred_date: form.date || null,
          contact_name: form.name,
          contact_phone: form.phone,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      await sendRepairEmail(data);

      setMessage({
        text: "Repair request submitted! Confirmation email sent.",
        type: "success",
      });

      setForm({
        device: "Smartphone",
        brand: "",
        model: "",
        issue: "",
        serviceType: "",
        date: "",
        name: "",
        phone: "",
      });
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="repair-page">
      <div className="repair-left-panel">
        <div className="repair-section-lbl">Repair Service</div>
        <h1 className="repair-panel-title">
          Fix Your<br /><em>Device</em><br />With Us
        </h1>
        <p className="repair-panel-sub">
          Book a repair and our certified technicians will diagnose and fix your
          device — usually same day.
        </p>

        <div className="repair-steps">
          {STEPS.map((s) => (
            <div className="repair-step" key={s.num}>
              <div className="step-num">{s.num}</div>
              <div className="step-text">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="repair-trust-grid">
          {TRUST.map((t) => (
            <div className="trust-item" key={t.title}>
              <div className="trust-icon">{t.icon}</div>
              <h5>{t.title}</h5>
              <p>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="repair-form-card">
        <div className="repair-form-header">
          <div>
            <h2>Book a Repair</h2>
            <p>All fields marked * are required</p>
          </div>
          <div className="repair-form-icon">🔧</div>
        </div>

        <div className="repair-form-tabs">
          {["Device", "Issue", "Contact"].map((tab, i) => (
            <div className="repair-tab" key={tab}>
              <div className={`tab-line ${i === 0 ? "active" : ""}`} />
              <div className="tab-label">{tab}</div>
            </div>
          ))}
        </div>

        <form className="repair-form-body" onSubmit={handleSubmit}>
          <div className="field-section-title">Device Type *</div>
          <div className="device-pills">
            {DEVICE_TYPES.map(({ icon, label }) => (
              <button
                type="button"
                key={label}
                className={`device-pill ${
                  form.device === label ? "active" : ""
                }`}
                onClick={() => update("device", label)}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label>Brand *</label>
              <input
                placeholder="e.g. Apple, Samsung"
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Model *</label>
              <input
                placeholder="e.g. iPhone 14 Pro"
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-section-title">Issue Details</div>

          <div className="field">
            <label>Describe the Problem *</label>
            <textarea
              placeholder="e.g. Screen cracked, battery drains fast, won't turn on..."
              value={form.issue}
              onChange={(e) => update("issue", e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label>Preferred Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Service Type</label>
              <select
                value={form.serviceType}
                onChange={(e) => update("serviceType", e.target.value)}
              >
                <option value="">Select service</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-section-title">Your Details</div>

          <div className="form-grid-2">
            <div className="field">
              <label>Full Name *</label>
              <input
                placeholder="Kasun Perera"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Phone Number *</label>
              <input
                placeholder="+94 77 123 4567"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </div>
          </div>

          {message.text && (
            <div className={`repair-message ${message.type}`}>
              {message.type === "success" ? "✓" : "✕"} {message.text}
            </div>
          )}

          <button className="repair-submit-btn" disabled={loading} type="submit">
            {loading ? (
              "Submitting…"
            ) : (
              <>
                Submit Request <span className="arr">→</span>
              </>
            )}
          </button>
        </form>

        <div className="repair-form-footer">
          <span>🔒</span>
          <p>
            Your information is securely stored and only used to process your
            repair request.
          </p>
        </div>
      </div>
    </section>
  );
}

export default Repair;