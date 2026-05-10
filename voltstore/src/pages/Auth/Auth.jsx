import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import "./Auth.css";

function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  // login | register | forgot | updatePassword

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Detect Supabase recovery link
    const hash = window.location.hash;

    if (hash && hash.includes("type=recovery")) {
      setMode("updatePassword");
      setMessage("Enter your new password.");
    }

    // Listen for password recovery session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("updatePassword");
        setMessage("Enter your new password.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      // LOGIN
      if (mode === "login") {
        await login(email, password);
        navigate("/cart");
      }

      // REGISTER
      if (mode === "register") {
        await register(email, password, fullName);

        setMessage(
          "Account created successfully. Please confirm your email."
        );

        setMode("login");

        setPassword("");
        setFullName("");
      }

      // FORGOT PASSWORD
      if (mode === "forgot") {
        const redirectUrl =
          window.location.hostname === "localhost"
            ? "http://localhost:5173/auth"
            : "https://online-store-system-nine.vercel.app/auth";

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl,
        });

        if (error) throw error;

        setMessage(
          "Password reset link sent successfully. Please check your email."
        );
      }

      // UPDATE PASSWORD
      if (mode === "updatePassword") {
        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;

        setMessage(
          "Password updated successfully. Please login with your new password."
        );

        await supabase.auth.signOut();

        setMode("login");

        setPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Remove recovery hash from URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);

    setMessage("");

    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <span className="auth-badge">Tazz Electronics</span>

        <h1>
          {mode === "login" && "Welcome Back"}
          {mode === "register" && "Create Account"}
          {mode === "forgot" && "Reset Password"}
          {mode === "updatePassword" && "Create New Password"}
        </h1>

        <p>
          {mode === "login" &&
            "Login to continue your shopping experience."}

          {mode === "register" &&
            "Create an account to buy products and track orders."}

          {mode === "forgot" &&
            "Enter your email and we’ll send a secure password reset link."}

          {mode === "updatePassword" &&
            "Please create a new secure password for your account."}
        </p>

        <form onSubmit={handleSubmit}>
          {/* REGISTER */}
          {mode === "register" && (
            <div className="auth-field">
              <label>Full Name</label>

              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Mohamed Irfan"
                required
              />
            </div>
          )}

          {/* EMAIL */}
          {(mode === "login" ||
            mode === "register" ||
            mode === "forgot") && (
            <div className="auth-field">
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          )}

          {/* PASSWORD */}
          {(mode === "login" || mode === "register") && (
            <div className="auth-field">
              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          {/* UPDATE PASSWORD */}
          {mode === "updatePassword" && (
            <>
              <div className="auth-field">
                <label>New Password</label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="auth-field">
                <label>Confirm Password</label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {/* FORGOT LINK */}
          {mode === "login" && (
            <button
              type="button"
              className="forgot-link"
              onClick={() => switchMode("forgot")}
            >
              Forgot password?
            </button>
          )}

          {/* MESSAGE */}
          {message && <p className="auth-message">{message}</p>}

          {/* SUBMIT */}
          <button className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : mode === "register"
              ? "Create Account"
              : mode === "forgot"
              ? "Send Reset Link"
              : "Update Password"}
          </button>
        </form>

        {/* SWITCH MODES */}
        <div className="auth-switch">
          {mode === "login" && (
            <p>
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
              >
                Register
              </button>
            </p>
          )}

          {mode === "register" && (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                Login
              </button>
            </p>
          )}

          {mode === "forgot" && (
            <p>
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                Back to login
              </button>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Auth;