import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/manaus-bg.jpg')" }}
    >
      <div className="min-h-screen bg-slate-950/60 flex flex-col justify-between">
        <main className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-6xl text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-white text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
                Sistema Colaborativo Cidadão-Governo
              </h1>

              <p className="mt-6 text-slate-100 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
                Sua participação melhora a sua cidade. Colabore dando sugestões,
                fazendo críticas ou solicitando atendimentos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
                {/* Botão de Login */}
                <Link to="/login-cidadao" className="flex-1">
                  <button className="w-full py-3.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition shadow-lg shadow-sky-100">
                    Login
                  </button>
                </Link>

                {/* Botão de Criar Cadastro */}
                <Link to="/cadastro-cidadao" className="flex-1">
                  <button className="w-full py-3.5 bg-white text-sky-600 font-bold rounded-xl border-2 border-sky-600 hover:bg-sky-50 transition">
                    Criar cadastro
                  </button>
                </Link>
              </div>
            </div>

            <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-left shadow-xl">
                <h2 className="text-white text-xl font-bold">
                  Faça sugestões
                </h2>
                <p className="mt-3 text-slate-100 leading-relaxed">
                  Contribua com ideias para melhorar a sua cidade e comunidade.
                </p>
              </div>

              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-left shadow-xl">
                <h2 className="text-white text-xl font-bold">
                  Acompanhe em tempo real
                </h2>
                <p className="mt-3 text-slate-100 leading-relaxed">
                  Veja o status de suas solicitações e receba atualizações.
                </p>
              </div>

              <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-6 text-left shadow-xl">
                <h2 className="text-white text-xl font-bold">
                  Transparência e sigilo total
                </h2>
                <p className="mt-3 text-slate-100 leading-relaxed">
                  Sua solicitação será respondida com clareza e sua identidade
                  será mantida em sigilo.
                </p>
              </div>
            </section>
          </div>
        </main>

        <footer className="pb-8 text-center">
          <button
            onClick={() => navigate('/login-servidor')}
            className="text-white underline underline-offset-4 hover:text-slate-200 transition"
          >
            Acesso como servidor
          </button>
        </footer>
      </div>
    </div>
  );
}

export default Home;