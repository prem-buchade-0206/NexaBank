import { MOCK_ACCOUNTS } from '../utils/mockData';
import { generateId } from '../utils';

let accounts = [...MOCK_ACCOUNTS];
const delay = (ms = 500) => new Promise(r => setTimeout(r, ms));

const accountService = {
  getAll: async (params = {}) => {
    await delay(400);
    let data = [...accounts];
    const { search, type, status, customerId, page = 1, limit = 10 } = params;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(a =>
        a.accountNumber.includes(q) ||
        a.customerName.toLowerCase().includes(q)
      );
    }
    if (type)       data = data.filter(a => a.type === type);
    if (status)     data = data.filter(a => a.status === status);
    if (customerId) data = data.filter(a => a.customerId === customerId);
    const total = data.length;
    const start = (page - 1) * limit;
    return { data: data.slice(start, start + limit), total, page, limit };
  },

  getById: async (id) => {
    await delay(300);
    const a = accounts.find(a => a.id === id);
    if (!a) throw new Error('Account not found');
    return a;
  },

  getByCustomer: async (customerId) => {
    await delay(300);
    return accounts.filter(a => a.customerId === customerId);
  },

  create: async (payload) => {
    await delay(700);
    const newA = {
      ...payload,
      id: generateId(),
      accountNumber: `100${Date.now().toString().slice(-7)}`,
      balance: parseFloat(payload.initialDeposit) || 0,
      status: 'active',
      openedAt: new Date().toISOString(),
      lastTransaction: new Date().toISOString(),
    };
    accounts.unshift(newA);
    return newA;
  },

  update: async (id, payload) => {
    await delay(500);
    const idx = accounts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Account not found');
    accounts[idx] = { ...accounts[idx], ...payload };
    return accounts[idx];
  },

  updateStatus: async (id, status) => {
    await delay(400);
    const idx = accounts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Account not found');
    accounts[idx] = { ...accounts[idx], status };
    return accounts[idx];
  },

  getSummary: async () => {
    await delay(300);
    const total = accounts.length;
    const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
    const byType = accounts.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});
    return { total, totalBalance, byType };
  },
};

export default accountService;
