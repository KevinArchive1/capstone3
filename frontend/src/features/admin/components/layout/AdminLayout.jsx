import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import styles from "./AdminLayout.module.css";

function AdminLayout() {
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
            to="/admin"
            end
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/products"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>🍽️</span>
            Products
          </NavLink>

          <NavLink
            to="/admin/stock"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>📦</span>
            Stock
          </NavLink>

          <NavLink
            to="/admin/reports"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>📈</span>
            Reports
          </NavLink>
        </nav>

        <div className={styles.bottom}>
          <div className={styles.userInfo}>
            <span className={styles.icon}>👤</span>
            <div>
              <p className={styles.userName}>{user?.first_name || user?.username}</p>
              <p className={styles.userRole}>Admin</p>
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

export default AdminLayout;