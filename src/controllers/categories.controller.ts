import { FastifyReply, FastifyRequest } from "fastify";
import type { CategoryFilters, CreateCategory } from "../types/index.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
} from "../services/categories.service.js";
import {
  categoryFiltersSchema,
  createCategorySchema,
} from "../utils/validators.js";
import slugify from "slugify";

export const listCategories = async (
  request: FastifyRequest<{ Querystring: CategoryFilters }>,
  reply: FastifyReply,
) => {
  const filters = categoryFiltersSchema.parse(request.query);
  const result = await getCategories(filters);
  reply.status(200).send(result);
};

export const getCategory = async (
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const category = await getCategoryById(id);
  reply.status(200).send(category);
};

export const createNewCategory = async (
  request: FastifyRequest<{ Body: CreateCategory }>,
  reply: FastifyReply,
) => {
  const body = {
    ...request.body,
    slug: slugify(request.body.name, {
      lower: true,
      strict: true,
      locale: "pt",
    }),
  };

  const validatedCategory = createCategorySchema.parse(body);
  const category = await createCategory(validatedCategory);

  reply.status(201).send({ message: "Categoria criada com sucesso" });
};
