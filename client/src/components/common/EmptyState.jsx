import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  action,
  actionLabel,
  onAction,
}) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <Icon size={28} />
    </div>
    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif' }}>
      {title}
    </h3>
    <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 340 }}>
      {description}
    </p>
    {(action || onAction) && (
      <Button variant="primary" onClick={action || onAction} size="sm" style={{ marginTop: 8 }}>
        {actionLabel || 'Get Started'}
      </Button>
    )}
  </div>
);

export default EmptyState;
