import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { useTable } from "../../../context/TableContext";
import TableModal from "../../../components/TableModal";
import { createOrder, submitOrder, getOrder, getOrders } from "../../../services/orderApi";
import styles from "./OrderProcess.module.css";

// ─── Progress Circle ──────────────────────────────────────────────────────────
function ProgressCircle({ percent, status }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const color =
    status === "ready"           ? "#ff7a00" :
    status === "paid"            ? "#aaa"    :
    status === "preparing"       ? "#f59e0b" :
    status === "payment_pending" ? "#4a6cf7" :
                                   "#28a745";

  return (
    <div className={styles.circleWrapper}>
      <svg width="130" height="130" viewBox="0 0 130 130">
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
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        {status === "ready" || status === "paid" ? (
          <text x="65" y="70" textAnchor="middle" fontSize="28" fill={color}>✓</text>
        ) : (
          <text x="65" y="72" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>
            {percent}%
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── Status Config ────────────────────────────────────────────────────────────
function getStatusConfig(order) {
  const status = order.status;

  if (status === "draft") return {
    label: "PENDING",
    desc: "Your order is being processed",
    percent: 10,
    color: "#888",
    bg: "#f5f5f5",
    timeLabel: "Submitted at",
    time: new Date(order.created_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
  };
  if (status === "placed") return {
    label: "ORDER RECEIVED",
    desc: "Your order has been received by the kitchen",
    percent: 30,
    color: "#28a745",
    bg: "#e6f4ea",
    timeLabel: "Received at",
    time: new Date(order.updated_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
  };
  if (status === "preparing") return {
    label: "PREPARING",
    desc: "Your food is being prepared",
    percent: 60,
    color: "#f59e0b",
    bg: "#fff8e1",
    timeLabel: "Started at",
    time: new Date(order.updated_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
  };
  if (status === "ready") return {
    label: "READY",
    desc: "Your order is ready to be served!",
    percent: 100,
    color: "#ff7a00",
    bg: "#fff4ea",
    timeLabel: "Ready at",
    time: new Date(order.updated_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
  };
  if (status === "payment_pending") return {
    label: "PAYMENT",
    desc: "Please proceed to payment",
    percent: 100,
    color: "#4a6cf7",
    bg: "#eef2ff",
    timeLabel: "Billed at",
    time: new Date(order.updated_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
  };
  if (status === "paid") return {
    label: "COMPLETED",
    desc: "Thank you for dining with us!",
    percent: 100,
    color: "#aaa",
    bg: "#f5f5f5",
    timeLabel: "Paid at",
    time: new Date(order.updated_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
  };
  return {
    label: "PENDING",
    desc: "Your order is being processed",
    percent: 10,
    color: "#888",
    bg: "#f5f5f5",
    timeLabel: "Estimated",
    time: "—",
  };
}

// ─── Status Steps ─────────────────────────────────────────────────────────────
const STATUS_STEPS = ["placed", "preparing", "ready", "payment_pending", "paid"];

function StatusSteps({ currentStatus }) {
  const stepLabels = {
    placed: "Received",
    preparing: "Preparing",
    ready: "Ready",
    payment_pending: "Payment",
    paid: "Done",
  };

  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className={styles.stepsRow}>
      {STATUS_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className={styles.stepItem}>
            <div className={`${styles.stepDot} ${done ? styles.stepDone : active ? styles.stepActive : styles.stepPending}`}>
              {done ? "✓" : i + 1}
            </div>
            <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ""}`}>
              {stepLabels[step]}
            </span>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ""}`} />
            )}
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

      <div className={styles.receiptOrder}>
        <div>
          <p className={styles.receiptOrderId}>
            Order #{order.receipt_number?.slice(-6)}
          </p>
          <p className={styles.receiptMeta}>
            📅{" "}
            {new Date(order.created_at).toLocaleDateString("en-PH", {
              month: "long", day: "numeric", year: "numeric",
            })}{" "}
            •{" "}
            {new Date(order.created_at).toLocaleTimeString("en-PH", {
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

      <h4 className={styles.receiptItemsTitle}>Items</h4>
      <div className={styles.receiptItems}>
        {order.items?.map((item) => (
          <div key={item.id} className={styles.receiptItem}>
            <div className={styles.receiptItemImg} />
            <div className={styles.receiptItemInfo}>
              <p className={styles.receiptItemName}>{item.item_name}</p>
              <p className={styles.receiptItemQty}>x{item.quantity}</p>
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

      <div className={styles.receiptPayment}>
        <span className={styles.receiptPaymentLabel}>Payment Status:</span>
        <span
          className={`${styles.paymentBadge} ${
            order.status === "paid" ? styles.paid : styles.unpaid
          }`}
        >
          {order.status === "paid" ? "PAID" : "UNPAID"}
        </span>
      </div>

      <div className={styles.receiptActions}>
        <button className={styles.closeReceiptBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onViewReceipt }) {
  const config = getStatusConfig(order);

  return (
    <div className={styles.orderCard}>

      {/* LEFT */}
      <div className={styles.orderLeft}>
        <p className={styles.orderNumber}>
          Order #{order.receipt_number?.slice(-6)}
        </p>
        <p className={styles.orderTable}>
          🪑{" "}
          {order.notes?.replace("Table: ", "") ||
            (order.table_session ? `Session #${order.table_session}` : "—")}
        </p>
        <p className={styles.orderTime}>
          📅{" "}
          {new Date(order.created_at).toLocaleDateString("en-PH", {
            month: "long", day: "numeric", year: "numeric",
          })}{" "}
          •{" "}
          {new Date(order.created_at).toLocaleTimeString("en-PH", {
            hour: "2-digit", minute: "2-digit",
          })}
        </p>
      </div>

      {/* STATUS */}
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

      {/* ITEMS */}
      <div className={styles.orderItems}>
        <p className={styles.itemsLabel}>Items: ({order.items?.length || 0})</p>
        {order.items?.slice(0, 4).map((item) => (
          <p key={item.id} className={styles.itemBullet}>
            • {item.item_name}
          </p>
        ))}
        {order.items?.length > 4 && (
          <p className={styles.itemBullet}>
            • +{order.items.length - 4} more
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  async function fetchOrders() {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        const res = await getOrders();
        const active = res.data.filter((o) =>
          ["placed", "preparing", "ready", "payment_pending"].includes(o.status)
        );
        setOrders(active);
      } else {
        const guestOrders = JSON.parse(
          localStorage.getItem("guest_orders") || "[]"
        );
        const lastOrderId = localStorage.getItem("last_order_id");
        const allIds = [
          ...new Set([lastOrderId, ...guestOrders].filter(Boolean)),
        ];
        const results = await Promise.all(
          allIds.map((id) =>
            getOrder(id)
              .then((r) => r.data)
              .catch(() => null)
          )
        );
        setOrders(
          results.filter(
            (o) =>
              o &&
              ["placed", "preparing", "ready", "payment_pending"].includes(
                o.status
              )
          )
        );
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className={styles.noOrders}>
        <p>🎉 No active orders found.</p>
        <p style={{ fontSize: "14px", color: "#aaa" }}>
          Your completed orders will appear in your order history.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.trackerPage}>

      {/* NOTIF BAR */}
      <div className={styles.notifBar}>
        <span className={styles.notifIcon}>🔔</span>
        <div>
          <p className={styles.notifTitle}>
            We'll notify you when your order is ready!
          </p>
          <p className={styles.notifSub}>
            You can relax, your food is on its way
          </p>
        </div>
      </div>

      {/* STATUS STEPS — show for first order */}
      {orders[0] && (
        <div className={styles.stepsCard}>
          <p className={styles.stepsOrderLabel}>
            Order #{orders[0].receipt_number?.slice(-6)}
          </p>
          <StatusSteps currentStatus={orders[0].status} />
        </div>
      )}

      <div className={styles.trackerLayout}>
        <div
          className={`${styles.orderList} ${
            selectedOrder ? styles.orderListNarrow : ""
          }`}
        >
          {orders.map((order) => (
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
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderProcess() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { table } = useTable();
  const navigate = useNavigate();
  const { id } = useParams();

  const [showTableModal, setShowTableModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If we have a cart and no id param → show confirmation screen
  const isConfirming = cart.length > 0 && !id;

  // If no table at all, redirect to cart
  useEffect(() => {
    if (isConfirming && !table) {
      navigate("/cart");
    }
  }, [isConfirming, table]);

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    if (!table) {
      setShowTableModal(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const items = cart.map((item) => ({
        menu_item: item.id,
        quantity: item.quantity,
      }));

      // createOrder now picks up session_id from localStorage automatically
      const orderRes = await createOrder({
        items,
        notes: `Table: ${table.identifier}`,
      });

      const newOrder = orderRes.data;
      await submitOrder(newOrder.id);

      // Track guest orders in localStorage
      if (!user) {
        const guestOrders = JSON.parse(
          localStorage.getItem("guest_orders") || "[]"
        );
        if (!guestOrders.includes(String(newOrder.id))) {
          guestOrders.push(String(newOrder.id));
          localStorage.setItem("guest_orders", JSON.stringify(guestOrders));
        }
      }

      localStorage.setItem("last_order_id", String(newOrder.id));
      clearCart();
      navigate(`/order/process/${newOrder.id}`);
    } catch (err) {
      console.error("Order error:", err.response?.data);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to place order. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  // ── Confirmation Screen ──
  if (isConfirming) {
    return (
      <div className={styles.confirmPage}>
        <div className={styles.confirmCard}>

          <h2 className={styles.confirmTitle}>Review & Confirm</h2>

          {/* Table info */}
          {table ? (
            <div className={styles.confirmTableBadge}>
              🪑 Table <strong>{table.identifier}</strong>
            </div>
          ) : (
            <div className={styles.confirmTableMissing}>
              No table selected
            </div>
          )}

          {/* User info */}
          <div className={styles.confirmUser}>
            {user ? (
              <span>👤 Ordering as <strong>{user.username}</strong></span>
            ) : (
              <span style={{ color: "#888" }}>👤 Ordering as guest</span>
            )}
          </div>

          {/* Order summary */}
          <div className={styles.confirmSummary}>
            <h3 className={styles.confirmSummaryTitle}>Order Summary</h3>
            {cart.map((item) => (
              <div key={item.id} className={styles.confirmItem}>
                <span className={styles.confirmItemName}>
                  {item.name}{" "}
                  <span className={styles.confirmItemQty}>×{item.quantity}</span>
                </span>
                <span className={styles.confirmItemPrice}>
                  ₱{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className={styles.confirmTotal}>
              <strong>Total</strong>
              <strong style={{ color: "#ff7a00" }}>₱{total.toFixed(2)}</strong>
            </div>
          </div>

          {error && <p className={styles.confirmError}>{error}</p>}

          <button
            className={styles.confirmBtn}
            onClick={handleConfirmOrder}
            disabled={loading || !table}
          >
            {loading ? "Placing order..." : "Confirm & Place Order"}
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
            onSuccess={() => {
              setShowTableModal(false);
              setTimeout(handleConfirmOrder, 100);
            }}
          />
        )}
      </div>
    );
  }

  // ── Tracker Screen ──
  return <OrderTracker orderId={id} />;
}