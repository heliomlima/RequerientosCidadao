import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CadastroCidadao() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    endereco: '',
    bairro: '',
    cep: '',
    pontoReferencia: '',
    email: '',
    foto: null,
    senha: '',
    confirmarSenha: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const hasFilledFields = useMemo(() => {
    return (
      form.nome ||
      form.cpf ||
      form.endereco ||
      form.bairro ||
      form.cep ||
      form.pontoReferencia ||
      form.email ||
      form.foto ||
      form.senha ||
      form.confirmarSenha
    );
  }, [form]);

  const onlyNumbers = (value) => value.replace(/\D/g, '');

  const formatCpf = (value) => {
    const numbers = onlyNumbers(value).slice(0, 11);
    return numbers
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  };

  const formatCep = (value) => {
    const numbers = onlyNumbers(value).slice(0, 8);
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.nome.trim()) newErrors.nome = 'Informe o nome.';
    if (!onlyNumbers(form.cpf) || onlyNumbers(form.cpf).length !== 11) {
      newErrors.cpf = 'Informe um CPF válido com 11 dígitos.';
    }
    if (!form.endereco.trim()) newErrors.endereco = 'Informe o endereço.';
    if (!form.bairro.trim()) newErrors.bairro = 'Informe o bairro.';
    if (!onlyNumbers(form.cep) || onlyNumbers(form.cep).length !== 8) {
      newErrors.cep = 'Informe um CEP válido com 8 dígitos.';
    }
    if (!form.pontoReferencia.trim()) {
      newErrors.pontoReferencia = 'Informe um ponto de referência.';
    }
    if (!form.email.trim()) {
      newErrors.email = 'Informe o e-mail.';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Informe um e-mail válido.';
    }

    if (!form.senha) {
      newErrors.senha = 'Informe a senha.';
    } else if (form.senha.length < 6) {
      newErrors.senha = 'A senha deve ter pelo menos 6 caracteres.';
    }

    if (!form.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirme a senha.';
    } else if (form.senha !== form.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    let newValue = value;

    if (field === 'cpf') newValue = formatCpf(value);
    if (field === 'cep') newValue = formatCep(value);

    setForm((prev) => ({
      ...prev,
      [field]: newValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: '',
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      foto: file,
    }));

    setErrors((prev) => ({
      ...prev,
      foto: '',
    }));
  };

  const handleCancel = () => {
    if (hasFilledFields) {
      const confirmCancel = window.confirm(
        'Deseja realmente cancelar o cadastro no sistema?'
      );

      if (!confirmCancel) return;
    }

    navigate('/');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('nome', form.nome.trim());
      formData.append('cpf', onlyNumbers(form.cpf));
      formData.append('endereco', form.endereco.trim());
      formData.append('bairro', form.bairro.trim());
      formData.append('cep', onlyNumbers(form.cep));
      formData.append('pontoReferencia', form.pontoReferencia.trim());
      formData.append('email', form.email.trim().toLowerCase());
      formData.append('senha', form.senha);

      if (form.foto) {
        formData.append('foto', form.foto);
      }

      await api.post('/usuarios', formData);

      alert('Cadastro realizado com sucesso.');
      navigate('/login-cidadao');
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Não foi possível realizar o cadastro.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Cadastro do Cidadão
          </h1>
          <p className="mt-3 text-slate-600 text-base md:text-lg">
            Preencha seus dados para criar o acesso ao sistema.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Digite seu nome completo"
              />
              {errors.nome && <p className="mt-2 text-sm text-red-600">{errors.nome}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="000.000.000-00"
                />
                {errors.cpf && <p className="mt-2 text-sm text-red-600">{errors.cpf}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  CEP *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cep}
                  onChange={(e) => handleChange('cep', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="00000-000"
                />
                {errors.cep && <p className="mt-2 text-sm text-red-600">{errors.cep}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Endereço *
              </label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Rua, número, complemento"
              />
              {errors.endereco && <p className="mt-2 text-sm text-red-600">{errors.endereco}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={form.bairro}
                  onChange={(e) => handleChange('bairro', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Digite o bairro"
                />
                {errors.bairro && <p className="mt-2 text-sm text-red-600">{errors.bairro}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ponto de Referência *
                </label>
                <input
                  type="text"
                  value={form.pontoReferencia}
                  onChange={(e) => handleChange('pontoReferencia', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ex.: Próximo à escola"
                />
                {errors.pontoReferencia && (
                  <p className="mt-2 text-sm text-red-600">{errors.pontoReferencia}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                E-mail *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="nome@exemplo.com"
              />
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Foto
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => handleChange('senha', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Digite sua senha"
                />
                {errors.senha && <p className="mt-2 text-sm text-red-600">{errors.senha}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirmação de senha *
                </label>
                <input
                  type="password"
                  value={form.confirmarSenha}
                  onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Digite novamente a senha"
                />
                {errors.confirmarSenha && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmarSenha}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition disabled:opacity-70"
              >
                {loading ? 'Salvando...' : 'Criar cadastro'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CadastroCidadao;