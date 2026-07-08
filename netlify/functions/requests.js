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
  const store = getBlobStore("requests");
  const method = event.httpMethod;
  const user = context.clientContext && context.clientContext.user;

  if (method === "OPTIONS") return ok({});

  // Envio da solicitação: exige estar logada (participante cadastrada)
  if (method === "POST") {
    if (!user) return err(401, "Faça login ou crie sua conta para solicitar um certificado.");
    let data;
    try { data = JSON.parse(event.body); } catch (e) { return err(400, "JSON inválido"); }
    if (!data.courseTitle) return err(400, "Selecione o curso concluído.");
    const reqObj = {
      id: "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      userId: user.sub,
      studentName: data.studentName || user.user_metadata?.full_name || user.email,
      studentEmail: user.email,
      cpf: data.cpf || "",
      note: data.note || "",
      courseId: data.courseId || "",
      courseTitle: data.courseTitle,
      workload: data.workload || 0,
      location: data.location || null,
      completionDate: data.completionDate,
      status: "pending",
      requestedAt: new Date().toISOString()
    };
    await store.setJSON(reqObj.id, reqObj);
    return ok(reqObj);
  }

  if (method === "GET") {
    const q = event.queryStringParameters || {};
    const { blobs } = await store.list();
    const all = [];
    for (const b of blobs) {
      const val = await store.get(b.key, { type: "json" });
      if (val) all.push(val);
    }
    all.sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));

    // "Minhas solicitações": participante logado vê só as suas
    if (q.mine === "true") {
      if (!user) return err(401, "Não autenticado.");
      return ok(all.filter(r => r.userId === user.sub));
    }

    // Lista completa (fila de aprovação): só administradora
    if (!isAdmin(user)) return err(403, "Apenas a administradora pode ver todas as solicitações.");
    return ok(all);
  }

  if (method === "PATCH") {
    if (!isAdmin(user)) return err(403, "Apenas a administradora pode aprovar/rejeitar solicitações.");
    let data;
    try { data = JSON.parse(event.body); } catch (e) { return err(400, "JSON inválido"); }
    if (!data.id || !data.status) return err(400, "id e status são obrigatórios");
    const reqObj = await store.get(data.id, { type: "json" });
    if (!reqObj) return err(404, "Solicitação não encontrada");
    reqObj.status = data.status;
    await store.setJSON(data.id, reqObj);

    let cert = null;
    if (data.status === "approved") {
      const certStore = getBlobStore("certificates");
      cert = {
        code: genCertCode(),
        studentName: reqObj.studentName,
        cpf: reqObj.cpf,
        studentEmail: reqObj.studentEmail || "",
        userId: reqObj.userId || null,
        courseId: reqObj.courseId,
        courseTitle: reqObj.courseTitle,
        workload: reqObj.workload,
        location: reqObj.location || null,
        issueDate: reqObj.completionDate,
        instructor: data.instructor || "",
        status: "active",
        createdAt: new Date().toISOString()
      };
      await certStore.setJSON(cert.code, cert);
    }
    return ok({ request: reqObj, certificate: cert });
  }

  return err(405, "Método não suportado");
};
