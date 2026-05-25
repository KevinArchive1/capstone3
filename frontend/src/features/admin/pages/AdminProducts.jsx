import { useEffect, useState } from "react";
import {
  getAdminCategories,
  getAdminMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../../services/adminApi";
import styles from "./AdminProducts.module.css";

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  prep_eta_minutes: "",
  preparation_station: "kitchen",
  is_available: true,
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStation, setFilterStation] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [itemRes, catRes] = await Promise.all([
        getAdminMenuItems(),
        getAdminCategories(),
      ]);
      setItems(itemRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(item) {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || "",
      price: item.price,
      prep_eta_minutes: item.prep_eta_minutes,
      preparation_station: item.preparation_station,
      is_available: item.is_available,
    });
    setShowForm(true);
  }

  function handleNew() {
    setEditingItem(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.category || !form.price) {
      alert("Name, category and price are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, form);
      } else {
        await createMenuItem(form);
      }
      setShowForm(false);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Failed to save item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this item?")) return;
    setDeleting(id);
    try {
      await deleteMenuItem(id);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete item.");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || String(item.category) === String(filterCategory);
    const matchStation = filterStation === "all" || item.preparation_station === filterStation;
    return matchSearch && matchCat && matchStation;
  });

  const today = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  if (loading) return <div className={styles.loading}>Loading products...</div>;

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.sub}>Manage your menu items</p>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.date}>{today}</span>
          <button className={styles.addBtn} onClick={handleNew}>
            + Add Item
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          placeholder="Search item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          className={styles.select}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filterStation}
          onChange={e => setFilterStation(e.target.value)}
        >
          <option value="all">All Stations</option>
          <option value="kitchen">Kitchen</option>
          <option value="bar">Bar</option>
        </select>
      </div>

      {/* TABLE */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Prep Time</th>
              <th>Station</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id}>
                <td className={styles.nameCol}>
                  <p className={styles.itemName}>{item.name}</p>
                  {item.description && (
                    <p className={styles.itemDesc}>{item.description}</p>
                  )}
                </td>
                <td>
                  {categories.find(c => c.id === item.category)?.name || "—"}
                </td>
                <td className={styles.priceCol}>
                  ₱{Number(item.price).toFixed(2)}
                </td>
                <td>⏱ {item.prep_eta_minutes} min</td>
                <td>
                  <span className={`${styles.stationBadge} ${styles[item.preparation_station]}`}>
                    {item.preparation_station === "kitchen" ? "🍳 Kitchen" : "🍹 Bar"}
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${item.is_available ? styles.available : styles.unavailable}`}>
                    {item.is_available ? "Available" : "Unavailable"}
                  </span>
                </td>
                <td>
                  <div className={styles.actionBtns}>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? "..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" className={styles.empty}>
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className={styles.overlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>

            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingItem ? "Edit Item" : "Add New Item"}
              </h3>
              <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Name *</label>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Category *</label>
                <select
                  className={styles.input}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Price *</label>
                <input
                  className={styles.input}
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Prep Time (mins)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={form.prep_eta_minutes}
                  onChange={e => setForm({ ...form, prep_eta_minutes: e.target.value })}
                  placeholder="10"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Station</label>
                <select
                  className={styles.input}
                  value={form.preparation_station}
                  onChange={e => setForm({ ...form, preparation_station: e.target.value })}
                >
                  <option value="kitchen">Kitchen</option>
                  <option value="bar">Bar</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Available</label>
                <select
                  className={styles.input}
                  value={form.is_available}
                  onChange={e => setForm({ ...form, is_available: e.target.value === "true" })}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Item description..."
                  rows={3}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : editingItem ? "Save Changes" : "Add Item"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}