---
description: "Use para trabalho em TypeScript, Fastify, Prisma, autenticação, catalogo de produtos e categorias no backend do Syntax Wear."
applyTo: "src/**/*.ts, prisma/**/*.ts, *.json, *.ts"
---

# Instruções da API Syntax Wear

Este repositório é um backend em Fastify + TypeScript + Prisma para a API de e-commerce Syntax Wear. O projeto já está estruturado com autenticação JWT, autenticação via middleware, controle de produtos, categorias e pedidos, documentação OpenAPI/Scalar e validações com Zod.

## Estado atual da implementação

- A aplicação principal em `src/app.ts` já registra Fastify, JWT, CORS, Helmet, Swagger e a documentação em `/api-docs` via `@scalar/fastify-api-reference`.
- A API já expõe rotas de autenticação em `/auth` com `register` e `login`, além de endpoints protegidos para `/products`, `/categories` e `/orders`.
- O fluxo de autenticação usa `bcrypt` para hash de senha e `@fastify/jwt` para geração/validação do token JWT.
- O middleware `src/middlewares/auth.middleware.ts` aplica `request.jwtVerify()` em rotas protegidas e responde com `401` quando o token é inválido ou expirado.
- A estrutura de camadas já está consolidada em `routes/` -> `controllers/` -> `services/` -> `utils/` + Prisma.
- O Prisma define os modelos `User`, `Category`, `Product`, `Order` e `OrderItem`, além dos enums `Role` e `OrderStatus`, em `prisma/schema.prisma`.
- A API de produtos já implementa listagem com paginação, filtros por preço, busca por texto, ordenação e relacionamento com a categoria.
- A API de categorias já implementa listagem, busca por ID, criação, atualização e exclusão lógica (`active: false`).
- A API de pedidos implementa listagem paginada e filtrada, consulta por ID, criação, atualização de endereço de entrega/forma de pagamento e cancelamento de pedidos próprios.
- As rotas de pedidos exigem JWT. Consultas e alterações são limitadas ao usuário autenticado; a criação calcula os preços com os dados do produto no servidor e reserva estoque em transação. O cancelamento de pedido `PENDING` devolve o estoque em transação.
- A criação de pedidos rejeita produtos inativos ou sem estoque suficiente. O estoque é agregado por produto; `sizes` e `colors` não têm estoque individual.
- A autorização administrativa para pedidos e snapshots comerciais dos produtos nos itens ainda não estão implementados. Não presuma que existem.
- A camada de erro e respostas padronizadas já é tratada centralmente no middleware de erros.

## Convenções do projeto

- Use TypeScript com imports ESM e inclua extensões `.js` nos imports locais, seguindo o estilo atual do projeto (por exemplo `./routes/products.routes.js`).
- Mantenha a estrutura da aplicação alinhada com as camadas atuais: `routes/` -> `controllers/` -> `services/` -> `utils/` e acesso ao Prisma.
- Prefira controladores enxutos e a lógica de negócio dentro dos módulos de serviço.
- Use Prisma pelo singleton em `src/utils/prisma.ts`; evite acesso direto ao banco em rotas ou controladores.
- Valide payloads de requisição com schemas Zod definidos em `src/utils/validators.ts` antes de chegar aos serviços.
- Preserve a linguagem em português da API e das mensagens visíveis ao usuário ao adicionar validações ou erros.
- Use `async/await` e códigos de status explícitos para erros de negócio; não esconda exceções.
- Mantenha a lógica de autenticação e autorização consistente com a configuração do JWT do Fastify em `src/app.ts` e o middleware em `src/middlewares/`.
- Ao trabalhar com Swagger/OpenAPI, mantenha os schemas de resposta, payload e segurança compatíveis com os endpoints já existentes.

## Regras de API e dados

