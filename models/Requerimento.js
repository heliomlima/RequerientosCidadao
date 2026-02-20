const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '../data/requerimentos.json');

// Garantir que o arquivo existe
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

class Requerimento {
    // Ler todos os requerimentos
    static lerArquivo() {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    }

    // Salvar requerimentos
    static salvarArquivo(data) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }

    // Listar por usuário
    static listarPorUsuario(usuarioId) {
        const requerimentos = this.lerArquivo();
        return requerimentos
            .filter(req => req.usuarioId === usuarioId)
            .sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro));
    }

    // Buscar por ID
    static buscarPorId(id) {
        const requerimentos = this.lerArquivo();
        return requerimentos.find(req => req.id === id);
    }

    // Criar novo requerimento
    static criar(dados) {
        const requerimentos = this.lerArquivo();
        
        const novoRequerimento = {
            id: uuidv4(),
            protocolo: this.gerarProtocolo(),
            usuarioId: dados.usuarioId,
            descricao: dados.descricao,
            endereco: dados.endereco || 'Não informado',
            categoria: dados.categoria || 'Outros',
            fotos: dados.fotos || [],
            fotosCount: dados.fotos ? dados.fotos.length : 0,
            status: 'aguardando',
            dataCadastro: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString(),
            respostas: []
        };

        requerimentos.push(novoRequerimento);
        this.salvarArquivo(requerimentos);
        
        return novoRequerimento;
    }

    // Atualizar requerimento
    static atualizar(id, dados) {
        const requerimentos = this.lerArquivo();
        const index = requerimentos.findIndex(req => req.id === id);
        
        if (index === -1) return null;

        requerimentos[index] = {
            ...requerimentos[index],
            ...dados,
            dataAtualizacao: new Date().toISOString()
        };

        this.salvarArquivo(requerimentos);
        return requerimentos[index];
    }

    // Deletar requerimento
    static deletar(id) {
        const requerimentos = this.lerArquivo();
        const novosRequerimentos = requerimentos.filter(req => req.id !== id);
        this.salvarArquivo(novosRequerimentos);
        return true;
    }

    // Adicionar resposta
    static adicionarResposta(id, resposta) {
        const requerimentos = this.lerArquivo();
        const index = requerimentos.findIndex(req => req.id === id);
        
        if (index === -1) return null;

        if (!requerimentos[index].respostas) {
            requerimentos[index].respostas = [];
        }

        const novaResposta = {
            id: uuidv4(),
            ...resposta,
            data: resposta.data || new Date().toISOString()
        };

        requerimentos[index].respostas.push(novaResposta);
        requerimentos[index].status = resposta.status || requerimentos[index].status;
        requerimentos[index].dataAtualizacao = new Date().toISOString();

        this.salvarArquivo(requerimentos);
        return requerimentos[index];
    }

    // Gerar número de protocolo
    static gerarProtocolo() {
        const ano = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${ano}/${random}`;
    }

    // Obter estatísticas do usuário
    static getEstatisticas(usuarioId) {
        const requerimentos = this.listarPorUsuario(usuarioId);
        
        const total = requerimentos.length;
        const resolvidos = requerimentos.filter(r => r.status === 'resolvido').length;
        const andamento = requerimentos.filter(r => r.status === 'andamento').length;
        const aguardando = requerimentos.filter(r => r.status === 'aguardando').length;

        // Calcular tempo médio de resposta (dias)
        let tempoTotal = 0;
        let respostasCount = 0;

        requerimentos.forEach(req => {
            if (req.respostas && req.respostas.length > 0) {
                const dataCadastro = new Date(req.dataCadastro);
                const primeiraResposta = new Date(req.respostas[0].data);
                const diffTime = Math.abs(primeiraResposta - dataCadastro);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                tempoTotal += diffDays;
                respostasCount++;
            }
        });

        const tempoMedio = respostasCount > 0 ? Math.round(tempoTotal / respostasCount) : 0;

        return {
            total,
            resolvidos,
            andamento,
            aguardando,
            tempoMedio
        };
    }
}

module.exports = Requerimento;