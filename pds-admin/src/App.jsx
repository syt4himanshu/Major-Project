import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RationCards from './pages/RationCards';
import AddRationCard from './pages/AddRationCard';
import Beneficiaries from './pages/Beneficiaries';
import Users from './pages/Users';
import Areas from './pages/Areas';
import Shops from './pages/Shops';
import Entitlements from './pages/Entitlements';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="ration-cards" replace />} />
          <Route path="ration-cards" element={<RationCards />} />
          <Route path="ration-cards/new" element={<AddRationCard />} />
          <Route path="beneficiaries" element={<Beneficiaries />} />
          <Route path="users" element={<Users />} />
          <Route path="areas" element={<Areas />} />
          <Route path="shops" element={<Shops />} />
          <Route path="entitlements" element={<Entitlements />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard/ration-cards" replace />} />
    </Routes>
  );
};

export default App;
