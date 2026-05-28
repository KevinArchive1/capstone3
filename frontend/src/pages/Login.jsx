import { useState } from "react";
import { loginUser } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import styles from "./Login.module.css";

function Login() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { clearCart } = useCart();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);

      if (!res.data?.user) {
        setError("Login failed. Please try again.");
        return;
      }

      login(res.data.user);
      clearCart();
      localStorage.setItem("token", res.data.token);

      const role = res.data.user.role;
      const staffRole = res.data.user.staff_role;

      if (role === "admin") navigate("/admin");
      else if (role === "staff" && staffRole === "kitchen") navigate("/kitchen");
      else if (role === "staff" && staffRole === "bar") navigate("/bar");
      else if (role === "staff" && staffRole === "cashier") navigate("/cashier");
      else if (role === "staff") navigate("/staff");
      else navigate("/");

    } catch (err) {
      const data = err.response?.data;

      // Surface the actual backend error message
      if (data?.non_field_errors?.length) {
        setError(data.non_field_errors[0]);
      } else if (data?.detail) {
        setError(data.detail);
      } else if (data?.identifier?.length) {
        setError(`Identifier: ${data.identifier[0]}`);
      } else if (data?.password?.length) {
        setError(`Password: ${data.password[0]}`);
      } else if (typeof data === "string") {
        setError(data);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      <div className={styles.left}>
        <div className={styles.brand}>
          <h1 className={styles.logo}>Burp <span>&</span> Blends</h1>
          <p className={styles.tagline}>Along the way you grow</p>
        </div>
        <div className={styles.heroText}>
          <h2>Welcome<br />back!</h2>
          <p>Sign in to access your orders, track your meals, and enjoy a seamless dining experience.</p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>

          <h2 className={styles.title}>Sign In</h2>
          <p className={styles.sub}>Enter your credentials to continue</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email or Phone</label>
              <input
                className={styles.input}
                type="text"
                name="identifier"
                placeholder="your@email.com"
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
                required
              />
            </div>

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Don't have an account?{" "}
              <span className={styles.link} onClick={() => navigate("/register")}>
                Create one
              </span>
            </p>
            <p>
              <span className={styles.link} onClick={() => navigate("/start")}>
                ← Back to home
              </span>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;