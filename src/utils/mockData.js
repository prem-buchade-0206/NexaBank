import { generateId } from './index';

// ── Customers ─────────────────────────────────────────────────
export const MOCK_CUSTOMERS = [
  { id: 'c001', customerId: 'CUS-001', name: 'Aarav Mehta',    email: 'aarav@example.com',  phone: '9876543210', gender: 'Male',   dob: '1990-05-15', pan: 'ABCDE1234F', aadhar: '123456789012', address: '12 MG Road, Pune', city: 'Pune',    state: 'Maharashtra', pincode: '411001', status: 'active',   kycStatus: 'verified',  createdAt: '2024-01-10T09:00:00Z', branch: 'Pune Branch' },
  { id: 'c002', customerId: 'CUS-002', name: 'Sneha Iyer',     email: 'sneha@example.com',  phone: '9765432109', gender: 'Female', dob: '1985-11-22', pan: 'FGHIJ5678K', aadhar: '234567890123', address: '45 FC Road, Pune',  city: 'Pune',    state: 'Maharashtra', pincode: '411004', status: 'active',   kycStatus: 'verified',  createdAt: '2024-01-15T10:30:00Z', branch: 'Pune Branch' },
  { id: 'c003', customerId: 'CUS-003', name: 'Rohan Kapoor',   email: 'rohan@example.com',  phone: '9654321098', gender: 'Male',   dob: '1992-07-08', pan: 'KLMNO9012P', aadhar: '345678901234', address: '78 Baner Road, Pune',city: 'Pune',    state: 'Maharashtra', pincode: '411021', status: 'active',   kycStatus: 'pending',   createdAt: '2024-02-01T11:00:00Z', branch: 'Pune Branch' },
  { id: 'c004', customerId: 'CUS-004', name: 'Priya Nair',     email: 'priya@example.com',  phone: '9543210987', gender: 'Female', dob: '1988-03-30', pan: 'PQRST3456Q', aadhar: '456789012345', address: '23 Andheri West, Mumbai', city: 'Mumbai',  state: 'Maharashtra', pincode: '400058', status: 'active',   kycStatus: 'verified',  createdAt: '2024-02-10T08:00:00Z', branch: 'HQ Mumbai' },
  { id: 'c005', customerId: 'CUS-005', name: 'Vikram Singh',   email: 'vikram@example.com', phone: '9432109876', gender: 'Male',   dob: '1995-09-14', pan: 'UVWXY7890R', aadhar: '567890123456', address: '56 Juhu, Mumbai',    city: 'Mumbai',  state: 'Maharashtra', pincode: '400049', status: 'inactive', kycStatus: 'rejected',  createdAt: '2024-02-20T14:00:00Z', branch: 'HQ Mumbai' },
  { id: 'c006', customerId: 'CUS-006', name: 'Ananya Reddy',   email: 'ananya@example.com', phone: '9321098765', gender: 'Female', dob: '1993-12-05', pan: 'ZABCD2345S', aadhar: '678901234567', address: '90 Banjara Hills, Hyderabad', city: 'Hyderabad', state: 'Telangana', pincode: '500034', status: 'active', kycStatus: 'verified', createdAt: '2024-03-01T09:30:00Z', branch: 'Hyderabad Branch' },
  { id: 'c007', customerId: 'CUS-007', name: 'Arjun Sharma',   email: 'arjun@example.com',  phone: '9210987654', gender: 'Male',   dob: '1987-06-18', pan: 'EFGHI6789T', aadhar: '789012345678', address: '34 Koregaon Park, Pune', city: 'Pune',   state: 'Maharashtra', pincode: '411001', status: 'active', kycStatus: 'verified', createdAt: '2024-03-15T11:00:00Z', branch: 'Pune Branch' },
  { id: 'c008', customerId: 'CUS-008', name: 'Meera Joshi',    email: 'meera@example.com',  phone: '9109876543', gender: 'Female', dob: '1991-02-28', pan: 'JKLMN1234U', aadhar: '890123456789', address: '67 Deccan, Pune',      city: 'Pune',    state: 'Maharashtra', pincode: '411004', status: 'active', kycStatus: 'pending',  createdAt: '2024-04-01T10:00:00Z', branch: 'Pune Branch' },
];

// ── Accounts ──────────────────────────────────────────────────
export const MOCK_ACCOUNTS = [
  { id: 'a001', accountNumber: '1001234567', customerId: 'c001', customerName: 'Aarav Mehta',  type: 'savings',       balance: 245000.50, status: 'active',   interestRate: 4.0,  branch: 'Pune Branch',     openedAt: '2024-01-12T09:00:00Z', lastTransaction: '2024-06-20T14:30:00Z' },
  { id: 'a002', accountNumber: '1001234568', customerId: 'c001', customerName: 'Aarav Mehta',  type: 'fixed_deposit', balance: 500000.00, status: 'active',   interestRate: 7.5,  branch: 'Pune Branch',     openedAt: '2024-01-15T10:00:00Z', lastTransaction: '2024-01-15T10:00:00Z', maturityDate: '2025-01-15' },
  { id: 'a003', accountNumber: '1001234569', customerId: 'c002', customerName: 'Sneha Iyer',   type: 'savings',       balance: 89300.00,  status: 'active',   interestRate: 4.0,  branch: 'Pune Branch',     openedAt: '2024-01-17T11:00:00Z', lastTransaction: '2024-06-18T10:00:00Z' },
  { id: 'a004', accountNumber: '1001234570', customerId: 'c003', customerName: 'Rohan Kapoor', type: 'current',       balance: 1250000.00,status: 'active',   interestRate: 0.5,  branch: 'Pune Branch',     openedAt: '2024-02-03T09:00:00Z', lastTransaction: '2024-06-21T16:00:00Z' },
  { id: 'a005', accountNumber: '1001234571', customerId: 'c004', customerName: 'Priya Nair',   type: 'savings',       balance: 62750.25,  status: 'active',   interestRate: 4.0,  branch: 'HQ Mumbai',       openedAt: '2024-02-12T08:00:00Z', lastTransaction: '2024-06-15T12:00:00Z' },
  { id: 'a006', accountNumber: '1001234572', customerId: 'c005', customerName: 'Vikram Singh', type: 'savings',       balance: 15000.00,  status: 'frozen',   interestRate: 4.0,  branch: 'HQ Mumbai',       openedAt: '2024-02-22T14:00:00Z', lastTransaction: '2024-04-10T09:00:00Z' },
  { id: 'a007', accountNumber: '1001234573', customerId: 'c006', customerName: 'Ananya Reddy', type: 'savings',       balance: 328500.00, status: 'active',   interestRate: 4.0,  branch: 'Hyderabad Branch', openedAt: '2024-03-03T09:30:00Z', lastTransaction: '2024-06-19T11:00:00Z' },
  { id: 'a008', accountNumber: '1001234574', customerId: 'c007', customerName: 'Arjun Sharma', type: 'current',       balance: 875000.00, status: 'active',   interestRate: 0.5,  branch: 'Pune Branch',     openedAt: '2024-03-17T11:00:00Z', lastTransaction: '2024-06-22T08:00:00Z' },
  { id: 'a009', accountNumber: '1001234575', customerId: 'c008', customerName: 'Meera Joshi',  type: 'savings',       balance: 44200.75,  status: 'active',   interestRate: 4.0,  branch: 'Pune Branch',     openedAt: '2024-04-03T10:00:00Z', lastTransaction: '2024-06-17T15:00:00Z' },
];

// ── Transactions ──────────────────────────────────────────────
export const MOCK_TRANSACTIONS = [
  { id: 't001', txnId: 'TXN-2024-001', accountId: 'a001', accountNumber: '1001234567', customerName: 'Aarav Mehta',  type: 'deposit',    amount: 50000, balance: 245000.50, status: 'completed', description: 'Salary credit',         createdAt: '2024-06-20T14:30:00Z', processedBy: 'Rahul Verma' },
  { id: 't002', txnId: 'TXN-2024-002', accountId: 'a001', accountNumber: '1001234567', customerName: 'Aarav Mehta',  type: 'withdrawal', amount: 10000, balance: 195000.50, status: 'completed', description: 'ATM withdrawal',         createdAt: '2024-06-19T10:00:00Z', processedBy: 'System' },
  { id: 't003', txnId: 'TXN-2024-003', accountId: 'a003', accountNumber: '1001234569', customerName: 'Sneha Iyer',   type: 'transfer',   amount: 25000, balance: 89300.00,  status: 'completed', description: 'Transfer to savings',    createdAt: '2024-06-18T10:00:00Z', processedBy: 'Rahul Verma' },
  { id: 't004', txnId: 'TXN-2024-004', accountId: 'a004', accountNumber: '1001234570', customerName: 'Rohan Kapoor', type: 'deposit',    amount: 200000,balance: 1250000.00,status: 'completed', description: 'Business income',        createdAt: '2024-06-21T16:00:00Z', processedBy: 'Priya Patel' },
  { id: 't005', txnId: 'TXN-2024-005', accountId: 'a005', accountNumber: '1001234571', customerName: 'Priya Nair',   type: 'withdrawal', amount: 5000,  balance: 62750.25,  status: 'completed', description: 'Bill payment',           createdAt: '2024-06-15T12:00:00Z', processedBy: 'Rahul Verma' },
  { id: 't006', txnId: 'TXN-2024-006', accountId: 'a007', accountNumber: '1001234573', customerName: 'Ananya Reddy', type: 'deposit',    amount: 75000, balance: 328500.00, status: 'completed', description: 'Investment returns',     createdAt: '2024-06-19T11:00:00Z', processedBy: 'System' },
  { id: 't007', txnId: 'TXN-2024-007', accountId: 'a008', accountNumber: '1001234574', customerName: 'Arjun Sharma', type: 'transfer',   amount: 150000,balance: 875000.00, status: 'completed', description: 'Vendor payment',         createdAt: '2024-06-22T08:00:00Z', processedBy: 'Priya Patel' },
  { id: 't008', txnId: 'TXN-2024-008', accountId: 'a009', accountNumber: '1001234575', customerName: 'Meera Joshi',  type: 'deposit',    amount: 12000, balance: 44200.75,  status: 'pending',   description: 'Rent received',          createdAt: '2024-06-17T15:00:00Z', processedBy: 'Rahul Verma' },
  { id: 't009', txnId: 'TXN-2024-009', accountId: 'a001', accountNumber: '1001234567', customerName: 'Aarav Mehta',  type: 'deposit',    amount: 8000,  balance: 203000.50, status: 'completed', description: 'Freelance payment',      createdAt: '2024-06-16T09:00:00Z', processedBy: 'System' },
  { id: 't010', txnId: 'TXN-2024-010', accountId: 'a003', accountNumber: '1001234569', customerName: 'Sneha Iyer',   type: 'withdrawal', amount: 3500,  balance: 64300.00,  status: 'failed',    description: 'Online purchase - declined', createdAt: '2024-06-14T17:00:00Z', processedBy: 'System' },
];

