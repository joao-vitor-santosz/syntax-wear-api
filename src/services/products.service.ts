import { prisma } from "../utils/prisma";
import { ProductFilters } from "../types";

export const getProducts = async (filter: ProductFilters) => {
  const result = prisma.product.findMany({
    where: {
      price: { gte: filter.minPrice, lte: filter.maxPrice },
    },
  });

  return result;
};
