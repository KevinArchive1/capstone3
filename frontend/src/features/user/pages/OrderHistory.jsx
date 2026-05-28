import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getOrders, getOrder } from "../../../services/orderApi";
import API from "../../../services/api";
import styles from "./OrderHistory.module.css";

// ─── Shared color maps (same as OrderProcess) ─────────────────────────────────
const STATUS_COLORS = {
  placed:    "#4a6cf7",
  paid:      "#8b5cf6",
  preparing: "#f59e0b",
  ready:     "#0ea5e9",
  served:    "#22c55e",
  cancelled: "#e53e3e",
  draft:     "#aaaaaa",
};

const STATUS_BG = {
  placed:    "#eef2ff",
  paid:      "#f3eeff",
  preparing: "#fff8e1",
  ready:     "#e0f4ff",
  served:    "#e6f9ee",
  cancelled: "#fce8e8",
  draft:     "#f5f5f5",
};

// ─── Resolve display status (same logic as OrderProcess) ─────────────────────
function resolveDisplayStatus(order) {
  if (!order) return "pending";
  const { status, kitchen_status, bar_status, cashier_status } = order;

  if (status === "cancelled") return "cancelled";
  if (status === "draft")     return "draft";

  const kitchenDone = kitchen_status === "ready" || kitchen_status === "not_required";
  const barDone     = bar_status     === "ready" || bar_status     === "not_required";
  const allDone     = kitchenDone && barDone;

  if (status === "paid" && cashier_status === "paid" && allDone) return "served";
  if (status === "ready" && allDone)                             return "served";
  if (status === "ready")    return "ready";
  if (status === "preparing") return "preparing";
  if (status === "paid")     return "paid";
  if (["placed", "pending", "payment_pending"].includes(status)) return "placed";
  return status;
}

function getStatusLabel(display) {
  switch (display) {
    case "draft":     return "Draft";
    case "placed":    return "Waiting for Payment";
    case "paid":      return "Paid — In Queue";
    case "preparing": return "Preparing";
    case "ready":     return "Ready";
    case "served":    return "Served ✓";
    case "cancelled": return "Cancelled";
    default:          return display;
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ order }) {
  const display = resolveDisplayStatus(order);
  return (
    <span style={{
      background:   STATUS_BG[display]     || "#f0f0f0",
      color:        STATUS_COLORS[display] || "#888",
      fontSize:     "11px",
      fontWeight:   700,
      padding:      "3px 10px",
      borderRadius: "20px",
      whiteSpace:   "nowrap",
    }}>
      {getStatusLabel(display)}
    </span>
  );
}

