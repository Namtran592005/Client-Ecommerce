import { useEffect, useRef, useState } from 'react';

// Icon thương hiệu lấy từ nguồn chuẩn, lưu trong public/brand:
//   zalo.svg     - Simple Icons (màu #0068FF)
//   messenger.svg- Font Awesome 6 Brands (màu #0084FF)
//   phone.svg    - bi bi-telephone-fill
// Nền nút đều trắng để icon thương hiệu giữ đúng màu gốc.
const CHANNELS = [
  { key: 'zalo', label: 'Zalo', img: '/brand/zalo.svg', href: 'https://zalo.me/1900255579' },
  { key: 'messenger', label: 'Messenger', img: '/brand/messenger.svg', href: 'https://m.me/unimate' },
  { key: 'phone', label: 'Gọi 1900 255 579', img: '/brand/phone.svg', href: 'tel:1900255579' },
];

const SIZE = 'size-11'; // 44px — nút chính và nút xổ ra cùng cỡ

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
                className={`grid ${SIZE} place-items-center rounded-full bg-white shadow-pop ring-1 ring-line transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50`}
              >
                <img src={c.img} alt="" className="size-6 object-contain" decoding="async" />
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
        className={`grid ${SIZE} place-items-center rounded-full bg-white text-brand-600 shadow-pop ring-1 ring-line transition-all hover:bg-brand-50 hover:ring-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 active:scale-95`}
      >
        <i
          className={`bi ${open ? 'bi-chevron-down' : 'bi-headset'} text-[20px] leading-none transition-transform`}
          aria-hidden="true"
        />
      </button>

      <style>{`@keyframes fabIn{from{opacity:0;transform:translateY(8px) scale(.9)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
