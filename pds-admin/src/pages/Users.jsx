import { useEffect, useState } from 'react';
import api from '../api/axios';
import AddShopkeeperModal from '../components/AddShopkeeperModal';

const getRoleBadgeClass = (role) => {
  if (role === 'admin') return 'bg-purple-900 text-purple-300';
  if (role === 'shopkeeper') return 'bg-green-900 text-green-300';
  return 'bg-gray-700 text-gray-300';
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data?.users || []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.error || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition"
        >
          + Add Shopkeeper
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-900/50 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Mobile</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-gray-800 hover:bg-gray-800/50 transition"
                >
                  <td className="px-4 py-3 text-gray-200">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-200">{user.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-200">{user.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-200">{user.mobile || '—'}</td>
                  <td className="px-4 py-3 text-gray-200">
                    <span className="inline-flex items-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1 ${
                          user.is_active ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddShopkeeperModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default Users;
