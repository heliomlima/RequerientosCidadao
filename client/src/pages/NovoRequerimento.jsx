import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const categorias = [
  'Limpeza',
  'Infraestrutura',
  'Saúde',
  'Educação',
  'Outros',
];

const unidadesGestoras = [
  'Secretaria de Finanças',
  'Secretaria de Educação',
  'Secretaria de Infraestrutura',
  'Secretaria de Saúde',
  'Secretaria de Limpeza e Saneamento',
  'Outras',
];

const estadoInicial = {
  categoria: '',
  descricao: '',
  endereco: '',
  fotos: [],
  documentos: [],
  idUGResponsavel: '',
};

function NovoRequerimento() {
  const navigate = useNavigate();

  const [form, setForm] = useState(estadoInicial);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const temConteudo = useMemo(() => {
    return (
      form.categoria.trim() !== '' ||
      form.descricao.trim() !== '' ||
      form.endereco.trim() !== '' ||
      form.idUGResponsavel.trim() !== '' ||
      form.fotos.length > 0 ||
      form.documentos.length > 0
    );
  }, [form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErro('');
  };

  const handleFotosChange = (e) => {
    const arquivos = Array.from(e.target.files || []);

    const arquivosInvalidos = arquivos.filter(
      (file) => !file.type.startsWith('image/')
    );

    if (arquivosInvalidos.length > 0) {
      setErro('No campo Fotos, selecione apenas arquivos de imagem.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      fotos: arquivos,
    }));
    setErro('');
  };

  const handleDocumentosChange = (e) => {
    const arquivos = Array.from(e.target.files || []);

    const arquivosInvalidos = arquivos.filter(
      (file) => file.type !== 'application/pdf'
    );

    if (arquivosInvalidos.length > 0) {
      setErro('No campo Documentos, selecione apenas arquivos PDF.');
      return;
    }

    setForm((prev) => ({
      ...prev,
      documentos: arquivos,
    }));
    setErro('');
  };

  const validarFormulario = () => {
    if (!form.categoria.trim()) {
      setErro('Selecione a categoria do requerimento.');
      return false;
    }

    if (!form.descricao.trim()) {
      setErro('Preencha a descrição do requerimento.');
      return false;
    }

    const possuiEndereco = form.endereco.trim() !== '';
    const possuiFotos = form.fotos.length > 0;
    const possuiDocumentos = form.documentos.length > 0;

    if (!possuiEndereco && !possuiFotos && !possuiDocumentos) {
      setErro(
        'Informe pelo menos um meio de localização ou evidência: endereço, fotos ou documentos.'
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    const confirmar = window.confirm(
      'Deseja realmente enviar o requerimento?'
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      setErro('');

      const formData = new FormData();
      formData.append('categoria', form.categoria);
      formData.append('descricao', form.descricao);
      formData.append('endereco', form.endereco);
      formData.append('idUGResponsavel', form.idUGResponsavel);

      form.fotos.forEach((arquivo) => {
        formData.append('fotos', arquivo);
      });

      form.documentos.forEach((arquivo) => {
        formData.append('documentos', arquivo);
      });

      await api.post('/requerimentos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Requerimento registrado com sucesso.');
      navigate('/dashboard-cidadao');
    } catch (err) {
        console.error('Erro ao enviar requerimento:', err);
        console.error('Resposta do backend:', err.response?.data);

        const mensagem =
            err.response?.data?.message ||
            err.response?.data?.error ||
            'Não foi possível registrar o requerimento. Tente novamente.';

            setErro(mensagem);
            alert(mensagem);
    } finally {
    setLoading(false);
    }
  };

  const handleCancelar = () => {
    if (temConteudo) {
      const confirmar = window.confirm(
        'Deseja cancelar e perder as informações já digitadas?'
      );

      if (!confirmar) return;
    }

    navigate('/dashboard-cidadao');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              Novo Requerimento
            </h1>
            <p className="text-slate-500 mt-2">
              Preencha os dados abaixo para registrar uma nova solicitação.
            </p>
          </div>

          {erro && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Categoria *
              </label>
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecione</option>
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Descrição *
              </label>
              <textarea
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                rows={5}
                placeholder="Descreva detalhadamente a ocorrência ou solicitação."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                placeholder="Informe o local da ocorrência"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="mt-2 text-sm text-slate-500">
                O endereço pode ser omitido se você anexar fotos ou documentos.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fotos
              </label>
              <input
                type="file"
                name="fotos"
                multiple
                accept="image/*"
                onChange={handleFotosChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:text-sky-700 hover:file:bg-sky-200"
              />
              {form.fotos.length > 0 && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Fotos selecionadas:
                  </p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {form.fotos.map((arquivo, index) => (
                      <li key={`${arquivo.name}-${index}`}>{arquivo.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Documentos
              </label>
              <input
                type="file"
                name="documentos"
                multiple
                accept="application/pdf"
                onChange={handleDocumentosChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-slate-700 hover:file:bg-slate-300"
              />
              {form.documentos.length > 0 && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Documentos selecionados:
                  </p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {form.documentos.map((arquivo, index) => (
                      <li key={`${arquivo.name}-${index}`}>{arquivo.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Unidade Gestora responsável
              </label>
              <select
                name="idUGResponsavel"
                value={form.idUGResponsavel}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecione</option>
                {unidadesGestoras.map((ug) => (
                  <option key={ug} value={ug}>
                    {ug}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-slate-500">
                Se não informar uma UG, o requerimento será registrado como
                Registrado.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-2xl bg-sky-600 text-white font-semibold py-3 hover:bg-sky-700 transition disabled:opacity-70"
              >
                {loading ? 'Enviando...' : 'Enviar requerimento'}
              </button>

              <button
                type="button"
                onClick={handleCancelar}
                className="flex-1 rounded-2xl bg-white border border-slate-300 text-slate-700 font-semibold py-3 hover:bg-slate-50 transition"
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

export default NovoRequerimento;