import { CURRENCY } from '../constants';

// ── Currency Formatter ───────────────────────────────────────
export const formatCurrency = (amount, options = {}) => {
  const { showSymbol = true, decimals = 2 } = options;
  const num = parseFloat(amount) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(num));
  return showSymbol ? `${CURRENCY.symbol}${formatted}` : formatted;
};

export const formatCompactCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  if (num >= 1_00_00_000) return `${CURRENCY.symbol}${(num / 1_00_00_000).toFixed(2)}Cr`;
  if (num >= 1_00_000)    return `${CURRENCY.symbol}${(num / 1_00_000).toFixed(2)}L`;
  if (num >= 1_000)       return `${CURRENCY.symbol}${(num / 1_000).toFixed(1)}K`;
  return formatCurrency(num);
};

// ── Date Formatters ──────────────────────────────────────────
export const formatDate = (date, format = 'medium') => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d)) return '—';
  const opts = {
    short:    { day:'2-digit', month:'2-digit', year:'numeric' },
    medium:   { day:'numeric', month:'short',   year:'numeric' },
    long:     { day:'numeric', month:'long',    year:'numeric' },
    datetime: { day:'numeric', month:'short',   year:'numeric', hour:'2-digit', minute:'2-digit' },
    time:     { hour:'2-digit', minute:'2-digit' },
    relative: null,
  };
  if (format === 'relative') return timeAgo(d);
  return d.toLocaleDateString('en-IN', opts[format] || opts.medium);
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60)   return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)   return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)     return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)       return `${days}d ago`;
  return formatDate(date, 'medium');
};

// ── String Helpers ───────────────────────────────────────────
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const titleCase = (str = '') =>
  str.replace(/\b\w/g, c => c.toUpperCase());

export const truncate = (str = '', n = 40) =>
  str.length > n ? str.slice(0, n).trim() + '…' : str;

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export const slugify = (str = '') =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

// ── Number Helpers ───────────────────────────────────────────
export const formatNumber = (n) =>
  new Intl.NumberFormat('en-IN').format(parseFloat(n) || 0);

export const formatPercent = (n, decimals = 1) =>
  `${(parseFloat(n) || 0).toFixed(decimals)}%`;

// ── Account Helpers ──────────────────────────────────────────
export const maskAccountNumber = (acc = '') =>
  acc.length > 4 ? `${'•'.repeat(acc.length - 4)}${acc.slice(-4)}` : acc;

export const formatAccountNumber = (acc = '') =>
  acc.replace(/(.{4})/g, '$1 ').trim();

// ── Color Helpers ────────────────────────────────────────────
export const getStatusColor = (status) => {
  const map = {
    active: 'success', approved: 'success', completed: 'success',
    pending: 'warning',
    inactive: 'danger', rejected: 'danger', failed: 'danger',
    closed: 'neutral', reversed: 'neutral',
  };
  return map[status?.toLowerCase()] || 'neutral';
};

export const getTransactionColor = (type) => {
  const map = { deposit: 'success', withdrawal: 'danger', transfer: 'info' };
  return map[type?.toLowerCase()] || 'neutral';
};

// ── Validation ───────────────────────────────────────────────
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone = (v) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));
export const isPAN   = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v);
export const isAadhar = (v) => /^\d{12}$/.test(v.replace(/\s/g, ''));
export const isPINCode = (v) => /^\d{6}$/.test(v);

// ── Storage ──────────────────────────────────────────────────
export const storage = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  remove: (key) => { try { localStorage.removeItem(key); } catch {} },
};

// ── Object Helpers ────────────────────────────────────────────
export const omit = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

export const pick = (obj, keys) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
};

// ── Download Helpers ──────────────────────────────────────────
export const downloadCSV = (data, filename = 'export.csv') => {
  if (!data?.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const downloadJSON = (data, filename = 'export.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ── Generate ID ────────────────────────────────────────────────
export const generateId = () => Math.random().toString(36).slice(2, 11);

// ── Class Names ────────────────────────────────────────────────
export const cn = (...classes) => classes.filter(Boolean).join(' ');
