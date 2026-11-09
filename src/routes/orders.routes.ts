import { FastifyInstance } from "fastify";
import {
  createNewOrder,
  getOrder,
  listOrders,
  updateExistingOrder,
} from "../controllers/orders.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export async function orderRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authenticate);

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Orders"],
        description: "Cria um pedido para o usuário autenticado e reserva o estoque",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["items", "shippingAddress", "paymentMethod"],
          properties: {
            userId: {
              type: "integer",
              minimum: 1,
              description:
                "ID opcional do usuário; deve corresponder ao usuário autenticado",
            },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "integer" },
                  quantity: { type: "integer" },
                  size: { type: "string" },
                },
              },
            },
            shippingAddress: {
              type: "object",
              required: [
                "cep",
                "street",
                "number",
                "neighborhood",
                "city",
                "state",
                "country",
              ],
              additionalProperties: false,
              properties: {
                cep: { type: "string" },
                street: { type: "string" },
                number: { type: "string" },
                complement: { type: "string" },
                neighborhood: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                country: { type: "string" },
              },
            },
            paymentMethod: {
              type: "string",
              enum: ["PIX", "CREDIT_CARD"],
            },
          },
        },
        responses: {
          201: {
            description: "Pedido criado com sucesso",
            type: "object",
            properties: {
              message: { type: "string" },
              order: { type: "object", additionalProperties: true },
            },
          },
          400: {
            description: "Dados inválidos",
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object", additionalProperties: true },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: { message: { type: "string" } },
          },
          403: {
            description: "userId informado não corresponde ao usuário autenticado",
            type: "object",
            properties: { message: { type: "string" } },
          },
          404: {
            description: "Produto não encontrado",
            type: "object",
            properties: { message: { type: "string" } },
          },
          409: {
            description: "Produto inativo ou estoque insuficiente",
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
      },
    },
    createNewOrder,
  );

  fastify.get(
    "/",
    {
      schema: {
        tags: ["Orders"],
        description: "Lista os pedidos do usuário autenticado",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            status: {
              type: "string",
              enum: ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"],
            },
            userId: { type: "integer" },
            startDate: { type: "string" },
            endDate: { type: "string" },
          },
        },
        responses: {
          200: {
            description: "Lista de pedidos",
            type: "object",
            properties: {
              orders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer" },
                    userId: { type: "integer", nullable: true },
                    total: { type: "number" },
                    status: {
                      type: "string",
                      enum: [
                        "PENDING",
                        "PAID",
                        "SHIPPED",
                        "DELIVERED",
                        "CANCELLED",
                      ],
                    },
                    shippingAddress: {
                      type: "object",
                      required: [
                        "cep",
                        "street",
                        "number",
                        "neighborhood",
                        "city",
                        "state",
                        "country",
                      ],
                      additionalProperties: false,
                      properties: {
                        cep: { type: "string" },
                        street: { type: "string" },
                        number: { type: "string" },
                        complement: { type: "string" },
                        neighborhood: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        country: { type: "string" },
                      },
                    },
                    paymentMethod: {
                      type: "string",
                      enum: ["PIX", "CREDIT_CARD"],
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    items: {
                      type: "array",
                      items: { type: "object", additionalProperties: true },
                    },
                  },
                },
              },
              total: { type: "integer" },
              page: { type: "integer" },
              limit: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
          400: {
            description: "Parâmetros de busca inválidos",
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object", additionalProperties: true },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
      },
    },
    listOrders,
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Orders"],
        description: "Obtém um pedido do usuário autenticado pelo ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "integer", minimum: 1 } },
          required: ["id"],
        },
        responses: {
          200: {
            description: "Pedido encontrado",
            type: "object",
            properties: {
              id: { type: "integer" },
              userId: { type: "integer", nullable: true },
              total: { type: "number" },
              status: {
                type: "string",
                enum: ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"],
              },
              shippingAddress: {
                type: "object",
                required: [
                  "cep",
                  "street",
                  "number",
                  "neighborhood",
                  "city",
                  "state",
                  "country",
                ],
                additionalProperties: false,
                properties: {
                  cep: { type: "string" },
                  street: { type: "string" },
                  number: { type: "string" },
                  complement: { type: "string" },
                  neighborhood: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  country: { type: "string" },
                },
              },
              paymentMethod: {
                type: "string",
                enum: ["PIX", "CREDIT_CARD"],
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              items: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
            },
          },
          400: {
            description: "ID do pedido inválido",
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object", additionalProperties: true },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: { message: { type: "string" } },
          },
          404: {
            description: "Pedido não encontrado",
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
      },
    },
    getOrder,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Orders"],
        description:
          "Atualiza endereço de entrega ou forma de pagamento de um pedido pendente próprio",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: { id: { type: "integer" } },
          required: ["id"],
        },
        body: {
          type: "object",
          minProperties: 1,
          properties: {
            shippingAddress: {
              type: "object",
              minProperties: 1,
              additionalProperties: false,
              properties: {
                cep: { type: "string" },
                street: { type: "string" },
                number: { type: "string" },
                complement: { type: "string" },
                neighborhood: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                country: { type: "string" },
              },
            },
            paymentMethod: {
              type: "string",
              enum: ["PIX", "CREDIT_CARD"],
            },
          },
        },
        responses: {
          200: {
            description: "Pedido atualizado com sucesso",
            type: "object",
            additionalProperties: true,
          },
          400: {
            description: "Dados ou ID inválidos",
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object", additionalProperties: true },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: { message: { type: "string" } },
          },
          404: {
            description: "Pedido não encontrado",
            type: "object",
            properties: { message: { type: "string" } },
          },
          409: {
            description: "Pedido não está pendente",
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
      },
    },
    updateExistingOrder,
  );
}
