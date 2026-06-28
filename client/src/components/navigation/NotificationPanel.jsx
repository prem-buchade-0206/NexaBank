import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { timeAgo } from '../../utils';

const TYPE_COLORS = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger:  'var(--color-danger)',
  info:    'var(--color-info)',
};

const NotificationPanel = ({ onClose, onRead }) => {
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    notificationService.getAll().then(setItems);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    onRead?.();
  };

  const remove = async (id) => {
    await notificationService.delete(id);
    setItems(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div
      ref={ref}
      className="animate-scale-in"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 360,
        background: 'var(--color-surface-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-xl)',
        zIndex: 300,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>Notifications</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={markAllRead} title="Mark all read" className="btn btn-ghost btn-icon-sm">
            <CheckCheck size={15} />
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-icon-sm">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            No notifications
          </div>
        ) : (
          items.map(n => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border-subtle)',
                background: n.read ? 'transparent' : 'var(--color-primary-light)',
                transition: 'background 0.15s ease',
                position: 'relative',
              }}
            >
              <div style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: TYPE_COLORS[n.type] || 'var(--color-text-muted)',
                marginTop: 5,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: 'var(--color-text)', marginBottom: 2 }}>
                  {n.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{n.message}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 4 }}>{timeAgo(n.timestamp)}</p>
              </div>
              <button
                onClick={() => remove(n.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-subtle)', padding: 2, borderRadius: 4, flexShrink: 0, opacity: 0.6 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--color-danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.color = 'var(--color-text-subtle)'; }}
              >
                <X size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