// ── Loans ─────────────────────────────────────────────────────
export const MOCK_LOANS = [
  { id: 'l001', loanId: 'LOAN-001', customerId: 'c001', customerName: 'Aarav Mehta',  type: 'personal', amount: 300000, outstanding: 220000, interestRate: 12.5, tenure: 36, emiAmount: 10050, status: 'active',   appliedAt: '2024-01-20T09:00:00Z', approvedAt: '2024-01-22T10:00:00Z', approvedBy: 'Priya Patel',   nextEmiDate: '2024-07-01' },
  { id: 'l002', loanId: 'LOAN-002', customerId: 'c004', customerName: 'Priya Nair',   type: 'home',     amount: 5000000,outstanding: 4750000,interestRate: 8.5,  tenure: 240,emiAmount: 43390, status: 'active',   appliedAt: '2024-02-15T08:00:00Z', approvedAt: '2024-02-18T11:00:00Z', approvedBy: 'Arjun Sharma',  nextEmiDate: '2024-07-05' },
  { id: 'l003', loanId: 'LOAN-003', customerId: 'c007', customerName: 'Arjun Sharma', type: 'business', amount: 2000000,outstanding: 0,      interestRate: 11.0, tenure: 60, emiAmount: 43476, status: 'closed',   appliedAt: '2023-06-10T10:00:00Z', approvedAt: '2023-06-12T14:00:00Z', approvedBy: 'Priya Patel',   nextEmiDate: null },
  { id: 'l004', loanId: 'LOAN-004', customerId: 'c003', customerName: 'Rohan Kapoor', type: 'vehicle',  amount: 800000, outstanding: 800000, interestRate: 9.5,  tenure: 60, emiAmount: 16765, status: 'pending',  appliedAt: '2024-06-18T11:00:00Z', approvedAt: null,                  approvedBy: null,            nextEmiDate: null },
  { id: 'l005', loanId: 'LOAN-005', customerId: 'c005', customerName: 'Vikram Singh', type: 'personal', amount: 150000, outstanding: 150000, interestRate: 15.0, tenure: 24, emiAmount: 7280,  status: 'rejected', appliedAt: '2024-05-10T09:00:00Z', approvedAt: null,                  approvedBy: 'Priya Patel',   nextEmiDate: null },
  { id: 'l006', loanId: 'LOAN-006', customerId: 'c006', customerName: 'Ananya Reddy', type: 'education',amount: 600000, outstanding: 540000, interestRate: 7.0,  tenure: 84, emiAmount: 9090,  status: 'active',   appliedAt: '2024-03-05T09:30:00Z', approvedAt: '2024-03-07T11:00:00Z', approvedBy: 'Arjun Sharma',  nextEmiDate: '2024-07-10' },
];

// ── Audit Logs ─────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS = [
  { id: 'au001', user: 'Arjun Sharma', role: 'super_admin', action: 'LOGIN',            module: 'Auth',         description: 'Successful login',              ip: '192.168.1.1',  device: 'Chrome 124 / Windows', timestamp: '2024-06-23T09:00:00Z' },
  { id: 'au002', user: 'Priya Patel',  role: 'branch_manager', action: 'CUSTOMER_CREATE',module: 'Customers',   description: 'Added customer Meera Joshi',    ip: '192.168.1.5',  device: 'Chrome 124 / macOS',   timestamp: '2024-06-23T09:15:00Z' },
  { id: 'au003', user: 'Rahul Verma',  role: 'employee',    action: 'TRANSACTION',       module: 'Transactions', description: 'Processed deposit ₹50,000',     ip: '192.168.1.10', device: 'Firefox 125 / Windows',timestamp: '2024-06-23T09:30:00Z' },
  { id: 'au004', user: 'Priya Patel',  role: 'branch_manager', action: 'LOAN_APPROVE',  module: 'Loans',        description: 'Approved loan LOAN-006',        ip: '192.168.1.5',  device: 'Chrome 124 / macOS',   timestamp: '2024-06-22T14:00:00Z' },
  { id: 'au005', user: 'Arjun Sharma', role: 'super_admin', action: 'SETTINGS_UPDATE',   module: 'Settings',    description: 'Updated system settings',       ip: '192.168.1.1',  device: 'Chrome 124 / Windows', timestamp: '2024-06-22T11:00:00Z' },
  { id: 'au006', user: 'Rahul Verma',  role: 'employee',    action: 'ACCOUNT_CREATE',    module: 'Accounts',    description: 'Opened savings account for Meera Joshi', ip: '192.168.1.10', device: 'Firefox 125 / Windows', timestamp: '2024-06-21T10:30:00Z' },
  { id: 'au007', user: 'System',       role: 'system',      action: 'INTEREST_CREDIT',   module: 'Accounts',    description: 'Auto interest credit for Q2',   ip: '127.0.0.1',    device: 'System Process',       timestamp: '2024-06-30T00:00:00Z' },
  { id: 'au008', user: 'Priya Patel',  role: 'branch_manager', action: 'LOAN_REJECT',   module: 'Loans',        description: 'Rejected loan for Vikram Singh',ip: '192.168.1.5',  device: 'Chrome 124 / macOS',   timestamp: '2024-06-20T16:00:00Z' },
  { id: 'au009', user: 'Arjun Sharma', role: 'super_admin', action: 'USER_CREATE',       module: 'Users',       description: 'Created employee Rahul Verma',  ip: '192.168.1.1',  device: 'Chrome 124 / Windows', timestamp: '2024-06-19T09:00:00Z' },
  { id: 'au010', user: 'Anita Desai',  role: 'auditor',     action: 'REPORT_EXPORT',     module: 'Reports',     description: 'Exported Q2 transaction report', ip: '192.168.1.20', device: 'Edge 124 / Windows',   timestamp: '2024-06-18T15:00:00Z' },
];

