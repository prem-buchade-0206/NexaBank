import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCompactCurrency } from '../../utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-surface-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: 'var(--shadow-lg)',
      fontSize: 13,
    }}>
      <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatCompactCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const TransactionTrendChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id="gradDeposit" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.25} />
          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gradWithdrawal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="var(--color-danger)" stopOpacity={0.2} />
          <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
      <YAxis tickFormatter={v => formatCompactCurrency(v)} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
      <Tooltip content={<CustomTooltip />} />
      <Area type="monotone" dataKey="deposits"    name="Deposits"    stroke="var(--color-primary)" strokeWidth={2} fill="url(#gradDeposit)" />
      <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="var(--color-danger)"  strokeWidth={2} fill="url(#gradWithdrawal)" />
    </AreaChart>
  </ResponsiveContainer>
);

export default TransactionTrendChart;
