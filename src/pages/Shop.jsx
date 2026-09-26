import { useEffect, useState } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { api } from '../api/client';
import { ProductCardCat, Pager } from '../components/Shop';
import { Container } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Select, Checkbox } from '../components/ui/input';
import { Empty } from '../components/ui/misc';

const SORTS = [
  { v: '', l: 'Gợi ý' },
  { v: 'moi', l: 'Hàng mới về' },
  { v: 'ban-chay', l: 'Hàng bán chạy' },
  { v: 'gia-giam', l: 'Giá từ cao tới thấp' },
  { v: 'gia-tang', l: 'Giá từ thấp tới cao' },
  { v: 'ten-az', l: 'Tên A - Z' },
  { v: 'ten-za', l: 'Tên Z - A' },
];
const PRICE_MIN = 0;
const PRICE_MAX = 2000000;

const Crumb = ({ title }) => (
  <nav aria-label="breadcrumb" className="py-3 text-[12.5px] text-slate-500">
    <ol className="flex items-center gap-1.5">
      <li><Link to="/" className="hover:text-brand-500">Trang chủ</Link></li>
      <li aria-hidden="true"><i className="bi bi-chevron-right text-[10px]" /></li>
      <li className="font-medium text-slate-700">{title}</li>
    </ol>
  </nav>
);

