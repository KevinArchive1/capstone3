import { useEffect, useState } from "react";
import { getMenuItems } from "../../../services/barApi";
import styles from "./BarMenuReference.module.css";

export default function BarMenuReference() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      const res = await getMenuItems();
      // Bar only cares about bar-station items
      setMenuItems(res.data.filter(item => item.preparation_station === "bar"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = menuItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading menu...</div>;

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Menu Reference</h1>
          <p className={styles.sub}>Bar drinks and preparation details</p>
        </div>
        <span className={styles.date}>{today}</span>
      </div>

      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="Search drink..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>No bar items found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Price</th>
                <th>Prep Time</th>
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