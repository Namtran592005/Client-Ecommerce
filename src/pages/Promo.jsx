import { useEffect, useState } from 'react';
import { api, fmtVND, errMsg } from '../api/client';
import { toast } from '../components/Toast';

export default function Promo() {
  const [promos, setPromos] = useState([]);
  const [code, setCode] = useState('');
  const [res, setRes] = useState(null);

  useEffect(() => {
    api.get('/promos/promotions').then((r) => setPromos(r.data)).catch(() => {});
  }, []);

  const copy = async (c) => {
    try { await navigator.clipboard.writeText(c); toast.success(`Đã chép mã ${c}`); }
    catch { toast.warning(`Mã của bạn: ${c}`); }
  };
  const check = async () => {
    if (!code.trim()) return;
    try {
      const { data } = await api.post('/promos/coupons/validate', { code: code.trim(), order_amount: 500000 });
      setRes(data);
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <main className="category-page">
      <div className="breadcrumb-wrap">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb-custom">
            <li><a href="/">Trang chủ</a><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
            <li><span className="current">Khuyến mãi</span></li>
          </ol>
        </nav>
      </div>
      <div className="page-title-wrap">
        <h1 className="page-title">Ưu Đãi Đặc Biệt</h1>
        <p className="page-subtitle">Săn mã giảm giá mỗi ngày — áp dụng ở giỏ hàng</p>
      </div>
      <div className="category-container">
        <div className="row g-3">
          {promos.map((p) => (
            <div className="col-md-6 col-lg-4" key={p.id}>
              <div className="d-flex" style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden', minHeight: 118 }}>
                <div className="d-flex flex-column align-items-center justify-content-center text-white fw-bold"
                  style={{ background: 'linear-gradient(135deg,var(--unimate-primary),#2f7fd0)', width: 104, flexShrink: 0, fontSize: 13, textAlign: 'center', padding: 8 }}>
                  <i className="bi bi-ticket-perforated" style={{ fontSize: 22 }}></i>
                  {p.code || 'SALE'}
                </div>
                <div className="p-3 flex-grow-1" style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: '#6c757d' }}>
                    {p.description || 'Áp dụng cho đơn hàng'}
                    {p.minimum_order_amount > 0 && <> · Đơn từ {fmtVND(p.minimum_order_amount).replace('₫', '')}VND</>}
                  </div>
                  {p.code && <button className="p-buy mt-2" style={{ padding: '6px 20px' }} onClick={() => copy(p.code)}>Chép mã</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {promos.length === 0 && <p className="text-center py-4" style={{ color: '#6c757d' }}>Hiện chưa có chương trình nào. Quay lại sau nhé!</p>}
        <div className="mt-4 p-3" style={{ border: '1px solid #e9ecef', borderRadius: 8, maxWidth: 520 }}>
          <h6 style={{ fontWeight: 700 }}>Thử mã giảm giá</h6>
          <div className="coupon-row">
            <input placeholder="Nhập mã, VD: CHAO10" value={code} onChange={(e) => setCode(e.target.value)} />
            <button className="btn-apply" onClick={check}>Kiểm tra</button>
          </div>
          {res && (res.valid
            ? <p className="mini-note ok">Mã hợp lệ! Đơn 500.000VND được giảm {fmtVND(res.discount_amount).replace('₫', '')}VND.</p>
            : <p className="mini-note err">{res.error}</p>)}
        </div>
      </div>
    </main>
  );
}
