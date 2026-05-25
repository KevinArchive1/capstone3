import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import styles from "./StaffLayout.module.css";

function StaffLayout() {
  const { logout } = useAuth();
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
            to="/staff"
            end
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>📊</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/staff/qr-requests"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>📱</span>
            QR Request
          </NavLink>

          <NavLink
            to="/staff/tables"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>🪑</span>
            Tables
          </NavLink>

          <NavLink
            to="/staff/ready"
            className={({ isActive }) => isActive ? styles.activeLink : styles.link}
          >
            <span className={styles.icon}>✅</span>
            Ready to Serve
          </NavLink>
        </nav>

        <div className={styles.bottom}>
          <div className={styles.link}>
            <span className={styles.icon}>👤</span>
            Profile
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

export default StaffLayout;