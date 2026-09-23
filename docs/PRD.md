# PRD - API Backend Syntax Wear

## 1. Visão geral

### 1.1 Produto

A Syntax Wear é uma loja virtual de calçados com catálogo de produtos, navegação por categorias, página de detalhes, carrinho, autenticação de clientes, cálculo de frete por CEP e cadastro em newsletter.

Este documento define os requisitos para criação de uma API backend capaz de sustentar a operação do ecommerce, substituir os dados mockados do frontend e preparar a aplicação para checkout, pagamentos, gestão de estoque e administração da loja.

### 1.2 Objetivo

Construir uma API REST segura, escalável e testável para:

- Disponibilizar produtos e categorias para o frontend.
- Permitir cadastro e autenticação de clientes.
- Gerenciar carrinhos de visitantes e clientes autenticados.
- Calcular frete a partir do CEP.
- Criar e acompanhar pedidos.
- Controlar estoque por variação de produto.
- Processar pagamentos, inicialmente com PIX.
- Disponibilizar recursos administrativos para operação da loja.

### 1.3 Tecnologias obrigatórias

- Node.js
- Fastify
- TypeScript
- Supabase PostgreSQL
- Prisma ORM
- JWT
- Vitest

### 1.4 Moeda e localização

- Moeda inicial: BRL.
- Idioma principal: português do Brasil.
- País inicial: Brasil.
- Valores monetários devem ser armazenados em centavos inteiros para evitar erros de arredondamento.

---

## 2. Contexto do frontend atual

O frontend possui as seguintes áreas e fluxos:

- Página inicial com hero, categorias e galeria.
- Catálogo geral de produtos.
- Catálogo filtrado por categoria.
- Página de detalhe do produto.
- Carrinho exibido em drawer global.
- Login por e-mail e senha.
- Cadastro com dados pessoais.
- Consulta de CEP e cálculo de frete.
- Página institucional sobre a marca.
- Página com lojas físicas.
- Formulário de inscrição em newsletter.

Atualmente, os produtos e categorias são mockados, o carrinho é mantido no `localStorage`, o login e o cadastro ainda não estão conectados a uma API e o checkout não está implementado.

### 2.1 Campos observados nas telas

**Produto atual:**

- Identificador.
- Nome.
- Imagem.
- Preço.
- Cor.
- Descrição.
- Categoria.

**Cadastro:**

- Nome.
- Sobrenome.
- E-mail.
- Senha.
- Confirmação de senha.
- CPF.
- Data de nascimento.
- Telefone.

A confirmação de senha deve ser utilizada somente para validação e nunca deve ser persistida.

**Endereço e CEP:**

- CEP.
- Logradouro.
- Complemento.
- Bairro.
- Cidade.
- Estado.
- Região.
- Custo de entrega.

O backend deverá evoluir o modelo atual para suportar estoque, tamanhos, variações, múltiplas imagens, pedidos e pagamentos.

---

## 3. Personas e papéis

### 3.1 Visitante

Pode navegar pelo catálogo, visualizar produtos, consultar frete, criar carrinho e iniciar checkout como convidado.

### 3.2 Cliente

Pode manter perfil, endereços, carrinho, pedidos e pagamentos vinculados à sua conta.

### 3.3 Administrador

Pode gerenciar produtos, categorias, variações, estoque, pedidos e usuários.

### 3.4 Serviços externos

Integrações responsáveis por serviços como:

- ViaCEP.
- Gateway de pagamento.
- Serviço de e-mail.
- Provedor OAuth do Google, em evolução.

---

## 4. Escopo do MVP

### Incluído

- CRUD de produtos.
- CRUD de categorias.
- CRUD de usuários para administração.
- Cadastro e login de clientes.
- Autenticação com JWT.
- Gestão de endereços.
- Carrinho para visitante e cliente autenticado.
- Checkout para visitante e cliente.
- Criação e consulta de pedidos.
- Controle de estoque por variação.
- Cálculo de frete por região.
- Pagamento via PIX, com contrato preparado para outros meios.
- Newsletter.
- Controle de acesso administrativo.
- Testes automatizados com Vitest.
- Documentação OpenAPI.

### Fora do MVP

