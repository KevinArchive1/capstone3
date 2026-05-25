import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import { useNavigate } from "react-router-dom";
import styles from "./Checkout.module.css";

function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { createOrder } = useOrder();
  const navigate = useNavigate();

  function handleConfirm() {
    const newOrder = createOrder({
      items: cart,
      total
    });

    console.log("Cart before create:", cart);
    console.log("Created order:", newOrder);

    clearCart();
    navigate(`/order/${newOrder.id}/tracking`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.receipt}>

        <h1 className={styles.title}>Burp & Blends</h1>

        <p className={styles.address}>
          115 Sto Cristo, Sampaloc Santo Cristo, Sariaya
        </p>

        <hr />

        <p className={styles.receiptNo}>
          RECEIPT NO: {Math.floor(Math.random() * 9000) + 1000}
        </p>

        <table className={styles.table}>
          <thead>
            <tr>
              <th align="left">Food</th>
              <th>Qty</th>
              <th align="right">Price</th>
            </tr>
          </thead>

          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td align="center">{item.quantity}</td>
                <td align="right">₱ {item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        <h3 className={styles.total}>Total: ₱ {total}</h3>

        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
        >
          Confirm Order
        </button>

        <p className={styles.thankyou}>
          *** THANK YOU ***
        </p>

      </div>
    </div>
  );
}

export default Checkout;