// ── Dashboard Analytics ────────────────────────────────────────
export const MOCK_DASHBOARD_STATS = {
  totalCustomers:     { value: 8,         growth: 12.5,  label: 'Total Customers' },
  totalAccounts:      { value: 9,         growth: 8.3,   label: 'Total Accounts' },
  totalDeposits:      { value: 3709751,   growth: 23.1,  label: 'Total Deposits' },
  totalWithdrawals:   { value: 193500,    growth: -5.2,  label: 'Total Withdrawals' },
  activeLoans:        { value: 3,         growth: 50.0,  label: 'Active Loans' },
  totalLoanBook:      { value: 7510000,   growth: 15.8,  label: 'Loan Book Value' },
};

export const MOCK_MONTHLY_REVENUE = [
  { month: 'Jan', deposits: 550000, withdrawals: 180000, transfers: 320000 },
  { month: 'Feb', deposits: 480000, withdrawals: 150000, transfers: 290000 },
  { month: 'Mar', deposits: 720000, withdrawals: 210000, transfers: 410000 },
  { month: 'Apr', deposits: 630000, withdrawals: 195000, transfers: 365000 },
  { month: 'May', deposits: 810000, withdrawals: 240000, transfers: 490000 },
  { month: 'Jun', deposits: 920000, withdrawals: 275000, transfers: 560000 },
];

export const MOCK_ACCOUNT_DISTRIBUTION = [
  { name: 'Savings',       value: 6, color: '#1a56db' },
  { name: 'Current',       value: 2, color: '#0e9f6e' },
  { name: 'Fixed Deposit', value: 1, color: '#7c3aed' },
];

export const MOCK_LOAN_STATUS = [
  { name: 'Active',   value: 3, color: '#0e9f6e' },
  { name: 'Pending',  value: 1, color: '#d97706' },
  { name: 'Closed',   value: 1, color: '#94a3b8' },
  { name: 'Rejected', value: 1, color: '#e02424' },
];

export const MOCK_TXN_TRENDS = [
  { date: 'Jun 17', deposits: 12000, withdrawals: 0,     transfers: 0 },
  { date: 'Jun 18', deposits: 25000, withdrawals: 3500,  transfers: 25000 },
  { date: 'Jun 19', deposits: 75000, withdrawals: 5000,  transfers: 150000 },
  { date: 'Jun 20', deposits: 50000, withdrawals: 10000, transfers: 0 },
  { date: 'Jun 21', deposits: 200000,withdrawals: 0,     transfers: 0 },
  { date: 'Jun 22', deposits: 8000,  withdrawals: 0,     transfers: 150000 },
  { date: 'Jun 23', deposits: 12000, withdrawals: 0,     transfers: 0 },
];

// ── Notifications ─────────────────────────────────────────────
export const MOCK_NOTIFICATIONS = [
  { id: 'n001', type: 'success', title: 'Deposit Successful',   message: 'Salary credit of ₹50,000 to Aarav Mehta', read: false, timestamp: '2024-06-23T09:30:00Z' },
  { id: 'n002', type: 'info',    title: 'Loan Application',     message: 'Rohan Kapoor applied for vehicle loan ₹8L', read: false, timestamp: '2024-06-23T09:15:00Z' },
  { id: 'n003', type: 'warning', title: 'KYC Pending',          message: '2 customers have pending KYC verification', read: true,  timestamp: '2024-06-23T08:00:00Z' },
  { id: 'n004', type: 'danger',  title: 'Transaction Failed',   message: 'Online purchase declined for Sneha Iyer', read: true,  timestamp: '2024-06-22T17:00:00Z' },
  { id: 'n005', type: 'success', title: 'Loan Approved',        message: 'Education loan approved for Ananya Reddy', read: true, timestamp: '2024-06-22T14:00:00Z' },
];
