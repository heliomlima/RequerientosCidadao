import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  FileText,
  LogOut,
  ChevronDown,
  Menu,
  PanelLeftClose,
  List,
  Users,
  Share2,
  UserCheck,
  MessageSquare,
  PlayCircle,
  BookOpen,
  ClipboardList,
  CircleCheck,
} from 'lucide-react';

import DistribuirRequerimentoServidor from './DistribuirRequerimentoServidor';
import DelegarRequerimentoServidor from './DelegarRequerimentoServidor';
import AnalisarRequerimentoServidor from './AnalisarRequerimentoServidor';
import ConcluirRequerimentoServidor from './ConcluirRequerimentoServidor';
import ResponderRequerimentoServidor from './ResponderRequerimentoServidor';
import ManterServidorServidor from './ManterServidorServidor';

const PERFIL_ADMIN_SISTEMA = 1;
const PERFIL_GESTOR = 2;
const PERFIL_GESTOR_UG = 3;
const PERFIL_ANALISTA = 4;

const secLink = (sec) => `/dashboard-servidor?sec=${encodeURIComponent(sec)}`;

const CORES_GRAFICO = [
  '#0ea5e9',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#64748b',
  '#ec4899',
  '#14b8a6',
];

function polarParaCartesiano(cx, cy, r, anguloGraus) {
  const rad = (anguloGraus * Math.PI) / 180;
  return {
    x: cx + r * Math.sin(rad),
    y: cy - r * Math.cos(rad),
  };
}

