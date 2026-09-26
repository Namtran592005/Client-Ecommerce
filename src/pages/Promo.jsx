import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtVND, errMsg } from '../api/client';
import { toast } from '../components/ui/toast';
import { Container } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Empty } from '../components/ui/misc';

const money = (n) => `${fmtVND(n).replace('₫', '')}VND`;

export default function Promo() {
  const [promos, setPromos] = useState([]);
  // Chỉ hiện "chưa có chương trình" sau khi đã tải xong, tránh nhảy ra rồi mất.
  const [promosLoaded, setPromosLoaded] = useState(false);
  const [code, setCode] = useState('');
  const [res, setRes] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    api.get('/promos/promotions').then((r) => setPromos(r.data)).catch(() => {}).finally(() => setPromosLoaded(true));
  }, []);

  const copy = async (c) => {
    try { await navigator.clipboard.writeText(c); toast.success(`Đã chép mã ${c}`); }
    catch { toast.warning(`Mã của bạn: ${c}`); }
  };

  const check = async () => {
    if (!code.trim()) return;
    setChecking(true);
    setRes(null);
    try {
      const { data } = await api.post('/promos/coupons/validate', { code: code.trim().toUpperCase(), order_amount: 500000 });
      setRes(data);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setChecking(false); }
  };

  return (
    <main className="pb-10">
      <Container>
        <nav aria-label="breadcrumb" className="py-3 text-[12.5px] text-slate-500">
          <ol className="flex items-center gap-1.5">
            <li><Link to="/" className="hover:text-brand-500">Trang chủ</Link></li>
            <li aria-hidden="true"><i className="bi bi-chevron-right text-[10px]" /></li>
            <li className="font-medium text-slate-700">Khuyến mãi</li>
          </ol>
        </nav>

        <div className="pb-5">
          <h1 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">Ưu đãi đặc biệt</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Săn mã giảm giá mỗi ngày — áp dụng ở giỏ hàng</p>
        </div>

        {promosLoaded && promos.length === 0 ? (
          <Empty icon="bi-ticket-perforated" title="Chưa có chương trình nào" desc="Quay lại sau nhé, UniMate thường xuyên có ưu đãi." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p) => (
              <li key={p.id} className="flex overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <div
                  className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-1.5 p-2 text-center text-white"
                  style={{ background: 'linear-gradient(135deg,#0b3d9e,#2f7fd0)' }}
                >
                  <i className="bi bi-ticket-perforated text-[22px]" aria-hidden="true" />
                  <span className="text-[12.5px] font-bold break-all">{p.code || 'SALE'}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
                  <h2 className="text-[14px] font-bold text-ink">{p.name}</h2>
                  <p className="text-[12.5px] text-slate-500">
                    {p.description || 'Áp dụng cho đơn hàng'}
                    {p.minimum_order_amount > 0 && <> · Đơn từ {money(p.minimum_order_amount)}</>}
                  </p>
                  {p.code && (
                    <Button size="sm" className="mt-auto self-start" onClick={() => copy(p.code)}>
                      <i className="bi bi-copy" aria-hidden="true" /> Chép mã
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 max-w-[520px] rounded-xl border border-line bg-white p-4 shadow-card">
          <h2 className="mb-3 text-[15px] font-bold text-ink">Thử mã giảm giá</h2>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã, VD: CHAO10"
              onKeyDown={(e) => e.key === 'Enter' && check()}
            />
            <Button variant="outline" onClick={check} disabled={checking || !code.trim()}>
              {checking ? '...' : 'Kiểm tra'}
            </Button>
          </div>
          {res && (
            <p className={`mt-2.5 flex items-center gap-1.5 text-[12.5px] ${res.valid ? 'text-emerald-700' : 'text-price'}`}>
              <i className={`bi ${res.valid ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} aria-hidden="true" />
              {res.valid
                ? `Mã hợp lệ — đơn 500.000VND được giảm ${money(res.discount_amount)}`
                : res.error}
            </p>
          )}
        </div>
      </Container>
    </main>
  );
}