- Mantenha a organização REST em `src/routes/` com prefixos claros como `/auth`, `/products`, `/categories` e `/orders`.
- Mantenha as operações de CRUD consistentes com a nomenclatura atual dos modelos Prisma (`User`, `Category`, `Product`, `Order`, `OrderItem`) e convenções do schema em `prisma/schema.prisma`.
- Quando uma funcionalidade mexer em dados de produtos, respeite campos como `slug`, `price`, `stock`, `active`, `sizes`, `colors`, `images` e `categoryId`.
- Em pedidos, calcule valores a partir dos produtos no servidor e mantenha consistentes a criação do pedido e a reserva de estoque usando transação. Não confie em preços ou totais enviados pelo cliente.
- Mantenha pedidos de clientes limitados ao usuário autenticado. Clientes só podem atualizar endereço de entrega e forma de pagamento enquanto o pedido estiver `PENDING`; não permita edição direta de itens ou status.
- O cancelamento pelo cliente é permitido somente para pedidos próprios em `PENDING` e deve devolver ao estoque as quantidades reservadas na mesma transação que atualiza o status.
- `OrderStatus` contém `PENDING`, `PAID`, `SHIPPED`, `DELIVERED` e `CANCELLED`, mas transições administrativas e autorização para alterá-las ainda não foram implementadas. Não introduza essas operações sem definir e validar as regras de transição e o papel autorizado.
- O schema atual não armazena snapshots comerciais dos produtos nos itens do pedido. Alterações futuras devem tratar isso como evolução do schema e preservar o histórico do pedido.
- Quando mexer em autenticação, use `bcrypt` para hash de senha e fluxo JWT consistente com os padrões existentes.
- Quando mexer em categorias ou produtos, evite quebrar a política de `slug` único e as regras de conflito por duplicidade.
- Trate campos únicos duplicados (`email`, `cpf`, `slug`) com erros explícitos de conflito usando `statusCode` como `400`, `409` ou `404` quando apropriado.
- Para endpoints protegidos, mantenha o padrão de autenticação por bearer token já adotado na API.

## Expectativas de qualidade de código

- Priorize código explícito e legível em vez de abstrações sofisticadas.
- Prefira funções pequenas e reutilizáveis em vez de duplicação de validação ou lógica Prisma.
- Mantenha imports organizados e evite variáveis não usadas ou código morto.
- Não adicione mudanças amplas em frameworks ou bibliotecas, a menos que a tarefa exija isso explicitamente.
- Prefira edições mínimas e cirúrgicas que respeitem a estrutura e os nomes dos arquivos existentes.
- Mantenha a API com comportamento previsível, em português, e aderente ao padrão de respostas atual do projeto.

## Validação

- Após alterar código TypeScript, execute a build do projeto com `npm run build` quando possível.
- Se a mudança afetar modelos Prisma ou schema do banco, também garanta que o fluxo Prisma continue correto, incluindo migração e geração quando relevante.
- Ao atualizar comportamento da API, verifique se a semântica dos endpoints acompanha os padrões existentes de Fastify e Prisma, em vez de introduzir outro estilo.
- Sempre valide se a mudança preserva a autenticação JWT, o isolamento de pedidos por usuário, os filtros do catálogo e a documentação OpenAPI/Swagger.

## Padrões preferidos

- Use `findUnique`, `findMany`, `create`, `update` e `count` com Prisma para acesso ao banco.
- Transforme ou converta dados nas camadas de serviço e não nas rotas.
- Mantenha os handlers de rota focados em parsing de requisição e formatação de resposta.
- Reutilize validadores e padrões de resposta existentes em vez de criar convenções paralelas.
- Mantenha o código compatível com o padrão atual de respostas em JSON, validações com Zod e middleware de autenticação do Fastify.
- Para mudanças em pedidos, considere os fluxos de estoque e os limites de status existentes; não altere itens ou transições de status sem requisito explícito.

Este projeto deve continuar com a aparência de um backend limpo em Fastify + Prisma: validação explícita, arquitetura em camadas, autenticação JWT e gestão de catálogo e pedidos com padrões de e-commerce já implementados.