import API from "./api";

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export const getCashierOrders = () =>
  API.get("/orders/");

// Step 1 — Cashier confirms payment received → sends order to kitchen
// status: "waiting" moves order.status from "pending" to "waiting"
// kitchen only sees orders with status "waiting"
export const confirmPaymentAndSendToKitchen = (id) =>
  API.post(`/orders/${id}/cashier_update/`, { status: "waiting" });

// Step 2 — Cashier marks cashier_status as paid (for record keeping)
export const markCashierPaid = (id) =>
  API.post(`/orders/${id}/cashier_update/`, { status: "paid" });

// Mark awaiting payment (reset if needed)
export const markAwaitingPayment = (id) =>
  API.post(`/orders/${id}/cashier_update/`, { status: "awaiting_payment" });