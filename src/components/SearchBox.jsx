import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, fileUrl, fmtVND } from '../api/client';

const imgOf = (p) => {
  const k = (p.images || []).find((i) => i.object_key)?.object_key;
  return k ? fileUrl(k) : '';
};

export default function SearchBox({ value, onChange, onSubmit, variant = 'header', autoFocus = false }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const seq = useRef(0);

  const panel = variant === 'panel';

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setItems([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const id = ++seq.current;
    const t = setTimeout(() => {
      api.get('/products', { params: { search: term, limit: 6 } })
        .then((r) => {
          if (seq.current !== id) return;
          setItems((r.data.data || []).slice(0, 6));
          setActive(-1);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => { if (seq.current === id) setLoading(false); });
    }, 220);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const out = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', out);
    return () => document.removeEventListener('pointerdown', out);
  }, []);

  const go = (p) => {
    setOpen(false);
    inputRef.current?.blur();
    nav(`/san-pham/${p.slug}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setActive(-1); return; }
    if (!open || !items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + items.length) % items.length); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); go(items[active]); }
  };

  const shell = panel
    ? 'flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3'
    : 'ml-auto hidden flex-1 items-center rounded-lg bg-white px-3 md:flex md:max-w-[560px] xl:max-w-[470px]';

  const field = panel
    ? 'h-full w-full min-w-0 bg-transparent text-sm outline-none'
    : 'h-9 w-full min-w-0 bg-transparent px-2 text-sm text-slate-800 outline-none placeholder:text-slate-400';

  return (
    <div ref={boxRef} className={`relative ${panel ? 'flex-1' : 'ml-auto hidden flex-1 md:flex md:max-w-[560px] xl:max-w-[470px]'}`}>
      <form
        onSubmit={(e) => { e.preventDefault(); if (active >= 0 && items[active]) go(items[active]); else { setOpen(false); onSubmit(); } }}
        className={shell}
        role="search"
      >
        <i className="bi bi-search shrink-0 text-slate-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (items.length) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="Bạn đang muốn tìm kiếm gì?"
          aria-label="Tìm kiếm sản phẩm"
          aria-expanded={open}
          aria-autocomplete="list"
          className={field}
        />
        {loading && <i className="bi bi-arrow-repeat shrink-0 animate-spin text-slate-400" aria-hidden="true" />}
        {value && !loading && (
          <button
            type="button"
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            aria-label="Xoá nội dung tìm kiếm"
            className={`-mr-1 grid size-6 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 ${panel ? '' : ''}`}
          >
            <i className="bi bi-x-lg text-[11px] leading-none" aria-hidden="true" />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-lg border border-line bg-white shadow-pop">
          {items.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] text-slate-500">Không tìm thấy sản phẩm nào</p>
          ) : (
            <ul role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
              {items.map((p, i) => (
                <li key={p.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(p)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${i === active ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                  >
                    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-mist">
                      {imgOf(p) ? <img src={imgOf(p)} alt="" decoding="async" className="size-full object-contain p-0.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 block text-[13px] font-medium text-slate-800">{p.name}</span>
                      <span className="text-[12px] font-bold text-price">{fmtVND(p.base_price)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => { setOpen(false); onSubmit(); }}
            className="block w-full border-t border-line px-3 py-2 text-left text-[12.5px] font-medium text-brand-500 transition-colors hover:bg-brand-50"
          >
            Xem tất cả kết quả cho “{value.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