- Integração real com múltiplas transportadoras.
- Rastreamento de entrega.
- Programa de fidelidade.
- Avaliações e comentários de produtos.
- Marketplace.
- CMS completo para páginas institucionais.
- Cupons e campanhas promocionais avançadas.
- Relatórios financeiros avançados.
- Pagamento com cartão, salvo se o gateway escolhido já oferecer uma integração simples na primeira fase.

---

## 5. Requisitos funcionais

## RF01 - Catálogo de produtos

A API deve permitir que visitantes e clientes consultem produtos disponíveis.

### Funcionalidades

- Listar produtos ativos.
- Buscar produto por identificador ou slug.
- Filtrar por categoria.
- Filtrar por faixa de preço.
- Filtrar por cor, tamanho, marca e disponibilidade.
- Ordenar por relevância, preço, data de cadastro e nome.
- Paginar resultados.
- Exibir detalhes completos do produto.
- Informar disponibilidade por variação.

### Campos de produto

- `id`.
- `slug`.
- `name`.
- `description`.
- `brand`.
- `basePriceInCents`.
- `pixDiscountPercentage`.
- `promotionalPriceInCents`.
- `color` ou conjunto de cores.
- `status`.
- `featured`.
- `categoryId`.
- `createdAt`.
- `updatedAt`.
- `deletedAt`, quando houver exclusão lógica.

### Variação de produto

- `id`.
- `productId`.
- `sku`.
- `size`.
- `color`.
- `priceInCents` opcional.
- `stockQuantity`.
- `reservedQuantity`.
- `weightInGrams`.
- `active`.

### Imagens

- `id`.
- `productId`.
- `url`.
- `altText`.
- `position`.
- `isPrimary`.

## RF02 - Categorias

A API deve ser a fonte única de categorias usadas na home, no catálogo e nos filtros.

### Funcionalidades

- Listar categorias ativas.
- Buscar categoria por ID ou slug.
- Listar produtos de uma categoria.
- Criar categoria.
- Atualizar categoria.
- Desativar ou excluir categoria sem produtos vinculados.
- Informar quantidade de produtos ativos.

### Campos

- `id`.
- `name`.
- `slug`.
- `description`.
- `imageUrl`.
- `active`.
- `position`.
- `createdAt`.
- `updatedAt`.

O slug deve ser único. Categorias não devem ser excluídas fisicamente quando já estiverem vinculadas a pedidos ou produtos históricos.

## RF03 - Cadastro e autenticação

### Cadastro

O cliente deve conseguir criar uma conta informando:

- Nome.
- Sobrenome.
- E-mail.
- Senha.
- CPF.
- Data de nascimento.
- Telefone.

### Regras

- E-mail deve ser único e normalizado em minúsculas.
- CPF deve ser validado e armazenado normalizado.
- Senha deve possuir no mínimo oito caracteres.
- Senha deve ser armazenada com hash Argon2 ou bcrypt.
- A API nunca deve retornar senha ou hash de senha.
- O cliente deve aceitar a política de privacidade no cadastro.

### Login

- Login por e-mail e senha.
- Retorno de access token JWT.
- Retorno de refresh token seguro e revogável.
- Logout com invalidação do refresh token.
- Renovação de access token.
- Recuperação de senha.
- Verificação de e-mail, caso habilitada.

### Google OAuth

A arquitetura deve possuir uma camada de provedores de autenticação que permita adicionar Google OAuth sem alterar o domínio de usuários.

## RF04 - Usuários e perfil

### Cliente autenticado

- Consultar perfil.
- Atualizar nome, telefone e data de nascimento.
- Atualizar senha.
- Gerenciar endereços.
- Consultar pedidos próprios.
- Solicitar exclusão da conta conforme regras de retenção legal.

### Administrador

- Listar usuários.
- Buscar usuário por ID, e-mail ou CPF.
- Alterar status da conta.
- Alterar papel do usuário, somente para administradores autorizados.
- Consultar pedidos do usuário.
- Bloquear ou desbloquear conta.

## RF05 - Endereços

### Funcionalidades

- Criar endereço.
- Listar endereços do cliente.
- Atualizar endereço.
- Excluir endereço.
- Definir endereço padrão.
- Validar CEP.
- Consultar dados complementares via ViaCEP.

### Campos

