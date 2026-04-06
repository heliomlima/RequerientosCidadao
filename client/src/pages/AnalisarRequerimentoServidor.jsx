import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Calendar,
  MapPin,
  MessageSquare,
  Paperclip,
  PlayCircle,
  ArrowLeft,
  Send,
  X,
} from 'lucide-react';

const formatarData = (valor) => {
  if (!valor) return '-';

  if (valor._seconds) {
    return new Date(valor._seconds * 1000).toLocaleString('pt-BR');
  }

  if (valor.seconds) {
    return new Date(valor.seconds * 1000).toLocaleString('pt-BR');
  }

  const data = new Date(valor);
  if (!isNaN(data.getTime())) {
    return data.toLocaleString('pt-BR');
  }

  return '-';
};

const formatarDataCurta = (valor) => {
  if (!valor) return '-';

  if (valor._seconds) {
    return new Date(valor._seconds * 1000).toLocaleDateString('pt-BR');
  }

  if (valor.seconds) {
    return new Date(valor.seconds * 1000).toLocaleDateString('pt-BR');
  }

  const data = new Date(valor);
  if (!isNaN(data.getTime())) {
    return data.toLocaleDateString('pt-BR');
  }

  return '-';
};

const getFotoPrincipal = (req) => {
  if (req?.fotos?.length > 0 && req.fotos[0]?.url) {
    return req.fotos[0].url;
  }
  return 'https://via.placeholder.com/300x200?text=Sem+imagem';
};

const getStatusLabel = (status) => status || 'Não informado';

const getStatusStyle = (status) => {
  const chave = (status || '').toLowerCase();

  const styles = {
    registrado: 'bg-slate-100 text-slate-700',
    direcionado: 'bg-blue-100 text-blue-700',
    distribuído: 'bg-indigo-100 text-indigo-700',
    delegado: 'bg-violet-100 text-violet-800',
    'delegado para análise': 'bg-violet-100 text-violet-700',
    'em análise': 'bg-amber-100 text-amber-700',
    'em execução': 'bg-orange-100 text-orange-700',
    concluído: 'bg-green-100 text-green-700',
    respondido: 'bg-cyan-100 text-cyan-700',
    avaliado: 'bg-emerald-100 text-emerald-700',
  };

  return styles[chave] || 'bg-gray-100 text-gray-600';
};

