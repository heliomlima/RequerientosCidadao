import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AlterarCadastroCidadao = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    email: '',
    endereco: '',
    bairro: '',
    cep: '',
    pontoReferencia: '',
  });

  const [foto, setFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarCadastro();
  }, []);

  const carregarCadastro = async () => {
    try {
      const response = await api.get('/usuarios/meu-cadastro');
      const dados = response.data.data;

      setForm({
        nome: dados.nome || '',
        email: dados.email || '',
        endereco: dados.endereco || '',
        bairro: dados.bairro || '',
        cep: dados.cep || '',
        pontoReferencia: dados.pontoReferencia || '',
      });

      setPreviewFoto(dados.fotoUrl || '');
    } catch (error) {
      console.error('Erro ao carregar cadastro:', error);
      setErro('Não foi possível carregar os dados do cadastro.');
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleFotoChange = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    setFoto(arquivo);
    setPreviewFoto(URL.createObjectURL(arquivo));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    setErro('');
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append('nome', form.nome);
      formData.append('email', form.email);
      formData.append('endereco', form.endereco);
      formData.append('bairro', form.bairro);
      formData.append('cep', form.cep);
      formData.append('pontoReferencia', form.pontoReferencia);

      if (foto) {
        formData.append('foto', foto);
      }

      const response = await api.put('/usuarios/meu-cadastro', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const usuarioAtualizado = response.data.data;

      localStorage.setItem('user', JSON.stringify(usuarioAtualizado));

      setPreviewFoto(usuarioAtualizado.fotoUrl || '');

      alert('Cadastro atualizado com sucesso.');
      navigate('/dashboard-cidadao');
    } catch (error) {
      console.error('Erro ao atualizar cadastro:', error);
      setErro(
        error.response?.data?.message ||
          'Não foi possível atualizar o cadastro.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Alterar Cadastro
        </h1>
        <p className="text-slate-500 mb-8">
          Atualize seus dados pessoais e sua foto de perfil.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <img
              src={previewFoto || 'https://via.placeholder.com/120'}
              alt="Foto do usuário"
              className="w-28 h-28 rounded-full object-cover border-4 border-sky-100"
            />

            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="block w-full max-w-sm text-sm text-slate-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

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
              <p className="text-xs text-slate-500 mt-1">
                O e-mail pode ser alterado, mas ele também é usado no login.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bairro
              </label>
              <input
                type="text"
                name="bairro"
                value={form.bairro}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                name="cep"
                value={form.cep}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ponto de referência
              </label>
              <input
                type="text"
                name="pontoReferencia"
                value={form.pontoReferencia}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
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
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlterarCadastroCidadao;