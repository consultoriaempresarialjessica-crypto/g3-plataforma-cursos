const { store: getBlobStore } = require("./_blobs");

exports.handler = async (event) => {
  const key = event.queryStringParameters && event.queryStringParameters.key;
  if (!key) {
    return { statusCode: 400, body: "Parâmetro 'key' é obrigatório" };
  }

  const store = getBlobStore("files");
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });

  if (!result) {
    return { statusCode: 404, body: "Arquivo não encontrado" };
  }

  const { data, metadata } = result;
  const contentType = (metadata && metadata.contentType) || "application/octet-stream";
  const filename = (metadata && metadata.filename) || "arquivo";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*"
    },
    body: Buffer.from(data).toString("base64"),
    isBase64Encoded: true
  };
};
