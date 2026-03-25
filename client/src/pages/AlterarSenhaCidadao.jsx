import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AlterarSenhaCidadao = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });

  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
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
    setMensagem('');

    if (form.novaSenha !== form.confirmarNovaSenha) {
      setErro('A nova senha e a repetição da nova senha não coincidem.');
      return;
    }

    if (form.novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);

      await api.put('/usuarios/alterar-senha', {
        senhaAtual: form.senhaAtual,
        novaSenha: form.novaSenha,
        confirmarNovaSenha: form.confirmarNovaSenha,
      });

      alert('Senha alterada com sucesso.');
      navigate('/dashboard-cidadao');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);

      if (error.response?.status === 401) {
        setErro(error.response?.data?.message || 'A senha atual está incorreta.');
        return;
      }

      setErro(
        error.response?.data?.message ||
          'Não foi possível alterar a senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Alterar Senha
        </h1>
        <p className="text-slate-500 mb-8">
          Informe sua senha atual e defina uma nova senha.
        </p>

        {mensagem && (
          <div className="mb-4 rounded-xl bg-green-100 text-green-700 px-4 py-3">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="mb-4 rounded-xl bg-red-100 text-red-700 px-4 py-3">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha atual
            </label>
            <input
              type="password"
              name="senhaAtual"
              value={form.senhaAtual}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nova senha
            </label>
            <input
              type="password"
              name="novaSenha"
              value={form.novaSenha}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Use pelo menos 8 caracteres.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Repetir nova senha
            </label>
            <input
              type="password"
              name="confirmarNovaSenha"
              value={form.confirmarNovaSenha}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard-cidadao')}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-70"
            >
              {loading ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlterarSenhaCidadao;