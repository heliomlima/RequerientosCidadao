import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const categorias = [
  'Administração',
  'Cultura e Lazer',
  'Educação',
  'Esportes',
  'Infraestrutura',  
  'Limpeza',
  'Segurança',
  'Saúde e Bem-estar',  
  'Turismo',
  'Outros',
];

/** Bairros de Manaus */
const bairros = [
  'Adrianópolis',
  'Aleixo',
  'Alvorada',
  'Armando Mendes',
  'Betânia',
  'Cachoeirinha',
  'Centro',
  'Chapada',
  'Cidade de Deus',
  'Cidade Nova',
  'Colônia Antônio Aleixo',
  'Colônia Japonesa',
  'Colônia Oliveira Machado',
  'Colônia Santo Antônio',
  'Colônia Terra Nova Norte',
  'Compensa',
  'Coroado',
  'Crespo',
  'Da Paz',
  'Distrito Industrial I',
  'Distrito Industrial II',
  'Dom Pedro',
  'Educandos',
  'Flores',
  'Gilberto Mestrinho',
  'Glória',
  'Japiim',
  'Jorge Teixeira',
  'Lago Azul',
  'Lírio do Vale',
  'Mauazinho',
  'Monte das Oliveiras',
  'Morro da Liberdade',
  'Nossa Senhora Aparecida',
  'Nossa Senhora das Graças',
  'Nova Cidade',
  'Nova Esperança',
  'Novo Aleixo',
  'Novo Israel',
  'Parque 10 de Novembro',
  'Petrópolis',
  'Planalto',
  'Ponta Negra',
  'Praça 14 de Janeiro',
  'Presidente Vargas',
  'Puraquequara',
  'Raiz',
  'Redenção',
  'Santa Etelvina',
  'Santa Luzia',
  'Santo Agostinho',
  'Santo Antônio',
  'São Francisco',
  'São Geraldo',
  'São Jorge',
  'São José Operário',
  'São Lázaro',
  'São Raimundo Oeste',
  'Tancredo Neves',
  'Tarumã',
  'Tarumã-Açu',
  'Vila Buriti',
  'Vila da Prata',
  'Zumbi dos Palmares',
  'Zona Rural',
];

const estadoInicial = {
  categoria: '',
  descricao: '',
  endereco: '',
  bairro: '',
  fotos: [],
  documentos: [],
  idUGResponsavel: '',
};

function NovoRequerimento() {
  const navigate = useNavigate();

  const [form, setForm] = useState(estadoInicial);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [unidadesGestorasOpcoes, setUnidadesGestorasOpcoes] = useState([]);
  const [carregandoUnidades, setCarregandoUnidades] = useState(true);
  const [erroUnidades, setErroUnidades] = useState('');

  useEffect(() => {
    let cancelado = false;

    const carregarUgs = async () => {
      setCarregandoUnidades(true);
      setErroUnidades('');
      try {
        const { data } = await api.get('/requerimentos/unidades-gestora');
        if (cancelado) return;
        const lista = Array.isArray(data) ? data : [];
        setUnidadesGestorasOpcoes(
          lista.filter((u) => u && typeof u.id === 'string' && u.id.trim())
        );
      } catch (err) {
        if (!cancelado) {
          console.error('Erro ao carregar unidades gestoras:', err);
          setErroUnidades(
            err.response?.data?.message ||
              'Não foi possível carregar as unidades gestoras.'
          );
          setUnidadesGestorasOpcoes([]);
        }
      } finally {
        if (!cancelado) setCarregandoUnidades(false);
      }
    };

    carregarUgs();
    return () => {
      cancelado = true;
    };
  }, []);

  const temConteudo = useMemo(() => {
    return (
      form.categoria.trim() !== '' ||
      form.descricao.trim() !== '' ||
      form.endereco.trim() !== '' ||
      form.bairro.trim() !== '' ||
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

    if (!form.bairro.trim()) {
      setErro('Selecione o bairro.');
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
      formData.append('bairro', form.bairro);
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
                Bairro *
              </label>
              <select
                name="bairro"
                value={form.bairro}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecione</option>
                {bairros.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
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
                disabled={carregandoUnidades || !!erroUnidades}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">
                  {carregandoUnidades
                    ? 'Carregando unidades gestoras…'
                    : 'Selecione (opcional)'}
                </option>
                {unidadesGestorasOpcoes.map((ug) => (
                  <option key={ug.id} value={ug.id}>
                    {ug.nome}
                  </option>
                ))}
              </select>
              {erroUnidades && (
                <p className="mt-2 text-sm text-red-600">{erroUnidades}</p>
              )}
              <p className="mt-2 text-sm text-slate-500">
                Lista da coleção unidade gestora (campo nome). Se não selecionar,
                o requerimento fica como <strong>Registrado</strong> para
                distribuição pelo gestor.
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