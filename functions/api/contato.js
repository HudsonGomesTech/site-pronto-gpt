// Função do Cloudflare Pages: recebe a mensagem do chat de contato e envia
// por e-mail usando a API de Email Sending da Cloudflare.
// Rota: POST /api/contato

// Remetente e destinatário são fixos: nada do formulário altera estes valores.
const REMETENTE = "site@hudsongomestech.com.br";
const DESTINATARIO = "contato@hudsongomestech.com.br";

const LIMITE_CORPO = 10000; // bytes aceitos no pedido
const EMAIL_VALIDO = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const CONTROLE = /[\u0000-\u001f\u007f]/; // quebras de linha e outros caracteres de controle

function responder(status, dados, extras = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extras },
  });
}

const ERRO_GENERICO = { ok: false, erro: "Não foi possível enviar sua mensagem agora. Tente novamente em instantes." };
const ERRO_DADOS = { ok: false, erro: "Confira o nome, o e-mail e a mensagem e tente novamente." };

function escaparHtml(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validar(dados) {
  if (!dados || typeof dados !== "object") return null;
  const { nome, email, mensagem } = dados;
  if (typeof nome !== "string" || typeof email !== "string" || typeof mensagem !== "string") return null;

  const n = nome.trim();
  const e = email.trim();
  const m = mensagem.trim();

  if (n.length < 1 || n.length > 80 || CONTROLE.test(n)) return null;
  if (e.length > 120 || CONTROLE.test(e) || !EMAIL_VALIDO.test(e)) return null;
  if (m.length < 5 || m.length > 2000) return null;

  return { nome: n, email: e, mensagem: m };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return responder(405, { ok: false, erro: "Método não permitido." }, { Allow: "POST" });
  }

  // Só aceita pedidos vindos do próprio site.
  const origem = request.headers.get("Origin");
  if (!origem || origem !== new URL(request.url).origin) {
    return responder(403, { ok: false, erro: "Origem não permitida." });
  }

  let dados;
  try {
    const bruto = await request.text();
    if (bruto.length > LIMITE_CORPO) return responder(413, ERRO_DADOS);
    dados = JSON.parse(bruto);
  } catch {
    return responder(400, ERRO_DADOS);
  }

  // Armadilha contra robôs: campo oculto preenchido → finge que enviou.
  if (dados && typeof dados.site === "string" && dados.site.trim() !== "") {
    return responder(200, { ok: true });
  }

  const valido = validar(dados);
  if (!valido) return responder(400, ERRO_DADOS);

  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
    console.error("contato: variáveis de configuração ausentes");
    return responder(500, ERRO_GENERICO);
  }

  const { nome, email, mensagem } = valido;
  const texto = `Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}\n`;
  const html =
    `<p><strong>Nome:</strong> ${escaparHtml(nome)}</p>` +
    `<p><strong>E-mail:</strong> ${escaparHtml(email)}</p>` +
    `<p><strong>Mensagem:</strong></p>` +
    `<p style="white-space:pre-wrap">${escaparHtml(mensagem)}</p>`;

  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/email/sending/send`;

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: DESTINATARIO,
        from: REMETENTE,
        subject: `Mensagem pelo site - ${nome}`,
        text: texto,
        html,
      }),
    });

    let resultado = null;
    try { resultado = await resposta.json(); } catch { /* corpo não-JSON */ }

    if (!resposta.ok || !resultado || resultado.success !== true) {
      // Registra só o status e os códigos de erro da API, sem dados sensíveis.
      const codigos = Array.isArray(resultado?.errors) ? resultado.errors.map((e) => e?.code).join(",") : "";
      console.error(`contato: falha no envio (status ${resposta.status}${codigos ? `, códigos ${codigos}` : ""})`);
      return responder(502, ERRO_GENERICO);
    }

    return responder(200, { ok: true });
  } catch {
    console.error("contato: erro de rede ao chamar a API de e-mail");
    return responder(502, ERRO_GENERICO);
  }
}
