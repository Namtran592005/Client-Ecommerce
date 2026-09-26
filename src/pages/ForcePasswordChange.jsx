import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { toast } from '../components/Toast';
import { Button } from '../components/ui/button';
import { Input, Field } from '../components/ui/input';
import { Container } from '../components/Layout';

export default function ForcePasswordChange() {
  const { user, changePassword, logout } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => { setForm((c) => ({ ...c, [k]: v })); setErr(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.old_password) return setErr('Nhập mật khẩu hiện tại.');
    if (form.new_password.length < 8) return setErr('Mật khẩu mới tối thiểu 8 ký tự.');
    if (form.new_password === form.old_password) return setErr('Mật khẩu mới phải khác mật khẩu hiện tại.');
    if (form.new_password !== form.confirm) return setErr('Xác nhận mật khẩu không khớp.');
    setSaving(true);
    try {
      await changePassword(form.old_password, form.new_password);
      toast.success('Đổi mật khẩu thành công');
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Đổi mật khẩu thất bại');
    } finally { setSaving(false); }
  };

  return (
    <main className="pb-12">
      <Container className="pt-8 sm:pt-12">
        <form onSubmit={submit} className="mx-auto max-w-[420px] rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent-100 text-[20px] text-accent-700">
              <i className="bi bi-shield-exclamation" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-[19px] font-extrabold tracking-tight text-ink">Đổi mật khẩu</h1>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                Tài khoản <b className="break-all text-ink">{user?.email || user?.phone}</b> đang dùng
                mật khẩu tạm thời. Hãy đặt mật khẩu riêng trước khi tiếp tục.
              </p>
            </div>
          </div>

          <div className="grid gap-3.5">
            {err && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-price" role="alert">{err}</p>
            )}
            <Field label="Mật khẩu hiện tại" required>
              <Input type="password" autoFocus autoComplete="current-password" value={form.old_password} onChange={(e) => set('old_password', e.target.value)} />
            </Field>
            <Field label="Mật khẩu mới" required hint="Tối thiểu 8 ký tự">
              <Input type="password" autoComplete="new-password" value={form.new_password} onChange={(e) => set('new_password', e.target.value)} />
            </Field>
            <Field label="Xác nhận mật khẩu mới" required>
              <Input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
            </Field>
            <Button type="submit" size="lg" block disabled={saving}>
              {saving ? 'Đang lưu...' : 'Đổi mật khẩu và tiếp tục'}
            </Button>
            <Button type="button" variant="ghost" block onClick={logout}>Đăng xuất</Button>
          </div>
        </form>
      </Container>
    </main>
  );
}
