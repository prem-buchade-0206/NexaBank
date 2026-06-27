import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

const RevenueChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height={260}>
    <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barGap={4}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis
        dataKey="month"
        tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tickFormatter={v => formatCompactCurrency(v)}
        tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        width={70}
      />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-secondary)', radius: 4 }} />
      <Legend
        wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)', paddingTop: 12 }}
        iconType="circle"
        iconSize={8}
      />
      <Bar dataKey="deposits"    name="Deposits"    fill="var(--color-primary)" radius={[4,4,0,0]} maxBarSize={36} />
      <Bar dataKey="withdrawals" name="Withdrawals" fill="var(--color-danger)"  radius={[4,4,0,0]} maxBarSize={36} />
      <Bar dataKey="transfers"   name="Transfers"   fill="var(--color-accent)"  radius={[4,4,0,0]} maxBarSize={36} />
    </BarChart>
  </ResponsiveContainer>
);

export default RevenueChart;