export default function Shop() {
  const [sp, setSp] = useSearchParams();
  const loc = useLocation();
  const [rows, setRows] = useState([]);
  const [pg, setPg] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [openGroups, setOpenGroups] = useState({ cat: true, price: true });
  const [drawer, setDrawer] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);

  // Escape đóng lớp lọc / sắp xếp, và trả focus về body khi đang có ô nhập bên trong.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (sortSheet) setSortSheet(false);
      else if (drawer) setDrawer(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer, sortSheet]);

  useEffect(() => {
    document.body.style.overflow = (drawer || sortSheet) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawer, sortSheet]);

  const cat = sp.get('danh-muc') || '';
  const q = sp.get('q') || '';
  const brand = sp.get('thuong-hieu') || '';
  const sort = sp.get('sap-xep') || '';
  const pMin = Number(sp.get('gia-tu') || PRICE_MIN);
  const pMax = Number(sp.get('gia-den') || PRICE_MAX);

  const catName = (() => {
    if (!cat) return '';
    for (const c of cats) {
      if (String(c.id) === String(cat)) return c.name;
      for (const s of c.children || []) if (String(s.id) === String(cat)) return s.name;
    }
    return '';
  })();

  const pageTitle = q
    ? `Kết quả cho "${q}"`
    : cat ? (catName || 'Sản phẩm') : (loc.state?.title || (sort === 'gia-giam' ? 'Bán Chạy' : 'Sản phẩm'));

  const load = async (page = 1) => {
    const params = { page, limit: 20 };
    if (cat) params.category_id = cat;
    if (q) params.search = q;
    if (brand) params.brand_id = brand;
    const { data } = await api.get('/products', { params });
    let list = (data.data || []).filter((p) => p.base_price >= pMin && p.base_price <= pMax);
    if (sort === 'gia-tang') list = [...list].sort((a, b) => a.base_price - b.base_price);
    if (sort === 'gia-giam') list = [...list].sort((a, b) => b.base_price - a.base_price);
    if (sort === 'ten-az') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    if (sort === 'ten-za') list = [...list].sort((a, b) => b.name.localeCompare(a.name, 'vi'));
    setRows(list);
    setPg(data.pagination);
  };

  useEffect(() => {
    api.get('/categories/tree').then((r) => setCats(r.data)).catch(() => {});
    api.get('/brands').then((r) => setBrands(r.data)).catch(() => {});
  }, []);
  useEffect(() => { load(Number(sp.get('trang') || 1)); }, [sp]);
  useEffect(() => {
    document.body.style.overflow = (drawer || sortSheet) ? 'hidden' : '';
  }, [drawer, sortSheet]);

  const set = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v); else n.delete(k);
    n.delete('trang');
    setSp(n);
  };
  const clearAll = () => setSp({});
  const gotoPage = (p) => {
    const n = new URLSearchParams(sp);
    n.set('trang', p);
    setSp(n);
    window.scrollTo(0, 0);
  };

  const PriceFilter = (
    <div className="grid gap-2.5">
      <div className="flex items-center gap-2">
        <span className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-[12.5px] font-semibold">
          {pMin.toLocaleString('vi-VN')}
        </span>
        <span className="text-slate-400">–</span>
        <span className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-[12.5px] font-semibold">
          {pMax.toLocaleString('vi-VN')}
        </span>
      </div>
      <input
        type="range" min={PRICE_MIN} max={PRICE_MAX} step={10000} value={pMin}
        aria-label="Giá thấp nhất"
        onChange={(e) => set('gia-tu', Math.min(Number(e.target.value), pMax))}
        className="w-full accent-brand-500"
      />
      <input
        type="range" min={PRICE_MIN} max={PRICE_MAX} step={10000} value={pMax}
        aria-label="Giá cao nhất"
        onChange={(e) => set('gia-den', Math.max(Number(e.target.value), pMin))}
        className="w-full accent-brand-500"
      />
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>0</span><span>2.000.000</span>
      </div>
    </div>
  );

  const Check = ({ checked, onChange, label, sub }) => (
    <label className={`flex cursor-pointer items-start gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-brand-50 ${sub ? 'pl-6' : ''}`}>
      <Checkbox checked={checked} onChange={onChange} className="mt-0.5" />
      <span className="text-[13px] leading-snug text-slate-700">{label}</span>
    </label>
  );

  const CatFilter = (
    <div className="grid gap-0.5">
      {cats.map((c) => (
        <div key={c.id}>
          <Check
            checked={String(cat) === String(c.id)}
            onChange={() => set('danh-muc', String(cat) === String(c.id) ? '' : c.id)}
            label={c.name}
          />
          {(c.children || []).map((s) => (
            <Check
              key={s.id}
              sub
              checked={String(cat) === String(s.id)}
              onChange={() => set('danh-muc', String(cat) === String(s.id) ? '' : s.id)}
              label={s.name}
            />
          ))}
        </div>
      ))}
    </div>
  );

  const BrandFilter = (
    <div className="grid gap-0.5">
      {brands.map((b) => (
        <Check
          key={b.id}
          checked={String(brand) === String(b.id)}
          onChange={() => set('thuong-hieu', String(brand) === String(b.id) ? '' : b.id)}
          label={b.name}
        />
      ))}
    </div>
  );

  const Group = ({ title, open, onToggle, children }) => (
    <div className="border-b border-line last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-[13.5px] font-bold text-ink"
      >
        {title}
        <i className={`bi bi-chevron-down text-xs text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );

  const Filters = (
    <>
      <Group title="Danh mục" open={openGroups.cat} onToggle={() => setOpenGroups((g) => ({ ...g, cat: !g.cat }))}>
        {CatFilter}
      </Group>
      <Group title="Giá (VND)" open={openGroups.price} onToggle={() => setOpenGroups((g) => ({ ...g, price: !g.price }))}>
        {PriceFilter}
      </Group>
      {brands.length > 0 && (
        <div className="px-4 py-4">
          <p className="mb-2 text-[13.5px] font-bold text-ink">Thương hiệu</p>
          {BrandFilter}
        </div>
      )}
    </>
  );

  return (
    <>
      <Container>
        <Crumb title={pageTitle} />
        <div className="pb-4">
          <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">{pageTitle}</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">{pg.total} sản phẩm</p>
        </div>

        <div className="grid gap-5 pb-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 overflow-hidden rounded-xl border border-line bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
                  <i className="bi bi-sliders text-brand-500" aria-hidden="true" /> Bộ lọc
                </h2>
                <button type="button" onClick={clearAll} className="text-[12px] font-semibold text-brand-500 hover:underline">
                  Xóa tất cả
                </button>
              </div>
              {Filters}
            </div>
          </aside>

          <div>
            <div className="mb-3 hidden items-center justify-between gap-3 lg:flex">
              <p className="text-[13px] text-slate-500">
                Hiển thị <strong className="text-ink">{rows.length}</strong> trong <strong className="text-ink">{pg.total}</strong> sản phẩm
              </p>
              <div className="relative w-48">
                <Select value={sort} onChange={(e) => set('sap-xep', e.target.value)} aria-label="Sắp xếp">
                  {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </Select>
              </div>
            </div>

            <div className="mb-3 flex gap-2 lg:hidden">
              <Button variant="outline" size="sm" onClick={() => setDrawer(true)}>
                <i className="bi bi-sliders" aria-hidden="true" /> Bộ lọc
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSortSheet(true)}>
                <i className="bi bi-arrow-down-up" aria-hidden="true" /> Sắp xếp
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {rows.map((p) => <ProductCardCat key={p.id} p={p} />)}
            </div>

            {!rows.length && (
              <Empty icon="bi-search" title="Không tìm thấy sản phẩm" desc="Thử bỏ bớt bộ lọc hoặc tìm với từ khoá khác." />
            )}

            <Pager page={pg.page} totalPages={pg.totalPages} onChange={gotoPage} />
          </div>
        </div>
      </Container>

      <div
        onClick={() => setDrawer(false)}
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity lg:hidden ${drawer ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[86vw] flex-col bg-white shadow-pop transition-transform duration-200 lg:hidden ${drawer ? 'translate-x-0' : '-translate-x-full'}`}
        inert={!drawer}
        aria-label="Bộ lọc"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-bold text-ink">Bộ lọc</h2>
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label="Đóng bộ lọc"
            className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{Filters}</div>
        <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
          <Button variant="outline" onClick={() => { clearAll(); setDrawer(false); }}>Xóa tất cả</Button>
          <Button onClick={() => setDrawer(false)}>Áp dụng</Button>
        </div>
      </aside>

      <div
        onClick={() => setSortSheet(false)}
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity lg:hidden ${sortSheet ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white p-3 shadow-pop transition-transform duration-200 lg:hidden ${sortSheet ? 'translate-y-0' : 'translate-y-full'}`}
        inert={!sortSheet}
        role="dialog"
        aria-label="Sắp xếp"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300" />
        {SORTS.map((s) => (
          <button
            key={s.v}
            type="button"
            onClick={() => { set('sap-xep', s.v); setSortSheet(false); }}
            className={`block w-full rounded-lg px-4 py-3 text-left text-sm transition-colors hover:bg-mist ${sort === s.v ? 'bg-brand-50 font-bold text-brand-600' : 'text-slate-700'}`}
          >
            {s.l}
          </button>
        ))}
      </div>
    </>
  );
}
