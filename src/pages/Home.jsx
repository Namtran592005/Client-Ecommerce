import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ProductCardHome } from '../components/Shop';
import HeroSlider from '../components/HeroSlider';
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
  const qc = useSlider();

  useEffect(() => {
    api.get('/products', { params: { limit: 10 } }).then((r) => {
      setFeatured(r.data.data.slice(0, 8));
      setBest([...r.data.data].reverse().slice(0, 8));
    }).catch(() => {});
    api.get('/categories/tree').then((r) => setCats(r.data)).catch(() => {});
    const mediaUrl = (id) => (id ? api.get(`/media/${id}/url`).then((r) => r.data.url).catch(() => '') : Promise.resolve(''));
    api.get('/banners').then(async (r) => {
      const list = (r.data || []).slice(0, 6);
      const resolved = await Promise.all(list.map(async (b) => {
        const [url, mobileUrl] = await Promise.all([mediaUrl(b.image_media_id), mediaUrl(b.mobile_image_media_id)]);
        return { ...b, url, mobileUrl };
      }));
      setBanners(resolved.filter((b) => b.url));
    }).catch(() => {});
  }, []);

  const allCats = [];
  for (const root of cats) {
    allCats.push({ ...root, depth: 0 });
    for (const child of root.children || []) allCats.push({ ...child, depth: 1 });
  }

  return (
    <>
      <div className="banner-wrap">
        <HeroSlider slides={banners} />
      </div>

      <section className="cat-strip-section">
        <div className="section-wrap">
          <div className="slider-wrap" data-slider>
            <button className={`slider-arrow qc-arrow prev ${!qc.canPrev ? 'hidden' : ''}`} type="button" aria-label="Trước" onClick={qc.prev}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <div className="quick-catalog-track" ref={qc.trackRef}>
              {allCats.map((c) => (
                <Link key={c.id} to={`/san-pham?danh-muc=${c.id}`} className={`qc-item${c.depth ? ' is-child' : ''}`}>
                  <div className="qc-thumb">
                    {c.icon
                      ? <i className={`bi ${c.icon}`}></i>
                      : <span className="qc-initial">{c.name[0]}</span>}
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
