import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Calendar,
  MapPin,
  MessageSquare,
  Paperclip,
  CircleCheck,
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
    'delegado para análise': 'bg-violet-100 text-violet-700',
    'em análise': 'bg-amber-100 text-amber-700',
    'em execução': 'bg-orange-100 text-orange-700',
    concluído: 'bg-green-100 text-green-700',
    respondido: 'bg-cyan-100 text-cyan-700',
    avaliado: 'bg-emerald-100 text-emerald-700',
  };

  return styles[chave] || 'bg-gray-100 text-gray-600';
};

function ConcluirRequerimentoServidor() {
  const navigate = useNavigate();

  const [requerimentos, setRequerimentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReqIds, setSelectedReqIds] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [resposta, setResposta] = useState('');
  const [arquivos, setArquivos] = useState([]);
  const [confirmando, setConfirmando] = useState(false);

  const selectedRequerimentos = useMemo(() => {
    const ids = new Set(selectedReqIds);
    return requerimentos.filter((r) => r?.id && ids.has(r.id));
  }, [requerimentos, selectedReqIds]);

  const load = async () => {
    setLoading(true);
    try {
      const resReqs = await api.get('/requerimentos-servidor/analista/para-conclusao');
      setRequerimentos(resReqs.data || []);
    } catch (err) {
      console.error('Erro ao carregar requerimentos para conclusão:', err);
      alert(
        err.response?.data?.message ||
          'Erro ao carregar requerimentos para concluir.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fecharModal = () => {
    setModalOpen(false);
    setResposta('');
    setArquivos([]);
  };

  const handleConfirmarConclusao = async () => {
    if (selectedReqIds.length === 0) return;
    const texto = resposta.trim();
    if (!texto) {
      alert('Preencha o campo Resposta.');
      return;
    }

    try {
      setConfirmando(true);
      const fd = new FormData();
      fd.append('resposta', texto);
      fd.append('idRequerimentos', JSON.stringify(selectedReqIds));
      arquivos.forEach((file) => {
        fd.append('documentosResposta', file);
      });

      await api.post('/requerimentos-servidor/analista/concluir', fd);

      fecharModal();
      setSelectedReqIds([]);
      await load();
      alert('Requerimento(s) concluído(s) com sucesso.');
    } catch (err) {
      console.error('Erro ao concluir:', err);
      alert(
        err.response?.data?.message ||
          'Não foi possível concluir o(s) requerimento(s).'
      );
    } finally {
      setConfirmando(false);
    }
  };

  const handleVoltar = () => {
    navigate('/dashboard-servidor');
  };

  const onFilesChange = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setArquivos(list);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <CircleCheck size={20} className="text-sky-600" />
          Concluir requerimento
        </h2>
        <p className="text-slate-500 mt-2">
          Selecione um ou mais requerimentos para concluir
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
            setModalOpen(true);
            setResposta('');
            setArquivos([]);
          }}
          disabled={selectedReqIds.length === 0}
          className={`px-5 py-2 rounded-xl font-bold transition inline-flex items-center gap-2 ${
            selectedReqIds.length > 0
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'bg-sky-200 text-sky-900 cursor-not-allowed'
          }`}
        >
          <CircleCheck size={18} />
          Concluir
        </button>
      </div>

      <p className="text-sm font-medium text-slate-600">
        Requerimentos sob sua responsabilidade
      </p>

      {loading ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          Carregando requerimentos...
        </div>
      ) : (
        <section>
          {requerimentos.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-600">
              Nenhum requerimento em <strong>análise</strong> ou{' '}
              <strong>execução</strong> sob sua responsabilidade no momento.
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
                          <Calendar size={14} /> {formatarData(req.dataCadastro)}
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

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold">Lista de protocolos selecionados</h2>
              <button
                type="button"
                onClick={fecharModal}
                className="p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Fechar"
                disabled={confirmando}
              >
                X
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 min-h-0">
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {selectedRequerimentos.map((r) => (
                  <li key={r.id}>
                    <span className="font-semibold">{r.protocolo || r.id}</span>
                  </li>
                ))}
              </ul>

              <div>
                <label
                  htmlFor="resposta-conclusao"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Resposta <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="resposta-conclusao"
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-y"
                  placeholder="Digite a resposta ao(s) requerimento(s)..."
                />
              </div>

              <div>
                <label
                  htmlFor="anexos-conclusao"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Anexar fotos ou PDF (opcional)
                </label>
                <input
                  id="anexos-conclusao"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={onFilesChange}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:font-semibold file:text-slate-800 hover:file:bg-slate-200"
                />
                {arquivos.length > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    {arquivos.length} arquivo(s) selecionado(s)
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={fecharModal}
                className="px-4 py-2 rounded-xl border border-slate-300"
                disabled={confirmando}
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={handleConfirmarConclusao}
                disabled={
                  selectedReqIds.length === 0 ||
                  !resposta.trim() ||
                  confirmando
                }
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold inline-flex items-center gap-2 hover:bg-sky-700 transition disabled:opacity-60"
              >
                <CircleCheck size={16} />
                {confirmando ? 'Concluindo...' : 'Concluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConcluirRequerimentoServidor;
