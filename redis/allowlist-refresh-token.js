const redis = require('redis');
const manipulaLista = require('./manipula-lista');
const allowlist = redis.createClient({prefix: 'allowlist-refresh-token'});

// Recebemos todas as informações do manipulaLista e conectamos com o Allowlist
module.exports = manipulaLista(allowlist);