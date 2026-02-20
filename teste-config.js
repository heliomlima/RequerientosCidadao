//requerimentoscidadao-1dcb7101a580.json
// teste-config.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 DIAGNÓSTICO DE CONFIGURAÇÃO');
console.log('=' .repeat(50));

// 1. Verificar o .env
console.log('\n1. Conteúdo do .env:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log(envContent);
} else {
    console.log('❌ Arquivo .env não encontrado!');
}

// 2. Verificar a variável GOOGLE_APPLICATION_CREDENTIALS
console.log('\n2. GOOGLE_APPLICATION_CREDENTIALS:');
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
console.log('Valor:', credPath);

if (credPath) {
    // Tentar resolver o caminho absoluto
    const absolutePath = path.resolve(__dirname, credPath);
    console.log('Caminho absoluto:', absolutePath);
    
    // Verificar se o arquivo existe
    if (fs.existsSync(absolutePath)) {
        console.log('✅ Arquivo encontrado!');
        
        // Verificar se é um JSON válido
        try {
            const content = fs.readFileSync(absolutePath, 'utf8');
            const json = JSON.parse(content);
            console.log('✅ JSON válido!');
            console.log('📁 Projeto:', json.project_id);
            console.log('🔑 Client Email:', json.client_email);
        } catch (e) {
            console.log('❌ Erro ao ler JSON:', e.message);
        }
    } else {
        console.log('❌ Arquivo NÃO encontrado!');
        
        // Listar arquivos na pasta config
        const configDir = path.join(__dirname, 'config');
        if (fs.existsSync(configDir)) {
            console.log('\nArquivos na pasta config:');
            const files = fs.readdirSync(configDir);
            files.forEach(file => console.log('  -', file));
        }
    }
} else {
    console.log('❌ GOOGLE_APPLICATION_CREDENTIALS não definida!');
}

console.log('\n' + '=' .repeat(50));