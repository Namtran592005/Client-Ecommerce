import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Ô chọn có ô tìm kiếm. Danh sách thường dài (tỉnh 34, xã/phường hơn 100)
 * nên thay <select> gốc của trình duyệt — bản gốc không tìm được và xấu.
 */
export function SearchSelect({
  value, options, onChange, placeholder = '-- Chọn --',
  searchPlaceholder = 'Gõ để tìm...', disabled = false, emptyText = 'Không có kết quả',
  id, ariaLabel, required,
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    const k = norm(term);
    if (!k) return options;
    return options.filter((o) => norm(o.label).includes(k));
  }, [options, term]);

  useEffect(() => {
    if (!open) return undefined;
    const out = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) close(); };
    document.addEventListener('pointerdown', out);
    return () => document.removeEventListener('pointerdown', out);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector('[data-active="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [cursor, open]);

  const close = () => {
    setOpen(false);
    setTerm('');
    setCursor(0);
  };

  const pick = (o) => {
    onChange(o.value);
    close();
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[cursor]) pick(filtered[cursor]);
    } else if (e.key === 'Tab') close();
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => { setOpen((o) => !o); setTerm(''); setCursor(0); }}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-required={required || undefined}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm shadow-sm transition-colors',
          'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70',
          open ? 'border-brand-500 ring-2 ring-brand-500/25' : 'border-slate-200 hover:border-slate-300',
          !selected && !open && 'text-slate-400',
        )}
      >
        <span className="min-w-0 truncate">{selected ? selected.label : placeholder}</span>
        <i className={cn('bi bi-chevron-down shrink-0 text-[10px] text-slate-400 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-40 overflow-hidden rounded-lg border border-line bg-white shadow-pop">
          <div className="border-b border-line p-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5">
              <i className="bi bi-search shrink-0 text-[12px] text-slate-400" aria-hidden="true" />
              <input
                ref={inputRef}
                autoFocus
                value={term}
                onChange={(e) => { setTerm(e.target.value); setCursor(0); }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-8 w-full min-w-0 bg-transparent text-[13.5px] outline-none placeholder:text-slate-400"
              />
              {term && (
                <button type="button" onClick={() => { setTerm(''); setCursor(0); inputRef.current?.focus(); }} aria-label="Xoá tìm kiếm" className="shrink-0 text-slate-400 hover:text-slate-700">
                  <i className="bi bi-x-lg text-[11px]" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <ul ref={listRef} role="listbox" className="max-h-[240px] overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-3 text-[13px] text-slate-500">{emptyText}</li>}
            {filtered.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === value} data-active={i === cursor}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => pick(o)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13.5px] transition-colors',
                    i === cursor ? 'bg-brand-50 font-medium text-brand-600' : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <i className="bi bi-check-lg shrink-0 text-[12px] text-brand-500" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ul>

          {options.length > 8 && (
            <p className="border-t border-line px-3 py-1.5 text-[11.5px] text-slate-400">
              {options.length} mục — dùng ô tìm để lọc nhanh hơn
            </p>
          )}
        </div>
      )}
    </div>
  );
}
