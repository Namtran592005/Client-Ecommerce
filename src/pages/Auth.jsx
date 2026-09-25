import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errMsg } from '../api/client';

function Shell({ title, children }) {
  return (
    <main className="category-page">
      <div className="breadcrumb-wrap">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb-custom">
            <li><Link to="/">Trang chủ</Link><span className="sep"><i className="bi bi-chevron-right"></i></span></li>
            <li><span className="current">{title}</span></li>
          </ol>
        </nav>
      </div>
      <div className="category-container" style={{ maxWidth: 460, paddingBottom: 60 }}>
        <div className="text-center mb-3">
          <img src="/logo/logo-light.png" alt="UniMate" height="44" />
        </div>
        <h1 className="page-title text-center" style={{ marginBottom: 16 }}>{title}</h1>
        <div style={{ border: '1px solid #e9ecef', borderRadius: 8, padding: 24, background: '#fff', boxShadow: '0 2px 12px rgba(11,61,158,.06)' }}>
          {children}
        </div>
      </div>
    </main>
  );
}

export function Login() {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    try { await login(id.trim(), pw); nav('/tai-khoan'); }
    catch (e) { setErr(errMsg(e, 'Sai tài khoản hoặc mật khẩu')); }
    finally { setLoading(false); }
  };
  return (
    <Shell title="Đăng nhập">
      <form onSubmit={submit}>
        {err && <div className="alert alert-danger">{err}</div>}
        <label style={{ fontWeight: 600, fontSize: 13 }}>Email / Số điện thoại</label>
        <input className="form-control mb-2" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
        <label style={{ fontWeight: 600, fontSize: 13 }}>Mật khẩu</label>
        <input className="form-control mb-3" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        <button className="p-buy w-100" style={{ padding: '10px 0' }} disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}</button>
        <p className="mt-2 mb-0 text-center" style={{ fontSize: 13 }}>Chưa có tài khoản? <Link to="/dang-ky" style={{ color: 'var(--unimate-primary)' }}>Đăng ký ngay</Link></p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const [f, setF] = useState({ email: '', phone: '', password: '', first_name: '', last_name: '' });
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try { await register(f); nav('/tai-khoan'); }
    catch (e) { setErr(errMsg(e)); }
  };
  const set = (k, v) => setF({ ...f, [k]: v });
  return (
    <Shell title="Đăng ký">
      <form onSubmit={submit}>
        {err && <div className="alert alert-danger">{err}</div>}
        <div className="row g-2">
          <div className="col-6"><label style={{ fontWeight: 600, fontSize: 13 }}>Tên</label><input className="form-control" value={f.first_name} onChange={(e) => set('first_name', e.target.value)} /></div>
          <div className="col-6"><label style={{ fontWeight: 600, fontSize: 13 }}>Họ</label><input className="form-control" value={f.last_name} onChange={(e) => set('last_name', e.target.value)} /></div>
          <div className="col-12"><label style={{ fontWeight: 600, fontSize: 13 }}>Email</label><input className="form-control" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="col-12"><label style={{ fontWeight: 600, fontSize: 13 }}>Số điện thoại</label><input className="form-control" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div className="col-12"><label style={{ fontWeight: 600, fontSize: 13 }}>Mật khẩu (≥ 8 ký tự)</label><input className="form-control" type="password" value={f.password} onChange={(e) => set('password', e.target.value)} /></div>
          <div className="col-12"><button className="p-buy w-100" style={{ padding: '10px 0' }}>Tạo Tài Khoản</button></div>
          <p className="mb-0 text-center" style={{ fontSize: 13 }}>Đã có tài khoản? <Link to="/dang-nhap" style={{ color: 'var(--unimate-primary)' }}>Đăng nhập</Link></p>
        </div>
      </form>
    </Shell>
  );
}
