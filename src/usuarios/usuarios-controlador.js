const Usuario = require('./usuarios-modelo');
const { InvalidArgumentError, InternalServerError } = require('../erros');
const jwt = require('jsonwebtoken');
const blocklist = require('../../redis/blocklist-access-token');
const crypto = require('crypto');
const moment = require('moment');
const allowlistRefreshToken = require('../../redis/allowlist-refresh-token');

function criarTokenJWT (usuario) {
  const payload = {
    id: usuario.id
  };

  const token = jwt.sign(payload, process.env.CHAVE_JWT, {expiresIn: '15m'}); //time da validação do token
  return token;
}

async function criarTokenOpaco(usuario) {
  const tokenOpaco = crypto.randomBytes(24).toString('hex');
  const dataExpiracao = moment().add(5, 'd').unix();
  await allowlistRefreshToken.adiciona(tokenOpaco, usuario.id, dataExpiracao);
  return tokenOpaco;
}

module.exports = {
  async adiciona (req, res) {
    const { nome, email, senha } = req.body;

    try {
      const usuario = new Usuario({
        nome,
        email
      });

      await usuario.adicionaSenha(senha);
      await usuario.adiciona();

      res.status(201).json();
    } catch (erro) {
      if (erro instanceof InvalidArgumentError) {
        res.status(422).json({ erro: erro.message });
      } 
        res.status(500).json({ erro: erro.message });
    }
  },

  async login (req, res) {
    try {
      const accessToken = criarTokenJWT(req.user);
      const refreshToken = await criarTokenOpaco(req.user);
      res.set('Authorization', accessToken);
      res.status(200).json({ refreshToken });
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }
  },

  async logout (req, res) {
    try {
      const token = req.token;
      await blocklist.adiciona(token);
      res.status(204).json();
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }
  },

  async lista (req, res) {
    try {
      const usuarios = await Usuario.lista();
      res.json(usuarios);
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }
  },

  async deleta (req, res) {
    try {
      const usuario = await Usuario.buscaPorId(req.params.id);
      await usuario.deleta();
      res.status(200).json();
    } catch (erro) {
      res.status(500).json({ erro: erro });
    }
  }
};