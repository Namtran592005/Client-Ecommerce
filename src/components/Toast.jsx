import { useEffect, useState } from 'react';

let push = () => {};
export function toast(msg, type = 'ok') {
  push({ id: Date.now() + Math.random(), msg, type });
}
toast.success = (m) => toast(m, 'ok');
toast.warning = (m) => toast(m, 'warn');
toast.error = (m) => toast(m, 'err');

// Toast gọn kiểu mẫu: viên nhộng tối, giữa top, tự ẩn 2.6s
export function ToastRoot() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    push = (t) => {
      setItems((ls) => [...ls, t]);
      setTimeout(() => setItems((ls) => ls.filter((x) => x.id !== t.id)), 2600);
    };
    return () => { push = () => {}; };
  }, []);
  const dot = { ok: '#34A853', warn: '#f59e0b', err: '#ff6b6b' };
  return (
    <div style={{ position: 'fixed', top: 76, left: 0, right: 0, zIndex: 4000, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', padding: '0 16px' }}>
      {items.map((t) => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#1d1d1f', color: '#fff',
          borderRadius: 999, padding: '9px 18px', fontSize: 13.5, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,.25)', maxWidth: 'calc(100vw - 32px)',
          animation: 'slideDown .2s ease-out',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot[t.type] || dot.ok, flexShrink: 0 }}></span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
