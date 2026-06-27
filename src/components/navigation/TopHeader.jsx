import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor, Bell, ChevronDown, Check, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import NotificationPanel from './NotificationPanel';
import notificationService from '../../services/notificationService';
import Tooltip from '../../components/common/Tooltip';

const THEME_OPTIONS = [
  { key: 'light', label: 'Light', Icon: Sun, desc: 'Warm ivory' },
  { key: 'dark', label: 'Dark', Icon: Moon, desc: 'Deep navy' },
  { key: 'system', label: 'System', Icon: Monitor, desc: 'Follows OS' },
];

const ThemeSwitcher = () => {
  const { preference, setTheme, isDark, isSystem } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Active icon to show in the header button
  const activeOption = THEME_OPTIONS.find(o => o.key === preference) || THEME_OPTIONS[2];
  const ActiveIcon = activeOption.Icon;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <Tooltip content={`Theme: ${activeOption.label}`} placement="bottom">
        <button
          onClick={() => setOpen(p => !p)}
          className="btn btn-ghost btn-icon"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            background: open ? 'var(--color-bg-secondary)' : 'transparent',
            color: 'var(--color-text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          <ActiveIcon size={16} />
          <ChevronDown
            size={12}
            style={{
              transition: 'transform 0.2s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
      </Tooltip>

      {/* Dropdown */}
      {open && (
        <div
          className="animate-scale-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            padding: 6,
            minWidth: 180,
            zIndex: 400,
          }}
        >
          {/* Header label */}
          <p style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--color-text-subtle)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 10px 8px',
          }}>
            Appearance
          </p>

          {THEME_OPTIONS.map(({ key, label, Icon, desc }) => {
            const isActive = preference === key;
            return (
              <button
                key={key}
                onClick={() => { setTheme(key); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--color-primary-light)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg-secondary)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Icon bubble */}
                <div style={{
                  width: 30, height: 30,
                  borderRadius: 8,
                  background: isActive ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s ease',
                }}>
                  <Icon size={14} style={{ color: isActive ? '#fff' : 'var(--color-text-muted)' }} />
                </div>

                {/* Labels */}
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    lineHeight: 1.2,
                  }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 1 }}>
                    {desc}
                  </p>
                </div>

                {/* Active check */}
                {isActive && (
                  <Check size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TopHeader = ({ onMenuToggle, isMobile }) => {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationService.getUnreadCount().then(setUnreadCount);
  }, []);

  return (
    <header className="top-header">
      {/* Hamburger — mobile only */}
      {isMobile && (
        <Tooltip content="Menu" placement="bottom">
          <button
            onClick={onMenuToggle}
            className="btn btn-ghost btn-icon"
            style={{ marginRight: 4 }}
          >
            <Menu size={20} />
          </button>
        </Tooltip>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* 3-way theme switcher */}
        <ThemeSwitcher />

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <Tooltip content={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'} placement="bottom">
            <button
              onClick={() => setNotifOpen(p => !p)}
              className="btn btn-ghost btn-icon"
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 4, right: 4,
                  width: 16, height: 16,
                  background: 'var(--color-danger)',
                  borderRadius: '50%',
                  fontSize: 9,
                  fontWeight: 700,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--color-surface)',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </Tooltip>
          {notifOpen && (
            <NotificationPanel
              onClose={() => setNotifOpen(false)}
              onRead={() => setUnreadCount(0)}
            />
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 4px' }} />

        {/* User info */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar name={user.name} size="sm" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.1 }}>
                {user.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {user.branch}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopHeader;