import API from "./api";

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export const getCashierOrders = () =>
  API.get("/orders/");

// Step 1 — Cashier requests payment from customer (order.status → payment_pending)
export const markPaymentPending = (id) =>
  API.post(`/orders/${id}/cashier_update/`, { status: "payment_pending" });

// Step 2 — Cashier confirms cash/card received (order.status → paid)
// After this, kitchen will see the order and can start preparing
export const markPaid = (id) =>
  API.post(`/orders/${id}/cashier_update/`, { status: "paid" });