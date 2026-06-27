import { MOCK_LOANS } from '../utils/mockData';
import { generateId } from '../utils';

let loans = [...MOCK_LOANS];
const delay = (ms = 500) => new Promise(r => setTimeout(r, ms));

const loanService = {
  getAll: async (params = {}) => {
    await delay(400);
    let data = [...loans];
    const { search, status, type, page = 1, limit = 10 } = params;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(l =>
        l.loanId.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q)
      );
    }
    if (status) data = data.filter(l => l.status === status);
    if (type)   data = data.filter(l => l.type === type);
    const total = data.length;
    const start = (page - 1) * limit;
    return { data: data.slice(start, start + limit), total, page, limit };
  },

  getById: async (id) => {
    await delay(300);
    const l = loans.find(l => l.id === id);
    if (!l) throw new Error('Loan not found');
    return l;
  },

  apply: async (payload) => {
    await delay(700);
    const newL = {
      ...payload,
      id: generateId(),
      loanId: `LOAN-${String(loans.length + 1).padStart(3, '0')}`,
      outstanding: parseFloat(payload.amount),
      status: 'pending',
      appliedAt: new Date().toISOString(),
      approvedAt: null,
      approvedBy: null,
    };
    loans.unshift(newL);
    return newL;
  },

  approve: async (id, approvedBy) => {
    await delay(500);
    const idx = loans.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Loan not found');
    loans[idx] = { ...loans[idx], status: 'approved', approvedAt: new Date().toISOString(), approvedBy };
    return loans[idx];
  },

  reject: async (id, reason, rejectedBy) => {
    await delay(500);
    const idx = loans.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Loan not found');
    loans[idx] = { ...loans[idx], status: 'rejected', rejectionReason: reason, approvedBy: rejectedBy };
    return loans[idx];
  },

  activate: async (id) => {
    await delay(400);
    const idx = loans.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Loan not found');
    loans[idx] = { ...loans[idx], status: 'active', nextEmiDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] };
    return loans[idx];
  },

  getStats: async () => {
    await delay(300);
    const active   = loans.filter(l => l.status === 'active').length;
    const pending  = loans.filter(l => l.status === 'pending').length;
    const totalBook = loans.filter(l => l.status === 'active').reduce((s, l) => s + l.outstanding, 0);
    return { active, pending, totalBook, total: loans.length };
  },
};

export default loanService;
