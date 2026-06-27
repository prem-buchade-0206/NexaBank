import { Navigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthLayout = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, background: 'var(--color-primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary)' }}>
            <Building2 size={24} color="#fff" />
          </div>
          <div style={{ width: 40, height: 3, background: 'var(--color-primary)', borderRadius: 99, animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} className="skeleton" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'var(--color-primary-light)', opacity: 0.4, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'var(--color-accent-light)', opacity: 0.3, filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, gap: 10 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--color-primary)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-primary)',
          }}>
            <Building2 size={28} color="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>
              NexaBank
            </h1>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
              Banking Management System
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px 36px' }}>
          {children}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 20 }}>
          © 2024 NexaBank · Secure Banking Platform
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
