import { useEffect, useState } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { api, fmtVND } from '../api/client';
import { ProductCardCat } from '../components/Shop';

const SORTS = [
  { v: '', l: 'Gợi ý' },
  { v: 'moi', l: 'Hàng mới về' },
  { v: 'ban-chay', l: 'Hàng bán chạy' },
  { v: 'gia-giam', l: 'Giá từ cao tới thấp' },
  { v: 'gia-tang', l: 'Giá từ thấp tới cao' },
  { v: 'ten-az', l: 'Tên A - Z' },
  { v: 'ten-za', l: 'Tên Z - A' },
];
const PRICE_MIN = 0, PRICE_MAX = 2000000;

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
  const pageTitle = q ? `Kết quả cho "${q}"` : cat ? (catName || 'Sản phẩm') : (loc.state?.title || (sort === 'gia-giam' ? 'Bán Chạy' : 'Sản phẩm'));

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
  const toggleGroup = (k) => setOpenGroups((g) => ({ ...g, [k]: !g[k] }));
  const gotoPage = (p) => {
    const n = new URLSearchParams(sp);
    n.set('trang', p);
    setSp(n);
    window.scrollTo(0, 0);
  };

  const priceUI = (
    <>
      <div className="price-slider-values">
        <span className="value-box">{pMin.toLocaleString('vi-VN')}</span>
        <span className="dash">–</span>
        <span className="value-box">{pMax.toLocaleString('vi-VN')}</span>
      </div>
      <div className="range-slider">
        <div className="range-slider-track">
          <div className="range-slider-fill" style={{
            left: `${(pMin / PRICE_MAX) * 100}%`,
            width: `${((pMax - pMin) / PRICE_MAX) * 100}%`,
          }}></div>
        </div>
        <input type="range" className="range-min" min={PRICE_MIN} max={PRICE_MAX} step={10000} value={pMin}
          aria-label="Giá thấp nhất" onChange={(e) => set('gia-tu', Math.min(Number(e.target.value), pMax))} />
        <input type="range" className="range-max" min={PRICE_MIN} max={PRICE_MAX} step={10000} value={pMax}
          aria-label="Giá cao nhất" onChange={(e) => set('gia-den', Math.max(Number(e.target.value), pMin))} />
      </div>
      <div className="price-slider-labels"><span>0</span><span>2.000.000</span></div>
    </>
  );

  const catUI = (
    <>
      {cats.map((c) => (
        <div key={c.id}>
          <label className="filter-option">
            <input type="checkbox" checked={String(cat) === String(c.id)} onChange={() => set('danh-muc', String(cat) === String(c.id) ? '' : c.id)} />
            <span>{c.name}</span>
          </label>
          {(c.children || []).map((s) => (
            <label key={s.id} className="filter-option sub">
              <input type="checkbox" checked={String(cat) === String(s.id)} onChange={() => set('danh-muc', String(cat) === String(s.id) ? '' : s.id)} />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      ))}
      <div style={{ fontWeight: 700, fontSize: 14, margin: '10px 0 4px' }}>Thương hiệu</div>
      {brands.map((b) => (
        <label key={b.id} className="filter-option">
          <input type="checkbox" checked={String(brand) === String(b.id)} onChange={() => set('thuong-hieu', String(brand) === String(b.id) ? '' : b.id)} />
          <span>{b.name}</span>
        </label>
      ))}
    </>
  );

  return (
    <>
      <main className="category-page">
        <div className="breadcrumb-wrap">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb-custom">
              <li><Link to="/">Trang chủ</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
              <li><span className="current">{pageTitle}</span></li>
            </ol>
          </nav>
        </div>

        <div className="page-title-wrap">
          <h1 className="page-title">{pageTitle}</h1>
          <p className="page-subtitle">{pg.total} sản phẩm</p>
        </div>

        <div className="category-container">
          <div className="row g-4 g-lg-4">
            <aside className="col-lg-4 col-xl-3">
              <div className="filter-sidebar">
                <div className="filter-header">
                  <h3><i className="bi bi-sliders"></i> Bộ Lọc</h3>
                  <button type="button" className="clear-all" onClick={clearAll}>Xóa tất cả</button>
                </div>
                <div className={`filter-group ${openGroups.cat ? 'open' : ''}`}>
                  <button type="button" className="filter-toggle" onClick={() => toggleGroup('cat')}>Danh Mục <i className="bi bi-chevron-down"></i></button>
                  <div className="filter-body">{catUI}</div>
                </div>
                <div className={`filter-group ${openGroups.price ? 'open' : ''}`}>
                  <button type="button" className="filter-toggle" onClick={() => toggleGroup('price')}>Giá (VND) <i className="bi bi-chevron-down"></i></button>
                  <div className="filter-body"><div className="price-slider-wrap">{priceUI}</div></div>
                </div>
              </div>
            </aside>

            <div className="col-lg-8 col-xl-9 category-main">
              <div className="toolbar-desktop">
                <div className="results-count">Hiển thị <strong>{rows.length}</strong> trong <strong>{pg.total}</strong> sản phẩm</div>
                <label className="sort-select-wrap">
                  <select className="sort-select" value={sort} onChange={(e) => set('sap-xep', e.target.value)}>
                    {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                  <i className="bi bi-chevron-down"></i>
                </label>
              </div>

              <div className="toolbar-mobile">
                <button type="button" onClick={() => setDrawer(true)}><i className="bi bi-sliders"></i> Bộ Lọc</button>
                <button type="button" onClick={() => setSortSheet(true)}><i className="bi bi-arrow-down-up"></i> Sắp xếp</button>
              </div>

              <div className="product-grid">
                {rows.map((p) => <ProductCardCat key={p.id} p={p} />)}
              </div>
              {rows.length === 0 && <p className="text-center text-muted py-4">Không tìm thấy sản phẩm phù hợp.</p>}

              {pg.totalPages > 1 && (
                <div className="pagination-wrap">
                  <button disabled={pg.page <= 1} onClick={() => gotoPage(pg.page - 1)}>‹</button>
                  {Array.from({ length: pg.totalPages }, (_, i) => i + 1).slice(0, 7).map((n) => (
                    <button key={n} className={n === pg.page ? 'active' : ''} onClick={() => gotoPage(n)}>{n}</button>
                  ))}
                  <button disabled={pg.page >= pg.totalPages} onClick={() => gotoPage(pg.page + 1)}>›</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <div className={`filter-drawer-overlay ${drawer ? 'active' : ''}`} onClick={() => setDrawer(false)}></div>
      <aside className={`filter-drawer ${drawer ? 'active' : ''}`}>
        <div className="filter-drawer-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #e9ecef', fontWeight: 700 }}>
          Bộ Lọc
          <button className="filter-drawer-close" onClick={() => setDrawer(false)}>×</button>
        </div>
        <div className="filter-drawer-body">
          <div style={{ fontWeight: 700, margin: '12px 0 4px' }}>Danh Mục</div>
          {catUI}
          <div style={{ fontWeight: 700, margin: '12px 0 4px' }}>Giá (VND)</div>
          {priceUI}
        </div>
        <div className="filter-drawer-footer">
          <button className="btn-reset" onClick={() => { clearAll(); setDrawer(false); }}>Xóa tất cả</button>
          <button className="btn-apply" onClick={() => setDrawer(false)}>Áp dụng</button>
        </div>
      </aside>

      <div className={`filter-drawer-overlay ${sortSheet ? 'active' : ''}`} onClick={() => setSortSheet(false)}></div>
      <div className={`sort-drawer ${sortSheet ? 'active' : ''}`}>
        <div className="sort-drawer-inner">
          {SORTS.map((s) => (
            <button key={s.v} className={`sort-option ${sort === s.v ? 'active' : ''}`}
              onClick={() => { set('sap-xep', s.v); setSortSheet(false); }}>{s.l}</button>
          ))}
        </div>
      </div>
    </>
  );
}
