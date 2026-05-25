import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import styles from "./CashierLayout.module.css";

function CashierLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/start");
  }

  return (
    <div className={styles.layout}>

      <aside className={styles.sidebar}>

        <div className={styles.logo}>
          Burp <span>BLENDS</span>
          <p>Along the way you grow</p>
        </div>

        <nav className={styles.nav}>
          <NavLink
            to="/cashier"
            end
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/cashier/orders"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>💳</span>
            Orders
          </NavLink>

          <NavLink
            to="/cashier/history"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>📋</span>
            Order History
          </NavLink>
        </nav>

        <div className={styles.bottom}>
          <div className={styles.userInfo}>
            <span className={styles.icon}>👤</span>
            <div>
              <p className={styles.userName}>{user?.first_name || user?.username}</p>
              <p className={styles.userRole}>Cashier</p>
            </div>
          </div>
          <button className={styles.logout} onClick={handleLogout}>
            <span className={styles.icon}>🚪</span>
            Logout
          </button>
        </div>

      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>

    </div>
  );
}

export default CashierLayout;