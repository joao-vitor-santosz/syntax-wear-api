import Fastify, { type FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { Prisma, type Order, type OrderItem } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../src/middlewares/error.middleware.js";
import { orderRoutes } from "../src/routes/orders.routes.js";
import {
  cancelOrder,
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
} from "../src/services/orders.service.js";

vi.mock("../src/services/orders.service.js", () => ({
  cancelOrder: vi.fn(),
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  getOrders: vi.fn(),
  updateOrder: vi.fn(),
}));

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

const shippingAddress: Prisma.JsonObject = {
  cep: "01001-000",
  street: "Rua das Flores",
  number: "123",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "São Paulo",
  country: "Brasil",
};

const order: Order = {
  id: 10,
  userId: 1,
  total: new Prisma.Decimal("299.90"),
  status: "PENDING",
  shippingAddress,
  paymentMethod: "PIX",
  createdAt,
  updatedAt,
};

const orderItem: OrderItem = {
  id: 20,
  orderId: order.id,
  productId: 1,
  price: new Prisma.Decimal("299.90"),
  quantity: 1,
  size: "40",
  createdAt,
  updatedAt,
};

const orderWithItems = { ...order, items: [orderItem] };

describe("Rotas de pedidos", () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    server.setErrorHandler(errorHandler);
    server.register(jwt, { secret: "test-secret" });
    server.register(orderRoutes, { prefix: "/orders" });
    await server.ready();

    vi.mocked(getOrders).mockResolvedValue({
      orders: [orderWithItems],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(getOrderById).mockResolvedValue(orderWithItems);
    vi.mocked(createOrder).mockResolvedValue(orderWithItems);
    vi.mocked(updateOrder).mockResolvedValue(orderWithItems);
    vi.mocked(cancelOrder).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await server.close();
  });

  const userHeaders = () => ({
    authorization: `Bearer ${server.jwt.sign({ userId: 1, role: "USER" })}`,
  });

  it("lista pedidos do usuário aplicando filtros", async () => {
    vi.mocked(getOrders).mockResolvedValueOnce({
      orders: [orderWithItems],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });

    const response = await server.inject({
      method: "GET",
      url: "/orders?page=2&limit=5&status=PENDING&startDate=2026-01-01&endDate=2026-01-31",
      headers: userHeaders(),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      orders: [{ id: order.id, status: "PENDING" }],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });
    expect(getOrders).toHaveBeenCalledWith(1, {
      page: 2,
      limit: 5,
      status: "PENDING",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
  });

  it("busca um pedido pelo ID", async () => {
    const response = await server.inject({
      method: "GET",
      url: `/orders/${order.id}`,
      headers: userHeaders(),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: order.id,
      userId: order.userId,
      status: "PENDING",
      items: [{ productId: orderItem.productId, quantity: 1 }],
    });
    expect(getOrderById).toHaveBeenCalledWith(order.id, 1);
  });

  it("cria um pedido para o usuário autenticado", async () => {
    const payload = {
      userId: 1,
      items: [{ productId: 1, quantity: 1, size: "40" }],
      shippingAddress: {
        cep: "01001-000",
        street: "Rua das Flores",
        number: "123",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "São Paulo",
        country: "Brasil",
      },
      paymentMethod: "PIX",
    };

    const response = await server.inject({
      method: "POST",
      url: "/orders",
      headers: userHeaders(),
      payload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      message: "Pedido criado com sucesso",
      order: { id: order.id },
    });
    expect(createOrder).toHaveBeenCalledWith(1, {
      items: payload.items,
      shippingAddress: payload.shippingAddress,
      paymentMethod: "PIX",
    });
  });

  it("rejeita a criação quando o userId não pertence ao usuário autenticado", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/orders",
      headers: userHeaders(),
      payload: {
        userId: 2,
        items: [{ productId: 1, quantity: 1 }],
        shippingAddress: {
          cep: "01001-000",
          street: "Rua das Flores",
          number: "123",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "São Paulo",
          country: "Brasil",
        },
        paymentMethod: "PIX",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("atualiza endereço e forma de pagamento de um pedido", async () => {
    const response = await server.inject({
      method: "PUT",
      url: `/orders/${order.id}`,
      headers: userHeaders(),
      payload: {
        shippingAddress: { number: "456", complement: "Apto 10" },
        paymentMethod: "CREDIT_CARD",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: order.id });
    expect(updateOrder).toHaveBeenCalledWith(order.id, 1, {
      shippingAddress: { number: "456", complement: "Apto 10" },
      paymentMethod: "CREDIT_CARD",
    });
  });

  it("cancela um pedido próprio e retorna status 204", async () => {
    const response = await server.inject({
      method: "DELETE",
      url: `/orders/${order.id}`,
      headers: userHeaders(),
    });

    expect(response.statusCode).toBe(204);
    expect(cancelOrder).toHaveBeenCalledWith(order.id, 1);
  });

  it("rejeita a criação quando faltam campos obrigatórios", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/orders",
      headers: userHeaders(),
      payload: { items: [{ productId: 1, quantity: 1 }] },
    });

    expect(response.statusCode).toBe(400);
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("rejeita a atualização sem nenhum campo", async () => {
    const response = await server.inject({
      method: "PUT",
      url: `/orders/${order.id}`,
      headers: userHeaders(),
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(updateOrder).not.toHaveBeenCalled();
  });

  it("exige autenticação para listar pedidos", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/orders",
    });

    expect(response.statusCode).toBe(401);
    expect(getOrders).not.toHaveBeenCalled();
  });

  it("exige autenticação para criar pedidos", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/orders",
      payload: {
        items: [{ productId: 1, quantity: 1 }],
        shippingAddress,
        paymentMethod: "PIX",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(createOrder).not.toHaveBeenCalled();
  });
});
