# Planejamento: CRUD de pedidos integrado a produtos

Este documento registra o estado atual dos pedidos na API Syntax Wear e planeja o trabalho que ainda falta para completar seu CRUD. O schema básico e sua migração já existem, assim como os endpoints de listagem, consulta por ID, criação e atualização dos dados de entrega/pagamento de pedidos pendentes. Cancelamento e operações administrativas ainda não estão implementados.

O planejamento considera os requisitos de pedidos descritos no [PRD](./PRD.md), o schema Prisma atual e as convenções do projeto.

## Estado atual do projeto

- `Order`, `OrderItem` e o enum `OrderStatus` já estão definidos em `prisma/schema.prisma`. A migração `20261028042528_add_order_order_item` também já criou as tabelas e o enum no banco.
- `Order` possui `id`, `userId` opcional, `total` como `Decimal`, `status`, endereço em `Json`, `paymentMethod` obrigatório e datas de criação e atualização.
- `OrderItem` possui relações obrigatórias com pedido e produto, `price` como `Decimal`, `quantity` e `size` opcional. Não há snapshots comerciais do produto nem total da linha armazenados.
- O produto possui um único campo `stock` inteiro. `sizes` e `colors` são dados JSON, sem estoque individual por variação.
- `GET /orders`, `GET /orders/:id`, `POST /orders` e `PUT /orders/:id` estão implementados em `src/routes/orders.routes.ts`, `src/controllers/orders.controller.ts` e `src/services/orders.service.ts`, e registrados em `src/app.ts`.
- Os dois endpoints exigem JWT e limitam as consultas ao usuário autenticado. A consulta por ID combina o ID do pedido com o `userId` do token e retorna 404 quando não encontra pedido próprio.
- A listagem aceita paginação (`page`, `limit`), status e intervalo de datas (`startDate`, `endDate`). Também aceita `userId` como filtro adicional, mas esse filtro não permite consultar pedidos de outros usuários.
- As consultas incluem os itens do pedido. A criação calcula os preços no servidor e reserva estoque em transação. O endereço exige CEP, rua, número, bairro, cidade, estado e país, com complemento opcional. O payload aceita `userId` opcional, mas deve corresponder ao usuário autenticado. O usuário pode atualizar o endereço de entrega e a forma de pagamento enquanto o pedido estiver pendente; itens e status não são editáveis. Cancelamento, autorização administrativa, devolução de estoque e snapshots comerciais ainda não existem.
- O enum já contém `PENDING`, `PAID`, `SHIPPED`, `DELIVERED` e `CANCELLED`. Sua existência não implementa, por si só, as transições de status.
- O projeto tem `npm run build` e scripts do Prisma, mas ainda não declara Vitest nem script de testes no `package.json`.

As diferenças entre o schema atual e o modelo desejado precisam ser tratadas como evolução do schema, não como criação inicial dos modelos. A política de estoque por variação também precisa ser compatibilizada com o catálogo atual antes de ser incluída.

## Escopo proposto

O incremento atual de consulta está implementado para listar e buscar pedidos próprios. O trabalho seguinte deve implementar a criação e o cancelamento de pedidos associados aos produtos existentes e ao usuário autenticado. Compra como convidado não será permitida. As operações dos clientes devem ser separadas das operações administrativas.

Checkout completo, carrinho e integração com provedores de pagamento podem ficar para uma etapa posterior. Não será implementado endpoint nem webhook de confirmação de pagamento neste incremento.

## 1. Adequação do schema Prisma

Os modelos `Order`, `OrderItem` e o enum `OrderStatus` já existem. Evoluir o schema e criar novas migrações somente para as diferenças aprovadas:

- Tornar o vínculo do pedido com `User` obrigatório, conforme a decisão de não aceitar compras como convidado. Hoje `Order.userId` e a relação `user` são opcionais.
- Definir o identificador público único do pedido, a moeda e os valores monetários em centavos inteiros. Hoje há apenas `id` e `total Decimal` no pedido.
- Definir no item o preço unitário e o total da linha em centavos, além de snapshots comerciais necessários, como nome, imagem, SKU e variações. Hoje `OrderItem` armazena `price Decimal`, quantidade e tamanho opcional.
- Tornar opcional a relação de `OrderItem` com `Product`, para que o histórico do pedido sobreviva à remoção do produto. Hoje `productId` e a relação são obrigatórios e a migração usa `ON DELETE RESTRICT`.
- Preservar endereço de entrega como snapshot. O campo `shippingAddress Json` já existe; falta definir/validar sua estrutura e garantir que os dados usados no pedido não dependam de alterações posteriores no cadastro.
- Manter o enum atual com `PENDING`, `PAID`, `SHIPPED`, `DELIVERED` e `CANCELLED`; não recriá-lo.

Snapshots devem ser gravados na criação do pedido e não devem ser alteráveis por endpoints comuns. A alteração de itens após a criação continua pendente de decisão.

## 2. Integração com produtos e estoque

- Consultar produtos no banco durante a criação do pedido.
- Calcular preços e totais no servidor; não confiar em preços ou totais enviados pelo cliente.
- Validar que os produtos estão ativos e que há estoque suficiente. No modelo atual, o estoque é único por produto; tamanhos e cores não têm saldo separado.
- Preservar os snapshots dos itens mesmo quando os dados do produto forem alterados.
- Definir regras para alterações dos itens: esta política ainda precisa ser decidida. Até lá, os snapshots devem permanecer imutáveis e os endpoints não devem permitir alterações arbitrárias nos itens após a criação.
- Implementar transações para manter a criação do pedido e as atualizações de estoque consistentes.
- Reservar o estoque na criação do pedido, reduzindo a quantidade disponível para outras compras. Se o pedido for cancelado, devolver ao estoque as quantidades reservadas.
- Como não haverá confirmação automática de pagamento por endpoint ou webhook, pedidos não devem avançar automaticamente de `PENDING` para `PAID`; a forma de registrar o pagamento permanece fora deste escopo.