function pathSegmentoPizza(cx, cy, r, anguloInicio, anguloFim) {
  const span = anguloFim - anguloInicio;
  // Arco SVG de 360°: início e fim coincidem → o arco degenera e não aparece.
  if (span >= 359.999) {
    const p1 = polarParaCartesiano(cx, cy, r, anguloInicio);
    const pm = polarParaCartesiano(cx, cy, r, anguloInicio + 180);
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${pm.x} ${pm.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y} Z`;
  }
  const ini = polarParaCartesiano(cx, cy, r, anguloInicio);
  const fim = polarParaCartesiano(cx, cy, r, anguloFim);
  const arcoGrande = span > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${ini.x} ${ini.y} A ${r} ${r} 0 ${arcoGrande} 1 ${fim.x} ${fim.y} Z`;
}

function GraficoPizzaAbertosPorStatus({ itens, carregando, mensagemSemDados }) {
  if (carregando) {
    return (
      <div className="h-52 flex items-center justify-center text-slate-500 text-sm">
        Carregando…
      </div>
    );
  }
  if (!itens?.length) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        {mensagemSemDados ??
          'Nenhum requerimento aberto (fora de Respondido/Avaliado).'}
      </p>
    );
  }
  const total = itens.reduce((s, x) => s + x.count, 0);
  if (total === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        {mensagemSemDados ?? 'Nenhum requerimento aberto.'}
      </p>
    );
  }

  let acum = 0;
  const segmentos = itens.map((item, i) => {
    const fatia = (item.count / total) * 360;
    const inicio = acum;
    acum += fatia;
    const fullCircle = fatia >= 359.999;
    return {
      key: item.status,
      fullCircle,
      d: fullCircle ? '' : pathSegmentoPizza(100, 100, 88, inicio, acum),
      fill: CORES_GRAFICO[i % CORES_GRAFICO.length],
      item,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-52 h-52 shrink-0">
        {segmentos.map((s) =>
          s.fullCircle ? (
            <circle
              key={s.key}
              cx={100}
              cy={100}
              r={88}
              fill={s.fill}
              stroke="#fff"
              strokeWidth={1}
            />
          ) : (
            <path
              key={s.key}
              d={s.d}
              fill={s.fill}
              stroke="#fff"
              strokeWidth="1"
            />
          )
        )}
      </svg>
      <ul className="text-sm space-y-2 w-full max-w-sm">
        {itens.map((item, i) => (
          <li key={item.status} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{
                backgroundColor: CORES_GRAFICO[i % CORES_GRAFICO.length],
              }}
            />
            <span className="text-slate-700 truncate flex-1" title={item.status}>
              {item.status}
            </span>
            <span className="text-slate-600 font-semibold tabular-nums">
              {item.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GraficoColunasPorUG({ itens, carregando, mensagemVazia }) {
  if (carregando) {
    return (
      <div className="h-52 flex items-center justify-center text-slate-500 text-sm">
        Carregando…
      </div>
    );
  }
  if (!itens?.length) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        {mensagemVazia ?? 'Nenhum requerimento aberto por UG.'}
      </p>
    );
  }
  const max = Math.max(...itens.map((d) => d.count), 1);
  const alturaMaxPx = 168;

  return (
    <div className="space-y-4">
      <div className="h-52 flex items-end gap-1 sm:gap-2 px-1">
        {itens.map((item) => (
          <div
            key={item.id}
            className="flex-1 flex flex-col items-center justify-end min-h-0 min-w-0"
            title={`${item.nome}: ${item.count}`}
          >
            <span className="text-xs font-bold text-slate-700 mb-1 tabular-nums shrink-0">
              {item.count}
            </span>
            <div
              className="w-full max-w-[2.75rem] mx-auto rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400 min-h-[4px] transition-all"
              style={{
                height: `${Math.max(6, (item.count / max) * alturaMaxPx)}px`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 justify-center">
        {itens.map((item) => (
          <span key={item.id} title={item.nome} className="max-w-[10rem] truncate">
            <span className="font-semibold text-slate-800 tabular-nums">
              {item.count}
            </span>
            <span className="text-slate-500"> {item.nome}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200/95 transition hover:bg-white/10 hover:text-white"
    >
      {Icon && <Icon size={18} className="shrink-0 text-sky-400/90" />}
      <span className="truncate">{children}</span>
    </Link>
  );
}

function NavSection({ title, children }) {
  return (
    <div className="space-y-1">
      <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function PlaceholderChart({ title, subtitle }) {
  const bars = [42, 68, 48, 82, 56, 74, 52, 88, 61];
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 mb-6">{subtitle}</p>
      <div className="h-52 flex items-end gap-2">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end min-h-0">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-sky-300/90 to-sky-500/40"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 text-center mt-5">
        Informações do gráfico a serem definidas posteriormente
      </p>
    </div>
  );
}

function DashboardServidor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sec = searchParams.get('sec') || '';
  const isDistribuirRequerimento = sec === 'distribuir-requerimento';
  const isDelegarRequerimento = sec === 'delegar-requerimento';
  const isAnalisarRequerimento = sec === 'analisar-requerimento';
  const isConcluirRequerimento = sec === 'concluir-requerimento';
  const isResponderRequerimento = sec === 'responder';
  const isManterServidor = sec === 'manter-servidor';
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('user')) || {}
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [idPerfis, setIdPerfis] = useState([]);
  const [perfilCarregado, setPerfilCarregado] = useState(false);
  const [indicadoresGestor, setIndicadoresGestor] = useState(null);
  const [carregandoIndicadoresGestor, setCarregandoIndicadoresGestor] =
    useState(false);
  const [indicadoresGestorUG, setIndicadoresGestorUG] = useState(null);
  const [carregandoIndicadoresGestorUG, setCarregandoIndicadoresGestorUG] =
    useState(false);
  const [indicadoresAnalista, setIndicadoresAnalista] = useState(null);
  const [carregandoIndicadoresAnalista, setCarregandoIndicadoresAnalista] =
    useState(false);

  const temPerfil = useCallback(
    (codigo) => idPerfis.includes(codigo),
    [idPerfis]
  );

  useEffect(() => {
    let cancelado = false;

    const carregarPerfil = async () => {
      if (!user.servidorId) {
        setPerfilCarregado(true);
        return;
      }

      try {
        const { data } = await api.post('/usuarios-servidor/perfil', {
          servidorId: user.servidorId,
        });

        if (cancelado || !data?.success) return;

        const lista = Array.isArray(data.idPerfis)
          ? data.idPerfis
          : data.idPerfil != null
            ? [data.idPerfil]
            : [];

        setIdPerfis(
          lista
            .map((v) => (typeof v === 'number' ? v : parseInt(String(v), 10)))
            .filter((n) => !Number.isNaN(n))
        );

        if (typeof data.setor === 'string' && data.setor.trim()) {
          setUser((prev) => {
            const next = { ...prev, setor: data.setor.trim() };
            localStorage.setItem('user', JSON.stringify(next));
            return next;
          });
        }
      } catch (err) {
        console.error('Erro ao carregar perfil do servidor:', err);
      } finally {
        if (!cancelado) setPerfilCarregado(true);
      }
    };

    carregarPerfil();
    return () => {
      cancelado = true;
    };
  }, [user.servidorId]);

  useEffect(() => {
    let cancelado = false;

    const carregarIndicadoresGestor = async () => {
      if (!perfilCarregado || sec) return;
      if (!idPerfis.includes(PERFIL_GESTOR)) return;

      setCarregandoIndicadoresGestor(true);
      try {
        const { data } = await api.get(
          '/requerimentos-servidor/gestor/indicadores-dashboard'
        );
        if (cancelado || !data?.success) return;
        setIndicadoresGestor(data);
      } catch (err) {
        if (!cancelado) {
          console.error('Erro ao carregar indicadores do gestor:', err);
          setIndicadoresGestor(null);
        }
      } finally {
        if (!cancelado) setCarregandoIndicadoresGestor(false);
      }
    };

    carregarIndicadoresGestor();
    return () => {
      cancelado = true;
    };
  }, [perfilCarregado, idPerfis, sec]);

  useEffect(() => {
    let cancelado = false;

    const carregarIndicadoresGestorUG = async () => {
      if (!perfilCarregado || sec) return;
      if (!idPerfis.includes(PERFIL_GESTOR_UG)) return;

      setCarregandoIndicadoresGestorUG(true);
      try {
        const { data } = await api.get(
          '/requerimentos-servidor/gestor-ug/indicadores-dashboard'
        );
        if (cancelado || !data?.success) return;
        setIndicadoresGestorUG(data);
      } catch (err) {
        if (!cancelado) {
          console.error('Erro ao carregar indicadores do gestor de UG:', err);
          setIndicadoresGestorUG(null);
        }
      } finally {
        if (!cancelado) setCarregandoIndicadoresGestorUG(false);
      }
    };

    carregarIndicadoresGestorUG();
    return () => {
      cancelado = true;
    };
  }, [perfilCarregado, idPerfis, sec]);

  useEffect(() => {
    let cancelado = false;

    const carregarIndicadoresAnalista = async () => {
      if (!perfilCarregado || sec) return;
      if (!idPerfis.includes(PERFIL_ANALISTA)) return;

      setCarregandoIndicadoresAnalista(true);
      try {
        const { data } = await api.get(
          '/requerimentos-servidor/analista/indicadores-dashboard'
        );
        if (cancelado || !data?.success) return;
        setIndicadoresAnalista(data);
      } catch (err) {
        if (!cancelado) {
          console.error('Erro ao carregar indicadores do analista:', err);
          setIndicadoresAnalista(null);
        }
      } finally {
        if (!cancelado) setCarregandoIndicadoresAnalista(false);
      }
    };

    carregarIndicadoresAnalista();
    return () => {
      cancelado = true;
    };
  }, [perfilCarregado, idPerfis, sec]);

  const gruposMenu = useMemo(() => {
    const geral = (
      <NavSection key="geral" title="Geral">
        <NavItem to={secLink('listar-requerimentos')} icon={List}>
          Listar requerimentos
        </NavItem>
      </NavSection>
    );

    const blocos = [geral];

    if (temPerfil(PERFIL_ADMIN_SISTEMA)) {
      blocos.push(
        <NavSection key="admin" title="Administração do sistema">
          <NavItem to={secLink('manter-servidor')} icon={Users}>
            Manter servidor
          </NavItem>
        </NavSection>
      );
    }

    if (temPerfil(PERFIL_GESTOR)) {
      blocos.push(
        <NavSection key="gestor" title="Gestão">
          <NavItem to={secLink('distribuir-requerimento')} icon={Share2}>
            Distribuir requerimento
          </NavItem>
        </NavSection>
      );
    }

    if (temPerfil(PERFIL_GESTOR_UG)) {
      blocos.push(
        <NavSection key="gestor-ug" title="Unidade gestora">
          <NavItem to={secLink('delegar-requerimento')} icon={UserCheck}>
            Delegar requerimento
          </NavItem>
          <NavItem to={secLink('responder')} icon={MessageSquare}>
            Responder
          </NavItem>
        </NavSection>
      );
    }

    if (temPerfil(PERFIL_ANALISTA)) {
      blocos.push(
        <NavSection key="analista" title="Análise">
          <NavItem to={secLink('analisar-requerimento')} icon={PlayCircle}>
            Analisar requerimento
          </NavItem>
          {/*<NavItem to={secLink('comentar-requerimento')} icon={MessageSquare}>
            Comentar requerimento
          </NavItem>*/}
          {/*<NavItem to={secLink('iniciar-analise')} icon={PlayCircle}>
            Iniciar análise
          </NavItem>*/}
          {/*<NavItem to={secLink('ler-comentario')} icon={BookOpen}>
            Ler comentário
          </NavItem>*/}
          {/*<NavItem to={secLink('planejar-execucao')} icon={ClipboardList}>
            Planejar execução
          </NavItem>*/}
          <NavItem to={secLink('concluir-requerimento')} icon={CircleCheck}>
            Concluir requerimento
          </NavItem>
        </NavSection>
      );
    }

    return blocos;
  }, [temPerfil]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const cardsPlaceholder = [
    {
      label: 'Quantitativo 1',
      valor: '—',
      detalhe: 'Métrica a definir',
      accent: 'text-slate-900',
    },
    {
      label: 'Quantitativo 2',
      valor: '—',
      detalhe: 'Métrica a definir',
      accent: 'text-sky-600',
    },
    {
      label: 'Quantitativo 3',
      valor: '—',
      detalhe: 'Métrica a definir',
      accent: 'text-violet-600',
    },
    {
      label: 'Quantitativo 4',
      valor: '—',
      detalhe: 'Métrica a definir',
      accent: 'text-emerald-600',
    },
  ];

  const cardsGestorLista = temPerfil(PERFIL_GESTOR)
    ? [
        {
          label: 'Aguardando distribuição',
          valor: carregandoIndicadoresGestor
            ? '…'
            : String(
                indicadoresGestor?.cards?.aguardandoDistribuicao ?? 0
              ),
          detalhe: 'Situação: Registrado',
          accent: 'text-slate-900',
        },
        {
          label: 'Fora do prazo',
          valor: carregandoIndicadoresGestor
            ? '…'
            : String(indicadoresGestor?.cards?.foraDoPrazo ?? 0),
          detalhe: 'Sem data de conclusão ou com prazo previsto já ultrapassado',
          accent: 'text-amber-600',
        },
        {
          label: 'Respondidos / avaliados (30 dias)',
          valor: carregandoIndicadoresGestor
            ? '…'
            : String(
                indicadoresGestor?.cards?.respondidosAvaliados30d ?? 0
              ),
          detalhe: 'Respondido ou Avaliado, com conclusão nos últimos 30 dias',
          accent: 'text-emerald-600',
        },
      ]
    : null;

  const cardsGestorUGLista = temPerfil(PERFIL_GESTOR_UG)
    ? [
        {
          label: 'Sob responsabilidade da minha UG',
          valor: carregandoIndicadoresGestorUG
            ? '…'
            : String(
                indicadoresGestorUG?.cards?.sobResponsabilidadeMinhaUG ?? 0
              ),
          detalhe:
            'Abertos (exceto Respondido e Avaliado) na sua UG',
          accent: 'text-slate-900',
        },
        {
          label: 'Aguardando delegação',
          valor: carregandoIndicadoresGestorUG
            ? '…'
            : String(indicadoresGestorUG?.cards?.aguardandoDelegacao ?? 0),
          detalhe: 'Direcionado ou Distribuído na sua UG',
          accent: 'text-violet-600',
        },
        {
          label: 'Aguardando minha resposta',
          valor: carregandoIndicadoresGestorUG
            ? '…'
            : String(indicadoresGestorUG?.cards?.aguardandoMinhaResposta ?? 0),
          detalhe: 'Status Concluído na sua UG',
          accent: 'text-emerald-600',
        },
      ]
    : null;

  const cardsAnalistaLista = temPerfil(PERFIL_ANALISTA)
    ? [
        {
          label: 'Sob minha responsabilidade',
          valor: carregandoIndicadoresAnalista
            ? '…'
            : String(
                indicadoresAnalista?.cards?.sobMinhaResponsabilidade ?? 0
              ),
          detalhe:
            'Delegado, Em análise ou Em execução por você',
          accent: 'text-slate-900',
        },
        {
          label: 'Aguardando minha análise',
          valor: carregandoIndicadoresAnalista
            ? '…'
            : String(
                indicadoresAnalista?.cards?.aguardandoMinhaAnalise ?? 0
              ),
          detalhe: 'Delegados a você',
          accent: 'text-violet-600',
        },
        {
          label: 'Em análise / execução',
          valor: carregandoIndicadoresAnalista
            ? '…'
            : String(
                indicadoresAnalista?.cards?.emAnaliseOuExecucao ?? 0
              ),
          detalhe: 'Em análise ou Em execução por você',
          accent: 'text-sky-600',
        },
      ]
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl hover:bg-white/10 transition shrink-0"
            title={sidebarOpen ? 'Ocultar menu' : 'Exibir menu'}
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'Ocultar menu lateral' : 'Exibir menu lateral'}
          >
            {sidebarOpen ? <PanelLeftClose size={22} /> : <Menu size={22} />}
          </button>

          <div className="bg-sky-600 p-2 rounded-lg shrink-0">
            <FileText size={24} />
          </div>
          <h1 className="text-lg sm:text-xl font-bold hidden md:block truncate">
            Sistema Colaborativo Cidadão-Governo
          </h1>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer relative"
            onClick={() => setMenuOpen(!menuOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMenuOpen(!menuOpen);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Bem-vindo(a),</p>
              <p className="font-semibold text-sm">{user.nome || user.name || 'Servidor(a)'}</p>
            </div>

            <img
              src={user.fotoUrl || 'https://via.placeholder.com/40'}
              className="w-10 h-10 rounded-full border-2 border-sky-500 object-cover"
              alt="Perfil"
            />

            <ChevronDown
              size={16}
              className={`transition-transform hidden sm:block ${menuOpen ? 'rotate-180' : ''}`}
            />

            {menuOpen && (
              <div className="absolute top-14 right-0 bg-white text-slate-800 shadow-2xl rounded-2xl p-2 w-48 border border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/alterar-cadastro')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-sm font-medium"
                >
                  Alterar Cadastro
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/alterar-senha')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 rounded-xl text-sm font-medium"
                >
                  Alterar Senha
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="hover:text-red-400 transition p-1"
            aria-label="Sair"
          >
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 relative">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-[73px] bg-slate-900/50 z-20 md:hidden"
            aria-label="Fechar menu lateral"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            shrink-0 z-30 max-w-[min(18rem,88vw)]
            fixed md:sticky md:top-16 md:self-start md:max-h-[calc(100vh-4rem)] top-16 bottom-0 left-0
            border-r border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
            transition-[transform,width] duration-300 ease-in-out overflow-hidden
            ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 pointer-events-none md:translate-x-0'}
            ${sidebarOpen ? 'md:w-72' : 'md:w-0 md:border-r-0 md:pointer-events-none'}
          `}
          aria-hidden={!sidebarOpen}
        >
          <div className="w-72 p-4 h-full min-h-0 flex flex-col max-h-[calc(100dvh-4rem)] md:max-h-[calc(100vh-4rem)]">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-4">
              <p className="text-xs text-slate-400">UG do servidor</p>
              <p className="font-semibold text-white truncate">{user.setor || 'Setor não informado'}</p>
              {!perfilCarregado && (
                <p className="text-[11px] text-sky-300/90 mt-2">Carregando perfil…</p>
              )}
              {perfilCarregado && user.servidorId && idPerfis.length === 0 && (
                <p className="text-[11px] text-amber-300/90 mt-2">
                  Perfil não encontrado ou sessão antiga — faça login novamente para atualizar o menu.
                </p>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto pr-1 space-y-1 -mr-1">{gruposMenu}</nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 space-y-8 overflow-y-auto">
          {isManterServidor ? (
            <ManterServidorServidor />
          ) : isDistribuirRequerimento ? (
            <DistribuirRequerimentoServidor />
          ) : isDelegarRequerimento ? (
            <DelegarRequerimentoServidor />
          ) : isAnalisarRequerimento ? (
            <AnalisarRequerimentoServidor />
          ) : isResponderRequerimento ? (
            <ResponderRequerimentoServidor />
          ) : isConcluirRequerimento ? (
            <ConcluirRequerimentoServidor />
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Painel do servidor
                </h2>
                <p className="text-slate-500 mt-1">
                  Visão geral e atalhos para as funcionalidades da sua função.
                </p>
              </div>

              {temPerfil(PERFIL_GESTOR) && (
                <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {cardsGestorLista.map((c) => (
                    <div
                      key={c.label}
                      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
                    >
                      <p className="text-slate-500 text-sm font-medium">
                        {c.label}
                      </p>
                      <p
                        className={`text-4xl font-extrabold mt-1 ${c.accent}`}
                      >
                        {c.valor}
                      </p>
                      <p className="text-xs text-slate-400 mt-3">{c.detalhe}</p>
                    </div>
                  ))}
                </section>
              )}

              {temPerfil(PERFIL_GESTOR_UG) && (
                <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {cardsGestorUGLista.map((c) => (
                    <div
                      key={c.label}
                      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
                    >
                      <p className="text-slate-500 text-sm font-medium">
                        {c.label}
                      </p>
                      <p
                        className={`text-4xl font-extrabold mt-1 ${c.accent}`}
                      >
                        {c.valor}
                      </p>
                      <p className="text-xs text-slate-400 mt-3">{c.detalhe}</p>
                    </div>
                  ))}
                </section>
              )}

              {temPerfil(PERFIL_ANALISTA) && (
                <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {cardsAnalistaLista.map((c) => (
                    <div
                      key={c.label}
                      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
                    >
                      <p className="text-slate-500 text-sm font-medium">
                        {c.label}
                      </p>
                      <p
                        className={`text-4xl font-extrabold mt-1 ${c.accent}`}
                      >
                        {c.valor}
                      </p>
                      <p className="text-xs text-slate-400 mt-3">{c.detalhe}</p>
                    </div>
                  ))}
                </section>
              )}

              {!temPerfil(PERFIL_GESTOR) &&
                !temPerfil(PERFIL_GESTOR_UG) &&
                !temPerfil(PERFIL_ANALISTA) && (
                  <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    {cardsPlaceholder.map((c) => (
                      <div
                        key={c.label}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
                      >
                        <p className="text-slate-500 text-sm font-medium">
                          {c.label}
                        </p>
                        <p
                          className={`text-4xl font-extrabold mt-1 ${c.accent}`}
                        >
                          {c.valor}
                        </p>
                        <p className="text-xs text-slate-400 mt-3">{c.detalhe}</p>
                      </div>
                    ))}
                  </section>
                )}

              <div className="space-y-8">
                {temPerfil(PERFIL_GESTOR) && (
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-800">
                        Requerimentos abertos por situação
                      </h3>
                      <GraficoPizzaAbertosPorStatus
                        itens={indicadoresGestor?.graficoAbertosPorStatus}
                        carregando={carregandoIndicadoresGestor}
                      />
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-800">
                        Requerimentos abertos por unidade gestora
                      </h3>
                      <GraficoColunasPorUG
                        itens={indicadoresGestor?.graficoAbertosPorUG}
                        carregando={carregandoIndicadoresGestor}
                      />
                    </div>
                  </section>
                )}

                {temPerfil(PERFIL_GESTOR_UG) && (
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-800">
                        Requerimentos da minha UG — abertos por situação
                      </h3>
                      <GraficoPizzaAbertosPorStatus
                        itens={indicadoresGestorUG?.graficoAbertosPorStatus}
                        carregando={carregandoIndicadoresGestorUG}
                      />
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-800">
                        Minha UG — abertos por bairro
                      </h3>
                      <GraficoColunasPorUG
                        itens={indicadoresGestorUG?.graficoAbertosPorBairro}
                        carregando={carregandoIndicadoresGestorUG}
                      />
                    </div>
                  </section>
                )}

                {temPerfil(PERFIL_ANALISTA) && (
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-800">
                        Sob minha responsabilidade — por situação
                      </h3>
                      <GraficoPizzaAbertosPorStatus
                        itens={
                          indicadoresAnalista?.graficoSobResponsabilidadePorStatus
                        }
                        carregando={carregandoIndicadoresAnalista}
                        mensagemSemDados="Nenhum requerimento sob sua responsabilidade nesses status."
                      />
                    </div>
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                      <h3 className="text-lg font-bold text-slate-800">
                        Executados por mim nos últimos 30 dias — por situação
                      </h3>
                      <GraficoColunasPorUG
                        itens={
                          indicadoresAnalista?.graficoExecutados30dPorStatus
                        }
                        carregando={carregandoIndicadoresAnalista}
                        mensagemVazia="Nenhum requerimento Concluído ou Respondido com conclusão nos últimos 30 dias."
                      />
                    </div>
                  </section>
                )}

                {!temPerfil(PERFIL_GESTOR) &&
                  !temPerfil(PERFIL_GESTOR_UG) &&
                  !temPerfil(PERFIL_ANALISTA) && (
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <PlaceholderChart
                        title="Indicador A"
                        subtitle="Distribuição ou série temporal (a definir)"
                      />
                      <PlaceholderChart
                        title="Indicador B"
                        subtitle="Comparativo ou categorias (a definir)"
                      />
                    </section>
                  )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default DashboardServidor;
