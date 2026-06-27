import { Eye, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, MoreVertical } from 'lucide-react';
import { StatusBadge, TransactionTypeBadge } from '../common/Badge';
import { formatCurrency, formatDate } from '../../utils';
import EmptyState from '../common/EmptyState';
import Dropdown from '../common/Dropdown';

const TYPE_ICONS = {
  deposit:    { Icon: ArrowDownLeft,  color: 'var(--color-success)' },
  withdrawal: { Icon: ArrowUpRight,   color: 'var(--color-danger)' },
  transfer:   { Icon: ArrowLeftRight, color: 'var(--color-info)' },
};

const TransactionTable = ({ transactions = [], onView }) => {
  if (!transactions.length) {
    return (
      <div className="table-container">
        <EmptyState title="No transactions found" description="No transactions match your current filters." />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>TXN ID</th>
            <th>Account</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Description</th>
            <th>Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => {
            const { Icon, color } = TYPE_ICONS[t.type] || TYPE_ICONS.deposit;
            const isCredit = t.type === 'deposit';
            return (
              <tr key={t.id}>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {t.txnId}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
                  ••{t.accountNumber?.slice(-4)}
                </td>
                <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{t.customerName}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon size={14} style={{ color }} />
                    <TransactionTypeBadge type={t.type} />
                  </div>
                </td>
                <td>
                  <span style={{
                    fontWeight: 700,
                    fontFamily: 'Poppins, sans-serif',
                    color: isCredit ? 'var(--color-success)' : 'var(--color-danger)',
                    fontSize: 14,
                  }}>
                    {isCredit ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 180 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 180 }}>
                    {t.description}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {formatDate(t.createdAt, 'datetime')}
                </td>
                <td><StatusBadge status={t.status} /></td>
                <td>
                  <Dropdown
                    trigger={<button className="btn btn-ghost btn-icon-sm"><MoreVertical size={15} /></button>}
                    align="right"
                    items={[{ label: 'View Details', icon: <Eye size={14} />, onClick: () => onView?.(t) }]}
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

export default TransactionTable;
