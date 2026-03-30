import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-lg font-semibold">PDS Admin</h1>
      </div>

      <nav className="p-4 flex flex-col gap-2 text-sm font-medium">
        <NavLink
          to="/dashboard/ration-cards"
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
          }
        >
          Ration Cards
        </NavLink>
        <NavLink
          to="/dashboard/beneficiaries"
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
          }
        >
          Beneficiaries
        </NavLink>
        <NavLink
          to="/dashboard/users"
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
          }
        >
          Users
        </NavLink>
        <NavLink
          to="/dashboard/areas"
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
          }
        >
          Areas
        </NavLink>
        <NavLink
          to="/dashboard/shops"
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
          }
        >
          Shops
        </NavLink>
        <NavLink
          to="/dashboard/entitlements"
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
          }
        >
          ⚡ Entitlements
        </NavLink>
      </nav>

      <div className="mt-auto p-4 border-t border-gray-800">
        <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@pds.gov'}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
