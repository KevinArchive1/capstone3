import { useEffect, useState } from "react";
import { getIngredients } from "../../../services/kitchenApi";
import styles from "./InventoryAlerts.module.css";

export default function InventoryAlerts() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | low | out

  useEffect(() => {
    fetchIngredients();
    const interval = setInterval(fetchIngredients, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchIngredients() {
    try {
      const res = await getIngredients();
      setIngredients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = ingredients
    .filter(i => {
      if (filter === "low") return parseFloat(i.available_quantity) <= parseFloat(i.reorder_level) && parseFloat(i.available_quantity) > 0;
      if (filter === "out") return parseFloat(i.available_quantity) <= 0;
      return true;
    })
    .filter(i =>
      i.name.toLowerCase().includes(search.toLowerCase())
    );

  const outCount = ingredients.filter(i => parseFloat(i.available_quantity) <= 0).length;
  const lowCount = ingredients.filter(i => parseFloat(i.available_quantity) <= parseFloat(i.reorder_level) && parseFloat(i.available_quantity) > 0).length;
  const okCount = ingredients.filter(i => parseFloat(i.available_quantity) > parseFloat(i.reorder_level)).length;

  function getStatus(ingredient) {
    const qty = parseFloat(ingredient.available_quantity);
    const reorder = parseFloat(ingredient.reorder_level);
    if (qty <= 0) return "out";
    if (qty <= reorder) return "low";
    return "ok";
  }

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading inventory...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory Alerts</h1>
          <p className={styles.sub}>Monitor ingredient stock levels</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* SUMMARY CARDS */}
      <div className={styles.summary}>
        <div
          className={`${styles.summaryCard} ${filter === "out" ? styles.activeCard : ""}`}
          onClick={() => setFilter(filter === "out" ? "all" : "out")}
        >
          <p className={styles.summaryLabel}>Out of Stock</p>
          <h2 className={styles.summaryValue} style={{ color: "#e53e3e" }}>
            {outCount}
          </h2>
        </div>

        <div
          className={`${styles.summaryCard} ${filter === "low" ? styles.activeCard : ""}`}
          onClick={() => setFilter(filter === "low" ? "all" : "low")}
        >
          <p className={styles.summaryLabel}>Low Stock</p>
          <h2 className={styles.summaryValue} style={{ color: "#f59e0b" }}>
            {lowCount}
          </h2>
        </div>

        <div
          className={`${styles.summaryCard} ${filter === "all" ? styles.activeCard : ""}`}
          onClick={() => setFilter("all")}
        >
          <p className={styles.summaryLabel}>Sufficient</p>
          <h2 className={styles.summaryValue} style={{ color: "#28a745" }}>
            {okCount}
          </h2>
        </div>
      </div>

      {/* SEARCH */}
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="Search ingredient..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>No ingredients found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Unit</th>
                <th>Available</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th>Stock Bar</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ingredient => {
                const status = getStatus(ingredient);
                const qty = parseFloat(ingredient.available_quantity);
                const reorder = parseFloat(ingredient.reorder_level);
                const maxBar = Math.max(qty, reorder * 2, 1);
                const barPercent = Math.min((qty / maxBar) * 100, 100);

                return (
                  <tr key={ingredient.id}>
                    <td className={styles.nameCol}>{ingredient.name}</td>
                    <td className={styles.unitCol}>{ingredient.unit}</td>
                    <td className={styles.qtyCol}>
                      <span style={{
                        color: status === "out" ? "#e53e3e" : status === "low" ? "#f59e0b" : "#28a745",
                        fontWeight: 700,
                      }}>
                        {ingredient.available_quantity}
                      </span>
                    </td>
                    <td className={styles.reorderCol}>
                      {ingredient.reorder_level}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[status]}`}>
                        {status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "Sufficient"}
                      </span>
                    </td>
                    <td className={styles.barCol}>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${barPercent}%`,
                            background: status === "out" ? "#e53e3e" : status === "low" ? "#f59e0b" : "#28a745",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}