# Plano de implementação do CRUD de categorias e vinculação com produtos

## Objetivo

Implementar o CRUD de categorias e a vinculação com produtos seguindo o padrão já adotado no CRUD de produtos, respeitando as regras do PRD e as convenções do projeto.

## Escopo

A implementação será dividida em 4 etapas, seguindo a ordem de dependência técnica e de negócio.

## Etapa 1 — Prisma, migration e atualização do banco

### Tarefas

- Definir o modelo `Category` no Prisma com os campos mínimos necessários:
  - `id`
  - `name`
  - `slug`
  - `description`
  - `imageUrl`
  - `active`
  - `position`
  - `createdAt`
  - `updatedAt`
- Garantir que `slug` seja único.
- Atualizar o modelo `Product` para incluir a relação com categoria:
  - `categoryId`
  - campo `category` no modelo
- Configurar a relação entre `Category` e `Product`:
  - uma categoria pode ter vários produtos;
  - um produto pertence a uma categoria.
- Validar o comportamento do PRD em relação a categorias:
  - listagem de categorias ativas;
  - busca por ID ou slug;
  - produtos vinculados a categoria;
  - exclusão lógica preferencial quando houver histórico;
  - impedir exclusão física em casos com vínculo ativo ou histórico relevante.
- Gerar migration Prisma para:
  - criar tabela de categorias;
  - adicionar chave estrangeira em produtos;
  - criar index/constraint necessários.
- Executar a migration para atualizar o banco local.

### Resultado esperado

- O banco deve suportar categorias e a relação com produtos.
- O schema Prisma deve refletir corretamente as regras do PRD.

## Etapa 2 — Service

### Tarefas

- Criar a camada de serviço para categorias, seguindo o padrão de `products.service.ts`.
- Implementar as operações:
  - `getCategories`
  - `getCategoryById`
  - `getCategoryBySlug`
  - `createCategory`
  - `updateCategory`
  - `deleteCategory` ou `deactivateCategory`
  - `getProductsByCategory`
- Garantir regras de negócio:
  - `slug` único;
  - categoria inexistente gera erro explícito;
  - categoria duplicada gera conflito;
  - exclusão lógica preferencial quando houver vínculo;
  - listagem considera apenas categorias ativas.
- Ajustar o service de produtos para aceitar e consultar por categoria:
  - filtro por `categoryId`:
  - filtro por categoria no `getProducts`;
  - criação/atualização de produtos com `categoryId`.
- Manter Prisma acessado somente em service e nunca diretamente em controller/rota.

### Resultado esperado

- Lógica de negócio centralizada em service.
- Produtos e categorias trabalhando em conjunto.

## Etapa 3 — Controller

### Tarefas

- Criar controller específico para categorias usando o mesmo padrão do `products.controller.ts`.
- Implementar handlers para:
  - `listCategories`
  - `getCategory`
  - `createNewCategory`
  - `updateExistingCategory`
  - `deleteExistingCategory`
- Ajustar o controller de produtos para:
  - validar filtros por categoria;
  - aceitar `categoryId` na criação e atualização;
  - usar a mesma estrutura de resposta do CRUD atual.
- Seguir o padrão do projeto:
  - `FastifyRequest` e `FastifyReply`;
  - parse com Zod;
  - `reply.status(...).send(...)`;
  - mensagens em português;
  - erros consistentes com `statusCode`.

### Resultado esperado

- Controllers em camadas corretas.
- Estrutura de resposta e validação consistentes com o restante da API.

## Etapa 4 — Rotas

### Tarefas

- Criar arquivo de rotas para categorias seguindo o padrão de `products.routes.ts`.
- Definir rotas e métodos:
  - `GET /categories`
  - `GET /categories/:id`
  - `GET /categories/:slug`
  - `GET /categories/:slug/products`
  - `POST /categories`
  - `PATCH /categories/:id`
  - `DELETE /categories/:id`
- Registrar as rotas no `src/app.ts` com prefixo `/categories`.
- Aplique o padrão de autenticação conforme o projeto:
  - rotas de consulta públicas;
  - rotas administrativas protegidas por JWT;
  - manter consistência com as rotas existentes de produtos.
- Documentar o schema do Swagger/OpenAPI nas rotas.
- Validar que a API reflita as regras do PRD e siga o padrão de organização atual.

### Resultado esperado

- CRUD completo de categorias funcional e consistente.
- Vinculação com produtos acessível via endpoints.
- API pronta para uso pelo frontend.

## Ordem recomendada de execução

1. Prisma + migration + banco
2. Service de categorias e ajustes em produtos
3. Controller de categorias e ajustes em produtos
4. Rotas e registro no app

## Observações importantes

- Esta etapa é apenas de planejamento, sem implementação de código.
- A implementação final deve seguir exatamente o padrão do projeto e as instruções do arquivo de convenções.
- A API deve continuar sendo legível, organizada em camadas e com linguagem em português, conforme o padrão atual do backend.
