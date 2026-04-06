import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Calendar,
  MapPin,
  MessageSquare,
  Paperclip,
  Send,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';

const formatarData = (valor) => {
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

function DelegarRequerimentoServidor() {
  const navigate = useNavigate();

  const [requerimentos, setRequerimentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReqIds, setSelectedReqIds] = useState([]);

  const [analistas, setAnalistas] = useState([]);
  const [modalAnalistaOpen, setModalAnalistaOpen] = useState(false);
  const [selectedAnalistaId, setSelectedAnalistaId] = useState('');
  const [confirmando, setConfirmando] = useState(false);

  const selectedRequerimentos = useMemo(() => {
    const ids = new Set(selectedReqIds);
    return requerimentos.filter((r) => r?.id && ids.has(r.id));
  }, [requerimentos, selectedReqIds]);

  const load = async () => {
    setLoading(true);
    try {
      const [resReqs, resAnalistas] = await Promise.all([
        api.get('/requerimentos-servidor/distribuidos-ug'),
        api.get('/requerimentos-servidor/analistas-ug'),
      ]);
      setRequerimentos(resReqs.data || []);
      setAnalistas(resAnalistas.data || []);
    } catch (err) {
      console.error('Erro ao carregar delegação:', err);
      alert(
        err.response?.data?.message ||
          'Erro ao carregar dados para delegar.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConfirmarDelegacao = async () => {
    if (selectedReqIds.length === 0) return;
    if (!selectedAnalistaId) {
      alert('Selecione um analista.');
      return;
    }

    try {
      setConfirmando(true);
      await api.post('/requerimentos-servidor/delegar', {
        idRequerimentos: selectedReqIds,
        idAnalista: selectedAnalistaId,
      });

      setModalAnalistaOpen(false);
      setSelectedAnalistaId('');
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
      setConfirmando(false);
    }
  };

  const handleVoltar = () => {
    navigate('/dashboard-servidor');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <UserCheck size={20} className="text-sky-600" />
          Delegar requerimento
        </h2>
        <p className="text-slate-500 mt-2">
          Selecione um ou mais requerimentos para delegar a um analista
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleVoltar}
          className="px-5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold inline-flex items-center gap-2 hover:bg-slate-50 transition"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedReqIds.length === 0) return;
            setModalAnalistaOpen(true);
            setSelectedAnalistaId('');
          }}
          disabled={selectedReqIds.length === 0}
          className={`px-5 py-2 rounded-xl font-bold transition inline-flex items-center gap-2 ${
            selectedReqIds.length > 0
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'bg-sky-200 text-sky-900 cursor-not-allowed'
          }`}
        >
          <UserCheck size={18} />
          Delegar
        </button>
      </div>

      <p className="text-slate-700 font-medium">
        Requerimentos direcionados ou distribuídos para sua UG
      </p>

      {loading ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          Carregando requerimentos...
        </div>
      ) : (
        <section>
          {requerimentos.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-600">
              Nenhum requerimento <strong>direcionado</strong> ou{' '}
              <strong>distribuído</strong> à sua unidade gestora no momento.
            </div>
          ) : (
            <div className="grid gap-4">
              {requerimentos.map((req) => {
                const selecionado = selectedReqIds.includes(req.id);
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
                          {formatarData(req.dataCadastro)}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReqIds((prev) => {
                                const set = new Set(prev);
                                if (set.has(req.id)) set.delete(req.id);
                                else set.add(req.id);
                                return Array.from(set);
                              });
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                              selecionado
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {selecionado ? 'Selecionado' : 'Selecionar'}
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

      {modalAnalistaOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold">Selecionar analista</h2>
              <button
                type="button"
                onClick={() => setModalAnalistaOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Fechar"
              >
                X
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-sm text-slate-500">
                  Requerimentos selecionados:{' '}
                  <strong>{selectedReqIds.length}</strong>
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  Situações elegíveis: <strong>Direcionado</strong> ou{' '}
                  <strong>Distribuído</strong>
                </p>
                {selectedRequerimentos.length > 0 && (
                  <div className="mt-3 text-xs text-slate-600 break-all">
                    Protocolo(s):{' '}
                    {selectedRequerimentos
                      .slice(0, 6)
                      .map((r) => r.protocolo)
                      .filter(Boolean)
                      .join(', ')}
                    {selectedRequerimentos.length > 6 ? '…' : ''}
                  </div>
                )}
              </div>

              {analistas.length === 0 ? (
                <div className="text-slate-600">
                  Nenhum analista encontrado na sua unidade gestora.
                </div>
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

            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={() => setModalAnalistaOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300"
                disabled={confirmando}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmarDelegacao}
                disabled={
                  selectedReqIds.length === 0 ||
                  !selectedAnalistaId ||
                  confirmando
                }
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold inline-flex items-center gap-2 hover:bg-sky-700 transition disabled:opacity-60"
              >
                <Send size={16} />
                {confirmando ? 'Confirmando...' : 'Confirmar delegação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DelegarRequerimentoServidor;
