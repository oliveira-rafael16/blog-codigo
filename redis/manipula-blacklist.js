const blacklist = require('./blacklist');

const { promisify } = require('util');
const existAsync = promisify(blacklist.exists).bind(blacklist);
const setAsync = promisify(blacklist.set).bind(blacklist);

const jwt = require('jsonwebtoken');
const { createHash } = require('crypto');

function geraTokenHash(token) {
    return createHash('sha256')
        .update(token)
        .digest('hex');
}

module.exports = {
    adiciona: async token => {
        // forma para adicionar o token pelo redis
        const dataExpiracao = jwt.decode(token).exp;
        const tokenHash = geraTokenHash(token);
        await setAsync(tokenHash, '');
        blacklist.expireat(tokenHash, dataExpiracao);
    },
    contemToken: async token => {
        // forma para validar o token no redis
        const tokenHash = geraTokenHash(token);
        const resultado = await existAsync(tokenHash);
        return resultado == 1;
    }
}