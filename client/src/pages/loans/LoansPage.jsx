import { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Download, CheckCircle, XCircle } from 'lucide-react';
import loanService from '../../services/loanService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import LoanTable from '../../components/tables/LoanTable';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/modals/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoanForm from '../../components/forms/LoanForm';
import { SkeletonTable } from '../../components/common/Skeleton';
import StatCard from '../../components/cards/StatCard';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import { formatCurrency, downloadCSV } from '../../utils';
import { Landmark, TrendingUp, Clock } from 'lucide-react';

const LoansPage = () => {
  const toast = useToast();
  const { user, isAdmin, isBranchManager, isEmployee } = useAuth();
  const canWrite = isAdmin || isBranchManager || isEmployee;
  const canApprove = isAdmin || isBranchManager;

  const [loans, setLoans] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const pagination = usePagination(total, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, s] = await Promise.all([
        loanService.getAll({ search: debouncedSearch, status: statusFilter, type: typeFilter, page: pagination.currentPage, limit: pagination.pageSize }),
        loanService.getStats(),
      ]);
      setLoans(res.data);
      setTotal(res.total);
      setStats(s);
    } catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  }, [debouncedSearch, statusFilter, typeFilter, pagination.currentPage, pagination.pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async (data) => {
    setFormLoading(true);
    try {
      await loanService.apply(data);
      toast.success('Loan application submitted');
      setAddOpen(false);
      load();
    } catch { toast.error('Failed to submit loan application'); }
    finally { setFormLoading(false); }
  };

  const handleApprove = async () => {
    setFormLoading(true);
    try {
      await loanService.approve(approveTarget.id, user?.name);
      toast.success(`Loan ${approveTarget.loanId} approved`);
      setApproveTarget(null);
      load();
    } catch { toast.error('Failed to approve loan'); }
    finally { setFormLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please enter a rejection reason'); return; }
    setFormLoading(true);
    try {
      await loanService.reject(rejectTarget.id, rejectReason, user?.name);
      toast.success(`Loan ${rejectTarget.loanId} rejected`);
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch { toast.error('Failed to reject loan'); }
    finally { setFormLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="page-subtitle">{total} loan records · Book Value: {formatCurrency(stats.totalBook || 0)}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Download size={15} />} onClick={() => {
            downloadCSV(loans.map(l => ({ 'Loan ID': l.loanId, Customer: l.customerName, Type: l.type, Amount: l.amount, Outstanding: l.outstanding, Status: l.status })), 'loans.csv');
            toast.info('Exported');
          }}>Export</Button>
          {canWrite && (
            <Button variant="primary" icon={<PlusCircle size={15} />} onClick={() => setAddOpen(true)}>New Loan Application</Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <StatCard title="Active Loans" value={stats.active || 0} format="number" color="success" icon={Landmark} loading={loading} />
        <StatCard title="Pending Approval" value={stats.pending || 0} format="number" color="warning" icon={Clock} loading={loading} />
        <StatCard title="Total Outstanding" value={stats.totalBook || 0} format="currency" color="primary" icon={TrendingUp} loading={loading} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by loan ID, customer…" style={{ flex: 1, minWidth: 240 }} />
        <div style={{ width: 160 }}>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'active', label: 'Active' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'closed', label: 'Closed' },
            ]}
            placeholder="All Status"
          />
        </div>
        <div style={{ width: 160 }}>
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            options={[
              { value: 'personal', label: 'Personal' },
              { value: 'home', label: 'Home' },
              { value: 'vehicle', label: 'Vehicle' },
              { value: 'business', label: 'Business' },
              { value: 'education', label: 'Education' },
            ]}
            placeholder="All Types"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={6} cols={9} /> : (
        <>
          <LoanTable
            loans={loans}
            onView={setViewTarget}
            onApprove={canApprove ? setApproveTarget : undefined}
            onReject={canApprove ? setRejectTarget : undefined}
            canApprove={canApprove}
          />
          <Pagination {...pagination} totalItems={total} onPageChange={pagination.goToPage} onPageSizeChange={pagination.changePageSize} />
        </>
      )}

      {/* New Loan Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="New Loan Application" size="md">
        <LoanForm onSubmit={handleApply} onCancel={() => setAddOpen(false)} loading={formLoading} />
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Loan Details">
        {viewTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['Loan ID', viewTarget.loanId],
              ['Customer', viewTarget.customerName],
              ['Type', viewTarget.type],
              ['Loan Amount', formatCurrency(viewTarget.amount)],
              ['Outstanding', formatCurrency(viewTarget.outstanding)],
              ['Interest Rate', `${viewTarget.interestRate}% p.a.`],
              ['Tenure', `${viewTarget.tenure} months`],
              ['Monthly EMI', formatCurrency(viewTarget.emiAmount)],
              ['Status', viewTarget.status],
              ['Applied On', viewTarget.appliedAt?.slice(0, 10)],
              ['Approved By', viewTarget.approvedBy || '—'],
              ['Next EMI Date', viewTarget.nextEmiDate || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, textTransform: 'capitalize' }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Approve Dialog */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve Loan?"
        message={`Approve loan ${approveTarget?.loanId} of ${formatCurrency(approveTarget?.amount || 0)} for ${approveTarget?.customerName}?`}
        confirmLabel="Approve Loan"
        variant="info"
        loading={formLoading}
      />

      {/* Reject Modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason(''); }} title="Reject Loan Application">
        {rejectTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              You are about to reject loan <strong>{rejectTarget.loanId}</strong> for <strong>{rejectTarget.customerName}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label required">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Insufficient income, Poor credit history…"
                rows={3}
                className="form-control"
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>Cancel</Button>
              <Button variant="danger" onClick={handleReject} loading={formLoading} icon={<XCircle size={15} />}>Reject Loan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LoansPage;
