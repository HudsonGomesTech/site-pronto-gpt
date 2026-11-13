// Interações simples do site — sem bibliotecas externas.
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

  // Atualiza automaticamente o ano do rodapé.
  const ano = document.querySelector("#ano");
  if (ano) ano.textContent = new Date().getFullYear();
});
