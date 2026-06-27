import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Download, Filter } from 'lucide-react';
import customerService from '../../services/customerService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import CustomerTable from '../../components/tables/CustomerTable';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/modals/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CustomerForm from '../../components/forms/CustomerForm';
import { SkeletonTable } from '../../components/common/Skeleton';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import { downloadCSV } from '../../utils';
import { useAuth } from '../../context/AuthContext';

const CustomersPage = () => {
  const toast = useToast();
  const { isAdmin, isBranchManager, isEmployee } = useAuth();
  const canWrite = isAdmin || isBranchManager || isEmployee;

  const [customers, setCustomers] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy,    setSortBy]    = useState('createdAt');
  const [sortDir,   setSortDir]   = useState('desc');

  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const pagination = usePagination(total, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerService.getAll({
        search: debouncedSearch,
        status: statusFilter,
        page: pagination.currentPage,
        limit: pagination.pageSize,
      });
      setCustomers(res.data);
      setTotal(res.total);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [debouncedSearch, statusFilter, pagination.currentPage, pagination.pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (key) => {
    setSortDir(p => (sortBy === key && p === 'asc') ? 'desc' : 'asc');
    setSortBy(key);
  };

  const handleAdd = async (data) => {
    setFormLoading(true);
    try {
      await customerService.create(data);
      toast.success('Customer added successfully');
      setAddOpen(false);
      load();
    } catch { toast.error('Failed to add customer'); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (data) => {
    setFormLoading(true);
    try {
      await customerService.update(editTarget.id, data);
      toast.success('Customer updated');
      setEditTarget(null);
      load();
    } catch { toast.error('Failed to update customer'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await customerService.delete(deleteTarget.id);
      toast.success('Customer deleted');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Failed to delete customer'); }
    finally { setFormLoading(false); }
  };

  const handleExport = () => {
    downloadCSV(customers.map(c => ({
      'Customer ID': c.customerId, Name: c.name, Email: c.email,
      Phone: c.phone, City: c.city, State: c.state,
      Status: c.status, 'KYC Status': c.kycStatus, Branch: c.branch,
    })), 'customers.csv');
    toast.info('Export started');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{total} total customers registered</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={<Download size={15} />} onClick={handleExport}>Export</Button>
          {canWrite && (
            <Button variant="primary" icon={<UserPlus size={15} />} onClick={() => setAddOpen(true)}>
              Add Customer
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone…" style={{ flex: 1, minWidth: 240 }} />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-control"
          style={{ width: 160 }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading
        ? <SkeletonTable rows={8} cols={7} />
        : (
          <>
            <CustomerTable
              customers={customers}
              onView={setViewTarget}
              onEdit={canWrite ? setEditTarget : undefined}
              onDelete={canWrite ? setDeleteTarget : undefined}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <Pagination
              {...pagination}
              totalItems={total}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.changePageSize}
            />
          </>
        )
      }

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Customer" size="lg">
        <CustomerForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={formLoading} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Customer" size="lg">
        {editTarget && <CustomerForm initial={editTarget} onSubmit={handleEdit} onCancel={() => setEditTarget(null)} loading={formLoading} />}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Customer Details">
        {viewTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Customer ID', viewTarget.customerId],
              ['Full Name', viewTarget.name],
              ['Email', viewTarget.email],
              ['Phone', viewTarget.phone],
              ['Gender', viewTarget.gender],
              ['Date of Birth', viewTarget.dob],
              ['PAN', viewTarget.pan || '—'],
              ['Aadhar', viewTarget.aadhar || '—'],
              ['Address', `${viewTarget.address}, ${viewTarget.city}, ${viewTarget.state} - ${viewTarget.pincode}`],
              ['Branch', viewTarget.branch],
              ['KYC Status', viewTarget.kycStatus],
              ['Status', viewTarget.status],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text)', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer?"
        message={`This will permanently delete ${deleteTarget?.name} and all associated records. This action cannot be undone.`}
        confirmLabel="Delete Customer"
        loading={formLoading}
      />
    </div>
  );
};

export default CustomersPage;
