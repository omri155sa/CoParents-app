import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token helpers ─────────────────────────────────────────────────────────────
export const storeTokens = async (accessToken, refreshToken) => {
  await SecureStore.setItemAsync('accessToken', accessToken);
  if (refreshToken) await SecureStore.setItemAsync('refreshToken', refreshToken);
};

export const getAccessToken = () => SecureStore.getItemAsync('accessToken');
export const getRefreshToken = () => SecureStore.getItemAsync('refreshToken');

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

// ── Request interceptor: attach Bearer token ──────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 / token refresh ─────────────────────────
let refreshing = false;
let queue = [];

const processQueue = (error, token) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      refreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const newToken = data.accessToken;
        await storeTokens(newToken, data.refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        await clearTokens();
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// ── Couple ────────────────────────────────────────────────────────────────────
export const coupleAPI = {
  create: (data) => api.post('/couple', data),
  get: (coupleId) => api.get(`/couple/${coupleId}`),
  invite: (coupleId) => api.post(`/couple/${coupleId}/invite`),
  acceptInvite: (token) => api.post('/couple/accept-invite', { token }),
  uploadAgreement: (coupleId, formData) =>
    api.post(`/couple/${coupleId}/agreement`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Schedule ──────────────────────────────────────────────────────────────────
export const scheduleAPI = {
  get: (coupleId, params) => api.get(`/couple/${coupleId}/schedule`, { params }),
  requestChange: (coupleId, data) => api.post(`/couple/${coupleId}/schedule/request`, data),
  approveSwap: (coupleId, scheduleId) => api.put(`/couple/${coupleId}/schedule/${scheduleId}/approve`),
  rejectSwap: (coupleId, scheduleId) => api.put(`/couple/${coupleId}/schedule/${scheduleId}/reject`),
  getCustodyRights: (coupleId) => api.get(`/couple/${coupleId}/custody-rights`),
};

// ── Children ──────────────────────────────────────────────────────────────────
export const childLogAPI = {
  getLogs: (childId, params) => api.get(`/child/${childId}/logs`, { params }),
  addLog: (childId, data) => api.post(`/child/${childId}/logs`, data),
  updateLog: (childId, logId, data) => api.put(`/child/${childId}/logs/${logId}`, data),
  getSummary: (childId) => api.get(`/child/${childId}/logs/summary`),
};

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expenseAPI = {
  list: (coupleId, params) => api.get(`/couple/${coupleId}/expenses`, { params }),
  add: (coupleId, data) => api.post(`/couple/${coupleId}/expenses`, data),
  approve: (coupleId, expenseId) => api.put(`/couple/${coupleId}/expenses/${expenseId}/approve`),
  reject: (coupleId, expenseId, reason) =>
    api.put(`/couple/${coupleId}/expenses/${expenseId}/reject`, { reason }),
  summary: (coupleId, params) => api.get(`/couple/${coupleId}/expenses/summary`, { params }),
};

// ── Activities ────────────────────────────────────────────────────────────────
export const activityAPI = {
  list: (coupleId) => api.get(`/couple/${coupleId}/activities`),
  add: (coupleId, data) => api.post(`/couple/${coupleId}/activities`, data),
  update: (coupleId, actId, data) => api.put(`/couple/${coupleId}/activities/${actId}`, data),
  remove: (coupleId, actId) => api.delete(`/couple/${coupleId}/activities/${actId}`),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messageAPI = {
  list: (coupleId, params) => api.get(`/couple/${coupleId}/messages`, { params }),
  send: (coupleId, content) => api.post(`/couple/${coupleId}/messages`, { content }),
  markRead: (coupleId, msgId) => api.put(`/couple/${coupleId}/messages/${msgId}/read`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  monthly: (coupleId, year, month) =>
    api.get(`/couple/${coupleId}/report/monthly`, { params: { year, month } }),
  yearly: (coupleId, year) =>
    api.get(`/couple/${coupleId}/report/yearly`, { params: { year } }),
  legalExport: (coupleId, params) =>
    api.get(`/couple/${coupleId}/report/legal-export`, { params, responseType: 'blob' }),
};

export default api;
