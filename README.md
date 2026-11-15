# site-pronto-gpt
Conteúdo de Site pronto feito pelo GPT para subir na cloudflare.

## Chat de contato

A função `functions/api/contato.js` (rota `POST /api/contato`) envia as mensagens do chat
pela API de Email Sending da Cloudflare. Ela precisa destas variáveis secretas no projeto
do Pages (Settings → Variables and Secrets), no ambiente de produção:

- `CLOUDFLARE_API_TOKEN` — token com permissão de envio de e-mail
- `CLOUDFLARE_ACCOUNT_ID` — ID da conta

Alterações nas variáveis só valem a partir do próximo deploy.
