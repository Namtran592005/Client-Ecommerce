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
          <div ref={qc.trackRef} className="hscroll gap-1 sm:gap-2.5">
            {cats.map((c) => (
              <Link
                key={c.id}
                to={`/san-pham?danh-muc=${c.id}`}
                title={c.name}
                className={`group flex w-[60px] shrink-0 flex-col items-center gap-1.5 sm:w-[84px] ${c.depth ? 'ml-3 sm:ml-5' : ''}`}
              >
                <span className="block w-full overflow-hidden rounded-xl bg-mist transition-transform duration-200 group-hover:scale-105 group-focus-visible:scale-105">
                  {c.image_key ? (
                    <img
                      src={fileUrl(c.image_key)}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <span className="grid aspect-square w-full place-items-center text-lg font-bold text-brand-500">
                      {c.name[0]}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 w-full text-center text-[11px] leading-tight text-slate-600 transition-colors group-hover:text-brand-600 sm:text-[11.5px]">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
          <Arrow dir="right" show={qc.canNext} onClick={qc.next} label="Danh mục sau" />
        </div>
      </Container>
    </section>
  );
}

const MAX_CATEGORY_ROWS = 4;

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [best, setBest] = useState([]);
  const [cats, setCats] = useState([]);
  const [banners, setBanners] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/products', { params: { limit: 10 } }).then((r) => {
      setFeatured(r.data.data.slice(0, 8));
      setBest([...r.data.data].reverse().slice(0, 8));
    }).catch(() => {});
    api.get('/categories/tree').then((r) => {
      setCats(r.data);
      const roots = r.data.slice(0, MAX_CATEGORY_ROWS);
      Promise.all(roots.map((c) => {
        const ids = [c.id, ...(c.children || []).map((k) => k.id)].join(',');
        return api.get('/products', { params: { category_ids: ids, limit: 10 } })
          .then((x) => ({ id: c.id, name: c.name, items: (x.data.data || []).slice(0, 8) }))
          .catch(() => ({ id: c.id, name: c.name, items: [] }));
      })).then((list) => setRows(list.filter((x) => x.items.length)));
    }).catch(() => {});
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

      {rows.map((row) => (
        <Container key={row.id} className="pb-8">
          <SectionHead title={row.name} to={`/san-pham?danh-muc=${row.id}`} more={`Xem tất cả ${row.name.toLowerCase()}`} />
          <ProductSlider items={row.items} />
        </Container>
      ))}
    </div>
  );
}