// ─── Receipt Panel ────────────────────────────────────────────────────────────
function ReceiptPanel({ order, onClose }) {
  const display = resolveDisplayStatus(order);
  const color   = STATUS_COLORS[display] || "#888";
  const bg      = STATUS_BG[display]     || "#f5f5f5";
  const isPaid  = ["paid", "preparing", "ready", "served"].includes(display);

  return (
    <div className={styles.receiptPanel}>
      <div className={styles.receiptHeader}>
        <h3 className={styles.receiptTitle}>Receipt</h3>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div className={styles.receiptOrderRow}>
        <div>
          <p className={styles.receiptOrderId}>
            #{order.receipt_number?.slice(-6) || order.id}
          </p>
          <p className={styles.receiptMeta}>
            {order.created_at
              ? new Date(order.created_at).toLocaleString("en-PH", {
                  month: "long", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })
              : "—"}
          </p>
        </div>
        <span style={{
          background: bg, color,
          padding: "3px 10px", borderRadius: "20px",
          fontSize: "10px", fontWeight: 700,
          flexShrink: 0, textAlign: "center",
        }}>
          {getStatusLabel(display)}
        </span>
      </div>

      {/* Table */}
      {order.notes && (
        <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px" }}>
          🪑 {order.notes.replace("Table: ", "")}
        </p>
      )}

      {/* Items */}
      <div className={styles.receiptItems}>
        {order.items?.map(item => (
          <div key={item.id} className={styles.receiptItem}>
            <div className={styles.receiptItemInfo}>
              <p className={styles.receiptItemName}>{item.item_name}</p>
              <p className={styles.receiptItemQty}>×{item.quantity}</p>
            </div>
            <p className={styles.receiptItemPrice}>
              ₱{(Number(item.unit_price) * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className={styles.receiptTotal}>
        <span>Total</span>
        <span>₱{Number(order.total_amount || 0).toFixed(2)}</span>
      </div>

      {/* Payment status */}
      <div className={styles.receiptPaymentRow}>
        <span className={styles.receiptPaymentLabel}>Payment</span>
        <span style={{
          background: isPaid ? "#e6f9ee" : "#fff8e1",
          color:      isPaid ? "#22c55e" : "#f59e0b",
          padding: "3px 12px", borderRadius: "20px",
          fontSize: "12px", fontWeight: 700,
        }}>
          {isPaid ? "PAID" : "PENDING"}
        </span>
      </div>

      <button className={styles.closeReceiptBtn} onClick={onClose}>
        Close
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderHistory() {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const [orders,       setOrders]      = useState([]);
  const [actionLogs,   setActionLogs]  = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [error,        setError]       = useState("");
  const [activeTab,    setActiveTab]   = useState("done");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  async function fetchHistory() {
    setLoading(true);
    setError("");
    try {
      if (user) {
        const [ordersRes, historyRes] = await Promise.all([
          getOrders(),
          API.get("identity/me/history/").catch(() => ({
            data: { action_logs: [], guest_orders_matched_after_registration: [] },
          })),
        ]);

        const userOrders = Array.isArray(ordersRes.data)
          ? ordersRes.data
          : ordersRes.data?.results || [];

        const guestMatched = historyRes.data?.guest_orders_matched_after_registration || [];
        const merged = [
          ...userOrders,
          ...guestMatched.filter(o => !userOrders.find(uo => uo.id === o.id)),
        ];
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setOrders(merged);
        setActionLogs(historyRes.data?.action_logs || []);
      } else {
        const guestKey     = localStorage.getItem("guest_key");
        const guestOrderIds = JSON.parse(localStorage.getItem("guest_orders") || "[]");
        const lastId       = localStorage.getItem("last_order_id");
        const allIds       = [...new Set([lastId, ...guestOrderIds].filter(Boolean))];

        let allOrders = [];

        if (guestKey) {
          try {
            const res = await getOrders();
            allOrders = Array.isArray(res.data) ? res.data : res.data?.results || [];
          } catch { /* fall through */ }
        }

        if (allIds.length > 0) {
          const fetchedIds = new Set(allOrders.map(o => String(o.id)));
          const missing    = allIds.filter(id => !fetchedIds.has(String(id)));
          if (missing.length > 0) {
            const results = await Promise.all(
              missing.map(id => getOrder(id).then(r => r.data).catch(() => null))
            );
            allOrders = [...allOrders, ...results.filter(Boolean)];
          }
        }

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

  // Only completed/cancelled orders
  const doneOrders = orders.filter(o => {
    const d = resolveDisplayStatus(o);
    return ["served", "cancelled"].includes(d);
  });

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading your history...</div>;

  // ── Tabs config ──
  const tabs = [
    { key: "done",     label: "Completed & Cancelled",   count: doneOrders.length    },
    ...(user ? [{ key: "activity", label: "Activity Log", count: actionLogs.length }] : []),
  ];

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{user ? "My History" : "My Orders"}</h1>
          <p className={styles.sub}>
            {user ? "Your order and activity history" : "Orders placed from this device"}
          </p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* Guest prompt */}
      {!user && (
        <div style={{
          background: "#fff4ea", border: "1.5px solid #ff7a00",
          borderRadius: "12px", padding: "14px 20px", marginBottom: "20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
        }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#555" }}>
            📋 Create an account to keep your full order history across devices.
          </p>
          <button
            onClick={() => navigate("/register")}
            style={{
              padding: "8px 18px", borderRadius: "20px", border: "none",
              background: "#ff7a00", color: "white", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", flexShrink: 0,
            }}
          >
            Create Account
          </button>
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* TABS */}
      <div className={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={activeTab === t.key ? styles.activeTab : styles.tab}
            onClick={() => { setActiveTab(t.key); setSelectedOrder(null); }}
          >
            {t.label}
            {t.count > 0 && (
              <span className={styles.tabBadge}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ORDERS TAB */}
      {activeTab === "done" && (
        <div className={styles.section}>
          {doneOrders.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyIcon}>🧾</p>
              <p>No completed or cancelled orders yet.</p>
            </div>
          ) : (
            <div className={styles.trackerLayout}>

              {/* ORDER LIST */}
              <div className={`${styles.orderList} ${selectedOrder ? styles.orderListNarrow : ""}`}>
                {doneOrders.map(order => {
                  const display = resolveDisplayStatus(order);
                  const color   = STATUS_COLORS[display] || "#888";
                  const bg      = STATUS_BG[display]     || "#f5f5f5";
                  const isSelected = selectedOrder?.id === order.id;

                  return (
                    <div
                      key={order.id}
                      className={styles.orderCard}
                      style={{ borderLeft: `4px solid ${color}`, cursor: "pointer",
                               outline: isSelected ? `2px solid ${color}` : "none" }}
                      onClick={() => setSelectedOrder(isSelected ? null : order)}
                    >
                      {/* Left: order meta */}
                      <div className={styles.orderLeft}>
                        <p className={styles.orderNumber}>
                          #{order.receipt_number?.slice(-6) || order.id}
                        </p>
                        <p className={styles.orderTable}>
                          🪑 {order.notes?.replace("Table: ", "") || "—"}
                        </p>
                        <p className={styles.orderTime}>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleString("en-PH", {
                                month: "short", day: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </p>
                      </div>

                      {/* Middle: status */}
                      <div className={styles.orderStatus}>
                        <span style={{
                          background: bg, color,
                          fontSize: "11px", fontWeight: 700,
                          padding: "4px 12px", borderRadius: "20px",
                          display: "inline-block", marginBottom: "6px",
                        }}>
                          {getStatusLabel(display)}
                        </span>
                        <p className={styles.orderTotal}>
                          ₱{Number(order.total_amount || 0).toFixed(2)}
                        </p>
                      </div>

                      {/* Right: items preview */}
                      <div className={styles.orderItems}>
                        <p className={styles.itemsLabel}>
                          {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                        </p>
                        {order.items?.slice(0, 3).map(item => (
                          <p key={item.id} className={styles.itemBullet}>
                            • {item.item_name} ×{item.quantity}
                          </p>
                        ))}
                        {order.items?.length > 3 && (
                          <p className={styles.itemBullet}>
                            +{order.items.length - 3} more
                          </p>
                        )}
                      </div>

                      {/* Action */}
                      <div>
                        <button
                          className={styles.viewReceiptBtn}
                          style={{ borderColor: color, color }}
                          onClick={e => { e.stopPropagation(); setSelectedOrder(isSelected ? null : order); }}
                        >
                          {isSelected ? "Close ✕" : "View Receipt →"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RECEIPT PANEL */}
              {selectedOrder && (
                <ReceiptPanel
                  order={selectedOrder}
                  onClose={() => setSelectedOrder(null)}
                />
              )}

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