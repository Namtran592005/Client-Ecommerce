import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api, fmtVND, errMsg } from '../api/client';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/Toast';

const PAY_META = {
  cod: { logo: null, icon: 'bi-cash', desc: 'Trả tiền mặt khi nhận hàng' },
  bank_transfer: { logo: null, icon: 'bi-bank', desc: 'Chuyển khoản qua ngân hàng', soon: true },
  vnpay: { logo: '/pay/vnpay.svg', desc: 'Quét QR / thẻ qua VNPay', soon: true },
  momo: { logo: '/pay/momo.svg', desc: 'Ví điện tử MoMo', soon: true },
  zalopay: { logo: '/pay/zalopay.svg', desc: 'Ví điện tử ZaloPay', soon: true },
  card: { logo: null, icon: 'bi-credit-card', desc: 'Thẻ ATM / Visa / Mastercard', soon: true },
};

export default function Checkout() {
  const { cart, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [addr, setAddr] = useState({ recipient_name: '', phone: user?.phone || '', email: user?.email || '', province_name: '', district_name: '', ward_name: '', address_line: '' });
  const [payMethods, setPayMethods] = useState([]);
  const [shipMethods, setShipMethods] = useState([]);
  const [payCode, setPayCode] = useState('cod');
  const [shipCode, setShipCode] = useState('');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const coupon = loc.state?.coupon || '';

  useEffect(() => {
    api.get('/payments/methods').then((r) => setPayMethods(r.data)).catch(() => {});
    api.get('/shipping/methods').then((r) => setShipMethods(r.data)).catch(() => {});
    if (user) {
      api.get('/auth/me').then((r) => {
        const d = (r.data.addresses || []).find((a) => a.is_default) || r.data.addresses?.[0];
        if (d) setAddr({ recipient_name: d.recipient_name, phone: d.phone, email: user.email || '', province_name: d.province_name, district_name: d.district_name || '', ward_name: d.ward_name || '', address_line: d.address_line });
        else setAddr((a) => ({ ...a, phone: user.phone || '', email: user.email || '' }));
      }).catch(() => {});
    }
  }, [user]);

  if (!cart.items.length) {
    return (
      <main className="category-page"><div className="category-container text-center py-5">
        Giỏ trống — <Link to="/san-pham" style={{ color: 'var(--unimate-primary)' }}>mua sắm ngay</Link>
      </div></main>
    );
  }

  const shipFee = shipMethods.find((m) => m.code === shipCode)?.base_fee ?? 30000;
  const total = cart.subtotal + shipFee;

  const submit = async () => {
    if (!addr.recipient_name || !addr.phone || !addr.province_name || !addr.address_line) {
      toast.warning('Điền đủ tên, SĐT, tỉnh/thành, địa chỉ');
      return;
    }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders/checkout', {
        items: cart.items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        shipping_address: addr, coupon_code: coupon || undefined,
        payment_method_code: payCode, shipping_method_code: shipCode || undefined, customer_note: note,
      });
      await clear();
      nav(`/dat-hang-thanh-cong/${data.id}`, { state: { order_number: data.order_number, total: data.total_amount } });
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Đặt hàng thất bại');
    } finally { setPlacing(false); }
  };
  const setA = (k, v) => setAddr({ ...addr, [k]: v });

  return (
    <main className="category-page">
      <div className="breadcrumb-wrap">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb-custom">
            <li><Link to="/">Trang chủ</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
            <li><Link to="/gio-hang">Giỏ hàng</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
            <li><span className="current">Thanh toán</span></li>
          </ol>
        </nav>
      </div>
      <div className="page-title-wrap"><h1 className="page-title">Thanh toán</h1></div>
      <div className="category-container">
        <div className="row g-4">
          <div className="col-lg-7">
            <h6 className="checkout-sec-title">Địa chỉ giao hàng</h6>
            <div className="row g-2 mb-4">
              <div className="col-md-6"><input className="form-control" placeholder="Người nhận *" value={addr.recipient_name} onChange={(e) => setA('recipient_name', e.target.value)} /></div>
              <div className="col-md-6"><input className="form-control" placeholder="SĐT *" value={addr.phone} onChange={(e) => setA('phone', e.target.value)} /></div>
              <div className="col-12"><input className="form-control" placeholder="Địa chỉ (số nhà, đường) *" value={addr.address_line} onChange={(e) => setA('address_line', e.target.value)} /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Xã / Phường *" value={addr.ward_name} onChange={(e) => setA('ward_name', e.target.value)} /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Tỉnh / Thành phố *" value={addr.province_name} onChange={(e) => setA('province_name', e.target.value)} /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Email (nhận hóa đơn)" value={addr.email} onChange={(e) => setA('email', e.target.value)} /></div>
              <div className="col-md-6"><input className="form-control" placeholder="Ghi chú cho shop..." value={note} onChange={(e) => setNote(e.target.value)} /></div>
            </div>
            <h6 className="checkout-sec-title">Thanh toán</h6>
            <div className="pay-options">
              {payMethods.map((m) => {
                const meta = PAY_META[m.code] || {};
                const off = !!meta.soon;
                return (
                  <label key={m.code} className={`pay-option ${payCode === m.code ? 'active' : ''}`} style={off ? { opacity: 0.55 } : undefined}>
                    <input type="radio" name="pay" checked={payCode === m.code} disabled={off} onChange={() => setPayCode(m.code)} />
                    {meta.logo
                      ? <img src={meta.logo} alt={m.name} style={off ? { filter: 'grayscale(1)' } : undefined} />
                      : <span className="pay-ic"><i className={`bi ${meta.icon || 'bi-wallet2'}`}></i></span>}
                    <span>
                      <span className="pay-name d-block">{m.name} {off && <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>Sắp ra mắt</span>}</span>
                      <span className="pay-desc">{meta.desc || ''}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <h6 style={{ fontWeight: 700, margin: '14px 0 10px' }}>Vận chuyển</h6>
            <select className="form-select" value={shipCode} onChange={(e) => setShipCode(e.target.value)}>
              <option value="">Mặc định (30.000VND)</option>
              {shipMethods.map((m) => <option key={m.code} value={m.code}>{m.name} — {fmtVND(m.base_fee).replace('₫', '')}VND</option>)}
            </select>
          </div>
          <div className="col-lg-5">
            <div className="summary-box" style={{ position: 'sticky', top: 150 }}>
              <h6 style={{ fontWeight: 700 }}>Đơn hàng ({cart.items.length})</h6>
              {cart.items.map((i) => (
                <div key={i.id} className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: 13 }}>
                  <span>{i.product_name} × {i.quantity}</span>
                  <b>{fmtVND(i.price * i.quantity).replace('₫', '')}VND</b>
                </div>
              ))}
              <div className="summary-row"><span>Tạm tính</span><b>{fmtVND(cart.subtotal).replace('₫', '')}VND</b></div>
              <div className="summary-row"><span>Phí ship</span><b>{fmtVND(shipFee).replace('₫', '')}VND</b></div>
              {coupon && <div className="summary-row" style={{ color: '#34A853' }}><span>Mã {coupon}</span><span>tính lúc chốt đơn</span></div>}
              <div className="summary-total"><span>Tổng</span><span className="amount">{fmtVND(total).replace('₫', '')}VND</span></div>
              <button className="btn-checkout mt-3" disabled={placing} onClick={submit}>
                {placing ? 'Đang đặt...' : 'Đặt Hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function CheckoutSuccess() {
  return (
    <main className="category-page"><div className="category-container text-center py-5">
      <i className="bi bi-check-circle-fill" style={{ fontSize: 56, color: '#34A853' }}></i>
      <h3 className="mt-2" style={{ fontWeight: 700 }}>Đặt hàng thành công!</h3>
      <p style={{ color: '#6c757d' }}>Shop sẽ liên hệ xác nhận và giao hàng sớm nhất.</p>
      <Link to="/tai-khoan/don-hang" className="p-buy" style={{ display: 'inline-block', padding: '8px 28px' }}>Theo Dõi Đơn</Link>{' '}
      <Link to="/san-pham" className="p-buy" style={{ display: 'inline-block', padding: '8px 28px' }}>Tiếp Tục Mua</Link>
    </div></main>
  );
}
