import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart }  from "../../../context/CartContext";
import { useAuth }  from "../../../context/AuthContext";
import { useTable } from "../../../context/TableContext";
import TableModal   from "../../../components/TableModal";
import {
  createOrder,
  submitOrder,
  getOrder,
  getOrders,
  cancelOrder,
} from "../../../services/orderApi";
import styles from "./OrderProcess.module.css";

// ─── helpers ──────────────────────────────────────────────────────────────────
/**
 * Derive a normalised "display status" from the full order object.
 *
 * Derives a display status from the full order object returned by the API.
 * This is needed because the cashier's "Mark as Served" action calls
 * cashier_update("paid"), which overwrites order.status back to "paid"
 * even after the kitchen has finished. So we cannot rely on order.status
 * alone — we also read kitchen_status, bar_status, and cashier_status.
 */
function resolveDisplayStatus(order) {
  if (!order) return "pending";

  const { status, kitchen_status, bar_status, cashier_status } = order;

  if (status === "cancelled") return "cancelled";
  if (status === "draft")     return "draft";

  // A station is "finished" when it is ready OR was never needed.
  const kitchenDone = kitchen_status === "ready" || kitchen_status === "not_required";
  const barDone     = bar_status     === "ready" || bar_status     === "not_required";
  const allDone     = kitchenDone && barDone;

  // "served" has TWO cases because of a backend quirk:
  //
  // Case 1 — Normal: kitchen marked ready → order.status becomes "ready"
  //   (brief window before cashier clicks "Mark as Served")
  //
  // Case 2 — After cashier clicks "Mark as Served": it calls cashier_update("paid")
  //   which OVERWRITES order.status back to "paid" even though food is done.
  //   Detect this by: status==="paid" + cashier_status==="paid" + all stations done.
  if (status === "paid" && cashier_status === "paid" && allDone) return "served";
  if (status === "ready" && allDone)                             return "served";

  // "ready" = stations done but cashier hasn't closed yet (rare window)
  if (status === "ready") return "ready";

  if (status === "preparing") return "preparing";

  // "paid" = cashier confirmed payment, kitchen not done yet → in queue
  if (status === "paid") return "paid";

  if (["placed", "pending", "payment_pending"].includes(status)) return "placed";

  return status;
}

// ─── Per-step color map ───────────────────────────────────────────────────────
const STATUS_COLORS = {
  placed:    "#4a6cf7",  // blue
  paid:      "#8b5cf6",  // purple
  preparing: "#f59e0b",  // amber
  ready:     "#0ea5e9",  // sky
  served:    "#22c55e",  // green
  cancelled: "#e53e3e",  // red
  draft:     "#aaaaaa",  // grey
};

