import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Container } from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Empty } from '../components/ui/misc';

export function usePageContent() {
  const [map, setMap] = useState({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api.get('/settings/public')
      .then((r) => {
        const m = {};
        (r.data || []).forEach((row) => { m[row.setting_key] = row.setting_value; });
        setMap(m);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  return { map, ready };
}

const Crumb = ({ title }) => (
  <nav aria-label="breadcrumb" className="py-3 text-[12.5px] text-slate-500">
    <ol className="flex items-center gap-1.5">
      <li><Link to="/" className="hover:text-brand-500">Trang chủ</Link></li>
      <li aria-hidden="true"><i className="bi bi-chevron-right text-[10px]" /></li>
      <li className="font-medium text-slate-700">{title}</li>
    </ol>
  </nav>
);

const POLICIES = [
  { key: 'sales', slug: 'ban-hang', title: 'Chính sách bán hàng' },
  { key: 'shipping', slug: 'giao-hang', title: 'Chính sách giao hàng' },
  { key: 'returns', slug: 'doi-tra', title: 'Chính sách đổi trả' },
  { key: 'security', slug: 'bao-mat', title: 'Chính sách bảo mật' },
];

const POLICY_ICON = {
  sales: 'bi-bag-check', shipping: 'bi-truck', returns: 'bi-arrow-left-right', security: 'bi-shield-check',
};

export function PolicyPage({ slug }) {
  const meta = POLICIES.find((p) => p.slug === slug);
  const { map, ready } = usePageContent();
  const doc = meta ? map[`page.policy.${meta.key}`] : null;

  if (!meta) {
    return (
      <Container>
        <Empty title="Không tìm thấy trang" desc="Chính sách bạn tìm không tồn tại." action={<Link to="/" className="text-[13px] font-semibold text-brand-500">Về trang chủ</Link>} />
      </Container>
    );
  }

  return (
    <main className="pb-12">
      <Container>
        <Crumb title={doc?.heading || meta.title} />
        <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">
          {doc?.heading || meta.title}
        </h1>
        {doc?.intro && <p className="mt-2 max-w-3xl text-[14px] text-slate-600">{doc.intro}</p>}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_240px]">
          <Card>
            <CardContent className="p-4 sm:p-5">
              {!ready ? (
                <p className="text-[13.5px] text-slate-500">Đang tải nội dung...</p>
              ) : (doc?.sections || []).length === 0 ? (
                <Empty title="Nội dung đang được cập nhật" desc="Quay lại sau ít phút." />
              ) : (
                <div className="grid gap-5">
                  {doc.sections.map((s, i) => (
                    <section key={i}>
                      {s.h && <h2 className="mb-1.5 text-[15px] font-bold text-ink">{s.h}</h2>}
                      {s.p && <p className="text-[13.5px] leading-relaxed whitespace-pre-line text-slate-600">{s.p}</p>}
                    </section>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <nav aria-label="Danh sách chính sách" className="grid gap-1">
              {POLICIES.map((p) => (
                <Link
                  key={p.slug}
                  to={`/chinh-sach/${p.slug}`}
                  aria-current={p.slug === slug ? 'page' : undefined}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                    p.slug === slug ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-600'
                  }`}
                >
                  <i className={`bi ${POLICY_ICON[p.key]} text-[15px]`} aria-hidden="true" />
                  {p.title}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      </Container>
    </main>
  );
}

export function FaqPage() {
  const { map, ready } = usePageContent();
  const list = map['page.faq'] || [];

  return (
    <main className="pb-12">
      <Container>
        <Crumb title="Câu hỏi thường gặp" />
        <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">Câu hỏi thường gặp</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-slate-500">
          Những điều khách hàng hỏi nhiều nhất về đặt hàng, giao hàng và đổi trả.
        </p>

        <div className="mt-6 grid gap-3">
          {!ready ? (
            <p className="text-[13.5px] text-slate-500">Đang tải nội dung...</p>
          ) : list.length === 0 ? (
            <Empty title="Chưa có câu hỏi" desc="Nội dung đang được cập nhật." />
          ) : list.map((f, i) => (
            <details key={i} className="group rounded-xl border border-line bg-white shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[14px] font-semibold text-ink marker:hidden">
                {f.q}
                <i className="bi bi-chevron-down shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="border-t border-line px-4 py-3.5">
                <p className="text-[13.5px] leading-relaxed whitespace-pre-line text-slate-600">{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </Container>
    </main>
  );
}

export function AboutPage() {
  const { map, ready } = usePageContent();
  const about = map['page.about'] || {};
  const stores = map['page.stores'] || [];

  return (
    <main className="pb-12">
      <Container>
        <Crumb title={about.heading || 'Giới thiệu'} />
        <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">
          {about.heading || 'Giới thiệu UniMate'}
        </h1>
        {!ready ? (
          <p className="mt-4 text-[13.5px] text-slate-500">Đang tải nội dung...</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {about.intro && (
              <p className="max-w-3xl text-[14px] leading-relaxed text-slate-700">{about.intro}</p>
            )}
            {about.body && (
              <p className="max-w-3xl text-[13.5px] leading-relaxed whitespace-pre-line text-slate-600">{about.body}</p>
            )}
          </div>
        )}

        <h2 className="mt-8 mb-3 text-[17px] font-bold tracking-tight text-ink sm:text-[19px]">
          Danh sách cửa hàng
        </h2>
        {!ready ? (
          <p className="text-[13.5px] text-slate-500">Đang tải nội dung...</p>
        ) : stores.length === 0 ? (
          <Empty title="Chưa có cửa hàng" desc="Danh sách cửa hàng đang được cập nhật." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {stores.map((s, i) => (
              <Card key={i} className="overflow-hidden">
                {s.image ? (
                  <img src={s.image} alt={s.name} loading="lazy" className="h-44 w-full object-cover object-top" />
                ) : (
                  <span className="grid h-40 w-full place-items-center bg-gradient-to-br from-brand-600 to-brand-400 text-[28px] font-bold text-white">
                    {(s.name || '?').trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <CardContent className="p-4">
                  <h3 className="text-[15px] font-bold text-ink">{s.name}</h3>
                  <ul className="mt-2 grid gap-1.5 text-[13.5px] text-slate-600">
                    {s.address && (
                      <li className="flex items-start gap-2">
                        <i className="bi bi-geo-alt mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
                        <span>{s.address}</span>
                      </li>
                    )}
                    {s.phone && (
                      <li className="flex items-center gap-2">
                        <i className="bi bi-telephone shrink-0 text-brand-500" aria-hidden="true" />
                        <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="hover:text-brand-600">{s.phone}</a>
                      </li>
                    )}
                    {s.hours && (
                      <li className="flex items-start gap-2">
                        <i className="bi bi-clock mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
                        <span>{s.hours}</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
