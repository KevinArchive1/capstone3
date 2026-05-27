import API from "./api";

export const createOrder = (data) => {
  const guestKey = localStorage.getItem("guest_key");
  const table    = JSON.parse(localStorage.getItem("table") || "null");

  return API.post("/orders/", {
    ...data,
    ...(guestKey ? { guest_key: guestKey } : {}),
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

// For authenticated users — returns all their orders from the backend
export const getOrders = () => {
  const token    = localStorage.getItem("token");
  const guestKey = localStorage.getItem("guest_key");

  if (!token && guestKey) {
    return API.get(`/orders/?guest_key=${guestKey}`);
  }
  return API.get("/orders/");
};

// For guests — returns orders filtered by guest_key (alias kept for clarity)
export const getGuestOrders = () => {
  const guestKey = localStorage.getItem("guest_key");
  if (!guestKey) return Promise.resolve({ data: [] });
  return API.get(`/orders/?guest_key=${guestKey}`);
};

export const getOrder = (id) => {
  const guestKey = localStorage.getItem("guest_key");
  const token    = localStorage.getItem("token");

  if (!token && guestKey) {
    return API.get(`/orders/${id}/?guest_key=${guestKey}`);
  }
  return API.get(`/orders/${id}/`);
};