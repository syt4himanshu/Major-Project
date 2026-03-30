import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const Areas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAreas = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/api/admin/areas');
        setAreas(response.data?.areas || []);
      } catch (fetchError) {
        setError(fetchError.response?.data?.error || 'Failed to load areas');
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAreas();
  }, []);

  const summary = useMemo(() => {
    return areas.reduce(
      (acc, area) => {
        acc.totalShops += Number(area.shop_count || 0);
        acc.totalBeneficiaries += Number(area.beneficiary_count || 0);
        return acc;
      },
      { totalShops: 0, totalBeneficiaries: 0 }
    );
  }, [areas]);

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Areas</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-3xl font-bold text-white">{areas.length}</p>
          <p className="text-sm text-gray-400 mt-1">Total Areas</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-3xl font-bold text-white">{summary.totalShops}</p>
          <p className="text-sm text-gray-400 mt-1">Total Shops</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-3xl font-bold text-white">{summary.totalBeneficiaries}</p>
          <p className="text-sm text-gray-400 mt-1">Total Beneficiaries</p>
        </div>
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
              <th className="px-4 py-3 text-left">Area Name</th>
              <th className="px-4 py-3 text-left">Total Shops</th>
              <th className="px-4 py-3 text-left">Shopkeepers</th>
              <th className="px-4 py-3 text-left">Total Beneficiaries</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-12 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : areas.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-12 text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              areas.map((area) => (
                <tr
                  key={area.id}
                  className="border-t border-gray-800 hover:bg-gray-800/50 transition"
                >
                  <td className="px-4 py-3 text-gray-200">{area.name}</td>
                  <td className="px-4 py-3 text-gray-200">{area.shop_count}</td>
                  <td className="px-4 py-3 text-gray-200">{area.shopkeeper_count}</td>
                  <td className="px-4 py-3 text-gray-200">{area.beneficiary_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Areas;
