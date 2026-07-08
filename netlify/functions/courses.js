const { store: getBlobStore } = require("./_blobs");

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
const ok = (body) => ({ statusCode: 200, headers, body: JSON.stringify(body) });
const err = (code, msg) => ({ statusCode: code, headers, body: JSON.stringify({ error: msg }) });

function isAdmin(user) {
  return !!(user && user.app_metadata && Array.isArray(user.app_metadata.roles) && user.app_metadata.roles.includes("admin"));
}

exports.handler = async (event, context) => {
  const store = getBlobStore("courses");
  const method = event.httpMethod;

  if (method === "OPTIONS") return ok({});

  if (method === "GET") {
    const { blobs } = await store.list();
    const courses = [];
    for (const b of blobs) {
      const val = await store.get(b.key, { type: "json" });
      if (val) courses.push(val);
    }
    courses.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    return ok(courses);
  }

  // Todas as operações de escrita exigem login com papel de administradora
  const user = context.clientContext && context.clientContext.user;
  if (!isAdmin(user)) return err(403, "Apenas a administradora pode gerenciar cursos.");

  if (method === "POST" || method === "PUT") {
    let data;
    try { data = JSON.parse(event.body); } catch (e) { return err(400, "JSON inválido"); }
    if (!data.id || !data.title) return err(400, "Campos obrigatórios ausentes (id, title)");
    await store.setJSON(data.id, data);
    return ok(data);
  }

  if (method === "DELETE") {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) return err(400, "Parâmetro 'id' é obrigatório");
    await store.delete(id);
    return ok({ deleted: id });
  }

  return err(405, "Método não suportado");
};
