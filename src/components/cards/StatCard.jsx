import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCompactCurrency, formatNumber, formatPercent } from '../../utils';
import Skeleton from '../common/Skeleton';

const StatCard = ({
  title,
  value,
  growth,
  icon: Icon,
  color     = 'primary',
  format    = 'currency',
  subtitle,
  loading   = false,
}) => {
  const colorMap = {
    primary: { accent: 'var(--color-primary)', light: 'var(--color-primary-light)' },
    success: { accent: 'var(--color-success)', light: 'var(--color-success-light)' },
    warning: { accent: 'var(--color-warning)', light: 'var(--color-warning-light)' },
    danger:  { accent: 'var(--color-danger)',  light: 'var(--color-danger-light)' },
    accent:  { accent: 'var(--color-accent)',  light: 'var(--color-accent-light)' },
  };
  const { accent, light } = colorMap[color] || colorMap.primary;

  const formatValue = (v) => {
    if (format === 'currency') return formatCompactCurrency(v);
    if (format === 'number')   return formatNumber(v);
    if (format === 'percent')  return formatPercent(v);
    return v;
  };

  const isPositive = growth >= 0;

  if (loading) {
    return (
      <div className="stat-card" style={{ '--card-accent': accent }}>
        <Skeleton height="14px" width="60%" />
        <Skeleton height="32px" width="50%" style={{ marginTop: 10 }} />
        <Skeleton height="12px" width="40%" style={{ marginTop: 8 }} />
      </div>
    );
  }

  return (
    <div className="stat-card animate-fade-in" style={{ '--card-accent': accent }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', letterSpacing: '0.01em' }}>
          {title}
        </p>
        {Icon && (
          <div style={{
            width: 38, height: 38,
            borderRadius: 10,
            background: light,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent, flexShrink: 0,
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif', lineHeight: 1.1, marginBottom: 10 }}>
        {formatValue(value)}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {growth !== undefined && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 600,
            color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
            background: isPositive ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            padding: '2px 7px', borderRadius: 99,
          }}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(growth)}%
          </span>
        )}
        {subtitle && (
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
