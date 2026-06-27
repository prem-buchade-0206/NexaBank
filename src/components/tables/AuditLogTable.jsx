import { ShieldCheck } from 'lucide-react';
import { formatDate } from '../../utils';
import EmptyState from '../common/EmptyState';
import Badge from '../common/Badge';

const ACTION_VARIANTS = {
  LOGIN:           'info',
  LOGOUT:          'neutral',
  CUSTOMER_CREATE: 'success',
  CUSTOMER_DELETE: 'danger',
  ACCOUNT_CREATE:  'success',
  TRANSACTION:     'primary',
  LOAN_APPROVE:    'success',
  LOAN_REJECT:     'danger',
  REPORT_EXPORT:   'accent',
  SETTINGS_UPDATE: 'warning',
  USER_CREATE:     'success',
  INTEREST_CREDIT: 'success',
};

const AuditLogTable = ({ logs = [] }) => {
  if (!logs.length) {
    return (
      <div className="table-container">
        <EmptyState icon={ShieldCheck} title="No audit logs" description="No audit records match your search." />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Module</th>
            <th>Description</th>
            <th>IP Address</th>
            <th>Device</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {formatDate(log.timestamp, 'datetime')}
              </td>
              <td>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 13, color: 'var(--color-text)' }}>{log.user}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{log.role?.replace('_', ' ')}</p>
                </div>
              </td>
              <td>
                <Badge variant={ACTION_VARIANTS[log.action] || 'neutral'}>
                  {log.action}
                </Badge>
              </td>
              <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{log.module}</td>
              <td style={{ fontSize: 13, color: 'var(--color-text)', maxWidth: 240 }}>
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.description}
                </span>
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>{log.ip}</td>
              <td style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{log.device}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogTable;
