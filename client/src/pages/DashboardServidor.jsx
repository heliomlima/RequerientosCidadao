import React from 'react';

function DashboardServidor() {
  const user = JSON.parse(localStorage.getItem('user')) || {};

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Dashboard do Servidor
        </h1>
        <p className="text-slate-500 mb-6">
          Estrutura inicial da área do servidor.
        </p>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
          <p><strong>UID:</strong> {user.uid || '-'}</p>
          <p><strong>Nome:</strong> {user.nome || '-'}</p>
          <p><strong>Setor:</strong> {user.setor || '-'}</p>
          <p><strong>Foto:</strong> {user.fotoUrl || '-'}</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardServidor;