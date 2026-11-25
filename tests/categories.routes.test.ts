import Fastify, { type FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import type { Category } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../src/middlewares/error.middleware.js";
import { categoryRoutes } from "../src/routes/categories.routes.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "../src/services/categories.service.js";

vi.mock("../src/services/categories.service.js", () => ({
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getCategories: vi.fn(),
  getCategoryById: vi.fn(),
  updateCategory: vi.fn(),
}));

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

const category: Category = {
  id: 3,
  name: "Calçados",
  slug: "calcados",
  description: "Categorias de calçados",
  active: true,
  createdAt,
  updatedAt,
};

describe("Rotas de categorias", () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    server.setErrorHandler(errorHandler);
    server.register(jwt, { secret: "test-secret" });
    server.register(categoryRoutes, { prefix: "/categories" });
    await server.ready();

    vi.mocked(getCategories).mockResolvedValue({
      categories: [category],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(getCategoryById).mockResolvedValue(category);
    vi.mocked(createCategory).mockResolvedValue(category);
    vi.mocked(updateCategory).mockResolvedValue(category);
    vi.mocked(deleteCategory).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await server.close();
  });

  const adminHeaders = () => ({
    authorization: `Bearer ${server.jwt.sign({ userId: 1, role: "ADMIN" })}`,
  });

  it("lista categorias aplicando filtros de busca", async () => {
    vi.mocked(getCategories).mockResolvedValueOnce({
      categories: [category],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });

    const response = await server.inject({
      method: "GET",
      url: "/categories?page=2&limit=5&search=calca",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      categories: [{ id: category.id, name: category.name }],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });
    expect(getCategories).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      search: "calca",
    });
  });

  it("busca uma categoria pelo ID", async () => {
    const response = await server.inject({
      method: "GET",
      url: `/categories/${category.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: category.id,
      name: category.name,
      slug: category.slug,
    });
    expect(getCategoryById).toHaveBeenCalledWith(category.id);
  });

  it("cria uma categoria com slug gerado a partir do nome", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/categories",
      headers: adminHeaders(),
      payload: {
        name: "Calçados",
        description: "Categorias de calçados",
        active: true,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      message: "Categoria criada com sucesso",
      category: { id: category.id, name: category.name },
    });
    expect(createCategory).toHaveBeenCalledWith({
      name: "Calçados",
      description: "Categorias de calçados",
      active: true,
      slug: "calcados",
    });
  });

  it("atualiza uma categoria pelo ID e atualiza o slug quando o nome muda", async () => {
    vi.mocked(updateCategory).mockResolvedValueOnce({
      ...category,
      name: "Tênis",
      slug: "tenis",
    });

    const response = await server.inject({
      method: "PUT",
      url: `/categories/${category.id}`,
      headers: adminHeaders(),
      payload: { name: "Tênis", active: false },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: category.id,
      name: "Tênis",
      slug: "tenis",
    });
    expect(updateCategory).toHaveBeenCalledWith(category.id, {
      name: "Tênis",
      active: false,
      slug: "tenis",
    });
  });

  it("desativa uma categoria pelo ID e retorna status 204", async () => {
    const response = await server.inject({
      method: "DELETE",
      url: `/categories/${category.id}`,
      headers: adminHeaders(),
    });

    expect(response.statusCode).toBe(204);
    expect(deleteCategory).toHaveBeenCalledWith(category.id);
  });

  it("rejeita a criação quando faltam campos obrigatórios", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/categories",
      headers: adminHeaders(),
      payload: { name: category.name },
    });

    expect(response.statusCode).toBe(400);
    expect(createCategory).not.toHaveBeenCalled();
  });

  it("exige autenticação para criar categorias", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/categories",
      payload: { name: category.name, active: true },
    });

    expect(response.statusCode).toBe(401);
    expect(createCategory).not.toHaveBeenCalled();
  });

  it("exige perfil administrativo para criar categorias", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/categories",
      headers: {
        authorization: `Bearer ${server.jwt.sign({ userId: 2, role: "USER" })}`,
      },
      payload: { name: category.name, active: true },
    });

    expect(response.statusCode).toBe(403);
    expect(createCategory).not.toHaveBeenCalled();
  });
});
