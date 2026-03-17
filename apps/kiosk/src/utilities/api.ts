import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL,
  headers: {
    post: {
      "Content-Type": "application/json",
    },
  },
});

export default api;
