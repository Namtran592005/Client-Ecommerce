import { useEffect, useRef, useState } from 'react';

const CHANNELS = [
  { key: 'zalo', label: 'Zalo', icon: 'bi-chat-dots-fill', href: 'https://zalo.me/1900255579', tone: 'bg-[#0068ff]' },
  { key: 'messenger', label: 'Messenger', icon: 'bi-messenger', href: 'https://m.me/unimate', tone: 'bg-[#0084ff]' },
  { key: 'phone', label: 'Gọi 1900 255 579', icon: 'bi-telephone-fill', href: 'tel:1900255579', tone: 'bg-emerald-600' },
];

/** Nút liên hệ nổi góc dưới phải: bấm để mở Zalo / Messenger / Điện thoại. */
export default function ContactFab() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const out = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', out);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', out);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="fixed right-4 bottom-4 z-[2000] flex flex-col items-end gap-2.5 sm:right-5 sm:bottom-5">
      {open && (
        <ul className="flex flex-col items-end gap-2.5">
          {CHANNELS.map((c, i) => (
            <li
              key={c.key}
              className="flex items-center gap-2.5"
              style={{ animation: `fabIn .18s ease-out ${(CHANNELS.length - 1 - i) * 40}ms both` }}
            >
              <span className="rounded-lg bg-white px-2.5 py-1 text-[12.5px] font-medium whitespace-nowrap text-slate-700 shadow-card">
                {c.label}
              </span>
              <a
                href={c.href}
                target={c.key === 'phone' ? undefined : '_blank'}
                rel="noreferrer"
                aria-label={c.label}
                onClick={() => setOpen(false)}
                className={`grid size-11 place-items-center rounded-full text-white shadow-pop transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${c.tone}`}
              >
                <i className={`bi ${c.icon} text-[18px] leading-none`} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Đóng liên hệ' : 'Liên hệ'}
        aria-expanded={open}
        className="grid size-13 place-items-center rounded-full bg-brand-600 text-white shadow-pop transition-all hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 active:scale-95"
      >
        <i
          className={`bi ${open ? 'bi-chevron-down' : 'bi-headset'} text-[22px] leading-none transition-transform`}
          aria-hidden="true"
        />
      </button>

      <style>{`@keyframes fabIn{from{opacity:0;transform:translateY(8px) scale(.9)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
