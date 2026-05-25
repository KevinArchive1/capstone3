import API from "./api";

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// QR REQUESTS
export const getScanRequests = () =>
  API.get("/table-scan-requests/");

export const moderateScanRequest = (id, data) =>
  API.post(`/table-scan-requests/${id}/moderate/`, data);

// TABLE SESSIONS
export const closeTableSession = (id) =>
  API.post(`/table-sessions/${id}/close/`);

// TABLES
export const getTables = () =>
  API.get("/tables/");

export const markTableOccupied = (id) =>
  API.post(`/tables/${id}/mark_occupied/`);

export const markTableVacant = (id) =>
  API.post(`/tables/${id}/mark_vacant/`);

// ORDERS
export const getReadyOrders = () =>
  API.get("/orders/?status=ready");

export const getOrders = () =>
  API.get("/orders/");