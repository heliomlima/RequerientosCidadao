const axios = require('axios');
const { admin, db } = require('../firebase/admin');

function somenteNumeros(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function obterFotoUrlServidor(dados) {
  if (dados.fotoUrl) return dados.fotoUrl;

  if (Array.isArray(dados.foto) && dados.foto.length > 0) {
    const primeiraFoto = dados.foto[0];

    if (typeof primeiraFoto === 'string') return primeiraFoto;
    if (primeiraFoto?.url) return primeiraFoto.url;
  }

  return '';
}

exports.primeiroAcessoServidor = async (req, res) => {
  try {
    const { email = '', cpf = '', senha = '', confirmarSenha = '' } = req.body;

    const emailNormalizado = email.trim().toLowerCase();
    const cpfNormalizado = somenteNumeros(cpf);

    if (!emailNormalizado || !cpfNormalizado || !senha || !confirmarSenha) {
      return res.status(400).json({
        success: false,
        message: 'Preencha e-mail, CPF, senha e confirmação de senha.',
      });
    }

    if (senha !== confirmarSenha) {
      return res.status(400).json({
        success: false,
        message: 'As senhas digitadas são diferentes!',
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres.',
      });
    }

    const snapshot = await db
      .collection('usuarioServidor')
      .where('email', '==', emailNormalizado)
      .limit(10)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Não foi encontrado cadastro de servidor com o e-mail informado.',
      });
    }

    const docValido = snapshot.docs.find((doc) => {
      const dados = doc.data();
      const cpfBanco = String(dados.CPF || '').replace(/\D/g, '');
      return cpfBanco === cpfNormalizado;
    });

    if (!docValido) {
      return res.status(404).json({
        success: false,
        message: 'Não foi encontrado cadastro de servidor com o e-mail e CPF informados.',
      });
    }

    const doc = docValido;
    const dadosServidor = doc.data();

    if (dadosServidor.uid) {
      return res.status(409).json({
        success: false,
        message:
          'Usuário já cadastrado! Realize o login com o seu e-mail e última senha utilizada.',
        redirectToLogin: true,
      });
    }

    let firebaseUser;

    try {
      firebaseUser = await admin.auth().getUserByEmail(emailNormalizado);

      await doc.ref.update({
        uid: firebaseUser.uid,
        ativo: 'SIM',
        dataAtualizacao: admin.firestore.Timestamp.now(),
      });

      return res.status(409).json({
        success: false,
        message:
          'Usuário já cadastrado! Realize o login com o seu e-mail e última senha utilizada.',
        redirectToLogin: true,
      });
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        console.error('Erro ao consultar usuário no Firebase Auth:', authError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao verificar cadastro do usuário.',
        });
      }
    }

    const novoUsuarioAuth = await admin.auth().createUser({
      email: emailNormalizado,
      password: senha,
      displayName: dadosServidor.nome || '',
    });

    await doc.ref.update({
      uid: novoUsuarioAuth.uid,
      ativo: 'SIM',
      email: emailNormalizado,
      CPF: cpfNormalizado,
      dataAtualizacao: admin.firestore.Timestamp.now(),
    });

    return res.status(201).json({
      success: true,
      message: 'Primeiro acesso realizado com sucesso. Faça login para continuar.',
    });
  } catch (error) {
    console.error('Erro no primeiro acesso do servidor:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao realizar o primeiro acesso.',
    });
  }
};

exports.loginServidor = async (req, res) => {
  try {
    const { email = '', senha = '' } = req.body;

    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Informe e-mail e senha.',
      });
    }

    const firebaseWebApiKey = process.env.FIREBASE_WEB_API_KEY;

    if (!firebaseWebApiKey) {
      return res.status(500).json({
        success: false,
        message: 'FIREBASE_WEB_API_KEY não configurada no servidor.',
      });
    }

    const authResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebApiKey}`,
      {
        email: emailNormalizado,
        password: senha,
        returnSecureToken: true,
      }
    );

    const { localId, idToken } = authResponse.data;

    let snapshot = await db
      .collection('usuarioServidor')
      .where('uid', '==', localId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      snapshot = await db
        .collection('usuarioServidor')
        .where('email', '==', emailNormalizado)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'Cadastro do servidor não encontrado.',
      });
    }

    const doc = snapshot.docs[0];
    const dadosServidor = doc.data();

    if (dadosServidor.ativo !== 'SIM') {
      return res.status(403).json({
        success: false,
        message: 'Usuário servidor sem acesso ativo.',
      });
    }

    const setor = dadosServidor.unidadeGestoraNome || dadosServidor.setor || '';

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso.',
      token: idToken,
      user: {
        uid: dadosServidor.uid || localId,
        nome: dadosServidor.nome || '',
        setor,
        fotoUrl: obterFotoUrlServidor(dadosServidor),
      },
    });
  } catch (error) {
    const firebaseError = error.response?.data?.error?.message;

    if (
      firebaseError === 'INVALID_LOGIN_CREDENTIALS' ||
      firebaseError === 'INVALID_PASSWORD' ||
      firebaseError === 'EMAIL_NOT_FOUND'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Login ou senha inválidos.',
      });
    }

    console.error('Erro no login do servidor:', error.response?.data || error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao realizar login do servidor.',
    });
  }
};

module.exports = {
  primeiroAcessoServidor: exports.primeiroAcessoServidor,
  loginServidor: exports.loginServidor,
};