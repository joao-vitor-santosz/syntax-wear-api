import { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import type {
  CreateOrder,
  OrderShippingAddress,
  OrderFilters,
  UpdateOrder,
} from "../types/index.js";

const toShippingAddressJson = (
  address: OrderShippingAddress,
): Prisma.InputJsonObject => ({
  cep: address.cep,
  street: address.street,
  number: address.number,
  ...(address.complement === undefined
    ? {}
    : { complement: address.complement }),
  neighborhood: address.neighborhood,
  city: address.city,
  state: address.state,
  country: address.country,
});

const toShippingAddressPatchJson = (
  address: Partial<UpdateOrder["shippingAddress"]>,
): Prisma.InputJsonObject => ({
  ...(address?.cep === undefined ? {} : { cep: address.cep }),
  ...(address?.street === undefined ? {} : { street: address.street }),
  ...(address?.number === undefined ? {} : { number: address.number }),
  ...(address?.complement === undefined
    ? {}
    : { complement: address?.complement }),
  ...(address?.neighborhood === undefined
    ? {}
    : { neighborhood: address.neighborhood }),
  ...(address?.city === undefined ? {} : { city: address.city }),
  ...(address?.state === undefined ? {} : { state: address.state }),
  ...(address?.country === undefined ? {} : { country: address.country }),
});

export const getOrders = async (userId: number, filters: OrderFilters) => {
  const {
    page = 1,
    limit = 20,
    status,
    userId: filterUserId,
    startDate,
    endDate,
  } = filters;
  const where = {
    AND: [
      { userId },
      ...(filterUserId === undefined ? [] : [{ userId: filterUserId }]),
      ...(status === undefined ? [] : [{ status }]),
      ...(!startDate && !endDate
        ? []
        : [
            {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            },
          ]),
    ],
  };
  const skip = Number((page - 1) * limit);
  const take = Number(limit);

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    throw error;
  }
};

export const getOrderById = async (id: number, userId: number) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id, userId },
      include: { items: true },
    });

    if (!order) {
      const error = new Error("Pedido não encontrado");
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    return order;
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    throw error;
  }
};

export const createOrder = async (userId: number, data: CreateOrder) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const quantitiesByProduct = new Map<number, number>();
      for (const item of data.items) {
        const currentQuantity = quantitiesByProduct.get(item.productId) ?? 0;
        if (item.quantity > 2147483647 - currentQuantity) {
          const error = new Error("Quantidade total do produto excede o limite");
          Object.assign(error, { statusCode: 400 });
          throw error;
        }

        quantitiesByProduct.set(
          item.productId,
          currentQuantity + item.quantity,
        );
      }

      const products = await transaction.product.findMany({
        where: { id: { in: [...quantitiesByProduct.keys()] } },
      });
      const productsById = new Map(products.map((product) => [product.id, product]));

      for (const productId of quantitiesByProduct.keys()) {
        const product = productsById.get(productId);
        if (!product) {
          const error = new Error(`Produto ${productId} não encontrado`);
          Object.assign(error, { statusCode: 404 });
          throw error;
        }

        const requestedQuantity = quantitiesByProduct.get(productId);
        if (requestedQuantity === undefined) {
          throw new Error("Quantidade do produto não encontrada no pedido");
        }

        if (!product.active || product.stock < requestedQuantity) {
          const error = new Error(
            `Produto ${product.name} inativo ou sem estoque suficiente`,
          );
          Object.assign(error, { statusCode: 409 });
          throw error;
        }
      }

      const items = data.items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          const error = new Error(`Produto ${item.productId} não encontrado`);
          Object.assign(error, { statusCode: 404 });
          throw error;
        }

        if (
          item.size !== undefined &&
          (!Array.isArray(product.sizes) ||
            !product.sizes.some(
              (availableSize) => String(availableSize) === item.size,
            ))
        ) {
          const error = new Error(
            `Tamanho ${item.size} indisponível para o produto ${product.name}`,
          );
          Object.assign(error, { statusCode: 400 });
          throw error;
        }

        return {
          productId: product.id,
          price: product.price,
          quantity: item.quantity,
          size: item.size,
        };
      });
      const total = items.reduce(
        (sum, item) => sum.add(item.price.mul(item.quantity)),
        new Prisma.Decimal(0),
      );

      for (const [productId, quantity] of [...quantitiesByProduct].sort(
        ([left], [right]) => left - right,
      )) {
        const reservation = await transaction.product.updateMany({
          where: {
            id: productId,
            active: true,
            stock: { gte: quantity },
          },
          data: { stock: { decrement: quantity } },
        });

        if (reservation.count !== 1) {
          const error = new Error(
            "Estoque insuficiente ou produto indisponível para o pedido",
          );
          Object.assign(error, { statusCode: 409 });
          throw error;
        }
      }

      return transaction.order.create({
        data: {
          userId,
          total,
          shippingAddress: toShippingAddressJson(data.shippingAddress),
          paymentMethod: data.paymentMethod,
          items: { create: items },
        },
        include: { items: true },
      });
    });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    throw error;
  }
};

export const updateOrder = async (
  id: number,
  userId: number,
  data: UpdateOrder,
) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findFirst({
        where: { id, userId },
      });

      if (!order) {
        const error = new Error("Pedido não encontrado");
        Object.assign(error, { statusCode: 404 });
        throw error;
      }

      if (order.status !== "PENDING") {
        const error = new Error(
          "Somente pedidos pendentes podem ser atualizados",
        );
        Object.assign(error, { statusCode: 409 });
        throw error;
      }

      const updateData: Prisma.OrderUpdateManyMutationInput = {
        ...(data.shippingAddress
          ? {
              shippingAddress: (() => {
                const currentAddress = order.shippingAddress;
                if (
                  currentAddress === null ||
                  typeof currentAddress !== "object" ||
                  Array.isArray(currentAddress)
                ) {
                  throw new Error(
                    "Endereço de entrega salvo no pedido está inválido",
                  );
                }

                return {
                  ...currentAddress,
                  ...toShippingAddressPatchJson(data.shippingAddress),
                };
              })(),
            }
          : {}),
        ...(data.paymentMethod === undefined
          ? {}
          : { paymentMethod: data.paymentMethod }),
      };
      const updated = await transaction.order.updateMany({
        where: { id, userId, status: "PENDING" },
        data: updateData,
      });

      if (updated.count !== 1) {
        const error = new Error(
          "O pedido não está mais pendente e não pode ser atualizado",
        );
        Object.assign(error, { statusCode: 409 });
        throw error;
      }

      return transaction.order.findUniqueOrThrow({
        where: { id },
        include: { items: true },
      });
    });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    throw error;
  }
};
