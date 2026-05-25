import { createContext, useContext, useState } from "react";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  function createOrder(orderData) {
    const newOrder = {
      id: Date.now().toString(),
      status: "Pending",
      createdAt: new Date(),
      ...orderData,
    };

    setOrders(prev => {
      const updated = [...prev, newOrder];
      console.log("Orders after create:", updated);  
      return updated;
    });

    console.log("New order created:", newOrder);     
    return newOrder;
  }

  function updateOrderStatus(id, status) {
    setOrders(prev =>
      prev.map(order =>
        order.id === id ? { ...order, status } : order
      )
    );
  }

  return (
    <OrderContext.Provider value={{ orders, createOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => useContext(OrderContext);