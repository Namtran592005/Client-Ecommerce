import { useEffect, useState } from 'react';

let push = () => {};
export function toast(msg, type = 'ok') {
  push({ id: Date.now() + Math.random(), msg, type });
}
toast.success = (m) => toast(m, 'ok');
toast.warning = (m) => toast(m, 'warn');
toast.error = (m) => toast(m, 'err');

const DOT = { ok: 'bg-emerald-500', warn: 'bg-accent-500', err: 'bg-red-500' };

export function ToastRoot() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    push = (t) => {
      setItems((ls) => [...ls, t]);
      setTimeout(() => setItems((ls) => ls.filter((x) => x.id !== t.id)), 2600);
    };
    return () => { push = () => {}; };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[76px] z-[4000] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="flex max-w-[calc(100vw-32px)] animate-[toastIn_.2s_ease-out] items-center gap-2 rounded-full bg-slate-900 py-2 pr-5 pl-4 text-[13.5px] font-semibold text-white shadow-pop"
        >
          <span className={`size-2 shrink-0 rounded-full ${DOT[t.type] || DOT.ok}`} />
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
