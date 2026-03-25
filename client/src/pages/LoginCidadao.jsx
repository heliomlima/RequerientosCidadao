import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function LoginCidadao() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!form.email || !form.senha) {
    setError('Preencha e-mail e senha.');
    return;
  }

  try {
    setLoading(true);
    setError('');

    const response = await api.post('/usuarios/login', {
      email: form.email,
      senha: form.senha,
    });

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    navigate('/dashboard-cidadao');
  } catch (err) {
    console.error('Erro no login:', err);
    setError(err.response?.data?.message || 'E-mail ou senha incorretos.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Acesso do Cidadão</h1>
          <p className="mt-2 text-slate-600">Entre com suas credenciais para continuar.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-sky-500 outline-none"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
              <input
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-sky-500 outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition disabled:opacity-70"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 text-center">
            <button 
              onClick={() => navigate('/cadastro-cidadao')}
              className="text-sky-600 hover:text-sky-700 font-medium text-sm"
            >
              Não tem conta? Cadastre-se aqui
            </button>
            <button 
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginCidadao;