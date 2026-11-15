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
    ".faixa-destaques > div, .sobre-selo, .sobre-conteudo, .cabecalho-secao, .card-video, .videos-cta, .canal-card, .contato-grid > *"
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

  // Chat de contato: abre a caixa, valida e envia para /api/contato.
  const chatBotao = document.querySelector(".chat-botao");
  const chatCaixa = document.querySelector("#chat-caixa");
  if (chatBotao && chatCaixa) {
    const form = chatCaixa.querySelector(".chat-form");
    const aviso = chatCaixa.querySelector(".chat-aviso");
    const sucesso = chatCaixa.querySelector(".chat-sucesso");
    const enviar = chatCaixa.querySelector(".chat-enviar");
    const textoEnviar = enviar.innerHTML;
    const emailValido = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

    const abrirChat = (abrir) => {
      chatCaixa.hidden = !abrir;
      chatBotao.setAttribute("aria-expanded", String(abrir));
      chatBotao.setAttribute("aria-label", abrir ? "Fechar chat de contato" : "Abrir chat de contato");
      if (abrir) (form.hidden ? sucesso.querySelector("button") : form.elements.nome).focus();
    };
    const mostraAviso = (texto) => { aviso.textContent = texto; aviso.hidden = !texto; };

    chatBotao.addEventListener("click", () => abrirChat(chatCaixa.hidden));
    chatCaixa.querySelector(".chat-fechar").addEventListener("click", () => { abrirChat(false); chatBotao.focus(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !chatCaixa.hidden) { abrirChat(false); chatBotao.focus(); }
    });
    // Volta da confirmação para o formulário vazio.
    let timerSucesso;
    const voltaAoFormulario = () => {
      clearTimeout(timerSucesso);
      if (sucesso.hidden) return;
      const focoNaConfirmacao = sucesso.contains(document.activeElement);
      sucesso.hidden = true;
      form.hidden = false;
      if (focoNaConfirmacao && !chatCaixa.hidden) form.elements.nome.focus();
    };
    sucesso.querySelector(".chat-nova").addEventListener("click", voltaAoFormulario);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nome = form.elements.nome.value.trim();
      const email = form.elements.email.value.trim();
      const mensagem = form.elements.mensagem.value.trim();

      if (!nome || nome.length > 80) return mostraAviso("Informe seu nome (até 80 caracteres).");
      if (email.length > 120 || !emailValido.test(email)) return mostraAviso("Informe um e-mail válido.");
      if (mensagem.length < 5 || mensagem.length > 2000) return mostraAviso("A mensagem deve ter de 5 a 2000 caracteres.");
      mostraAviso("");

      enviar.disabled = true;
      enviar.textContent = "Enviando…";
      try {
        const resposta = await fetch("/api/contato", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, mensagem, site: form.elements.site.value }),
        });
        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok || !dados || !dados.ok) throw new Error("falha");
        form.reset();
        form.hidden = true;
        sucesso.hidden = false;
        sucesso.querySelector("button").focus();
        // A confirmação fica visível só por alguns segundos.
        timerSucesso = setTimeout(voltaAoFormulario, 5000);
      } catch {
        mostraAviso("Não foi possível enviar agora. Tente novamente em instantes.");
      } finally {
        enviar.disabled = false;
        enviar.innerHTML = textoEnviar;
      }
    });
  }

  // Atualiza automaticamente o ano do rodapé.
  const ano = document.querySelector("#ano");
  if (ano) ano.textContent = new Date().getFullYear();
});
