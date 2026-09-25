import { Link, useNavigate } from 'react-router-dom';
import { fmtVND, fileUrl } from '../api/client';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { toast } from './Toast';

// Bấm "Mua Hàng" ngoài thẻ: 1 biến thể -> thêm thẳng vào giỏ; nhiều biến thể -> qua trang chọn
async function quickAdd(p, add, nav) {
  try {
    const { data } = await api.get(`/products/${p.id}`);
    const act = (data.variants || []).filter((v) => v.status === 'active');
    if (act.length === 1) {
      await add(act[0].id, 1);
      toast.success(`Đã thêm "${p.name}" vào giỏ hàng`);
    } else {
      nav(`/san-pham/${p.slug}`);
    }
  } catch (e) { nav(`/san-pham/${p.slug}`); }
}

export function imgOf(p, i = 0) {
  const imgs = p.images || [];
  if (imgs[i]?.object_key) return fileUrl(imgs[i].object_key);
  return '';
}

// Thẻ SP slider trang chủ (mẫu gốc)
export function ProductCardHome({ p, badge }) {
  const nav = useNavigate();
  const { add } = useCart();
  return (
    <div className="product-card">
      <div className="thumb">
        {badge && <span className="label-new">{badge}</span>}
        <Link to={`/san-pham/${p.slug}`}>
          {imgOf(p)
            ? <img src={imgOf(p)} alt={p.name} loading="lazy" />
            : <span className="d-flex align-items-center justify-content-center w-100 h-100 text-white fw-bold" style={{ background: 'linear-gradient(135deg,#0b3d9e,#2f7fd0)', fontSize: 28, aspectRatio: '1/1' }}>{p.name[0]}</span>}
        </Link>
      </div>
      <div className="info">
        <Link to={`/san-pham/${p.slug}`} className="p-name">{p.name}</Link>
        <div className="p-price">{fmtVND(p.base_price).replace('₫', '')}<small>VND</small></div>
        <button className="p-buy" onClick={() => quickAdd(p, add, nav)}>Mua Hàng</button>
      </div>
    </div>
  );
}

// Thẻ SP trang danh mục (mẫu gốc: tim + giá cũ)
export function ProductCardCat({ p }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const off = p.compare_at_price > p.base_price ? Math.round((1 - p.base_price / p.compare_at_price) * 100) : 0;
  const wish = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return nav('/dang-nhap');
    try { await api.post('/cart/wishlist/items', { product_id: p.id }); toast.success('Đã thêm vào yêu thích'); }
    catch (err) { toast.warning(err?.response?.data?.error || 'Đã có trong yêu thích'); }
  };
  return (
    <article className="product-card-cat">
      <div className="thumb">
        {off > 0 ? <span className="label-discount">-{off}%</span> : <span className="label-new">Mới</span>}
        <button className="wishlist-btn" aria-label="Yêu thích" onClick={wish}><i className="bi bi-heart"></i></button>
        <Link to={`/san-pham/${p.slug}`}>
          {imgOf(p)
            ? <img src={imgOf(p)} alt={p.name} loading="lazy" />
            : <span className="d-flex align-items-center justify-content-center w-100 h-100 text-white fw-bold" style={{ background: 'linear-gradient(135deg,#0b3d9e,#2f7fd0)', fontSize: 32, aspectRatio: '1/1' }}>{p.name[0]}</span>}
        </Link>
      </div>
      <div className="info">
        <Link to={`/san-pham/${p.slug}`} className="p-name">{p.name}</Link>
        <div className="p-price">{fmtVND(p.base_price).replace('₫', '')}<small>VND</small>
          {p.compare_at_price > p.base_price && <span className="p-price-old">{Number(p.compare_at_price).toLocaleString('vi-VN')}</span>}
        </div>
        <button className="p-buy" onClick={() => quickAdd(p, add, nav)}>Mua Hàng</button>
      </div>
    </article>
  );
}

// Khung slider mẫu gốc (children là .product-card / .qc-item)
export function HSlider({ children }) {
  return <>{children}</>;
}

// Tiêu đề section mẫu gốc
export function SectionHead({ title, to, more }) {
  return (
    <div className="section-head">
      <h3 className="section-title mb-0"><Link to={to} className="text-decoration-none text-dark">{title}</Link></h3>
      <Link to={to} className="more">{more || 'Xem Thêm'}</Link>
    </div>
  );
}

// Phân trang mẫu gốc
export function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const nums = [];
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n++) nums.push(n);
  return (
    <div className="pagination-wrap">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>‹</button>
      {nums[0] > 1 && <button onClick={() => onChange(1)}>1</button>}
      {nums.map((n) => <button key={n} className={n === page ? 'active' : ''} onClick={() => onChange(n)}>{n}</button>)}
      {nums[nums.length - 1] < totalPages && <button onClick={() => onChange(totalPages)}>{totalPages}</button>}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>›</button>
    </div>
  );
}
