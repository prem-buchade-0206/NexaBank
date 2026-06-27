import { Eye, Lock, Unlock, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { formatCurrency, formatDate, maskAccountNumber } from '../../utils';
import EmptyState from '../common/EmptyState';
import { CreditCard } from 'lucide-react';
import Dropdown from '../common/Dropdown';
import { ACCOUNT_TYPE_LABELS } from '../../constants';

const AccountTable = ({ accounts = [], onView, onStatusChange }) => {
  const typeColors = {
    savings:       { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' },
    current:       { bg: 'var(--color-success-light)', color: 'var(--color-success)' },
    fixed_deposit: { bg: 'var(--color-accent-light)',  color: 'var(--color-accent)' },
  };

  if (!accounts.length) {
    return (
      <div className="table-container">
        <EmptyState icon={CreditCard} title="No accounts found" description="Try adjusting your search or filters." />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Account No.</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Balance</th>
            <th>Interest</th>
            <th>Branch</th>
            <th>Last Txn</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {accounts.map(a => {
            const tc = typeColors[a.type] || typeColors.savings;
            return (
              <tr key={a.id}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
                    {maskAccountNumber(a.accountNumber)}
                  </span>
                </td>
                <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{a.customerName}</td>
                <td>
                  <span className="badge" style={{ background: tc.bg, color: tc.color }}>
                    {ACCOUNT_TYPE_LABELS[a.type] || a.type}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif' }}>
                  {formatCurrency(a.balance)}
                </td>
                <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{a.interestRate}% p.a.</td>
                <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{a.branch}</td>
                <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formatDate(a.lastTransaction, 'medium')}</td>
                <td><StatusBadge status={a.status} /></td>
                <td>
                  <Dropdown
                    trigger={<button className="btn btn-ghost btn-icon-sm"><MoreVertical size={15} /></button>}
                    align="right"
                    items={[
                      { label: 'View Details', icon: <Eye size={14} />, onClick: () => onView?.(a) },
                      a.status === 'active'
                        ? { label: 'Freeze Account', icon: <Lock size={14} />, onClick: () => onStatusChange?.(a, 'frozen') }
                        : { label: 'Unfreeze',       icon: <Unlock size={14} />, onClick: () => onStatusChange?.(a, 'active') },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AccountTable;
