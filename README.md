# Livefy

Plataforma de produção para TikTok Shop LIVE, lives interativas de games e fluxos criativos com IA.

## Desenvolvimento local

Requisitos: Node.js 20 ou superior.

```bash
npm ci
npm run dev
```

A aplicação será iniciada em `http://127.0.0.1:3000` quando a porta estiver disponível.

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy na Vercel

O projeto utiliza Vite e gera os arquivos de produção em `dist`. A configuração está em `vercel.json`.

Não adicione credenciais de provedores de IA em variáveis prefixadas com `VITE_`: essas variáveis ficam disponíveis no navegador. As futuras integrações com Seedance e Kling devem usar funções server-side e variáveis protegidas da Vercel.
