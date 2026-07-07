const { getStore } = require("@netlify/blobs");

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
const ok = (body) => ({ statusCode: 200, headers, body: JSON.stringify(body) });
const err = (code, msg) => ({ statusCode: code, headers, body: JSON.stringify({ error: msg }) });

function isAdmin(user) {
  return !!(user && user.app_metadata && Array.isArray(user.app_metadata.roles) && user.app_metadata.roles.includes("admin"));
}

// Limite prático por causa do tamanho máximo de requisição das Netlify Functions (~6MB).
// Como o arquivo chega em base64 (~33% maior), o limite real de arquivo fica por volta de 4MB.
const MAX_BYTES = 4 * 1024 * 1024;

exports.handler = async (event, context) => {
  const method = event.httpMethod;
  if (method === "OPTIONS") return ok({});
  if (method !== "POST") return err(405, "Método não suportado");

  const user = context.clientContext && context.clientContext.user;
  if (!isAdmin(user)) return err(403, "Apenas a administradora pode enviar materiais.");

  let data;
  try { data = JSON.parse(event.body); } catch (e) { return err(400, "JSON inválido"); }
  const { filename, contentType, dataBase64 } = data || {};
  if (!filename || !dataBase64) return err(400, "filename e dataBase64 são obrigatórios");

  const buffer = Buffer.from(dataBase64, "base64");
  if (buffer.length > MAX_BYTES) {
    return err(413, `Arquivo muito grande (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Limite de ${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB — para vídeos ou PDFs grandes, use um link do YouTube/Vimeo/Google Drive.`);
  }

  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const key = `${Date.now()}-${safeName}`;

  const store = getStore("files");
  await store.set(key, buffer, { metadata: { contentType: contentType || "application/octet-stream", filename: safeName } });

  return ok({ key, url: `/api/file?key=${encodeURIComponent(key)}` });
};
