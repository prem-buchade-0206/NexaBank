import { MOCK_NOTIFICATIONS } from '../utils/mockData';
import { generateId } from '../utils';

let notifications = [...MOCK_NOTIFICATIONS];
const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

const notificationService = {
  getAll: async () => {
    await delay(300);
    return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  getUnreadCount: async () => {
    await delay(200);
    return notifications.filter(n => !n.read).length;
  },

  markRead: async (id) => {
    await delay(200);
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) notifications[idx] = { ...notifications[idx], read: true };
    return notifications[idx];
  },

  markAllRead: async () => {
    await delay(300);
    notifications = notifications.map(n => ({ ...n, read: true }));
    return { success: true };
  },

  add: async (notification) => {
    const newN = {
      id: generateId(),
      ...notification,
      read: false,
      timestamp: new Date().toISOString(),
    };
    notifications.unshift(newN);
    return newN;
  },

  delete: async (id) => {
    await delay(200);
    notifications = notifications.filter(n => n.id !== id);
    return { success: true };
  },
};

export default notificationService;
