import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api, fmtVND } from '../api/client';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/ui/toast';
import { Container } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input, Select, Checkbox, Field } from '../components/ui/input';
import { Chip, Empty } from '../components/ui/misc';
import { ProvinceWardFields } from '../components/AddressFields';

const PAY_META = {
  cod: { icon: 'bi-cash-coin', desc: 'Trả tiền mặt khi nhận hàng' },
  bank_transfer: { icon: 'bi-bank', desc: 'Chuyển khoản qua ngân hàng', soon: true },
  vnpay: { icon: 'bi-wallet2', desc: 'Quét QR / thẻ qua VNPay', soon: true },
  momo: { icon: 'bi-phone', desc: 'Ví điện tử MoMo', soon: true },
  zalopay: { icon: 'bi-chat-dots', desc: 'Ví điện tử ZaloPay', soon: true },
  card: { icon: 'bi-credit-card', desc: 'Thẻ ATM / Visa / Mastercard', soon: true },
};

const money = (n) => `${fmtVND(n).replace('₫', '')}VND`;

const Crumb = ({ items }) => (
  <nav aria-label="breadcrumb" className="py-3 text-[12.5px] text-slate-500">
    <ol className="flex flex-wrap items-center gap-1.5">
      {items.map((it, i) => (
        <li key={it.label} className="flex items-center gap-1.5">
          {i > 0 && <i className="bi bi-chevron-right text-[10px]" aria-hidden="true" />}
          {it.to ? <Link to={it.to} className="hover:text-brand-500">{it.label}</Link> : <span className="font-medium text-slate-700">{it.label}</span>}
        </li>
      ))}
    </ol>
  </nav>
);

