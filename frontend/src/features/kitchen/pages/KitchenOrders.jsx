import { useEffect, useState } from "react";
import { getKitchenOrders, markPreparing, markReady } from "../../../services/kitchenApi";
import styles from "./KitchenOrders.module.css";

export default function KitchenOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await getKitchenOrders();
      // Only show orders that have been PAID — pay-first flow
      // kitchen_status tells us this station's specific state
      const kitchenOrders = res.data.filter(o =>
        // order must be paid before kitchen starts
        ["paid", "preparing", "ready"].includes(o.status) &&
        // this order actually has kitchen items
        o.kitchen_status !== "not_required"
      );
      setOrders(kitchenOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPreparing(orderId) {
    setProcessing(orderId);
    setErrorMsg("");
    try {
      await markPreparing(orderId);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.status?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to start preparing. Please try again.";
      setErrorMsg(msg);
    } finally {
      setProcessing(null);
    }
  }

  async function handleMarkReady(orderId) {
    setProcessing(orderId);
    setErrorMsg("");
    try {
      await markReady(orderId);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.status?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to mark ready. Please try again.";
      setErrorMsg(msg);
    } finally {
      setProcessing(null);
    }
  }

  // KEY FIX: filter by kitchen_status, NOT order.status
  // This handles mixed orders (kitchen + bar) correctly.
  // If an order has bar items too, order.status stays "preparing" even after
  // kitchen marks ready — so we must use kitchen_status to bucket the cards.
  const pending   = orders.filter(o => o.kitchen_status === "pending");
  const preparing = orders.filter(o => o.kitchen_status === "preparing");
  const ready     = orders.filter(o => o.kitchen_status === "ready");

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading orders...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kitchen Orders</h1>
          <p className={styles.sub}>
            Manage paid orders assigned to the kitchen
          </p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className={styles.errorBanner}>
          ⚠️ {errorMsg}
          <button className={styles.errorClose} onClick={() => setErrorMsg("")}>✕</button>
        </div>
      )}

      {/* KANBAN */}
      <div className={styles.kanban}>

        {/* PENDING — kitchen_status === "pending", order is paid */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Queue</h3>
            <span className={`${styles.columnBadge} ${styles.pendingColor}`}>
              {pending.length}
            </span>
          </div>
          <div className={styles.cardList}>
            {pending.map(order => (
              <div
                key={order.id}
                className={`${styles.orderCard} ${styles.pendingCard}`}
              >
                <div className={styles.cardTop}>
                  <p className={styles.orderNumber}>
                    #{order.receipt_number?.slice(-6)}
                  </p>
                  <span className={`${styles.statusBadge} ${styles.pendingBadge}`}>
                    Queue
                  </span>
                </div>

                <p className={styles.tableNote}>
                  🪑 {order.notes?.replace("Table: ", "") || "—"}
                </p>

                <p className={styles.time}>
                  {new Date(order.created_at).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Show bar status if this is a mixed order */}
                {order.bar_status && order.bar_status !== "not_required" && (
                  <div className={styles.mixedBadge}>
                    🍹 Bar: {order.bar_status.replace("_", " ")}
                  </div>
                )}

                <div className={styles.itemsList}>
                  {order.items
                    ?.filter(item => item.station === "kitchen")
                    .map(item => (
                      <div key={item.id} className={styles.itemRow}>
                        <span className={styles.itemName}>{item.item_name}</span>
                        <span className={styles.itemQty}>x{item.quantity}</span>
                      </div>
                    ))}
                </div>

                <button
                  className={styles.prepareBtn}
                  onClick={() => handleMarkPreparing(order.id)}
                  disabled={processing === order.id}
                >
                  {processing === order.id ? "Starting..." : "Start Preparing"}
                </button>
              </div>
            ))}
            {pending.length === 0 && (
              <div className={styles.emptyCol}>No orders in queue</div>
            )}
          </div>
        </div>

        {/* PREPARING — kitchen_status === "preparing" */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Preparing</h3>
            <span className={`${styles.columnBadge} ${styles.preparingColor}`}>
              {preparing.length}
            </span>
          </div>
          <div className={styles.cardList}>
            {preparing.map(order => (
              <div
                key={order.id}
                className={`${styles.orderCard} ${styles.preparingCard}`}
              >
                <div className={styles.cardTop}>
                  <p className={styles.orderNumber}>
                    #{order.receipt_number?.slice(-6)}
                  </p>
                  <span className={`${styles.statusBadge} ${styles.preparingBadge}`}>
                    Cooking
                  </span>
                </div>

                <p className={styles.tableNote}>
                  🪑 {order.notes?.replace("Table: ", "") || "—"}
                </p>

                <p className={styles.time}>
                  {new Date(order.created_at).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {order.bar_status && order.bar_status !== "not_required" && (
                  <div className={styles.mixedBadge}>
                    🍹 Bar: {order.bar_status.replace("_", " ")}
                  </div>
                )}

                <div className={styles.itemsList}>
                  {order.items
                    ?.filter(item => item.station === "kitchen")
                    .map(item => (
                      <div key={item.id} className={styles.itemRow}>
                        <span className={styles.itemName}>{item.item_name}</span>
                        <span className={styles.itemQty}>x{item.quantity}</span>
                      </div>
                    ))}
                </div>

                <button
                  className={styles.readyBtn}
                  onClick={() => handleMarkReady(order.id)}
                  disabled={processing === order.id}
                >
                  {processing === order.id ? "Updating..." : "Mark as Done"}
                </button>
              </div>
            ))}
            {preparing.length === 0 && (
              <div className={styles.emptyCol}>Nothing being prepared</div>
            )}
          </div>
        </div>

        {/* READY — kitchen_status === "ready" */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Done</h3>
            <span className={`${styles.columnBadge} ${styles.readyColor}`}>
              {ready.length}
            </span>
          </div>
          <div className={styles.cardList}>
            {ready.map(order => (
              <div
                key={order.id}
                className={`${styles.orderCard} ${styles.readyCard}`}
              >
                <div className={styles.cardTop}>
                  <p className={styles.orderNumber}>
                    #{order.receipt_number?.slice(-6)}
                  </p>
                  <span className={`${styles.statusBadge} ${styles.readyBadge}`}>
                    Done ✓
                  </span>
                </div>

                <p className={styles.tableNote}>
                  🪑 {order.notes?.replace("Table: ", "") || "—"}
                </p>

                <p className={styles.time}>
                  {new Date(order.created_at).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {/* Show if waiting for bar to finish too */}
                {order.bar_status &&
                  order.bar_status !== "not_required" &&
                  order.bar_status !== "ready" && (
                    <div className={styles.waitingBarBadge}>
                      ⏳ Waiting for bar ({order.bar_status.replace("_", " ")})
                    </div>
                  )}

                <div className={styles.itemsList}>
                  {order.items
                    ?.filter(item => item.station === "kitchen")
                    .map(item => (
                      <div key={item.id} className={styles.itemRow}>
                        <span className={styles.itemName}>{item.item_name}</span>
                        <span className={styles.itemQty}>x{item.quantity}</span>
                      </div>
                    ))}
                </div>

                <div className={styles.readyNote}>
                  ✅ Kitchen done — waiting for waiter
                </div>
              </div>
            ))}
            {ready.length === 0 && (
              <div className={styles.emptyCol}>No completed items</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}