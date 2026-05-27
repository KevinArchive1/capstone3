import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getOrders, getOrder } from "../../../services/orderApi";
import API from "../../../services/api";
import styles from "./OrderHistory.module.css";

function StatusBadge({ status }) {
  const map = {
    placed:          { label: "Placed",           bg: "#fff4ea", color: "#ff7a00" },
    pending:         { label: "Placed",           bg: "#fff4ea", color: "#ff7a00" },
    payment_pending: { label: "Awaiting Payment",  bg: "#eef2ff", color: "#4a6cf7" },
    // "paid" = cashier confirmed, in kitchen queue
    paid:            { label: "Paid — In Queue",   bg: "#e6f4ea", color: "#28a745" },
    waiting:         { label: "Paid — In Queue",   bg: "#e6f4ea", color: "#28a745" },
    preparing:       { label: "Preparing",         bg: "#fff8e1", color: "#f59e0b" },
    ready:           { label: "Ready",             bg: "#e6f4ea", color: "#28a745" },
    cancelled:       { label: "Cancelled",         bg: "#fce8e8", color: "#e53e3e" },
    draft:           { label: "Draft",             bg: "#f0f0f0", color: "#888"    },
  };
  const s = map[status] || { label: status, bg: "#f0f0f0", color: "#888" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: "11px", fontWeight: 700,
      padding: "3px 10px", borderRadius: "20px",
      whiteSpace: "nowrap",
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
    fetchHistory();
  }, [user]);

  async function fetchHistory() {
    setLoading(true);
    setError("");

    try {
      if (user) {
        // Logged-in: fetch both their orders and activity log in parallel
        const [ordersRes, historyRes] = await Promise.all([
          getOrders(),
          API.get("identity/me/history/").catch(() => ({ data: { action_logs: [], guest_orders_matched_after_registration: [] } })),
        ]);

        const userOrders = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : ordersRes.data?.results || [];

        // Also merge any guest orders matched after registration
        const guestMatched = historyRes.data?.guest_orders_matched_after_registration || [];
        const guestMatchedIds = new Set(guestMatched.map(o => o.id));
        const merged = [
          ...userOrders,
          ...guestMatched.filter(o => !userOrders.find(uo => uo.id === o.id)),
        ];
        // Sort newest first
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setOrders(merged);
        setActionLogs(historyRes.data?.action_logs || []);
      } else {
        // Guest — read tracked order IDs from localStorage
        const guestKey = localStorage.getItem("guest_key");
        const guestOrderIds = JSON.parse(localStorage.getItem("guest_orders") || "[]");
        const lastId = localStorage.getItem("last_order_id");
        const allIds = [...new Set([lastId, ...guestOrderIds].filter(Boolean))];

        let allOrders = [];

        // First try the bulk guest endpoint
        if (guestKey) {
          try {
            const res = await getOrders(); // now includes guest_key automatically
            allOrders = Array.isArray(res.data) ? res.data : res.data?.results || [];
          } catch {
            // fall through to individual fetch
          }
        }

        // Fallback: fetch individually tracked IDs
        if (allIds.length > 0) {
          const fetchedIds = new Set(allOrders.map(o => String(o.id)));
          const missing = allIds.filter(id => !fetchedIds.has(String(id)));

          if (missing.length > 0) {
            const results = await Promise.all(
              missing.map(id =>
                getOrder(id).then(r => r.data).catch(() => null)
              )
            );
            allOrders = [...allOrders, ...results.filter(Boolean)];
          }
        }

        // Deduplicate and sort
        const seen = new Set();
        allOrders = allOrders.filter(o => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
        allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setOrders(allOrders);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load history. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
        <div style={{
          background: "#fff4ea",
          border: "1.5px solid #ff7a00",
          borderRadius: "12px",
          padding: "14px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
            📋 Create an account to keep your full order history across devices.
          </p>
          <button
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              border: "none",
              background: "#ff7a00",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
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