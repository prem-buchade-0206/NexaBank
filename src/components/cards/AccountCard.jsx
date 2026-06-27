import { CreditCard, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate, maskAccountNumber } from '../../utils';
import { StatusBadge } from '../common/Badge';

const ACCOUNT_GRADIENTS = {
  savings:       'linear-gradient(135deg, #1a56db 0%, #7c3aed 100%)',
  current:       'linear-gradient(135deg, #0e9f6e 0%, #1a56db 100%)',
  fixed_deposit: 'linear-gradient(135deg, #7c3aed 0%, #e02424 100%)',
};

const AccountCard = ({ account, onClick }) => {
  const { accountNumber, customerName, type, balance, status, interestRate, openedAt } = account;
  const gradient = ACCOUNT_GRADIENTS[type] || ACCOUNT_GRADIENTS.savings;

  return (
    <div
      onClick={() => onClick?.(account)}
      style={{
        background: gradient,
        borderRadius: 16,
        padding: '20px 24px',
        color: '#fff',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
    >
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', bottom: -30, right: 40, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative' }}>
        <div>
          <p style={{ fontSize: 11, opacity: 0.7, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
            {type.replace('_', ' ')}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{customerName}</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCard size={18} />
        </div>
      </div>

      <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Poppins, sans-serif', marginBottom: 16, letterSpacing: '0.01em' }}>
        {formatCurrency(balance)}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div>
          <p style={{ fontSize: 11, opacity: 0.65, marginBottom: 2 }}>Account Number</p>
          <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.05em' }}>
            •••• {accountNumber.slice(-4)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, opacity: 0.65, marginBottom: 2 }}>Interest Rate</p>
          <p style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
            <TrendingUp size={12} /> {interestRate}% p.a.
          </p>
        </div>
      </div>

      {status !== 'active' && (
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <StatusBadge status={status} />
        </div>
      )}
    </div>
  );
};

export default AccountCard;
