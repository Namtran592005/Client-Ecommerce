import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api, setAccessToken, setRefreshToken, clearTokens, setOnAuthFail } from '../api/client';

const AuthCtx = createContext(null);

const markSession = () => { try { sessionStorage.setItem('unimate_had_session', '1'); } catch { /* ignore */ } };
const clearSession = () => { try { sessionStorage.removeItem('unimate_had_session'); } catch { /* ignore */ } };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [ready, setReady] = useState(false);
  const booted = useRef(false);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    clearTokens();
    clearSession();
    setUser(null);
    setMustChangePassword(false);
  }, []);

  useEffect(() => { setOnAuthFail(() => { clearTokens(); setUser(null); }); }, []);

  // Gộp giỏ vãng lai vào giỏ tài khoản sau khi đăng nhập/đăng ký
  const mergeGuestCart = useCallback(async () => {
    const sid = localStorage.getItem('unimate_session');
    if (!sid) return;
    try {
      const { data } = await api.get('/cart', { params: { session_id: sid } });
      const items = data.items || [];
      for (const it of items) {
        await api.post('/cart/items', { variant_id: it.variant_id, quantity: it.quantity });
      }
      if (items.length) await api.delete('/cart', { params: { session_id: sid } });
    } catch { /* ignore */ }
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    markSession();
    await mergeGuestCart();
    const me = await api.get('/auth/me');
    setUser(me.data.user);
    setMustChangePassword(Boolean(me.data.mustChangePassword ?? data.mustChangePassword));
    return me.data.user;
  }, [mergeGuestCart]);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    await api.put('/auth/password', { old_password: oldPassword, new_password: newPassword });
    setMustChangePassword(false);
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    markSession();
    await mergeGuestCart();
    const me = await api.get('/auth/me');
    setUser(me.data.user);
    return me.data.user;
  }, [mergeGuestCart]);

  // Khách chưa từng đăng nhập thì khỏi gọi /auth/refresh — vừa tiết kiệm request,
  // vừa không dính rate-limit 30 lần/10 phút vì mỗi lần mở trang đều trả 401.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      let had = false;
      try { had = sessionStorage.getItem('unimate_had_session') === '1'; } catch { /* ignore */ }
      if (!had) { setReady(true); return; }
      try {
        const { data } = await api.post('/auth/refresh', {});
        setAccessToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        const me = await api.get('/auth/me');
        setUser(me.data.user);
        setMustChangePassword(Boolean(me.data.mustChangePassword));
      } catch { clearTokens(); setUser(null); }
      finally { setReady(true); }
    })();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, setUser, login, register, logout, ready, mustChangePassword, changePassword }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
