import { useEffect, useState } from "react";
import { getCashierOrders } from "../../../services/cashierApi";
import styles from "./CashierOrderHistory.module.css";

export default function CashierOrderHistory() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await getCashierOrders();
      // History = orders that are fully done (ready) or cancelled
      // "ready" is the terminal active status in the new flow
      // cashier_status="paid" means payment was confirmed
      const completed = res.data.filter(o =>
        ["ready", "cancelled"].includes(o.status)
      );
      setOrders(completed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter(order =>
    order.receipt_number?.toLowerCase().includes(search.toLowerCase()) ||
    order.notes?.toLowerCase().includes(search.toLowerCase())
  );

  // Revenue = orders where cashier confirmed payment (cashier_status="paid")
  const paidOrders    = orders.filter(o => o.cashier_status === "paid");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");
  const totalRevenue  = paidOrders.reduce(
    (sum, o) => sum + Number(o.total_amount), 0
  );

  function getStatusLabel(order) {
    if (order.status === "cancelled") return "Cancelled";
    if (order.cashier_status === "paid") return "Paid";
    if (order.status === "ready") return "Ready";
    return order.status;
  }

  function getStatusClass(order) {
    if (order.status === "cancelled") return styles.cancelled;
    if (order.cashier_status === "paid") return styles.paid;
    if (order.status === "ready") return styles.ready;
    return "";
  }

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading history...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order History</h1>
          <p className={styles.sub}>Completed and cancelled transactions</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* SUMMARY */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Transactions</p>
          <h2 className={styles.summaryValue}>{orders.length}</h2>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Paid Orders</p>
          <h2 className={styles.summaryValue} style={{ color: "#28a745" }}>
            {paidOrders.length}
          </h2>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Cancelled Orders</p>
          <h2 className={styles.summaryValue} style={{ color: "#e53e3e" }}>
            {cancelledOrders.length}
          </h2>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Revenue</p>
          <h2 className={styles.summaryValue} style={{ color: "#ff7a00" }}>
            ₱{totalRevenue.toFixed(2)}
          </h2>
        </div>
      </div>

      {/* SEARCH */}
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="Search by receipt number or table..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>No completed orders found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Table</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
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
                      {order.items?.slice(0, 2).map(item => (
                        <span key={item.id} className={styles.itemChip}>
                          {item.item_name} ×{item.quantity}
                        </span>
                      ))}
                      {order.items?.length > 2 && (
                        <span className={styles.itemChip}>
                          +{order.items.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={styles.totalCol}>
                    ₱{Number(order.total_amount).toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={styles.statusBadge}
                      style={{
                        background: order.cashier_status === "paid"
                          ? "#e6f4ea" : "#fff8e1",
                        color: order.cashier_status === "paid"
                          ? "#28a745" : "#f59e0b",
                      }}
                    >
                      {order.cashier_status === "paid"
                        ? "Paid"
                        : "Awaiting Payment"}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(order)}`}>
                      {getStatusLabel(order)}
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
      )}

    </div>
  );
}