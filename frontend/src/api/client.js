import axios from "axios";

const fallbackBaseUrl = "http://localhost:5000";

const normalizeBaseUrl = (value) => {
	if (!value) {
		return fallbackBaseUrl;
	}

	return value.replace(/\/+$/, "");
};

const baseUrl = normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL);

const apiClient = axios.create({
	baseURL: baseUrl,
});

export const getApiBaseUrl = () => baseUrl;

export default apiClient;
