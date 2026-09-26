import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtVND, errMsg } from '../api/client';
import { Container } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input, Field } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Chip, Empty } from '../components/ui/misc';

const VI_STATUS = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang xử lý', packed: 'Đã đóng gói',
  shipping: 'Đang giao', delivered: 'Đã giao', completed: 'Hoàn tất', cancelled: 'Đã huỷ',
  returned: 'Đã trả hàng', refunded: 'Hoàn tiền',
};
const CHIP = {
  pending: 'amber', confirmed: 'brand', processing: 'default', packed: 'default',
  shipping: 'brand', delivered: 'green', completed: 'green',
  cancelled: 'red', returned: 'red', refunded: 'red',
};
const PAY_VI = {
  unpaid: 'Chưa thanh toán', pending: 'Đang xử lý', paid: 'Đã thanh toán',
  partially_refunded: 'Hoàn một phần', refunded: 'Hoàn tiền', failed: 'Thất bại',
};
const TRACK_VI = {
  pending: 'Đang chuẩn bị', picked_up: 'Đã lấy hàng', in_transit: 'Đang vận chuyển',
  out_for_delivery: 'Đang giao đến bạn', delivered: 'Đã giao thành công',
  failed: 'Giao thất bại', returned: 'Đã trả lại',
};
const money = (n) => fmtVND(n);

export default function OrderLookup() {
  const [form, setForm] = useState({ order_number: '', phone: '', date: '' });
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((c) => ({ ...c, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setData(null);
    if (!form.order_number.trim() || !form.phone.trim() || !form.date) {
      setErr('Vui lòng nhập đủ mã đơn hàng, số điện thoại và ngày đặt hàng.');
      return;
    }
    setBusy(true);
    try {
      const { data: res } = await api.get('/orders/lookup', { params: form });
      setData(res);
    } catch (e2) {
      setErr(errMsg(e2, 'Không tra cứu được đơn hàng'));
    } finally {
      setBusy(false);
    }
  };

  const o = data?.order;

  return (
    <main className="pb-12">
      <Container>
        <nav aria-label="breadcrumb" className="py-3 text-[12.5px] text-slate-500">
          <ol className="flex items-center gap-1.5">
            <li><Link to="/" className="hover:text-brand-500">Trang chủ</Link></li>
            <li aria-hidden="true"><i className="bi bi-chevron-right text-[10px]" /></li>
            <li className="font-medium text-slate-700">Tra cứu đơn hàng</li>
          </ol>
        </nav>

        <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">Tra cứu đơn hàng</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-slate-500">
          Chưa có tài khoản? Nhập mã đơn hàng, số điện thoại người nhận và ngày đặt hàng để xem trạng thái.
        </p>

        <Card className="mt-5">
          <CardHeader><CardTitle>Thông tin tra cứu</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <Field label="Mã đơn hàng" required>
                <Input
                  value={form.order_number}
                  onChange={set('order_number')}
                  placeholder="VD: ORD-DEMO-0014"
                  autoComplete="off"
                />
              </Field>
              <Field label="Số điện thoại người nhận" required>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="VD: 0955555555"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Ngày đặt hàng" required className="sm:col-span-2">
                <Input type="date" value={form.date} onChange={set('date')} />
              </Field>
              {err && (
                <p role="alert" className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-price sm:col-span-2">
                  <i className="bi bi-exclamation-circle-fill" aria-hidden="true" /> {err}
                </p>
              )}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={busy}>
                  {busy ? 'Đang tra cứu...' : 'Tra cứu đơn hàng'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {o && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <span className="flex flex-wrap items-center gap-2">
                      Đơn {o.order_number}
                      <Chip color={CHIP[o.status] || 'default'}>{VI_STATUS[o.status] || o.status}</Chip>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="grid gap-2.5">
                    {data.items.map((it, i) => (
                      <li key={i} className="flex items-start justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <Link to={`/san-pham/${it.product_slug}`} className="line-clamp-1 text-[13.5px] font-medium text-slate-800 hover:text-brand-500">
                            {it.product_name}
                          </Link>
                          <p className="text-[12px] text-slate-500">Số lượng: {it.quantity}</p>
                        </div>
                        <span className="shrink-0 text-[13.5px] font-bold text-price">{money(it.total_amount)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {data.tracking && (
                <Card>
                  <CardHeader><CardTitle>Vận chuyển</CardTitle></CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid gap-2 text-[13.5px]">
                      {data.tracking.tracking_number && (
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500">Mã vận đơn</span>
                          <span className="font-semibold text-slate-800">{data.tracking.tracking_number}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-500">Trạng thái</span>
                        <span className="font-semibold text-slate-800">{TRACK_VI[data.tracking.ev_status] || data.tracking.status}</span>
                      </div>
                      {data.tracking.description && (
                        <p className="text-slate-600">{data.tracking.description}</p>
                      )}
                      {data.tracking.occurred_at && (
                        <p className="text-[12px] text-slate-400">
                          Cập nhật lúc {new Date(data.tracking.occurred_at).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <aside>
              <div className="grid gap-3 rounded-xl border border-line bg-white p-4 shadow-card">
                <div className="grid gap-2 text-[13.5px]">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Người nhận</span>
                    <span className="text-right font-medium text-slate-800">{o.recipient_name}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Ngày đặt</span>
                    <span className="font-medium text-slate-800">
                      {new Date(o.placed_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">Thanh toán</span>
                    <span className="font-medium text-slate-800">{PAY_VI[o.payment_status] || o.payment_status}</span>
                  </div>
                  {o.address && (
                    <p className="border-t border-line pt-2 text-[12.5px] text-slate-500">
                      <span className="block text-slate-400">Địa chỉ nhận hàng</span>
                      {o.address}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5 border-t border-line pt-3 text-[13.5px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Tạm tính</span><b className="text-slate-800">{money(o.subtotal)}</b>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển</span>
                    <b className="text-slate-800">{money(o.shipping_fee)}</b>
                  </div>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-3">
                  <span className="text-[14px] font-semibold text-slate-700">Tổng cộng</span>
                  <span className="text-[19px] font-bold text-price">{money(o.total_amount)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {!o && !busy && !err && (
          <Empty
            icon="bi-receipt"
            title="Chưa có kết quả"
            desc="Nhập thông tin đơn hàng rồi bấm Tra cứu đơn hàng để xem trạng thái."
          />
        )}
      </Container>
    </main>
  );
}
