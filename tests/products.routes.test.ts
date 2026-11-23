import Fastify, { type FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { Prisma, type Category, type Product } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../src/middlewares/error.middleware.js";
import { productRoutes } from "../src/routes/products.routes.js";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "../src/services/products.service.js";

vi.mock("../src/services/products.service.js", () => ({
  createProduct: vi.fn(),
  deleteProduct: vi.fn(),
  getProductById: vi.fn(),
  getProducts: vi.fn(),
  updateProduct: vi.fn(),
}));

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

const category: Category = {
  id: 3,
  name: "Calçados",
  slug: "calcados",
  description: null,
  active: true,
  createdAt,
  updatedAt,
};

const product: Product = {
  id: 1,
  slug: "tenis-classic",
  name: "Tênis Classic",
  images: ["/uploads/tenis-classic.jpg"],
  description: "Tênis para uso diário",
  price: new Prisma.Decimal("299.90"),
  sizes: ["38", "39", "40"],
  colors: ["Preto"],
  stock: 12,
  active: true,
  categoryId: category.id,
  createdAt,
  updatedAt,
};

const productWithCategory = { ...product, category };

describe("Rotas de produtos", () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    server.setErrorHandler(errorHandler);
    server.register(jwt, { secret: "test-secret" });
    server.register(productRoutes, { prefix: "/products" });
    await server.ready();

    vi.mocked(getProducts).mockResolvedValue({
      data: [product],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.mocked(getProductById).mockResolvedValue(productWithCategory);
    vi.mocked(createProduct).mockResolvedValue(product);
    vi.mocked(updateProduct).mockResolvedValue(product);
    vi.mocked(deleteProduct).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await server.close();
  });

  const adminHeaders = () => ({
    authorization: `Bearer ${server.jwt.sign({ userId: 1, role: "ADMIN" })}`,
  });

  it("lista produtos aplicando filtros de busca", async () => {
    vi.mocked(getProducts).mockResolvedValueOnce({
      data: [product],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });

    const response = await server.inject({
      method: "GET",
      url: "/products?page=2&limit=5&minPrice=100&maxPrice=500&search=tenis&sortBy=price&sortOrder=desc",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: [{ id: product.id, name: product.name }],
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });
    expect(getProducts).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      minPrice: 100,
      maxPrice: 500,
      search: "tenis",
      sortBy: "price",
      sortOrder: "desc",
    });
  });

  it("busca um produto pelo ID", async () => {
    const response = await server.inject({
      method: "GET",
      url: `/products/${product.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: { id: category.id, name: category.name },
    });
    expect(getProductById).toHaveBeenCalledWith(product.id);
  });

  it("cria um produto com slug gerado a partir do nome", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/products",
      headers: adminHeaders(),
      payload: {
        name: "Tênis Classic",
        description: "Tênis para uso diário",
        price: 299.9,
        stock: 12,
        active: true,
        categoryId: category.id,
        sizes: ["38", "39", "40"],
        colors: ["Preto"],
        images: ["/uploads/tenis-classic.jpg"],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      message: "Produto criado com sucesso",
    });
    expect(createProduct).toHaveBeenCalledWith({
      name: "Tênis Classic",
      description: "Tênis para uso diário",
      price: 299.9,
      slug: "tenis-classic",
      stock: 12,
      active: true,
      categoryId: category.id,
      sizes: ["38", "39", "40"],
      colors: ["Preto"],
      images: ["/uploads/tenis-classic.jpg"],
    });
  });

  it("atualiza um produto pelo ID e atualiza o slug quando o nome muda", async () => {
    const response = await server.inject({
      method: "PUT",
      url: `/products/${product.id}`,
      headers: adminHeaders(),
      payload: { name: "Tênis Moderno", price: 349.9 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: product.id });
    expect(updateProduct).toHaveBeenCalledWith(product.id, {
      name: "Tênis Moderno",
      price: 349.9,
      slug: "tenis-moderno",
    });
  });

  it("aciona a exclusão do produto e retorna status 204", async () => {
    const response = await server.inject({
      method: "DELETE",
      url: `/products/${product.id}`,
      headers: adminHeaders(),
    });

    expect(response.statusCode).toBe(204);
    expect(deleteProduct).toHaveBeenCalledWith(product.id);
  });

  it("rejeita a criação quando faltam campos obrigatórios", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/products",
      headers: adminHeaders(),
      payload: { name: product.name },
    });

    expect(response.statusCode).toBe(400);
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("exige autenticação para criar produtos", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/products",
      payload: {
        name: "Tênis Classic",
        description: "Tênis para uso diário",
        price: 299.9,
        stock: 12,
        active: true,
        categoryId: category.id,
      },
    });

    expect(response.statusCode).toBe(401);
    expect(createProduct).not.toHaveBeenCalled();
  });
});
