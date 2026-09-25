import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, cartSession } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [count, setCount] = useState(0);

  const reload = useCallback(async () => {
    try {
      const params = user ? {} : { session_id: cartSession() };
      const { data } = await api.get('/cart', { params });
      setCart(data);
      setCount((data.items || []).reduce((s, i) => s + i.quantity, 0));
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const add = useCallback(async (variant_id, quantity = 1) => {
    const body = { variant_id, quantity };
    if (!user) body.session_id = cartSession();
    await api.post('/cart/items', body);
    await reload();
  }, [user, reload]);

  const setQty = useCallback(async (itemId, quantity) => {
    await api.put(`/cart/items/${itemId}`, { quantity });
    await reload();
  }, [reload]);

  const removeItem = useCallback(async (itemId) => {
    await api.delete(`/cart/items/${itemId}`);
    await reload();
  }, [reload]);

  const clear = useCallback(async () => {
    await api.delete('/cart', { params: user ? {} : { session_id: cartSession() } });
    await reload();
  }, [user, reload]);

  return <CartCtx.Provider value={{ cart, count, reload, add, setQty, removeItem, clear }}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
