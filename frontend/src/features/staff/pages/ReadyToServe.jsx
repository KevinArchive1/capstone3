import { useEffect, useState } from "react";
import { getOrders } from "../../../services/staffApi";
import styles from "./ReadyToServe.module.css";

export default function ReadyToServe() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await getOrders();
      const ready = res.data.filter(o => o.status === "ready");
      setOrders(ready);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return (
    <div className={styles.loading}>Loading orders...</div>
  );

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ready to Serve</h1>
          <p className={styles.sub}>Ready to Served Orders</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* ORDERS */}
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p>🎉 No orders waiting to be served.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map(order => (
            <div key={order.id} className={styles.card}>

              {/* LEFT */}
              <div className={styles.cardLeft}>
                <p className={styles.orderId}>
                  Order #{order.receipt_number?.slice(-6)}
                </p>
                <p className={styles.table}>
                  🪑 {order.notes?.replace("Table: ", "") || "—"}
                </p>
                <p className={styles.time}>
                  {new Date(order.created_at).toLocaleTimeString("en-PH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* MIDDLE — items */}
              <div className={styles.cardMiddle}>
                <p className={styles.itemsLabel}>
                  Items: {order.items?.length || 0}
                </p>
                <div className={styles.itemsList}>
                  {order.items?.slice(0, 4).map(item => (
                    <span key={item.id} className={styles.itemChip}>
                      {item.item_name}
                    </span>
                  ))}
                  {order.items?.length > 4 && (
                    <span className={styles.itemChip}>
                      +{order.items.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className={styles.cardRight}>
                <span className={styles.readyBadge}>✅ READY</span>
                <p className={styles.total}>
                  ₱{Number(order.total_amount).toFixed(2)}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}