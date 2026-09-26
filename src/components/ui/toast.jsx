import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

const TONE = {
  ok: { icon: 'bi-check-circle-fill', text: 'text-emerald-600', edge: 'bg-emerald-500' },
  warn: { icon: 'bi-exclamation-triangle-fill', text: 'text-accent-600', edge: 'bg-accent-500' },
  err: { icon: 'bi-x-circle-fill', text: 'text-price', edge: 'bg-price' },
};

let push = () => {};

export function toast(msg, type = 'ok') {
  push({ id: Date.now() + Math.random(), msg, type });
}
toast.success = (m) => toast(m, 'ok');
toast.warning = (m) => toast(m, 'warn');
toast.error = (m) => toast(m, 'err');

export function ToastRoot() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    push = (t) => {
      setItems((ls) => [...ls, t]);
      setTimeout(() => setItems((ls) => ls.filter((x) => x.id !== t.id)), 2800);
    };
    return () => { push = () => {}; };
  }, []);

  const drop = (id) => setItems((ls) => ls.filter((x) => x.id !== id));

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[4000] flex flex-col items-center gap-2 px-4">
      {items.map((t) => {
        const tone = TONE[t.type] || TONE.ok;
        return (
          <div
            key={t.id}
            role="status"
            className="animate-[toastIn_.18s_ease-out] pointer-events-auto flex w-full max-w-[400px] items-start gap-2.5 rounded-lg border border-line bg-white py-2.5 pr-3 pl-3.5 shadow-pop"
          >
            <i className={cn('bi', tone.icon, tone.text, 'mt-px shrink-0 text-[15px] leading-none')} aria-hidden="true" />
            <p className="min-w-0 flex-1 text-[13.5px] leading-snug font-medium text-slate-700">{t.msg}</p>
            <button
              type="button"
              onClick={() => drop(t.id)}
              aria-label="Đóng thông báo"
              className="-mt-0.5 -mr-0.5 shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <i className="bi bi-x-lg text-[11px] leading-none" aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
