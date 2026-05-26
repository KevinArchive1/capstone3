import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getScanRequests, getTables, getOrders } from "../../../services/staffApi";
import styles from "./StaffDashboard.module.css";

export default function StaffDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [scanRequests, setScanRequests] = useState([]);
  const [tables,       setTables]       = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    try {
      const [scanRes, tableRes, orderRes] = await Promise.all([
        getScanRequests(),
        getTables(),
        getOrders(),
      ]);
      setScanRequests(scanRes.data);
      setTables(tableRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const pendingScans = scanRequests.filter(r => r.status === "pending");
  const activeTables = tables.filter(t => t.status === "occupied");

  // New status names: "waiting" = paid & in queue, "preparing" = kitchen working
  const inProgressOrders = orders.filter(o =>
    ["waiting", "preparing"].includes(o.status)
  );
  const readyOrders = orders.filter(o => o.status === "ready");

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  function getStatusLabel(status) {
    switch (status) {
      case "pending":   return "Awaiting Payment";
      case "waiting":   return "In Queue";
      case "preparing": return "Preparing";
      case "ready":     return "Ready";
      case "cancelled": return "Cancelled";
      default:          return status;
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case "pending":   return styles.pending;
      case "waiting":   return styles.waiting;
      case "preparing": return styles.preparing;
      case "ready":     return styles.ready;
      case "cancelled": return styles.cancelled;
      default:          return "";
    }
  }

  if (loading) return (
    <div className={styles.loading}>Loading dashboard...</div>
  );

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good morning, {user?.first_name || user?.username}!
          </h1>
          <p className={styles.sub}>Here's what's happening in your area.</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* STAT CARDS */}
      <div className={styles.stats}>
        <div
          className={styles.statCard}
          onClick={() => navigate("/staff/qr-requests")}
        >
          <div className={styles.statIcon}>📱</div>
          <div>
            <p className={styles.statLabel}>QR Requests</p>
            <h2 className={styles.statValue}>{pendingScans.length}</h2>
            <p className={styles.statSub}>Pending approval</p>
          </div>
          {pendingScans.length > 0 && <span className={styles.dot} />}
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/staff/tables")}
        >
          <div className={styles.statIcon}>🪑</div>
          <div>
            <p className={styles.statLabel}>Active Tables</p>
            <h2 className={styles.statValue}>{activeTables.length}</h2>
            <p className={styles.statSub}>Currently occupied</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🍳</div>
          <div>
            <p className={styles.statLabel}>Orders in Progress</p>
            <h2 className={styles.statValue}>{inProgressOrders.length}</h2>
            <p className={styles.statSub}>Paid & being prepared</p>
          </div>
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/staff/ready")}
        >
          <div className={styles.statIcon}>✅</div>
          <div>
            <p className={styles.statLabel}>Ready to Serve</p>
            <h2 className={styles.statValue}>{readyOrders.length}</h2>
            <p className={styles.statSub}>Waiting to be served</p>
          </div>
          {readyOrders.length > 0 && <span className={styles.dot} />}
        </div>
      </div>

      <div className={styles.grid}>

        {/* LINE OVERVIEW */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Line Overview</h3>
          <div className={styles.lineList}>
            {orders.slice(0, 6).map(order => (
              <div key={order.id} className={styles.lineItem}>
                <div className={styles.lineLeft}>
                  <span className={styles.lineOrder}>
                    #{order.receipt_number?.slice(-6)}
                  </span>
                  <span className={styles.lineNote}>
                    {order.notes?.replace("Table: ", "Table ") || "—"}
                  </span>
                </div>
                <span className={`${styles.badge} ${getStatusStyle(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            ))}
            {orders.length === 0 && (
              <p className={styles.empty}>No orders yet.</p>
            )}
          </div>
        </div>

        {/* TABLE STATUS */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Table Status Overview</h3>
          <div className={styles.tableGrid}>
            {tables.map(table => (
              <div
                key={table.id}
                className={`${styles.tableChip} ${styles[table.status]}`}
                onClick={() => navigate("/staff/tables")}
              >
                <span className={styles.tableId}>{table.identifier}</span>
                <span className={styles.tableStatus}>{table.status}</span>
              </div>
            ))}
            {tables.length === 0 && (
              <p className={styles.empty}>No tables found.</p>
            )}
          </div>
        </div>

        {/* READY TO SERVE */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Ready to Serve</h3>
          <div className={styles.lineList}>
            {readyOrders.slice(0, 5).map(order => (
              <div key={order.id} className={styles.lineItem}>
                <div className={styles.lineLeft}>
                  <span className={styles.lineOrder}>
                    #{order.receipt_number?.slice(-6)}
                  </span>
                  <span className={styles.lineNote}>
                    {order.notes?.replace("Table: ", "Table ") || "—"}
                  </span>
                </div>
                <button
                  className={styles.serveBtn}
                  onClick={() => navigate("/staff/ready")}
                >
                  View
                </button>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className={styles.empty}>No orders ready.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}