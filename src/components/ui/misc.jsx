import * as React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

const linkCls = 'shrink-0 text-[13px] font-semibold text-brand-500 hover:text-brand-700 hover:underline';

// Đường dẫn nội bộ phải đi qua react-router. Dùng thẻ <a href> sẽ tải lại
// toàn bộ trang, mất hết hiệu ứng chuyển trang và hiện lại từ đầu.
export const SectionHead = ({ title, sub, to, more = 'Xem tất cả' }) => (
  <div className="mb-3 flex items-end justify-between gap-3">
    <div>
      <h2 className="text-[17px] font-bold tracking-tight text-ink sm:text-[19px]">{title}</h2>
      {sub && <p className="mt-0.5 text-[13px] text-slate-500">{sub}</p>}
    </div>
    {to && (/^https?:\/\//.test(to)
      ? <a href={to} className={linkCls} target="_blank" rel="noreferrer">{more} <span aria-hidden="true">›</span></a>
      : <Link to={to} className={linkCls}>{more} <span aria-hidden="true">›</span></Link>)}
  </div>
);

export const Empty = ({ icon = 'bi-box-seam', title, desc, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}>
    <span className="grid size-14 place-items-center rounded-full bg-slate-100 text-2xl text-slate-400">
      <i className={`bi ${icon}`} aria-hidden="true" />
    </span>
    {title && <p className="mt-3 text-[15px] font-semibold text-slate-700">{title}</p>}
    {desc && <p className="mt-1 max-w-sm text-[13px] text-slate-500">{desc}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Chip = ({ color = 'default', children, className }) => {
  const map = {
    default: 'border-slate-200 bg-slate-50 text-slate-600',
    brand: 'border-brand-100 bg-brand-50 text-brand-600',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-price-dark',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    accent: 'border-accent-200 bg-accent-50 text-accent-700',
  };
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11.5px] font-semibold', map[color], className)}>
      {children}
    </span>
  );
};

export const Stars = ({ value = 0, count, className }) => (
  <span className={cn('inline-flex items-center gap-1', className)}>
    <span className="text-accent-500" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= Math.round(value) ? 'bi bi-star-fill' : 'bi bi-star'} aria-hidden="true" />
      ))}
    </span>
    {count !== undefined && <span className="text-xs text-slate-500">({count})</span>}
  </span>
);

export const QtyStepper = ({ value, min = 1, max = 99, onChange, className }) => (
  <div className={cn('inline-flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
    <button
      type="button"
      className="h-full w-9 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
      onClick={() => onChange(Math.max(min, value - 1))}
      disabled={value <= min}
      aria-label="Giảm số lượng"
    >
      <i className="bi bi-dash" aria-hidden="true" />
    </button>
    <input
      className="h-full w-11 border-x border-slate-200 text-center text-sm font-semibold outline-none"
      value={value}
      onChange={(e) => {
        const n = Number(e.target.value.replace(/\D/g, ''));
        if (n) onChange(Math.min(max, Math.max(min, n)));
      }}
      aria-label="Số lượng"
    />
    <button
      type="button"
      className="h-full w-9 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      aria-label="Tăng số lượng"
    >
      <i className="bi bi-plus" aria-hidden="true" />
    </button>
  </div>
);
