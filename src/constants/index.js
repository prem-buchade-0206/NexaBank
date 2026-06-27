// ── API ─────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
export const APP_NAME     = 'NexaBank';
export const APP_VERSION  = '1.0.0';

// ── Theme ────────────────────────────────────────────────────
export const THEMES = { LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' };
export const THEME_STORAGE_KEY = 'nexabank_theme';
export const AUTH_TOKEN_KEY    = 'nexabank_token';
export const REFRESH_TOKEN_KEY = 'nexabank_refresh';

// ── Roles ────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN:    'super_admin',
  BRANCH_MANAGER: 'branch_manager',
  EMPLOYEE:       'employee',
  AUDITOR:        'auditor',
  CUSTOMER:       'customer',
};

export const ROLE_LABELS = {
  super_admin:    'Super Admin',
  branch_manager: 'Branch Manager',
  employee:       'Employee',
  auditor:        'Auditor',
  customer:       'Customer',
};

// ── Account Types ────────────────────────────────────────────
export const ACCOUNT_TYPES = {
  SAVINGS:       'savings',
  CURRENT:       'current',
  FIXED_DEPOSIT: 'fixed_deposit',
};

export const ACCOUNT_TYPE_LABELS = {
  savings:       'Savings',
  current:       'Current',
  fixed_deposit: 'Fixed Deposit',
};

// ── Transaction Types ────────────────────────────────────────
export const TRANSACTION_TYPES = {
  DEPOSIT:    'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER:   'transfer',
};

export const TRANSACTION_TYPE_LABELS = {
  deposit:    'Deposit',
  withdrawal: 'Withdrawal',
  transfer:   'Transfer',
};

// ── Transaction Status ───────────────────────────────────────
export const TRANSACTION_STATUS = {
  PENDING:   'pending',
  COMPLETED: 'completed',
  FAILED:    'failed',
  REVERSED:  'reversed',
};

// ── Loan Status ──────────────────────────────────────────────
export const LOAN_STATUS = {
  PENDING:  'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE:   'active',
  CLOSED:   'closed',
};

export const LOAN_STATUS_LABELS = {
  pending:  'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  active:   'Active',
  closed:   'Closed',
};

// ── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ── Date Formats ─────────────────────────────────────────────
export const DATE_FORMAT      = 'MMM dd, yyyy';
export const DATETIME_FORMAT  = 'MMM dd, yyyy HH:mm';
export const SHORT_DATE_FORMAT = 'dd/MM/yyyy';

// ── Currency ─────────────────────────────────────────────────
export const CURRENCY = { symbol: '₹', code: 'INR', name: 'Indian Rupee' };

// ── Nav Items ─────────────────────────────────────────────────
export const NAV_ITEMS = [
  { path: '/dashboard',    label: 'Dashboard',     icon: 'LayoutDashboard', roles: ['super_admin','branch_manager','employee','auditor'] },
  { path: '/customers',    label: 'Customers',     icon: 'Users',           roles: ['super_admin','branch_manager','employee'] },
  { path: '/accounts',     label: 'Accounts',      icon: 'CreditCard',      roles: ['super_admin','branch_manager','employee'] },
  { path: '/transactions', label: 'Transactions',  icon: 'ArrowLeftRight',  roles: ['super_admin','branch_manager','employee'] },
  { path: '/statements',   label: 'Statements',    icon: 'FileText',        roles: ['super_admin','branch_manager','employee','customer'] },
  { path: '/loans',        label: 'Loans',         icon: 'Landmark',        roles: ['super_admin','branch_manager','employee'] },
  { path: '/reports',      label: 'Reports',       icon: 'BarChart2',       roles: ['super_admin','branch_manager','auditor'] },
  { path: '/audit-logs',   label: 'Audit Logs',    icon: 'ShieldCheck',     roles: ['super_admin','auditor'] },
  { path: '/settings',     label: 'Settings',      icon: 'Settings',        roles: ['super_admin','branch_manager','employee','auditor','customer'] },
];