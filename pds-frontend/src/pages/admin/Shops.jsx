import { Fragment, useEffect, useState } from 'react';
import api from '../../api/axios';

const Shops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedShopId, setExpandedShopId] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/api/admin/shops');
        setShops(response.data?.shops || response.data?.data || []);
      } catch (fetchError) {
        setError(fetchError.response?.data?.error || 'Failed to load shops');
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const toggleExpanded = (shopId) => {
    setExpandedShopId((prev) => (prev === shopId ? null : shopId));
  };

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Shops</h1>

      {error && (
        <div className="mb-4 bg-red-900/50 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Shop Name</th>
              <th className="px-4 py-3 text-left">Area</th>
              <th className="px-4 py-3 text-left">Shopkeeper</th>
              <th className="px-4 py-3 text-left">Mobile</th>
              <th className="px-4 py-3 text-left">Beneficiaries</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : shops.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              shops.map((shop) => {
                const isExpanded = expandedShopId === shop.id;

                return (
                  <Fragment key={shop.id}>
                    <tr
                      className="border-t border-gray-800 hover:bg-gray-800/50 transition cursor-pointer"
                      onClick={() => toggleExpanded(shop.id)}
                    >
                      <td className="px-4 py-3 text-gray-200">{shop.shop_code}</td>
                      <td className="px-4 py-3 text-gray-200">{shop.shop_name}</td>
                      <td className="px-4 py-3 text-gray-200">{shop.area_name}</td>
                      <td className="px-4 py-3 text-gray-200">
                        {shop.shopkeeper_name || <span className="text-gray-500">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {shop.shopkeeper_mobile || <span className="text-gray-500">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-200">{shop.beneficiary_count}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-gray-800">
                        <td colSpan="6" className="bg-gray-800 px-6 py-4 text-sm text-gray-300">
                          <div className="grid md:grid-cols-2 gap-2">
                            <p>
                              <span className="text-gray-400">Shop Code:</span> {shop.shop_code}
                            </p>
                            <p>
                              <span className="text-gray-400">Area:</span> {shop.area_name}
                            </p>
                            <p>
                              <span className="text-gray-400">Shopkeeper:</span>{' '}
                              {shop.shopkeeper_name || '—'}
                            </p>
                            <p>
                              <span className="text-gray-400">Mobile:</span>{' '}
                              {shop.shopkeeper_mobile || '—'}
                            </p>
                            <p>
                              <span className="text-gray-400">Beneficiaries:</span>{' '}
                              {shop.beneficiary_count}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Shops;
