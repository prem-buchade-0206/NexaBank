import { useState } from 'react';
import Button from '../common/Button';
import Select from '../common/Select';
import DatePicker from '../common/DatePicker';
import { isEmail, isPhone, isPAN } from '../../utils';

const INITIAL = {
  name: '', email: '', phone: '', gender: '', dob: '',
  pan: '', aadhar: '', address: '', city: '', state: '', pincode: '',
  branch: '',
};

const FormField = ({ label, required, error, children }) => (
  <div className="form-group">
    <label className={`form-label${required ? ' required' : ''}`}>{label}</label>
    {children}
    {error && <span className="form-error">⚠ {error}</span>}
  </div>
);

const GENDER_OPTIONS  = ['Male', 'Female', 'Other'];
const BRANCH_OPTIONS  = ['Pune Branch', 'HQ Mumbai', 'Hyderabad Branch', 'Delhi Branch'];

const CustomerForm = ({ initial = {}, onSubmit, onCancel, loading }) => {
  const [form,   setForm]   = useState({ ...INITIAL, ...initial });
  const [errors, setErrors] = useState({});

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => ({ ...p, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!isEmail(form.email)) e.email = 'Invalid email address';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!isPhone(form.phone)) e.phone = 'Enter valid 10-digit Indian mobile number';
    if (!form.gender)  e.gender  = 'Select gender';
    if (!form.dob)     e.dob     = 'Date of birth is required';
    if (form.pan && !isPAN(form.pan)) e.pan = 'Invalid PAN (e.g. ABCDE1234F)';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim())    e.city    = 'City is required';
    if (!form.state.trim())   e.state   = 'State is required';
    if (!form.branch.trim())  e.branch  = 'Branch is required';
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <FormField label="Full Name" required error={errors.name}>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Aarav Mehta" className={`form-control${errors.name ? ' error' : ''}`} />
        </FormField>

        <FormField label="Email" required error={errors.email}>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="aarav@example.com" className={`form-control${errors.email ? ' error' : ''}`} />
        </FormField>

        <FormField label="Phone" required error={errors.phone}>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
            placeholder="9876543210" maxLength={10}
            className={`form-control${errors.phone ? ' error' : ''}`} />
        </FormField>

        <FormField label="Gender" required error={errors.gender}>
          <Select
            value={form.gender}
            onChange={e => set('gender', e.target.value)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
            error={!!errors.gender}
          />
        </FormField>

        <FormField label="Date of Birth" required error={errors.dob}>
          <DatePicker
            value={form.dob}
            onChange={e => set('dob', e.target.value)}
            placeholder="Select date of birth"
            maxDate={new Date().toISOString().split('T')[0]}
            error={!!errors.dob}
          />
        </FormField>

        <FormField label="Branch" required error={errors.branch}>
          <Select
            value={form.branch}
            onChange={e => set('branch', e.target.value)}
            options={BRANCH_OPTIONS}
            placeholder="Select branch"
            error={!!errors.branch}
          />
        </FormField>

        <FormField label="PAN Number" error={errors.pan}>
          <input type="text" value={form.pan}
            onChange={e => set('pan', e.target.value.toUpperCase())}
            placeholder="ABCDE1234F" maxLength={10}
            className={`form-control${errors.pan ? ' error' : ''}`} />
        </FormField>

        <FormField label="Aadhar Number" error={errors.aadhar}>
          <input type="text" value={form.aadhar} onChange={e => set('aadhar', e.target.value)}
            placeholder="XXXX XXXX XXXX" className="form-control" />
        </FormField>
      </div>

      <div style={{ marginTop: 16 }}>
        <FormField label="Address" required error={errors.address}>
          <textarea value={form.address} onChange={e => set('address', e.target.value)}
            placeholder="House no., Street, Area" rows={2}
            className={`form-control${errors.address ? ' error' : ''}`} />
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 16, marginTop: 16 }}>
        <FormField label="City" required error={errors.city}>
          <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
            placeholder="Pune" className={`form-control${errors.city ? ' error' : ''}`} />
        </FormField>

        <FormField label="State" required error={errors.state}>
          <input type="text" value={form.state} onChange={e => set('state', e.target.value)}
            placeholder="Maharashtra" className={`form-control${errors.state ? ' error' : ''}`} />
        </FormField>

        <FormField label="Pincode" error={errors.pincode}>
          <input type="text" value={form.pincode} onChange={e => set('pincode', e.target.value)}
            maxLength={6} placeholder="411001" className="form-control" />
        </FormField>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingBottom: 2 }}>
        <Button variant="secondary" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initial.id ? 'Save Changes' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;