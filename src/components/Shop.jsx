import { Link, useNavigate } from 'react-router-dom';
import { fmtVND, fileUrl, api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { toast } from './Toast';
import { Button } from './ui/button';
import { Stars } from './ui/misc';

// Bấm "Mua ngay" ngoài thẻ: 1 biến thể -> thêm thẳng giỏ; nhiều biến thể -> qua trang chọn
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
  } catch { nav(`/san-pham/${p.slug}`); }
}

export function imgOf(p, i = 0) {
  const imgs = p.images || [];
  if (imgs[i]?.object_key) return fileUrl(imgs[i].object_key);
  return '';
}

function Thumb({ p, size = 28, children }) {
  const src = imgOf(p);
  return (
    <div className="relative overflow-hidden rounded-t-xl bg-[#f8fafc]">
      <Link to={`/san-pham/${p.slug}`} className="block aspect-square">
        {src ? (
          <img
            src={src}
            alt={p.name}
            loading="lazy"
            className="size-full object-contain p-2 transition-transform duration-200 hover:scale-[1.04]"
          />
        ) : (
          <span
            className="grid size-full place-items-center font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#0b3d9e,#2f7fd0)', fontSize: size }}
          >
            {p.name[0]}
          </span>
        )}
      </Link>
      {children}
    </div>
  );
}

const Price = ({ p, className = '' }) => {
  const off = p.compare_at_price > p.base_price;
  return (
    <div className={`flex flex-wrap items-baseline gap-x-1.5 ${className}`}>
      <span className="text-[15px] font-bold text-price">
        {fmtVND(p.base_price).replace('₫', '')}<small className="ml-0.5 text-[11px] font-semibold">VND</small>
      </span>
      {off && (
        <span className="text-[11px] text-slate-400 line-through">
          {Number(p.compare_at_price).toLocaleString('vi-VN')}₫
        </span>
      )}
    </div>
  );
};

// Thẻ sản phẩm — trang chủ
export function ProductCardHome({ p, badge }) {
  const nav = useNavigate();
  const { add } = useCart();
  return (
    <article className="product-card flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition-shadow hover:shadow-pop">
      <Thumb p={p}>
        {badge && (
          <span className="absolute top-2 left-2 rounded-md bg-accent-500 px-1.5 py-0.5 text-[10.5px] font-bold text-brand-900">
            {badge}
          </span>
        )}
      </Thumb>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <Link
          to={`/san-pham/${p.slug}`}
          className="line-clamp-2 min-h-[34px] text-[12.5px] leading-snug text-slate-700 transition-colors hover:text-brand-500"
        >
          {p.name}
        </Link>
        <Price p={p} />
        <Button size="sm" block className="mt-auto" onClick={() => quickAdd(p, add, nav)}>Mua ngay</Button>
      </div>
    </article>
  );
}

// Thẻ sản phẩm — trang danh mục (có nút yêu thích + điểm đánh giá)
export function ProductCardCat({ p }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const off = p.compare_at_price > p.base_price ? Math.round((1 - p.base_price / p.compare_at_price) * 100) : 0;

  const wish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return nav('/dang-nhap');
    try {
      await api.post('/cart/wishlist/items', { product_id: p.id });
      toast.success('Đã thêm vào yêu thích');
    } catch (err) {
      toast.warning(err?.response?.data?.error || 'Đã có trong yêu thích');
    }
  };

  return (
    <article className="product-card-cat flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition-shadow hover:shadow-pop">
      <Thumb p={p} size={32}>
        {off > 0 ? (
          <span className="absolute top-2 left-2 rounded-md bg-price px-1.5 py-0.5 text-[10.5px] font-bold text-white">-{off}%</span>
        ) : (
          <span className="absolute top-2 left-2 rounded-md bg-accent-500 px-1.5 py-0.5 text-[10.5px] font-bold text-brand-900">Mới</span>
        )}
        <button
          type="button"
          onClick={wish}
          aria-label={`Yêu thích ${p.name}`}
          className="absolute top-2 right-2 grid size-8 place-items-center rounded-lg bg-white/90 text-slate-500 shadow-sm transition-colors hover:text-price"
        >
          <i className="bi bi-heart" aria-hidden="true" />
        </button>
      </Thumb>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          to={`/san-pham/${p.slug}`}
          className="line-clamp-2 min-h-[36px] text-[13px] leading-snug text-slate-700 transition-colors hover:text-brand-500"
        >
          {p.name}
        </Link>
        {p.rating_avg > 0 && <Stars value={p.rating_avg} count={p.rating_count} />}
        <Price p={p} className="mt-auto" />
        <Button size="sm" block onClick={() => quickAdd(p, add, nav)}>Mua ngay</Button>
      </div>
    </article>
  );
}

export function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const nums = [];
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n++) nums.push(n);
  const btn = 'grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm text-slate-600 transition-colors hover:border-brand-500 hover:text-brand-500 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600';
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Phân trang">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">‹</button>
      {nums[0] > 1 && <button className={btn} onClick={() => onChange(1)}>1</button>}
      {nums.map((n) => (
        <button
          key={n}
          aria-current={n === page ? 'page' : undefined}
          className={`${btn} ${n === page ? 'border-brand-500 bg-brand-500 font-bold text-white hover:text-white' : ''}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
      {nums[nums.length - 1] < totalPages && <button className={btn} onClick={() => onChange(totalPages)}>{totalPages}</button>}
      <button className={btn} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau">›</button>
    </nav>
  );
}
