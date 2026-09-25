import { prisma } from "../utils/prisma.js";
import { ProductFilters } from "../types/index.js";

export const getProducts = async (filter: ProductFilters) => {
  const {
    page = 1,
    limit = 20,
    minPrice,
    maxPrice,
    search,
    sortBy,
    sortOrder,
  } = filter;

  const where: any = {};

  // Filtro por preço
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};

    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }

    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  // Filtro por busca (name e description)
  if (search && search.trim()) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // Paginação
  const skip = Number((page - 1) * limit);
  const take = Number(limit);

  // Ordenação
  const orderBy: any = {};
  if (sortBy) {
    orderBy[sortBy] = sortOrder || "asc";
  }

  try {
    // Buscar produtos com filtros
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
        skip,
        take,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error("Erro ao buscar produtos: ", err);
    throw err;
  }
};
