import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Carousel } from 'bootstrap';
import { api } from '../api/client';
import { ProductCardHome } from '../components/Shop';
import { useSlider } from '../components/Layout';

function ProductSlider({ items, badge }) {
  const s = useSlider();
  return (
    <div className="slider-wrap" data-slider>
      <button className={`slider-arrow prev ${!s.canPrev ? 'hidden' : ''}`} type="button" aria-label="Trước" onClick={s.prev}>
        <i className="bi bi-chevron-left"></i>
      </button>
      <div className="product-grid" ref={s.trackRef}>
        {items.map((p) => <ProductCardHome key={p.id} p={p} badge={badge} />)}
      </div>
      <button className={`slider-arrow next ${!s.canNext ? 'hidden' : ''}`} type="button" aria-label="Sau" onClick={s.next}>
        <i className="bi bi-chevron-right"></i>
      </button>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [best, setBest] = useState([]);
  const [cats, setCats] = useState([]);
  const [banners, setBanners] = useState([]);
  const [active, setActive] = useState(0);
  const carRef = useRef(null);
  const carInst = useRef(null);
  const qc = useSlider();

  useEffect(() => {
    api.get('/products', { params: { limit: 10 } }).then((r) => {
      setFeatured(r.data.data.slice(0, 8));
      setBest([...r.data.data].reverse().slice(0, 8));
    }).catch(() => {});
    api.get('/categories/tree').then((r) => setCats(r.data)).catch(() => {});
    // Slide lay tu banner admin (anh that); chua co thi hien placeholder
    api.get('/banners').then(async (r) => {
      const list = (r.data || []).slice(0, 5);
      const withUrl = await Promise.all(list.map(async (b) => {
        if (!b.image_media_id) return { ...b, url: '' };
        try {
          const u = await api.get(`/media/${b.image_media_id}/url`);
          return { ...b, url: u.data.url };
        } catch { return { ...b, url: '' }; }
      }));
      setBanners(withUrl);
    }).catch(() => {});
  }, []);

  const bannerLink = (b) => {
    const u = b.link_url || '';
    if (u.startsWith('http')) return u;
    if (u.startsWith('/')) return u;
    return '/san-pham';
  };
  const slides = banners.length ? banners : [];

  useEffect(() => {
    const el = carRef.current;
    if (!el || slides.length < 2) return undefined;
    const inst = new Carousel(el, { interval: 5500, ride: 'carousel', touch: true, wrap: true, pause: false });
    carInst.current = inst;
    const onSlid = (e) => {
      const items = [...el.querySelectorAll('.carousel-item')];
      setActive(Math.max(0, items.indexOf(e.target)));
    };
    el.addEventListener('slid.bs.carousel', onSlid);
    return () => {
      el.removeEventListener('slid.bs.carousel', onSlid);
      inst.dispose();
      carInst.current = null;
    };
  }, [slides.length]);

  return (
    <>
      <section className="banner-slider">
        <div className="carousel slide" ref={carRef} key={slides.map((s) => s.id).join('-')}>
          <div className="carousel-indicators">
            {slides.map((s, i) => (
              <button
                key={s.id || i}
                type="button"
                className={i === active ? 'active' : ''}
                aria-label={`Ảnh ${i + 1}`}
                onClick={() => carInst.current?.to(i)}
              ></button>
            ))}
          </div>
          <div className="carousel-inner">
            {slides.map((s, i) => {
              const to = bannerLink(s);
              const inner = s.url
                ? <img src={s.url} alt={s.alt_text || s.title || ''} loading={i === 0 ? 'eager' : 'lazy'} />
                : <span className="d-flex align-items-center justify-content-center w-100 text-white fw-bold"
                    style={{ aspectRatio: '1352/480', background: 'linear-gradient(120deg,#0b3d9e,#2f7fd0)', fontSize: 28 }}>
                    {s.title || 'UniMate'}
                  </span>;
              return (
                <div className={`carousel-item ${i === active ? 'active' : ''}`} key={s.id || i}>
                  {to.startsWith('http')
                    ? <a className="d-block" href={to} target="_blank" rel="noreferrer">{inner}</a>
                    : <Link className="d-block" to={to}>{inner}</Link>}
                </div>
              );
            })}
          </div>
          {slides.length > 1 && (
            <>
              <button className="carousel-control-prev" type="button" aria-label="Ảnh trước"
                onClick={() => carInst.current?.prev()}>
                <span className="carousel-control-prev-icon"></span>
              </button>
              <button className="carousel-control-next" type="button" aria-label="Ảnh sau"
                onClick={() => carInst.current?.next()}>
                <span className="carousel-control-next-icon"></span>
              </button>
            </>
          )}
        </div>
      </section>

      <section className="mt-4 mt-md-5">
        <div className="section-wrap">
          <div className="slider-wrap" data-slider>
            <button className={`slider-arrow qc-arrow prev ${!qc.canPrev ? 'hidden' : ''}`} type="button" aria-label="Trước" onClick={qc.prev}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="quick-catalog-track" ref={qc.trackRef}>
              {cats.map((c) => (
                <Link key={c.id} to={`/san-pham?danh-muc=${c.id}`} className="qc-item">
                  <div className="qc-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef4fb' }}>
                    {c.icon
                      ? <i className={`bi ${c.icon}`} style={{ fontSize: 34, color: 'var(--unimate-primary)' }}></i>
                      : <span className="text-white fw-bold" style={{ fontSize: 28 }}>{c.name[0]}</span>}
                  </div>
                  <span className="qc-label">{c.name}</span>
                </Link>
              ))}
            </div>
            <button className={`slider-arrow qc-arrow next ${!qc.canNext ? 'hidden' : ''}`} type="button" aria-label="Sau" onClick={qc.next}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="section-wrap">
          <div className="section-head">
            <h3 className="section-title mb-0"><Link to="/san-pham" className="text-decoration-none text-dark">Sản Phẩm Mới Về</Link></h3>
            <Link to="/san-pham" className="more">Xem Thêm</Link>
          </div>
          <ProductSlider items={featured} badge="Mới" />
        </div>
      </section>

      <section className="mt-5">
        <div className="section-wrap">
          <div className="section-head">
            <h3 className="section-title mb-0"><Link to="/san-pham" className="text-decoration-none text-dark">Sản phẩm bán chạy</Link></h3>
            <Link to="/san-pham" className="more">Xem Thêm</Link>
          </div>
          <ProductSlider items={best} />
        </div>
      </section>
    </>
  );
}
