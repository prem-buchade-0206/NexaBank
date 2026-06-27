import { cn } from '../../utils';

const Badge = ({ variant = 'neutral', children, dot = false, className = '' }) => {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {dot && (
        <span style={{
          width: 6, height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          display: 'inline-block',
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    active:    { variant: 'success', label: 'Active' },
    inactive:  { variant: 'danger',  label: 'Inactive' },
    pending:   { variant: 'warning', label: 'Pending' },
    approved:  { variant: 'success', label: 'Approved' },
    rejected:  { variant: 'danger',  label: 'Rejected' },
    completed: { variant: 'success', label: 'Completed' },
    failed:    { variant: 'danger',  label: 'Failed' },
    frozen:    { variant: 'info',    label: 'Frozen' },
    closed:    { variant: 'neutral', label: 'Closed' },
    reversed:  { variant: 'neutral', label: 'Reversed' },
    verified:  { variant: 'success', label: 'Verified' },
    processing:{ variant: 'info',    label: 'Processing' },
  };
  const cfg = map[status?.toLowerCase()] || { variant: 'neutral', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
};

export const TransactionTypeBadge = ({ type }) => {
  const map = {
    deposit:    { variant: 'success', label: 'Deposit' },
    withdrawal: { variant: 'danger',  label: 'Withdrawal' },
    transfer:   { variant: 'info',    label: 'Transfer' },
  };
  const cfg = map[type?.toLowerCase()] || { variant: 'neutral', label: type };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

export const KycBadge = ({ status }) => {
  const map = {
    verified: { variant: 'success', label: 'KYC Verified' },
    pending:  { variant: 'warning', label: 'KYC Pending' },
    rejected: { variant: 'danger',  label: 'KYC Rejected' },
  };
  const cfg = map[status?.toLowerCase()] || { variant: 'neutral', label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

export default Badge;
