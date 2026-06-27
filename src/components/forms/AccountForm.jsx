import { useState } from 'react';
import Button from '../common/Button';
import Select from '../common/Select';
import DatePicker from '../common/DatePicker';
import { MOCK_CUSTOMERS } from '../../utils/mockData';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'savings',       label: 'Savings' },
  { value: 'current',       label: 'Current' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
];
const BRANCH_OPTIONS = ['Pune Branch', 'HQ Mumbai', 'Hyderabad Branch'];
const RATES = { savings: 4.0, current: 0.5, fixed_deposit: 7.5 };

const CUSTOMER_OPTIONS = MOCK_CUSTOMERS.map(c => ({
  value: c.id,
  label: `${c.name} — ${c.customerId}`,
}));

const FormField = ({ label, required, error, children }) => (
  <div className="form-group">
    <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
    {children}
    {error && <span className="form-error">⚠ {error}</span>}
  </div>
);

const AccountForm = ({ initial = {}, onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    customerId: '', customerName: '', type: 'savings',
    initialDeposit: '', branch: '', interestRate: '',
    maturityDate: '', ...initial,
  });
  const [errors, setErrors] = useState({});

  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' })); };

  const handleCustomer = (id) => {
    const c = MOCK_CUSTOMERS.find(c => c.id === id);
    set('customerId', id);
    set('customerName', c?.name || '');
    set('branch', c?.branch || '');
  };

  const handleTypeChange = (type) => {
    set('type', type);
    set('interestRate', RATES[type] || '');
  };

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = 'Select a customer';
    if (!form.type)       e.type       = 'Select account type';
    if (!form.initialDeposit || parseFloat(form.initialDeposit) < 500)
      e.initialDeposit = 'Minimum initial deposit is ₹500';
    if (form.type === 'fixed_deposit' && !form.maturityDate)
      e.maturityDate = 'Maturity date required for FD';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <FormField label="Customer" required error={errors.customerId}>
          <Select
            value={form.customerId}
            onChange={e => handleCustomer(e.target.value)}
            options={CUSTOMER_OPTIONS}
            placeholder="Select customer…"
            error={!!errors.customerId}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Account Type" required error={errors.type}>
            <Select
              value={form.type}
              onChange={e => handleTypeChange(e.target.value)}
              options={ACCOUNT_TYPE_OPTIONS}
              placeholder="Select type"
              error={!!errors.type}
            />
          </FormField>

          <FormField label="Branch" required>
            <Select
              value={form.branch}
              onChange={e => set('branch', e.target.value)}
              options={BRANCH_OPTIONS}
              placeholder="Select branch"
            />
          </FormField>

          <FormField label="Initial Deposit (₹)" required error={errors.initialDeposit}>
            <input type="number" min={500} value={form.initialDeposit}
              onChange={e => set('initialDeposit', e.target.value)}
              placeholder="5000"
              className={`form-control${errors.initialDeposit ? ' error' : ''}`} />
          </FormField>

          <FormField label="Interest Rate (% p.a.)">
            <input type="number" value={form.interestRate} readOnly
              className="form-control"
              style={{ background: 'var(--color-bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }} />
          </FormField>
        </div>

        {form.type === 'fixed_deposit' && (
          <FormField label="Maturity Date" required error={errors.maturityDate}>
            <DatePicker
              value={form.maturityDate}
              onChange={e => set('maturityDate', e.target.value)}
              placeholder="Select maturity date"
              minDate={new Date().toISOString().split('T')[0]}
              error={!!errors.maturityDate}
            />
          </FormField>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingBottom: 2 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit" loading={loading}>Open Account</Button>
      </div>
    </form>
  );
};

export default AccountForm;