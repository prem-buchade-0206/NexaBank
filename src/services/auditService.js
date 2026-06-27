import { MOCK_AUDIT_LOGS } from '../utils/mockData';
import { generateId } from '../utils';

let logs = [...MOCK_AUDIT_LOGS];
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

const auditService = {
  getAll: async (params = {}) => {
    await delay(400);
    let data = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const { search, action, module, user, page = 1, limit = 10 } = params;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(l =>
        l.user.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.ip.includes(q)
      );
    }
    if (action) data = data.filter(l => l.action === action);
    if (module) data = data.filter(l => l.module === module);
    if (user)   data = data.filter(l => l.user === user);
    const total = data.length;
    const start = (page - 1) * limit;
    return { data: data.slice(start, start + limit), total, page, limit };
  },

  log: async (entry) => {
    const newLog = {
      id: generateId(),
      ...entry,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    return newLog;
  },
};

export default auditService;
