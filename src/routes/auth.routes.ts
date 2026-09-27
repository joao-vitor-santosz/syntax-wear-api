import { FastifyInstance } from "fastify";
import { register } from "../controllers/auth.controller.js";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/", {
    schema: {
      tags: ["Auth"],
      description: "Registra um novo usuário e retorna um token JWT",
      body: {
        type: "object",
        required: ["firstName", "lastName", "email", "password"],
        properties: {
          firstName: { type: "string", description: "Nome do usuário. Exemplo: João" },
          lastName: { type: "string", description: "Sobrenome do usuário" },
          email: { type: "string", format: "email", description: "E-mail do usuário" },
          password: { type: "string", description: "Senha do usuário (mínimo de 6 caracteres)" },
          cpf: { type: "string", description: "CPF do usuário" },
          dateOfBirth: { type: "string", format: "date", description: "Data de nascimento no formato AAAA-MM-DD" },
          phone: { type: "string", description: "Telefone do usuário" },
        }
      },
    },
  }, register);
}
