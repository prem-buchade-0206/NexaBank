import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/navigation/Sidebar';
import TopHeader from '../components/navigation/TopHeader';
import { Building2 } from 'lucide-react';
import useBreakpoint from '../hooks/useBreakpoint';

const DashboardLayout = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isMobile, isTablet } = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-collapse on tablet, auto-close mobile menu on resize
  useEffect(() => {
    if (isTablet) setCollapsed(true);
    if (!isMobile) setMobileOpen(false);
  }, [isMobile, isTablet]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, background: 'var(--color-primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-primary)' }}>
            <Building2 size={24} color="#fff" />
          </div>
          <div className="skeleton" style={{ width: 120, height: 3, borderRadius: 99 }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleMenuToggle = () => {
    if (isMobile) setMobileOpen(p => !p);
    else setCollapsed(p => !p);
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={isMobile ? false : collapsed}
        mobileOpen={mobileOpen}
        onToggle={handleMenuToggle}
      />

      <main
        className={`main-content ${(!isMobile && collapsed) ? 'sidebar-collapsed' : ''}`}
      >
        <TopHeader onMenuToggle={handleMenuToggle} isMobile={isMobile} />
        <div className="page-container animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;