import { MOCK_TRANSACTIONS } from '../utils/mockData';
import { generateId } from '../utils';

let transactions = [...MOCK_TRANSACTIONS];
const delay = (ms = 500) => new Promise(r => setTimeout(r, ms));

const transactionService = {
  getAll: async (params = {}) => {
    await delay(400);
    let data = [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const { search, type, status, accountId, dateFrom, dateTo, page = 1, limit = 10 } = params;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(t =>
        t.txnId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.accountNumber.includes(q)
      );
    }
    if (type)      data = data.filter(t => t.type === type);
    if (status)    data = data.filter(t => t.status === status);
    if (accountId) data = data.filter(t => t.accountId === accountId);
    if (dateFrom)  data = data.filter(t => new Date(t.createdAt) >= new Date(dateFrom));
    if (dateTo)    data = data.filter(t => new Date(t.createdAt) <= new Date(dateTo));
    const total = data.length;
    const start = (page - 1) * limit;
    return { data: data.slice(start, start + limit), total, page, limit };
  },

  getById: async (id) => {
    await delay(300);
    const t = transactions.find(t => t.id === id);
    if (!t) throw new Error('Transaction not found');
    return t;
  },

  deposit: async (payload) => {
    await delay(800);
    const txn = {
      id: generateId(),
      txnId: `TXN-${Date.now()}`,
      accountId: payload.accountId,
      accountNumber: payload.accountNumber,
      customerName: payload.customerName,
      type: 'deposit',
      amount: parseFloat(payload.amount),
      balance: parseFloat(payload.newBalance || 0),
      status: 'completed',
      description: payload.description || 'Cash deposit',
      createdAt: new Date().toISOString(),
      processedBy: payload.processedBy || 'Teller',
    };
    transactions.unshift(txn);
    return txn;
  },

  withdraw: async (payload) => {
    await delay(800);
    const txn = {
      id: generateId(),
      txnId: `TXN-${Date.now()}`,
      accountId: payload.accountId,
      accountNumber: payload.accountNumber,
      customerName: payload.customerName,
      type: 'withdrawal',
      amount: parseFloat(payload.amount),
      balance: parseFloat(payload.newBalance || 0),
      status: 'completed',
      description: payload.description || 'Cash withdrawal',
      createdAt: new Date().toISOString(),
      processedBy: payload.processedBy || 'Teller',
    };
    transactions.unshift(txn);
    return txn;
  },

  transfer: async (payload) => {
    await delay(1000);
    const txn = {
      id: generateId(),
      txnId: `TXN-${Date.now()}`,
      accountId: payload.fromAccountId,
      accountNumber: payload.fromAccountNumber,
      customerName: payload.fromCustomerName,
      type: 'transfer',
      amount: parseFloat(payload.amount),
      balance: parseFloat(payload.newBalance || 0),
      toAccount: payload.toAccountNumber,
      status: 'completed',
      description: payload.description || 'Fund transfer',
      createdAt: new Date().toISOString(),
      processedBy: payload.processedBy || 'Online',
    };
    transactions.unshift(txn);
    return txn;
  },

  getStats: async () => {
    await delay(300);
    const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
    const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
    const totalTransfers = transactions.filter(t => t.type === 'transfer' && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
    return { totalDeposits, totalWithdrawals, totalTransfers, total: transactions.length };
  },
};

export default transactionService;
