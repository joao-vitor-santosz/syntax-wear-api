import { prisma } from "../utils/prisma.js";
import type { OrderFilters } from "../types/index.js";

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
