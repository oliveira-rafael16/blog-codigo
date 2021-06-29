const redis = require('redis');
const blocklist = redis.createClient({ prefix: 'blocklist-access-token:'});
const manipulaLista = require('./manipula-lista');
const manipulaBlocklist = manipulaLista(blocklist);

const { promisify } = require('util');
const existAsync = promisify(blocklist.exists).bind(blocklist);
const setAsync = promisify(blocklist.set).bind(blocklist);

const jwt = require('jsonwebtoken');
const { createHash } = require('crypto');

function geraTokenHash(token) {
    return createHash('sha256').update(token).digest('hex');
}

module.exports = {
    async adiciona(token) {
        // forma para adicionar o token pelo redis
        const dataExpiracao = jwt.decode(token).exp;
        const tokenHash = geraTokenHash(token);
        await manipulaBlocklist.adiciona(tokenHash, '', dataExpiracao);
    },
    async contemToken (token) {
        // forma para validar o token no redis
        const tokenHash = geraTokenHash(token);
        return manipulaBlocklist.contemChave(tokenHash);
    }
}