export default function Checkout() {
  const { cart, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [addr, setAddr] = useState({
    recipient_name: '', phone: user?.phone || '', email: user?.email || '',
    province_code: '', province_name: '', ward_name: '', address_line: '',
  });
  const [payMethods, setPayMethods] = useState([]);
  const [shipMethods, setShipMethods] = useState([]);
  const [payCode, setPayCode] = useState('cod');
  const [shipCode, setShipCode] = useState('');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [buyNow, setBuyNow] = useState(loc.state?.buyNow || null);
  const coupon = loc.state?.coupon || '';

  useEffect(() => { if (!loc.state?.buyNow) setBuyNow(null); }, [loc.state]);

  useEffect(() => {
    api.get('/payments/methods').then((r) => setPayMethods(r.data)).catch(() => {});
    api.get('/shipping/methods').then((r) => setShipMethods(r.data)).catch(() => {});
    if (user) {
      api.get('/auth/me').then((r) => {
        const d = (r.data.addresses || []).find((a) => a.is_default) || r.data.addresses?.[0];
        if (d) {
          setAddr({
            recipient_name: d.recipient_name, phone: d.phone, email: user.email || '',
            province_code: d.province_code || '', province_name: d.province_name,
            ward_name: d.ward_name || '', address_line: d.address_line,
          });
        } else {
          setAddr((a) => ({ ...a, phone: user.phone || '', email: user.email || '' }));
        }
      }).catch(() => {});
    }
  }, [user]);

  const items = buyNow ? [{ id: `buynow-${buyNow.variant_id}`, ...buyNow }] : cart.items;
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  if (!items.length) {
    return (
      <main className="pb-10">
        <Container>
          <Empty
            icon="bi-cart-x"
            title="Giỏ hàng đang trống"
            desc="Chưa có sản phẩm nào để thanh toán."
            action={<Link to="/san-pham"><Button className="mt-1">Đi mua sắm ngay</Button></Link>}
          />
        </Container>
      </main>
    );
  }

  const shipFee = shipMethods.find((m) => m.code === shipCode)?.base_fee ?? 30000;
  const total = subtotal + shipFee;
  const setA = (k, v) => setAddr((a) => ({ ...a, [k]: v }));

  const submit = async () => {
    if (!addr.recipient_name.trim() || !addr.phone.trim() || !addr.province_name.trim() || !addr.ward_name.trim() || !addr.address_line.trim()) {
      return toast.warning('Điền đủ họ tên, SĐT, xã/phường, tỉnh/thành và địa chỉ');
    }
    if (!/^\d{9,11}$/.test(addr.phone.trim().replace(/\D/g, ''))) {
      return toast.warning('Số điện thoại chưa hợp lệ');
    }
    setPlacing(true);
    try {
      const { data } = await api.post('/orders/checkout', {
        items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        shipping_address: addr,
        coupon_code: coupon || undefined,
        payment_method_code: payCode,
        shipping_method_code: shipCode || undefined,
        customer_note: note,
      });
      if (!buyNow) await clear();
      setBuyNow(null);
      nav(`/dat-hang-thanh-cong/${data.id}`, {
        replace: true,
        state: { order_number: data.order_number, total: data.total_amount },
      });
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Đặt hàng thất bại');
    } finally { setPlacing(false); }
  };

  return (
    <main className="pb-10">
      <Container>
        <Crumb items={[{ label: 'Trang chủ', to: '/' }, { label: 'Giỏ hàng', to: '/gio-hang' }, { label: 'Thanh toán' }]} />
        <h1 className="pb-4 text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">Thanh toán</h1>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-6">
            <section>
              <h2 className="mb-3 text-[15px] font-bold text-ink">Địa chỉ giao hàng</h2>
              <div className="grid gap-3 rounded-xl border border-line bg-white p-4 shadow-card sm:grid-cols-2">
                <Field label="Người nhận" required>
                  <Input value={addr.recipient_name} onChange={(e) => setA('recipient_name', e.target.value)} placeholder="Nguyễn Văn A" />
                </Field>
                <Field label="Số điện thoại" required>
                  <Input type="tel" value={addr.phone} onChange={(e) => setA('phone', e.target.value)} placeholder="09xx xxx xxx" />
                </Field>
                <Field label="Địa chỉ (số nhà, đường)" required className="sm:col-span-2">
                  <Input value={addr.address_line} onChange={(e) => setA('address_line', e.target.value)} placeholder="123 Lê Lợi" />
                </Field>
                <ProvinceWardFields
                  provinceCode={addr.province_code}
                  provinceName={addr.province_name}
                  wardName={addr.ward_name}
                  onChange={setA}
                />
                <Field label="Email nhận hoá đơn">
                  <Input type="email" value={addr.email} onChange={(e) => setA('email', e.target.value)} />
                </Field>
                <Field label="Ghi chú cho shop">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: giao giờ hành chính" />
                </Field>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-[15px] font-bold text-ink">Phương thức thanh toán</h2>
              <div className="grid gap-2.5">
                {payMethods.map((m) => {
                  const meta = PAY_META[m.code] || {};
                  const off = !!meta.soon;
                  const on = payCode === m.code;
                  return (
                    <label
                      key={m.code}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition-colors ${
                        off ? 'cursor-not-allowed border-line/70 opacity-55'
                          : on ? 'border-brand-300 bg-brand-50/60'
                            : 'border-line/80 hover:border-slate-300'
                      }`}
                    >
                      <Checkbox
                        type="radio"
                        name="pay"
                        checked={on}
                        disabled={off}
                        onChange={() => setPayCode(m.code)}
                      />
                      <span className={`flex h-10 w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white px-2 ${on ? 'border-brand-200' : 'border-line/70'}`}>
                        {m.logo_url ? (
                          <img src={m.logo_url} alt="" className="max-h-6 max-w-full object-contain" />
                        ) : (
                          <i className={`bi ${meta.icon || 'bi-wallet2'} text-[16px] text-brand-500`} aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold text-ink">
                          {m.name}
                          {off && <Chip>Sắp ra mắt</Chip>}
                        </span>
                        {meta.desc && <span className="block text-[12.5px] text-slate-500">{meta.desc}</span>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-[15px] font-bold text-ink">Vận chuyển</h2>
              <Select value={shipCode} onChange={(e) => setShipCode(e.target.value)} aria-label="Hình thức giao hàng">
                <option value="">Mặc định — 30.000VND</option>
                {shipMethods.map((m) => (
                  <option key={m.code} value={m.code}>{m.name} — {money(m.base_fee)}</option>
                ))}
              </Select>
            </section>
          </div>

          <aside>
            <div className="sticky top-28 grid gap-3 rounded-xl border border-line bg-white p-4 shadow-card">
              <h2 className="text-[15px] font-bold text-ink">Đơn hàng ({items.length})</h2>

              {buyNow && (
                <p className="rounded-lg bg-accent-50 px-3 py-2 text-[12.5px] text-accent-700">
                  Mua ngay — sản phẩm này không được thêm vào giỏ hàng.
                </p>
              )}

              <ul className="grid gap-2 border-b border-line pb-3">
                {items.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-3 text-[13px]">
                    <span className="min-w-0 text-slate-600">
                      <span className="line-clamp-2">{i.product_name}</span>
                      {i.variant_name && <span className="block text-[11.5px] text-slate-400">{i.variant_name}</span>}
                      <span className="text-slate-400">× {i.quantity}</span>
                    </span>
                    <b className="shrink-0 font-semibold text-slate-800">{money(i.price * i.quantity)}</b>
                  </li>
                ))}
              </ul>

              <div className="grid gap-1.5 text-[13.5px]">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span><b className="text-slate-800">{money(subtotal)}</b>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển</span><b className="text-slate-800">{money(shipFee)}</b>
                </div>
                {coupon && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Mã {coupon}</span><span>áp dụng lúc chốt</span>
                  </div>
                )}
              </div>

              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-[14px] font-semibold text-slate-700">Tổng cộng</span>
                <span className="text-[20px] font-bold text-price">{money(total)}</span>
              </div>

              <Button size="lg" block onClick={submit} disabled={placing}>
                {placing ? 'Đang đặt hàng...' : 'Đặt hàng'}
              </Button>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}

export function CheckoutSuccess() {
  const loc = useLocation();
  const { order_number: orderNo, total } = loc.state || {};
  return (
    <main className="pb-10">
      <Container>
        <div className="mx-auto max-w-lg rounded-xl border border-line bg-white px-6 py-10 text-center shadow-card">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-3xl text-emerald-600">
            <i className="bi bi-check-lg" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-[21px] font-bold text-ink">Đặt hàng thành công</h1>
          {orderNo && <p className="mt-1 text-[13.5px] text-slate-600">Mã đơn <b className="text-brand-600">{orderNo}</b></p>}
          {total ? <p className="text-[13.5px] text-slate-600">Tổng thanh toán {money(total)}</p> : null}
          <p className="mt-1 text-[13px] text-slate-500">Shop sẽ liên hệ xác nhận và giao hàng sớm nhất.</p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link to="/tai-khoan/don-hang"><Button variant="outline" block>Theo dõi đơn</Button></Link>
            <Link to="/san-pham"><Button block>Tiếp tục mua</Button></Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
