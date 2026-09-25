import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation, Routes, Route } from 'react-router-dom';
import { api, fmtVND, fmtDate, errMsg } from '../api/client';
import { toast } from '../components/Toast';
import { useAuth } from '../auth/AuthContext';

const VI_ORDER = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', packed: 'Đã đóng gói', shipping: 'Đang giao', delivered: 'Đã giao', completed: 'Hoàn tất', cancelled: 'Đã hủy', returned: 'Đã trả hàng', refunded: 'Đã hoàn tiền' };

function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const items = [
    { to: '/tai-khoan', label: 'Hồ sơ', icon: 'bi-person' },
    { to: '/tai-khoan/don-hang', label: 'Đơn mua', icon: 'bi-bag' },
    { to: '/tai-khoan/dia-chi', label: 'Sổ địa chỉ', icon: 'bi-geo-alt' },
    { to: '/tai-khoan/yeu-thich', label: 'Yêu thích', icon: 'bi-heart' },
  ];
  const active = (to) => loc.pathname === to;
  return (
    <main className="category-page">
      <div className="breadcrumb-wrap">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb-custom">
            <li><Link to="/">Trang chủ</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
            <li><span className="current">Tài khoản</span></li>
          </ol>
        </nav>
      </div>
      <div className="page-title-wrap"><h1 className="page-title">Tài khoản của tôi</h1></div>
      <div className="category-container">
        <div className="row g-4">
          <aside className="col-lg-4 col-xl-3">
            <div style={{ border: '1px solid #e9ecef', borderRadius: 8, overflow: 'hidden' }}>
              <div className="d-flex align-items-center gap-2 p-3" style={{ background: 'linear-gradient(120deg,var(--unimate-primary),#2f7fd0)', color: '#fff' }}>
                <i className="bi bi-person-circle" style={{ fontSize: 38 }}></i>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || user?.phone}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Thành viên UniMate</div>
                </div>
              </div>
              <ul className="drawer-menu" style={{ padding: '4px 12px 12px' }}>
                {items.map((it) => (
                  <li key={it.to}>
                    <Link to={it.to} style={active(it.to) ? { color: 'var(--unimate-primary)', fontWeight: 700 } : undefined}>
                      <span><i className={`bi ${it.icon} me-1`}></i>{it.label}</span>
                      <i className="bi bi-chevron-right"></i>
                    </Link>
                  </li>
                ))}
                <li><button type="button" style={{ color: '#dc3545' }} onClick={async () => { await logout(); nav('/'); }}>
                  <span><i className="bi bi-box-arrow-right me-1"></i>Đăng xuất</span>
                  <i className="bi bi-chevron-right"></i>
                </button></li>
              </ul>
            </div>
          </aside>
          <div className="col-lg-8 col-xl-9 category-main">
            <Routes>
              <Route index element={<Profile />} />
              <Route path="don-hang" element={<MyOrders />} />
              <Route path="don-hang/:id" element={<OrderDetail />} />
              <Route path="dia-chi" element={<Addresses />} />
              <Route path="yeu-thich" element={<Wishlist />} />
            </Routes>
          </div>
        </div>
      </div>
    </main>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ first_name: '', last_name: '', display_name: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => {
    api.get('/auth/me').then((r) => {
      const p = r.data.profile || {};
      setF({ first_name: p.first_name || '', last_name: p.last_name || '', display_name: p.display_name || '' });
      setUser(r.data.user);
    }).catch(() => {});
  }, []);
  const save = async (e) => {
    e.preventDefault();
    try { await api.put('/auth/me', f); setMsg('Đã lưu hồ sơ'); }
    catch (e) { setMsg(errMsg(e)); }
  };
  return (
    <>
      <h5 style={{ fontWeight: 700 }}>Hồ sơ — {user?.email || user?.phone}</h5>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form onSubmit={save}>
        <div className="row g-2">
          <div className="col-md-4"><label style={{ fontWeight: 600, fontSize: 13 }}>Tên</label><input className="form-control" value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></div>
          <div className="col-md-4"><label style={{ fontWeight: 600, fontSize: 13 }}>Họ</label><input className="form-control" value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></div>
          <div className="col-md-4"><label style={{ fontWeight: 600, fontSize: 13 }}>Tên hiển thị</label><input className="form-control" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></div>
          <div className="col-12"><button className="p-buy" style={{ padding: '8px 32px' }}>Lưu</button></div>
        </div>
      </form>
    </>
  );
}

function MyOrders() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get('/orders').then((r) => setRows(r.data.data)).catch(() => {}); }, []);
  return (
    <>
      <h5 style={{ fontWeight: 700 }}>Đơn mua</h5>
      {rows.map((o) => (
        <Link key={o.id} to={`/tai-khoan/don-hang/${o.id}`} className="text-decoration-none text-dark">
          <div className="mb-2 p-2 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ border: '1px solid #e9ecef', borderRadius: 6 }}>
            <div><b>{o.order_number}</b><div style={{ fontSize: 12, color: '#6c757d' }}>{fmtDate(o.created_at)} · {VI_ORDER[o.status] || o.status}</div></div>
            <b style={{ color: 'var(--unimate-primary)' }}>{fmtVND(o.total_amount).replace('₫', '')}VND</b>
          </div>
        </Link>
      ))}
      {rows.length === 0 && <p style={{ color: '#6c757d' }}>Chưa có đơn nào.</p>}
    </>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const [o, setO] = useState(null);
  const load = () => api.get(`/orders/${id}`).then((r) => setO(r.data)).catch(() => {});
  useEffect(() => { load(); }, [id]);
  const cancel = async () => {
    if (!confirm('Hủy đơn này?')) return;
    try { await api.post(`/orders/${id}/cancel`, {}); toast.success('Đã hủy đơn'); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  if (!o) return <p>Đang tải...</p>;
  return (
    <>
      <h5 style={{ fontWeight: 700 }}>Đơn {o.order_number} — {VI_ORDER[o.status]}</h5>
      {o.items.map((i) => (
        <div key={i.id} className="d-flex justify-content-between border-bottom py-1" style={{ fontSize: 13 }}>
          <span>{i.product_name_snapshot} × {i.quantity}</span><b>{fmtVND(i.total_amount).replace('₫', '')}VND</b>
        </div>
      ))}
      <div className="d-flex justify-content-between mt-2"><span>Tổng</span><b style={{ color: 'var(--unimate-primary)' }}>{fmtVND(o.total_amount).replace('₫', '')}VND</b></div>
      {o.addresses.filter((a) => a.address_type === 'shipping').map((a) => (
        <p key={a.id} style={{ fontSize: 12.5, color: '#6c757d' }} className="mt-2 mb-0">Giao tới: {a.recipient_name} · {a.phone} · {a.address_line}, {a.province_name}</p>
      ))}
      <h6 style={{ fontWeight: 700, marginTop: 12 }}>Trạng thái</h6>
      {o.history.map((h) => <p key={h.id} style={{ fontSize: 13, marginBottom: 4 }}>• {h.from_status ? VI_ORDER[h.from_status] + ' → ' : ''}{VI_ORDER[h.to_status] || h.to_status} <span style={{ color: '#6c757d' }}>({fmtDate(h.created_at)})</span></p>)}
      {['pending', 'confirmed'].includes(o.status) && <button className="btn btn-outline-danger btn-sm mt-2" onClick={cancel}>Hủy đơn</button>}
    </>
  );
}

function Addresses() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ recipient_name: '', phone: '', province_name: '', ward_name: '', address_line: '', is_default: true });
  const load = () => api.get('/auth/me').then((r) => setRows(r.data.addresses || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async (e) => {
    e.preventDefault();
    try { await api.post(`/users/${user.id}/addresses`, f); setF({ recipient_name: '', phone: '', province_name: '', ward_name: '', address_line: '', is_default: false }); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const del = async (addrId) => {
    if (!confirm('Xóa địa chỉ này?')) return;
    await api.delete(`/users/addresses/${addrId}`).catch((e) => toast.error(errMsg(e)));
    load();
  };
  return (
    <>
      <h5 style={{ fontWeight: 700 }}>Sổ địa chỉ</h5>
      {rows.map((a) => (
        <div key={a.id} className="mb-2 p-2 d-flex justify-content-between align-items-center" style={{ border: '1px solid #e9ecef', borderRadius: 6 }}>
          <div style={{ fontSize: 13 }}><b>{a.recipient_name}</b> · {a.phone}<br />{a.address_line}, {a.province_name} {a.is_default && <span className="badge" style={{ background: 'var(--unimate-primary)' }}>Mặc định</span>}</div>
          <button className="btn btn-link text-danger btn-sm" onClick={() => del(a.id)}><i className="bi bi-trash"></i></button>
        </div>
      ))}
      <form onSubmit={save} className="row g-2 mt-1">
        <div className="col-md-6"><input className="form-control" placeholder="Người nhận *" value={f.recipient_name} onChange={(e) => setF({ ...f, recipient_name: e.target.value })} /></div>
        <div className="col-md-6"><input className="form-control" placeholder="SĐT *" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="col-md-6"><input className="form-control" placeholder="Tỉnh / Thành phố *" value={f.province_name} onChange={(e) => setF({ ...f, province_name: e.target.value })} /></div>
        <div className="col-md-6"><input className="form-control" placeholder="Xã / Phường *" value={f.ward_name} onChange={(e) => setF({ ...f, ward_name: e.target.value })} /></div>
        <div className="col-12"><input className="form-control" placeholder="Địa chỉ (số nhà, đường) *" value={f.address_line} onChange={(e) => setF({ ...f, address_line: e.target.value })} /></div>
        <div className="col-12"><button className="p-buy" style={{ padding: '8px 28px' }}>Thêm địa chỉ</button></div>
      </form>
    </>
  );
}

function Wishlist() {
  const [wl, setWl] = useState(null);
  const load = () => api.get('/cart/wishlist').then((r) => setWl(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const del = async (pid) => { await api.delete(`/cart/wishlist/items/${pid}`); load(); };
  return (
    <>
      <h5 style={{ fontWeight: 700 }}>Sản phẩm yêu thích</h5>
      {(wl?.items || []).map((i) => (
        <div key={i.product_id} className="d-flex justify-content-between align-items-center border-bottom py-2" style={{ fontSize: 13.5 }}>
          <Link to={`/san-pham/${i.slug}`} className="text-decoration-none text-dark">{i.name} — <b style={{ color: 'var(--unimate-primary)' }}>{fmtVND(i.base_price).replace('₫', '')}VND</b></Link>
          <button className="btn btn-link text-danger btn-sm" onClick={() => del(i.product_id)}><i className="bi bi-trash"></i></button>
        </div>
      ))}
      {!wl?.items?.length && <p style={{ color: '#6c757d' }}>Chưa có sản phẩm yêu thích.</p>}
    </>
  );
}

export default function Account() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="category-container py-5">Đang tải...</div>;
  if (!user) return <div className="category-container py-5 text-center">Vui lòng <Link to="/dang-nhap">đăng nhập</Link>.</div>;
  return <Shell />;
}
