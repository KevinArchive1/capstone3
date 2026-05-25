import { useEffect, useState } from "react";
import { getCashierOrders, markPaymentPending, markPaid } from "../../../services/cashierApi";
import styles from "./CashierOrders_payFirst.module.css";

export default function CashierOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("new");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await getCashierOrders();
      setOrders(res.data);
      // Refresh selected order if open
      if (selectedOrder) {
        const updated = res.data.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaymentPending(order) {
    setProcessing(order.id);
    setErrorMsg("");
    try {
      await markPaymentPending(order.id);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to request payment. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleMarkPaid(order) {
    setProcessing(order.id);
    setErrorMsg("");
    try {
      await markPaid(order.id);
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to confirm payment. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  // PAY-FIRST FLOW:
  // placed        → cashier sees it, requests payment
  // payment_pending → customer pays, cashier confirms
  // paid          → kitchen gets notified and starts preparing
  // preparing     → kitchen working
  // ready         → food is ready, waiter serves

  const newOrders      = orders.filter(o => o.status === "placed");
  const pendingOrders  = orders.filter(o => o.status === "payment_pending");
  const paidOrders     = orders.filter(o => o.status === "paid");
  const inKitchen      = orders.filter(o => ["preparing", "ready"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "paid" &&
    ["ready", "not_required"].includes(o.kitchen_status));

  const tabConfig = [
    {
      key: "new",
      label: "New Orders",
      orders: newOrders,
      badgeColor: "#ff7a00",
      description: "New orders waiting for payment request",
    },
    {
      key: "payment_pending",
      label: "Awaiting Payment",
      orders: pendingOrders,
      badgeColor: "#4a6cf7",
      description: "Payment requested — waiting for customer to pay",
    },
    {
      key: "in_kitchen",
      label: "In Kitchen",
      orders: inKitchen,
      badgeColor: "#f59e0b",
      description: "Paid and being prepared",
    },
    {
      key: "history",
      label: "Done",
      orders: paidOrders.filter(o =>
        o.kitchen_status === "ready" || o.kitchen_status === "not_required"
      ),
      badgeColor: "#28a745",
      description: "Fully completed orders",
    },
  ];

  const activeTabConfig = tabConfig.find(t => t.key === activeTab);
  const displayOrders = activeTabConfig?.orders || [];

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  function getStatusStyle(status) {
    switch (status) {
      case "placed":          return { bg: "#fff4ea", color: "#ff7a00" };
      case "payment_pending": return { bg: "#eef2ff", color: "#4a6cf7" };
      case "paid":            return { bg: "#e6f4ea", color: "#28a745" };
      case "preparing":       return { bg: "#fff8e1", color: "#f59e0b" };
      case "ready":           return { bg: "#e6f4ea", color: "#28a745" };
      default:                return { bg: "#f0f0f0", color: "#888" };
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "placed":          return "New";
      case "payment_pending": return "Awaiting Payment";
      case "paid":            return "Paid";
      case "preparing":       return "In Kitchen";
      case "ready":           return "Ready";
      default:                return status;
    }
  }

  if (loading) return <div className={styles.loading}>Loading orders...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.sub}>Pay first — then kitchen prepares</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* FLOW GUIDE */}
      <div className={styles.flowGuide}>
        {[
          { icon: "🧾", label: "Order Placed",    active: newOrders.length > 0 },
          { icon: "💳", label: "Request Payment", active: false },
          { icon: "✅", label: "Payment Confirmed", active: false },
          { icon: "🍳", label: "Kitchen Prepares", active: false },
          { icon: "🍽️", label: "Ready to Serve",  active: false },
        ].map((step, i) => (
          <div key={i} className={styles.flowStep}>
            <div className={`${styles.flowDot} ${step.active ? styles.flowDotActive : ""}`}>
              {step.icon}
            </div>
            <span className={`${styles.flowLabel} ${step.active ? styles.flowLabelActive : ""}`}>
              {step.label}
            </span>
            {i < 4 && <div className={styles.flowArrow}>→</div>}
          </div>
        ))}
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className={styles.errorBanner}>
          ⚠️ {errorMsg}
          <button className={styles.errorClose} onClick={() => setErrorMsg("")}>✕</button>
        </div>
      )}

      <div className={styles.layout}>

        {/* LEFT */}
        <div className={styles.left}>

          {/* TABS */}
          <div className={styles.tabs}>
            {tabConfig.map(tab => (
              <button
                key={tab.key}
                className={activeTab === tab.key ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.orders.length > 0 && (
                  <span
                    className={styles.tabBadge}
                    style={
                      activeTab === tab.key
                        ? { background: "rgba(255,255,255,0.3)", color: "white" }
                        : { background: tab.badgeColor, color: "white" }
                    }
                  >
                    {tab.orders.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB DESCRIPTION */}
          <p className={styles.tabDesc}>{activeTabConfig?.description}</p>

          {/* ORDER LIST */}
          <div className={styles.orderList}>
            {displayOrders.length === 0 ? (
              <div className={styles.empty}>No orders here.</div>
            ) : (
              displayOrders.map(order => {
                const st = getStatusStyle(order.status);
                return (
                  <div
                    key={order.id}
                    className={`${styles.orderCard} ${
                      selectedOrder?.id === order.id ? styles.selectedCard : ""
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className={styles.cardTop}>
                      <p className={styles.orderNumber}>
                        #{order.receipt_number?.slice(-6)}
                      </p>
                      <span
                        className={styles.statusBadge}
                        style={{ background: st.bg, color: st.color }}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <p className={styles.tableNote}>
                      🪑 {order.notes?.replace("Table: ", "") || "—"}
                    </p>

                    <p className={styles.orderTime}>
                      {new Date(order.created_at).toLocaleTimeString("en-PH", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>

                    <div className={styles.cardBottom}>
                      <span className={styles.itemCount}>
                        {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                      </span>
                      <span className={styles.orderTotal}>
                        ₱{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT — DETAIL PANEL */}
        <div className={styles.right}>
          {selectedOrder ? (
            <div className={styles.detailPanel}>

              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>
                  Order #{selectedOrder.receipt_number?.slice(-6)}
                </h3>
                <span
                  className={styles.statusBadge}
                  style={{
                    background: getStatusStyle(selectedOrder.status).bg,
                    color: getStatusStyle(selectedOrder.status).color,
                  }}
                >
                  {getStatusLabel(selectedOrder.status)}
                </span>
              </div>

              <div className={styles.detailMeta}>
                <p>🪑 {selectedOrder.notes?.replace("Table: ", "") || "—"}</p>
                <p>
                  📅{" "}
                  {new Date(selectedOrder.created_at).toLocaleString("en-PH", {
                    month: "long", day: "numeric", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <p>👤 {selectedOrder.placed_by_name || "Guest"}</p>
              </div>

              <h4 className={styles.itemsTitle}>Items</h4>
              <div className={styles.itemsList}>
                {selectedOrder.items?.map(item => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.itemInfo}>
                      <p className={styles.itemName}>{item.item_name}</p>
                      <p className={styles.itemStation}>
                        {item.station === "kitchen" ? "🍳" : "🍹"} {item.station}
                      </p>
                    </div>
                    <div className={styles.itemRight}>
                      <span className={styles.itemQty}>x{item.quantity}</span>
                      <p className={styles.itemPrice}>
                        ₱{(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalAmount}>
                  ₱{Number(selectedOrder.total_amount).toFixed(2)}
                </span>
              </div>

              {/* ACTIONS based on status */}
              <div className={styles.actions}>

                {/* Step 1: New order → request payment */}
                {selectedOrder.status === "placed" && (
                  <div className={styles.actionBlock}>
                    <p className={styles.actionHint}>
                      Ask the customer to pay before the kitchen starts.
                    </p>
                    <button
                      className={styles.paymentPendingBtn}
                      onClick={() => handleMarkPaymentPending(selectedOrder)}
                      disabled={processing === selectedOrder.id}
                    >
                      {processing === selectedOrder.id
                        ? "Processing..."
                        : "💳 Request Payment"}
                    </button>
                  </div>
                )}

                {/* Step 2: Payment pending → confirm paid */}
                {selectedOrder.status === "payment_pending" && (
                  <div className={styles.actionBlock}>
                    <p className={styles.actionHint}>
                      Confirm payment received — this will send the order to the kitchen.
                    </p>
                    <button
                      className={styles.paidBtn}
                      onClick={() => handleMarkPaid(selectedOrder)}
                      disabled={processing === selectedOrder.id}
                    >
                      {processing === selectedOrder.id
                        ? "Confirming..."
                        : "✅ Confirm Payment Received"}
                    </button>
                  </div>
                )}

                {/* Paid — kitchen is working */}
                {selectedOrder.status === "paid" && (
                  <div className={styles.kitchenNote}>
                    ✅ Payment confirmed — order sent to kitchen.
                  </div>
                )}

                {/* In kitchen */}
                {selectedOrder.status === "preparing" && (
                  <div className={styles.inProgressNote}>
                    🍳 Kitchen is currently preparing this order.
                  </div>
                )}

                {/* Ready */}
                {selectedOrder.status === "ready" && (
                  <div className={styles.readyNote}>
                    🍽️ Order is ready — notify the waiter to serve.
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <p>👈 Select an order to view details and take action</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}