import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

import LogoutButton from "../../../../components/LogoutButton";

export default function Navbar() {
  return (
    <aside className={styles.sidebar}>
      
      {/* MAIN */}
      <div className={styles.section}>
        <p className={styles.title}>Main</p>

        <NavLink to="/admin" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Dashboard</span>
        </NavLink>
      </div>

      <hr />

      {/* PRODUCT */}
      <div className={styles.section}>
        <p className={styles.title}>Product</p>

        <NavLink to="admin/products" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Products</span>
        </NavLink>

        <NavLink to="admin/products/create" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Create Product</span>
        </NavLink>
      </div>

      <hr />

      {/* STOCK */}
      <div className={styles.section}>
        <p className={styles.title}>Stock</p>

        <NavLink to="admin/stock" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Manage Stock</span>
        </NavLink>

        <NavLink to="admin/stock/history" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Stock History</span>
        </NavLink>

        <NavLink to="admin/stock/add-ingredients" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Add Ingredients</span>
        </NavLink>
      </div>

      <hr />

      {/* WASTE */}
      <div className={styles.section}>
        <p className={styles.title}>Waste</p>

        <NavLink to="admin/waste" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Waste Monitoring</span>
        </NavLink>

        <NavLink to="admin/waste/expiry" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Expiry Monitoring</span>
        </NavLink>
      </div>

      <hr />

      {/* SUPPLIES */}
      <div className={styles.section}>
        <p className={styles.title}>Supplies</p>

        <NavLink to="admin/suppliers" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Supplier List</span>
        </NavLink>

        <NavLink to="admin/suppliers/analytics" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Supplier Analytics</span>
        </NavLink>
      </div>

      <hr />

      {/* REPORTS */}
      <div className={styles.section}>
        <p className={styles.title}>Reports</p>

        <NavLink to="admin/reports/sales" className={styles.link}>
          <span className={styles.icon}></span>
          <span>Sales Report</span>
        </NavLink>
      </div>

      <LogoutButton />
    </aside>
  );
}