import { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Download } from 'lucide-react';
import transactionService from '../../services/transactionService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import DatePicker from '../../components/common/DatePicker';
import TransactionTable from '../../components/tables/TransactionTable';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/modals/Modal';
import TransactionForm from '../../components/forms/TransactionForm';
import { SkeletonTable } from '../../components/common/Skeleton';
import StatCard from '../../components/cards/StatCard';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { downloadCSV, formatCurrency, formatDate } from '../../utils';

const TAB_CONFIG = [
  { key: 'all', label: 'All', icon: null },
  { key: 'deposit', label: 'Deposits', icon: ArrowDownLeft },
  { key: 'withdrawal', label: 'Withdrawals', icon: ArrowUpRight },
  { key: 'transfer', label: 'Transfers', icon: ArrowLeftRight },
];

const TransactionsPage = () => {
  const toast = useToast();
  const { isAdmin, isBranchManager, isEmployee } = useAuth();
  const canWrite = isAdmin || isBranchManager || isEmployee;

  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalType, setModalType] = useState(null); // 'deposit'|'withdrawal'|'transfer'
  const [viewTarget, setViewTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const pagination = usePagination(total, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        transactionService.getAll({
          search: debouncedSearch,
          type: activeTab === 'all' ? '' : activeTab,
          status: statusFilter,
          dateFrom, dateTo,
          page: pagination.currentPage,
          limit: pagination.pageSize,
        }),
        transactionService.getStats(),
      ]);
      setTransactions(res.data);
      setTotal(res.total);
      setStats(s);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [debouncedSearch, activeTab, statusFilter, dateFrom, dateTo, pagination.currentPage, pagination.pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleTransaction = async (type, data) => {
    setFormLoading(true);
    try {
      if (type === 'deposit') await transactionService.deposit(data);
      if (type === 'withdrawal') await transactionService.withdraw(data);
      if (type === 'transfer') await transactionService.transfer(data);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} successful!`);
      setModalType(null);
      load();
    } catch (err) {
      toast.error(err.message || `Failed to process ${type}`);
    } finally { setFormLoading(false); }
  };

  const handleExport = () => {
    downloadCSV(transactions.map(t => ({
      'TXN ID': t.txnId, Account: t.accountNumber, Customer: t.customerName,
      Type: t.type, Amount: t.amount, Status: t.status,
      Description: t.description, Date: formatDate(t.createdAt, 'datetime'),
    })), 'transactions.csv');
    toast.info('Export started');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} records found</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Download size={15} />} onClick={handleExport}>Export</Button>
          {canWrite && (
            <>
              <Button variant="success" icon={<ArrowDownLeft size={15} />} onClick={() => setModalType('deposit')}>Deposit</Button>
              <Button variant="secondary" icon={<ArrowUpRight size={15} />} onClick={() => setModalType('withdrawal')}>Withdraw</Button>
              <Button variant="primary" icon={<ArrowLeftRight size={15} />} onClick={() => setModalType('transfer')}>Transfer</Button>
            </>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <StatCard title="Total Deposits" value={stats.totalDeposits} format="currency" color="success" icon={ArrowDownLeft} loading={loading} />
        <StatCard title="Total Withdrawals" value={stats.totalWithdrawals} format="currency" color="danger" icon={ArrowUpRight} loading={loading} />
        <StatCard title="Total Transfers" value={stats.totalTransfers} format="currency" color="primary" icon={ArrowLeftRight} loading={loading} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 0 }}>
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); pagination.goToPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-primary)' : 'transparent'}`,
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: 14, cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: -1,
            }}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by TXN ID, customer, account…" style={{ flex: 1, minWidth: 240 }} />
        <div style={{ width: 160 }}>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: 'completed', label: 'Completed' },
              { value: 'pending', label: 'Pending' },
              { value: 'failed', label: 'Failed' },
            ]}
            placeholder="All Status"
          />
        </div>
        <div style={{ width: 170 }}>
          <DatePicker
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            placeholder="From date"
            maxDate={dateTo || undefined}
          />
        </div>
        <div style={{ width: 170 }}>
          <DatePicker
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            placeholder="To date"
            minDate={dateFrom || undefined}
          />
        </div>
        {(dateFrom || dateTo || statusFilter || search) && (
          <Button variant="ghost" onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }}>Clear</Button>
        )}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} cols={8} /> : (
        <>
          <TransactionTable transactions={transactions} onView={setViewTarget} />
          <Pagination {...pagination} totalItems={total} onPageChange={pagination.goToPage} onPageSizeChange={pagination.changePageSize} />
        </>
      )}

      {/* Transaction Modals */}
      {['deposit', 'withdrawal', 'transfer'].map(type => (
        <Modal
          key={type}
          isOpen={modalType === type}
          onClose={() => setModalType(null)}
          title={type === 'deposit' ? 'Deposit Funds' : type === 'withdrawal' ? 'Withdraw Funds' : 'Fund Transfer'}
        >
          <TransactionForm
            type={type}
            onSubmit={(data) => handleTransaction(type, data)}
            onCancel={() => setModalType(null)}
            loading={formLoading}
          />
        </Modal>
      ))}

      {/* View Transaction Modal */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Transaction Details">
        {viewTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Transaction ID', viewTarget.txnId],
              ['Account Number', viewTarget.accountNumber],
              ['Customer', viewTarget.customerName],
              ['Type', viewTarget.type],
              ['Amount', formatCurrency(viewTarget.amount)],
              ['Balance After', formatCurrency(viewTarget.balance)],
              ['Description', viewTarget.description],
              ['Status', viewTarget.status],
              ['Processed By', viewTarget.processedBy],
              ['Date & Time', formatDate(viewTarget.createdAt, 'datetime')],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, textAlign: 'right', maxWidth: '60%', textTransform: 'capitalize' }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionsPage;