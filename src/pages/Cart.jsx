import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api, fmtVND, fileUrl } from '../api/client';
import { useCart } from '../cart/CartContext';

export default function Cart() {
  const { cart, setQty, removeItem } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(null);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const checkCoupon = async () => {
    if (!coupon.trim()) return;
    setErr('');
    const { data } = await api.post('/promos/coupons/validate', { code: coupon.trim(), order_amount: cart.subtotal });
    if (data.valid) setDiscount({ code: coupon.trim(), amount: data.discount_amount, coupon: data.coupon });
    else { setDiscount(null); setErr(data.error); }
  };
  const ship0 = 30000;
  const ship = discount?.coupon?.type === 'free_shipping' ? 0 : ship0;
  const total = Math.max(0, cart.subtotal - (discount?.amount || 0) + (cart.items.length ? ship : 0));

  return (
    <main className="category-page">
      <div className="breadcrumb-wrap">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb-custom">
            <li><Link to="/">Trang chủ</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
            <li><span className="current">Giỏ hàng</span></li>
          </ol>
        </nav>
      </div>
      <div className="page-title-wrap">
        <h1 className="page-title">Giỏ hàng ({cart.items.length})</h1>
      </div>
      <div className="category-container">
        {!cart.items.length ? (
          <div className="text-center py-5">
            <i className="bi bi-cart-x" style={{ fontSize: 56, color: '#adb5bd' }}></i>
            <p className="mt-2">Giỏ hàng trống.</p>
            <Link to="/san-pham" className="p-buy" style={{ display: 'inline-block', padding: '8px 32px' }}>Mua Sắm Ngay</Link>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-8 cart-items-wrap">
              {cart.items.map((it) => (
                <div key={it.id} className="cart-item">
                  <div className="cart-thumb">
                    {it.image_key ? <img src={fileUrl(it.image_key)} alt="" loading="lazy" /> : null}
                  </div>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.product_name}</div>
                    <div style={{ fontSize: 12, color: '#6c757d' }}>{it.variant_name} · SKU: {it.sku}</div>
                    <div className="p-price" style={{ color: 'var(--unimate-primary)', fontWeight: 700 }}>{fmtVND(it.price).replace('₫', '')}<small>VND</small></div>
                  </div>
                  <div>
                    <div className="qty-group">
                      <button className="qty-btn" disabled={it.quantity <= 1} onClick={() => setQty(it.id, it.quantity - 1)}>−</button>
                      <input className="qty-input" value={it.quantity} onChange={(e) => { const n = Number(e.target.value) || 1; if (n >= 1) setQty(it.id, n); }} />
                      <button className="qty-btn" onClick={() => setQty(it.id, it.quantity + 1)}>+</button>
                    </div>
                    <div className="text-end mt-1"><button className="cart-del" onClick={() => removeItem(it.id)}><i className="bi bi-trash"></i>Xóa</button></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-lg-4">
              <div className="summary-box" style={{ position: 'sticky', top: 150 }}>
                <div className="coupon-row">
                  <input placeholder="Mã giảm giá..." value={coupon} onChange={(e) => setCoupon(e.target.value)} />
                  <button className="btn-apply" onClick={checkCoupon}>Áp dụng</button>
                </div>
                {discount && <p className="mini-note ok">Áp dụng {discount.code}: −{fmtVND(discount.amount).replace('₫', '')}VND</p>}
                {err && <p className="mini-note err">{err}</p>}
                <div className="summary-row"><span>Tạm tính</span><b>{fmtVND(cart.subtotal).replace('₫', '')}VND</b></div>
                <div className="summary-row"><span>Phí ship (dự kiến)</span><b>{fmtVND(ship).replace('₫', '')}VND</b></div>
                <div className="summary-total"><span>Tổng</span><span className="amount">{fmtVND(total).replace('₫', '')}VND</span></div>
                <button className="btn-checkout mt-3" onClick={() => nav('/thanh-toan', { state: discount ? { coupon: discount.code } : {} })}>Tiến Hành Đặt Hàng</button>
                <Link to="/san-pham" className="d-block text-center mt-2" style={{ fontSize: 13, color: 'var(--unimate-primary)' }}>Tiếp tục mua sắm</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
