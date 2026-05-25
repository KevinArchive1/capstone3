import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TableModal from "../components/TableModal";
import { useTable } from "../context/TableContext";
import styles from "./Landing.module.css";

export default function Landing() {
  const navigate = useNavigate();
  const { enterAsGuest } = useAuth();
  const { table } = useTable();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGuest() {
    setLoading(true);
    await enterAsGuest();
    navigate("/");
    setLoading(false);
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
          <h2>Good food,<br />great moments.</h2>
          <p>Order your favorite meals and drinks with ease. Scan your table QR or enter a code to get started.</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className={styles.right}>
        <div className={styles.card}>

          <h2 className={styles.title}>Welcome!</h2>
          <p className={styles.sub}>Choose how you'd like to continue</p>

          {table && (
            <div className={styles.tableSelected}>
              🪑 Table {table.identifier} selected
            </div>
          )}

          <div className={styles.buttons}>
            <button
              className={styles.primaryBtn}
              onClick={() => navigate("/login")}
            >
              Login
            </button>

            <button
              className={styles.secondaryBtn}
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <button
              className={styles.guestBtn}
              onClick={handleGuest}
              disabled={loading}
            >
              {loading ? "Setting up..." : "Continue as Guest"}
            </button>

            <button
              className={styles.qrBtn}
              onClick={() => setShowModal(true)}
            >
              🪑 {table ? `Table ${table.identifier} — Change` : "Scan QR / Enter Table Code"}
            </button>
          </div>

        </div>
      </div>

      {showModal && (
        <TableModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}

    </div>
  );
}