import { useEffect, useState } from 'react';
import { Users, CreditCard, ArrowDownLeft, ArrowUpRight, Landmark, TrendingUp } from 'lucide-react';
import StatCard from '../../components/cards/StatCard';
import RevenueChart from '../../components/charts/RevenueChart';
import TransactionTrendChart from '../../components/charts/TransactionTrendChart';
import { AccountDistributionChart, LoanStatusChart } from '../../components/charts/DistributionCharts';
import { MOCK_DASHBOARD_STATS, MOCK_MONTHLY_REVENUE, MOCK_TXN_TRENDS, MOCK_ACCOUNT_DISTRIBUTION, MOCK_LOAN_STATUS, MOCK_TRANSACTIONS } from '../../utils/mockData';
import { formatDate, formatCurrency } from '../../utils';
import { TransactionTypeBadge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const recentTxns = MOCK_TRANSACTIONS.slice(0, 5);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  const stats = [
    { title: 'Total Customers', key: 'totalCustomers', icon: Users, color: 'primary', format: 'number', subtitle: 'vs last month' },
    { title: 'Total Accounts', key: 'totalAccounts', icon: CreditCard, color: 'success', format: 'number', subtitle: 'vs last month' },
    { title: 'Total Deposits', key: 'totalDeposits', icon: ArrowDownLeft, color: 'success', format: 'currency', subtitle: 'this month' },
    { title: 'Total Withdrawals', key: 'totalWithdrawals', icon: ArrowUpRight, color: 'warning', format: 'currency', subtitle: 'this month' },
    { title: 'Active Loans', key: 'activeLoans', icon: Landmark, color: 'accent', format: 'number', subtitle: 'vs last month' },
    { title: 'Loan Book Value', key: 'totalLoanBook', icon: TrendingUp, color: 'danger', format: 'currency', subtitle: 'outstanding' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}! Here's what's happening today.</p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{formatDate(new Date(), 'long')}</p>
      </div>

      {/* KPI Cards — auto-fill responsive grid */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {stats.map(s => (
          <StatCard
            key={s.key}
            title={s.title}
            value={MOCK_DASHBOARD_STATS[s.key]?.value}
            growth={MOCK_DASHBOARD_STATS[s.key]?.growth}
            icon={s.icon} color={s.color} format={s.format} subtitle={s.subtitle}
            loading={loading}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-dashboard-main" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>Monthly Revenue</h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20 }}>Deposits, Withdrawals & Transfers</p>
          <RevenueChart data={MOCK_MONTHLY_REVENUE} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 20, flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>Account Types</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Distribution by type</p>
            <AccountDistributionChart data={MOCK_ACCOUNT_DISTRIBUTION} />
          </div>
          <div className="card" style={{ padding: 20, flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>Loan Status</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>Current loan portfolio</p>
            <LoanStatusChart data={MOCK_LOAN_STATUS} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2">
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>Transaction Trends</h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Last 7 days</p>
          <TransactionTrendChart data={MOCK_TXN_TRENDS} />
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', marginBottom: 16 }}>Recent Transactions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recentTxns.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.customerName}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TransactionTypeBadge type={t.type} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{formatDate(t.createdAt, 'datetime')}</span>
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'Poppins, sans-serif', color: t.type === 'deposit' ? 'var(--color-success)' : 'var(--color-danger)', flexShrink: 0, marginLeft: 12 }}>
                  {t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;