import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import HRPage from './pages/HRPage';
import AcademicsPage from './pages/AcademicsPage';
import FinancePage from './pages/FinancePage';
import CommunicationPage from './pages/CommunicationPage';
import MyAdminsPage from './pages/MyAdminsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout
import AdminLayout from './components/layout/AdminLayout';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  return <Navigate to={user.portal === 'accounts' ? '/finance' : '/dashboard'} replace />;
}

// Blocks accounts portal users from accessing non-finance pages
function MasterRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.portal === 'accounts') return <Navigate to="/finance" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<MasterRoute><DashboardPage /></MasterRoute>} />
        <Route path="students" element={<MasterRoute><StudentsPage /></MasterRoute>} />
        <Route path="teachers" element={<MasterRoute><TeachersPage /></MasterRoute>} />
        <Route path="hr" element={<MasterRoute><HRPage /></MasterRoute>} />
        <Route path="academics" element={<MasterRoute><AcademicsPage /></MasterRoute>} />
        <Route path="finance/*" element={<FinancePage />} />
        <Route path="communication" element={<MasterRoute><CommunicationPage /></MasterRoute>} />
        <Route path="my-admins" element={<MasterRoute><MyAdminsPage /></MasterRoute>} />
        <Route path="settings" element={<MasterRoute><SettingsPage /></MasterRoute>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