- `id`.
- `userId`, quando associado a cliente.
- `recipientName`.
- `postalCode`.
- `street`.
- `number`.
- `complement`.
- `neighborhood`.
- `city`.
- `state`.
- `region`.
- `ibgeCode`, quando disponível.
- `isDefault`.

Para pedidos, o endereço deve ser copiado para um snapshot no momento da compra, evitando alterações históricas.

## RF06 - Carrinho

A API deve suportar carrinhos de visitantes e clientes autenticados.

### Funcionalidades

- Criar ou recuperar carrinho.
- Adicionar item.
- Atualizar quantidade.
- Remover item.
- Limpar carrinho.
- Consultar subtotal.
- Consultar disponibilidade.
- Calcular frete.
- Informar total.
- Associar carrinho anônimo ao cliente após login.
- Mesclar itens sem duplicar variações indevidamente.

### Regras

- O item do carrinho deve referenciar uma variação de produto.
- A quantidade deve ser maior que zero.
- Não é permitido adicionar quantidade superior ao estoque disponível.
- O preço deve ser recalculado no servidor.
- Carrinhos abandonados podem ser expirados por rotina de limpeza.
- O frontend não deve ser a fonte de verdade para preço, estoque ou total.

## RF07 - Frete

### MVP

O cálculo de frete será baseado na região obtida a partir do CEP, com regras configuráveis no banco.

Exemplo das regras atualmente existentes no frontend:

- Norte: R$ 19,90.
- Nordeste: R$ 29,90.
- Centro-Oeste: R$ 14,90.
- Sudeste: R$ 24,90.
- Sul: R$ 39,90.

Esses valores não devem permanecer hardcoded no frontend.

### Funcionalidades

- Validar CEP.
- Consultar ViaCEP no backend.
- Identificar região e estado.
- Calcular custo.
- Informar prazo estimado quando disponível.
- Retornar identificador e validade da cotação.
- Recalcular cotação quando endereço, itens ou regras mudarem.

### Evolução

A arquitetura deve permitir adapters para transportadoras, com múltiplas opções de serviço, preço, prazo e rastreio.

## RF08 - Checkout

O checkout deve permitir compra como visitante ou cliente autenticado.

### Etapas

1. Validar carrinho.
2. Validar estoque.
3. Informar identificação do comprador.
4. Selecionar ou informar endereço.
5. Calcular frete.
6. Selecionar método de pagamento.
7. Confirmar pedido.
8. Reservar ou baixar estoque.
9. Criar pagamento.
10. Retornar resumo e status do pedido.

### Compra como convidado

O visitante deve informar, no mínimo:

- Nome.
- E-mail.
- Telefone.
- Endereço de entrega.

O pedido deve ser consultável por token seguro enviado por e-mail ou por outro mecanismo definido posteriormente.

## RF09 - Pedidos

### Funcionalidades do cliente

- Criar pedido.
- Consultar pedido por ID autorizado.
- Listar os próprios pedidos.
- Consultar itens, endereço, frete, pagamento e status.
- Solicitar cancelamento dentro das regras permitidas.

### Funcionalidades administrativas

- Listar pedidos com filtros.
- Buscar por ID, cliente, e-mail e status.
- Atualizar status operacional.
- Registrar observações internas.
- Consultar histórico de alterações.
- Iniciar processo de cancelamento ou estorno.

### Campos

- `id`.
- `orderNumber`.
- `userId`, opcional para convidado.
- `guestEmail`, opcional.
- `status`.
- `paymentStatus`.
- `fulfillmentStatus`.
- `subtotalInCents`.
- `discountInCents`.
- `shippingInCents`.
- `totalInCents`.
- `currency`.
- `shippingAddressSnapshot`.
- `billingAddressSnapshot`, se necessário.
- `createdAt`.
- `updatedAt`.
- `cancelledAt`.

### Item do pedido

- `id`.
- `orderId`.
- `productId` opcional para preservar histórico mesmo após remoção.
- `variantId` opcional.
- `skuSnapshot`.
- `productNameSnapshot`.
- `imageUrlSnapshot`.
- `sizeSnapshot`.
- `colorSnapshot`.
- `unitPriceInCents`.
- `quantity`.
- `totalInCents`.

## RF10 - Pagamentos

