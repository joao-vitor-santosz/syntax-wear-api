import { FastifyReply, FastifyRequest } from "fastify";
import type {
  CategoryFilters,
  CreateCategory,
  UpdateCategory,
} from "../types/index.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../services/categories.service.js";
import {
  categoryFiltersSchema,
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "../utils/validators.js";
import { generateSlug } from "../utils/slug.js";

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
  };

  if (typeof body.name === "string" && body.name.trim()) {
    body.slug = generateSlug(body.name);
  }

  const validatedCategory = createCategorySchema.parse(body);
  const category = await createCategory(validatedCategory);

  reply.status(201).send({ message: "Categoria criada com sucesso", category });
};

export const updateExistingCategory = async (
  request: FastifyRequest<{
    Params: { id: number };
    Body: UpdateCategory;
  }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const validatedCategory = updateCategorySchema.parse(request.body);

  if (validatedCategory.name) {
    validatedCategory.slug = generateSlug(validatedCategory.name);
  }

  const category = await updateCategory(id, validatedCategory);
  reply.status(200).send(category);
};

export const deleteExistingCategory = async (
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const validatedParams = deleteCategorySchema.parse({ id });

  await deleteCategory(validatedParams.id);
  reply.status(204).send();
};
