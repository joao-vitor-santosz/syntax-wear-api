import type {
  CategoryFilters,
  CreateCategory,
  UpdateCategory,
} from "../types/index.js";
import { Prisma } from "@prisma/client";
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

export const createCategory = async (data: CreateCategory) => {
  try {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existingCategory) {
      const error = new Error("Slug já existe. Por favor, escolha outro slug.");
      Object.assign(error, { statusCode: 409 });
      throw error;
    }

    return await prisma.category.create({
      data,
    });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const conflictError = new Error(
        "Slug já existe. Por favor, escolha outro slug.",
      );
      Object.assign(conflictError, { statusCode: 409 });
      throw conflictError;
    }

    throw error;
  }
};

export const updateCategory = async (id: number, data: UpdateCategory) => {
  try {
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      const error = new Error("Categoria não encontrada");
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    if (data.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists && slugExists.id !== id) {
        const error = new Error(
          "Slug já existe. Por favor, escolha outro slug.",
        );
        Object.assign(error, { statusCode: 409 });
        throw error;
      }
    }

    return await prisma.category.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const conflictError = new Error(
        "Slug já existe. Por favor, escolha outro slug.",
      );
      Object.assign(conflictError, { statusCode: 409 });
      throw conflictError;
    }

    throw error;
  }
};

export const deleteCategory = async (id: number) => {
  try {
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      const error = new Error("Categoria não encontrada");
      Object.assign(error, { statusCode: 404 });
      throw error;
    }

    await prisma.category.update({
      where: { id },
      data: { active: false },
    });
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    throw error;
  }
};
