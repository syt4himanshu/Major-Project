import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const parseEmailFromToken = (token) => {
  if (!token) return '';

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || '';
  } catch (error) {
    return '';
  }
};

const Dashboard = () => {
  const token = localStorage.getItem('pds_token');
  const userEmail = parseEmailFromToken(token);

  return (
    <div className="dashboard-layout">
      <Sidebar userEmail={userEmail} />

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
