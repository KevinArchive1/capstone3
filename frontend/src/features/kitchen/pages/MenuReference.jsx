import { useEffect, useState } from "react";
import { getMenuItems } from "../../../services/kitchenApi";
import styles from "./MenuReference.module.css";

export default function MenuReference() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStation, setActiveStation] = useState("all");

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      const res = await getMenuItems();
      setMenuItems(res.data);
      const uniqueCategories = [...new Map(
        res.data.map(item => [item.category, item.category_name || item.category])
      ).entries()].map(([id, name]) => ({ id, name }));
      setCategories(uniqueCategories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || item.category === activeCategory;
    const matchStation = activeStation === "all" || item.preparation_station === activeStation;
    return matchSearch && matchCategory && matchStation;
  });

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading menu...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Menu Reference</h1>
          <p className={styles.sub}>All menu items and preparation details</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      {/* FILTERS */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Search menu item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className={styles.filterGroup}>
          <button
            className={activeStation === "all" ? styles.filterActive : styles.filterBtn}
            onClick={() => setActiveStation("all")}
          >
            All Stations
          </button>
          <button
            className={activeStation === "kitchen" ? styles.filterActive : styles.filterBtn}
            onClick={() => setActiveStation("kitchen")}
          >
            🍳 Kitchen
          </button>
          <button
            className={activeStation === "bar" ? styles.filterActive : styles.filterBtn}
            onClick={() => setActiveStation("bar")}
          >
            🍹 Bar
          </button>
        </div>
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className={styles.empty}>No menu items found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Price</th>
                <th>Prep Time</th>
                <th>Station</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td className={styles.nameCol}>
                    <p className={styles.itemName}>{item.name}</p>
                  </td>
                  <td className={styles.descCol}>
                    {item.description || "—"}
                  </td>
                  <td className={styles.priceCol}>
                    ₱{Number(item.price).toFixed(2)}
                  </td>
                  <td className={styles.timeCol}>
                    ⏱ {item.prep_eta_minutes} min
                  </td>
                  <td>
                    <span className={`${styles.stationBadge} ${styles[item.preparation_station]}`}>
                      {item.preparation_station === "kitchen" ? "🍳 Kitchen" : "🍹 Bar"}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${item.is_available ? styles.available : styles.unavailable}`}>
                      {item.is_available ? "Available" : "Out of Stock"}
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