import { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

const DEMO_USERS = [
  { label: 'Super Admin',    email: 'admin@nexabank.com',    role: 'super_admin' },
  { label: 'Branch Manager', email: 'manager@nexabank.com',  role: 'branch_manager' },
  { label: 'Employee',       email: 'employee@nexabank.com', role: 'employee' },
  { label: 'Auditor',        email: 'auditor@nexabank.com',  role: 'auditor' },
];

const LoginPage = () => {
  const { login } = useAuth();
  const toast     = useToast();
  const [email,    setEmail]    = useState('admin@nexabank.com');
  const [password, setPassword] = useState('password123');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your credentials'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>
        Sign In
      </h2>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Enter your credentials to access the banking portal
      </p>

      {/* Demo Quick Login */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10, fontWeight: 500 }}>
          Quick Demo Login:
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DEMO_USERS.map(u => (
            <button
              key={u.email}
              type="button"
              onClick={() => { setEmail(u.email); setPassword('password123'); setError(''); }}
              style={{
                padding: '5px 12px',
                borderRadius: 99,
                border: `1.5px solid ${email === u.email ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: email === u.email ? 'var(--color-primary-light)' : 'transparent',
                color: email === u.email ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="your@email.com"
            autoComplete="email"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="form-control"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', display: 'flex', padding: 2,
              }}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 2 }}>
            Demo password: <code style={{ background: 'var(--color-bg-secondary)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>password123</code>
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--color-danger-light)',
            border: '1px solid var(--color-danger)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--color-danger-dark)',
          }}>
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" fullWidth loading={loading} icon={<LogIn size={16} />}>
          Sign In
        </Button>
      </form>
    </>
  );
};

export default LoginPage;
