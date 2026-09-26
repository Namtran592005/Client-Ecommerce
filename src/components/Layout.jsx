import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { api } from '../api/client';
import SearchBox from './SearchBox';

// Hook slider: nút mũi tên + kéo chuột
export function useSlider() {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 1) { setCanPrev(false); setCanNext(false); return; }
      setCanPrev(track.scrollLeft > 2);
      setCanNext(track.scrollLeft < max - 2);
    };
    let down = false, sx = 0, ss = 0, dragged = false;
    const md = (e) => { if (e.target.closest('button,a')) return; down = true; dragged = false; sx = e.pageX; ss = track.scrollLeft; };
    const mm = (e) => { if (!down) return; if (Math.abs(e.pageX - sx) > 3) dragged = true; track.scrollLeft = ss - (e.pageX - sx); };
    const mu = () => { down = false; };
    const ck = (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } };
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    track.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    track.addEventListener('click', ck, true);
    update();
    const t = setTimeout(update, 500);
    return () => {
      track.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      track.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      track.removeEventListener('click', ck, true);
      clearTimeout(t);
    };
  }, []);
  const step = () => {
    const track = trackRef.current;
    if (!track) return 220;
    const card = track.querySelector('.product-card, .qc-item');
    const gap = parseFloat(getComputedStyle(track).gap) || 12;
    return (card ? card.offsetWidth : 208) + gap;
  };
  return {
    trackRef, canPrev, canNext,
    prev: () => trackRef.current?.scrollBy({ left: -step(), behavior: 'smooth' }),
    next: () => trackRef.current?.scrollBy({ left: step(), behavior: 'smooth' }),
  };
}

export const Container = ({ className = '', children }) => (
  <div className={`mx-auto w-full max-w-[1200px] px-4 ${className}`}>{children}</div>
);

const isExt = (u) => /^https?:\/\//.test(u || '');

function MenuLink({ to, title, onClick, children }) {
  const cls = 'flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-normal leading-5 text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-600';
  const chev = 'bi bi-chevron-right text-[10px] text-slate-300';
  if (isExt(to)) return <a href={to} className={cls} onClick={onClick}>{children}<i className={chev} aria-hidden="true" /></a>;
  return <Link to={to} state={{ title }} onClick={onClick} className={cls}>{children}<i className={chev} aria-hidden="true" /></Link>;
}

function Burger({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Mở menu"
      className="grid size-9 shrink-0 place-items-center rounded-lg text-white transition-colors hover:bg-white/15"
    >
      <i className="bi bi-list text-[22px] leading-none" aria-hidden="true" />
    </button>
  );
}

function CartButton({ count }) {
  return (
    <Link
      to="/gio-hang"
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
      className="relative grid size-9 shrink-0 place-items-center rounded-lg text-white transition-colors hover:bg-white/15"
    >
      <i className="bi bi-cart3 text-[19px] leading-none" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-accent-500 px-1 text-[10.5px] font-bold leading-[18px] text-brand-900">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

export function Header({ cats }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [drawer, setDrawer] = useState(false);
  const [searchBox, setSearchBox] = useState(false);
  const drawerRef = useRef(null);
  const searchRef = useRef(null);
  const [q, setQ] = useState('');
  const [catsFull, setCatsFull] = useState(cats || []);
  const [shopMenu, setShopMenu] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (cats && cats.length) { setCatsFull(cats); return; }
    api.get('/categories/tree').then((r) => setCatsFull(r.data)).catch(() => {});
  }, [cats]);

  useEffect(() => {
    api.get('/settings/public').then((r) => {
      const m = (r.data || []).find((x) => x.setting_key === 'shop.menu');
      if (!m) return;
      try {
        const v = typeof m.setting_value === 'string' ? JSON.parse(m.setting_value) : m.setting_value;
        if (Array.isArray(v) && v.length) setShopMenu(v);
      } catch { /* ignore */ }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = (drawer || searchBox) ? 'hidden' : '';
  }, [drawer, searchBox]);

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') { setDrawer(false); setSearchBox(false); } };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, []);

  // Đóng lớp phủ khi đang có ô nhập bên trong giữ focus -> trả focus về body.
  // Nếu không, trình duyệt cảnh báo "Blocked aria-hidden ... retained focus".
  useEffect(() => {
    [drawerRef, searchRef].forEach((r) => {
      const el = r.current;
      if (el && el.contains(document.activeElement)) document.activeElement.blur();
    });
  }, [drawer, searchBox]);

  const submitSearch = () => {
    setSearchBox(false);
    nav(q.trim() ? `/tim-kiem?q=${encodeURIComponent(q.trim())}` : '/san-pham');
  };

  const menu = shopMenu || [
    { label: 'Hàng Mới', link: '/san-pham' },
    { label: 'Bán Chạy', link: '/san-pham?sap-xep=gia-giam' },
    ...catsFull.map((c) => ({ label: c.name, link: `/san-pham?danh-muc=${c.id}` })),
    { label: 'Ưu Đãi Đặc Biệt', link: '/khuyen-mai' },
  ];

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="bg-brand-600 text-white">
        <Container className="py-1.5 text-center text-[10.5px] leading-tight sm:text-[12.5px]">
          <span className="sm:hidden">Miễn phí vận chuyển từ <strong>499.000₫</strong> · Hotline 1900 255 579</span>
          <span className="hidden sm:inline">Miễn phí vận chuyển cho mọi đơn hàng từ <strong>499.000 VNĐ</strong> - Hotline 1900 255 579</span>
        </Container>
      </div>

      <div className="bg-brand-500 text-white">
        <Container>
          <div className="flex h-14 items-center gap-2 sm:h-16 sm:gap-3">
            <Burger onClick={() => setDrawer(true)} />
            <Link to="/" className="shrink-0" aria-label="UniMate - trang chủ">
              <img src="/logo/logo-dark.png" alt="UniMate" className="h-7 sm:h-9" />
            </Link>

            <SearchBox value={q} onChange={setQ} onSubmit={submitSearch} />

            <div className="ml-auto flex items-center gap-0.5 md:ml-0 md:gap-1">
              <button
                type="button"
                onClick={() => setSearchBox(true)}
                aria-label="Tìm kiếm"
                className="grid size-9 place-items-center rounded-lg text-white transition-colors hover:bg-white/15 md:hidden"
              >
                <i className="bi bi-search text-[18px] leading-none" aria-hidden="true" />
              </button>
              <CartButton count={count} />
            </div>
          </div>
        </Container>
      </div>

      <div
        onClick={() => setDrawer(false)}
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 ${drawer ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        className={`fixed top-0 left-0 z-50 flex h-full w-[300px] max-w-[86vw] flex-col bg-white shadow-pop transition-transform duration-200 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}
        inert={!drawer}
        aria-label="Menu điều hướng"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <img src="/logo/logo-light.png" alt="UniMate" className="h-7" />
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label="Đóng menu"
            className="grid size-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="grid gap-0.5">
            {menu.map((m, i) => (
              <li key={i}><MenuLink to={m.link} title={m.label} onClick={() => setDrawer(false)}>{m.label}</MenuLink></li>
            ))}
          </ul>
          <div className="my-3 border-t border-line" />
          <ul className="grid gap-0.5">
            {user ? (
              <>
                <li><MenuLink to="/tai-khoan" onClick={() => setDrawer(false)}>Tài khoản của tôi</MenuLink></li>
                <li>
                  <button
                    type="button"
                    onClick={async () => { await logout(); setDrawer(false); nav('/'); }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-medium text-price transition-colors hover:bg-price-soft"
                  >
                    Đăng xuất <i className="bi bi-chevron-right text-xs text-slate-400" aria-hidden="true" />
                  </button>
                </li>
              </>
            ) : (
              <li><MenuLink to="/dang-nhap" onClick={() => setDrawer(false)}>Đăng nhập / Đăng ký</MenuLink></li>
            )}
          </ul>
        </nav>
      </aside>

      <div
        ref={searchRef}
        className={`fixed inset-x-0 top-0 z-50 bg-white px-3 py-3 shadow-pop transition-transform duration-200 md:hidden ${searchBox ? 'translate-y-0' : '-translate-y-full'}`}
        inert={!searchBox}
      >
        <div className="flex items-center gap-2">
          <SearchBox variant="panel" autoFocus value={q} onChange={setQ} onSubmit={submitSearch} />
          <button
            type="button"
            onClick={() => setSearchBox(false)}
            aria-label="Đóng tìm kiếm"
            className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

const FooterCol = ({ title, children }) => (
  <div>
    <h6 className="mb-3 text-[13.5px] font-bold text-ink">{title}</h6>
    <ul className="grid gap-2 text-[13px] text-slate-600">{children}</ul>
  </div>
);

const FooterLink = ({ to, children }) => (
  <li><Link to={to} className="transition-colors hover:text-brand-500">{children}</Link></li>
);

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-white">
      <Container className="py-9">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src="/logo/logo-light.png" alt="UniMate" className="h-10" />
            <div className="mt-4 flex gap-2.5">
              {[
                ['/brand/facebook.svg', 'Facebook'], ['/brand/instagram.svg', 'Instagram'],
                ['/brand/tiktok.svg', 'TikTok'], ['/brand/zalo.svg', 'Zalo'],
                ['/brand/tammi.jpg', 'Tammi'],
              ].map(([icon, label]) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-lg bg-mist transition-colors hover:bg-brand-50"
                >
                  <img src={icon} alt="" className="size-[18px] object-contain" loading="lazy" />
                </a>
              ))}
            </div>
          </div>
          <FooterCol title="Về UniMate">
            <FooterLink to="/gioi-thieu">Giới thiệu UniMate</FooterLink>
            <FooterLink to="/san-pham">Sản phẩm</FooterLink>
            <FooterLink to="/khuyen-mai">Thông báo khuyến mãi</FooterLink>
            <FooterLink to="/tai-khoan/don-hang">Theo dõi đơn hàng</FooterLink>
            <FooterLink to="/cau-hoi-thuong-gap">Câu hỏi thường gặp</FooterLink>
          </FooterCol>
          <FooterCol title="Chính sách">
            <FooterLink to="/chinh-sach/ban-hang">Chính sách Bán hàng</FooterLink>
            <FooterLink to="/chinh-sach/giao-hang">Chính sách Giao hàng</FooterLink>
            <FooterLink to="/chinh-sach/doi-tra">Chính sách Đổi trả</FooterLink>
            <FooterLink to="/chinh-sach/bao-mat">Chính sách Bảo mật</FooterLink>
          </FooterCol>
          <FooterCol title="Liên hệ">
            <li>Hotline: 1900 255 579</li>
            <li>Email: hotro@example.com</li>
            <FooterLink to="/tra-cuu-don-hang">Tra cứu đơn hàng</FooterLink>
            <FooterLink to="/gioi-thieu">Danh sách cửa hàng</FooterLink>
          </FooterCol>
        </div>
        <div className="mt-8 border-t border-line pt-4 text-[12px] text-slate-500">
          <span>© 2026 Công ty TNHH UniMate Retail (Việt Nam). Bảo lưu mọi quyền.</span>
        </div>
      </Container>
    </footer>
  );
}
