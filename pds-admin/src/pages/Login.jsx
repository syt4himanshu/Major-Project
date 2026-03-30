import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard/ration-cards', { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (formData) => {
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      login(response.data.token);
      navigate('/dashboard/ration-cards', { replace: true });
    } catch (apiError) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <form
        className="bg-gray-900 rounded-2xl p-8 shadow-2xl w-full max-w-sm"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-white text-2xl font-semibold mb-6">Admin Login</h1>

        <label htmlFor="email" className="text-gray-300 text-sm mb-2 block">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email', { required: true })}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full mb-4"
          required
        />

        <label htmlFor="password" className="text-gray-300 text-sm mb-2 block">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password', { required: true })}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full"
          required
        />

        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 w-full font-medium disabled:opacity-70"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
