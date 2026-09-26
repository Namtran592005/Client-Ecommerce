import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/Toast';

export default function ForcePasswordChange() {
  const { user, changePassword, logout } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const set = (key, value) => setForm((c) => ({ ...c, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.old_password) return toast.warning('Nhập mật khẩu hiện tại');
    if (form.new_password.length < 8) return toast.warning('Mật khẩu mới tối thiểu 8 ký tự');
    if (form.new_password === form.old_password) return toast.warning('Mật khẩu mới phải khác mật khẩu hiện tại');
    if (form.new_password !== form.confirm) return toast.warning('Xác nhận mật khẩu không khớp');
    setSaving(true);
    try {
      await changePassword(form.old_password, form.new_password);
      toast.success('Đổi mật khẩu thành công');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="pwforce-page">
      <form className="pwforce-card" onSubmit={submit}>
        <h1 className="pwforce-title">Đổi mật khẩu</h1>
        <p className="pwforce-desc">
          Tài khoản <b>{user?.email || user?.phone}</b> đang dùng mật khẩu tạm thời.
          Hãy đặt mật khẩu riêng của bạn để tiếp tục mua sắm.
        </p>

        <label className="pwforce-field">
          <span>Mật khẩu hiện tại *</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={form.old_password}
            onChange={(e) => set('old_password', e.target.value)}
          />
        </label>
        <label className="pwforce-field">
          <span>Mật khẩu mới *</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.new_password}
            onChange={(e) => set('new_password', e.target.value)}
          />
          <em>Tối thiểu 8 ký tự</em>
        </label>
        <label className="pwforce-field">
          <span>Xác nhận mật khẩu mới *</span>
          <input
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => set('confirm', e.target.value)}
          />
        </label>

        <button className="pwforce-btn" type="submit" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Đổi mật khẩu và tiếp tục'}
        </button>
        <button className="pwforce-out" type="button" onClick={logout}>Đăng xuất</button>
      </form>
    </main>
  );
}
