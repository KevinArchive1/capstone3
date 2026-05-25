import { useCart } from "../../../../context/CartContext";
import styles from "./MealCard.module.css";

function MealCard({ meal }) {
  const { addToCart } = useCart();

  function handleAdd() {
    addToCart({
      id: meal.id,
      name: meal.name,
      price: meal.price,
      quantity: 1,
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.image}></div>

      <div className={styles.content}>
        <div className={styles.contentholder}>
          <div className={styles.description}>
            <p className={styles.name}>{meal.name}</p>
            <p className={styles.price}>Php {meal.price}</p>
          </div>

          <div className={styles.time}>
            ⏳ {meal.prep_eta_minutes} Min
          </div>
        </div>

        {!meal.is_available ? (
          <button className={styles.disabled} disabled>
            Out of Stock
          </button>
        ) : (
          <button
            className={styles.button}
            onClick={handleAdd}
          >
            Add to Order
          </button>
        )}
      </div>
    </div>
  );
}

export default MealCard;