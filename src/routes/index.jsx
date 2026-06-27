import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout      from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import LoginPage        from '../pages/auth/LoginPage';
import DashboardPage    from '../pages/dashboard/DashboardPage';
import CustomersPage    from '../pages/customers/CustomersPage';
import AccountsPage     from '../pages/accounts/AccountsPage';
import TransactionsPage from '../pages/transactions/TransactionsPage';
import StatementsPage   from '../pages/statements/StatementsPage';
import LoansPage        from '../pages/loans/LoansPage';
import ReportsPage      from '../pages/reports/ReportsPage';
import AuditLogsPage    from '../pages/audit-logs/AuditLogsPage';
import SettingsPage     from '../pages/settings/SettingsPage';

const AppRoutes = () => (
  <Routes>
    {/* Auth */}
    <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />

    {/* App */}
    <Route path="/dashboard"    element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
    <Route path="/customers"    element={<DashboardLayout><CustomersPage /></DashboardLayout>} />
    <Route path="/accounts"     element={<DashboardLayout><AccountsPage /></DashboardLayout>} />
    <Route path="/transactions" element={<DashboardLayout><TransactionsPage /></DashboardLayout>} />
    <Route path="/statements"   element={<DashboardLayout><StatementsPage /></DashboardLayout>} />
    <Route path="/loans"        element={<DashboardLayout><LoansPage /></DashboardLayout>} />
    <Route path="/reports"      element={<DashboardLayout><ReportsPage /></DashboardLayout>} />
    <Route path="/audit-logs"   element={<DashboardLayout><AuditLogsPage /></DashboardLayout>} />
    <Route path="/settings"     element={<DashboardLayout><SettingsPage /></DashboardLayout>} />

    {/* Redirect */}
    <Route path="/"  element={<Navigate to="/dashboard" replace />} />
    <Route path="*"  element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
