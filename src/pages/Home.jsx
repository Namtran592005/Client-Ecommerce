import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../api/client';
import { ProductCardHome } from '../components/Shop';
import HeroSlider from '../components/HeroSlider';
import { useSlider, Container } from '../components/Layout';
import { SectionHead } from '../components/ui/misc';

const Arrow = ({ dir, show, onClick, label }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className={`absolute top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-500 shadow-pop transition-all hover:bg-brand-500 hover:text-white lg:grid ${show ? 'opacity-100' : 'pointer-events-none opacity-0'} ${dir === 'prev' ? '-left-4' : '-right-4'}`}
  >
    <i className={`bi bi-chevron-${dir}`} aria-hidden="true" />
  </button>
);

// Fade hai đầu, chỉ hiện khi phía đó còn nội dung để cuộn tới
const Fade = ({ dir, show }) => show ? (
  <span
    aria-hidden="true"
    className={`pointer-events-none absolute top-0 bottom-0 z-10 w-8 from-white ${dir === 'left' ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'}`}
  />
) : null;

function ProductSlider({ items, badge }) {
  const s = useSlider();
  return (
    <div className="relative">
      <Fade dir="left" show={s.canPrev} />
      <Fade dir="right" show={s.canNext} />
      <Arrow dir="left" show={s.canPrev} onClick={s.prev} label="Sản phẩm trước" />
      <div ref={s.trackRef} className="hscroll gap-3 pb-1">
        {items.map((p) => (
          <div key={p.id} className="w-[168px] shrink-0 sm:w-[196px] lg:w-[212px]">
            <ProductCardHome p={p} badge={badge} />
          </div>
        ))}
      </div>
      <Arrow dir="right" show={s.canNext} onClick={s.next} label="Sản phẩm sau" />
    </div>
  );
}

function QuickCatalog({ cats }) {
  const qc = useSlider();
  return (
    <section className="border-y border-line bg-white py-4">
      <Container>
        <div className="relative">
          <Fade dir="left" show={qc.canPrev} />
          <Fade dir="right" show={qc.canNext} />
          <Arrow dir="left" show={qc.canPrev} onClick={qc.prev} label="Danh mục trước" />
          <div ref={qc.trackRef} className="hscroll gap-2.5">
            {cats.map((c) => (
              <Link
                key={c.id}
                to={`/san-pham?danh-muc=${c.id}`}
                title={c.name}
                className={`flex w-[76px] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-line bg-white px-1.5 py-2.5 transition-colors hover:border-brand-500 hover:bg-brand-50 ${c.depth ? 'ml-5' : ''}`}
              >
                <span className="grid size-[52px] place-items-center overflow-hidden rounded-lg bg-mist">
                  {c.image_key ? (
                    <img src={fileUrl(c.image_key)} alt="" loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-brand-500">{c.name[0]}</span>
                  )}
                </span>
                <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-tight text-slate-600">{c.name}</span>
              </Link>
            ))}
          </div>
          <Arrow dir="right" show={qc.canNext} onClick={qc.next} label="Danh mục sau" />
        </div>
      </Container>
    </section>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [best, setBest] = useState([]);
  const [cats, setCats] = useState([]);
  const [banners, setBanners] = useState([]);

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
    <div>
      <HeroSlider slides={banners} />
      <QuickCatalog cats={allCats} />

      <Container className="py-6 sm:py-8">
        <SectionHead title="Sản phẩm mới về" to="/san-pham" />
        <ProductSlider items={featured} badge="Mới" />
      </Container>

      <Container className="pb-8">
        <SectionHead title="Sản phẩm bán chạy" to="/san-pham?sap-xep=gia-giam" more="Xem bán chạy" />
        <ProductSlider items={best} />
      </Container>
    </div>
  );
}
