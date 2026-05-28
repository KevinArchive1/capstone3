import { useEffect, useState } from "react";
import API from "../../../services/api";
import styles from "./BarOrderHistory.module.css";

const PAGE_SIZE = 20;

export default function BarOrderHistory() {
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
      const [readyRes, cancelledRes] = await Promise.all([
        API.get("/orders/", {
          params: { bar_status: "ready", page: pageNum, page_size: PAGE_SIZE },
        }),
        API.get("/orders/", {
          params: { status: "cancelled", page: pageNum, page_size: PAGE_SIZE },
        }),
      ]);

      const readyData     = Array.isArray(readyRes.data)     ? readyRes.data     : readyRes.data.results     || [];
      const cancelledData = Array.isArray(cancelledRes.data) ? cancelledRes.data : cancelledRes.data.results || [];

      // Only include cancelled orders that had bar items
      const relevantCancelled = cancelledData.filter(o =>
        o.items?.some(i => i.station === "bar")
      );

      const merged = [...readyData, ...relevantCancelled].filter(
        (order, index, self) => index === self.findIndex(o => o.id === order.id)
      );

      merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (pageNum === 1) {
        setOrders(merged);
      } else {
        setOrders(prev => {
          const existing = new Set(prev.map(o => o.id));
          return [...prev, ...merged.filter(o => !existing.has(o.id))];
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

  const filtered = orders.filter(order =>
    order.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    order.notes?.toLowerCase().includes(search.toLowerCase())
  );

  function getStatusStyle(status) {
    switch (status) {
      case "ready":     return styles.ready;
      case "preparing": return styles.preparing;
      case "cancelled": return styles.cancelled;
      default:          return "";
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case "ready":     return "Ready";
      case "preparing": return "Preparing";
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
          <p className={styles.sub}>Completed bar items and cancelled orders</p>
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
                  <th>Bar Items</th>
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
                          ?.filter(i => i.station === "bar")
                          .slice(0, 2)
                          .map(item => (
                            <span key={item.id} className={styles.itemChip}>
                              {item.item_name} ×{item.quantity}
                            </span>
                          ))}
                        {order.items?.filter(i => i.station === "bar").length > 2 && (
                          <span className={styles.itemChip}>
                            +{order.items.filter(i => i.station === "bar").length - 2} more
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

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button
                onClick={() => fetchOrders(page + 1)}
                disabled={fetching}
                style={{
                  padding: "10px 28px",
                  borderRadius: "20px",
                  border: "1.5px solid #0891b2",
                  background: "white",
                  color: "#0891b2",
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