Antes de implementar estoque por tamanho/cor, decidir se o estoque agregado atual por produto atende ao primeiro incremento ou se será necessário introduzir um modelo de variações com saldo próprio, como previsto no PRD.

## 3. Camadas da aplicação

- Os arquivos `src/services/orders.service.ts`, `src/controllers/orders.controller.ts` e `src/routes/orders.routes.ts` já implementam listagem paginada e consulta por ID. Estender esses módulos para as operações ainda pendentes, sem duplicar a estrutura existente.
- As rotas de consulta já têm autenticação, schemas OpenAPI e validações Zod para ID e filtros da listagem. Adicionar validação somente para novos payloads/parâmetros necessários.
- As rotas de pedidos já estão registradas em `src/app.ts` com o prefixo `/orders`.
- Ajustar `prisma/schema.prisma` e gerar migrações apenas para as diferenças necessárias em relação aos modelos já existentes.
- Manter autenticação nas rotas de cliente e implementar autorização explícita para `ADMIN` nas operações administrativas. O papel já existe no enum `Role`; ainda não há autorização administrativa de pedidos.

## 4. Endpoints propostos

### Cliente

- `POST /orders`: criar pedido.
- `GET /orders`: implementado; lista pedidos do usuário autenticado com paginação e filtros por status e datas. O filtro opcional `userId` permanece limitado ao usuário do token.
- `GET /orders/:id`: implementado; consulta um pedido próprio e retorna 404 quando não encontrado para esse usuário.
- `PUT /orders/:id`: implementado; permite ao cliente atualizar qualquer subconjunto dos campos do endereço de entrega (CEP, rua, número, complemento, bairro, cidade, estado e país) e/ou forma de pagamento somente enquanto o pedido estiver `PENDING`. Campos do endereço não enviados permanecem inalterados. Os itens e o status não podem ser alterados.
- `POST /orders/:id/cancel`: solicitar cancelamento, respeitando o status atual e as regras definidas.

### Administração

- Listar pedidos com filtros.
- Consultar pedido por ID.
- Atualizar status operacional, validando as transições permitidas. Caminhos e transições devem ser definidos antes da implementação.

As consultas de clientes devem retornar somente pedidos próprios. As operações administrativas devem exigir autorização para o papel `ADMIN`.

## 5. Estoque e mudanças de produto

Política escolhida para o estoque agregado atual do produto:

- Reservar o estoque ao criar o pedido. Na prática, a quantidade reservada deixa de estar disponível para novos pedidos.
- Devolver ao estoque a quantidade reservada quando o pedido for cancelado.
- Implementar a criação do pedido e a reserva em uma transação, evitando pedidos criados sem reserva consistente.

Independentemente da política escolhida, atualizações posteriores no produto — como nome, preço, imagem ou desativação — não devem alterar os itens nem os valores históricos do pedido. Isso exige snapshots nos itens, que ainda não existem no schema atual.

## 6. Validação e testes

Após a implementação, validar:

- Migração e geração do Prisma quando o schema for alterado; os modelos básicos e a migração inicial já existem.
- Build TypeScript com `npm run build`.
- Criação e atualização de pedidos implementadas; validar reserva de estoque, isolamento por usuário e restrição de atualização ao status `PENDING`.
- Cancelamento de pedidos ainda pendente de implementação.
- Listagem paginada, filtros de status e datas, consulta por ID e isolamento por usuário nos endpoints já implementados.
- Autorização: cliente acessa somente os próprios pedidos e operações administrativas exigem o papel correto.
- Rejeição de produto inativo ou estoque insuficiente.
- Cálculo de valores no servidor e consistência das operações transacionais.
- Cancelamento e validação de transições de status.
- Preservação dos snapshots quando os dados dos produtos forem alterados.

## Decisões já definidas

- Somente usuários autenticados podem comprar; não haverá pedidos de convidados.
- Os status serão limitados pelo enum `OrderStatus` (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED` e `CANCELLED`), já existente no schema.
- Não será implementado endpoint nem webhook de confirmação de pagamento.
- O estoque será reservado ao criar o pedido e devolvido se ele for cancelado.

## Decisões ainda pendentes

- Até qual status os itens do pedido poderão ser editados, se essa operação será permitida.
- Quais transições administrativas entre os status serão aceitas e quem poderá executá-las, especialmente como registrar `PAID` sem confirmação automática de pagamento.
- Se o estoque agregado atual por produto será suficiente neste incremento ou se haverá estoque por variação de tamanho/cor.
- Os campos finais do pedido e dos itens, incluindo número público, moeda, snapshots e representação dos valores em centavos.

Manter os snapshots imutáveis e permitir somente transições válidas de status após a criação do pedido. A listagem e a consulta por ID já estão implementadas. A criação e o cancelamento podem avançar sobre as decisões já definidas; alterações no schema e fluxos que dependam dos itens editáveis, estoque por variação ou transições administrativas devem aguardar as decisões pendentes correspondentes.
