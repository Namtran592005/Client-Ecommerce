import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { api } from '../api/client';

// Hook slider mẫu gốc: arrows + kéo chuột
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

const isExt = (u) => /^https?:\/\//.test(u || '');
function MenuLink({ to, title, onClick, children }) {
  if (isExt(to)) return <a href={to}>{children}</a>;
  return <Link to={to} state={{ title }} onClick={onClick}>{children}</Link>;
}

export function Header({ cats }) {  const { user, logout } = useAuth();
  const { count } = useCart();
  const [drawer, setDrawer] = useState(false);
  const [searchBox, setSearchBox] = useState(false);
  const [q, setQ] = useState('');
  const [catsFull, setCatsFull] = useState(cats || []);
  const [shopMenu, setShopMenu] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (cats && cats.length) { setCatsFull(cats); return; }
    api.get('/categories/tree').then((r) => setCatsFull(r.data)).catch(() => {});
  }, [cats]);
  useEffect(() => {
    // Menu do admin tuỳ chỉnh (shop.menu); thiếu thì dùng mặc định
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

  return (
    <header>
      <div className="top-bar">
        <div className="container text-center">
          Miễn phí vận chuyển cho mọi đơn hàng từ <strong>499.000 VNĐ</strong> - Hotline 1900 255 579
        </div>
      </div>

      <div className="header-main">
        <div className="container">
          <div className="d-none d-md-flex align-items-center w-100 gap-3">
            <button className="hamburger" type="button" onClick={() => setDrawer(true)} aria-label="Mở menu">
              <span className="line"></span><span className="line"></span><span className="line"></span>
            </button>
            <Link to="/" className="logo"><img src="/logo/logo-dark.png" alt="UniMate" /></Link>
            <div className="header-right">
              <form className="search-desktop" onSubmit={(e) => { e.preventDefault(); nav(q.trim() ? `/tim-kiem?q=${encodeURIComponent(q.trim())}` : '/san-pham'); }}>
                <i className="bi bi-search"></i>
                <input type="text" placeholder="Bạn đang muốn tìm kiếm gì?" value={q} onChange={(e) => setQ(e.target.value)} />
              </form>
              {user ? (
                <Link to="/tai-khoan" className="header-icon" aria-label="Tài khoản" title={user.email || user.phone}>
                  <i className="bi bi-person-check"></i>
                </Link>
              ) : (
                <Link to="/dang-nhap" className="header-icon" aria-label="Đăng nhập"><i className="bi bi-person"></i></Link>
              )}
              <Link to="/gio-hang" className="header-icon" aria-label="Giỏ hàng">
                <i className="bi bi-cart3"></i>
                <span className="cart-count">{count}</span>
              </Link>
            </div>
          </div>

          <div className="d-md-none d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <button className="hamburger" type="button" onClick={() => setDrawer(true)} aria-label="Mở menu">
                <span className="line"></span><span className="line"></span><span className="line"></span>
              </button>
              <Link to="/" className="logo"><img src="/logo/logo-dark.png" alt="UniMate" /></Link>
            </div>
            <div className="d-flex align-items-center gap-1">
              <button className="header-icon" type="button" onClick={() => setSearchBox(true)} aria-label="Tìm kiếm">
                <i className="bi bi-search"></i>
              </button>
              <Link to="/gio-hang" className="header-icon" aria-label="Giỏ hàng">
                <i className="bi bi-cart3"></i>
                <span className="cart-count">{count}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className={`drawer-overlay ${drawer ? 'active' : ''}`} onClick={() => setDrawer(false)}></div>
      <aside className={`drawer ${drawer ? 'active' : ''}`} aria-hidden={!drawer}>
        <div className="drawer-header">
          <span className="drawer-title">MENU</span>
          <button className="drawer-close" type="button" onClick={() => setDrawer(false)} aria-label="Đóng menu">×</button>
        </div>
        <div className="drawer-body">
          <form className="drawer-search" onSubmit={(e) => { e.preventDefault(); setDrawer(false); nav(q.trim() ? `/tim-kiem?q=${encodeURIComponent(q.trim())}` : '/san-pham'); }}>
            <input type="text" placeholder="Tìm kiếm sản phẩm..." value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="submit" aria-label="Tìm"><i className="bi bi-search"></i></button>
          </form>
          <ul className="drawer-menu">
            {(shopMenu || [
              { label: 'Hàng Mới', link: '/san-pham' },
              { label: 'Bán Chạy', link: '/san-pham?sap-xep=gia-giam' },
              ...catsFull.map((c) => ({ label: c.name, link: `/san-pham?danh-muc=${c.id}` })),
              { label: 'Ưu Đãi Đặc Biệt', link: '/khuyen-mai' },
            ]).map((m, i) => (
              <li key={i}><MenuLink to={m.link} title={m.label} onClick={() => setDrawer(false)}>{m.label} <i className="bi bi-chevron-right"></i></MenuLink></li>
            ))}
            {user ? (
              <>
                <li><Link to="/tai-khoan" onClick={() => setDrawer(false)}>Tài khoản của tôi <i className="bi bi-chevron-right"></i></Link></li>
                <li><button type="button" onClick={async () => { await logout(); setDrawer(false); nav('/'); }}>Đăng xuất <i className="bi bi-chevron-right"></i></button></li>
              </>
            ) : (
              <li><Link to="/dang-nhap" onClick={() => setDrawer(false)}>Đăng nhập / Đăng ký <i className="bi bi-chevron-right"></i></Link></li>
            )}
          </ul>
        </div>
      </aside>

      <div className={`search-lightbox ${searchBox ? 'active' : ''}`}>
        <form className="search-lightbox-inner" onSubmit={(e) => { e.preventDefault(); setSearchBox(false); nav(q.trim() ? `/tim-kiem?q=${encodeURIComponent(q.trim())}` : '/san-pham'); }}>
          <input type="text" placeholder="Bạn đang muốn tìm kiếm gì?" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-search" type="submit">Tìm</button>
          <button className="btn-close-x" type="button" onClick={() => setSearchBox(false)} aria-label="Đóng">×</button>
        </form>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-wrap">
        <div className="row g-4">
          <div className="col-12 col-md-4 col-lg-3">
            <div className="footer-brand">
              <img src="/logo/logo-light.png" alt="UniMate" height="40" />
            </div>
            <div className="footer-socials">
              <a href="#" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
              <a href="#" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="#" aria-label="Tiktok"><i className="bi bi-tiktok"></i></a>
              <a href="#" aria-label="Zalo"><i className="bi bi-chat-dots"></i></a>
            </div>
          </div>
          <div className="col-6 col-md-4 col-lg-3 footer-col">
            <h6>Về UniMate</h6>
            <ul>
              <li><Link to="/san-pham">Sản phẩm</Link></li>
              <li><Link to="/khuyen-mai">Thông báo khuyến mãi</Link></li>
              <li><Link to="/tai-khoan/don-hang">Theo dõi đơn hàng</Link></li>
              <li><Link to="/tai-khoan">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>
          <div className="col-6 col-md-4 col-lg-3 footer-col">
            <h6>Chính sách</h6>
            <ul>
              <li><Link to="/thanh-toan">Chính sách Bán hàng</Link></li>
              <li><Link to="/thanh-toan">Chính sách Giao hàng</Link></li>
              <li><Link to="/tai-khoan/don-hang">Chính sách Đổi trả</Link></li>
              <li><Link to="/dang-ky">Chính sách Bảo mật</Link></li>
            </ul>
          </div>
          <div className="col-12 col-md-12 col-lg-3 footer-col">
            <h6>Liên hệ</h6>
            <ul>
              <li>Hotline: 1900 255 579</li>
              <li>Email: hotro@example.com</li>
              <li><Link to="/tai-khoan/dia-chi">Danh sách cửa hàng</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 UniMate Retail (Vietnam) Co., Ltd. All rights reserved.</span>
          <span>Giao hàng toàn quốc · Đổi trả trong 7 ngày</span>
        </div>
      </div>
    </footer>
  );
}
