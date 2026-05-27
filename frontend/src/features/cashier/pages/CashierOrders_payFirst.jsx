import { useEffect, useState } from "react";
import {
  getCashierOrders,
  confirmPaymentAndSendToKitchen,
} from "../../../services/cashierApi";
import styles from "./CashierOrders_payFirst.module.css";

export default function CashierOrders() {
  const [orders,        setOrders]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [processing,    setProcessing]    = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab,     setActiveTab]     = useState("new");
  const [errorMsg,      setErrorMsg]      = useState("");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await getCashierOrders();
      setOrders(res.data);
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

  // Confirm payment → sets cashier_status=paid, order.status=paid
  // Kitchen then picks it up (kitchen filters by station=kitchen, any status)
  async function handleConfirmPayment(order) {
    setProcessing(order.id);
    setErrorMsg("");
    try {
      await confirmPaymentAndSendToKitchen(order.id);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      const data = err.response?.data || {};
      setErrorMsg(
        data.detail ||
        data.non_field_errors?.[0] ||
        data.status?.[0] ||
        "Failed to confirm payment."
      );
    } finally {
      setProcessing(null);
    }
  }

  async function handleMarkServed(order) {
    setProcessing(order.id);
    setErrorMsg("");
    try {
      await confirmPaymentAndSendToKitchen(order.id); // reuses cashier_update with paid
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      const data = err.response?.data || {};
      setErrorMsg(
        data.detail ||
        data.non_field_errors?.[0] ||
        data.status?.[0] ||
        "Failed to close order."
      );
    } finally {
      setProcessing(null);
    }
  }

  // Backend status flow (after cashier marks paid):
  // placed/pending  = order placed, waiting for cashier to confirm payment
  // paid            = cashier confirmed payment, kitchen sees it
  // preparing       = kitchen started (kitchen_status=preparing)
  // ready           = food ready, waiter serves (kitchen_status=ready)
  // cancelled       = cancelled

  const newOrders   = orders.filter(o =>
    ["placed", "pending", "payment_pending"].includes(o.status)
  );
  const inKitchen   = orders.filter(o =>
    o.status === "paid" && o.kitchen_status !== "ready" && o.kitchen_status !== "not_required"
  );
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const readyOrders = orders.filter(o => o.status === "ready");
  const doneOrders = orders.filter(o => o.status === "cancelled" || (o.status === "paid" && o.cashier_status === "paid"));

  const tabConfig = [
    {
      key:         "new",
      label:       "New Orders",
      orders:      newOrders,
      badgeColor:  "#4a6cf7",
      description: "New orders waiting for payment confirmation",
    },
    {
      key:         "in_kitchen",
      label:       "In Kitchen",
      orders:      [...inKitchen, ...preparingOrders],
      badgeColor:  "#f59e0b",
      description: "Paid and being prepared",
    },
    {
      key:         "ready",
      label:       "Ready",
      orders:      readyOrders,
      badgeColor:  "#28a745",
      description: "Ready to be served",
    },
    {
      key:         "done",
      label:       "Cancelled",
      orders:      doneOrders,
      badgeColor:  "#e53e3e",
      description: "Cancelled orders",
    },
  ];

  const activeTabConfig = tabConfig.find(t => t.key === activeTab);
  const displayOrders   = activeTabConfig?.orders || [];

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  function getStatusStyle(status) {
    switch (status) {
      case "placed":
      case "pending":
      case "payment_pending": return { bg: "#eef2ff", color: "#4a6cf7" };
      case "paid":            return { bg: "#e6f4ea", color: "#28a745" };
      case "preparing":       return { bg: "#fff8e1", color: "#f59e0b" };
      case "ready":           return { bg: "#e6f4ea", color: "#28a745" };
      case "cancelled":       return { bg: "#fce8e8", color: "#e53e3e" };
      default:                return { bg: "#f0f0f0", color: "#888"    };
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "placed":
      case "pending":         return "Awaiting Payment";
      case "payment_pending": return "Awaiting Payment";
      case "paid":            return "Paid — In Kitchen";
      case "preparing":       return "Preparing";
      case "ready":           return "Ready";
      case "cancelled":       return "Cancelled";
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
          <p className={styles.sub}>
            Confirm payment — kitchen prepares after payment
          </p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* FLOW GUIDE */}
      <div className={styles.flowGuide}>
        {[
          { icon: "🧾", label: "Order Placed",    active: newOrders.length > 0              },
          { icon: "💳", label: "Confirm Payment", active: false                             },
          { icon: "🍳", label: "Kitchen Prepares", active: inKitchen.length > 0 || preparingOrders.length > 0 },
          { icon: "🍽️", label: "Ready to Serve",  active: readyOrders.length > 0            },
        ].map((step, i) => (
          <div key={i} className={styles.flowStep}>
            <div className={`${styles.flowDot} ${step.active ? styles.flowDotActive : ""}`}>
              {step.icon}
            </div>
            <span className={`${styles.flowLabel} ${step.active ? styles.flowLabelActive : ""}`}>
              {step.label}
            </span>
            {i < 3 && <div className={styles.flowArrow}>→</div>}
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

        {/* LEFT — ORDER LIST */}
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
                        {order.items?.length} item
                        {order.items?.length !== 1 ? "s" : ""}
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
                    color:      getStatusStyle(selectedOrder.status).color,
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
                      <span className={styles.itemQty}>×{item.quantity}</span>
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

              {/* ACTIONS */}
              <div className={styles.actions}>

                {/* Awaiting payment → confirm → sends to kitchen */}
                {["placed", "pending", "payment_pending"].includes(selectedOrder.status) && (
                  <div className={styles.actionBlock}>
                    <p className={styles.actionHint}>
                      Collect payment from the customer, then confirm below.
                      The kitchen will start preparing immediately.
                    </p>
                    <button
                      className={styles.confirmPaymentBtn}
                      onClick={() => handleConfirmPayment(selectedOrder)}
                      disabled={processing === selectedOrder.id}
                    >
                      {processing === selectedOrder.id
                        ? "Processing..."
                        : "✅ Confirm Payment & Send to Kitchen"}
                    </button>
                  </div>
                )}

                {selectedOrder.status === "paid" && (
                  <div className={styles.kitchenNote}>
                    ✅ Payment confirmed — order is in the kitchen queue.
                  </div>
                )}

                {selectedOrder.status === "preparing" && (
                  <div className={styles.inProgressNote}>
                    🍳 Kitchen is currently preparing this order.
                  </div>
                )}

                {selectedOrder.status === "ready" && (
                  <div className={styles.actionBlock}>
                    <p className={styles.actionHint}>
                      Confirm the order has been delivered to the table, then close it out.
                    </p>
                    <button
                      className={styles.confirmPaymentBtn}
                      onClick={() => handleMarkServed(selectedOrder)}
                      disabled={processing === selectedOrder.id}
                    >
                      {processing === selectedOrder.id
                        ? "Processing..."
                        : "✅ Mark as Served & Close Order"}
                    </button>
                  </div>
                )}

                {selectedOrder.status === "cancelled" && (
                  <div className={styles.cancelledNote}>
                    ❌ This order was cancelled.
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