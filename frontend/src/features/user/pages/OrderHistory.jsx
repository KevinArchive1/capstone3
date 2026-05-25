import { useEffect, useState } from "react";
import API from "../../../services/api";

function OrderHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    API.get("identity/me/history/")
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>My Orders</h2>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map(order => (
          <div key={order.id}>
            <p>Order #{order.id}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default OrderHistory;