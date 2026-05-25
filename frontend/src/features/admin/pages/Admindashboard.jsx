import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../../../services/adminApi";
import styles from "./AdminDashboard.module.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("daily");

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await getDashboard(range);
      setData(res.data);
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

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.sub}>Overview of your restaurant performance</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.date}>{today}</span>
          <div className={styles.rangeTabs}>
            {["daily", "weekly", "monthly", "annual"].map(r => (
              <button
                key={r}
                className={range === r ? styles.rangeActive : styles.rangeBtn}
                onClick={() => setRange(r)}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div>
            <p className={styles.statLabel}>Revenue</p>
            <h2 className={styles.statValue}>
              ₱{Number(data?.revenue || 0).toFixed(2)}
            </h2>
            <p className={styles.statSub}>From paid orders</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🧾</div>
          <div>
            <p className={styles.statLabel}>Total Orders</p>
            <h2 className={styles.statValue}>{data?.order_count || 0}</h2>
            <p className={styles.statSub}>
              {data?.paid_order_count || 0} paid
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🪑</div>
          <div>
            <p className={styles.statLabel}>Active Tables</p>
            <h2 className={styles.statValue}>
              {data?.table_statuses?.find(t => t.status === "occupied")?.count || 0}
            </h2>
            <p className={styles.statSub}>Currently occupied</p>
          </div>
        </div>

        <div
          className={styles.statCard}
          onClick={() => navigate("/admin/stock")}
          style={{ cursor: "pointer" }}
        >
          <div className={styles.statIcon}>⚠️</div>
          <div>
            <p className={styles.statLabel}>Low Stock</p>
            <h2 className={styles.statValue}>
              {data?.low_stock_ingredients?.length || 0}
            </h2>
            <p className={styles.statSub}>Ingredients to restock</p>
          </div>
          {data?.low_stock_ingredients?.length > 0 && (
            <span className={styles.dotRed} />
          )}
        </div>
      </div>

      {/* GRID */}
      <div className={styles.grid}>

        {/* TOP ITEMS */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Top Selling Items</h3>
          {data?.top_items?.length > 0 ? (
            <div className={styles.topList}>
              {data.top_items.map((item, i) => (
                <div key={i} className={styles.topItem}>
                  <div className={styles.topLeft}>
                    <span className={styles.topRank}>#{i + 1}</span>
                    <span className={styles.topName}>{item.item_name}</span>
                  </div>
                  <span className={styles.topQty}>{item.quantity} sold</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No sales data yet.</p>
          )}
        </div>

        {/* TABLE STATUS */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Table Status</h3>
          <div className={styles.tableStatus}>
            {data?.table_statuses?.map(t => (
              <div key={t.status} className={styles.tableStatusRow}>
                <div className={styles.tableStatusLeft}>
                  <span
                    className={styles.tableStatusDot}
                    style={{
                      background:
                        t.status === "occupied" ? "#ff7a00" :
                        t.status === "vacant" ? "#28a745" : "#4a6cf7"
                    }}
                  />
                  <span className={styles.tableStatusLabel}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </div>
                <span className={styles.tableStatusCount}>{t.count}</span>
              </div>
            ))}
            {!data?.table_statuses?.length && (
              <p className={styles.empty}>No table data.</p>
            )}
          </div>

          <hr className={styles.divider} />

          <div className={styles.staffPages}>
            <p className={styles.staffPagesLabel}>Open Staff Page Requests</p>
            <h3 className={styles.staffPagesValue}>
              {data?.open_staff_pages || 0}
            </h3>
          </div>
        </div>

        {/* LOW STOCK */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Low Stock Ingredients</h3>
          {data?.low_stock_ingredients?.length > 0 ? (
            <div className={styles.stockList}>
              {data.low_stock_ingredients.map((ing, i) => (
                <div key={i} className={styles.stockItem}>
                  <div className={styles.stockLeft}>
                    <p className={styles.stockName}>{ing.name}</p>
                    <p className={styles.stockReorder}>
                      Min: {ing.reorder_level}
                    </p>
                  </div>
                  <span className={styles.stockQty}>
                    {ing.available_quantity} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>All stock levels are good. ✅</p>
          )}
          <button
            className={styles.viewStockBtn}
            onClick={() => navigate("/admin/stock")}
          >
            Manage Stock →
          </button>
        </div>

      </div>
    </div>
  );
}