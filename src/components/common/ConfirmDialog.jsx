import { AlertTriangle, Trash2, Info } from 'lucide-react';
import Modal from '../modals/Modal';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'danger',
  loading      = false,
}) => {
  const iconMap = {
    danger:  { Icon: Trash2,        color: 'var(--color-danger)',  bg: 'var(--color-danger-light)' },
    warning: { Icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
    info:    { Icon: Info,           color: 'var(--color-info)',    bg: 'var(--color-info-light)' },
  };
  const { Icon, color, bg } = iconMap[variant] || iconMap.danger;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', padding: '4px 0 8px' }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}>
          <Icon size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', marginBottom: 8 }}>
            {title}
          </h3>
          {message && (
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              {message}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <Button variant="secondary" onClick={onClose} fullWidth disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === 'info' ? 'primary' : 'danger'} onClick={onConfirm} fullWidth loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
