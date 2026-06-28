import { useState, useEffect, useCallback } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import auditService from '../../services/auditService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import AuditLogTable from '../../components/tables/AuditLogTable';
import Pagination from '../../components/common/Pagination';
import { SkeletonTable } from '../../components/common/Skeleton';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import { downloadCSV, formatDate } from '../../utils';

const MODULES = ['Auth', 'Customers', 'Accounts', 'Transactions', 'Loans', 'Reports', 'Settings', 'Users'];
const ACTIONS = ['LOGIN', 'LOGOUT', 'CUSTOMER_CREATE', 'CUSTOMER_DELETE', 'ACCOUNT_CREATE', 'TRANSACTION', 'LOAN_APPROVE', 'LOAN_REJECT', 'REPORT_EXPORT', 'SETTINGS_UPDATE', 'USER_CREATE', 'INTEREST_CREDIT'];

const AuditLogsPage = () => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const debouncedSearch = useDebounce(search, 350);
  const pagination = usePagination(total, 15);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditService.getAll({
        search: debouncedSearch,
        action: actionFilter,
        module: moduleFilter,
        page: pagination.currentPage,
        limit: pagination.pageSize,
      });
      setLogs(res.data);
      setTotal(res.total);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [debouncedSearch, actionFilter, moduleFilter, pagination.currentPage, pagination.pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    downloadCSV(logs.map(l => ({
      Timestamp: formatDate(l.timestamp, 'datetime'),
      User: l.user, Role: l.role, Action: l.action,
      Module: l.module, Description: l.description,
      IP: l.ip, Device: l.device,
    })), 'audit_logs.csv');
    toast.success('Audit logs exported');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">{total} log entries · Complete system activity trail</p>
        </div>
        <Button variant="secondary" icon={<Download size={15} />} onClick={handleExport}>Export Logs</Button>
      </div>

      {/* Security Banner */}
      <div style={{
        background: 'var(--color-primary-light)',
        border: '1px solid var(--color-primary)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: 'var(--color-primary)',
      }}>
        <ShieldCheck size={18} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          All system activities are logged and monitored. Logs are immutable and stored for compliance purposes.
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by user, action, IP…" style={{ flex: 1, minWidth: 240 }} />
        <div style={{ width: 210 }}>
          <Select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            options={ACTIONS.map(a => ({ value: a, label: a }))}
            placeholder="All Actions"
          />
        </div>
        <div style={{ width: 165 }}>
          <Select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            options={MODULES.map(m => ({ value: m, label: m }))}
            placeholder="All Modules"
          />
        </div>
        {(search || actionFilter || moduleFilter) && (
          <Button variant="ghost" onClick={() => { setSearch(''); setActionFilter(''); setModuleFilter(''); }}>Clear</Button>
        )}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={10} cols={7} /> : (
        <>
          <AuditLogTable logs={logs} />
          <Pagination {...pagination} totalItems={total} onPageChange={pagination.goToPage} onPageSizeChange={pagination.changePageSize} />
        </>
      )}
    </div>
  );
};

export default AuditLogsPage;
