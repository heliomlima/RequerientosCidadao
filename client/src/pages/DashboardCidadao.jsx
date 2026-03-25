import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  LogOut,
  Plus,
  ChevronDown,
  FileText,
  Calendar,
  MapPin,
  MessageSquare,
  Paperclip,
  Send,
  X,
} from 'lucide-react';

const DashboardCidadao = () => {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [menuOpen, setMenuOpen] = useState(false);
  const [requerimentos, setRequerimentos] = useState([]);
  const [stats, setStats] = useState({
    totalRequerimentos: 0,
    totalEmAnalise: 0,
    totalRespondidosAvaliados: 0,
  });
  const [selectedReq, setSelectedReq] = useState(null);
  const [comentariosOpen, setComentariosOpen] = useState(false);
  const [comentarioReq, setComentarioReq] = useState(null);
  const [novoComentario, setNovoComentario] = useState('');
  const [novasFotos, setNovasFotos] = useState([]);
  const [novosDocumentos, setNovosDocumentos] = useState([]);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resStats, resReqs] = await Promise.all([
        api.get('/requerimentos/stats'),
        api.get('/requerimentos/meus'),
      ]);

      setStats(resStats.data);
      setRequerimentos(resReqs.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    }
  };

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
    if (req?.fotos?.length > 0) {
      return req.fotos[0].url;
    }
    return 'https://via.placeholder.com/300x200?text=Sem+imagem';
  };

  const getStatusLabel = (status) => {
    return status || 'Não informado';
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const abrirModalComentarios = (req, e) => {
    e.stopPropagation();
    setComentarioReq(req);
    setComentariosOpen(true);
    setNovoComentario('');
    setNovasFotos([]);
    setNovosDocumentos([]);
  };

  const enviarComentario = async () => {
    if (!comentarioReq?.id) return;

    try {
      setEnviandoComentario(true);

      const formData = new FormData();
      formData.append('comentario', novoComentario);

      novasFotos.forEach((arquivo) => {
        formData.append('fotos', arquivo);
      });

      novosDocumentos.forEach((arquivo) => {
        formData.append('documentos', arquivo);
      });

      await api.post(`/requerimentos/${comentarioReq.id}/comentarios`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setComentariosOpen(false);
      setComentarioReq(null);
      setNovoComentario('');
      setNovasFotos([]);
      setNovosDocumentos([]);
      await loadData();
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      alert(
        error.response?.data?.message ||
          'Não foi possível enviar o comentário.'
      );
    } finally {
      setEnviandoComentario(false);
    }
  };

  const renderAvaliacaoEstrelas = (nota) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= nota ? 'text-yellow-400' : 'text-slate-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-sky-600 p-2 rounded-lg">
            <FileText size={24} />
          </div>
          <h1 className="text-xl font-bold hidden md:block">
            Sistema Colaborativo Cidadão-Governo
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-3 cursor-pointer relative"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Bem-vindo(a),</p>
              <p className="font-semibold text-sm">{user.nome || user.name}</p>
            </div>

            <img
              src={user.fotoUrl || 'https://via.placeholder.com/40'}
              className="w-10 h-10 rounded-full border-2 border-sky-500 object-cover"
              alt="Perfil"
            />

            <ChevronDown
              size={16}
              className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />

            {menuOpen && (
              <div className="absolute top-14 right-0 bg-white text-slate-800 shadow-2xl rounded-2xl p-2 w-48 border border-slate-100">
                <button
                  onClick={() => navigate('/alterar-cadastro')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-sm font-medium"
                >
                  Alterar Cadastro
                </button>
                <button
                  onClick={() => navigate('/alterar-senha')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-sm font-medium"
                >
                  Alterar Senha
                </button>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="hover:text-red-400 transition">
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">
              Total de Requerimentos
            </p>
            <h2 className="text-4xl font-extrabold text-slate-900 mt-1">
              {stats.totalRequerimentos}
            </h2>
            <button
              onClick={() => navigate('/novo-requerimento')}
              className="mt-4 w-full bg-sky-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-sky-700 transition"
            >
              <Plus size={18} /> Novo Requerimento
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">
              Em Análise / Execução
            </p>
            <h2 className="text-4xl font-extrabold text-sky-600 mt-1">
              {stats.totalEmAnalise}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">
              Respondidos / Avaliados
            </p>
            <h2 className="text-4xl font-extrabold text-emerald-600 mt-1">
              {stats.totalRespondidosAvaliados}
            </h2>
          </div>
        </section>

        <section>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-800">
              Meus Requerimentos
            </h3>
            <p className="text-slate-500">
              Acompanhe o progresso das suas solicitações
            </p>
          </div>

          <div className="grid gap-4">
            {requerimentos.map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedReq(req)}
                className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 cursor-pointer hover:shadow-md transition group"
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
                            {doc.nome}
                          </a>
                        ))}
                      </div>
                    )}

                    {req.comentarios?.length > 0 && (
                      <button
                        onClick={(e) => abrirModalComentarios(req, e)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                      >
                        <MessageSquare size={16} />
                        Ver comentários
                      </button>
                    )}

                    {(!req.comentarios || req.comentarios.length === 0) && (
                      <button
                        onClick={(e) => abrirModalComentarios(req, e)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                      >
                        <MessageSquare size={16} />
                        Comentar
                      </button>
                    )}

                    {req.status === 'Respondido' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/requerimentos/${req.id}/avaliar`);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                      >
                        Avaliar
                      </button>
                    )}

                    {req.status === 'Avaliado' && req.avaliacao && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-600">Avaliação:</span>
                        {renderAvaliacaoEstrelas(req.avaliacao)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-2xl font-bold">Detalhes do Requerimento</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-bold">Protocolo:</p>
                  <p>{selectedReq.protocolo || '-'}</p>
                </div>

                <div>
                  <p className="font-bold">Situação:</p>
                  <p>{selectedReq.status || '-'}</p>
                </div>

                <div>
                  <p className="font-bold">Categoria:</p>
                  <p>{selectedReq.categoria || '-'}</p>
                </div>

                <div>
                  <p className="font-bold">UG Responsável:</p>
                  <p>{selectedReq.idUGResponsavel || '-'}</p>
                </div>

                <div>
                  <p className="font-bold">Data de Cadastro:</p>
                  <p>{formatarData(selectedReq.dataCadastro)}</p>
                </div>

                <div>
                  <p className="font-bold">Última Atualização:</p>
                  <p>{formatarData(selectedReq.dataAtualizacao)}</p>
                </div>

                <div>
                  <p className="font-bold">Data de Conclusão Prevista:</p>
                  <p>{formatarData(selectedReq.dataConclusaoPrevista)}</p>
                </div>

                <div>
                  <p className="font-bold">Data de Conclusão:</p>
                  <p>{formatarData(selectedReq.dataConclusao)}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="font-bold">Endereço:</p>
                  <p>{selectedReq.endereco || '-'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="font-bold">Descrição:</p>
                  <p>{selectedReq.descricao || '-'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="font-bold">Resposta:</p>
                  <p className="bg-slate-50 p-3 rounded-xl italic">
                    {selectedReq.resposta || 'Aguardando resposta...'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="font-bold">Comentário da Avaliação:</p>
                  <p>{selectedReq.comentarioAvaliacao || '-'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="font-bold">Documento da Resposta:</p>
                  {selectedReq.documentoResposta?.url ? (
                    <a
                      href={selectedReq.documentoResposta.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline"
                    >
                      Abrir documento
                    </a>
                  ) : (
                    <p>-</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <p className="font-bold mb-2">Comentários:</p>
                  {selectedReq.comentarios?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedReq.comentarios.map((comentario, index) => (
                        <div
                          key={index}
                          className="bg-slate-50 rounded-xl p-3 border border-slate-200"
                        >
                          <p className="text-sm">{comentario.texto || '-'}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatarData(comentario.data)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>-</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 text-right">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {comentariosOpen && comentarioReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold">Comentários do Requerimento</h2>
              <button onClick={() => setComentariosOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <p className="text-sm text-slate-500">
                  Protocolo: <strong>{comentarioReq.protocolo}</strong>
                </p>
              </div>

              <div className="space-y-3">
                {comentarioReq.comentarios?.length > 0 ? (
                  comentarioReq.comentarios.map((item, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                    >
                      <div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">
                          {item.texto || '-'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatarData(item.data)}
                        </p>
                      </div>

                      {item.fotos?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">
                            Fotos anexadas
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {item.fotos.map((foto, fotoIndex) => (
                              <a
                                key={fotoIndex}
                                href={foto.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block"
                              >
                                <img
                                  src={foto.url}
                                  alt={foto.nome || `Foto ${fotoIndex + 1}`}
                                  className="w-24 h-24 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.documentos?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">
                            Documentos anexados
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.documentos.map((doc, docIndex) => (
                              <a
                                key={docIndex}
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm hover:bg-emerald-100 transition"
                              >
                                <Paperclip size={14} />
                                {doc.nome || `Documento ${docIndex + 1}`}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Ainda não há comentários.
                  </p>
                )}
              </div>

              <div className="space-y-3 border-t pt-4">
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500"
                  rows="4"
                  placeholder="Digite seu comentário"
                />

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Adicionar fotos
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setNovasFotos(Array.from(e.target.files))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Adicionar documentos
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={(e) =>
                      setNovosDocumentos(Array.from(e.target.files))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setComentariosOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={enviarComentario}
                disabled={enviandoComentario}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold inline-flex items-center gap-2"
              >
                <Send size={16} />
                {enviandoComentario ? 'Enviando...' : 'Enviar comentário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCidadao;