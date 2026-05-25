// components/layout/UserLayout.jsx
import { Outlet } from "react-router-dom";
import styles from "./Layout.module.css";
import Navbar from "./Navbar";

function UserLayout() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  );
}

export default UserLayout;