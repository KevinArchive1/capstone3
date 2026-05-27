import API from "./api";

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export const getCashierOrders = () =>
  API.get("/orders/");

// Confirm payment — marks cashier_status="paid" which also sets order.status="paid"
// The kitchen then sees the order because status is now terminal-paid
export const confirmPaymentAndSendToKitchen = (id) =>
  API.post(`/orders/${id}/cashier_update/`, { status: "paid" });

// Mark awaiting_verification (for bulk orders that need extra review)
export const markAwaitingVerification = (id) =>
  API.post(`/orders/${id}/cashier_update/`, { status: "awaiting_verification" });

// Mark payment_pending (reset / flag for follow-up)
export const markAwaitingPayment = (id) =>
  API.post(`/orders/${id}/cashier_update/`, { status: "payment_pending" });