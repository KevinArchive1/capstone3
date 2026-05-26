import { useEffect, useState } from "react";
import { getKitchenOrders, markPreparing, markReady } from "../../../services/kitchenApi";
import styles from "./KitchenOrders.module.css";

export default function KitchenOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [processing, setProcessing] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await getKitchenOrders();
      // Backend filters: status__in=["waiting","ready"] AND station=kitchen
      // "waiting" = paid and in queue, kitchen_status=pending
      // "preparing" = kitchen started
      // "ready" = all stations done
      const kitchenOrders = res.data.filter(
        o => o.kitchen_status !== "not_required"
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

  // KEY: bucket by kitchen_status, NOT order.status
  // This handles mixed kitchen+bar orders correctly —
  // order.status stays "preparing" until both stations are done
  // but kitchen_status tells us exactly where THIS station is
  const queued    = orders.filter(o => o.kitchen_status === "pending");
  const preparing = orders.filter(o => o.kitchen_status === "preparing");
  const done      = orders.filter(o => o.kitchen_status === "ready");

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading orders...</div>;

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kitchen Orders</h1>
          <p className={styles.sub}>
            Only paid orders appear here
          </p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {errorMsg && (
        <div className={styles.errorBanner}>
          ⚠️ {errorMsg}
          <button className={styles.errorClose} onClick={() => setErrorMsg("")}>✕</button>
        </div>
      )}

      <div className={styles.kanban}>

        {/* QUEUE — kitchen_status=pending, order paid and waiting */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Queue</h3>
            <span className={`${styles.columnBadge} ${styles.pendingColor}`}>
              {queued.length}
            </span>
          </div>
          <div className={styles.cardList}>
            {queued.map(order => (
              <div key={order.id} className={`${styles.orderCard} ${styles.pendingCard}`}>
                <div className={styles.cardTop}>
                  <p className={styles.orderNumber}>
                    #{order.receipt_number?.slice(-6)}
                  </p>
                  <span className={`${styles.statusBadge} ${styles.pendingBadge}`}>
                    Queued
                  </span>
                </div>

                <p className={styles.tableNote}>
                  🪑 {order.notes?.replace("Table: ", "") || "—"}
                </p>

                <p className={styles.time}>
                  {new Date(order.created_at).toLocaleTimeString("en-PH", {
                    hour: "2-digit", minute: "2-digit",
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
                        <span className={styles.itemQty}>×{item.quantity}</span>
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
            {queued.length === 0 && (
              <div className={styles.emptyCol}>No orders in queue</div>
            )}
          </div>
        </div>

        {/* PREPARING — kitchen_status=preparing */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Preparing</h3>
            <span className={`${styles.columnBadge} ${styles.preparingColor}`}>
              {preparing.length}
            </span>
          </div>
          <div className={styles.cardList}>
            {preparing.map(order => (
              <div key={order.id} className={`${styles.orderCard} ${styles.preparingCard}`}>
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
                    hour: "2-digit", minute: "2-digit",
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
                        <span className={styles.itemQty}>×{item.quantity}</span>
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

        {/* DONE — kitchen_status=ready */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Done</h3>
            <span className={`${styles.columnBadge} ${styles.readyColor}`}>
              {done.length}
            </span>
          </div>
          <div className={styles.cardList}>
            {done.map(order => (
              <div key={order.id} className={`${styles.orderCard} ${styles.readyCard}`}>
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
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>

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
                        <span className={styles.itemQty}>×{item.quantity}</span>
                      </div>
                    ))}
                </div>

                <div className={styles.readyNote}>
                  ✅ Kitchen done — waiting for waiter
                </div>
              </div>
            ))}
            {done.length === 0 && (
              <div className={styles.emptyCol}>No completed items</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}