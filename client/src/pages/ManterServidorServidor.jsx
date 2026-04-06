import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, UserPlus } from 'lucide-react';

function formatarCpfDigitando(valor) {
  const d = String(valor || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  }
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function ManterServidorServidor() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [nome, setNome] = useState('');
  const [ativo, setAtivo] = useState('SIM');
  const [idUnidadeGestora, setIdUnidadeGestora] = useState('');
  const [unidades, setUnidades] = useState([]);
  const [loadingUg, setLoadingUg] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const { data } = await api.get('/requerimentos-servidor/unidades-gestora');
        if (!c) setUnidades(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erro ao carregar UGs:', err);
        if (!c) {
          alert(
            err.response?.data?.message ||
              'Não foi possível carregar as unidades gestoras.'
          );
        }
      } finally {
        if (!c) setLoadingUg(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const handleCancelar = () => {
    navigate('/dashboard-servidor');
  };

  const handleInserir = async (e) => {
    e.preventDefault();
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      alert('Informe um CPF válido (11 dígitos).');
      return;
    }
    if (!idUnidadeGestora) {
      alert('Selecione a unidade gestora.');
      return;
    }

    try {
      setSalvando(true);
      const { data } = await api.post(
        '/requerimentos-servidor/admin/servidor/inserir',
        {
          email: email.trim(),
          nome: nome.trim(),
          cpf: cpfLimpo,
          ativo,
          idUnidadeGestora,
        }
      );
      if (data?.success) {
        alert(data.message || 'Servidor inserido com sucesso!');
        setEmail('');
        setCpf('');
        setNome('');
        setAtivo('SIM');
        setIdUnidadeGestora('');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Não foi possível inserir o servidor.';
      alert(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCancelar}
          className="px-5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <UserPlus size={22} className="text-sky-600" />
          Manter servidor
        </h2>
        <p className="text-slate-500 mt-2">
          Cadastre um novo servidor na base. O acesso ao sistema será liberado
          após o primeiro acesso com e-mail e senha.
        </p>
      </div>

      <form
        onSubmit={handleInserir}
        className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5"
      >
        <div>
          <label
            htmlFor="mt-email"
            className="block text-sm font-semibold text-slate-700 mb-1"
          >
            E-mail
          </label>
          <input
            id="mt-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            placeholder="nome@orgao.gov.br"
          />
        </div>

        <div>
          <label
            htmlFor="mt-cpf"
            className="block text-sm font-semibold text-slate-700 mb-1"
          >
            CPF
          </label>
          <input
            id="mt-cpf"
            type="text"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(formatarCpfDigitando(e.target.value))}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label
            htmlFor="mt-nome"
            className="block text-sm font-semibold text-slate-700 mb-1"
          >
            Nome
          </label>
          <input
            id="mt-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            placeholder="Nome completo"
          />
        </div>

        <div>
          <span className="block text-sm font-semibold text-slate-700 mb-2">
            Ativo
          </span>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ativo-servidor"
                checked={ativo === 'SIM'}
                onChange={() => setAtivo('SIM')}
                className="text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-800">SIM</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="ativo-servidor"
                checked={ativo === 'NÃO'}
                onChange={() => setAtivo('NÃO')}
                className="text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-800">NÃO</span>
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="mt-ug"
            className="block text-sm font-semibold text-slate-700 mb-1"
          >
            Unidade gestora
          </label>
          <select
            id="mt-ug"
            value={idUnidadeGestora}
            onChange={(e) => setIdUnidadeGestora(e.target.value)}
            required
            disabled={loadingUg}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white disabled:opacity-60"
          >
            <option value="">
              {loadingUg ? 'Carregando…' : 'Selecione a unidade gestora'}
            </option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome || u.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={salvando}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || loadingUg}
            className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 transition disabled:opacity-60 inline-flex items-center gap-2"
          >
            <UserPlus size={18} />
            {salvando ? 'Inserindo…' : 'Inserir servidor'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ManterServidorServidor;
