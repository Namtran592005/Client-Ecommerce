import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation, Routes, Route } from 'react-router-dom';
import { api, fmtVND, fmtDate, errMsg } from '../api/client';
import { toast } from '../components/Toast';
import { useAuth } from '../auth/AuthContext';

const VI_ORDER = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', packed: 'Đã đóng gói',
  shipping: 'Đang giao', delivered: 'Đã giao', completed: 'Hoàn tất', cancelled: 'Đã hủy',
  returned: 'Đã trả hàng', refunded: 'Đã hoàn tiền',
};
const CHIP = {
  pending: 'amber', confirmed: 'blue', processing: 'cyan', packed: 'violet', shipping: 'blue',
  delivered: 'green', completed: 'green', cancelled: 'red', returned: 'orange', refunded: 'purple',
};
const PAY_VI = { unpaid: 'Chưa thanh toán', pending: 'Đang xử lý', paid: 'Đã thanh toán', partially_refunded: 'Hoàn một phần', refunded: 'Đã hoàn tiền', failed: 'Thất bại' };

const money = (n) => `${fmtVND(n).replace('₫', '')}VND`;
const fmtDay = (s) => (s ? new Date(s).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—');

function initials(user, profile) {
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    || profile?.display_name || user?.email || user?.phone || '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
}

function Chip({ status, kind = 'order' }) {
  const label = kind === 'order' ? (VI_ORDER[status] || status) : (PAY_VI[status] || status);
  const color = kind === 'order' ? (CHIP[status] || 'gray') : (status === 'paid' ? 'green' : status === 'failed' ? 'red' : 'amber');
  return <span className={`acc-chip acc-chip-${color}`}>{label}</span>;
}

function Empty({ icon, title, desc, action }) {
  return (
    <div className="acc-empty">
      <i className={`bi ${icon}`} aria-hidden="true"></i>
      <p className="acc-empty-title">{title}</p>
      {desc && <p className="acc-empty-desc">{desc}</p>}
      {action}
    </div>
  );
}

function Panel({ title, sub, children, action }) {
  return (
    <section className="acc-panel">
      <header className="acc-panel-head">
        <div>
          <h2 className="acc-panel-title">{title}</h2>
          {sub && <p className="acc-panel-sub">{sub}</p>}
        </div>
        {action}
      </header>
      <div className="acc-panel-body">{children}</div>
    </section>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ count: 0, spent: 0 });

  const items = [
    { to: '/tai-khoan', label: 'Hồ sơ', icon: 'bi-person' },
    { to: '/tai-khoan/don-hang', label: 'Đơn mua', icon: 'bi-bag' },
    { to: '/tai-khoan/dia-chi', label: 'Sổ địa chỉ', icon: 'bi-geo-alt' },
    { to: '/tai-khoan/yeu-thich', label: 'Yêu thích', icon: 'bi-heart' },
  ];
  const active = (to) => loc.pathname === to;

  useEffect(() => {
    api.get('/auth/me').then((r) => setProfile(r.data.profile || {})).catch(() => {});
    api.get('/orders', { params: { limit: 100 } }).then((r) => {
      const list = r.data.data || [];
      const done = list.filter((o) => ['delivered', 'completed'].includes(o.status));
      setStats({ count: list.length, spent: done.reduce((s, o) => s + Number(o.total_amount || 0), 0) });
    }).catch(() => {});
  }, [loc.pathname]);

  const fullName = useMemo(() => {
    const n = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');
    return n || profile?.display_name || 'Khách hàng UniMate';
  }, [profile]);

  return (
    <main className="account-page">
      <div className="acc-topbar">
        <div className="acc-topbar-inner">
          <Link to="/" className="acc-back"><i className="bi bi-chevron-left"></i> Về trang chủ</Link>
          <h1 className="acc-title">Tài khoản của tôi</h1>
        </div>
      </div>

      <div className="acc-layout">
        <aside className="acc-side">
          <div className="acc-idcard">
            <div className="acc-avatar">{initials(user, profile)}</div>
            <div className="acc-idcard-text">
              <p className="acc-idcard-name">{fullName}</p>
              <p className="acc-idcard-mail">{user?.email || user?.phone}</p>
            </div>
          </div>
          <div className="acc-stats">
            <div className="acc-stat">
              <span className="acc-stat-value">{stats.count}</span>
              <span className="acc-stat-label">Đơn đã đặt</span>
            </div>
            <div className="acc-stat">
              <span className="acc-stat-value">{fmtVND(stats.spent).replace('₫', '')}<small>đ</small></span>
              <span className="acc-stat-label">Tổng đã chi</span>
            </div>
          </div>
          <nav className="acc-menu">
            {items.map((it) => (
              <Link key={it.to} to={it.to} className={`acc-menu-item${active(it.to) ? ' is-active' : ''}`}>
                <i className={`bi ${it.icon}`} aria-hidden="true"></i>
                <span>{it.label}</span>
              </Link>
            ))}
            <button type="button" className="acc-menu-item is-logout" onClick={async () => { await logout(); nav('/'); }}>
              <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
              <span>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        <div className="acc-content">
          <Routes>
            <Route index element={<Profile profile={profile} setProfile={setProfile} />} />
            <Route path="don-hang" element={<MyOrders />} />
            <Route path="don-hang/:id" element={<OrderDetail />} />
            <Route path="dia-chi" element={<Addresses />} />
            <Route path="yeu-thich" element={<Wishlist />} />
          </Routes>
        </div>
      </div>
    </main>
  );
}

function Profile({ profile, setProfile }) {
  const { user } = useAuth();
  const [f, setF] = useState({ first_name: '', last_name: '', display_name: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (profile) setF({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      display_name: profile.display_name || '',
    });
  }, [profile]);

  const dirty = profile && (f.first_name !== (profile.first_name || '')
    || f.last_name !== (profile.last_name || '')
    || f.display_name !== (profile.display_name || ''));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.put('/auth/me', f);
      const r = await api.get('/auth/me');
      setProfile(r.data.profile || {});
      setMsg({ type: 'ok', text: 'Đã lưu hồ sơ' });
    } catch (err) {
      setMsg({ type: 'err', text: errMsg(err) });
    } finally { setSaving(false); }
  };

  return (
    <Panel title="Hồ sơ cá nhân" sub="Thông tin này dùng cho việc giao hàng và liên hệ hỗ trợ.">
      <div className="acc-profile-head">
        <div className="acc-avatar acc-avatar-lg">{initials(user, profile || f)}</div>
        <div>
          <p className="acc-profile-name">{[f.first_name, f.last_name].filter(Boolean).join(' ') || 'Chưa đặt tên'}</p>
          <p className="acc-profile-mail">{user?.email || user?.phone}</p>
          {profile?.created_at && <p className="acc-profile-since">Thành viên từ {fmtDay(profile.created_at)}</p>}
        </div>
      </div>

      <div className="acc-readonly">
        <div className="acc-ro-item">
          <span className="acc-ro-label">Email</span>
          <span className="acc-ro-value">{user?.email || '—'}</span>
        </div>
        <div className="acc-ro-item">
          <span className="acc-ro-label">Số điện thoại</span>
          <span className="acc-ro-value">{user?.phone || '—'}</span>
        </div>
        <div className="acc-ro-item">
          <span className="acc-ro-label">Giới tính</span>
          <span className="acc-ro-value">{{ male: 'Nam', female: 'Nữ', other: 'Khác', unknown: 'Chưa xác định' }[profile?.gender] || 'Chưa xác định'}</span>
        </div>
      </div>

      {msg && <p className={`acc-note ${msg.type === 'ok' ? 'is-ok' : 'is-err'}`}>{msg.text}</p>}

      <form onSubmit={save} className="acc-form">
        <div className="acc-form-grid">
          <label className="acc-field">
            <span>Tên</span>
            <input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} placeholder="Nhập tên" />
          </label>
          <label className="acc-field">
            <span>Họ</span>
            <input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} placeholder="Nhập họ" />
          </label>
          <label className="acc-field acc-field-wide">
            <span>Tên hiển thị</span>
            <input value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} placeholder="Tên hiện trên đơn hàng" />
          </label>
        </div>
        <div className="acc-form-actions">
          <button type="submit" className="acc-btn acc-btn-primary" disabled={saving || !dirty}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
          {dirty && <span className="acc-hint">Bạn có thay đổi chưa lưu</span>}
        </div>
      </form>
    </Panel>
  );
}

function MyOrders() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/orders', { params: { limit: 100 } }).then((r) => setRows(r.data.data || [])).catch(() => setRows([]));
  }, []);

  const FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'completed', label: 'Hoàn tất' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];
  const list = (rows || []).filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'shipping') return ['processing', 'packed', 'shipping'].includes(o.status);
    return o.status === filter;
  });

  if (!rows) return <Panel title="Đơn mua"><p className="acc-loading">Đang tải...</p></Panel>;

  return (
    <Panel
      title="Đơn mua"
      sub={`Có ${rows.length} đơn hàng trong tài khoản`}
      action={null}
    >
      <div className="acc-tabs">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`acc-tab${filter === f.key ? ' is-active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty
          icon="bi-bag"
          title="Chưa có đơn hàng nào"
          desc={filter === 'all' ? 'Hãy chọn sản phẩm bạn thích để bắt đầu mua sắm.' : 'Không có đơn nào ở trạng thái này.'}
          action={<Link to="/san-pham" className="acc-btn acc-btn-primary mt-2">Đi mua sắm</Link>}
        />
      ) : (
        <ul className="acc-order-list">
          {list.map((o) => (
            <li key={o.id}>
              <Link to={`/tai-khoan/don-hang/${o.id}`} className="acc-order">
                <div className="acc-order-main">
                  <div className="acc-order-top">
                    <span className="acc-order-no">{o.order_number}</span>
                    <Chip status={o.status} />
                  </div>
                  <p className="acc-order-meta">Đặt lúc {fmtDate(o.created_at)}</p>
                </div>
                <div className="acc-order-side">
                  <span className="acc-order-total">{money(o.total_amount)}</span>
                  <Chip status={o.payment_status} kind="pay" />
                </div>
                <i className="bi bi-chevron-right acc-order-arrow" aria-hidden="true"></i>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const [o, setO] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/orders/${id}`).then((r) => setO(r.data)).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, [id]);

  const cancel = async () => {
    if (globalThis.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    setBusy(true);
    try { await api.post(`/orders/${id}/cancel`, {}); toast.success('Đã hủy đơn hàng'); load(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  if (err) return <Panel title="Chi tiết đơn hàng"><Empty icon="bi-exclamation-circle" title="Không tải được đơn" desc={err} /></Panel>;
  if (!o) return <Panel title="Chi tiết đơn hàng"><p className="acc-loading">Đang tải...</p></Panel>;

  const ship = o.addresses.find((a) => a.address_type === 'shipping');
  const canCancel = ['pending', 'confirmed'].includes(o.status);

  return (
    <>
      <div className="acc-detail-head">
        <Link to="/tai-khoan/don-hang" className="acc-back"><i className="bi bi-chevron-left"></i> Về danh sách đơn</Link>
        <div className="acc-detail-title">
          <h2>{o.order_number}</h2>
          <Chip status={o.status} />
        </div>
        <p className="acc-detail-date">Đặt lúc {fmtDate(o.created_at)}</p>
      </div>

      <Panel title="Sản phẩm đã đặt">
        <ul className="acc-items">
          {o.items.map((i) => (
            <li key={i.id} className="acc-item">
              <div className="acc-item-thumb">
                {i.image_url_snapshot
                  ? <img src={i.image_url_snapshot} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  : <i className="bi bi-image"></i>}
              </div>
              <div className="acc-item-info">
                <p className="acc-item-name">{i.product_name_snapshot}</p>
                <p className="acc-item-variant">{[i.variant_name_snapshot, i.sku_snapshot].filter(Boolean).join(' · ')}</p>
                <p className="acc-item-qty">{money(i.unit_price)} × {i.quantity}</p>
              </div>
              <span className="acc-item-total">{money(i.total_amount)}</span>
            </li>
          ))}
        </ul>

        <div className="acc-totals">
          <div className="acc-total-row"><span>Tạm tính</span><b>{money(o.subtotal)}</b></div>
          {Number(o.order_discount_amount) > 0 && <div className="acc-total-row is-disc"><span>Giảm giá{o.coupon_code ? ` (${o.coupon_code})` : ''}</span><b>−{money(o.order_discount_amount)}</b></div>}
          <div className="acc-total-row"><span>Phí vận chuyển</span><b>{Number(o.shipping_fee) > 0 ? money(o.shipping_fee) : 'Miễn phí'}</b></div>
          <div className="acc-total-row is-grand"><span>Tổng cộng</span><b>{money(o.total_amount)}</b></div>
        </div>
      </Panel>

      <div className="acc-two-col">
        <Panel title="Địa chỉ giao hàng">
          {ship ? (
            <div className="acc-address">
              <p className="acc-address-name">{ship.recipient_name}</p>
              <p className="acc-address-phone">{ship.phone}</p>
              <p className="acc-address-line">
                {[ship.address_line, ship.ward_name, ship.district_name, ship.province_name].filter(Boolean).join(', ')}
              </p>
            </div>
          ) : <p className="acc-muted">Không có thông tin địa chỉ.</p>}
          <div className="acc-meta-rows">
            <div><span>Thanh toán</span><Chip status={o.payment_status} kind="pay" /></div>
            <div><span>Giao hàng</span><b>{({ unfulfilled: 'Chưa giao', partial: 'Giao một phần', fulfilled: 'Đã giao', returned: 'Đã trả' })[o.fulfillment_status] || o.fulfillment_status}</b></div>
          </div>
        </Panel>

        <Panel title="Lịch sử trạng thái">
          <ol className="acc-timeline">
            {o.history.map((h) => (
              <li key={h.id}>
                <span className="acc-timeline-dot" aria-hidden="true"></span>
                <div>
                  <p className="acc-timeline-title">{VI_ORDER[h.to_status] || h.to_status}</p>
                  <p className="acc-timeline-time">{fmtDate(h.created_at)}{h.note ? ` · ${h.note}` : ''}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      {canCancel && (
        <div className="acc-danger">
          <div>
            <p className="acc-danger-title">Hủy đơn hàng</p>
            <p className="acc-danger-desc">Bạn có thể hủy khi đơn còn ở trạng thái chờ xác nhận hoặc đã xác nhận.</p>
          </div>
          <button type="button" className="acc-btn acc-btn-danger" onClick={cancel} disabled={busy}>
            {busy ? 'Đang hủy...' : 'Hủy đơn hàng'}
          </button>
        </div>
      )}
    </>
  );
}

function Addresses() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ recipient_name: '', phone: '', province_name: '', ward_name: '', address_line: '', is_default: false });

  const load = () => api.get('/auth/me').then((r) => setRows(r.data.addresses || [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!f.recipient_name.trim() || !f.phone.trim() || !f.province_name.trim() || !f.ward_name.trim() || !f.address_line.trim()) {
      return toast.warning('Vui lòng điền đủ thông tin địa chỉ');
    }
    setSaving(true);
    try {
      await api.post(`/users/${user.id}/addresses`, f);
      setF({ recipient_name: '', phone: '', province_name: '', ward_name: '', address_line: '', is_default: false });
      toast.success('Đã thêm địa chỉ');
      load();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setSaving(false); }
  };

  const del = async (addrId) => {
    if (globalThis.confirm('Xóa địa chỉ này?')) return;
    try { await api.delete(`/users/addresses/${addrId}`); toast.success('Đã xóa địa chỉ'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <Panel title="Sổ địa chỉ" sub="Dùng để điền nhanh khi đặt hàng.">
      {rows === null ? <p className="acc-loading">Đang tải...</p> : rows.length === 0 ? (
        <Empty icon="bi-geo-alt" title="Chưa có địa chỉ nào" desc="Thêm địa chỉ bên dưới để thanh toán nhanh hơn." />
      ) : (
        <ul className="acc-addr-list">
          {rows.map((a) => (
            <li key={a.id} className={`acc-addr${a.is_default ? ' is-default' : ''}`}>
              <div className="acc-addr-body">
                <p className="acc-addr-name">
                  {a.recipient_name}
                  {a.is_default && <span className="acc-badge">Mặc định</span>}
                </p>
                <p className="acc-addr-phone">{a.phone}</p>
                <p className="acc-addr-line">{[a.address_line, a.ward_name, a.district_name, a.province_name].filter(Boolean).join(', ')}</p>
              </div>
              <button type="button" className="acc-icon-btn acc-icon-danger" title="Xóa địa chỉ" onClick={() => del(a.id)}>
                <i className="bi bi-trash"></i>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={save} className="acc-form acc-form-add">
        <h3 className="acc-form-title">Thêm địa chỉ mới</h3>
        <div className="acc-form-grid">
          <label className="acc-field"><span>Người nhận *</span><input value={f.recipient_name} onChange={(e) => setF({ ...f, recipient_name: e.target.value })} placeholder="Nguyễn Văn A" /></label>
          <label className="acc-field"><span>Số điện thoại *</span><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="09xx xxx xxx" /></label>
          <label className="acc-field"><span>Tỉnh / Thành phố *</span><input value={f.province_name} onChange={(e) => setF({ ...f, province_name: e.target.value })} placeholder="TP. Hồ Chí Minh" /></label>
          <label className="acc-field"><span>Xã / Phường *</span><input value={f.ward_name} onChange={(e) => setF({ ...f, ward_name: e.target.value })} placeholder="Phường 1" /></label>
          <label className="acc-field acc-field-wide"><span>Địa chỉ (số nhà, đường) *</span><input value={f.address_line} onChange={(e) => setF({ ...f, address_line: e.target.value })} placeholder="123 Lê Lợi" /></label>
          <label className="acc-check acc-field-wide">
            <input type="checkbox" checked={f.is_default} onChange={(e) => setF({ ...f, is_default: e.target.checked })} />
            <span>Đặt làm địa chỉ mặc định</span>
          </label>
        </div>
        <div className="acc-form-actions">
          <button type="submit" className="acc-btn acc-btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Thêm địa chỉ'}</button>
        </div>
      </form>
    </Panel>
  );
}

function Wishlist() {
  const [wl, setWl] = useState(null);
  const load = () => api.get('/cart/wishlist').then((r) => setWl(r.data)).catch(() => setWl({ items: [] }));
  useEffect(() => { load(); }, []);
  const del = async (pid) => {
    try { await api.delete(`/cart/wishlist/items/${pid}`); toast.success('Đã bỏ khỏi yêu thích'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  if (!wl) return <Panel title="Sản phẩm yêu thích"><p className="acc-loading">Đang tải...</p></Panel>;
  const items = wl.items || [];

  return (
    <Panel title="Sản phẩm yêu thích" sub={items.length ? `Bạn đã lưu ${items.length} sản phẩm` : null}>
      {items.length === 0 ? (
        <Empty
          icon="bi-heart"
          title="Chưa có sản phẩm yêu thích"
          desc="Bấm biểu tượng trái tim ở trang sản phẩm để lưu lại xem sau."
          action={<Link to="/san-pham" className="acc-btn acc-btn-primary mt-2">Khám phá sản phẩm</Link>}
        />
      ) : (
        <ul className="acc-wish-list">
          {items.map((i) => (
            <li key={i.product_id} className="acc-wish">
              <Link to={`/san-pham/${i.slug}`} className="acc-wish-thumb">
                {i.image_key ? <img src={`${import.meta.env.VITE_FILES_BASE || 'http://127.0.0.1:9000/unimate'}/${i.image_key}`} alt="" loading="lazy" /> : <i className="bi bi-image"></i>}
              </Link>
              <div className="acc-wish-info">
                <Link to={`/san-pham/${i.slug}`} className="acc-wish-name">{i.name}</Link>
                <span className="acc-wish-price">{money(i.base_price)}</span>
              </div>
              <button type="button" className="acc-icon-btn acc-icon-danger" title="Bỏ khỏi yêu thích" onClick={() => del(i.product_id)}>
                <i className="bi bi-trash"></i>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function Account() {
  const { user, ready } = useAuth();
  if (!ready) return <main className="account-page"><div className="acc-loading acc-loading-page">Đang tải...</div></main>;
  if (!user) {
    return (
      <main className="account-page">
        <div className="acc-loading acc-loading-page">
          <p>Vui lòng <Link to="/dang-nhap">đăng nhập</Link> để xem tài khoản.</p>
        </div>
      </main>
    );
  }
  return <Shell />;
}
