import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation, Routes, Route } from 'react-router-dom';
import { api, fmtVND, fmtDate, fileUrl, errMsg } from '../api/client';
import { toast } from '../components/Toast';
import { useAuth } from '../auth/AuthContext';
import { Container } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input, Textarea, Select, Checkbox, Field } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui/card';
import { Chip, Empty, QtyStepper } from '../components/ui/misc';

const VI_ORDER = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', packed: 'Đã đóng gói',
  shipping: 'Đang giao', delivered: 'Đã giao', completed: 'Hoàn tất', cancelled: 'Đã hủy',
  returned: 'Đã trả hàng', refunded: 'Hoàn tiền',
};
const ORDER_CHIP = {
  pending: 'amber', confirmed: 'brand', processing: 'default', packed: 'default',
  shipping: 'brand', delivered: 'green', completed: 'green',
  cancelled: 'red', returned: 'red', refunded: 'red',
};
const PAY_VI = {
  unpaid: 'Chưa thanh toán', pending: 'Đang xử lý', paid: 'Đã thanh toán',
  partially_refunded: 'Hoàn một phần', refunded: 'Hoàn tiền', failed: 'Thất bại',
};
const PAY_CHIP = { paid: 'green', failed: 'red', unpaid: 'amber', pending: 'amber', partially_refunded: 'brand', refunded: 'brand' };
const EMPTY_EDIT = { email: '', phone: '', status: 'active', first_name: '', last_name: '', display_name: '', gender: 'unknown', date_of_birth: '', marketing_opt_in: false };
const GENDERS = [{ value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }, { value: 'other', label: 'Khác' }, { value: 'unknown', label: 'Chưa xác định' }];

const money = (n) => `${fmtVND(n).replace('₫', '')}VND`;
const toDateInput = (v) => (v ? String(v).slice(0, 10) : '');
const initials = (name, fallback) => {
  const src = (name || fallback || '?').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : src.slice(0, 2)).toUpperCase();
};

function AccountNav({ items, active }) {
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Menu tài khoản">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          aria-current={active === it.to ? 'page' : undefined}
          className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13.5px] font-medium transition-colors lg:shrink ${
            active === it.to ? 'bg-brand-500 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-600'
          }`}
        >
          <i className={`bi ${it.icon} text-[15px]`} aria-hidden="true" />
          {it.label}
        </Link>
      ))}
    </nav>
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
  const active = items.find((i) => loc.pathname === i.to)?.to || '/tai-khoan';

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
    <main className="pb-10">
      <Container>
        <div className="flex items-center justify-between py-3">
          <Link to="/" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 hover:text-brand-500">
            <i className="bi bi-chevron-left" aria-hidden="true" /> Về trang chủ
          </Link>
          <h1 className="text-[20px] font-extrabold tracking-tight text-ink sm:text-[23px]">Tài khoản của tôi</h1>
          <span className="hidden sm:block" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[268px_1fr]">
          <aside className="lg:sticky lg:top-28">
            <div className="rounded-xl border border-line bg-white shadow-card">
              <div className="flex items-center gap-3 border-b border-line p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-500 text-[17px] font-bold text-white">
                  {initials(fullName, user?.email)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-ink">{fullName}</p>
                  <p className="truncate text-[12px] text-slate-500">{user?.email || user?.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 border-b border-line">
                <div className="px-2 py-3 text-center">
                  <span className="block text-[16px] font-extrabold text-brand-500">{stats.count}</span>
                  <span className="block text-[11px] text-slate-500">Đơn đã đặt</span>
                </div>
                <div className="border-l border-line px-2 py-3 text-center">
                  <span className="block text-[16px] font-extrabold text-brand-500">
                    {fmtVND(stats.spent).replace('₫', '')}<small className="ml-0.5 text-[10px]">đ</small>
                  </span>
                  <span className="block text-[11px] text-slate-500">Tổng đã chi</span>
                </div>
              </div>
              <div className="p-2">
                <AccountNav items={items} active={active} />
                <button
                  type="button"
                  onClick={async () => { await logout(); nav('/'); }}
                  className="flex w-full shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[13.5px] font-medium text-price transition-colors hover:bg-price-soft lg:shrink"
                >
                  <i className="bi bi-box-arrow-right text-[15px]" aria-hidden="true" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <Routes>
              <Route index element={<Profile profile={profile} setProfile={setProfile} />} />
              <Route path="don-hang" element={<MyOrders />} />
              <Route path="don-hang/:id" element={<OrderDetail />} />
              <Route path="dia-chi" element={<Addresses />} />
              <Route path="yeu-thich" element={<Wishlist />} />
            </Routes>
          </div>
        </div>
      </Container>
    </main>
  );
}

function Profile({ profile, setProfile }) {
  const { user, changePassword } = useAuth();
  const [f, setF] = useState({ first_name: '', last_name: '', display_name: '' });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);

  const [pw, setPw] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErr, setPwErr] = useState('');

  useEffect(() => {
    if (profile) {
      setF({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        display_name: profile.display_name || '',
      });
    }
  }, [profile]);

  const dirty = profile && (f.first_name !== (profile.first_name || '')
    || f.last_name !== (profile.last_name || '')
    || f.display_name !== (profile.display_name || ''));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNote(null);
    try {
      await api.put('/auth/me', f);
      const r = await api.get('/auth/me');
      setProfile(r.data.profile || {});
      setNote({ type: 'ok', text: 'Đã lưu hồ sơ' });
    } catch (err) {
      setNote({ type: 'err', text: errMsg(err) });
    } finally { setSaving(false); }
  };

  const savePw = async (e) => {
    e.preventDefault();
    if (!pw.old_password) return setPwErr('Nhập mật khẩu hiện tại.');
    if (pw.new_password.length < 8) return setPwErr('Mật khẩu mới tối thiểu 8 ký tự.');
    if (pw.new_password === pw.old_password) return setPwErr('Mật khẩu mới phải khác mật khẩu cũ.');
    if (pw.new_password !== pw.confirm) return setPwErr('Xác nhận mật khẩu không khớp.');
    setPwSaving(true);
    setPwErr('');
    try {
      await changePassword(pw.old_password, pw.new_password);
      setPw({ old_password: '', new_password: '', confirm: '' });
      toast.success('Đổi mật khẩu thành công');
    } catch (err) {
      setPwErr(errMsg(err));
    } finally { setPwSaving(false); }
  };

  const setP = (k, v) => setPw((c) => ({ ...c, [k]: v }));

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ cá nhân</CardTitle>
          <p className="text-[13px] text-slate-500">Thông tin này dùng cho việc giao hàng và liên hệ hỗ trợ.</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 flex items-center gap-3.5 border-b border-line pb-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-500 text-[20px] font-bold text-white">
              {initials([f.first_name, f.last_name].join(' '), user?.email)}
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-ink">{[f.first_name, f.last_name].filter(Boolean).join(' ') || 'Chưa đặt tên'}</p>
              <p className="truncate text-[13px] text-slate-500">{user?.email || user?.phone}</p>
              {profile?.created_at && (
                <p className="mt-0.5 text-[12px] text-slate-400">
                  <i className="bi bi-star-fill text-accent-500" aria-hidden="true" /> Thành viên từ {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>

          <div className="mb-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
            {[
              ['Email', user?.email || '—'],
              ['Số điện thoại', user?.phone || '—'],
              ['Giới tính', GENDERS.find((g) => g.value === profile?.gender)?.label || 'Chưa xác định'],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#fbfcfd] px-3 py-2.5">
                <span className="block text-[11.5px] text-slate-400">{k}</span>
                <span className="mt-0.5 block truncate text-[13.5px] font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>

          {note && (
            <p className={`mb-3 rounded-lg border px-3 py-2 text-[13px] ${note.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-price'}`}>
              {note.text}
            </p>
          )}

          <form onSubmit={save} className="grid gap-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Tên"><Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} placeholder="Nhập tên" /></Field>
              <Field label="Họ"><Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} placeholder="Nhập họ" /></Field>
            </div>
            <Field label="Tên hiển thị" hint="Hiện trên đơn hàng">
              <Input value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving || !dirty}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
              {dirty && <span className="text-[12.5px] text-accent-700">Bạn có thay đổi chưa lưu</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
          <p className="text-[13px] text-slate-500">Nên dùng mật khẩu riêng, không dùng lại mật khẩu khác.</p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={savePw} className="grid max-w-[440px] gap-3.5">
            {pwErr && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-price" role="alert">{pwErr}</p>}
            <Field label="Mật khẩu hiện tại" required>
              <Input type="password" autoComplete="current-password" value={pw.old_password} onChange={(e) => setP('old_password', e.target.value)} />
            </Field>
            <Field label="Mật khẩu mới" required hint="Tối thiểu 8 ký tự">
              <Input type="password" autoComplete="new-password" value={pw.new_password} onChange={(e) => setP('new_password', e.target.value)} />
            </Field>
            <Field label="Xác nhận mật khẩu mới" required>
              <Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setP('confirm', e.target.value)} />
            </Field>
            <div><Button type="submit" disabled={pwSaving}>{pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
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

  if (!rows) return <Card><CardContent className="pt-5"><p className="text-slate-500">Đang tải...</p></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn mua</CardTitle>
        <p className="text-[13px] text-slate-500">{rows.length} đơn hàng trong tài khoản</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-4 flex gap-1.5 overflow-x-auto border-b border-line pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                filter === f.key ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-500 hover:text-brand-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <Empty
            icon="bi-bag"
            title="Chưa có đơn hàng nào"
            desc={filter === 'all' ? 'Hãy chọn sản phẩm bạn thích để bắt đầu mua sắm.' : 'Không có đơn nào ở trạng thái này.'}
            action={<Link to="/san-pham"><Button className="mt-1">Đi mua sắm</Button></Link>}
          />
        ) : (
          <ul className="grid">
            {list.map((o) => (
              <li key={o.id} className="border-b border-line last:border-0">
                <Link to={`/tai-khoan/don-hang/${o.id}`} className="flex flex-wrap items-center gap-3 px-1 py-3.5 transition-colors hover:bg-mist">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-bold text-ink">{o.order_number}</span>
                      <Chip color={ORDER_CHIP[o.status] || 'default'}>{VI_ORDER[o.status] || o.status}</Chip>
                    </div>
                    <p className="mt-1 text-[12.5px] text-slate-500">Đặt lúc {fmtDate(o.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[15px] font-extrabold text-price">{money(o.total_amount)}</span>
                    <Chip color={PAY_CHIP[o.payment_status] || 'default'}>{PAY_VI[o.payment_status] || o.payment_status}</Chip>
                    <i className="bi bi-chevron-right text-[12px] text-slate-300" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
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

  if (err) return <Card><CardContent className="pt-5"><Empty icon="bi-exclamation-circle" title="Không tải được đơn" desc={err} /></CardContent></Card>;
  if (!o) return <Card><CardContent className="pt-5"><p className="text-slate-500">Đang tải...</p></CardContent></Card>;

  const ship = o.addresses.find((a) => a.address_type === 'shipping');
  const canCancel = ['pending', 'confirmed'].includes(o.status);

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent>
          <Link to="/tai-khoan/don-hang" className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 hover:text-brand-500">
            <i className="bi bi-chevron-left" aria-hidden="true" /> Về danh sách đơn
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-[19px] font-extrabold tracking-tight text-ink">{o.order_number}</h2>
            <Chip color={ORDER_CHIP[o.status] || 'default'}>{VI_ORDER[o.status]}</Chip>
          </div>
          <p className="mt-1 text-[12.5px] text-slate-500">Đặt lúc {fmtDate(o.created_at)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Sản phẩm đã đặt</CardTitle></CardHeader>
        <CardContent className="pt-4">
          <ul className="grid">
            {o.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-[#f8fafc]">
                  {i.image_url_snapshot
                    ? <img src={i.image_url_snapshot} alt="" loading="lazy" className="size-full object-contain p-1" />
                    : <i className="bi bi-image text-slate-300" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-slate-800">{i.product_name_snapshot}</p>
                  <p className="truncate text-[12px] text-slate-500">
                    {[i.variant_name_snapshot, i.sku_snapshot].filter(Boolean).join(' · ')}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">{money(i.unit_price)} × {i.quantity}</p>
                </div>
                <span className="shrink-0 text-[14px] font-bold text-price">{money(i.total_amount)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 grid gap-1.5 border-t border-dashed border-slate-300 pt-3 text-[13.5px]">
            <div className="flex justify-between text-slate-600"><span>Tạm tính</span><b className="text-slate-800">{money(o.subtotal)}</b></div>
            {Number(o.order_discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Giảm giá{o.coupon_code ? ` (${o.coupon_code})` : ''}</span><b>−{money(o.order_discount_amount)}</b>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển</span>
              <b className="text-slate-800">{Number(o.shipping_fee) > 0 ? money(o.shipping_fee) : 'Miễn phí'}</b>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between border-t border-line pt-2.5 text-[15.5px] font-bold text-ink">
              <span>Tổng cộng</span><span className="text-[18px] font-extrabold text-price">{money(o.total_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Địa chỉ giao hàng</CardTitle></CardHeader>
          <CardContent className="pt-4">
            {ship ? (
              <>
                <p className="text-[14px] font-bold text-slate-800">{ship.recipient_name}</p>
                <p className="text-[13px] text-brand-500">{ship.phone}</p>
                <p className="mt-1 text-[13px] text-slate-600">
                  {[ship.address_line, ship.ward_name, ship.district_name, ship.province_name].filter(Boolean).join(', ')}
                </p>
              </>
            ) : <p className="text-[13px] text-slate-500">Không có thông tin địa chỉ.</p>}
            <div className="mt-3 grid gap-1.5 border-t border-line pt-3 text-[13px]">
              <div className="flex items-center justify-between gap-2 text-slate-500">
                <span>Thanh toán</span><Chip color={PAY_CHIP[o.payment_status] || 'default'}>{PAY_VI[o.payment_status] || o.payment_status}</Chip>
              </div>
              <div className="flex justify-between gap-2 text-slate-500">
                <span>Giao hàng</span>
                <b className="text-slate-800">
                  {{ unfulfilled: 'Chưa giao', partial: 'Giao một phần', fulfilled: 'Đã giao', returned: 'Đã trả' }[o.fulfillment_status] || o.fulfillment_status}
                </b>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lịch sử trạng thái</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <ol className="grid">
              {o.history.map((h, i) => (
                <li key={h.id} className="relative pb-4 pl-5 last:pb-0">
                  {i < o.history.length - 1 && <span className="absolute top-3 bottom-0 left-[3px] w-px bg-slate-200" aria-hidden="true" />}
                  <span className="absolute top-1 left-0 size-2 rounded-sm bg-brand-500" aria-hidden="true" />
                  <p className="text-[13.5px] font-semibold text-slate-800">{VI_ORDER[h.to_status] || h.to_status}</p>
                  <p className="mt-0.5 text-[12px] text-slate-400">{fmtDate(h.created_at)}{h.note ? ` · ${h.note}` : ''}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {canCancel && (
        <Card className="border-red-200">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-bold text-price">Hủy đơn hàng</p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">
                Có thể hủy khi đơn còn ở trạng thái chờ xác nhận hoặc đã xác nhận.
              </p>
            </div>
            <Button variant="danger" onClick={cancel} disabled={busy}>{busy ? 'Đang hủy...' : 'Hủy đơn hàng'}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Addresses() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ recipient_name: '', phone: '', province_name: '', district_name: '', ward_name: '', address_line: '', is_default: false });

  const load = () => api.get('/auth/me').then((r) => setRows(r.data.addresses || [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const setA = (k, v) => setF((c) => ({ ...c, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const need = { 'Người nhận': f.recipient_name, 'Số điện thoại': f.phone, 'Tỉnh / Thành phố': f.province_name, 'Xã / Phường': f.ward_name, 'Địa chỉ': f.address_line };
    const missing = Object.entries(need).find(([, v]) => !String(v || '').trim());
    if (missing) return toast.warning(`Vui lòng nhập: ${missing[0]}`);
    setSaving(true);
    try {
      await api.post(`/users/${user.id}/addresses`, f);
      setF({ recipient_name: '', phone: '', province_name: '', district_name: '', ward_name: '', address_line: '', is_default: false });
      toast.success('Đã thêm địa chỉ');
      load();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setSaving(false); }
  };

  const del = async (addrId) => {
    if (globalThis.confirm('Xóa địa chỉ này?')) return;
    try { await api.delete(`/users/addresses/${addrId}`); toast.success('Đã xoá địa chỉ'); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sổ địa chỉ</CardTitle>
        <p className="text-[13px] text-slate-500">Dùng để điền nhanh khi đặt hàng.</p>
      </CardHeader>
      <CardContent className="pt-4">
        {rows === null ? <p className="text-slate-500">Đang tải...</p>
          : rows.length === 0 ? <Empty icon="bi-geo-alt" title="Chưa có địa chỉ nào" desc="Thêm địa chỉ bên dưới để thanh toán nhanh hơn." />
            : (
              <ul className="mb-5 grid gap-2.5">
                {rows.map((a) => (
                  <li key={a.id} className={`flex items-start gap-3 rounded-xl border p-3.5 ${a.is_default ? 'border-brand-500 bg-brand-50' : 'border-line'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-slate-800">
                        {a.recipient_name}
                        {a.is_default && <span className="rounded bg-brand-500 px-1.5 py-0.5 text-[10.5px] font-bold text-white">Mặc định</span>}
                      </p>
                      <p className="text-[12.5px] text-slate-500">{a.phone}</p>
                      <p className="mt-1 text-[13px] text-slate-600">
                        {[a.address_line, a.ward_name, a.district_name, a.province_name].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => del(a.id)}
                      aria-label="Xóa địa chỉ"
                      title="Xóa địa chỉ"
                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-price"
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

        <form onSubmit={save} className="grid gap-3.5 border-t border-line pt-5">
          <h3 className="text-[15px] font-bold text-ink">Thêm địa chỉ mới</h3>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Người nhận" required><Input value={f.recipient_name} onChange={(e) => setA('recipient_name', e.target.value)} placeholder="Nguyễn Văn A" /></Field>
            <Field label="Số điện thoại" required><Input type="tel" value={f.phone} onChange={(e) => setA('phone', e.target.value)} placeholder="09xx xxx xxx" /></Field>
            <Field label="Tỉnh / Thành phố" required><Input value={f.province_name} onChange={(e) => setA('province_name', e.target.value)} placeholder="TP. Hồ Chí Minh" /></Field>
            <Field label="Xã / Phường" required><Input value={f.ward_name} onChange={(e) => setA('ward_name', e.target.value)} placeholder="Phường 1" /></Field>
            <Field label="Quận / Huyện"><Input value={f.district_name} onChange={(e) => setA('district_name', e.target.value)} /></Field>
            <Field label="Địa chỉ (số nhà, đường)" required className="sm:col-span-2"><Input value={f.address_line} onChange={(e) => setA('address_line', e.target.value)} placeholder="123 Lê Lợi" /></Field>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-slate-700">
            <Checkbox checked={f.is_default} onChange={(e) => setA('is_default', e.target.checked)} />
            Đặt làm địa chỉ mặc định
          </label>
          <div><Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Thêm địa chỉ'}</Button></div>
        </form>
      </CardContent>
    </Card>
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

  if (!wl) return <Card><CardContent className="pt-5"><p className="text-slate-500">Đang tải...</p></CardContent></Card>;
  const items = wl.items || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sản phẩm yêu thích</CardTitle>
        {items.length > 0 && <p className="text-[13px] text-slate-500">{items.length} sản phẩm đã lưu</p>}
      </CardHeader>
      <CardContent className="pt-4">
        {items.length === 0 ? (
          <Empty
            icon="bi-heart"
            title="Chưa có sản phẩm yêu thích"
            desc="Bấm biểu tượng trái tim ở trang sản phẩm để lưu lại xem sau."
            action={<Link to="/san-pham"><Button className="mt-1">Khám phá sản phẩm</Button></Link>}
          />
        ) : (
          <ul className="grid">
            {items.map((i) => (
              <li key={i.product_id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                <Link to={`/san-pham/${i.slug}`} className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-[#f8fafc]">
                  {i.image_key
                    ? <img src={fileUrl(i.image_key)} alt="" loading="lazy" className="size-full object-contain p-1" />
                    : <i className="bi bi-image text-slate-300" aria-hidden="true" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/san-pham/${i.slug}`} className="line-clamp-1 text-[13.5px] font-semibold text-slate-800 hover:text-brand-500">
                    {i.name}
                  </Link>
                  <p className="mt-0.5 text-[14px] font-bold text-price">{money(i.base_price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => del(i.product_id)}
                  aria-label="Bỏ khỏi yêu thích"
                  title="Bỏ khỏi yêu thích"
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-price"
                >
                  <i className="bi bi-trash" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function Account() {
  const { user, ready } = useAuth();
  if (!ready) return <main className="pb-10"><Container className="py-12 text-center text-slate-500">Đang tải...</Container></main>;
  if (!user) {
    return (
      <main className="pb-10">
        <Container>
          <Empty
            icon="bi-person-lock"
            title="Bạn chưa đăng nhập"
            desc="Vui lòng đăng nhập để xem tài khoản của bạn."
            action={<Link to="/dang-nhap"><Button className="mt-1">Đăng nhập</Button></Link>}
          />
        </Container>
      </main>
    );
  }
  return <Shell />;
}
