import React from 'react';
import { useNavigate } from 'react-router-dom';

function RecuperacaoSenhaServidor() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Recuperação de Senha
        </h1>
        <p className="text-slate-500 mb-8">
          Esta funcionalidade será desenvolvida posteriormente.
        </p>

        <button
          onClick={() => navigate('/login-servidor')}
          className="w-full py-3.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition"
        >
          Voltar para login
        </button>
      </div>
    </div>
  );
}

export default RecuperacaoSenhaServidor;