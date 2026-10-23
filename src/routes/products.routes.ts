import { FastifyInstance } from "fastify";
import {
  createNewProduct,
  getProduct,
  listProducts,
  updateExistingProduct,
} from "../controllers/products.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authenticate);
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Products"],
        description: "Lista os produtos disponíveis",
        querystring: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            minPrice: { type: "number" },
            maxPrice: { type: "number" },
            search: { type: "string" },
            sortBy: { type: "string", enum: ["price", "name", "createdAt"] },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
          },
        },
        responses: {
          200: {
            description: "Lista de produtos",
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    slug: { type: "string" },
                    name: { type: "string" },
                    images: {
                      type: "array",
                      nullable: true,
                      items: { type: "string" },
                    },
                    description: { type: "string", nullable: true },
                    price: { type: "number" },
                    sizes: {
                      type: "array",
                      nullable: true,
                      items: { type: "number" },
                    },
                    colors: {
                      type: "array",
                      nullable: true,
                      items: { type: "string" },
                    },
                    stock: { type: "number" },
                    active: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
              total: { type: "number" },
              page: { type: "number" },
              limit: { type: "number" },
              totalPages: { type: "number" },
            },
          },
          400: {
            description: "Parâmetros de busca inválidos",
            type: "object",
            properties: {
              message: { type: "string" },
              errors: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    listProducts,
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Obtém um produto específico pelo ID",
        params: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
        responses: {
          200: {
            description: "Produto encontrado",
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              price: { type: "number" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "ID do produto inválido",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    getProduct,
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Products"],
        description: "Cria um novo produto",
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            stock: { type: "number" },
            active: { type: "boolean" },
            sizes: {
              type: "array",
              items: { type: "string" },
            },
            colors: {
              type: "array",
              items: { type: "string" },
            },
            images: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["name", "description", "price", "active", "stock"],
        },
        responses: {
          201: {
            description: "Produto criado com sucesso",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          400: {
            description: "Dados inválidos",
            type: "object",
            properties: {
              message: { type: "string" },
              errors: {
                type: "object",
                additionalProperties: true,
              },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    createNewProduct,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Products"],
        description: "Atualizar produto",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID do produto a ser atualizado" },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
            stock: { type: "number" },
            active: { type: "boolean" },
            sizes: {
              type: "array",
              items: { type: "string" },
            },
            colors: {
              type: "array",
              items: { type: "string" },
            },
            images: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        responses: {
          200: {
            description: "Produto atualizado com sucesso",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description : { type: "string", nullable: true },
              price: { type: "number" },
              colors: {
                type: "array",
                nullable: true,
                items: { type: "string" },
              },
              stock: { type: "number" },
              tags: {
                type: "array",
                nullable: true,
                items: { type: "string" },
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "ID do produto inválido",
            type: "object",
            properties: {
              error: { type: "string" },
              details: {
                type: "array",
                nullable: true,
              },
            },
          },
          401: {
            description: "Não autorizado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          404: {
            description: "Produto não encontrado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    updateExistingProduct,
  );
}