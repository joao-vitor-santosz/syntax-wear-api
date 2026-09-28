import { FastifyInstance } from "fastify";
import { listProducts } from "../controllers/products.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", authenticate);
  fastify.get("/", listProducts);
}