// ─── Progress Circle ──────────────────────────────────────────────────────────
function ProgressCircle({ percent, displayStatus }) {
  const radius        = 54;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - (percent / 100) * circumference;

  const color  = STATUS_COLORS[displayStatus] || "#aaa";
  const isDone = displayStatus === "served";

  return (
    <div className={styles.circleWrapper}>
      <svg width="120" height="120" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="8" />
        <circle
          cx="65" cy="65" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {isDone ? (
          <text x="65" y="72" textAnchor="middle" fontSize="28" fill={color}>✓</text>
        ) : (
          <text x="65" y="72" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>
            {percent}%
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── Status Config ─────────────────────────────────────────────────────────────
// bg is a light tint of the matching STATUS_COLORS entry
const STATUS_BG = {
  placed:    "#eef2ff",  // light blue
  paid:      "#f3eeff",  // light purple
  preparing: "#fff8e1",  // light amber
  ready:     "#e0f4ff",  // light sky
  served:    "#e6f9ee",  // light green
  cancelled: "#fce8e8",  // light red
  draft:     "#f5f5f5",  // light grey
};

function getStatusConfig(order) {
  const display = resolveDisplayStatus(order);
  const color   = STATUS_COLORS[display] || "#aaa";
  const bg      = STATUS_BG[display]     || "#f5f5f5";

  const updatedTime = order?.updated_at
    ? new Date(order.updated_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const createdTime = order?.created_at
    ? new Date(order.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
    : "—";

  switch (display) {
    case "draft":
      return { label: "DRAFT",               desc: "Your order hasn't been submitted yet",                    percent: 5,   color, bg, timeLabel: "Created at",   time: createdTime };
    case "placed":
      return { label: "WAITING FOR PAYMENT", desc: "Please proceed to the cashier to pay",                   percent: 25,  color, bg, timeLabel: "Placed at",     time: createdTime };
    case "paid":
      return { label: "PAID — IN QUEUE",     desc: "Payment confirmed! Kitchen is queued to prepare your order", percent: 50, color, bg, timeLabel: "Confirmed at", time: updatedTime };
    case "preparing":
      return { label: "PREPARING",           desc: "Your food is being prepared right now 🍳",                percent: 75,  color, bg, timeLabel: "Started at",    time: updatedTime };
    case "ready":
      return { label: "READY!",              desc: "Your order is ready — waiter is on the way 🎉",           percent: 90,  color, bg, timeLabel: "Ready at",      time: updatedTime };
    case "served":
      return { label: "SERVED ✓",            desc: "Your order has been delivered. Enjoy your meal! 🍽️",     percent: 100, color, bg, timeLabel: "Served at",     time: updatedTime };
    case "cancelled":
      return { label: "CANCELLED",           desc: "This order was cancelled",                                percent: 0,   color, bg, timeLabel: "Cancelled at",  time: updatedTime };
    default:
      return { label: "PROCESSING",          desc: "Your order is being processed",                           percent: 10,  color, bg, timeLabel: "Placed at",     time: createdTime };
  }
}

// ─── Status Steps ─────────────────────────────────────────────────────────────
const STEPS = [
  { key: "placed",    label: "Placed"    },
  { key: "paid",      label: "Paid"      },
  { key: "preparing", label: "Preparing" },
  { key: "ready",     label: "Ready"     },
  { key: "served",    label: "Served"    },
];

function StatusSteps({ order }) {
  const display = resolveDisplayStatus(order);

  const displayToIndex = {
    draft:     -1,
    placed:     0,
    paid:       1,
    preparing:  2,
    ready:      3,
    served:     4,
    cancelled: -1,
  };
  const currentIdx = displayToIndex[display] ?? 0;

  return (
    <div className={styles.stepsRow}>
      {STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const color  = STATUS_COLORS[step.key];

        const dotStyle = (done || active)
          ? { background: color, color: "white", boxShadow: active ? `0 0 0 4px ${color}33` : "none" }
          : { background: "#f0f0f0", color: "#aaa" };

        const lineStyle = (done || active)
          ? { background: color }
          : { background: "#eee" };

        return (
          <div key={step.key} className={styles.stepItem}>
            {i > 0 && (
              <div className={styles.stepLine} style={done ? { background: STATUS_COLORS[STEPS[i - 1].key] } : {}} />
            )}
            <div className={styles.stepDot} style={dotStyle}>
              {done ? "✓" : i + 1}
            </div>
            <span
              className={styles.stepLabel}
              style={active ? { color, fontWeight: 700 } : {}}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Receipt Panel ────────────────────────────────────────────────────────────
function ReceiptPanel({ order, onClose }) {
  const config  = getStatusConfig(order);
  const display = resolveDisplayStatus(order);
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
            #{order.receipt_number?.slice(-6)}
          </p>
          <p className={styles.receiptMeta}>
            {new Date(order.created_at).toLocaleString("en-PH", {
              month: "long", day: "numeric", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={styles.receiptBadge}
          style={{ background: config.bg, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      <div className={styles.receiptItems}>
        {order.items?.map(item => (
          <div key={item.id} className={styles.receiptItem}>
            <div className={styles.receiptItemInfo}>
              <p className={styles.receiptItemName}>{item.item_name}</p>
              <p className={styles.receiptItemQty}>×{item.quantity}</p>
            </div>
            <p className={styles.receiptItemPrice}>
              ₱{(item.unit_price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className={styles.receiptTotal}>
        <span>Total</span>
        <span>₱{Number(order.total_amount).toFixed(2)}</span>
      </div>

      <div className={styles.receiptPaymentRow}>
        <span className={styles.receiptPaymentLabel}>Payment</span>
        <span
          className={styles.paymentBadge}
          style={{
            background: isPaid ? "#e6f4ea" : "#fff8e1",
            color:      isPaid ? "#28a745" : "#f59e0b",
          }}
        >
          {isPaid ? "PAID" : "PENDING PAYMENT"}
        </span>
      </div>

      <button className={styles.closeReceiptBtn} onClick={onClose}>
        Close
      </button>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onViewReceipt, onCancel, cancelling }) {
  const config  = getStatusConfig(order);
  const display = resolveDisplayStatus(order);
  const canCancel = ["draft", "placed"].includes(display);

  return (
    <div className={styles.orderCard}>
      <div className={styles.orderLeft}>
        <p className={styles.orderNumber}>
          Order #{order.receipt_number?.slice(-6)}
        </p>
        <p className={styles.orderTable}>
          🪑 {order.notes?.replace("Table: ", "") || "—"}
        </p>
        <p className={styles.orderTime}>
          {new Date(order.created_at).toLocaleString("en-PH", {
            month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>

      <div className={styles.orderStatus}>
        <span
          className={styles.statusBadge}
          style={{ background: config.bg, color: config.color }}
        >
          {config.label}
        </span>
        <p className={styles.statusDesc}>{config.desc}</p>
        <p className={styles.statusTimeLabel} style={{ color: config.color }}>
          {config.timeLabel}
        </p>
        <p className={styles.statusTime} style={{ color: config.color }}>
          {config.time}
        </p>
      </div>

      <ProgressCircle percent={config.percent} displayStatus={display} />

      <div className={styles.orderItems}>
        <p className={styles.itemsLabel}>
          Items ({order.items?.length || 0})
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

      <div className={styles.orderActions}>
        <button
          className={styles.viewReceiptBtn}
          onClick={() => onViewReceipt(order)}
        >
          View Receipt →
        </button>

        {canCancel && (
          <button
            className={styles.cancelOrderBtn}
            onClick={() => onCancel(order.id)}
            disabled={cancelling === order.id}
          >
            {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Order Tracker ────────────────────────────────────────────────────────────
function OrderTracker({ orderId }) {
  const { user } = useAuth();
  const [activeOrders,    setActiveOrders]    = useState([]);
  const [doneOrders,      setDoneOrders]      = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [selectedOrder,   setSelectedOrder]   = useState(null);
  const [activeTab,       setActiveTab]       = useState("active");
  const [cancelling,      setCancelling]      = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [orderId, user]);

  async function fetchOrders() {
    try {
      const token    = localStorage.getItem("token");
      const guestKey = localStorage.getItem("guest_key");
      let allOrders  = [];

      if (token || guestKey) {
        const res = await getOrders();
        allOrders = Array.isArray(res.data) ? res.data : res.data?.results || [];
      } else {
        setError("No session found. Please log in or continue as guest.");
        setLoading(false);
        return;
      }

      // Fallback: also check locally tracked IDs
      const trackedIds = [
        ...new Set([
          localStorage.getItem("last_order_id"),
          ...JSON.parse(localStorage.getItem("guest_orders") || "[]"),
        ].filter(Boolean))
      ];
      if (trackedIds.length > 0) {
        const fetchedIds = new Set(allOrders.map(o => String(o.id)));
        const missing = trackedIds.filter(id => !fetchedIds.has(String(id)));
        if (missing.length > 0) {
          const results = await Promise.all(
            missing.map(id => getOrder(id).then(r => r.data).catch(() => null))
          );
          allOrders = [...allOrders, ...results.filter(Boolean)];
        }
      }

      // Ensure the navigated-to order is present
      if (orderId) {
        const exists = allOrders.find(o => String(o.id) === String(orderId));
        if (!exists) {
          try {
            const single = await getOrder(orderId);
            if (single.data) allOrders = [single.data, ...allOrders];
          } catch { /* ignore */ }
        }
      }

      // Deduplicate & sort newest first
      const seen = new Set();
      allOrders = allOrders
        .filter(o => { if (seen.has(o.id)) return false; seen.add(o.id); return true; })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Split into active vs done using the resolved display status
      const active = allOrders.filter(o => {
        const d = resolveDisplayStatus(o);
        return ["draft", "placed", "paid", "preparing", "ready"].includes(d);
      });
      const done = allOrders.filter(o => {
        const d = resolveDisplayStatus(o);
        return ["served", "cancelled"].includes(d);
      });

      setActiveOrders(active);
      setDoneOrders(done);
      setError("");
    } catch (err) {
      console.error("fetchOrders error:", err);
      setError("Could not load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(id);
    try {
      await cancelOrder(id);
      await fetchOrders();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Could not cancel. The order may already be in progress.";
      alert(msg);
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return <div className={styles.loading}>Loading your orders...</div>;

  if (error) return (
    <div className={styles.trackerPage}>
      <div className={styles.noOrders}>
        <p>{error}</p>
        <button className={styles.orderAgainBtn} onClick={() => navigate("/menu")}>
          Go to Menu
        </button>
      </div>
    </div>
  );

  const displayOrders = activeTab === "active" ? activeOrders : doneOrders;
  const mostRecent    = activeOrders[0];

  return (
    <div className={styles.trackerPage}>

      {/* NOTIF BAR */}
      {activeOrders.length > 0 && (
        <div className={styles.notifBar}>
          <span className={styles.notifIcon}>🔔</span>
          <div>
            <p className={styles.notifTitle}>
              Tracking {activeOrders.length} active order
              {activeOrders.length !== 1 ? "s" : ""}
            </p>
            <p className={styles.notifSub}>Auto-refreshes every 8 seconds</p>
          </div>
        </div>
      )}

      {/* STATUS STEPS for most recent active order */}
      {mostRecent && (
        <div className={styles.stepsCard}>
          <p className={styles.stepsLabel}>
            Order #{mostRecent.receipt_number?.slice(-6)} — Progress
          </p>
          <StatusSteps order={mostRecent} />
        </div>
      )}

      {/* TABS */}
      <div className={styles.trackerTabs}>
        <button
          className={activeTab === "active" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("active")}
        >
          Active
          {activeOrders.length > 0 && (
            <span className={styles.tabCount}>{activeOrders.length}</span>
          )}
        </button>
        <button
          className={activeTab === "done" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("done")}
        >
          Completed & Cancelled
          {doneOrders.length > 0 && (
            <span className={styles.tabCount}>{doneOrders.length}</span>
          )}
        </button>
      </div>

      {displayOrders.length === 0 ? (
        <div className={styles.noOrders}>
          <p>
            {activeTab === "active"
              ? "🎉 No active orders."
              : "No completed or cancelled orders."}
          </p>
          {activeTab === "active" && (
            <button className={styles.orderAgainBtn} onClick={() => navigate("/menu")}>
              Go to Menu
            </button>
          )}
        </div>
      ) : (
        <div className={styles.trackerLayout}>
          <div className={`${styles.orderList} ${selectedOrder ? styles.orderListNarrow : ""}`}>
            {displayOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onViewReceipt={setSelectedOrder}
                onCancel={handleCancel}
                cancelling={cancelling}
              />
            ))}
          </div>

          {selectedOrder && (
            <ReceiptPanel
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Confirm Screen ───────────────────────────────────────────────────────────
export default function OrderProcess() {
  const { cart, total, clearCart } = useCart();
  const { user }  = useAuth();
  const { table } = useTable();
  const navigate  = useNavigate();
  const { id }    = useParams();

  const [showTableModal, setShowTableModal] = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  const isConfirming = cart.length > 0 && !id;

  useEffect(() => {
    if (isConfirming && !table) navigate("/cart");
  }, [isConfirming, table]);

  async function handleConfirmOrder() {
    if (!table) { setShowTableModal(true); return; }
    if (!table.session_id) {
      setError("No active table session. Please scan your table QR again.");
      return;
    }
    if (cart.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const items = cart.map(item => ({
        menu_item: item.id,
        quantity:  item.quantity,
      }));

      const orderRes = await createOrder({
        items,
        notes: `Table: ${table.identifier}`,
      });

      const newOrder = orderRes.data;
      await submitOrder(newOrder.id);

      const stored = JSON.parse(localStorage.getItem("guest_orders") || "[]");
      if (!stored.includes(String(newOrder.id))) {
        stored.push(String(newOrder.id));
        localStorage.setItem("guest_orders", JSON.stringify(stored));
      }
      localStorage.setItem("last_order_id", String(newOrder.id));

      clearCart();
      navigate(`/order/process/${newOrder.id}`);
    } catch (err) {
      console.error(err.response?.data);
      const data   = err.response?.data || {};
      const detail =
        data.detail ||
        data.non_field_errors?.[0] ||
        data.table_session?.[0] ||
        Object.values(data)[0]?.[0] ||
        "Failed to place order. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  if (!isConfirming) return <OrderTracker orderId={id} />;

  return (
    <div className={styles.confirmPage}>
      <div className={styles.confirmCard}>

        <h2 className={styles.confirmTitle}>Review & Confirm</h2>

        {table ? (
          <div className={styles.confirmTableBadge}>
            🪑 Table <strong>{table.identifier}</strong>
            <button className={styles.changeTableBtn} onClick={() => setShowTableModal(true)}>
              Change
            </button>
          </div>
        ) : (
          <div className={styles.confirmTableMissing}>⚠️ No table selected</div>
        )}

        <p className={styles.confirmUser}>
          {user
            ? <><span>👤</span> <strong>{user.username}</strong></>
            : <span style={{ color: "#888" }}>👤 Guest order</span>
          }
        </p>

        <div className={styles.payNotice}>
          💳 After placing your order, please pay at the cashier.
          Your food will be prepared once payment is confirmed.
        </div>

        <div className={styles.confirmSummary}>
          <h3 className={styles.confirmSummaryTitle}>Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} className={styles.confirmItem}>
              <span>
                {item.name}{" "}
                <span className={styles.confirmQty}>×{item.quantity}</span>
              </span>
              <span className={styles.confirmItemPrice}>
                ₱{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className={styles.confirmTotal}>
            <strong>Total</strong>
            <strong className={styles.confirmTotalValue}>₱{total.toFixed(2)}</strong>
          </div>
        </div>

        {error && <p className={styles.confirmError}>{error}</p>}

        <button
          className={styles.confirmBtn}
          onClick={handleConfirmOrder}
          disabled={loading || !table}
        >
          {loading ? "Placing order..." : "Confirm Order"}
        </button>

        <button className={styles.backBtn} onClick={() => navigate("/cart")}>
          ← Back to Cart
        </button>
      </div>

      {showTableModal && (
        <TableModal
          onClose={() => setShowTableModal(false)}
          onSuccess={() => setShowTableModal(false)}
        />
      )}
    </div>
  );
}