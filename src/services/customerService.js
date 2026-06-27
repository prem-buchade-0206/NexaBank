import { MOCK_CUSTOMERS } from '../utils/mockData';
import { generateId } from '../utils';

let customers = [...MOCK_CUSTOMERS];

const delay = (ms = 500) => new Promise(r => setTimeout(r, ms));

const customerService = {
  getAll: async (params = {}) => {
    await delay(400);
    let data = [...customers];
    const { search, status, branch, page = 1, limit = 10 } = params;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.customerId.toLowerCase().includes(q)
      );
    }
    if (status) data = data.filter(c => c.status === status);
    if (branch) data = data.filter(c => c.branch === branch);
    const total = data.length;
    const start = (page - 1) * limit;
    return { data: data.slice(start, start + limit), total, page, limit };
  },

  getById: async (id) => {
    await delay(300);
    const c = customers.find(c => c.id === id);
    if (!c) throw new Error('Customer not found');
    return c;
  },

  create: async (payload) => {
    await delay(600);
    const newC = {
      ...payload,
      id: generateId(),
      customerId: `CUS-${String(customers.length + 1).padStart(3, '0')}`,
      status: 'active',
      kycStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    customers.unshift(newC);
    return newC;
  },

  update: async (id, payload) => {
    await delay(500);
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    customers[idx] = { ...customers[idx], ...payload };
    return customers[idx];
  },

  delete: async (id) => {
    await delay(400);
    customers = customers.filter(c => c.id !== id);
    return { success: true };
  },

  updateStatus: async (id, status) => {
    await delay(400);
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    customers[idx] = { ...customers[idx], status };
    return customers[idx];
  },
};

export default customerService;
