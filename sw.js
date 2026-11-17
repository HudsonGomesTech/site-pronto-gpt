// Service worker do PWA: permite instalar o site e abri-lo mesmo sem internet.
// Ao mudar a lista de arquivos ou a estratégia, aumente a versão abaixo.
const VERSAO = "hgt-v1";

const ARQUIVOS_BASE = [
  "/",
  "/css/estilo.css",
  "/js/script.js",
  "/manifest.webmanifest",
  "/img/favicon.svg",
  "/img/servidor.svg",
  "/img/servidor-card.svg",
  "/img/site.svg",
  "/img/terminal.svg",
  "/img/icons/icon-192.png",
  "/img/icons/icon-512.png"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSAO)
      .then((cache) => cache.addAll(ARQUIVOS_BASE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  const url = new URL(pedido.url);

  // Só cuida de GETs do próprio site; a API de contato sempre vai para a rede.
  if (pedido.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  // Páginas: tenta a rede primeiro (conteúdo sempre atualizado) e cai no cache se estiver offline.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => {
          if (resposta.ok && url.pathname === "/") {
            const copia = resposta.clone();
            caches.open(VERSAO).then((cache) => cache.put("/", copia));
          }
          return resposta;
        })
        .catch(() => caches.match(pedido, { ignoreSearch: true }).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Arquivos estáticos: responde do cache na hora e atualiza em segundo plano.
  evento.respondWith(
    caches.open(VERSAO).then((cache) =>
      cache.match(pedido).then((emCache) => {
        const daRede = fetch(pedido)
          .then((resposta) => {
            if (resposta.ok) cache.put(pedido, resposta.clone());
            return resposta;
          })
          .catch(() => emCache);
        if (emCache) {
          evento.waitUntil(daRede);
          return emCache;
        }
        return daRede;
      })
    )
  );
});
