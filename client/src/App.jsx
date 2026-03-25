import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CadastroCidadao from './pages/CadastroCidadao';
import LoginCidadao from './pages/LoginCidadao';
import DashboardCidadao from './pages/DashboardCidadao';
import NovoRequerimento from './pages/NovoRequerimento';
import AlterarCadastroCidadao from './pages/AlterarCadastroCidadao';
import AlterarSenhaCidadao from './pages/AlterarSenhaCidadao';
import AvaliarRequerimento from './pages/AvaliarRequerimento';
import LoginServidor from './pages/LoginServidor';
import PrimeiroAcessoServidor from './pages/PrimeiroAcessoServidor';
import RecuperacaoSenhaServidor from './pages/RecuperacaoSenhaServidor';
import DashboardServidor from './pages/DashboardServidor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastro-cidadao" element={<CadastroCidadao />} />
        <Route path="/login-cidadao" element={<LoginCidadao />} />
        <Route path="/login-servidor" element={<LoginServidor />} />
        <Route path="/dashboard-cidadao" element={<DashboardCidadao />} />
        <Route path="/novo-requerimento" element={<NovoRequerimento />} />
        <Route path="/alterar-cadastro" element={<AlterarCadastroCidadao />} />
        <Route path="/alterar-senha" element={<AlterarSenhaCidadao />} />
        <Route path="/requerimentos/:id/avaliar" element={<AvaliarRequerimento />} />
        <Route path="/login-servidor" element={<LoginServidor />} />
        <Route path="/primeiro-acesso-servidor" element={<PrimeiroAcessoServidor />} />
        <Route path="/recuperacao-senha-servidor" element={<RecuperacaoSenhaServidor />} />
        <Route path="/dashboard-servidor" element={<DashboardServidor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;