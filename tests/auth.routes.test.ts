import Fastify, { type FastifyInstance } from "fastify";
import jwt from "@fastify/jwt";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authRoutes } from "../src/routes/auth.routes.js";
import { errorHandler } from "../src/middlewares/error.middleware.js";
import { loginUser, registerUser } from "../src/services/auth.service.js";

vi.mock("../src/services/auth.service.js", () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}));

const user: Awaited<ReturnType<typeof registerUser>> = {
  id: 1,
  firstName: "João",
  lastName: "Silva",
  email: "joao@example.com",
  cpf: null,
  birthDate: null,
  phone: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  role: "USER",
};

describe("Rotas de autenticação", () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    server = Fastify();
    vi.mocked(registerUser).mockResolvedValue(user);
    vi.mocked(loginUser).mockResolvedValue(user);
    server.setErrorHandler(errorHandler);
    server.register(jwt, { secret: "test-secret" });
    server.register(authRoutes, { prefix: "/auth" });
  });

  afterEach(async () => {
    await server.close();
  });

  it("cria um usuário e retorna status 201 com token", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        firstName: "João",
        lastName: "Silva",
        email: "joao@example.com",
        password: "senha-segura",
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token: expect.any(String),
    });
    expect(registerUser).toHaveBeenCalledWith({
      firstName: "João",
      lastName: "Silva",
      email: "joao@example.com",
      password: "senha-segura",
    });
  });

  it("autentica um usuário e retorna status 200 com token", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "joao@example.com",
        password: "senha-segura",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      token: expect.any(String),
    });
    expect(loginUser).toHaveBeenCalledWith({
      email: "joao@example.com",
      password: "senha-segura",
    });
  });

  it("rejeita o login quando a senha está incorreta", async () => {
    vi.mocked(loginUser).mockRejectedValue(new Error("Senha inválida."));

    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "joao@example.com",
        password: "senha-errada",
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ message: "Erro interno do servidor" });
    expect(loginUser).toHaveBeenCalledWith({
      email: "joao@example.com",
      password: "senha-errada",
    });
  });

  it("rejeita o login quando o e-mail não existe", async () => {
    vi.mocked(loginUser).mockRejectedValue(
      new Error("Usuário não encontrado."),
    );

    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: {
        email: "inexistente@example.com",
        password: "senha-segura",
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ message: "Erro interno do servidor" });
    expect(loginUser).toHaveBeenCalledWith({
      email: "inexistente@example.com",
      password: "senha-segura",
    });
  });

  it("rejeita o registro quando faltam campos obrigatórios", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "joao@example.com" },
    });

    expect(response.statusCode).toBe(400);
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("rejeita o login quando faltam campos obrigatórios", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "joao@example.com" },
    });

    expect(response.statusCode).toBe(400);
    expect(loginUser).not.toHaveBeenCalled();
  });
});
