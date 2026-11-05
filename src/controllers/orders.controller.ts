import { FastifyReply, FastifyRequest } from "fastify";
import type { OrderFilters } from "../types/index.js";
import { getOrderById, getOrders } from "../services/orders.service.js";
import { orderFiltersSchema, orderParamsSchema } from "../utils/validators.js";

export const listOrders = async (
  request: FastifyRequest<{ Querystring: OrderFilters }>,
  reply: FastifyReply,
) => {
  const filters = orderFiltersSchema.parse(request.query);
  const { userId } = request.user as { userId: number };
  const result = await getOrders(userId, filters);

  reply.status(200).send(result);
};

export const getOrder = async (
  request: FastifyRequest<{ Params: { id: number } }>,
  reply: FastifyReply,
) => {
  const { id } = orderParamsSchema.parse(request.params);
  const { userId } = request.user as { userId: number };
  const order = await getOrderById(id, userId);

  reply.status(200).send(order);
};
