import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, fmtVND, fileUrl, errMsg } from '../api/client';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/ui/toast';
import LazyImg from '../components/LazyImg';
import { ProductCardCat } from '../components/Shop';
import { Container } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input, Textarea, Select, Field } from '../components/ui/input';
import { Chip, Empty, QtyStepper, SectionHead, Stars } from '../components/ui/misc';

const TABS = [
  { key: 'desc', label: 'Mô tả sản phẩm' },
  { key: 'spec', label: 'Thông số kỹ thuật' },
];

export default function ProductDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [light, setLight] = useState(false);
  const [tab, setTab] = useState('desc');
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [rform, setRform] = useState({ rating: '5', title: '', content: '' });
  const [sending, setSending] = useState(false);
  const imgCount = useRef(1);
  const { add } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  const load = async () => {
    const { data } = await api.get(`/products/slug/${slug}`);
    setP(data);
    setVariant((data.variants || [])[0] || null);
    setImg(0);
    const rv = await api.get(`/products/${data.id}/reviews`).catch(() => ({ data: [] }));
    setReviews(rv.data);
    if (data.categories?.[0]) {
      const rel = await api.get('/products', { params: { category_id: data.categories[0].id, limit: 5 } }).catch(() => ({ data: { data: [] } }));
      setRelated((rel.data.data || []).filter((x) => x.id !== data.id).slice(0, 4));
    }
  };
  useEffect(() => { load(); window.scrollTo(0, 0); }, [slug]);
  useEffect(() => {
    document.body.style.overflow = light ? 'hidden' : '';
    const onKey = (e) => {
      if (!light) return;
      if (e.key === 'Escape') setLight(false);
      if (e.key === 'ArrowLeft') setImg((i) => (i - 1 + imgCount.current) % imgCount.current);
      if (e.key === 'ArrowRight') setImg((i) => (i + 1) % imgCount.current);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [light]);

  const doAdd = async () => {
    if (!variant) return toast.warning('Sản phẩm chưa có biến thể để bán');
    try {
      await add(variant.id, qty);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (e) { toast.error(errMsg(e)); }
  };

  const buyNow = () => {
    if (!variant) return toast.warning('Sản phẩm chưa có biến thể để bán');
    nav('/thanh-toan', {
      state: {
        buyNow: {
          variant_id: variant.id,
          quantity: qty,
          product_name: p.name,
          variant_name: variant.name || '',
          sku: variant.sku,
          price: variant.price,
          image_key: (p.images || [])[0]?.object_key || null,
        },
      },
    });
  };

  const wish = async () => {
    if (!user) return nav('/dang-nhap');
    try { await api.post('/cart/wishlist/items', { product_id: p.id }); toast.success('Đã thêm vào yêu thích'); }
    catch (e) { toast.warning(e?.response?.data?.error || 'Đã có trong yêu thích'); }
  };

  const sendReview = async (e) => {
    e.preventDefault();
    if (!user) return nav('/dang-nhap');
    if (!rform.content.trim()) return toast.warning('Nhập nội dung đánh giá');
    setSending(true);
    try {
      await api.post('/reviews', { product_id: p.id, variant_id: variant?.id, ...rform, rating: Number(rform.rating) });
      toast.success('Đã gửi đánh giá, chờ duyệt');
      setRform({ rating: '5', title: '', content: '' });
      const rv = await api.get(`/products/${p.id}/reviews`).catch(() => ({ data: [] }));
      setReviews(rv.data);
    } catch (e) { toast.error(e?.response?.data?.error || 'Gửi thất bại'); }
    finally { setSending(false); }
  };

  if (!p) return <Container className="py-16 text-center text-slate-500">Đang tải...</Container>;

  const imgs = (p.images || []).map((im) => im.object_key ? fileUrl(im.object_key) : '').filter(Boolean);
  imgCount.current = Math.max(1, imgs.length);
  const main = imgs[img] || '';
  const price = variant?.price ?? p.base_price;
  const inStock = (variant?.available_qty ?? 0) > 0;

  return (
      <main className="pb-24 lg:pb-6">
      <Container>
        <nav aria-label="breadcrumb" className="py-3 text-[12.5px] text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link to="/" className="hover:text-brand-500">Trang chủ</Link></li>
            <li aria-hidden="true"><i className="bi bi-chevron-right text-[10px]" /></li>
            <li><Link to="/san-pham" className="hover:text-brand-500">Sản phẩm</Link></li>
            {p.categories?.[0] && (
              <>
                <li aria-hidden="true"><i className="bi bi-chevron-right text-[10px]" /></li>
                <li>
                  <Link to={`/san-pham?danh-muc=${p.categories[0].id}`} className="hover:text-brand-500">
                    {p.categories[0].name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true"><i className="bi bi-chevron-right text-[10px]" /></li>
            <li className="line-clamp-1 font-medium text-slate-700">{p.name}</li>
          </ol>
        </nav>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {imgs.length > 1 && (
              <div className="hscroll gap-2 sm:w-[76px] sm:shrink-0 sm:flex-col sm:overflow-visible">
                {imgs.map((u, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImg(i)}
                    aria-label={`Xem ảnh ${i + 1}`}
                    aria-current={i === img}
                    className={`size-[68px] shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-colors sm:size-[76px] ${i === img ? 'border-brand-500' : 'border-line hover:border-slate-300'}`}
                  >
                    <LazyImg src={u} alt="" className="size-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => main && setLight(true)}
              aria-label="Xem ảnh lớn"
              className="flex aspect-square flex-1 cursor-zoom-in items-center justify-center overflow-hidden rounded-xl border border-line bg-white shadow-card"
            >
              {main
                ? <img src={main} alt={p.name} className="size-full object-contain p-4" />
                : <span className="text-slate-300"><i className="bi bi-image text-4xl" aria-hidden="true" /></span>}
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            <h1 className="text-[21px] font-bold leading-snug tracking-tight text-ink sm:text-[25px]">{p.name}</h1>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-slate-500">
              <span><strong className="text-slate-700">SKU:</strong> {variant?.sku || p.sku || '—'}</span>
              <Chip color={inStock ? 'green' : 'red'}>
                {variant ? (inStock ? `Còn ${variant.available_qty} sản phẩm` : 'Hết hàng') : 'Tạm hết hàng'}
              </Chip>
              {p.review_summary?.c > 0 && (
                <span className="flex items-center gap-1">
                  <Stars value={Number(p.review_summary.avg_rating)} />
                  <span className="text-slate-500">({p.review_summary.c} đánh giá)</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-2.5 rounded-xl bg-price-soft px-4 py-3">
              <span className="text-[26px] font-bold text-price">
                {fmtVND(price).replace('₫', '')}<small className="ml-0.5 text-[13px]">VND</small>
              </span>
              {p.compare_at_price > price && (
                <span className="text-[13px] text-slate-400 line-through">
                  {Number(p.compare_at_price).toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>

            {p.short_description && (
              <p className="text-[13.5px] leading-relaxed text-slate-600">
                {p.short_description || (p.description || '').slice(0, 220)}
              </p>
            )}

            {p.variants?.length > 1 && (
              <div>
                <p className="mb-2 text-[13px] font-semibold text-slate-700">
                  Phân loại <span className="font-normal text-slate-500">— chọn 1 giá trị</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setVariant(v); setQty(1); }}
                      aria-pressed={variant?.id === v.id}
                      className={`rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors ${variant?.id === v.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-500 hover:text-brand-500'}`}
                    >
                      {v.name || v.sku} · {fmtVND(v.price).replace('₫', '')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] font-semibold text-slate-700">Số lượng</span>
              <QtyStepper value={qty} min={1} max={99} onChange={setQty} />
              <Button
                variant="outline"
                size="icon"
                onClick={wish}
                aria-label="Thêm vào yêu thích"
                title="Thêm vào yêu thích"
                className="ml-auto"
              >
                <i className="bi bi-heart" aria-hidden="true" />
              </Button>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <Button variant="outline" size="lg" block onClick={doAdd} disabled={!inStock}>
                <i className="bi bi-cart-plus" aria-hidden="true" /> Thêm vào giỏ
              </Button>
              <Button size="lg" block onClick={buyNow} disabled={!inStock}>Mua ngay</Button>
            </div>

            <div className="flex items-center gap-2 border-t border-line pt-3 text-[12.5px] text-slate-500">
              <strong className="text-slate-700">Chia sẻ:</strong>
              <button
                type="button"
                aria-label="Chia sẻ Facebook"
                onClick={() => window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href))}
                className="grid size-8 place-items-center rounded-lg bg-mist transition-colors hover:bg-brand-50"
              >
                <img src="/brand/facebook.svg" alt="" className="size-4 object-contain" decoding="async" />
              </button>
              <button
                type="button"
                aria-label="Chép liên kết"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(window.location.href); toast.success('Đã chép liên kết'); }
                  catch { toast.warning('Trình duyệt chặn chép liên kết'); }
                }}
                className="grid size-8 place-items-center rounded-lg bg-mist transition-colors hover:bg-brand-50 hover:text-brand-500"
              >
                <i className="bi bi-link-45deg" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <div className="flex border-b border-line" role="tablist">
            {[...TABS, { key: 'rev', label: `Đánh giá (${reviews.length})` }].map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`border-b-2 px-4 py-3 text-[13.5px] font-semibold transition-colors sm:px-5 ${tab === t.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5">
            {tab === 'desc' && (
              <div className="text-[14px] leading-relaxed text-slate-700">
                <p className="mb-2 font-bold">{p.name}</p>
                <p className="whitespace-pre-line">{p.description || 'Đang cập nhật.'}</p>
              </div>
            )}
            {tab === 'spec' && (
              <table className="w-full text-[13.5px]">
                <tbody>
                  {[
                    ['Thương hiệu', p.brand_name || '—'],
                    ['SKU', variant?.sku || p.sku || '—'],
                    ['Giá', fmtVND(price)],
                    ['Tồn kho', variant ? `${variant.available_qty} sản phẩm` : '—'],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-line last:border-0">
                      <td className="w-40 py-2.5 font-semibold text-slate-600">{k}</td>
                      <td className="py-2.5 text-slate-800">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'rev' && (
              <div className="grid gap-4">
                {reviews.length === 0 && (
                  <Empty icon="bi-star" title="Chưa có đánh giá" desc="Hãy là người đầu tiên đánh giá sản phẩm này." />
                )}
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-line pb-3 last:border-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-[13.5px] text-ink">{r.display_name || 'Khách hàng'}</strong>
                      <Stars value={r.rating} />
                      {r.is_verified_purchase && <Chip color="green">Đã mua</Chip>}
                    </div>
                    <p className="mt-1 text-[13.5px] text-slate-600">
                      {r.title && <b className="text-slate-800">{r.title} — </b>}
                      {r.content}
                    </p>
                  </div>
                ))}

                {!user ? (
                  <div>
                    <Button variant="outline" onClick={() => nav('/dang-nhap')}>Đăng nhập để viết đánh giá</Button>
                  </div>
                ) : (
                  <form onSubmit={sendReview} className="grid gap-3 border-t border-line pt-4">
                    <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                      <Field label="Chấm điểm">
                        <Select value={rform.rating} onChange={(e) => setRform({ ...rform, rating: e.target.value })}>
                          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
                        </Select>
                      </Field>
                      <Field label="Tiêu đề">
                        <Input value={rform.title} onChange={(e) => setRform({ ...rform, title: e.target.value })} placeholder="Tóm tắt cảm nhận" />
                      </Field>
                    </div>
                    <Field label="Nội dung" required>
                      <Textarea value={rform.content} onChange={(e) => setRform({ ...rform, content: e.target.value })} placeholder="Chia sẻ trải nghiệm của bạn..." />
                    </Field>
                    <div>
                      <Button type="submit" disabled={sending}>{sending ? 'Đang gửi...' : 'Gửi đánh giá'}</Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-8">
            <SectionHead title="Sản phẩm liên quan" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {related.map((x) => <ProductCardCat key={x.id} p={x} />)}
            </div>
          </div>
        )}
      </Container>

      {light && main && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh lớn"
          onClick={() => setLight(false)}
        >
          <button
            type="button"
            onClick={() => setLight(false)}
            aria-label="Đóng"
            className="absolute top-4 right-4 grid size-10 place-items-center rounded-lg text-2xl text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
          {imgs.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImg((img - 1 + imgs.length) % imgs.length); }}
                aria-label="Ảnh trước"
                className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20 sm:left-6"
              >
                <i className="bi bi-chevron-left" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setImg((img + 1) % imgs.length); }}
                aria-label="Ảnh sau"
                className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20 sm:right-6"
              >
                <i className="bi bi-chevron-right" aria-hidden="true" />
              </button>
            </>
          )}
          <img src={main} alt={p.name} onClick={(e) => e.stopPropagation()} className="max-h-[88vh] max-w-full object-contain" />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <span className="shrink-0 text-[15px] font-bold text-price">
          {fmtVND(price).replace('₫', '')}<small className="ml-0.5 text-[11px]">VND</small>
        </span>
        <Button variant="outline" block onClick={doAdd} disabled={!inStock}>
          <i className="bi bi-cart-plus" aria-hidden="true" /> Thêm vào giỏ
        </Button>
      </div>
    </main>
  );
}
