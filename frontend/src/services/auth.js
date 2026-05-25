import API from "./api";

export const loginUser = (data) =>
  API.post("identity/login/", data);

export const registerUser = (data) =>
  API.post("identity/register/", data);