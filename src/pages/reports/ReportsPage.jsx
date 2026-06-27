import { useState } from 'react';
import { Download, BarChart2, TrendingUp, Users, Landmark } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import RevenueChart from '../../components/charts/RevenueChart';
import TransactionTrendChart from '../../components/charts/TransactionTrendChart';
import { AccountDistributionChart, LoanStatusChart } from '../../components/charts/DistributionCharts';
import StatCard from '../../components/cards/StatCard';
import { MOCK_MONTHLY_REVENUE, MOCK_TXN_TRENDS, MOCK_ACCOUNT_DISTRIBUTION, MOCK_LOAN_STATUS, MOCK_CUSTOMERS, MOCK_ACCOUNTS, MOCK_TRANSACTIONS, MOCK_LOANS } from '../../utils/mockData';
import { formatCurrency, downloadCSV } from '../../utils';
import { useAuth } from '../../context/AuthContext';

const REPORT_TABS = [
  { key: 'overview',     label: 'Overview' },
  { key: 'transactions', label: 'Transaction Report' },
  { key: 'customers',    label: 'Customer Report' },
  { key: 'loans',        label: 'Loan Report' },
];

const ReportsPage = () => {
  const toast = useToast();
  const { isAdmin, isBranchManager } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');

  const exportTransactions = () => {
    downloadCSV(MOCK_TRANSACTIONS.map(t => ({
      'TXN ID': t.txnId, Account: t.accountNumber, Customer: t.customerName,
      Type: t.type, Amount: t.amount, Status: t.status, Date: t.createdAt,
    })), 'transaction_report.csv');
    toast.success('Transaction report exported');
  };

  const exportCustomers = () => {
    downloadCSV(MOCK_CUSTOMERS.map(c => ({
      'Customer ID': c.customerId, Name: c.name, Email: c.email,
      Phone: c.phone, Branch: c.branch, Status: c.status, KYC: c.kycStatus, Joined: c.createdAt,
    })), 'customer_report.csv');
    toast.success('Customer report exported');
  };

  const exportLoans = () => {
    downloadCSV(MOCK_LOANS.map(l => ({
      'Loan ID': l.loanId, Customer: l.customerName, Type: l.type,
      Amount: l.amount, Outstanding: l.outstanding, Rate: l.interestRate, Status: l.status,
    })), 'loan_report.csv');
    toast.success('Loan report exported');
  };

  const totalDeposits    = MOCK_TRANSACTIONS.filter(t => t.type === 'deposit'    && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = MOCK_TRANSACTIONS.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalLoanBook    = MOCK_LOANS.filter(l => l.status === 'active').reduce((s, l) => s + l.outstanding, 0);
  const activeCustomers  = MOCK_CUSTOMERS.filter(c => c.status === 'active').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Comprehensive banking performance reports</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
        {REPORT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 20px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-primary)' : 'transparent'}`,
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: activeTab === tab.key ? 600 : 400,
              fontSize: 14, cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <StatCard title="Total Deposits"    value={totalDeposits}    format="currency" color="success" icon={TrendingUp} />
            <StatCard title="Total Withdrawals" value={totalWithdrawals} format="currency" color="danger"  icon={TrendingUp} />
            <StatCard title="Active Loan Book"  value={totalLoanBook}    format="currency" color="primary" icon={Landmark}  />
            <StatCard title="Active Customers"  value={activeCustomers}  format="number"   color="accent"  icon={Users}     />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif' }}>Monthly Revenue Breakdown</h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Jan – Jun 2024</p>
                </div>
                <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={exportTransactions}>Export</Button>
              </div>
              <RevenueChart data={MOCK_MONTHLY_REVENUE} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)', marginBottom: 12 }}>Account Distribution</h3>
                <AccountDistributionChart data={MOCK_ACCOUNT_DISTRIBUTION} />
              </div>
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)', marginBottom: 12 }}>Loan Portfolio Status</h3>
                <LoanStatusChart data={MOCK_LOAN_STATUS} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)', marginBottom: 4 }}>Daily Transaction Trend</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Last 7 days activity</p>
            <TransactionTrendChart data={MOCK_TXN_TRENDS} />
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)' }}>Transaction Report</h3>
              <Button variant="primary" icon={<Download size={14} />} onClick={exportTransactions}>Export CSV</Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Total Transactions', value: MOCK_TRANSACTIONS.length, fmt: 'number' },
                { label: 'Total Volume',        value: MOCK_TRANSACTIONS.reduce((s,t) => s+t.amount, 0), fmt: 'currency' },
                { label: 'Completed',           value: MOCK_TRANSACTIONS.filter(t=>t.status==='completed').length, fmt: 'number' },
                { label: 'Failed',              value: MOCK_TRANSACTIONS.filter(t=>t.status==='failed').length, fmt: 'number' },
              ].map(s => (
                <div key={s.label} style={{ padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: 10 }}>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{s.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)' }}>
                    {s.fmt === 'currency' ? formatCurrency(s.value) : s.value}
                  </p>
                </div>
              ))}
            </div>
            <RevenueChart data={MOCK_MONTHLY_REVENUE} />
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)' }}>Customer Report</h3>
            <Button variant="primary" icon={<Download size={14} />} onClick={exportCustomers}>Export CSV</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Customers', value: MOCK_CUSTOMERS.length },
              { label: 'Active',          value: MOCK_CUSTOMERS.filter(c=>c.status==='active').length },
              { label: 'KYC Verified',    value: MOCK_CUSTOMERS.filter(c=>c.kycStatus==='verified').length },
              { label: 'KYC Pending',     value: MOCK_CUSTOMERS.filter(c=>c.kycStatus==='pending').length },
            ].map(s => (
              <div key={s.label} style={{ padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{s.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loans Tab */}
      {activeTab === 'loans' && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Poppins, sans-serif', color: 'var(--color-text)' }}>Loan Report</h3>
            <Button variant="primary" icon={<Download size={14} />} onClick={exportLoans}>Export CSV</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            <div>
              <LoanStatusChart data={MOCK_LOAN_STATUS} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Total Applications', value: MOCK_LOANS.length },
                { label: 'Active Loans',        value: MOCK_LOANS.filter(l=>l.status==='active').length },
                { label: 'Total Loan Book',     value: formatCurrency(totalLoanBook) },
                { label: 'Pending Approval',    value: MOCK_LOANS.filter(l=>l.status==='pending').length },
                { label: 'Rejected',            value: MOCK_LOANS.filter(l=>l.status==='rejected').length },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--color-bg-secondary)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{s.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