function AnalisarRequerimentoServidor() {
  const navigate = useNavigate();
  const servidorIdLogado =
    (typeof window !== 'undefined' &&
      JSON.parse(localStorage.getItem('user') || '{}').servidorId) ||
    '';

  const [requerimentos, setRequerimentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReqIds, setSelectedReqIds] = useState([]);

  const [detalhe, setDetalhe] = useState(null);
  const [abrindoId, setAbrindoId] = useState(null);

  const [modalDelegarOpen, setModalDelegarOpen] = useState(false);
  const [analistas, setAnalistas] = useState([]);
  const [selectedAnalistaId, setSelectedAnalistaId] = useState('');
  const [confirmandoDelegar, setConfirmandoDelegar] = useState(false);

  const [modalPlanejarOpen, setModalPlanejarOpen] = useState(false);
  const [dataConclusaoPrevista, setDataConclusaoPrevista] = useState('');
  const [confirmandoPlanejar, setConfirmandoPlanejar] = useState(false);

  const idsParaDelegar = useMemo(() => {
    if (selectedReqIds.length > 0) return selectedReqIds;
    if (detalhe?.id) return [detalhe.id];
    return [];
  }, [selectedReqIds, detalhe]);

  const closeAllModals = useCallback(() => {
    setModalDelegarOpen(false);
    setModalPlanejarOpen(false);
    setDetalhe(null);
    setSelectedAnalistaId('');
    setDataConclusaoPrevista('');
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requerimentos-servidor/analista/para-analise');
      setRequerimentos(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar requerimentos para análise:', err);
      alert(
        err.response?.data?.message ||
          'Erro ao carregar requerimentos.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const abrirAnalise = async (reqId, e) => {
    e?.stopPropagation?.();
    setAbrindoId(reqId);
    try {
      const { data } = await api.post(
        `/requerimentos-servidor/analista/requerimento/${reqId}/abrir-analise`
      );
      setDetalhe(data);
    } catch (err) {
      console.error('Erro ao abrir análise:', err);
      alert(
        err.response?.data?.message ||
          'Não foi possível abrir a análise do requerimento.'
      );
    } finally {
      setAbrindoId(null);
    }
  };

  const abrirModalDelegar = async () => {
    try {
      const { data } = await api.get('/requerimentos-servidor/analistas-ug');
      const lista = (data || []).filter(
        (a) => !servidorIdLogado || a.id !== servidorIdLogado
      );
      setAnalistas(lista);
    } catch (err) {
      console.error('Erro ao listar analistas:', err);
      alert(
        err.response?.data?.message ||
          'Não foi possível carregar a lista de analistas.'
      );
      return;
    }
    setSelectedAnalistaId('');
    setModalDelegarOpen(true);
  };

  const confirmarDelegacao = async () => {
    if (idsParaDelegar.length === 0) {
      alert('Nenhum requerimento selecionado para delegar.');
      return;
    }
    if (!selectedAnalistaId) {
      alert('Selecione um analista.');
      return;
    }

    try {
      setConfirmandoDelegar(true);
      await api.post('/requerimentos-servidor/analista/delegar-requerimentos', {
        idRequerimentos: idsParaDelegar,
        idAnalista: selectedAnalistaId,
      });
      closeAllModals();
      setSelectedReqIds([]);
      await load();
      alert('Delegação realizada com sucesso.');
    } catch (err) {
      console.error('Erro ao delegar:', err);
      alert(
        err.response?.data?.message ||
          'Não foi possível delegar os requerimentos.'
      );
    } finally {
      setConfirmandoDelegar(false);
    }
  };

  const confirmarPlanejamento = async () => {
    if (!detalhe?.id) return;
    if (!dataConclusaoPrevista.trim()) {
      alert('Informe a data de conclusão prevista.');
      return;
    }

    try {
      setConfirmandoPlanejar(true);
      await api.post(
        `/requerimentos-servidor/analista/requerimento/${detalhe.id}/planejar-execucao`,
        { dataConclusaoPrevista: dataConclusaoPrevista.trim() }
      );
      closeAllModals();
      setSelectedReqIds([]);
      await load();
      alert('Planejamento registrado com sucesso.');
    } catch (err) {
      console.error('Erro ao planejar execução:', err);
      alert(
        err.response?.data?.message ||
          'Não foi possível registrar o planejamento.'
      );
    } finally {
      setConfirmandoPlanejar(false);
    }
  };

  const handleVoltar = () => {
    navigate('/dashboard-servidor');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <PlayCircle size={20} className="text-sky-600" />
          Analisar requerimento
        </h2>
        <p className="text-slate-500 mt-2">
          Selecione um ou mais requerimentos para iniciar a análise
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleVoltar}
          className="px-5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
      </div>

      <p className="text-slate-700 font-medium">
        Requerimentos delegados para você
      </p>

      {loading ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          Carregando requerimentos...
        </div>
      ) : (
        <section>
          {requerimentos.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-600">
              Nenhum requerimento com status <strong>Delegado</strong> ou{' '}
              <strong>Em análise</strong> atribuído a você no momento.
            </div>
          ) : (
            <div className="grid gap-4">
              {requerimentos.map((req) => {
                const selecionado = selectedReqIds.includes(req.id);
                const abrindo = abrindoId === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedReqIds((prev) => {
                        const set = new Set(prev);
                        if (set.has(req.id)) set.delete(req.id);
                        else set.add(req.id);
                        return Array.from(set);
                      });
                    }}
                    className={`bg-white p-4 rounded-3xl shadow-sm border transition cursor-pointer group flex flex-col md:flex-row gap-6 ${
                      selecionado
                        ? 'border-sky-500/60 shadow-md'
                        : 'border-slate-100 hover:shadow-md'
                    }`}
                  >
                    <img
                      src={getFotoPrincipal(req)}
                      className="w-full md:w-40 h-32 object-cover rounded-2xl"
                      alt="Ocorrência"
                    />

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start gap-4 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Protocolo: {req.protocolo}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusStyle(
                            req.status
                          )}`}
                        >
                          {getStatusLabel(req.status)}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-sky-600 transition">
                          {req.descricao}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          <strong>Categoria:</strong> {req.categoria || '-'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />{' '}
                          {formatarDataCurta(req.dataCadastro)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {req.endereco || '-'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        {req.documentos?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {req.documentos.map((doc, index) => (
                              <a
                                key={index}
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-sm text-sky-600 hover:underline"
                              >
                                <Paperclip size={14} />
                                {doc.nome || `Documento ${index + 1}`}
                              </a>
                            ))}
                          </div>
                        )}

                        {req.comentarios?.length != null && (
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                          >
                            <MessageSquare size={16} />
                            {req.comentarios?.length > 0
                              ? `${req.comentarios.length} comentários`
                              : 'Sem comentários'}
                          </button>
                        )}

                        <div className="ml-auto">
                          <button
                            type="button"
                            disabled={abrindo}
                            onClick={(e) => abrirAnalise(req.id, e)}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                          >
                            {abrindo ? 'Abrindo…' : 'Analisar requerimento'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {detalhe && !modalDelegarOpen && !modalPlanejarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h2 className="text-xl font-bold">Dados do requerimento</h2>
              <button
                type="button"
                onClick={() => setDetalhe(null)}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-bold text-slate-700">Protocolo</p>
                  <p className="text-slate-800">{detalhe.protocolo || '-'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Categoria</p>
                  <p className="text-slate-800">{detalhe.categoria || '-'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-bold text-slate-700">Descrição</p>
                  <p className="text-slate-800 whitespace-pre-wrap">
                    {detalhe.descricao || '-'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-bold text-slate-700">Endereço</p>
                  <p className="text-slate-800">{detalhe.endereco || '-'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Bairro</p>
                  <p className="text-slate-800">{detalhe.bairro || '-'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Cidadão</p>
                  <p className="text-slate-800">
                    {detalhe.nomeCidadao || '-'}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Data de cadastro</p>
                  <p className="text-slate-800">
                    {formatarData(detalhe.dataCadastro)}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Última atualização</p>
                  <p className="text-slate-800">
                    {formatarData(detalhe.dataAtualizacao)}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-2">Fotos</p>
                {detalhe.fotos?.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {detalhe.fotos.map((foto, i) => (
                      <a
                        key={i}
                        href={foto.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img
                          src={foto.url}
                          alt={foto.nome || `Foto ${i + 1}`}
                          className="w-28 h-28 object-cover rounded-xl border border-slate-200 hover:opacity-90"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhuma foto.</p>
                )}
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-2">Documentos</p>
                {detalhe.documentos?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {detalhe.documentos.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-sky-700 text-sm hover:bg-slate-200"
                      >
                        <Paperclip size={14} />
                        {doc.nome || `Documento ${i + 1}`}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum documento.</p>
                )}
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-2">
                  Comentários (mais recentes primeiro)
                </p>
                {detalhe.comentarios?.length > 0 ? (
                  <div className="space-y-3">
                    {detalhe.comentarios.map((c, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4"
                      >
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">
                          {c.texto || '-'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {formatarData(c.data)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Nenhum comentário.</p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex flex-wrap gap-3 justify-end shrink-0">
              <button
                type="button"
                onClick={abrirModalDelegar}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-100 transition"
              >
                Delegar requerimento
              </button>
              <button
                type="button"
                onClick={() => {
                  setDataConclusaoPrevista('');
                  setModalPlanejarOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
              >
                Planejar execução
              </button>
            </div>
          </div>
        </div>
      )}

      {modalDelegarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold">Selecionar analista</h2>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm">
                <p className="text-slate-500">
                  Requerimentos a delegar:{' '}
                  <strong>{idsParaDelegar.length}</strong>
                </p>
              </div>

              {analistas.length === 0 ? (
                <p className="text-slate-600">
                  Nenhum analista encontrado na sua unidade gestora.
                </p>
              ) : (
                <div className="space-y-2">
                  {analistas.map((a) => {
                    const ativo = a.id === selectedAnalistaId;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAnalistaId(a.id)}
                        className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
                          ativo
                            ? 'border-sky-600 bg-sky-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-slate-800">
                          {a.nome || `Analista ${a.id}`}
                        </div>                        
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 flex flex-wrap justify-end gap-3 border-t">
              <button
                type="button"
                onClick={closeAllModals}
                className="px-4 py-2 rounded-xl border border-slate-300"
                disabled={confirmandoDelegar}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmarDelegacao}
                disabled={
                  !selectedAnalistaId ||
                  idsParaDelegar.length === 0 ||
                  confirmandoDelegar
                }
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold inline-flex items-center gap-2 hover:bg-sky-700 transition disabled:opacity-60"
              >
                <Send size={16} />
                {confirmandoDelegar ? 'Confirmando...' : 'Confirmar delegação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPlanejarOpen && detalhe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold">Planejar execução</h2>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Protocolo: <strong>{detalhe.protocolo}</strong>
              </p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Data de conclusão prevista
                </label>
                <input
                  type="date"
                  value={dataConclusaoPrevista}
                  onChange={(e) => setDataConclusaoPrevista(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex flex-wrap justify-end gap-3 border-t">
              <button
                type="button"
                onClick={closeAllModals}
                className="px-4 py-2 rounded-xl border border-slate-300"
                disabled={confirmandoPlanejar}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmarPlanejamento}
                disabled={!dataConclusaoPrevista || confirmandoPlanejar}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition disabled:opacity-60"
              >
                {confirmandoPlanejar ? 'Confirmando...' : 'Confirmar planejamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalisarRequerimentoServidor;
