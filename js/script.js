// Interações simples do site — sem bibliotecas externas.
document.documentElement.classList.add("js");
document.addEventListener("DOMContentLoaded", () => {
  const botaoMenu = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#menu-principal");

  // Abre e fecha o menu em telas menores.
  if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", () => {
      const aberto = menu.classList.toggle("aberto");
      botaoMenu.setAttribute("aria-expanded", String(aberto));
      botaoMenu.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });

    // Fecha o menu após selecionar uma seção.
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("aberto");
        botaoMenu.setAttribute("aria-expanded", "false");
        botaoMenu.setAttribute("aria-label", "Abrir menu");
      });
    });
  }

  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Barra de progresso de leitura.
  const barra = document.createElement("div");
  barra.className = "barra-progresso";
  barra.setAttribute("aria-hidden", "true");
  document.body.prepend(barra);
  const atualizaProgresso = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.setProperty("--progresso", max > 0 ? window.scrollY / max : 0);
  };
  window.addEventListener("scroll", atualizaProgresso, { passive: true });
  atualizaProgresso();

  // Revela os elementos conforme aparecem na tela.
  const alvos = document.querySelectorAll(
    ".faixa-destaques > div, .sobre-selo, .sobre-conteudo, .cabecalho-secao, .card-video, .videos-cta, .chamada-inner, .contato-grid > *"
  );
  if ("IntersectionObserver" in window && !reduzMovimento) {
    alvos.forEach((el) => {
      el.classList.add("revelar");
      const irmaos = Array.from(el.parentElement.children);
      el.style.setProperty("--atraso", `${irmaos.indexOf(el) * 0.12}s`);
    });
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visivel");
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15 });
    alvos.forEach((el) => observador.observe(el));
  }

  // Cards inclinam em 3D e a luz segue o mouse.
  document.querySelectorAll(".card-video").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      if (!reduzMovimento && e.pointerType === "mouse") {
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-5px)`;
      }
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  // Contador "carregando" no cartão seu-site.local (0% → 100%).
  const contador = document.querySelector(".flutuante-base b");
  if (contador && !reduzMovimento) {
    let valor = 0;
    contador.textContent = "0%";
    const passo = () => {
      valor = Math.min(100, valor + Math.ceil((100 - valor) / 12));
      contador.textContent = `${valor}%`;
      if (valor < 100) setTimeout(passo, 60);
    };
    setTimeout(passo, 900);
  }

  // Atualiza automaticamente o ano do rodapé.
  const ano = document.querySelector("#ano");
  if (ano) ano.textContent = new Date().getFullYear();
});
