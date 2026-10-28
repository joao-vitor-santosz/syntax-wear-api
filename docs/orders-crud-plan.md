# Planejamento: CRUD de pedidos integrado a produtos

Este documento descreve o planejamento para implementar pedidos na API Syntax Wear, integrados aos produtos já existentes. É somente um plano: nenhuma parte do CRUD, schema ou integração está implementada por este documento.

O planejamento considera os requisitos de pedidos descritos no [PRD](./PRD.md) e as convenções do projeto.

## Escopo proposto

O primeiro incremento deve permitir criar e consultar pedidos associados aos produtos existentes e ao usuário autenticado. Compra como convidado não será permitida. As operações dos clientes devem ser separadas das operações administrativas.

Checkout completo, carrinho e integração com provedores de pagamento podem ficar para uma etapa posterior. Não será implementado endpoint nem webhook de confirmação de pagamento neste incremento.

## 1. Schema Prisma

Adicionar os modelos e relações necessários:

- `Order`: número único do pedido, usuário obrigatório, status, valores monetários em centavos, moeda, endereço de entrega em snapshot e datas relevantes.
- `OrderItem`: quantidade, preço unitário e total em centavos para cada item.
- Relação opcional com `Product`, para preservar o histórico do pedido mesmo se o produto for removido ou desativado.
- Snapshots dos dados comerciais do produto no momento da compra, como nome, imagem, SKU e variações. Alterações posteriores no cadastro não devem modificar pedidos já criados.
- Enum de status do pedido com os valores `PENDING`, `PAID`, `SHIPPED`, `DELIVERED` e `CANCELLED`, para limitar os estados possíveis.

## 2. Integração com produtos e estoque

- Consultar produtos no banco durante a criação do pedido.
- Calcular preços e totais no servidor; não confiar em preços ou totais enviados pelo cliente.
- Validar que os produtos estão ativos e que há estoque suficiente.
- Preservar os snapshots dos itens mesmo quando os dados do produto forem alterados.
- Definir regras para alterações dos itens: esta política ainda precisa ser decidida. Até lá, os snapshots devem permanecer imutáveis e os endpoints não devem permitir alterações arbitrárias nos itens após a criação.
- Implementar transações para manter a criação do pedido e as atualizações de estoque consistentes.
- Reservar o estoque na criação do pedido, reduzindo a quantidade disponível para outras compras. Se o pedido for cancelado, devolver ao estoque as quantidades reservadas.
- Como não haverá confirmação automática de pagamento por endpoint ou webhook, pedidos não devem avançar automaticamente de `PENDING` para `PAID`; a forma de registrar o pagamento permanece fora deste escopo.

## 3. Camadas da aplicação

- Criar `src/services/orders.service.ts` para regras de negócio, operações Prisma e validação das transições de status.
- Criar `src/controllers/orders.controller.ts` para validar entradas, chamar os serviços e formatar respostas HTTP.
- Criar `src/routes/orders.routes.ts` com as rotas, schemas OpenAPI e proteção de autenticação.
- Adicionar schemas Zod e tipos necessários nos arquivos já usados pelo projeto, seguindo os padrões existentes.
- Registrar as novas rotas em `src/app.ts`.
- Atualizar as relações dos modelos existentes em `prisma/schema.prisma`.

## 4. Endpoints propostos

### Cliente

- `POST /orders`: criar pedido.
- `GET /orders`: listar os pedidos do cliente autenticado.
- `GET /orders/:id`: consultar um pedido próprio.
- `POST /orders/:id/cancel`: solicitar cancelamento, respeitando o status atual e as regras definidas.

### Administração

- Listar pedidos com filtros.
- Consultar pedido por ID.
- Atualizar status operacional, validando as transições permitidas.

As consultas de clientes devem retornar somente pedidos próprios. As operações administrativas devem exigir autorização para o papel `ADMIN`.

## 5. Estoque e mudanças de produto

Política escolhida:

- Reservar o estoque ao criar o pedido. Na prática, a quantidade reservada deixa de estar disponível para novos pedidos.
- Devolver ao estoque a quantidade reservada quando o pedido for cancelado.
- Implementar a criação do pedido e a reserva em uma transação, evitando pedidos criados sem reserva consistente.

Independentemente da política escolhida, atualizações posteriores no produto — como nome, preço, imagem ou desativação — não devem alterar os itens nem os valores históricos do pedido.

## 6. Validação e testes

Após a implementação, validar:

- Migração e geração do Prisma.
- Build TypeScript com `npm run build`.
- Criação e consulta de pedidos.
- Autorização: cliente acessa somente os próprios pedidos e operações administrativas exigem o papel correto.
- Rejeição de produto inativo ou estoque insuficiente.
- Cálculo de valores no servidor e consistência das operações transacionais.
- Cancelamento e validação de transições de status.
- Preservação dos snapshots quando os dados dos produtos forem alterados.

## Decisões já definidas

- Somente usuários autenticados podem comprar; não haverá pedidos de convidados.
- Sobre os status será umm Enum (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED` e `CANCELLED`).
- Não será implementado endpoint nem webhook de confirmação de pagamento.
- O estoque será reservado ao criar o pedido e devolvido se ele for cancelado.

## Decisões ainda pendentes

- Até qual status os itens do pedido poderão ser editados, se essa operação será permitida.
- Quais transições administrativas entre os status serão aceitas e quem poderá executá-las, especialmente como registrar `PAID` sem confirmação automática de pagamento.

Manter os snapshots imutáveis e permitir somente transições válidas de status após a criação do pedido. A implementação deve aguardar as decisões pendentes que alterem o comportamento ou o schema.
