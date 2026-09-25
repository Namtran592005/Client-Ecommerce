import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1/api';
export const FILES_BASE = (import.meta.env.VITE_FILES_BASE || 'http://127.0.0.1:9000/unimate').replace(/\/$/, '');

let accessToken = null;
let refreshToken = null;
export const setAccessToken = (t) => { accessToken = t; };
export const setRefreshToken = (t) => { refreshToken = t; };
export const clearTokens = () => { accessToken = null; refreshToken = null; };

export const api = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 30000 });
api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = 'Bearer ' + accessToken;
  return cfg;
});

let refreshing = null;
let onAuthFail = () => {};
export const setOnAuthFail = (fn) => { onAuthFail = fn; };
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const req = err.config || {};
    if (err.response?.status === 401 && !req._retried && !req.url?.includes('/auth/refresh')) {
      req._retried = true;
      try {
        refreshing ||= axios.post(API_BASE + '/auth/refresh', refreshToken ? { refresh_token: refreshToken } : {}, { withCredentials: true })
          .then((r) => {
            setAccessToken(r.data.accessToken);
            if (r.data.refreshToken) setRefreshToken(r.data.refreshToken);
          })
          .finally(() => { refreshing = null; });
        await refreshing;
        return api(req);
      } catch (e) { onAuthFail(); throw e; }
    }
    throw err;
  }
);

export const errMsg = (e, fb = 'Có lỗi xảy ra, thử lại sau') => e?.response?.data?.error || e?.message || fb;
export const fmtVND = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(n || 0)) + '₫';
export const fmtDate = (s) => (s ? new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—');
export const fileUrl = (key) => (key ? `${FILES_BASE}/${key}` : '');
export const stars = (n) => '★★★★★'.slice(0, Math.round(n || 0)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n || 0));

// Giỏ vãng lai: session_id lưu localStorage để gọi API giỏ backend
export const cartSession = () => {
  let s = localStorage.getItem('unimate_session');
  if (!s) {
    s = 'ss-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('unimate_session', s);
  }
  return s;
};
