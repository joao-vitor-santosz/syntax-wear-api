import { FastifyInstance } from "fastify";
import {
  createNewCategory,
  deleteExistingCategory,
  getCategory,
  listCategories,
  updateExistingCategory,
} from "../controllers/categories.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export async function categoryRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authenticate);
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Categories"],
        description: "Lista as categorias ativas",
        querystring: {
          type: "object",
          properties: {
            page: { type: "number", minimum: 1 },
            limit: { type: "number", minimum: 1 },
            search: { type: "string" },
          },
        },
        responses: {
          200: {
            description: "Lista de categorias",
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    description: { type: "string", nullable: true },
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
        },
      },
    },
    listCategories,
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Categories"],
        description: "Obtém uma categoria específica pelo ID",
        params: {
          type: "object",
          properties: {
            id: { type: "number" },
          },
          required: ["id"],
        },
        responses: {
          200: {
            description: "Categoria encontrada",
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string", nullable: true },
              active: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          400: {
            description: "ID da categoria inválido",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          404: {
            description: "Categoria não encontrada",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    getCategory,
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Categories"],
        description: "Cria uma nova categoria",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 1 },
            description: { type: "string" },
            active: { type: "boolean" },
          },
        },
        responses: {
          201: {
            description: "Categoria criada com sucesso",
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string", nullable: true },
              active: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
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
          409: {
            description: "Já existe uma categoria com esse slug",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    createNewCategory,
  );

  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["Categories"],
        description: "Atualiza uma categoria existente",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "integer", minimum: 1 },
          },
          required: ["id"],
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string", minLength: 1 },
            description: { type: "string" },
            active: { type: "boolean" },
          },
        },
        responses: {
          200: {
            description: "Categoria atualizada com sucesso",
            type: "object",
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string", nullable: true },
              active: { type: "boolean" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
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
          404: {
            description: "Categoria não encontrada",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          409: {
            description: "Já existe uma categoria com esse slug",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    updateExistingCategory,
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Categories"],
        description: "Desativa uma categoria",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "integer", minimum: 1 },
          },
          required: ["id"],
        },
        responses: {
          204: {
            description: "Categoria desativada com sucesso",
          },
          400: {
            description: "ID da categoria inválido",
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
          404: {
            description: "Categoria não encontrada",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    deleteExistingCategory,
  );
}
