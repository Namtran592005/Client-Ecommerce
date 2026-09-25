import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, fmtVND, fileUrl, errMsg } from '../api/client';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/Toast';
import { ProductCardCat } from '../components/Shop';

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
    const onScroll = () => {
      const bar = document.getElementById('pdSticky');
      if (bar) bar.classList.toggle('show', window.scrollY > 420);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          image_key: imgs[0] || null,
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
    try {
      await api.post('/reviews', { product_id: p.id, variant_id: variant?.id, ...rform, rating: Number(rform.rating) });
      toast.success('Đã gửi đánh giá, chờ duyệt');
      setRform({ rating: '5', title: '', content: '' });
    } catch (e) { toast.error(e?.response?.data?.error || 'Gửi thất bại'); }
  };

  if (!p) return <div className="pd-container text-center">Đang tải...</div>;
  const imgs = (p.images || []).map((im) => im.object_key ? fileUrl(im.object_key) : '').filter(Boolean);
  const main = imgs[img] || '';
  const price = variant?.price ?? p.base_price;

  return (
    <main className="product-detail-page">
      <div className="pd-breadcrumb-wrap">
        <nav aria-label="breadcrumb">
          <ol className="pd-breadcrumb">
            <li><Link to="/">Trang chủ</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
            <li><Link to="/san-pham">Sản phẩm</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
            {p.categories?.[0] && <li><Link to={`/san-pham?danh-muc=${p.categories[0].id}`}>{p.categories[0].name}</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>}
            <li><span className="current">{p.name}</span></li>
          </ol>
        </nav>
      </div>

      <div className="pd-container">
        <div className="row g-3 g-lg-4 justify-content-center">
          <div className="col-lg-6">
            <div className="pd-gallery">
              <div className="pd-gallery-main" onClick={() => main && setLight(true)} style={{ cursor: main ? 'zoom-in' : 'default' }}>
                {main ? <img src={main} alt={p.name} /> : <span></span>}
              </div>
              <div className="pd-thumbs">
                {imgs.map((u, i) => (
                  <button key={i} className={`pd-thumb ${i === img ? 'active' : ''}`} onClick={() => setImg(i)}>
                    <img src={u} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="pd-info">
              <h1 className="pd-name">{p.name}</h1>
              <div className="pd-meta">
                <span className="sku"><strong>SKU:</strong> {variant?.sku || p.sku || '—'}</span>
                <span>·</span>
                {variant
                  ? <span className={`stock ${variant.available_qty > 0 ? '' : 'out'}`}>{variant.available_qty > 0 ? `Còn hàng (${variant.available_qty})` : 'Hết hàng'}</span>
                  : <span className="stock out">Tạm hết hàng</span>}
                {(p.review_summary?.c > 0) && <><span>·</span><span>★ {Number(p.review_summary.avg_rating).toFixed(1)} ({p.review_summary.c} đánh giá)</span></>}
              </div>

              <div className="pd-price-block">
                <span className="pd-price">{fmtVND(price).replace('₫', '')}<small>VND</small></span>
                {p.compare_at_price > price && <span className="pd-price-old">{Number(p.compare_at_price).toLocaleString('vi-VN')}</span>}
              </div>

              <div className="pd-short-desc">{p.short_description || (p.description || '').slice(0, 220)}</div>

              {(p.variants?.length > 1) && (
                <div>
                  <div className="pd-qty-row"><span className="label">Phân loại:</span></div>
                  <div className="d-flex gap-2 flex-wrap mt-1">
                    {p.variants.map((v) => (
                      <button key={v.id} onClick={() => setVariant(v)}
                        className="btn btn-sm"
                        style={variant?.id === v.id
                          ? { background: 'var(--unimate-primary)', color: '#fff', border: '1px solid var(--unimate-primary)' }
                          : { border: '1px solid #ced4da' }}>
                        {v.name || v.sku} · {fmtVND(v.price).replace('₫', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pd-actions">
                <div className="pd-qty-row">
                  <span className="label">Số lượng:</span>
                  <div className="qty-group">
                    <button className="qty-btn" type="button" disabled={qty <= 1} aria-label="Giảm" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                    <input type="text" className="qty-input" value={qty} aria-label="Số lượng"
                      onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
                    <button className="qty-btn" type="button" aria-label="Tăng" onClick={() => setQty(qty + 1)}>+</button>
                  </div>
                </div>
                <div className="pd-buttons">
                  <button className="btn-add-cart" type="button" onClick={doAdd}>
                    <i className="bi bi-cart-plus"></i> Thêm vào giỏ
                  </button>
                  <button className="btn-buy-now" type="button" onClick={buyNow}>
                    Mua ngay
                  </button>
                  <button className="btn-wish" type="button" aria-label="Yêu thích" onClick={wish}>
                    <i className="bi bi-heart"></i>
                  </button>
                </div>
              </div>

              <div className="pd-share">
                <strong>Chia sẻ:</strong>
                <div className="share-icons">
                  <button className="fb" type="button" aria-label="Facebook" onClick={() => window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href))}><i className="bi bi-facebook"></i></button>
                  <button className="zalo" type="button" aria-label="Zalo" onClick={() => { try { navigator.clipboard.writeText(window.location.href); toast.success('Đã chép liên kết'); } catch { /* ignore */ } }}><i className="bi bi-chat-dots-fill"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pd-tabs">
          <div className="pd-tab-head">
            <button className={`pd-tab-btn ${tab === 'desc' ? 'active' : ''}`} onClick={() => setTab('desc')}>Mô tả sản phẩm</button>
            <button className={`pd-tab-btn ${tab === 'spec' ? 'active' : ''}`} onClick={() => setTab('spec')}>Thông số kỹ thuật</button>
            <button className={`pd-tab-btn ${tab === 'rev' ? 'active' : ''}`} onClick={() => setTab('rev')}>Đánh giá ({reviews.length})</button>
          </div>
          <div className={`pd-tab-panel ${tab === 'desc' ? 'active' : ''}`}>
            <div className="pd-desc"><p><strong>{p.name}</strong></p><p style={{ whiteSpace: 'pre-line' }}>{p.description || 'Đang cập nhật.'}</p></div>
          </div>
          <div className={`pd-tab-panel ${tab === 'spec' ? 'active' : ''}`}>
            <table className="pd-spec-table"><tbody>
              <tr><td>Thương hiệu</td><td>{p.brand_name || '—'}</td></tr>
              <tr><td>SKU</td><td>{variant?.sku || p.sku || '—'}</td></tr>
              <tr><td>Giá</td><td>{fmtVND(price)}</td></tr>
              <tr><td>Tồn kho</td><td>{variant ? `${variant.available_qty} sản phẩm` : '—'}</td></tr>
            </tbody></table>
          </div>
          <div className={`pd-tab-panel ${tab === 'rev' ? 'active' : ''}`}>
            {reviews.map((r) => (
              <div key={r.id} className="border-bottom py-2">
                <strong>{r.display_name || 'Khách hàng'}</strong>{' '}
                <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                {r.is_verified_purchase && <span className="badge bg-success ms-1">Đã mua</span>}
                <p className="mb-0"><b>{r.title}</b> — {r.content}</p>
              </div>
            ))}
            {reviews.length === 0 && <p className="text-muted">Chưa có đánh giá. Hãy là người đầu tiên!</p>}
            {!user ? (
              <button className="p-buy" style={{ padding: '8px 28px' }} onClick={() => nav('/dang-nhap')}>Đăng Nhập Để Viết Đánh Giá</button>
            ) : (
            <form onSubmit={sendReview} className="mt-3">
              <div className="row g-2">
                <div className="col-md-2">
                  <select className="form-select" value={rform.rating} onChange={(e) => setRform({ ...rform, rating: e.target.value })}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
                  </select>
                </div>
                <div className="col-md-10"><input className="form-control" placeholder="Tiêu đề" value={rform.title} onChange={(e) => setRform({ ...rform, title: e.target.value })} /></div>
                <div className="col-12"><textarea className="form-control" placeholder="Cảm nhận của bạn..." value={rform.content} onChange={(e) => setRform({ ...rform, content: e.target.value })} /></div>
                <div className="col-12"><button className="btn-add-cart" style={{ maxWidth: 220 }}>Gửi đánh giá</button></div>
              </div>
            </form>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="pd-related">
            <h3 className="pd-related-title">Sản phẩm liên quan</h3>
            <div className="pd-related-grid">
              {related.map((x) => <ProductCardCat key={x.id} p={x} />)}
            </div>
          </div>
        )}
      </div>

      <div className="pd-sticky-mobile" id="pdSticky">
        <span className="price-mini">{fmtVND(price).replace('₫', '')}<small>VND</small></span>
        <button className="btn-add-cart-mini" type="button" onClick={() => doAdd(false)}>Thêm vào giỏ</button>
      </div>

      {light && main && (
        <div className="pd-lightbox active" onClick={() => setLight(false)}>
          <button className="lb-close" aria-label="Đóng">×</button>
          <button className="lb-nav lb-prev" aria-label="Ảnh trước" onClick={(e) => { e.stopPropagation(); setImg((img - 1 + imgs.length) % imgs.length); }}><i className="bi bi-chevron-left" aria-hidden="true"></i></button>
          <img src={main} alt="" onClick={(e) => e.stopPropagation()} />
          <button className="lb-nav lb-next" aria-label="Ảnh sau" onClick={(e) => { e.stopPropagation(); setImg((img + 1) % imgs.length); }}><i className="bi bi-chevron-right" aria-hidden="true"></i></button>
        </div>
      )}
    </main>
  );
}
