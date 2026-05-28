import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getBarOrders, getIngredients } from "../../../services/barApi";
import styles from "./BarDashboard.module.css";

export default function BarDashboard() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [orders,      setOrders]      = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    try {
      const [orderRes, ingRes] = await Promise.all([
        getBarOrders(),
        getIngredients(),
      ]);
      const barOrders = orderRes.data.filter(
        o => o.bar_status !== "not_required"
      );
      setOrders(barOrders);
      setIngredients(ingRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const queuedOrders    = orders.filter(o => o.bar_status === "pending");
  const preparingOrders = orders.filter(o => o.bar_status === "preparing");
  const readyOrders     = orders.filter(o => o.bar_status === "ready");
  const lowStock        = ingredients.filter(
    i => parseFloat(i.available_quantity) <= parseFloat(i.reorder_level)
  );

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good morning, {user?.first_name || user?.username}!
          </h1>
          <p className={styles.sub}>Here's what's brewing today.</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* STAT CARDS */}
      <div className={styles.stats}>
        <div
          className={styles.statCard}
          onClick={() => navigate("/bar/orders")}
        >
          <div className={styles.statIcon}>🆕</div>
          <div>
            <p className={styles.statLabel}>In Queue</p>
            <h2 className={styles.statValue}>{queuedOrders.length}</h2>
            <p className={styles.statSub}>Paid — waiting to start</p>
          </div>
          {queuedOrders.length > 0 && <span className={styles.dot} />}
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/bar/orders")}
        >
          <div className={styles.statIcon}>🍹</div>
          <div>
            <p className={styles.statLabel}>Preparing</p>
            <h2 className={styles.statValue}>{preparingOrders.length}</h2>
            <p className={styles.statSub}>Currently being mixed</p>
          </div>
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/bar/orders")}
        >
          <div className={styles.statIcon}>✅</div>
          <div>
            <p className={styles.statLabel}>Done</p>
            <h2 className={styles.statValue}>{readyOrders.length}</h2>
            <p className={styles.statSub}>Waiting for waiter</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚠️</div>
          <div>
            <p className={styles.statLabel}>Low Stock</p>
            <h2 className={styles.statValue}>{lowStock.length}</h2>
            <p className={styles.statSub}>Ingredients to restock</p>
          </div>
          {lowStock.length > 0 && <span className={styles.dotRed} />}
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div className={styles.grid}>

        {/* QUEUED */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            In Queue
            <span className={styles.badge}>{queuedOrders.length}</span>
          </h3>
          <div className={styles.orderList}>
            {queuedOrders.slice(0, 5).map(order => (
              <div
                key={order.id}
                className={styles.orderItem}
                onClick={() => navigate("/bar/orders")}
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
                  <p className={styles.orderItems}>
                    {order.items?.filter(i => i.station === "bar").length} drink(s)
                  </p>
                  <span className={styles.pendingBadge}>Queued</span>
                </div>
              </div>
            ))}
            {queuedOrders.length === 0 && (
              <p className={styles.empty}>No drinks in queue.</p>
            )}
          </div>
        </div>

        {/* LOW STOCK */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Low Stock Alerts
            <span className={styles.badgeRed}>{lowStock.length}</span>
          </h3>
          <div className={styles.orderList}>
            {lowStock.slice(0, 6).map(ingredient => (
              <div key={ingredient.id} className={styles.stockItem}>
                <div className={styles.orderLeft}>
                  <p className={styles.orderNumber}>{ingredient.name}</p>
                  <p className={styles.orderNote}>{ingredient.unit}</p>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.stockQty}>
                    {ingredient.available_quantity} left
                  </span>
                  <span className={styles.reorderLevel}>
                    min: {ingredient.reorder_level}
                  </span>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && (
              <p className={styles.empty}>All stock levels are good.</p>
            )}
          </div>
        </div>

        {/* DONE */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Done — Awaiting Waiter
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
                  <span className={styles.readyBadge}>Ready</span>
                </div>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className={styles.empty}>No drinks done yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}