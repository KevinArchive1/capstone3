import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getKitchenOrders, getIngredients } from "../../../services/kitchenApi";
import styles from "./KitchenDashboard.module.css";

export default function KitchenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAll() {
    try {
      const [orderRes, ingredientRes] = await Promise.all([
        getKitchenOrders(),
        getIngredients(),
      ]);
      setOrders(orderRes.data);
      setIngredients(ingredientRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const pendingOrders = orders.filter(o => o.status === "placed");
  const preparingOrders = orders.filter(o => o.status === "preparing");
  const readyOrders = orders.filter(o => o.status === "ready");
  const lowStock = ingredients.filter(i => parseFloat(i.available_quantity) <= parseFloat(i.reorder_level));

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good morning, {user?.first_name || user?.username}!
          </h1>
          <p className={styles.sub}>
            Here's what's cooking today.
          </p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* STAT CARDS */}
      <div className={styles.stats}>
        <div className={styles.statCard} onClick={() => navigate("/kitchen/orders")}>
          <div className={styles.statIcon}>🆕</div>
          <div>
            <p className={styles.statLabel}>Pending</p>
            <h2 className={styles.statValue}>{pendingOrders.length}</h2>
            <p className={styles.statSub}>Waiting to be prepared</p>
          </div>
          {pendingOrders.length > 0 && <span className={styles.dot} />}
        </div>

        <div className={styles.statCard} onClick={() => navigate("/kitchen/orders")}>
          <div className={styles.statIcon}>👨‍🍳</div>
          <div>
            <p className={styles.statLabel}>Preparing</p>
            <h2 className={styles.statValue}>{preparingOrders.length}</h2>
            <p className={styles.statSub}>Currently being cooked</p>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => navigate("/kitchen/orders")}>
          <div className={styles.statIcon}>✅</div>
          <div>
            <p className={styles.statLabel}>Ready</p>
            <h2 className={styles.statValue}>{readyOrders.length}</h2>
            <p className={styles.statSub}>Waiting to be served</p>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => navigate("/kitchen/inventory")}>
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

        {/* PENDING ORDERS */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            Pending Orders
            <span className={styles.badge}>{pendingOrders.length}</span>
          </h3>
          <div className={styles.orderList}>
            {pendingOrders.slice(0, 5).map(order => (
              <div key={order.id} className={styles.orderItem}>
                <div className={styles.orderLeft}>
                  <p className={styles.orderNumber}>
                    #{order.receipt_number?.slice(-6)}
                  </p>
                  <p className={styles.orderNote}>
                    {order.notes || "—"}
                  </p>
                </div>
                <div className={styles.orderRight}>
                  <p className={styles.orderItems}>
                    {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                  </p>
                  <span className={styles.pendingBadge}>Pending</span>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <p className={styles.empty}>No pending orders.</p>
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

        {/* RECENT READY */}
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
                    {order.notes || "—"}
                  </p>
                </div>
                <div className={styles.orderRight}>
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