const axios = require('axios');
const { admin, db } = require('../firebase/admin');
const { v4: uuidv4 } = require('uuid');

const bucket = admin.storage().bucket();

function somenteNumeros(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function emailValido(email) {
  return /\S+@\S+\.\S+/.test(String(email || '').trim());
}

async function excluirUsuarioAuthSeExistir(uid) {
  if (!uid) return;

  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    console.error('Erro ao fazer rollback no Firebase Auth:', error.message);
  }
}

async function excluirArquivoSeExistir(caminhoArquivo) {
  if (!caminhoArquivo) return;

  try {
    await bucket.file(caminhoArquivo).delete();
  } catch (error) {
    console.error('Erro ao excluir arquivo no rollback do Storage:', error.message);
  }
}

async function criarUsuario(req, res) {
  let authUser = null;
  let storageFilePath = '';
  let authUserCriadoAgora = false;

  try {
    const {
      nome,
      cpf,
      endereco,
      bairro,
      cep,
      pontoReferencia,
      email,
      senha,
    } = req.body;

    const nomeTratado = String(nome || '').trim();
    const cpfLimpo = somenteNumeros(cpf);
    const enderecoTratado = String(endereco || '').trim();
    const bairroTratado = String(bairro || '').trim();
    const cepLimpo = somenteNumeros(cep);
    const pontoReferenciaTratado = String(pontoReferencia || '').trim();
    const emailNormalizado = String(email || '').trim().toLowerCase();
    const senhaTratada = String(senha || '');

    if (
      !nomeTratado ||
      !cpfLimpo ||
      !enderecoTratado ||
      !bairroTratado ||
      !cepLimpo ||
      !pontoReferenciaTratado ||
      !emailNormalizado ||
      !senhaTratada
    ) {
      return res.status(400).json({
        success: false,
        message: 'Preencha todos os campos obrigatórios.',
      });
    }

    if (cpfLimpo.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'CPF inválido. Informe 11 dígitos.',
      });
    }

    if (cepLimpo.length !== 8) {
      return res.status(400).json({
        success: false,
        message: 'CEP inválido. Informe 8 dígitos.',
      });
    }

    if (!emailValido(emailNormalizado)) {
      return res.status(400).json({
        success: false,
        message: 'Informe um e-mail válido.',
      });
    }

    if (senhaTratada.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres.',
      });
    }

    const cpfExistenteSnapshot = await db
      .collection('Usuarios')
      .where('cpf', '==', cpfLimpo)
      .limit(1)
      .get();

    if (!cpfExistenteSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um usuário cadastrado com este CPF.',
      });
    }

    const emailExistenteSnapshot = await db
      .collection('Usuarios')
      .where('email', '==', emailNormalizado)
      .limit(1)
      .get();

    if (!emailExistenteSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um usuário cadastrado com este e-mail.',
      });
    }

    try {
      authUser = await admin.auth().getUserByEmail(emailNormalizado);
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    if (!authUser) {
      try {
        authUser = await admin.auth().createUser({
          email: emailNormalizado,
          password: senhaTratada,
          displayName: nomeTratado,
        });
        authUserCriadoAgora = true;
      } catch (error) {
        if (error.code === 'auth/invalid-password') {
          return res.status(400).json({
            success: false,
            message: 'Senha inválida.',
          });
        }

        if (error.code === 'auth/invalid-email') {
          return res.status(400).json({
            success: false,
            message: 'E-mail inválido.',
          });
        }

        throw error;
      }
    }

    const usuarioExistentePorUid = await db.collection('Usuarios').doc(authUser.uid).get();

    if (usuarioExistentePorUid.exists) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um usuário cadastrado com este e-mail.',
      });
    }

    let fotoUrl = '';

    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    if (req.file && req.file.buffer) {
      console.log('Arquivo recebido:', req.file.originalname);
      console.log('Mimetype:', req.file.mimetype);
      console.log('Tamanho:', req.file.size);

      storageFilePath = `usuarios/${authUser.uid}/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(storageFilePath);
      const token = uuidv4();

      await file.save(req.file.buffer, {
        resumable: false,
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: token,
          },
        },
      });

      fotoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storageFilePath)}?alt=media&token=${token}`;

      console.log('fotoUrl gerada:', fotoUrl);    
    }

    
    await db.collection('Usuarios').doc(authUser.uid).set({
      uid: authUser.uid,
      nome: nomeTratado,
      cpf: cpfLimpo,
      endereco: enderecoTratado,
      bairro: bairroTratado,
      cep: cepLimpo,
      pontoReferencia: pontoReferenciaTratado,
      email: emailNormalizado,
      fotoUrl,
      ativo: true,
      dataCadastro: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso.',
      data: {
        uid: authUser.uid,
        nome: nomeTratado,
        email: emailNormalizado,
        fotoUrl,
      },
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    console.error('req.body:', req.body);
    console.error('req.file:', req.file);

    if (storageFilePath) {
      await excluirArquivoSeExistir(storageFilePath);
    }

    if (authUserCriadoAgora && authUser && authUser.uid) {
      await excluirUsuarioAuthSeExistir(authUser.uid);
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno ao criar usuário.',
      error: error.message,
    });
  }
}

