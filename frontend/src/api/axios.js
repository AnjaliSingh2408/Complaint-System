import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://complaint-system-g0tt.onrender.com/api/v1",

  withCredentials: true,

  // headers: {
  //   "Content-Type": "application/json",
  // },
});

export default api;