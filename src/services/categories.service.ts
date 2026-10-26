import type { CategoryFilters } from "../types/index.js";
import { prisma } from "../utils/prisma.js";

export const getCategories = async (filters: CategoryFilters) => {
  const { page = 1, limit = 20, search } = filters;

  const where: any = { active: true };

  if (search && search.trim()) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  const skip = Number((page - 1) * limit);
  const take = Number(limit);

  try {
    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.category.count({ where }),
    ]);

    return {
      categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    throw error;
  }
};

export const getCategoryById = async (id: number) => {

  try {
    const category = await prisma.category.findUnique({
      where: { id },
    });


  if (!category) {
    const error = new Error("Categoria não encontrada");
    Object.assign(error, { statusCode: 404 });
    throw error;
  }

  return category;

  } catch (error) {
    console.error("Erro ao buscar categoria:", error);
    throw error;
  }
};