async function loginUsuario(req, res) {
  try {
    const { email, senha } = req.body;
    const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY; 

    // 1. Autentica com a API REST do Firebase
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        email,
        password: senha,
        returnSecureToken: true,
      }
    );

    const { localId, idToken } = response.data;

    // 2. Busca os dados complementares no Firestore
    const userDoc = await db.collection('Usuarios').doc(localId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'Dados do usuário não encontrados.' });
    }

    const userData = userDoc.data();

    return res.status(200).json({
      success: true,
      token: idToken,
      user: {
        uid: localId,
        nome: userData.nome,
        email: userData.email,
        fotoUrl: userData.fotoUrl
      }
    });
  } catch (error) {
    //ERRO REAL NO TERMINAL:
    console.log("ERRO REAL DO FIREBASE:", error.response?.data?.error);
    console.error('Erro no login:', error.response?.data?.error?.message || error.message);
    return res.status(401).json({ 
      success: false, 
      message: 'E-mail ou senha incorretos.' 
    });
  }
}

exports.getMeuCadastro = async (req, res) => {
  try {
    const uid = req.user.uid;

    const userDoc = await db.collection('Usuarios').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: userDoc.id,
        ...userDoc.data(),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar meu cadastro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao buscar cadastro.',
    });
  }
};

exports.atualizarMeuCadastro = async (req, res) => {
  try {
    const uid = req.user.uid;

    const {
      bairro = '',
      cep = '',
      email = '',
      endereco = '',
      nome = '',
      pontoReferencia = '',
      cpf = '',
    } = req.body;

    const userRef = db.collection('Usuarios').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado.',
      });
    }

    const dadosAtuais = userDoc.data();

    const emailNormalizado = email.trim().toLowerCase();
    const cpfNormalizado = cpf.trim();

    if (emailNormalizado) {
      const emailSnapshot = await db
        .collection('Usuarios')
        .where('email', '==', emailNormalizado)
        .get();

      const emailEmUsoPorOutroUsuario = emailSnapshot.docs.some(
        (doc) => doc.id !== uid
      );

      if (emailEmUsoPorOutroUsuario) {
        return res.status(400).json({
          success: false,
          message: 'Este e-mail já está cadastrado para outro usuário.',
        });
      }
    }

    if (cpfNormalizado) {
      const cpfSnapshot = await db
        .collection('Usuarios')
        .where('cpf', '==', cpfNormalizado)
        .get();

      const cpfEmUsoPorOutroUsuario = cpfSnapshot.docs.some(
        (doc) => doc.id !== uid
      );

      if (cpfEmUsoPorOutroUsuario) {
        return res.status(400).json({
          success: false,
          message: 'Este CPF já está cadastrado para outro usuário.',
        });
      }
    }

    let novaFotoUrl = dadosAtuais.fotoUrl || '';

    if (req.file) {
      const extensao = req.file.originalname.split('.').pop();
      const caminhoArquivo = `usuarios/${uid}/perfil-${Date.now()}.${extensao}`;
      const file = bucket.file(caminhoArquivo);

      await file.save(req.file.buffer, {
        resumable: false,
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      const [urlAssinada] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
      });

      novaFotoUrl = urlAssinada;
    }

    const updateData = {
      bairro: bairro.trim(),
      cep: cep.trim(),
      email: emailNormalizado,
      endereco: endereco.trim(),
      fotoUrl: novaFotoUrl,
      nome: nome.trim(),
      pontoReferencia: pontoReferencia.trim(),
      dataAtualizacao: admin.firestore.Timestamp.now(),
    };

    if (cpfNormalizado) {
      updateData.cpf = cpfNormalizado;
    }

    await userRef.update(updateData);

    if (
      emailNormalizado &&
      dadosAtuais.email &&
      emailNormalizado !== dadosAtuais.email.toLowerCase()
    ) {
      await admin.auth().updateUser(uid, {
        email: emailNormalizado,
      });
    }

    const updatedDoc = await userRef.get();

    return res.status(200).json({
      success: true,
      message: 'Cadastro atualizado com sucesso.',
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar meu cadastro:', error);

    return res.status(500).json({
      success: false,
      message: 'Erro interno ao atualizar cadastro.',
    });
  }
};

exports.alterarMinhaSenha = async (req, res) => {
  try {
    const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;
    const uid = req.user.uid;
    const email = req.user.email;

    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
      return res.status(400).json({
        success: false,
        message: 'Preencha senha atual, nova senha e confirmação da nova senha.',
      });
    }

    if (novaSenha !== confirmarNovaSenha) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha e a confirmação da nova senha não coincidem.',
      });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter pelo menos 6 caracteres.',
      });
    }

    const firebaseWebApiKey = process.env.FIREBASE_WEB_API_KEY;

    if (!firebaseWebApiKey) {
      return res.status(500).json({
        success: false,
        message: 'FIREBASE_WEB_API_KEY não configurada no servidor.',
      });
    }

    try {
      await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebApiKey}`,
        {
          email,
          password: senhaAtual,
          returnSecureToken: true,
        }
      );
    } catch (error) {
      const firebaseError = error.response?.data?.error?.message;

      if (
        firebaseError === 'INVALID_LOGIN_CREDENTIALS' ||
        firebaseError === 'INVALID_PASSWORD' ||
        firebaseError === 'EMAIL_NOT_FOUND'
      ) {
        return res.status(401).json({
          success: false,
          message: 'A senha atual informada está incorreta.',
        });
      }

      console.error('Erro ao validar senha atual no Firebase:', error.response?.data || error.message);

      return res.status(500).json({
        success: false,
        message: 'Não foi possível validar a senha atual.',
      });
    }

    await admin.auth().updateUser(uid, {
      password: novaSenha,
    });

    return res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno ao alterar senha.',
    });
  }
};

module.exports = {
  criarUsuario,
  loginUsuario,
  getMeuCadastro: exports.getMeuCadastro,
  atualizarMeuCadastro: exports.atualizarMeuCadastro,
  alterarMinhaSenha: exports.alterarMinhaSenha,
};