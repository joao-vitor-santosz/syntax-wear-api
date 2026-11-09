import { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateOrder,
  OrderFilters,
  UpdateOrder,
} from "../types/index.js";
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
} from "../services/orders.service.js";
import {
  createOrderSchema,
  orderFiltersSchema,
  orderParamsSchema,
  updateOrderSchema,
} from "../utils/validators.js";

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

export const createNewOrder = async (
  request: FastifyRequest<{ Body: CreateOrder }>,
  reply: FastifyReply,
) => {
  const body = createOrderSchema.parse(request.body);
  const { userId: authenticatedUserId } = request.user as { userId: number };
  if (body.userId !== undefined && body.userId !== authenticatedUserId) {
    const error = new Error(
      "O userId informado deve corresponder ao usuário autenticado",
    );
    Object.assign(error, { statusCode: 403 });
    throw error;
  }

  const { userId: _requestedUserId, ...orderData } = body;
  const order = await createOrder(authenticatedUserId, orderData);

  reply.status(201).send({ message: "Pedido criado com sucesso", order });
};

export const updateExistingOrder = async (
  request: FastifyRequest<{
    Params: { id: number };
    Body: UpdateOrder;
  }>,
  reply: FastifyReply,
) => {
  const { id } = orderParamsSchema.parse(request.params);
  const body = updateOrderSchema.parse(request.body);
  const { userId } = request.user as { userId: number };
  const order = await updateOrder(id, userId, body);

  reply.status(200).send(order);
};
