import { FastifyReply, FastifyRequest } from "fastify";
import type { CategoryFilters } from "../types/index.js";
import {
  getCategories,
  getCategoryById,
} from "../services/categories.service.js";
import { categoryFiltersSchema } from "../utils/validators.js";

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
