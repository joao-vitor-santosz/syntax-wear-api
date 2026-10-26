---
description: "Use para trabalho em TypeScript, Fastify, Prisma, autenticação e API de produtos no backend do Syntax Wear."
applyTo: "src/**/*.ts, prisma/**/*.ts, *.json, *.ts"
---

# Instruções da API Syntax Wear

Este repositório é um backend em Fastify + TypeScript + Prisma para a API de e-commerce Syntax Wear.

## Convenções do projeto

- Use TypeScript com imports ESM e inclua extensões `.js` nos imports locais, seguindo o estilo atual do projeto (por exemplo `./routes/products.routes.js`).
- Mantenha a estrutura da aplicação alinhada com as camadas atuais: `routes/` -> `controllers/` -> `services/` -> `utils/` e acesso ao Prisma.
- Prefira controladores enxutos e lógica de negócio dentro dos módulos de serviço.
- Use Prisma pelo singleton em `src/utils/prisma.ts`; evite acesso direto ao banco em rotas ou controladores.
- Valide payloads de requisição com schemas Zod definidos em `src/utils/validators.ts` antes de chegar aos serviços.
- Preserve a linguagem em português da API e das mensagens visíveis ao usuário ao adicionar validações ou erros.
- Use `async/await` e códigos de status explícitos para erros de negócio; não esconda exceções.
- Mantenha a lógica de autenticação e autorização consistente com a configuração do JWT do Fastify em `src/app.ts` e o middleware em `src/middlewares/`.

## Regras de API e dados

- Mantenha a organização REST em `src/routes/` com prefixos claros como `/auth` e `/products`.
- Mantenha as operações de CRUD consistentes com a nomenclatura atual dos modelos Prisma (`User`, `Product`) e convenções do schema em `prisma/schema.prisma`.
- Quando uma funcionalidade mexer em dados de produtos, respeite campos como `slug`, `price`, `stock`, `active`, `sizes`, `colors` e `images`.
- Quando mexer em autenticação, use bcrypt para hash de senha e fluxo JWT consistente com os padrões existentes.
- Trate campos únicos duplicados (`email`, `cpf`, `slug`) com erros explícitos de conflito usando `statusCode` como `400`, `409` ou `404` quando apropriado.

## Expectativas de qualidade de código

- Priorize código explícito e legível em vez de abstrações sofisticadas.
- Prefira funções pequenas e reutilizáveis em vez de duplicação de validação ou lógica Prisma.
- Mantenha imports organizados e evite variáveis não usadas ou código morto.
- Não adicione mudanças amplas em frameworks ou bibliotecas, a menos que a tarefa exija isso explicitamente.
- Prefira edições mínimas e cirúrgicas que respeitem a estrutura e os nomes dos arquivos existentes.

## Validação

- Após alterar código TypeScript, execute a build do projeto com `npm run build` quando possível.
- Se a mudança afetar modelos Prisma ou schema do banco, também garanta que o fluxo Prisma continue correto, incluindo migração e geração quando relevante.
- Ao atualizar comportamento da API, verifique se a semântica dos endpoints acompanha os padrões existentes de Fastify e Prisma, em vez de introduzir outro estilo.

## Padrões preferidos

- Use `findUnique`, `findMany`, `create`, `update` e `count` com Prisma para acesso ao banco.
- Transforme ou converta dados nas camadas de serviço e não nas rotas.
- Mantenha os handlers de rota focados em parsing de requisição e formatação de resposta.
- Reutilize validadores e padrões de resposta existentes em vez de criar convenções paralelas.

Este projeto deve continuar com a aparência de um backend limpo em Fastify + Prisma: validação explícita, arquitetura em camadas e acesso direto ao banco sem complicação.