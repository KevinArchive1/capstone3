import API from "./api";

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

export const createOrder = (data) => {
  const guestKey = localStorage.getItem("guest_key");
  const table    = JSON.parse(localStorage.getItem("table") || "null");

  return API.post("/orders/", {
    ...data,
    ...(guestKey ? { guest_key: guestKey } : {}),
    // table_session is now REQUIRED by the backend — always send it
    ...(table?.session_id ? { table_session: table.session_id } : {}),
  });
};

export const submitOrder = (id) => {
  const guestKey = localStorage.getItem("guest_key");
  const token    = localStorage.getItem("token");

  if (!token && guestKey) {
    return API.post(`/orders/${id}/submit/?guest_key=${guestKey}`);
  }
  return API.post(`/orders/${id}/submit/`);
};

export const cancelOrder = (id, note = "") => {
  const guestKey = localStorage.getItem("guest_key");
  const token    = localStorage.getItem("token");

  if (!token && guestKey) {
    return API.post(`/orders/${id}/cancel/?guest_key=${guestKey}`, { note });
  }
  return API.post(`/orders/${id}/cancel/`, { note });
};

export const getOrders = () =>
  API.get("/orders/");

export const getOrder = (id) => {
  const guestKey = localStorage.getItem("guest_key");
  const token    = localStorage.getItem("token");

  if (!token && guestKey) {
    return API.get(`/orders/${id}/?guest_key=${guestKey}`);
  }
  return API.get(`/orders/${id}/`);
};