import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Calendar,
  MapPin,
  MessageSquare,
  Paperclip,
  ArrowLeft,
  X,
  Trash2,
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

function ResponderRequerimentoServidor() {
  const navigate = useNavigate();

  const [requerimentos, setRequerimentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [abrindoId, setAbrindoId] = useState(null);

  const [detalhe, setDetalhe] = useState(null);
  const [respostaEdit, setRespostaEdit] = useState('');
  const [documentosMantidos, setDocumentosMantidos] = useState([]);
  const [novosArquivos, setNovosArquivos] = useState([]);

  const [confirmandoDevolver, setConfirmandoDevolver] = useState(false);
  const [confirmandoResposta, setConfirmandoResposta] = useState(false);

  const fecharModal = useCallback(() => {
    setDetalhe(null);
    setRespostaEdit('');
    setDocumentosMantidos([]);
    setNovosArquivos([]);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requerimentos-servidor/gestor-ug/requerimentos-concluidos');
      setRequerimentos(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar requerimentos para responder:', err);
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

  const abrirResponder = async (reqId, e) => {
    e?.stopPropagation?.();
    setAbrindoId(reqId);
    try {
      const { data } = await api.get(
        `/requerimentos-servidor/gestor-ug/requerimento/${reqId}/para-resposta`
      );
      setDetalhe(data);
      setRespostaEdit(
        typeof data.resposta === 'string' ? data.resposta : String(data.resposta || '')
      );
      setDocumentosMantidos(
        Array.isArray(data.documentosRespostaLista)
          ? data.documentosRespostaLista.map((d) => ({
              nome: d.nome || 'documento',
              url: d.url,
            }))
          : []
      );
      setNovosArquivos([]);
    } catch (err) {
      console.error('Erro ao abrir requerimento:', err);
      alert(
        err.response?.data?.message ||
          'Não foi possível carregar os dados do requerimento.'
      );
    } finally {
      setAbrindoId(null);
    }
  };

  const removerDocumentoMantido = (index) => {
    setDocumentosMantidos((prev) => prev.filter((_, i) => i !== index));
  };

  const removerNovoArquivo = (index) => {
    setNovosArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  const onPickNovosArquivos = (e) => {
    const f = e.target.files;
    if (!f?.length) return;
    setNovosArquivos((prev) => [...prev, ...Array.from(f)]);
    e.target.value = '';
  };

  const handleDevolver = async () => {
    if (!detalhe?.id) return;
    try {
      setConfirmandoDevolver(true);
      await api.post(
        `/requerimentos-servidor/gestor-ug/requerimento/${detalhe.id}/devolver`
      );
      fecharModal();
      await load();
      alert('Requerimento devolvido com sucesso.');
    } catch (err) {
      console.error('Erro ao devolver:', err);
      alert(
        err.response?.data?.message ||
          'Não foi possível devolver o requerimento.'
      );
    } finally {
      setConfirmandoDevolver(false);
    }
  };

  const handleConfirmarResposta = async () => {
    if (!detalhe?.id) return;
    const texto = respostaEdit.trim();
    if (!texto) {
      alert('Preencha o campo Resposta.');
      return;
    }

    try {
      setConfirmandoResposta(true);
      const fd = new FormData();
      fd.append('resposta', texto);
      fd.append(
        'documentosRespostaMantidos',
        JSON.stringify(documentosMantidos)
      );
      novosArquivos.forEach((file) => {
        fd.append('documentosResposta', file);
      });

      await api.post(
        `/requerimentos-servidor/gestor-ug/requerimento/${detalhe.id}/confirmar-resposta`,
        fd
      );
      fecharModal();
      await load();
      alert('Resposta confirmada com sucesso.');
    } catch (err) {
      console.error('Erro ao confirmar resposta:', err);
      alert(
        err.response?.data?.message ||
          'Não foi possível confirmar a resposta.'
      );
    } finally {
      setConfirmandoResposta(false);
    }
  };

  const handleVoltar = () => {
    navigate('/dashboard-servidor');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <MessageSquare size={20} className="text-sky-600" />
          Responder requerimento
        </h2>
        <p className="text-slate-500 mt-2">
          Clique no botão Responder em um dos requerimentos abaixo
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

      {loading ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          Carregando requerimentos...
        </div>
      ) : (
        <section>
          {requerimentos.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm text-slate-600">
              Nenhum requerimento com status <strong>Concluído</strong> para a
              sua unidade gestora no momento.
            </div>
          ) : (
            <div className="grid gap-4">
              {requerimentos.map((req) => {
                const abrindo = abrindoId === req.id;
                return (
                  <div
                    key={req.id}
                    className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6"
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
                        <h4 className="text-lg font-bold text-slate-800">
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
                                className="inline-flex items-center gap-1 text-sm text-sky-600 hover:underline"
                              >
                                <Paperclip size={14} />
                                {doc.nome || `Documento ${index + 1}`}
                              </a>
                            ))}
                          </div>
                        )}

                        {req.comentarios?.length != null && (
                          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">
                            <MessageSquare size={16} />
                            {req.comentarios?.length > 0
                              ? `${req.comentarios.length} comentários`
                              : 'Sem comentários'}
                          </span>
                        )}

                        <div className="ml-auto">
                          <button
                            type="button"
                            disabled={abrindo}
                            onClick={(e) => abrirResponder(req.id, e)}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                          >
                            {abrindo ? 'Abrindo…' : 'Responder requerimento'}
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

      {detalhe && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h2 className="text-xl font-bold">Dados do requerimento</h2>
              <button
                type="button"
                onClick={fecharModal}
                disabled={confirmandoDevolver || confirmandoResposta}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-bold text-slate-700">Última atualização</p>
                  <p className="text-slate-800">
                    {formatarData(detalhe.dataAtualizacao)}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Data de cadastro</p>
                  <p className="text-slate-800">
                    {formatarData(detalhe.dataCadastro)}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Data de conclusão</p>
                  <p className="text-slate-800">
                    {formatarData(detalhe.dataConclusao)}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="resposta-ug"
                  className="block font-bold text-slate-700 mb-2"
                >
                  Resposta
                </label>
                <textarea
                  id="resposta-ug"
                  value={respostaEdit}
                  onChange={(e) => setRespostaEdit(e.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-y"
                  placeholder="Texto da resposta ao cidadão..."
                />
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-2">
                  Documentos da resposta (anexos)
                </p>
                <p className="text-xs text-slate-500 mb-2">
                  Remova anexos existentes ou inclua novos arquivos (imagens ou
                  PDF).
                </p>
                {documentosMantidos.length > 0 ? (
                  <ul className="space-y-2 mb-3">
                    {documentosMantidos.map((d, i) => (
                      <li
                        key={`${d.url}-${i}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-sky-600 hover:underline truncate"
                        >
                          {d.nome}
                        </a>
                        <button
                          type="button"
                          onClick={() => removerDocumentoMantido(i)}
                          className="text-xs font-semibold text-red-600 inline-flex items-center gap-1 hover:underline"
                        >
                          <Trash2 size={14} />
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 mb-2">
                    Nenhum documento da resposta anexado.
                  </p>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={onPickNovosArquivos}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:font-semibold file:text-slate-800 hover:file:bg-slate-200"
                />
                {novosArquivos.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {novosArquivos.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-2 text-sm text-slate-700"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removerNovoArquivo(i)}
                          className="text-red-600 text-xs font-semibold shrink-0"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="text-sm">
                <p className="font-bold text-slate-700">Cidadão</p>
                <p className="text-slate-800">{detalhe.nomeCidadao || '-'}</p>
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
                onClick={handleDevolver}
                disabled={confirmandoDevolver || confirmandoResposta}
                className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 font-semibold text-amber-900 hover:bg-amber-100 transition disabled:opacity-60"
              >
                {confirmandoDevolver ? 'Devolvendo…' : 'Devolver'}
              </button>
              <button
                type="button"
                onClick={handleConfirmarResposta}
                disabled={confirmandoDevolver || confirmandoResposta}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition disabled:opacity-60"
              >
                {confirmandoResposta ? 'Confirmando…' : 'Confirmar resposta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResponderRequerimentoServidor;
