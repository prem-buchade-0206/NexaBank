import { useState } from 'react';
import Button from '../common/Button';
import Select from '../common/Select';
import { MOCK_ACCOUNTS } from '../../utils/mockData';
import { formatCurrency } from '../../utils';

const ACCOUNT_OPTIONS = MOCK_ACCOUNTS
  .filter(a => a.status === 'active')
  .map(a => ({
    value: a.id,
    label: `${a.customerName} — ••${a.accountNumber.slice(-4)} (${formatCurrency(a.balance)})`,
  }));

const FormField = ({ label, required, error, children }) => (
  <div className="form-group">
    <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
    {children}
    {error && <span className="form-error">⚠ {error}</span>}
  </div>
);

const TransactionForm = ({ type = 'deposit', initial = {}, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({ accountId: '', amount: '', description: '', toAccountNumber: '', ...initial });
  const [errors, setErrors] = useState({});

  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' })); };

  const selectedAccount = MOCK_ACCOUNTS.find(a => a.id === form.accountId);

  const validate = () => {
    const e = {};
    if (!form.accountId) e.accountId = 'Select an account';
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) e.amount = 'Enter a valid amount';
    if (type === 'withdrawal' && selectedAccount && amt > selectedAccount.balance)
      e.amount = `Insufficient balance. Available: ${formatCurrency(selectedAccount.balance)}`;
    if (type === 'transfer' && !form.toAccountNumber)
      e.toAccountNumber = 'Enter destination account number';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({ ...form, accountNumber: selectedAccount?.accountNumber, customerName: selectedAccount?.customerName });
  };

  const colorMap = { deposit: 'success', withdrawal: 'danger', transfer: 'primary' };
  const titleMap = { deposit: 'Deposit Funds', withdrawal: 'Withdraw Funds', transfer: 'Transfer Funds' };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <FormField label={type === 'transfer' ? 'From Account' : 'Account'} required error={errors.accountId}>
          <Select
            value={form.accountId}
            onChange={e => set('accountId', e.target.value)}
            options={ACCOUNT_OPTIONS}
            placeholder="Select account…"
            error={!!errors.accountId}
          />
        </FormField>

        {selectedAccount && (
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>Available Balance</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'Poppins, sans-serif' }}>{formatCurrency(selectedAccount.balance)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>Account Type</p>
              <p style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize', color: 'var(--color-text)' }}>{selectedAccount.type.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        {type === 'transfer' && (
          <FormField label="To Account Number" required error={errors.toAccountNumber}>
            <input type="text" value={form.toAccountNumber} onChange={e => set('toAccountNumber', e.target.value)}
              placeholder="Enter destination account number"
              className={`form-control${errors.toAccountNumber ? ' error' : ''}`} />
          </FormField>
        )}

        <FormField label="Amount (₹)" required error={errors.amount}>
          <input type="number" min={1} value={form.amount} onChange={e => set('amount', e.target.value)}
            placeholder="Enter amount"
            className={`form-control${errors.amount ? ' error' : ''}`} />
        </FormField>

        <FormField label="Description / Narration">
          <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="e.g. Salary credit, Bill payment…" className="form-control" />
        </FormField>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingBottom: 2 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant={colorMap[type]} type="submit" loading={loading}>{titleMap[type]}</Button>
      </div>
    </form>
  );
};

export default TransactionForm;