### MVP com PIX

- Criar cobrança PIX.
- Retornar QR Code e código copia e cola.
- Informar valor e vencimento.
- Consultar status.
- Processar confirmação por webhook.
- Expirar cobrança vencida.
- Registrar estorno quando aplicável.

### Status

- `PENDING`.
- `AUTHORIZED`.
- `PAID`.
- `FAILED`.
- `EXPIRED`.
- `REFUNDED`.
- `CANCELLED`.

### Regras

- Webhooks devem ser autenticados.
- Eventos repetidos não podem duplicar efeitos.
- O pedido só deve avançar para pagamento confirmado após evento válido.
- O estoque deve seguir política definida: reserva na criação e baixa na confirmação, ou baixa imediata com compensação.

## RF11 - Newsletter

### Funcionalidades

- Inscrever e-mail.
- Remover inscrição.
- Consultar status de inscrição pelo próprio e-mail, sem expor dados de terceiros.
- Evitar duplicidade.
- Registrar data e origem do consentimento.

### Campos

- `id`.
- `email`.
- `status`.
- `consentAt`.
- `unsubscribedAt`.
- `source`.
- `createdAt`.
- `updatedAt`.

## RF12 - Estoque

### Funcionalidades

- Consultar estoque por variação.
- Ajustar estoque administrativamente.
- Registrar entrada, saída, reserva, liberação e ajuste.
- Impedir estoque negativo.
- Reservar itens durante checkout.
- Liberar reserva em caso de expiração ou falha de pagamento.

### Movimentações

Cada movimentação deve registrar:

- Variação.
- Tipo.
- Quantidade.
- Motivo.
- Usuário responsável, quando aplicável.
- Pedido relacionado, quando aplicável.
- Data.

---

## 6. Modelo de domínio

### User

- `id` UUID.
- `firstName`.
- `lastName`.
- `email` único.
- `passwordHash`.
- `cpf` único, quando obrigatório.
- `birthDate`.
- `phone`.
- `role`.
- `status`.
- `emailVerifiedAt`.
- `createdAt`.
- `updatedAt`.

### Role

Pode ser representada inicialmente por enum:

- `CUSTOMER`.
- `ADMIN`.

A estrutura deve permitir expansão para permissões granulares.

### Product

Relaciona-se com uma categoria, imagens, variantes e itens históricos de pedidos.

### Category

Relaciona-se com produtos ativos e inativos. O slug deve ser único.

### ProductVariant

Representa uma combinação vendável de SKU, tamanho e cor, com estoque próprio.

### Cart e CartItem

Um carrinho pode pertencer a um usuário ou ser identificado por token de visitante. Seus itens referenciam variações.

### Order e OrderItem

O pedido guarda valores calculados e snapshots imutáveis para preservar o histórico comercial.

### Payment

Relaciona-se com um pedido e guarda o provedor, identificador externo, valor, status e datas de processamento.

### ShippingQuote

Guarda origem da cotação, CEP, região, valor, prazo, validade e itens considerados.

### RefreshToken

Guarda hash do token, usuário, expiração, revogação e metadados de segurança.

### AuditLog

Registra operações administrativas e eventos sensíveis.

---

## 7. Contrato da API

A API deve ser versionada com o prefixo:

```text
/api/v1
```

### 7.1 Endpoints públicos

```text
GET    /api/v1/products
GET    /api/v1/products/:idOrSlug
GET    /api/v1/categories
GET    /api/v1/categories/:slug
GET    /api/v1/categories/:slug/products
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/shipping/cep/:postalCode
POST   /api/v1/newsletter/subscribe
POST   /api/v1/newsletter/unsubscribe
```

### 7.2 Endpoints autenticados

```text
GET    /api/v1/me
PATCH  /api/v1/me
PATCH  /api/v1/me/password
GET    /api/v1/me/addresses
POST   /api/v1/me/addresses
PATCH  /api/v1/me/addresses/:id
DELETE /api/v1/me/addresses/:id
GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:itemId
DELETE /api/v1/cart/items/:itemId
DELETE /api/v1/cart
POST   /api/v1/cart/shipping-quote
POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/cancel
```

### 7.3 Endpoints administrativos

