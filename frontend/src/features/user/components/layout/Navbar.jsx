import { NavLink, useNavigate } from "react-router-dom";
import { useCart }  from "../../../../context/CartContext";
import { useAuth }  from "../../../../context/AuthContext";
import { useTable } from "../../../../context/TableContext";
import { useState, useEffect } from "react";
import TableModal  from "../../../../components/TableModal";
import LogoutButton from "../../../../components/LogoutButton";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { cart }                          = useCart();
  const { user }                          = useAuth();
  const { table, revalidateTable, clearTable } = useTable();
  const navigate                          = useNavigate();
  const [showModal, setShowModal]         = useState(false);

  // On mount: confirm stored table session is still active
  useEffect(() => {
    revalidateTable();
  }, []);

  const lastOrderId = localStorage.getItem("last_order_id");

  return (
    <>
      <nav className={styles.navbar}>

        <div className={styles.left}>
          <div className={styles.logo} onClick={() => navigate("/")}>
            Burp <span>BLENDS</span>
          </div>
          <input className={styles.search} placeholder="Search menu..." />
        </div>

        <div className={styles.links}>
          <NavLink
            to="/menu"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            Menu
          </NavLink>

          <NavLink
            to="/cart"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
            style={{ position: "relative" }}
          >
            Cart
            {cart.length > 0 && (
              <span className={styles.badge}>
                {cart.length > 99 ? "99+" : cart.length}
              </span>
            )}
          </NavLink>

          <NavLink
            to={lastOrderId ? `/order/process/${lastOrderId}` : "/order/process"}
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            My Order
          </NavLink>

          {user && (
            <NavLink
              to="/account/history"
              className={({ isActive }) => isActive ? styles.activeLink : styles.link}
            >
              History
            </NavLink>
          )}
        </div>

        <div className={styles.right}>
          {/* Table badge — shows occupied warning if table was stolen */}
          <div
            className={`${styles.tableBadge} ${!table ? styles.tableBadgeEmpty : ""}`}
            onClick={() => setShowModal(true)}
          >
            🪑{" "}
            {table
              ? `Table ${table.identifier}`
              : "Select Table"}
          </div>

          <div className={styles.userBadge}>
            👤 {user ? user.username : "Guest"}
          </div>

          <LogoutButton />
        </div>

      </nav>

      {showModal && (
        <TableModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
}