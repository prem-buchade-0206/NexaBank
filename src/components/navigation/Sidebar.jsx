import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  FileText, Landmark, BarChart2, ShieldCheck, Settings,
  ChevronLeft, ChevronRight, Building2, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Tooltip from '../common/Tooltip';
import { NAV_ITEMS, ROLE_LABELS } from '../../constants';

const ICON_MAP = {
  LayoutDashboard, Users, CreditCard, ArrowLeftRight,
  FileText, Landmark, BarChart2, ShieldCheck, Settings,
};

const Sidebar = ({ collapsed, mobileOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

      {/* ── Logo ─────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '20px 16px' : '20px 20px',
        borderBottom: '1px solid var(--sidebar-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 'var(--header-height)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34,
          background: 'var(--sidebar-logo-bg)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
        }}>
          <Building2 size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>
              NexaBank
            </p>
            <p style={{ fontSize: 10, color: 'var(--sidebar-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Banking System
            </p>
          </div>
        )}
      </div>

      {/* ── Nav Items ─────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 0' }}>
        {visibleItems.map(item => {
          const Icon = ICON_MAP[item.icon];
          const isActive = location.pathname.startsWith(item.path);

          const linkEl = (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              {Icon && <Icon size={18} className="nav-icon" style={{ flexShrink: 0 }} />}
              {!collapsed && (
                <span className="animate-fade-in" style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400 }}>
                  {item.label}
                </span>
              )}
            </NavLink>
          );

          // In collapsed mode show tooltip on the right side
          return collapsed ? (
            <Tooltip key={item.path} content={item.label} placement="right" delay={80}>
              {linkEl}
            </Tooltip>
          ) : linkEl;
        })}
      </nav>

      {/* ── Footer ───────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 16px',
        borderTop: '1px solid var(--sidebar-border)',
        flexShrink: 0,
      }}>

        {/* Collapse toggle */}
        <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <button
            onClick={onToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              width: '100%',
              background: 'var(--sidebar-item-hover)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              color: 'var(--sidebar-text-muted)',
              marginBottom: 8,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--sidebar-text-active)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-text-muted)'}
          >
            {!collapsed && <span style={{ fontSize: 12 }}>Collapse</span>}
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </Tooltip>

        {/* User row */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 6px',
            borderRadius: 8,
          }}>
            <Tooltip content={collapsed ? user.name : ''} placement="right">
              <Avatar name={user.name} size="sm" />
            </Tooltip>

            {!collapsed && (
              <div className="animate-fade-in" style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--sidebar-text-active)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--sidebar-text-muted)' }}>
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            )}

            {!collapsed && (
              <Tooltip content="Logout" placement="top">
                <button
                  onClick={logout}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--sidebar-text-muted)',
                    padding: 5, borderRadius: 6, display: 'flex',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-text-muted)'}
                >
                  <LogOut size={15} />
                </button>
              </Tooltip>
            )}

            {/* In collapsed mode show logout tooltip */}
            {collapsed && (
              <Tooltip content="Logout" placement="right">
                <button
                  onClick={logout}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--sidebar-text-muted)',
                    padding: 4, borderRadius: 6, display: 'flex',
                    transition: 'color 0.15s ease',
                    position: 'absolute',
                    opacity: 0,
                  }}
                />
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;