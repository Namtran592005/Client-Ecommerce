import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api, fmtVND, fileUrl } from '../api/client';
import { useCart } from '../cart/CartContext';
import { Container } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Empty, QtyStepper, Chip } from '../components/ui/misc';

const SHIP_FEE = 30000;
const money = (n) => `${fmtVND(n).replace('₫', '')}VND`;

export default function Cart() {
  const { cart, setQty, removeItem } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(null);
  const [err, setErr] = useState('');
  const [checking, setChecking] = useState(false);
  const nav = useNavigate();

  const checkCoupon = async () => {
    if (!coupon.trim()) return;
    setErr('');
    setChecking(true);
    try {
      const { data } = await api.post('/promos/coupons/validate', { code: coupon.trim(), order_amount: cart.subtotal });
      if (data.valid) setDiscount({ code: coupon.trim().toUpperCase(), amount: data.discount_amount, coupon: data.coupon });
      else { setDiscount(null); setErr(data.error || 'Mã không dùng được'); }
    } catch (e) {
      setDiscount(null);
      setErr(e?.response?.data?.error || 'Không kiểm tra được mã');
    } finally { setChecking(false); }
  };

  const ship = discount?.coupon?.type === 'free_shipping' ? 0 : SHIP_FEE;
  const total = Math.max(0, cart.subtotal - (discount?.amount || 0) + (cart.items.length ? ship : 0));

  return (
    <main className="pb-10">
      <Container>
        <nav aria-label="breadcrumb" className="py-3 text-[12.5px] text-slate-500">
          <ol className="flex items-center gap-1.5">
            <li><Link to="/" className="hover:text-brand-500">Trang chủ</Link></li>
            <li aria-hidden="true"><i className="bi bi-chevron-right text-[10px]" /></li>
            <li className="font-medium text-slate-700">Giỏ hàng</li>
          </ol>
        </nav>

        <h1 className="pb-4 text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
          Giỏ hàng <span className="text-[15px] font-semibold text-slate-400">({cart.items.length} sản phẩm)</span>
        </h1>

        {!cart.items.length ? (
          <Empty
            icon="bi-cart-x"
            title="Giỏ hàng đang trống"
            desc="Hãy chọn thêm sản phẩm bạn thích để bắt đầu."
            action={<Link to="/san-pham"><Button className="mt-1">Đi mua sắm ngay</Button></Link>}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <ul className="grid gap-3">
              {cart.items.map((it) => (
                <li key={it.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-card sm:flex-nowrap sm:gap-4">
                  <Link to={`/san-pham/${it.slug || ''}`} className="grid size-[68px] shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-[#f8fafc]">
                    {it.image_key
                      ? <img src={fileUrl(it.image_key)} alt="" loading="lazy" className="size-full object-contain p-1" />
                      : <i className="bi bi-image text-slate-300" aria-hidden="true" />}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-slate-800">{it.product_name}</p>
                    <p className="truncate text-[12px] text-slate-500">{it.variant_name} · SKU: {it.sku}</p>
                    <p className="mt-1 text-[14px] font-bold text-price">{money(it.price)}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <QtyStepper
                      value={it.quantity}
                      min={1}
                      max={99}
                      onChange={(n) => setQty(it.id, n)}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-slate-400 transition-colors hover:text-price"
                    >
                      <i className="bi bi-trash" aria-hidden="true" /> Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <aside>
              <div className="sticky top-28 grid gap-3 rounded-xl border border-line bg-white p-4 shadow-card">
                <div>
                  <p className="mb-2 text-[13px] font-semibold text-slate-700">Mã giảm giá</p>
                  <div className="flex gap-2">
                    <Input
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="Nhập mã, VD: CHAO10"
                      onKeyDown={(e) => e.key === 'Enter' && checkCoupon()}
                    />
                    <Button variant="outline" onClick={checkCoupon} disabled={checking || !coupon.trim()}>
                      {checking ? '...' : 'Áp dụng'}
                    </Button>
                  </div>
                  {discount && (
                    <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-emerald-700">
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      Đã áp dụng {discount.code} — giảm {money(discount.amount)}
                    </p>
                  )}
                  {err && (
                    <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-price">
                      <i className="bi bi-exclamation-circle-fill" aria-hidden="true" /> {err}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5 border-t border-line pt-3 text-[13.5px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính</span><b className="text-slate-800">{money(cart.subtotal)}</b>
                  </div>
                  {discount?.amount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Giảm giá</span><b>−{money(discount.amount)}</b>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển</span>
                    <b className="text-slate-800">{ship === 0 ? <Chip color="green">Miễn phí</Chip> : money(ship)}</b>
                  </div>
                </div>

                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <span className="text-[14px] font-semibold text-slate-700">Tổng cộng</span>
                  <span className="text-[20px] font-extrabold text-price">{money(total)}</span>
                </div>

                <Button
                  size="lg"
                  block
                  onClick={() => nav('/thanh-toan', { state: discount ? { coupon: discount.code } : {} })}
                >
                  Tiến hành đặt hàng
                </Button>
                <Link to="/san-pham" className="text-center text-[13px] font-semibold text-brand-500 hover:underline">
                  Tiếp tục mua sắm
                </Link>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </main>
  );
}
