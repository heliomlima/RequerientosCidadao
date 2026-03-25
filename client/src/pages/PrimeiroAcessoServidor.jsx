import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function PrimeiroAcessoServidor() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    cpf: '',
    senha: '',
    confirmarSenha: '',
  });

  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const formatarCPF = (valor) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);

    return numeros
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cpf') {
      setForm((prev) => ({
        ...prev,
        cpf: formatarCPF(value),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas digitadas são diferentes!');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/usuarios-servidor/primeiro-acesso', {
        email: form.email,
        cpf: form.cpf,
        senha: form.senha,
        confirmarSenha: form.confirmarSenha,
      });

      setMensagem(response.data.message || 'Primeiro acesso realizado com sucesso.');
      alert(response.data.message || 'Primeiro acesso realizado com sucesso.');
      navigate('/login-servidor');
    } catch (error) {
      console.error('Erro no primeiro acesso do servidor:', error);

      const mensagemErro =
        error.response?.data?.message ||
        'Não foi possível concluir o primeiro acesso.';

      if (error.response?.data?.redirectToLogin) {
        alert(mensagemErro);
        navigate('/login-servidor');
        return;
      }

      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Primeiro Acesso do Servidor
        </h1>
        <p className="text-slate-500 mb-8">
          Informe seus dados para ativar seu acesso.
        </p>

        {erro && (
          <div className="mb-4 rounded-xl bg-red-100 text-red-700 px-4 py-3">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-4 rounded-xl bg-green-100 text-green-700 px-4 py-3">
            {mensagem}
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
              CPF
            </label>
            <input
              type="text"
              name="cpf"
              value={form.cpf}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmar senha
            </label>
            <input
              type="password"
              name="confirmarSenha"
              value={form.confirmarSenha}
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
            {loading ? 'Confirmando...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PrimeiroAcessoServidor;