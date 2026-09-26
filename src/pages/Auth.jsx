import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/ui/toast';
import { Container } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input, Field } from '../components/ui/input';

function Shell({ title, sub, children, footer }) {
  return (
    <main className="pb-12">
      <Container className="pt-8 sm:pt-12">
        <div className="mx-auto max-w-[420px]">
          <div className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h1 className="text-center text-[20px] font-bold tracking-tight text-ink">{title}</h1>
            {sub && <p className="mt-1 text-center text-[13px] text-slate-500">{sub}</p>}
            <div className="mt-5">{children}</div>
          </div>
          {footer && <div className="mt-4 text-center text-[13px] text-slate-600">{footer}</div>}
        </div>
      </Container>
    </main>
  );
}

export function Login() {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!id.trim() || !pw) return setErr('Nhập email/số điện thoại và mật khẩu');
    setLoading(true);
    setErr('');
    try {
      await login(id.trim(), pw);
      nav('/tai-khoan');
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Sai tài khoản hoặc mật khẩu');
    } finally { setLoading(false); }
  };

  return (
    <Shell
      title="Đăng nhập"
      sub="Chào mừng trở lại với UniMate"
      footer={<>Chưa có tài khoản? <Link to="/dang-ky" className="font-semibold text-brand-500 hover:underline">Đăng ký ngay</Link></>}
    >
      <form onSubmit={submit} className="grid gap-3.5">
        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-price" role="alert">{err}</p>
        )}
        <Field label="Email / Số điện thoại" required>
          <Input value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" placeholder="ban@example.com" />
        </Field>
        <Field label="Mật khẩu" required>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="••••••••" />
        </Field>
        <Button type="submit" size="lg" block disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const [f, setF] = useState({ email: '', phone: '', password: '', first_name: '', last_name: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const set = (k, v) => setF((c) => ({ ...c, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.email.trim() && !f.phone.trim()) return setErr('Cần email hoặc số điện thoại');
    if (f.password.length < 8) return setErr('Mật khẩu tối thiểu 8 ký tự');
    setLoading(true);
    setErr('');
    try {
      await register({ ...f, email: f.email.trim(), phone: f.phone.trim() });
      toast.success('Đăng ký thành công');
      nav('/tai-khoan');
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  return (
    <Shell
      title="Đăng ký"
      sub="Tạo tài khoản để bắt đầu mua sắm"
      footer={<>Đã có tài khoản? <Link to="/dang-nhap" className="font-semibold text-brand-500 hover:underline">Đăng nhập</Link></>}
    >
      <form onSubmit={submit} className="grid gap-3.5">
        {err && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-price" role="alert">{err}</p>
        )}
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Tên"><Input value={f.first_name} onChange={(e) => set('first_name', e.target.value)} /></Field>
          <Field label="Họ"><Input value={f.last_name} onChange={(e) => set('last_name', e.target.value)} /></Field>
        </div>
        <Field label="Email" hint="Dùng để nhận hoá đơn">
          <Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="ban@example.com" />
        </Field>
        <Field label="Số điện thoại">
          <Input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="09xx xxx xxx" />
        </Field>
        <Field label="Mật khẩu" required hint="Tối thiểu 8 ký tự">
          <Input type="password" value={f.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
        </Field>
        <Button type="submit" size="lg" block disabled={loading}>
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </Button>
      </form>
    </Shell>
  );
}
