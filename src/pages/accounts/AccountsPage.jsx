import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Download } from 'lucide-react';
import accountService from '../../services/accountService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import AccountTable from '../../components/tables/AccountTable';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/modals/Modal';
import AccountForm from '../../components/forms/AccountForm';
import { SkeletonTable } from '../../components/common/Skeleton';
import StatCard from '../../components/cards/StatCard';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, downloadCSV } from '../../utils';
import { CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import AccountCard from '../../components/cards/AccountCard';

const AccountsPage = () => {
  const toast = useToast();
  const { isAdmin, isBranchManager, isEmployee } = useAuth();
  const canWrite = isAdmin || isBranchManager || isEmployee;

  const [accounts, setAccounts] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen,  setAddOpen]  = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [summary,  setSummary]  = useState({ total: 0, totalBalance: 0, byType: {} });

  const debouncedSearch = useDebounce(search, 350);
  const pagination = usePagination(total, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, sum] = await Promise.all([
        accountService.getAll({ search: debouncedSearch, type: typeFilter, status: statusFilter, page: pagination.currentPage, limit: pagination.pageSize }),
        accountService.getSummary(),
      ]);
      setAccounts(res.data);
      setTotal(res.total);
      setSummary(sum);
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  }, [debouncedSearch, typeFilter, statusFilter, pagination.currentPage, pagination.pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data) => {
    setFormLoading(true);
    try {
      await accountService.create(data);
      toast.success('Account opened successfully');
      setAddOpen(false);
      load();
    } catch { toast.error('Failed to open account'); }
    finally { setFormLoading(false); }
  };

  const handleStatusChange = async (account, status) => {
    try {
      await accountService.updateStatus(account.id, status);
      toast.success(`Account ${status === 'active' ? 'unfrozen' : 'frozen'}`);
      load();
    } catch { toast.error('Failed to update account status'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">{total} accounts — Total Balance: {formatCurrency(summary.totalBalance)}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Download size={15} />} onClick={() => { downloadCSV(accounts.map(a => ({ 'Account No': a.accountNumber, Customer: a.customerName, Type: a.type, Balance: a.balance, Status: a.status })), 'accounts.csv'); toast.info('Exported'); }}>Export</Button>
          {canWrite && (
            <Button variant="primary" icon={<PlusCircle size={15} />} onClick={() => setAddOpen(true)}>Open Account</Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard title="Total Accounts"   value={summary.total}        format="number"   color="primary" icon={CreditCard} loading={loading} />
        <StatCard title="Total Balance"    value={summary.totalBalance}  format="currency" color="success" icon={DollarSign} loading={loading} />
        <StatCard title="Savings Accounts" value={summary.byType?.savings || 0} format="number" color="accent" icon={TrendingUp} loading={loading} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by account no., customer…" style={{ flex: 1, minWidth: 240 }} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-control" style={{ width: 170 }}>
          <option value="">All Types</option>
          <option value="savings">Savings</option>
          <option value="current">Current</option>
          <option value="fixed_deposit">Fixed Deposit</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-control" style={{ width: 140 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
        </select>
      </div>

      {loading ? <SkeletonTable rows={8} cols={8} /> : (
        <>
          <AccountTable accounts={accounts} onView={setViewTarget} onStatusChange={canWrite ? handleStatusChange : undefined} />
          <Pagination {...pagination} totalItems={total} onPageChange={pagination.goToPage} onPageSizeChange={pagination.changePageSize} />
        </>
      )}

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Open New Account" size="md">
        <AccountForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={formLoading} />
      </Modal>

      {/* View Details */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Account Details">
        {viewTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AccountCard account={viewTarget} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {[
                ['Account Number', viewTarget.accountNumber],
                ['Customer Name', viewTarget.customerName],
                ['Account Type', viewTarget.type.replace('_', ' ')],
                ['Balance', formatCurrency(viewTarget.balance)],
                ['Interest Rate', `${viewTarget.interestRate}% p.a.`],
                ['Branch', viewTarget.branch],
                ['Opened On', viewTarget.openedAt?.slice(0, 10)],
                ['Status', viewTarget.status],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AccountsPage;