```text
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id
POST   /api/v1/admin/products/:id/images
POST   /api/v1/admin/products/:id/variants
PATCH  /api/v1/admin/variants/:id
DELETE /api/v1/admin/variants/:id
POST   /api/v1/admin/categories
PATCH  /api/v1/admin/categories/:id
DELETE /api/v1/admin/categories/:id
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id
GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/:id
PATCH  /api/v1/admin/orders/:id/status
POST   /api/v1/admin/inventory/adjustments
GET    /api/v1/admin/inventory/movements
GET    /api/v1/admin/audit-logs
```

### 7.4 Paginação

Listagens devem aceitar:

- `page`.
- `limit`.
- `sort`.
- `order`.
- Filtros específicos do recurso.

Resposta sugerida:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### 7.5 Erros

Formato sugerido:

```json
{
  "error": {
    "code": "PRODUCT_OUT_OF_STOCK",
    "message": "A variação selecionada não possui estoque disponível.",
    "details": []
  },
  "requestId": "request-id"
}
```

Códigos HTTP esperados:

- `200` para sucesso.
- `201` para criação.
- `204` para remoção sem conteúdo.
- `400` para entrada inválida.
- `401` para falta ou invalidade de autenticação.
- `403` para falta de permissão.
- `404` para recurso inexistente.
- `409` para conflito de estado ou unicidade.
- `422` para regra de negócio inválida.
- `429` para limite de requisições.
- `500` para erro inesperado.

Operações de criação de pedidos e webhooks devem aceitar uma chave de idempotência.

---

## 8. Regras de negócio

1. O backend é a fonte de verdade para preços, descontos, estoque, frete e totais.
2. O preço PIX deve ser configurável e calculado no backend.
3. A confirmação de senha nunca deve ser persistida.
4. Produtos inativos não devem aparecer no catálogo público.
5. Categorias inativas não devem aparecer nos filtros públicos.
6. Não deve ser possível adicionar ao carrinho uma variação inativa ou sem estoque.
7. A criação do pedido deve validar novamente preço, disponibilidade e frete.
8. O item do pedido deve preservar o preço e informações do produto no momento da compra.
9. O endereço do pedido deve ser um snapshot imutável.
10. Uma mesma cobrança de pagamento não pode ser processada duas vezes.
11. O cliente só pode consultar seus próprios carrinhos, endereços e pedidos.
12. Administradores só podem executar ações compatíveis com seu papel.
13. Exclusões de produtos, categorias e usuários devem preferir exclusão lógica quando houver histórico relacionado.
14. Cancelamentos devem respeitar o status atual do pedido e do pagamento.
15. O total do pedido deve ser calculado como subtotal menos descontos mais frete.
16. Todas as transições de status relevantes devem ser registradas.
17. CPF, e-mail, CEP e telefone devem ser normalizados antes da persistência.
18. Preços e quantidades devem ser validados contra valores negativos ou inválidos.

### 8.1 Status do pedido

- `PENDING_PAYMENT`.
- `PAID`.
- `PROCESSING`.
- `SHIPPED`.
- `DELIVERED`.
- `CANCELLED`.
- `REFUNDED`.

Transições inválidas devem retornar erro de regra de negócio.

---

## 9. Segurança e privacidade

### Autenticação

- Access token JWT com curta duração.
- Refresh token com rotação e revogação.
- Segredos fornecidos por variáveis de ambiente.
- Tokens armazenados de forma segura no cliente.

### Autorização

- Middleware de autenticação no Fastify.
- RBAC para clientes e administradores.
- Verificação de propriedade dos recursos do cliente.
- Proteção específica para endpoints administrativos.

### Proteção da API

- Validação de schemas em todas as entradas.
- Rate limiting em login, cadastro, recuperação de senha e newsletter.
- CORS configurado por ambiente.
- Headers de segurança.
- Sanitização de entradas.
- Logs sem senha, tokens, CPF completo ou dados de pagamento sensíveis.
- Proteção contra replay em webhooks.
- Idempotência em operações financeiras.

### LGPD

- Registro de consentimento quando necessário.
- Minimização de dados armazenados.
- Possibilidade de atualização dos dados pessoais.
- Solicitação de exclusão conforme obrigações legais e fiscais.
- Política de retenção para pedidos e documentos comerciais.

---

