import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import API from "../../../services/api";
import styles from "./OrderHistory.module.css";

function StatusBadge({ status }) {
  const map = {
    placed:          { label: "Placed",           bg: "#fff4ea", color: "#ff7a00" },
    payment_pending: { label: "Awaiting Payment",  bg: "#eef2ff", color: "#4a6cf7" },
    paid:            { label: "Paid",              bg: "#e6f4ea", color: "#28a745" },
    preparing:       { label: "Preparing",         bg: "#fff8e1", color: "#f59e0b" },
    ready:           { label: "Ready",             bg: "#fff4ea", color: "#ff7a00" },
    cancelled:       { label: "Cancelled",         bg: "#fce8e8", color: "#e53e3e" },
    draft:           { label: "Draft",             bg: "#f0f0f0", color: "#888"    },
  };
  const s = map[status] || { label: status, bg: "#f0f0f0", color: "#888" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: "11px", fontWeight: 700,
      padding: "3px 10px", borderRadius: "20px",
    }}>
      {s.label}
    </span>
  );
}

export default function OrderHistory() {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const [orders,       setOrders]      = useState([]);
  const [actionLogs,   setActionLogs]  = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState("");
  const [activeTab,    setActiveTab]   = useState("orders");

  useEffect(() => {
    if (user) {
      // Logged-in user — fetch from API
      API.get("identity/me/history/")
        .then(res => {
          setActionLogs(res.data.action_logs || []);
          setOrders(res.data.guest_orders_matched_after_registration || []);
        })
        .catch(() => setError("Could not load history. Please try again."))
        .finally(() => setLoading(false));
    } else {
      // Guest — read tracked order IDs from localStorage then fetch each one
      const guestOrderIds = JSON.parse(
        localStorage.getItem("guest_orders") || "[]"
      );
      const lastId = localStorage.getItem("last_order_id");
      const allIds = [...new Set([lastId, ...guestOrderIds].filter(Boolean))];

      if (allIds.length === 0) {
        setLoading(false);
        return;
      }

      const guestKey = localStorage.getItem("guest_key");
      Promise.all(
        allIds.map(id =>
          API.get(`/orders/${id}/?guest_key=${guestKey}`)
            .then(r => r.data)
            .catch(() => null)
        )
      )
        .then(results => setOrders(results.filter(Boolean)))
        .catch(() => setError("Could not load orders."))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return (
    <div className={styles.loading}>Loading your history...</div>
  );

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {user ? "My History" : "My Orders"}
          </h1>
          <p className={styles.sub}>
            {user
              ? "Your order and activity history"
              : "Orders placed from this device"}
          </p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* Guest prompt to register */}
      {!user && (
        <div className={styles.guestBanner}>
          <p>
            📋 Create an account to keep your full order history across devices.
          </p>
          <button
            className={styles.registerBtn}
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* TABS — only show activity log tab for logged-in users */}
      {user && (
        <div className={styles.tabs}>
          <button
            className={activeTab === "orders" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("orders")}
          >
            Orders
            {orders.length > 0 && (
              <span className={styles.tabBadge}>{orders.length}</span>
            )}
          </button>
          <button
            className={activeTab === "activity" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("activity")}
          >
            Activity Log
            {actionLogs.length > 0 && (
              <span className={styles.tabBadge}>{actionLogs.length}</span>
            )}
          </button>
        </div>
      )}

      {/* ORDERS */}
      {(activeTab === "orders" || !user) && (
        <div className={styles.section}>
          {orders.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>🧾</p>
              <p>No orders yet.</p>
              <button
                className={styles.browseBtn}
                onClick={() => navigate("/menu")}
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className={styles.orderList}>
              {orders.map(order => (
                <div
                  key={order.id}
                  className={styles.orderCard}
                  onClick={() => navigate(`/order/process/${order.id}`)}
                >
                  <div className={styles.orderTop}>
                    <div>
                      <p className={styles.orderNumber}>
                        #{order.receipt_number?.slice(-6) || order.id}
                      </p>
                      <p className={styles.orderDate}>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString("en-PH", {
                              month: "short", day: "numeric", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "—"}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className={styles.orderBottom}>
                    <span className={styles.orderTotal}>
                      ₱{Number(order.total_amount || 0).toFixed(2)}
                    </span>
                    <span className={styles.viewLink}>View →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVITY LOG — logged-in only */}
      {user && activeTab === "activity" && (
        <div className={styles.section}>
          {actionLogs.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>📋</p>
              <p>No activity yet.</p>
            </div>
          ) : (
            <div className={styles.logList}>
              {actionLogs.map(log => (
                <div key={log.id} className={styles.logCard}>
                  <div className={styles.logLeft}>
                    <span className={styles.logAction}>{log.action}</span>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span className={styles.logMeta}>
                        {Object.entries(log.metadata)
                          .filter(([, v]) => v !== null && v !== undefined && v !== "")
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                  <span className={styles.logTime}>
                    {new Date(log.created_at).toLocaleString("en-PH", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}