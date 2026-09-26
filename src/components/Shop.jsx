import { Link, useNavigate } from 'react-router-dom';
import { fmtVND, fileUrl, api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { toast } from './ui/toast';
import { Button } from './ui/button';
import { Stars } from './ui/misc';
import { cn } from '../lib/utils';
import LazyImg from './LazyImg';

export function imgOf(p, i = 0) {
  const imgs = p.images || [];
  if (imgs[i]?.object_key) return fileUrl(imgs[i].object_key);
  return '';
}

function Thumb({ p, size = 28, priority = false, children }) {
  const src = imgOf(p);
  return (
    <div className="relative overflow-hidden rounded-t-xl bg-[#f8fafc]">
      <Link to={`/san-pham/${p.slug}`} className="block aspect-square">
        {src ? (
          <LazyImg
            src={src}
            alt={p.name}
            eager={priority}
            fetchPriority={priority ? 'high' : 'auto'}
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
export function ProductCardHome({ p, badge, priority = false }) {
  const nav = useNavigate();
  return (
    <article className="product-card flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition-shadow hover:shadow-pop">
      <Thumb p={p} priority={priority}>
        {badge && (
          <span className="absolute top-2 left-2 rounded-md bg-price px-1.5 py-0.5 text-[10.5px] font-semibold text-white">
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
        <Button size="sm" block className="mt-auto" onClick={() => nav(`/san-pham/${p.slug}`)}>Mua ngay</Button>
      </div>
    </article>
  );
}

// Thẻ sản phẩm — trang danh mục (có nút yêu thích + điểm đánh giá)
export function ProductCardCat({ p, priority = false }) {
  const nav = useNavigate();
  const { user } = useAuth();
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
      <Thumb p={p} size={32} priority={priority}>
        {off > 0 ? (
          <span className="absolute top-2 left-2 rounded-md bg-price px-1.5 py-0.5 text-[10.5px] font-bold text-white">-{off}%</span>
        ) : (
          <span className="absolute top-2 left-2 rounded-md bg-price px-1.5 py-0.5 text-[10.5px] font-semibold text-white">Mới</span>
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
        <Button size="sm" block onClick={() => nav(`/san-pham/${p.slug}`)}>Mua ngay</Button>
      </div>
    </article>
  );
}

export function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const nums = [];
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n++) nums.push(n);
  const btn = 'grid size-9 place-items-center rounded-lg border border-line bg-white text-[13.5px] font-medium text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-white disabled:hover:text-slate-600';
  const btnOn = 'border-brand-500 bg-brand-500 font-semibold text-white hover:border-brand-600 hover:bg-brand-600 hover:text-white';
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Phân trang">
      <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">‹</button>
      {nums[0] > 1 && <button className={btn} onClick={() => onChange(1)}>1</button>}
      {nums.map((n) => (
        <button
          key={n}
          aria-current={n === page ? 'page' : undefined}
          className={cn(btn, n === page && btnOn)}
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
