import axios from "axios";

// Base URL comes from environment variable (different in dev & prod)
const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
});

// Request interceptor (add token automatically)
api.interceptors.request.use(
	(config) => {
		const auth = JSON.parse(localStorage.getItem("auth"));
		if (auth?.token) {
			config.headers.Authorization = `Bearer ${auth.token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor (handle errors globally)
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			console.warn("Unauthorized – token may have expired.");
			localStorage.removeItem("auth");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export default api;
