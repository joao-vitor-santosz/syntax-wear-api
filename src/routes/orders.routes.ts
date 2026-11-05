import { FastifyInstance } from "fastify";
import { getOrder, listOrders } from "../controllers/orders.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export async function orderRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authenticate);

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
            page: { type: "integer", minimum: 1 },
            limit: { type: "integer", minimum: 1 },
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
                      additionalProperties: true,
                    },
                    paymentMethod: { type: "string" },
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
              shippingAddress: { type: "object", additionalProperties: true },
              paymentMethod: { type: "string" },
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
}
