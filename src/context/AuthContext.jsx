import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, ROLES } from '../constants';
import { storage } from '../utils';

const AuthContext = createContext(null);

const initialState = {
  user:          null,
  token:         storage.get(AUTH_TOKEN_KEY) || null,
  refreshToken:  storage.get(REFRESH_TOKEN_KEY) || null,
  isAuthenticated: false,
  isLoading:     true,
  error:         null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_INIT':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user:            action.payload.user,
        token:           action.payload.token,
        refreshToken:    action.payload.refreshToken || state.refreshToken,
        isAuthenticated: true,
        isLoading:       false,
        error:           null,
      };
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false, error: action.payload, isAuthenticated: false };
    case 'AUTH_LOGOUT':
      return { ...initialState, isLoading: false, token: null, refreshToken: null };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// ── Mock users for frontend-only demo ────────────────────────
const MOCK_USERS = [
  { id: '1', name: 'Arjun Sharma',  email: 'admin@nexabank.com',    role: ROLES.SUPER_ADMIN,    branch: 'HQ Mumbai',    avatar: null },
  { id: '2', name: 'Priya Patel',   email: 'manager@nexabank.com',  role: ROLES.BRANCH_MANAGER, branch: 'Pune Branch',  avatar: null },
  { id: '3', name: 'Rahul Verma',   email: 'employee@nexabank.com', role: ROLES.EMPLOYEE,       branch: 'Pune Branch',  avatar: null },
  { id: '4', name: 'Anita Desai',   email: 'auditor@nexabank.com',  role: ROLES.AUDITOR,        branch: 'HQ Mumbai',    avatar: null },
  { id: '5', name: 'Vikram Singh',  email: 'customer@nexabank.com', role: ROLES.CUSTOMER,       branch: 'Pune Branch',  avatar: null },
];

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = storage.get(AUTH_TOKEN_KEY);
    if (token) {
      // In production this would verify token with API
      // For demo, decode mock user from storage
      const user = storage.get('nexabank_user');
      if (user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token, refreshToken: storage.get(REFRESH_TOKEN_KEY) } });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_INIT' });
    try {
      await new Promise(r => setTimeout(r, 900)); // simulate API
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user || password !== 'password123') {
        throw new Error('Invalid email or password');
      }
      const token = `mock_jwt_${user.id}_${Date.now()}`;
      const refreshToken = `mock_refresh_${user.id}`;
      storage.set(AUTH_TOKEN_KEY, token);
      storage.set(REFRESH_TOKEN_KEY, refreshToken);
      storage.set('nexabank_user', user);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token, refreshToken } });
      return { success: true, user };
    } catch (err) {
      dispatch({ type: 'AUTH_FAILURE', payload: err.message });
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    storage.remove(AUTH_TOKEN_KEY);
    storage.remove(REFRESH_TOKEN_KEY);
    storage.remove('nexabank_user');
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const updateUser = useCallback((data) => {
    const updated = { ...state.user, ...data };
    storage.set('nexabank_user', updated);
    dispatch({ type: 'UPDATE_USER', payload: data });
  }, [state.user]);

  const hasRole = useCallback((roles) => {
    if (!state.user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(state.user.role);
  }, [state.user]);

  const isAdmin = state.user?.role === ROLES.SUPER_ADMIN;
  const isBranchManager = state.user?.role === ROLES.BRANCH_MANAGER;
  const isEmployee = state.user?.role === ROLES.EMPLOYEE;
  const isAuditor = state.user?.role === ROLES.AUDITOR;
  const isCustomer = state.user?.role === ROLES.CUSTOMER;

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      updateUser,
      hasRole,
      isAdmin,
      isBranchManager,
      isEmployee,
      isAuditor,
      isCustomer,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
