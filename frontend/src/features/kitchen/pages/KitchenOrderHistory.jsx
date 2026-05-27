import { useEffect, useState } from "react";
import API from "../../../services/api";
import styles from "./KitchenOrderHistory.module.css";

const PAGE_SIZE = 20;

export default function KitchenOrderHistory() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchOrders(1);
  }, []);

  async function fetchOrders(pageNum = 1) {
    pageNum === 1 ? setLoading(true) : setFetching(true);
    try {
      // Fetch only kitchen-relevant completed orders directly from backend
      const res = await API.get("/orders/", {
        params: {
          kitchen_status: "ready",
          page: pageNum,
          page_size: PAGE_SIZE,
        }
      });

      const data = Array.isArray(res.data) ? res.data : res.data.results || [];

      // Also include cancelled orders
      const cancelledRes = await API.get("/orders/", {
        params: {
          status: "cancelled",
          page: pageNum,
          page_size: PAGE_SIZE,
        }
      });

      const cancelledData = Array.isArray(cancelledRes.data)
        ? cancelledRes.data
        : cancelledRes.data.results || [];

      // Merge and deduplicate
      const merged = [...data, ...cancelledData].filter(
        (order, index, self) =>
          index === self.findIndex(o => o.id === order.id)
      );

      // Sort newest first
      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (pageNum === 1) {
        setOrders(merged);
      } else {
        setOrders(prev => {
          const existing = new Set(prev.map(o => o.id));
          const newItems = merged.filter(o => !existing.has(o.id));
          return [...prev, ...newItems];
        });
      }

      setHasMore(merged.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }

  // Client-side search filter on already-fetched page
  const filtered = orders.filter(order =>
    order.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    order.notes?.toLowerCase().includes(search.toLowerCase())
  );

  function getStatusStyle(status) {
    switch (status) {
      case "ready":     return styles.ready;
      case "preparing": return styles.preparing;
      case "waiting":   return styles.waiting;
      case "cancelled": return styles.cancelled;
      default:          return "";
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "ready":     return "Ready";
      case "preparing": return "Preparing";
      case "waiting":   return "In Queue";
      case "cancelled": return "Cancelled";
      default:          return status;
    }
  }

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading history...</div>;

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order History</h1>
          <p className={styles.sub}>
            Completed kitchen items and cancelled orders
          </p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="Search by receipt number or table..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>No history found.</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Table</th>
                  <th>Kitchen Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td className={styles.receiptCol}>
                      #{order.receipt_number?.slice(-6)}
                    </td>
                    <td>{order.notes?.replace("Table: ", "") || "—"}</td>
                    <td>
                      <div className={styles.itemsCell}>
                        {order.items
                          ?.filter(i => i.station === "kitchen")
                          .slice(0, 2)
                          .map(item => (
                            <span key={item.id} className={styles.itemChip}>
                              {item.item_name} ×{item.quantity}
                            </span>
                          ))}
                        {order.items?.filter(i => i.station === "kitchen").length > 2 && (
                          <span className={styles.itemChip}>
                            +{order.items.filter(i => i.station === "kitchen").length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.totalCol}>
                      ₱{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusStyle(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className={styles.timeCol}>
                      {new Date(order.created_at).toLocaleTimeString("en-PH", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                      <br />
                      <span className={styles.dateSmall}>
                        {new Date(order.created_at).toLocaleDateString("en-PH", {
                          month: "short", day: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* LOAD MORE */}
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={() => fetchOrders(page + 1)}
                disabled={fetching}
                style={{
                  padding: "10px 28px",
                  borderRadius: "20px",
                  border: "1.5px solid #ff7a00",
                  background: "white",
                  color: "#ff7a00",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: fetching ? "not-allowed" : "pointer",
                  opacity: fetching ? 0.6 : 1,
                }}
              >
                {fetching ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}