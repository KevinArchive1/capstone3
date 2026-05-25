import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCategories, getMenu } from "../../../services/menuApi";
import MealCard from "../components/menu/MealCard";
import dummyImg from "../../../images/dummy_image.png";
import styles from "./Menu.module.css";

function Menu() {
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const sectionRefs = useRef({});
  const location = useLocation();

  useEffect(() => {
    getCategories().then(res => {
      setCategories(res.data);
      if (res.data.length > 0) setActiveCategory(res.data[0].id);
    }).catch(console.error);

    getMenu().then(res => setMenuItems(res.data)).catch(console.error);
  }, []);

  // Scroll to category from Home
  useEffect(() => {
    if (!location.state?.scrollTo || categories.length === 0) return;
    setTimeout(() => {
      const el = sectionRefs.current[location.state.scrollTo];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveCategory(location.state.scrollTo);
      }
    }, 300);
  }, [categories, location.state]);

  function handleCategoryClick(catId) {
    setActiveCategory(catId);
    const el = sectionRefs.current[catId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveCategory(Number(entry.target.dataset.catId));
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px 0px 0px" }
    );

    Object.values(sectionRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  function getItemsByCategory(catId) {
    return menuItems.filter(item => item.category === catId);
  }

  function getRegular(items) {
    return items.filter(item => item.type !== "platter");
  }

  function getPlatters(items) {
    return items.filter(item => item.type === "platter");
  }

  return (
    <div className={styles.page}>

      {/* CATEGORY BAR */}
      <aside className={styles.sidebar}>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={activeCategory === cat.id ? styles.catActive : styles.catBtn}
            onClick={() => handleCategoryClick(cat.id)}
          >
            <div className={styles.catIcon}>
              <img src={cat.image ?? dummyImg} alt={cat.name} />
            </div>
            <span className={styles.catLabel}>{cat.name}</span>
          </button>
        ))}
      </aside>

      {/* MENU SECTIONS */}
      <div className={styles.content}>
        {categories.map(cat => {
          const items = getItemsByCategory(cat.id);
          const regular = getRegular(items);
          const platters = getPlatters(items);

          return (
            <section
              key={cat.id}
              ref={el => sectionRefs.current[cat.id] = el}
              data-cat-id={cat.id}
              className={styles.section}
            >
              <h2 className={styles.catTitle}>{cat.name}</h2>
              <div className={styles.divider} />

              {regular.length > 0 && (
                <div className={styles.grid}>
                  {regular.map(item => (
                    <MealCard key={item.id} meal={item} />
                  ))}
                </div>
              )}

              {platters.length > 0 && (
                <>
                  <h3 className={styles.platterTitle}>{cat.name} Platter</h3>
                  <p className={styles.platterSub}>
                    Good for 3 Persons (Served with One Time Refill of Garlic Rice)
                  </p>
                  <div className={styles.platterGrid}>
                    {platters.map(item => (
                      <MealCard key={item.id} meal={item} />
                    ))}
                  </div>
                </>
              )}

              {items.length === 0 && (
                <p className={styles.empty}>No items yet.</p>
              )}
            </section>
          );
        })}
      </div>

    </div>
  );
}

export default Menu;