import { FastifyReply, FastifyRequest } from "fastify";
import { ProductFilters } from "../types/index.js";
import { getProducts } from "../services/products.service.js";
import { productFiltersSchema } from "../utils/validators.js";

export const listProducts = async (
  request: FastifyRequest<{ Querystring: ProductFilters }>,
  reply: FastifyReply,
) => {
  const filters = productFiltersSchema.parse(request.query);
  const result = await getProducts(filters as ProductFilters);
  reply.send(result);
};