## 10. Arquitetura técnica

### Organização sugerida

```text
src/
  app.ts
  server.ts
  config/
  plugins/
  shared/
    errors/
    http/
    validation/
    logger/
  modules/
    auth/
    users/
    products/
    categories/
    cart/
    shipping/
    orders/
    payments/
    newsletter/
    admin/
  infrastructure/
    prisma/
    supabase/
    viacep/
    payment-provider/
```

Cada módulo deve separar, quando necessário:

- Rotas.
- Schemas.
- Controllers ou handlers.
- Casos de uso.
- Repositórios.
- Entidades e tipos.
- Testes.

### Prisma e Supabase

- Prisma será utilizado para schema, migrations e acesso ao PostgreSQL.
- Supabase fornecerá o banco PostgreSQL.
- Supabase Storage poderá armazenar imagens de produtos.
- Ambientes de desenvolvimento, teste e produção devem ser separados.
- Migrations devem ser versionadas no repositório.

### Variáveis de ambiente esperadas

```text
NODE_ENV
PORT
DATABASE_URL
DIRECT_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VIACEP_BASE_URL
PAYMENT_PROVIDER_URL
PAYMENT_PROVIDER_SECRET
CORS_ORIGIN
```

As chaves secretas nunca devem ser commitadas.

### Observabilidade

- Logs estruturados.
- `requestId` por requisição.
- Logs de erro com contexto suficiente para diagnóstico.
- Métricas de latência, erros, pedidos e pagamentos.
- Monitoramento de falhas em integrações externas.

---

## 11. Estratégia de testes com Vitest

### Testes unitários

- Validação de CPF, CEP, e-mail e telefone.
- Cálculo de preço PIX.
- Cálculo de subtotal e total.
- Cálculo de frete.
- Transições de status.
- Regras de estoque.
- Casos de uso de carrinho e pedido.
- Controle de permissões.

### Testes de integração

- Cadastro e login.
- Refresh token e logout.
- CRUD de produtos e categorias.
- CRUD de endereços.
- Carrinho anônimo e autenticado.
- Mesclagem de carrinhos.
- Criação de pedido com reserva de estoque.
- Falha por estoque insuficiente.
- Processamento de webhook de pagamento.
- Consulta protegida de pedidos.

### Testes de contrato

- Schemas de entrada e saída das rotas.
- Formato padronizado de erros.
- Paginação.
- Autorização por papel.
- Compatibilidade com os consumidores do frontend.

### Requisitos dos testes

- Banco de testes separado.
- Dados de teste isolados.
- Mocks para ViaCEP, gateway de pagamento e serviços de e-mail.
- Testes determinísticos.
- Execução local e em pipeline de CI.

---

## 12. Critérios de aceite

### Catálogo

- O frontend consegue listar produtos reais vindos da API.
- O usuário consegue filtrar por categoria.
- A página de detalhe recebe todas as informações necessárias.
- Produtos inativos não são retornados publicamente.

### Categorias

- Administrador consegue criar, editar, ativar e desativar categorias.
- O catálogo consegue consultar produtos por slug de categoria.
- Slugs duplicados são rejeitados.

### Usuários

- Cliente consegue se cadastrar com os campos presentes na tela.
- Cliente consegue fazer login e receber JWT válido.
- Senhas não aparecem em respostas ou logs.
- Rotas privadas rejeitam tokens ausentes ou inválidos.

### Carrinho

- Visitante consegue adicionar produtos ao carrinho.
- Usuário autenticado consegue consultar seu carrinho.
- Quantidade, estoque e totais são validados no servidor.
- Carrinho anônimo pode ser mesclado após login.

### Checkout e pedidos

- Usuário ou convidado consegue criar pedido com endereço e pagamento.
- O backend recalcula o total antes de criar o pedido.
- O pedido preserva os dados históricos dos produtos.
- Estoque insuficiente impede a criação do pedido.
- Cliente consegue consultar somente seus próprios pedidos.
- Administrador consegue filtrar e atualizar pedidos.

### Pagamentos

- Uma cobrança PIX é criada com valor correto.
- Webhook válido atualiza pagamento e pedido.
- Webhook repetido não duplica processamento.
- Webhook inválido é rejeitado.

### Administração

