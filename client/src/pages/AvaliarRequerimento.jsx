import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const AvaliarRequerimento = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [avaliacao, setAvaliacao] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (avaliacao < 1 || avaliacao > 5) {
      setErro('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    if (avaliacao < 5 && !comentarioAvaliacao.trim()) {
      setErro('O comentário é obrigatório para avaliações menores que 5 estrelas.');
      return;
    }

    const confirmar = window.confirm('Deseja realmente confirmar esta avaliação?');
    if (!confirmar) return;

    try {
      setLoading(true);

      await api.put(`/requerimentos/${id}/avaliar`, {
        avaliacao,
        comentarioAvaliacao,
      });

      alert('Avaliação registrada com sucesso.');
      navigate('/dashboard-cidadao');
    } catch (error) {
      console.error('Erro ao avaliar requerimento:', error);
      setErro(
        error.response?.data?.message ||
          'Não foi possível registrar a avaliação.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStar = (star) => {
    const ativa = star <= avaliacao;

    return (
      <button
        key={star}
        type="button"
        onClick={() => setAvaliacao(star)}
        className={`text-4xl transition ${
          ativa ? 'text-yellow-400' : 'text-slate-300'
        } hover:scale-110`}
      >
        ★
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Avaliar Atendimento
        </h1>
        <p className="text-slate-500 mb-8">
          Escolha de 1 a 5 estrelas e deixe um comentário quando necessário.
        </p>

        {erro && (
          <div className="mb-4 rounded-xl bg-red-100 text-red-700 px-4 py-3">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Sua avaliação
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(renderStar)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Comentário da avaliação
            </label>
            <textarea
              value={comentarioAvaliacao}
              onChange={(e) => setComentarioAvaliacao(e.target.value)}
              rows={5}
              placeholder="Escreva seu comentário"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Obrigatório quando a avaliação for menor que 5 estrelas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard-cidadao')}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-70"
            >
              {loading ? 'Salvando...' : 'Confirmar avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvaliarRequerimento;