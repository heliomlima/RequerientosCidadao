import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function LoginServidor() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    senha: '',
  });

  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      setLoading(true);

      const response = await api.post('/usuarios-servidor/login', {
        email: form.email,
        senha: form.senha,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate('/dashboard-servidor');
    } catch (error) {
      console.error('Erro no login do servidor:', error);
      setErro(
        error.response?.data?.message || 'Não foi possível realizar o login.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Login do Servidor
        </h1>
        <p className="text-slate-500 mb-8">
          Informe seu e-mail e senha para acessar o sistema.
        </p>

        {erro && (
          <div className="mb-4 rounded-xl bg-red-100 text-red-700 px-4 py-3">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-center">
          <Link
            to="/primeiro-acesso-servidor"
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            Primeiro acesso
          </Link>

          <Link
            to="/recuperacao-senha-servidor"
            className="text-slate-500 hover:text-slate-700"
          >
            Recuperação de senha
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginServidor;