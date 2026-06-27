import { Eye, CheckCircle, XCircle, MoreVertical } from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { formatCurrency, formatDate, formatPercent } from '../../utils';
import EmptyState from '../common/EmptyState';
import Dropdown from '../common/Dropdown';
import { LOAN_STATUS } from '../../constants';

const LOAN_TYPE_LABELS = {
  personal:  'Personal',
  home:      'Home',
  vehicle:   'Vehicle',
  business:  'Business',
  education: 'Education',
};

const LoanTable = ({ loans = [], onView, onApprove, onReject, canApprove }) => {
  if (!loans.length) {
    return (
      <div className="table-container">
        <EmptyState title="No loans found" description="No loan records match your current filters." />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Loan ID</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Outstanding</th>
            <th>Rate / Tenure</th>
            <th>EMI</th>
            <th>Applied</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loans.map(l => {
            const isPending = l.status === LOAN_STATUS.PENDING;
            const menuItems = [
              { label: 'View Details', icon: <Eye size={14} />, onClick: () => onView?.(l) },
              ...(canApprove && isPending ? [
                { divider: true },
                { label: 'Approve', icon: <CheckCircle size={14} />, onClick: () => onApprove?.(l) },
                { label: 'Reject',  icon: <XCircle size={14} />,    onClick: () => onReject?.(l),  danger: true },
              ] : []),
            ];

            return (
              <tr key={l.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
                  {l.loanId}
                </td>
                <td style={{ fontWeight: 500, color: 'var(--color-text)' }}>{l.customerName}</td>
                <td>
                  <span className="badge badge-primary">{LOAN_TYPE_LABELS[l.type] || l.type}</span>
                </td>
                <td style={{ fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>{formatCurrency(l.amount)}</td>
                <td style={{ color: l.outstanding > 0 ? 'var(--color-warning-dark)' : 'var(--color-success)' }}>
                  {formatCurrency(l.outstanding)}
                </td>
                <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {l.interestRate}% / {l.tenure}mo
                </td>
                <td style={{ fontWeight: 500 }}>{formatCurrency(l.emiAmount)}</td>
                <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formatDate(l.appliedAt, 'medium')}</td>
                <td><StatusBadge status={l.status} /></td>
                <td>
                  <Dropdown
                    trigger={<button className="btn btn-ghost btn-icon-sm"><MoreVertical size={15} /></button>}
                    align="right"
                    items={menuItems}
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

export default LoanTable;
