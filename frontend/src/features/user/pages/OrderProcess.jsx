import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { useTable } from "../../../context/TableContext";
import TableModal from "../../../components/TableModal";
import {
  createOrder,
  submitOrder,
  getOrder,
  getOrders,
} from "../../../services/orderApi";
import styles from "./OrderProcess.module.css";

// ─── Progress Circle ──────────────────────────────────────────────────────────
function ProgressCircle({ percent, status }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const color =
    status === "ready"            ? "#28a745" :
    status === "paid"             ? "#aaa"    :
    status === "preparing"        ? "#f59e0b" :
    status === "payment_pending"  ? "#4a6cf7" :
    status === "placed"           ? "#ff7a00" :
                                    "#888";

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
        {(status === "ready" || status === "paid") ? (
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

// ─── Status Config — pay-first flow ──────────────────────────────────────────
// Flow: placed → payment_pending → paid → preparing → ready
function getStatusConfig(order) {
  switch (order.status) {
    case "placed":
      return {
        label: "WAITING FOR PAYMENT",
        desc:  "Please proceed to the cashier to pay",
        percent: 20,
        color:  "#ff7a00",
        bg:     "#fff4ea",
        timeLabel: "Placed at",
        time: new Date(order.created_at).toLocaleTimeString("en-PH", {
          hour: "2-digit", minute: "2-digit",
        }),
      };
    case "payment_pending":
      return {
        label: "PAYMENT REQUESTED",
        desc:  "Cashier is processing your payment",
        percent: 40,
        color:  "#4a6cf7",
        bg:     "#eef2ff",
        timeLabel: "Requested at",
        time: new Date(order.updated_at).toLocaleTimeString("en-PH", {
          hour: "2-digit", minute: "2-digit",
        }),
      };
    case "paid":
      return {
        label: "PAID — BEING PREPARED",
        desc:  "Payment confirmed! Kitchen is now preparing your order",
        percent: 60,
        color:  "#28a745",
        bg:     "#e6f4ea",
        timeLabel: "Paid at",
        time: new Date(order.updated_at).toLocaleTimeString("en-PH", {
          hour: "2-digit", minute: "2-digit",
        }),
      };
    case "preparing":
      return {
        label: "PREPARING",
        desc:  "Your food is being prepared right now",
        percent: 75,
        color:  "#f59e0b",
        bg:     "#fff8e1",
        timeLabel: "Started at",
        time: new Date(order.updated_at).toLocaleTimeString("en-PH", {
          hour: "2-digit", minute: "2-digit",
        }),
      };
    case "ready":
      return {
        label: "READY!",
        desc:  "Your order is ready — waiter is on the way",
        percent: 100,
        color:  "#28a745",
        bg:     "#e6f4ea",
        timeLabel: "Ready at",
        time: new Date(order.updated_at).toLocaleTimeString("en-PH", {
          hour: "2-digit", minute: "2-digit",
        }),
      };
    case "cancelled":
      return {
        label: "CANCELLED",
        desc:  "This order was cancelled",
        percent: 0,
        color:  "#e53e3e",
        bg:     "#fce8e8",
        timeLabel: "Cancelled at",
        time: new Date(order.updated_at).toLocaleTimeString("en-PH", {
          hour: "2-digit", minute: "2-digit",
        }),
      };
    default:
      return {
        label: "PENDING",
        desc:  "Your order is being processed",
        percent: 10,
        color:  "#888",
        bg:     "#f5f5f5",
        timeLabel: "Placed at",
        time: "—",
      };
  }
}

// ─── Status Steps ─────────────────────────────────────────────────────────────
const STEPS = [
  { key: "placed",          label: "Placed"    },
  { key: "payment_pending", label: "Payment"   },
  { key: "paid",            label: "Confirmed" },
  { key: "preparing",       label: "Preparing" },
  { key: "ready",           label: "Ready"     },
];

function StatusSteps({ currentStatus }) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className={styles.stepsRow}>
      {STEPS.map((step, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className={styles.stepItem}>
            {i > 0 && (
              <div className={`${styles.stepLine} ${done || active ? styles.stepLineDone : ""}`} />
            )}
            <div
              className={`${styles.stepDot} ${
                done   ? styles.stepDone   :
                active ? styles.stepActive :
                         styles.stepPending
              }`}
            >
              {done ? "✓" : i + 1}
            </div>
            <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ""}`}>
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
  const config = getStatusConfig(order);
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
            background: order.status === "paid" || order.status === "ready"
              ? "#e6f4ea" : "#f0f0f0",
            color: order.status === "paid" || order.status === "ready"
              ? "#28a745" : "#888",
          }}
        >
          {order.status === "paid" || order.status === "ready" ? "PAID" : "UNPAID"}
        </span>
      </div>

      <button className={styles.closeReceiptBtn} onClick={onClose}>
        Close
      </button>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onViewReceipt }) {
  const config = getStatusConfig(order);
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

      <ProgressCircle percent={config.percent} status={order.status} />

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

      <button
        className={styles.viewReceiptBtn}
        onClick={() => onViewReceipt(order)}
      >
        View Receipt →
      </button>
    </div>
  );
}

// ─── Order Tracker ────────────────────────────────────────────────────────────
function OrderTracker({ orderId }) {
  const [activeOrders,    setActiveOrders]    = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [selectedOrder,   setSelectedOrder]   = useState(null);
  const [activeTab,       setActiveTab]       = useState("active");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, [orderId]);

  async function fetchOrders() {
    try {
      const token    = localStorage.getItem("token");
      const guestKey = localStorage.getItem("guest_key");

      let allOrders = [];

      if (token) {
        const res = await getOrders();
        allOrders = res.data;
      } else if (guestKey) {
        // Guest: fetch tracked order IDs from localStorage
        const guestOrderIds = JSON.parse(
          localStorage.getItem("guest_orders") || "[]"
        );
        const lastId = localStorage.getItem("last_order_id");
        const ids = [...new Set([lastId, ...guestOrderIds].filter(Boolean))];
        const results = await Promise.all(
          ids.map(id =>
            getOrder(id).then(r => r.data).catch(() => null)
          )
        );
        allOrders = results.filter(Boolean);
      }

      // Pay-first flow statuses:
      // Active  = placed, payment_pending, paid, preparing, ready
      // Done    = cancelled (show last 10)
      // Note: "ready" stays in active so user sees it — they can move to history manually
      const active = allOrders.filter(o =>
        ["placed", "payment_pending", "paid", "preparing", "ready"].includes(o.status)
      );
      const done = allOrders.filter(o =>
        ["cancelled"].includes(o.status)
      );

      setActiveOrders(active);
      setCompletedOrders(done);

      // If a specific orderId was passed in URL, select it
      if (orderId && active.length > 0) {
        const target = active.find(o => String(o.id) === String(orderId));
        if (target && !selectedOrder) setSelectedOrder(target);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className={styles.loading}>Loading your orders...</div>
  );

  const displayOrders =
    activeTab === "active" ? activeOrders : completedOrders;

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
            <p className={styles.notifSub}>
              This page auto-refreshes every 8 seconds
            </p>
          </div>
        </div>
      )}

      {/* STATUS STEPS for first active order */}
      {activeOrders[0] && (
        <div className={styles.stepsCard}>
          <p className={styles.stepsLabel}>
            Order #{activeOrders[0].receipt_number?.slice(-6)} — Current Step
          </p>
          <StatusSteps currentStatus={activeOrders[0].status} />
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
          Cancelled
          {completedOrders.length > 0 && (
            <span className={styles.tabCount}>{completedOrders.length}</span>
          )}
        </button>
      </div>

      {displayOrders.length === 0 ? (
        <div className={styles.noOrders}>
          <p>
            {activeTab === "active"
              ? "🎉 No active orders. Ready to order again?"
              : "No cancelled orders."}
          </p>
          {activeTab === "active" && (
            <button
              className={styles.orderAgainBtn}
              onClick={() => navigate("/menu")}
            >
              Go to Menu
            </button>
          )}
        </div>
      ) : (
        <div className={styles.trackerLayout}>
          <div
            className={`${styles.orderList} ${
              selectedOrder ? styles.orderListNarrow : ""
            }`}
          >
            {displayOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onViewReceipt={setSelectedOrder}
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

  // Guard: if confirming but no table, send back to cart
  useEffect(() => {
    if (isConfirming && !table) {
      navigate("/cart");
    }
  }, [isConfirming, table]);

  async function handleConfirmOrder() {
    if (!table) { setShowTableModal(true); return; }
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

      // Track guest orders
      if (!user) {
        const stored = JSON.parse(
          localStorage.getItem("guest_orders") || "[]"
        );
        if (!stored.includes(String(newOrder.id))) {
          stored.push(String(newOrder.id));
          localStorage.setItem("guest_orders", JSON.stringify(stored));
        }
      }

      localStorage.setItem("last_order_id", String(newOrder.id));
      clearCart();
      navigate(`/order/process/${newOrder.id}`);
    } catch (err) {
      console.error(err.response?.data);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        Object.values(err.response?.data || {})[0]?.[0] ||
        "Failed to place order. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  // ── Tracker view ──
  if (!isConfirming) return <OrderTracker orderId={id} />;

  // ── Confirm view ──
  return (
    <div className={styles.confirmPage}>
      <div className={styles.confirmCard}>

        <h2 className={styles.confirmTitle}>Review & Confirm</h2>

        {/* Table */}
        {table ? (
          <div className={styles.confirmTableBadge}>
            🪑 Table <strong>{table.identifier}</strong>
            <button
              className={styles.changeTableBtn}
              onClick={() => setShowTableModal(true)}
            >
              Change
            </button>
          </div>
        ) : (
          <div className={styles.confirmTableMissing}>
            ⚠️ No table selected
          </div>
        )}

        {/* User */}
        <p className={styles.confirmUser}>
          {user
            ? <>👤 Ordering as <strong>{user.username}</strong></>
            : <span style={{ color: "#888" }}>👤 Guest order</span>
          }
        </p>

        {/* Pay-first notice */}
        <div className={styles.payNotice}>
          💳 You will need to pay at the cashier before the kitchen starts preparing.
        </div>

        {/* Items */}
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
            <strong className={styles.confirmTotalValue}>
              ₱{total.toFixed(2)}
            </strong>
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

        <button
          className={styles.backBtn}
          onClick={() => navigate("/cart")}
        >
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