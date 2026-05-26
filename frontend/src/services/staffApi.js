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
export const getTableSessions = () =>
  API.get("/table-sessions/");

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
export const getOrders = () =>
  API.get("/orders/");

// STAFF PAGE REQUESTS
export const getPageRequests = () =>
  API.get("/staff-pages/");

export const finishPageRequest = (id) =>
  API.post(`/staff-pages/${id}/finish/`, { status: "finished" });