import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getCashierOrders } from "../../../services/cashierApi";
import styles from "./CashierDashboard.module.css";

export default function CashierDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await getCashierOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Status flow:
  // placed/pending  = waiting for cashier to confirm payment
  // paid            = cashier confirmed, kitchen queue
  // preparing       = kitchen working
  // ready           = food ready, waiter serves
  // cancelled       = cancelled

  const newOrders   = orders.filter(o =>
    ["placed", "pending", "payment_pending"].includes(o.status)
  );
  const inKitchen   = orders.filter(o =>
    ["paid", "preparing"].includes(o.status)
  );
  const readyOrders = orders.filter(o => o.status === "ready");

  // Revenue = sum of all orders where cashier confirmed payment (status=paid, preparing, or ready)
  // These all went through the cashier confirmation step
  const paidOrders = orders.filter(o =>
    ["paid", "preparing", "ready"].includes(o.status)
  );
  const totalRevenue = paidOrders.reduce(
    (sum, o) => sum + Number(o.total_amount), 0
  );

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  function getStatusLabel(status) {
    switch (status) {
      case "placed":
      case "pending":         return "Awaiting Payment";
      case "payment_pending": return "Awaiting Payment";
      case "paid":            return "Paid — In Queue";
      case "preparing":       return "Preparing";
      case "ready":           return "Ready";
      case "cancelled":       return "Cancelled";
      default:                return status;
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case "placed":
      case "pending":         return styles.pending;
      case "payment_pending": return styles.pending;
      case "paid":            return styles.waiting;
      case "preparing":       return styles.preparing;
      case "ready":           return styles.ready;
      case "cancelled":       return styles.cancelled;
      default:                return "";
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good morning, {user?.first_name || user?.username}!
          </h1>
          <p className={styles.sub}>Here's today's payment overview.</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* STAT CARDS */}
      <div className={styles.stats}>

        <div
          className={styles.statCard}
          onClick={() => navigate("/cashier/orders")}
        >
          <div className={styles.statIcon}>🧾</div>
          <div>
            <p className={styles.statLabel}>Awaiting Payment</p>
            <h2 className={styles.statValue}>{newOrders.length}</h2>
            <p className={styles.statSub}>New orders to collect</p>
          </div>
          {newOrders.length > 0 && <span className={styles.dotBlue} />}
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/cashier/orders")}
        >
          <div className={styles.statIcon}>🍳</div>
          <div>
            <p className={styles.statLabel}>In Kitchen</p>
            <h2 className={styles.statValue}>{inKitchen.length}</h2>
            <p className={styles.statSub}>Paid & being prepared</p>
          </div>
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/cashier/orders")}
        >
          <div className={styles.statIcon}>✅</div>
          <div>
            <p className={styles.statLabel}>Ready to Serve</p>
            <h2 className={styles.statValue}>{readyOrders.length}</h2>
            <p className={styles.statSub}>Waiting for waiter</p>
          </div>
          {readyOrders.length > 0 && <span className={styles.dotGreen} />}
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div>
            <p className={styles.statLabel}>Total Revenue</p>
            <h2 className={styles.statValueSmall}>
              ₱{totalRevenue.toFixed(2)}
            </h2>
            <p className={styles.statSub}>
              {paidOrders.length} paid order{paidOrders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

      </div>

      {/* BOTTOM GRID */}
      <div className={styles.grid}>

        {/* AWAITING PAYMENT */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Awaiting Payment
            <span className={styles.badgeBlue}>{newOrders.length}</span>
          </h3>
          <div className={styles.orderList}>
            {newOrders.slice(0, 5).map(order => (
              <div
                key={order.id}
                className={styles.orderItem}
                onClick={() => navigate("/cashier/orders")}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.orderLeft}>
                  <p className={styles.orderNumber}>
                    #{order.receipt_number?.slice(-6)}
                  </p>
                  <p className={styles.orderNote}>
                    {order.notes?.replace("Table: ", "Table ") || "—"}
                  </p>
                </div>
                <div className={styles.orderRight}>
                  <p className={styles.orderTotal}>
                    ₱{Number(order.total_amount).toFixed(2)}
                  </p>
                  <button className={styles.actionBtn}>
                    Collect
                  </button>
                </div>
              </div>
            ))}
            {newOrders.length === 0 && (
              <p className={styles.empty}>No orders awaiting payment.</p>
            )}
          </div>
        </div>

        {/* IN KITCHEN */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            In Kitchen
            <span className={styles.badgeOrange}>{inKitchen.length}</span>
          </h3>
          <div className={styles.orderList}>
            {inKitchen.slice(0, 5).map(order => (
              <div key={order.id} className={styles.orderItem}>
                <div className={styles.orderLeft}>
                  <p className={styles.orderNumber}>
                    #{order.receipt_number?.slice(-6)}
                  </p>
                  <p className={styles.orderNote}>
                    {order.notes?.replace("Table: ", "Table ") || "—"}
                  </p>
                </div>
                <div className={styles.orderRight}>
                  <p className={styles.orderTotal}>
                    ₱{Number(order.total_amount).toFixed(2)}
                  </p>
                  <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
            {inKitchen.length === 0 && (
              <p className={styles.empty}>No orders in kitchen.</p>
            )}
          </div>
        </div>

        {/* READY */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Ready to Serve
            <span className={styles.badgeGreen}>{readyOrders.length}</span>
          </h3>
          <div className={styles.orderList}>
            {readyOrders.slice(0, 5).map(order => (
              <div key={order.id} className={styles.orderItem}>
                <div className={styles.orderLeft}>
                  <p className={styles.orderNumber}>
                    #{order.receipt_number?.slice(-6)}
                  </p>
                  <p className={styles.orderNote}>
                    {order.notes?.replace("Table: ", "Table ") || "—"}
                  </p>
                </div>
                <div className={styles.orderRight}>
                  <p className={styles.orderTotal}>
                    ₱{Number(order.total_amount).toFixed(2)}
                  </p>
                  <span className={styles.readyBadge}>Ready</span>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className={styles.empty}>No orders ready yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}