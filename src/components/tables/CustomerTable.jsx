import { Eye, Edit2, Trash2, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import Avatar from '../common/Avatar';
import { StatusBadge, KycBadge } from '../common/Badge';
import { formatDate } from '../../utils';
import EmptyState from '../common/EmptyState';
import { Users } from 'lucide-react';
import Dropdown from '../common/Dropdown';

const SortIcon = ({ field, sortBy, sortDir }) => {
  if (sortBy !== field) return <ChevronUp size={12} style={{ opacity: 0.3 }} />;
  return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
};

const CustomerTable = ({ customers = [], onView, onEdit, onDelete, sortBy, sortDir, onSort, loading }) => {
  const cols = [
    { key: 'customerId',  label: 'Customer ID',  sortable: true },
    { key: 'name',        label: 'Customer',      sortable: true },
    { key: 'phone',       label: 'Phone',         sortable: false },
    { key: 'branch',      label: 'Branch',        sortable: true },
    { key: 'kycStatus',   label: 'KYC',           sortable: false },
    { key: 'status',      label: 'Status',        sortable: true },
    { key: 'createdAt',   label: 'Joined',        sortable: true },
    { key: 'actions',     label: '',              sortable: false },
  ];

  if (!customers.length) {
    return (
      <div className="table-container">
        <EmptyState icon={Users} title="No customers found" description="Try adjusting your search or filters." />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {cols.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && onSort?.(col.key)}
                style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {col.label}
                  {col.sortable && <SortIcon field={col.key} sortBy={sortBy} sortDir={sortDir} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c.id}>
              <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
                {c.customerId}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={c.name} size="sm" />
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: 14 }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{c.email}</p>
                  </div>
                </div>
              </td>
              <td style={{ color: 'var(--color-text-secondary)' }}>{c.phone}</td>
              <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{c.branch}</td>
              <td><KycBadge status={c.kycStatus} /></td>
              <td><StatusBadge status={c.status} /></td>
              <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formatDate(c.createdAt, 'medium')}</td>
              <td>
                <Dropdown
                  trigger={<button className="btn btn-ghost btn-icon-sm"><MoreVertical size={15} /></button>}
                  align="right"
                  items={[
                    { label: 'View Details', icon: <Eye size={14} />, onClick: () => onView?.(c) },
                    { label: 'Edit',         icon: <Edit2 size={14} />, onClick: () => onEdit?.(c) },
                    { divider: true },
                    { label: 'Delete',       icon: <Trash2 size={14} />, onClick: () => onDelete?.(c), danger: true },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
