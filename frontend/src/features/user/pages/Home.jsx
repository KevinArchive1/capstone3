import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getMenu } from "../../../services/menuApi";
import dummyImg from "../../../images/dummy_image.png";
import styles from "./Home.module.css";

function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(console.error);
    getMenu().then(res => {
      const sorted = [...res.data].sort((a, b) => b.popularity_score - a.popularity_score);
      setPopular(sorted.slice(0, 8));
    }).catch(console.error);
  }, []);

  function handleCategoryClick(catId) {
    navigate("/menu", { state: { scrollTo: catId } });
  }

  return (
    <div className={styles.page}>

      {/* HERO */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <p>Welcome to</p>
          <h1>Burp & Blends</h1>
          <h3>Start with Our Best Sellers!</h3>
        </div>
      </div>

      {/* CATEGORIES */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Category</h2>
        <div className={styles.categoryRow}>
          {categories.map(cat => (
            <div
              key={cat.id}
              className={styles.categoryCard}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <div className={styles.categoryImg}>
                <img src={cat.image ?? dummyImg} alt={cat.name} />
              </div>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Popular This Week</h2>
        <p className={styles.sectionSub}>Most Ordered right now</p>
        <div className={styles.popularGrid}>
          {popular.map(item => (
            <div key={item.id} className={styles.popularCard}>
              <div className={styles.popularImg}>
                <img src={item.image ?? dummyImg} alt={item.name} />
              </div>
              <div className={styles.popularInfo}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemPrice}>PHP {item.price}</p>
                <p className={styles.itemDesc}>{item.description}</p>
                <button
                  className={styles.addBtn}
                  onClick={() => navigate("/menu")}
                >
                  Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Best Seller</h2>
        <div className={styles.bestSellerRow}>
          {popular.slice(0, 5).map(item => (
            <div
              key={item.id}
              className={styles.bestSellerCard}
              onClick={() => navigate("/menu")}
            >
              <div className={styles.bestSellerImg}>
                <img src={item.image ?? dummyImg} alt={item.name} />
              </div>
              <p className={styles.itemName}>{item.name}</p>
              <p className={styles.itemPrice}>PHP {item.price}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Home;