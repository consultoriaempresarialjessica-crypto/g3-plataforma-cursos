const { getStore } = require("@netlify/blobs");

// Em alguns projetos, o Netlify não injeta automaticamente as credenciais do Blobs
// dentro da function (bug conhecido: MissingBlobsEnvironmentError). Este helper usa
// as credenciais explícitas (BLOBS_SITE_ID / BLOBS_TOKEN, configuradas em
// Project configuration > Environment variables) quando disponíveis, e cai para o
// comportamento automático padrão caso contrário.
function store(name) {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name, siteID, token });
  }
  return getStore(name);
}

module.exports = { store };
