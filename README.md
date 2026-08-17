# Livefy

Plataforma de produção para TikTok Shop LIVE, lives interativas de games e fluxos criativos com IA.

## Desenvolvimento local

Requisitos: Node.js 20 ou superior.

```bash
npm ci
npm run dev
```

A aplicação será iniciada em `http://127.0.0.1:3000` quando a porta estiver disponível.

Copie `.env.example` para `.env.local`. A URL e a chave pública `publishable` do Supabase são usadas pelo navegador; `UNIFICALLY_API_KEY` é lida somente pela função server-side. Tokens pessoais, chaves `service_role` e senhas nunca devem ser usados no frontend.

## Banco e autenticação

O schema versionado está em `supabase/migrations`. As tabelas operacionais começam vazias e são protegidas por Row Level Security (RLS); cada usuário acessa somente os workspaces aos quais pertence.

O login, cadastro e recuperação de senha usam o Supabase Auth. Dados de produtos, sessões, eventos, comentários, mídia, automações, diagnósticos e workflows vêm exclusivamente da Supabase, sem fallback de demonstração.

## Verificações

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy na Vercel

O projeto utiliza Vite e gera os arquivos de produção em `dist`. A configuração está em `vercel.json`.

Não adicione credenciais de provedores de IA em variáveis prefixadas com `VITE_`: essas variáveis ficam disponíveis no navegador.

## Vídeo com Unifically

O canvas apresenta o catálogo de IAs de vídeo no clique direito. Cada modelo cria um nó com seu próprio schema de entrada: geração por texto, primeiro/último frame, referências, edição de vídeo, extensão, upscale, multi-shot ou motion control.

As chamadas passam por `api/unifically.mjs`, que valida a sessão Supabase antes de encaminhar a tarefa para `POST /v1/tasks`. Configure `UNIFICALLY_API_KEY` como variável protegida no ambiente local e na Vercel para ativar gerações reais. O frontend acompanha o `task_id` até a conclusão sem receber a chave do provedor.
