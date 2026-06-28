import { useState } from 'react';
import Button from '../common/Button';
import Select from '../common/Select';
import { MOCK_CUSTOMERS } from '../../utils/mockData';
import { formatCurrency } from '../../utils';

const LOAN_TYPE_OPTIONS = [
  { value: 'personal',  label: 'Personal' },
  { value: 'home',      label: 'Home' },
  { value: 'vehicle',   label: 'Vehicle' },
  { value: 'business',  label: 'Business' },
  { value: 'education', label: 'Education' },
];

const TENURE_OPTIONS = [12,24,36,48,60,84,120,180,240].map(t => ({
  value: String(t), label: `${t} months`,
}));

const INTEREST_RATES = { personal: 12.5, home: 8.5, vehicle: 9.5, business: 11.0, education: 7.0 };

const CUSTOMER_OPTIONS = MOCK_CUSTOMERS
  .filter(c => c.status === 'active')
  .map(c => ({ value: c.id, label: `${c.name} — ${c.customerId}` }));

const FormField = ({ label, required, error, children }) => (
  <div className="form-group">
    <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
    {children}
    {error && <span className="form-error">⚠ {error}</span>}
  </div>
);

const LoanForm = ({ onSubmit, onCancel, loading }) => {
  const [form, setForm] = useState({
    customerId: '', type: 'personal', amount: '', tenure: '36',
    interestRate: 12.5, purpose: '',
  });
  const [errors, setErrors] = useState({});

  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(p => ({ ...p, [f]: '' })); };

  const handleType = (type) => { set('type', type); set('interestRate', INTEREST_RATES[type] || 12); };

  const emi = form.amount && form.tenure
    ? (() => {
        const p = parseFloat(form.amount);
        const r = parseFloat(form.interestRate) / 12 / 100;
        const n = parseInt(form.tenure);
        return p * r * Math.pow(1+r,n) / (Math.pow(1+r,n) - 1);
      })()
    : 0;

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = 'Select a customer';
    if (!form.amount || parseFloat(form.amount) < 10000) e.amount = 'Minimum loan amount is ₹10,000';
    if (!form.purpose.trim()) e.purpose = 'Enter loan purpose';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const customer = MOCK_CUSTOMERS.find(c => c.id === form.customerId);
    onSubmit({ ...form, customerName: customer?.name, emiAmount: Math.round(emi) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <FormField label="Customer" required error={errors.customerId}>
          <Select
            value={form.customerId}
            onChange={e => set('customerId', e.target.value)}
            options={CUSTOMER_OPTIONS}
            placeholder="Select customer…"
            error={!!errors.customerId}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Loan Type" required>
            <Select
              value={form.type}
              onChange={e => handleType(e.target.value)}
              options={LOAN_TYPE_OPTIONS}
              placeholder="Select type"
            />
          </FormField>

          <FormField label="Interest Rate (% p.a.)">
            <input type="number" value={form.interestRate} readOnly className="form-control"
              style={{ background: 'var(--color-bg-secondary)', cursor: 'not-allowed', opacity: 0.7 }} />
          </FormField>

          <FormField label="Loan Amount (₹)" required error={errors.amount}>
            <input type="number" min={10000} value={form.amount}
              onChange={e => set('amount', e.target.value)} placeholder="500000"
              className={`form-control${errors.amount ? ' error' : ''}`} />
          </FormField>

          <FormField label="Tenure" required>
            <Select
              value={form.tenure}
              onChange={e => set('tenure', e.target.value)}
              options={TENURE_OPTIONS}
              placeholder="Select tenure"
            />
          </FormField>
        </div>

        <FormField label="Purpose" required error={errors.purpose}>
          <textarea value={form.purpose} onChange={e => set('purpose', e.target.value)}
            placeholder="Describe loan purpose…" rows={2}
            className={`form-control${errors.purpose ? ' error' : ''}`} />
        </FormField>

        {emi > 0 && (
          <div style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-primary)', marginBottom: 2, fontWeight: 500 }}>Monthly EMI</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'Poppins, sans-serif' }}>{formatCurrency(emi)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--color-primary)', marginBottom: 2 }}>Total Payable</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(emi * parseInt(form.tenure))}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingBottom: 2 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit" loading={loading}>Submit Application</Button>
      </div>
    </form>
  );
};

export default LoanForm;