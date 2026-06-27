import { createContext, useContext, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const { isDark } = useTheme();

  const toastStyle = {
    background: isDark ? '#0f1929' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    padding: '12px 16px',
  };

  const success = useCallback((message, opts = {}) =>
    toast.success(message, { style: toastStyle, duration: 3000, ...opts }), [toastStyle]);

  const error = useCallback((message, opts = {}) =>
    toast.error(message, { style: toastStyle, duration: 4000, ...opts }), [toastStyle]);

  const warning = useCallback((message, opts = {}) =>
    toast(message, {
      style: { ...toastStyle, borderLeft: '4px solid #d97706' },
      icon: '⚠️',
      duration: 3500,
      ...opts
    }), [toastStyle]);

  const info = useCallback((message, opts = {}) =>
    toast(message, {
      style: { ...toastStyle, borderLeft: '4px solid #1a56db' },
      icon: 'ℹ️',
      duration: 3000,
      ...opts
    }), [toastStyle]);

  const loading = useCallback((message, opts = {}) =>
    toast.loading(message, { style: toastStyle, ...opts }), [toastStyle]);

  const dismiss = useCallback((id) => toast.dismiss(id), []);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, loading, dismiss }}>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        toastOptions={{ duration: 3000 }}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastContext;
