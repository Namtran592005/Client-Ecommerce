import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

const WEEK = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fmtVi = (key) => {
  if (!key) return '';
  const [y, m, d] = key.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
};

/** Ô chọn ngày mở modal lịch, thay cho date input gốc của trình duyệt. */
export function DatePicker({ value, onChange, id, ariaLabel, placeholder = 'dd/mm/yyyy', disabled, required }) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => {
    const base = value ? new Date(`${value}T00:00:00`) : today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => { if (value) { const d = new Date(`${value}T00:00:00`); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); } }, [value]);

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        aria-haspopup="dialog"
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm shadow-sm transition-colors',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70',
          open ? 'border-brand-500 ring-2 ring-brand-500/25' : 'border-slate-200 hover:border-slate-300',
          !value && 'text-slate-400',
        )}
      >
        <span className={value ? 'tabular-nums' : ''}>{value ? fmtVi(value) : placeholder}</span>
        <i className="bi bi-calendar3 shrink-0 text-[13px] text-slate-400" aria-hidden="true" />
      </button>
      {open && (
        <CalendarModal
          cursor={cursor}
          setCursor={setCursor}
          today={today}
          value={value}
          onPick={(k) => { onChange(k); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CalendarModal({ cursor, setCursor, today, value, onPick, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const cells = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7; // tuần bắt đầu từ thứ 2
    const start = new Date(y, m, 1 - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return { d, key: toKey(d), out: d.getMonth() !== m, today: toKey(d) === toKey(today) };
    });
  }, [cursor, today]);

  const shift = (n) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Chọn ngày">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="relative w-full max-w-[340px] rounded-xl border border-line bg-white p-4 shadow-pop">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} aria-label="Tháng trước" className="grid size-8 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100">
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          <div className="text-[14px] font-semibold text-ink">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <button type="button" onClick={() => shift(1)} aria-label="Tháng sau" className="grid size-8 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100">
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEK.map((w) => <div key={w} className="py-1 text-center text-[11.5px] font-semibold text-slate-400">{w}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((c) => {
            const on = c.key === value;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onPick(c.key)}
                aria-label={fmtVi(c.key)}
                aria-current={c.today ? 'date' : undefined}
                className={cn(
                  'grid h-9 place-items-center rounded-lg text-[13px] transition-colors',
                  c.out ? 'text-slate-300' : 'text-slate-700 hover:bg-brand-50 hover:text-brand-600',
                  c.today && !on && 'border border-brand-300 font-semibold text-brand-600',
                  on && 'bg-brand-500 font-semibold text-white hover:bg-brand-600 hover:text-white',
                )}
              >
                {c.d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
          <button type="button" onClick={() => onPick(toKey(today))} className="rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-brand-500 transition-colors hover:bg-brand-50">
            Hôm nay
          </button>
          <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-3 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-200">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
