import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getCashierOrders } from "../../../services/cashierApi";
import styles from "./CashierDashboard.module.css";

export default function CashierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
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

  // Full pipeline counts
  const incomingOrders     = orders.filter(o => ["placed", "preparing"].includes(o.status));
  const readyOrders        = orders.filter(o => o.status === "ready");
  const paymentPendingOrders = orders.filter(o => o.status === "payment_pending");
  const paidOrders         = orders.filter(o => o.status === "paid");
  const totalRevenue       = paidOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  function getStatusLabel(status) {
    switch (status) {
      case "placed":          return "Received";
      case "preparing":       return "Preparing";
      case "ready":           return "Ready";
      case "payment_pending": return "Payment Pending";
      case "paid":            return "Paid";
      default:                return status;
    }
  }

  function getStatusStyle(status) {
    switch (status) {
      case "placed":          return styles.placed;
      case "preparing":       return styles.preparing;
      case "ready":           return styles.ready;
      case "payment_pending": return styles.paymentpending;
      case "paid":            return styles.paid;
      default:                return "";
    }
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good morning, {user?.first_name || user?.username}!
          </h1>
          <p className={styles.sub}>Here's today's payment overview.</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* STAT CARDS — full pipeline */}
      <div className={styles.stats}>

        <div
          className={styles.statCard}
          onClick={() => navigate("/cashier/orders")}
        >
          <div className={styles.statIcon}>🍳</div>
          <div>
            <p className={styles.statLabel}>Incoming</p>
            <h2 className={styles.statValue}>{incomingOrders.length}</h2>
            <p className={styles.statSub}>Placed & being prepared</p>
          </div>
          {incomingOrders.length > 0 && <span className={styles.dotOrange} />}
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/cashier/orders")}
        >
          <div className={styles.statIcon}>✅</div>
          <div>
            <p className={styles.statLabel}>Ready to Pay</p>
            <h2 className={styles.statValue}>{readyOrders.length}</h2>
            <p className={styles.statSub}>Waiting for cashier</p>
          </div>
          {readyOrders.length > 0 && <span className={styles.dotGreen} />}
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/cashier/orders")}
        >
          <div className={styles.statIcon}>💳</div>
          <div>
            <p className={styles.statLabel}>Payment Pending</p>
            <h2 className={styles.statValue}>{paymentPendingOrders.length}</h2>
            <p className={styles.statSub}>Processing payment</p>
          </div>
          {paymentPendingOrders.length > 0 && <span className={styles.dotBlue} />}
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/cashier/history")}
        >
          <div className={styles.statIcon}>💰</div>
          <div>
            <p className={styles.statLabel}>Total Revenue</p>
            <h2 className={styles.statValueSmall}>
              ₱{totalRevenue.toFixed(2)}
            </h2>
            <p className={styles.statSub}>{paidOrders.length} paid today</p>
          </div>
        </div>

      </div>

      {/* BOTTOM GRID */}
      <div className={styles.grid}>

        {/* PIPELINE OVERVIEW */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Active Orders Pipeline
            <span className={styles.badgeOrange}>
              {incomingOrders.length + readyOrders.length + paymentPendingOrders.length}
            </span>
          </h3>
          <div className={styles.orderList}>
            {[...incomingOrders, ...readyOrders, ...paymentPendingOrders]
              .slice(0, 6)
              .map(order => (
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
                    <span className={`${styles.statusBadge} ${getStatusStyle(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            {incomingOrders.length + readyOrders.length + paymentPendingOrders.length === 0 && (
              <p className={styles.empty}>No active orders.</p>
            )}
          </div>
        </div>

        {/* READY TO PAY */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Ready to Pay
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
                  <button
                    className={styles.actionBtn}
                    onClick={() => navigate("/cashier/orders")}
                  >
                    Process
                  </button>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className={styles.empty}>No orders ready for payment.</p>
            )}
          </div>
        </div>

        {/* RECENTLY PAID */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Recently Paid
            <span className={styles.badgeGreen}>{paidOrders.length}</span>
          </h3>
          <div className={styles.orderList}>
            {paidOrders.slice(0, 5).map(order => (
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
                  <span className={styles.paidBadge}>Paid</span>
                </div>
              </div>
            ))}
            {paidOrders.length === 0 && (
              <p className={styles.empty}>No paid orders yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}