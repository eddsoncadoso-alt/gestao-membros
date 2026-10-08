# Gestão de Membros

Sistema de gestão de membros para igrejas com autenticação e permissões por perfil, usando Supabase no backend e Cloudflare para hospedagem do front-end.

## Visão geral

Fluxo operacional:
- Admin cria a primeira igreja e o primeiro login master da igreja
- Master cria filiais e logins de filial
- Filial cria membros e logins de membros
- Membro acessa somente seu próprio contexto
- Convites são gerados para cadastro público de membros

## Estrutura do projeto

- `schema.sql` – estrutura principal do banco + triggers + políticas RLS
- `rls.sql` – políticas de acesso (opcional, em caso de uso separado)
- `edge-functions/criar-login/index.ts` – criação de igrejas, filiais, logins, senhas, convites e exclusão
- `edge-functions/cadastro-membro/index.ts` – cadastro público por convite
- `public/index.html` – interface SPA principal
- `public/styles.css` – estilos
- `public/config.js` – configuração do Supabase
- `public/app.js` – lógica da aplicação

## Requisitos

- Projeto Supabase com autenticação habilitada
- Storage opcional para logos de igreja
- Cloudflare Pages ou qualquer host estático para o `/public`
- Edge Functions no Supabase publicadas

## Configuração do Supabase

1. Crie o projeto no Supabase
2. Rode `schema.sql` no SQL editor
3. Rode `rls.sql` se desejar separar políticas
4. Publique as Edge Functions:
   - `criar-login`
   - `cadastro-membro`
5. Ajuste no arquivo `public/config.js`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## Variáveis de ambiente do Supabase

Para as Edge Functions, configure:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Permissões por perfil

- `admin`: responsável pela criação de igrejas e acesso geral
- `master`: gerencia a própria igreja e as filiais
- `filial`: gerencia a própria filial e os membros dela
- `membro`: acesso restrito ao próprio registro

## Deploy no Cloudflare

### Cloudflare Pages
- Conecte o repositório
- Configuração de build: `None`
- Diretório de saída: `/public`

### Cloudflare Workers (opcional)
- Substitua a hospedagem estática por um Worker que sirva o `/public`

## Observações de segurança

- Não exponha a `service_role` no frontend
- Mantenha o JWT verificado nas funções sensíveis
- Use RLS nas tabelas
- Habilite o `Verify JWT` como desligado apenas para `cadastro-membro` e `criar-login` quando necessário e sempre validando permissão internamente

## Dicas de uso

- Crie o primeiro usuário admin pelo dashboard Supabase ou no próprio já autenticado
- Depois de criar a igreja, o primeiro login master é criado automaticamente na Edge Function
- Os logins de filiais e membros são criados pelo perfil responsável
- O convite para cadastro público expira em 7 dias por padrão

## Próximos passos

- Adicionar calendário de eventos e escalas
- Adicionar fluxo de tesouraria
- Melhorar dashboard com gráficos
- Melhorar UX de prateleira de dados