- Rotas administrativas exigem autenticação e papel adequado.
- Administrador consegue realizar CRUD de produtos, categorias e usuários.
- Ajustes de estoque geram histórico.

### Qualidade

- Fluxos críticos possuem testes Vitest.
- API possui documentação OpenAPI.
- Erros possuem formato consistente.
- Aplicação não expõe segredos ou dados pessoais desnecessários.

---

## 13. Fases de entrega

### Fase 1 - Fundação

- Configuração Fastify e TypeScript.
- Configuração Prisma e Supabase.
- Estrutura modular.
- Configuração de ambiente.
- Logger, erros e validação.
- Pipeline de testes.

### Fase 2 - Catálogo e administração básica

- Produtos.
- Categorias.
- Imagens.
- Variações.
- Estoque.
- Endpoints públicos e administrativos.

### Fase 3 - Autenticação e usuários

- Cadastro.
- Login.
- JWT.
- Refresh token.
- Perfil.
- Endereços.
- RBAC.

### Fase 4 - Carrinho e frete

- Carrinho anônimo.
- Carrinho autenticado.
- Mesclagem de carrinho.
- ViaCEP.
- Regras regionais de frete.

### Fase 5 - Checkout, pedidos e PIX

- Criação de pedidos.
- Reserva de estoque.
- PIX.
- Webhooks.
- Consulta de pedidos.
- Cancelamentos.

### Fase 6 - Evoluções

- Google OAuth.
- Cartão.
- Transportadoras.
- Rastreamento.
- Cupons.
- CMS institucional.
- Avaliações.
- Relatórios.

---

## 14. Métricas e requisitos não funcionais

### Desempenho

- Respostas de catálogo devem ser paginadas.
- Consultas frequentes devem possuir índices adequados.
- Integrações externas devem possuir timeout.
- Operações críticas não devem depender de chamadas externas sem tratamento de falha.

### Disponibilidade e resiliência

- Falhas do ViaCEP não devem derrubar a API.
- Webhooks devem poder ser reprocessados com segurança.
- Erros temporários de pagamento devem ser rastreáveis.
- Rotinas de limpeza devem ser idempotentes.

### Métricas

- Taxa de erro por endpoint.
- Tempo médio e percentil de resposta.
- Taxa de conversão de carrinho em pedido.
- Pedidos por status.
- Pagamentos aprovados, recusados e expirados.
- Produtos com estoque baixo.
- Falhas de integração.

---

## 15. Perguntas em aberto

1. O checkout de convidados usará um token de consulta por e-mail ou exigirá criação de conta após a compra?
2. Qual gateway será utilizado para PIX?
3. O estoque será reservado na criação do pedido ou somente após confirmação do pagamento?
4. A política de preço PIX será fixa ou configurável por produto e campanha?
5. O pagamento com cartão fará parte do MVP?
6. O frete regional terá prazo estimado no MVP?
7. As páginas institucionais serão mantidas estáticas no frontend ou passarão a ser administráveis?
8. Quais perfis administrativos adicionais serão necessários além de `ADMIN`?
9. Quais políticas de cancelamento, troca e devolução devem ser aplicadas?
10. Qual provedor será utilizado para envio de e-mails transacionais?
11. Quais dados fiscais serão necessários para emissão de documentos?
12. Haverá integração com ERP, estoque externo ou sistema de lojas físicas?

---

## 16. Referências do frontend

- `src/router-tree-gen.ts`
- `src/pages/_app/products/index.tsx`
- `src/pages/_app/products/category/$category.tsx`
- `src/pages/_app/products/$productId.tsx`
- `src/components/ProductCard/index.tsx`
- `src/components/ProductList/index.tsx`
- `src/components/CartDrawer/index.tsx`
- `src/contexts/CartContext.tsx`
- `src/contexts/CartProvider.tsx`
- `src/components/LoginForm/index.tsx`
- `src/components/RegisterForm/index.tsx`
- `src/components/RegisterForm/register-form.schema.ts`
- `src/components/CEPForm/index.tsx`
- `src/components/CEPForm/cep-form.schema.ts`
- `src/interfaces/product.ts`
- `src/interfaces/category.ts`
- `src/interfaces/adress.ts`
- `src/components/SubscriptionForm/index.tsx`