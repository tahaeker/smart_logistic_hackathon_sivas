import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
});

export const fetchRoutes = () => api.get('/routes').then(r => r.data);
export const fetchRoute = (id) => api.get(`/routes/${id}`).then(r => r.data);
export const fetchPredictions = (routeId) => api.post('/predict', { route_id: routeId }).then(r => r.data);
export const fetchOptimization = (routeId) => api.post('/optimize', { route_id: routeId }).then(r => r.data);
export const fetchOverview = () => api.get('/stats/overview').then(r => r.data);
export const fetchWeather = () => api.get('/weather/current').then(r => r.data);
export const fetchTraffic = () => api.get('/traffic/segments').then(r => r.data);
export const fetchSimulation = (routeId, overrides) => api.post('/simulate', { route_id: routeId, overrides }).then(r => r.data);

export default api;
