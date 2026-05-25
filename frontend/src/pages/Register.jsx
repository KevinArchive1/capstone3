import { useState } from "react";
import { registerUser } from "../services/auth";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";

function Register() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerUser(form);
      navigate("/login");
    } catch (err) {
      console.error(err.response?.data);
      const data = err.response?.data;
      if (data?.email) setError(`Email: ${data.email[0]}`);
      else if (data?.phone) setError(`Phone: ${data.phone[0]}`);
      else if (data?.password) setError(`Password: ${data.password[0]}`);
      else setError("Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* LEFT */}
      <div className={styles.left}>
        <div className={styles.brand}>
          <h1 className={styles.logo}>Burp <span>&</span> Blends</h1>
          <p className={styles.tagline}>Along the way you grow</p>
        </div>
        <div className={styles.heroText}>
          <h2>Join us<br />today!</h2>
          <p>Create an account to save your order history, track your meals, and enjoy a personalized dining experience.</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className={styles.right}>
        <div className={styles.card}>

          <h2 className={styles.title}>Create Account</h2>
          <p className={styles.sub}>Fill in your details to get started</p>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>First Name</label>
                <input
                  className={styles.input}
                  name="first_name"
                  placeholder="Juan"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Last Name</label>
                <input
                  className={styles.input}
                  name="last_name"
                  placeholder="Dela Cruz"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email *</label>
              <input
                className={styles.input}
                name="email"
                type="email"
                placeholder="your@email.com"
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Phone (optional)</label>
              <input
                className={styles.input}
                name="phone"
                placeholder="09XX XXX XXXX"
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password *</label>
              <input
                className={styles.input}
                type="password"
                name="password"
                placeholder="Min. 8 characters"
                onChange={handleChange}
                required
              />
            </div>

            <p className={styles.note}>
              * Either email or phone is required
            </p>

            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className={styles.footer}>
            <p>Already have an account?{" "}
              <span className={styles.link} onClick={() => navigate("/login")}>
                Sign in
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

export default Register;