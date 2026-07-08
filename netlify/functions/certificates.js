const { store: getBlobStore } = require("./_blobs");

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
const ok = (body) => ({ statusCode: 200, headers, body: JSON.stringify(body) });
const err = (code, msg) => ({ statusCode: code, headers, body: JSON.stringify({ error: msg }) });

function isAdmin(user) {
  return !!(user && user.app_metadata && Array.isArray(user.app_metadata.roles) && user.app_metadata.roles.includes("admin"));
}

function genCertCode() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `G3-${year}-${rand}`;
}

exports.handler = async (event, context) => {
  const store = getBlobStore("certificates");
  const method = event.httpMethod;
  const user = context.clientContext && context.clientContext.user;

  if (method === "OPTIONS") return ok({});

  if (method === "GET") {
    const q = event.queryStringParameters || {};

    // Consulta por código: pública (é a validação do certificado)
    if (q.code) {
      const cert = await store.get(q.code.toUpperCase(), { type: "json" });
      if (!cert) return err(404, "Certificado não encontrado");
      return ok(cert);
    }

    const { blobs } = await store.list();
    const all = [];
    for (const b of blobs) {
      const val = await store.get(b.key, { type: "json" });
      if (val) all.push(val);
    }
    all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // "Meus certificados": participante logado vê só os seus (por userId ou e-mail)
    if (q.mine === "true") {
      if (!user) return err(401, "Não autenticado.");
      const mine = all.filter(c => c.userId === user.sub || (c.studentEmail && c.studentEmail.toLowerCase() === (user.email || "").toLowerCase()));
      return ok(mine);
    }

    // Listagem completa: só administradora (contém CPF etc.)
    if (!isAdmin(user)) return err(403, "Apenas a administradora pode ver todos os certificados.");
    return ok(all);
  }

  if (!isAdmin(user)) return err(403, "Apenas a administradora pode emitir/alterar certificados.");

  if (method === "POST") {
    let data;
    try { data = JSON.parse(event.body); } catch (e) { return err(400, "JSON inválido"); }
    if (!data.studentName || !data.courseTitle) return err(400, "Campos obrigatórios ausentes");
    const cert = {
      code: genCertCode(),
      studentName: data.studentName,
      cpf: data.cpf || "",
      studentEmail: data.studentEmail || "",
      userId: data.userId || null,
      courseId: data.courseId || "",
      courseTitle: data.courseTitle,
      workload: data.workload || 0,
      issueDate: data.issueDate,
      instructor: data.instructor || "",
      status: "active",
      createdAt: new Date().toISOString()
    };
    await store.setJSON(cert.code, cert);
    return ok(cert);
  }

  if (method === "PATCH") {
    let data;
    try { data = JSON.parse(event.body); } catch (e) { return err(400, "JSON inválido"); }
    if (!data.code || !data.status) return err(400, "code e status são obrigatórios");
    const cert = await store.get(data.code, { type: "json" });
    if (!cert) return err(404, "Certificado não encontrado");
    cert.status = data.status;
    await store.setJSON(data.code, cert);
    return ok(cert);
  }

  return err(405, "Método não suportado");
};
