import { FastifyInstance } from "fastify";
import { listProducts } from "../controllers/products.controller.js";

export async function productRoutes(fastify: FastifyInstance) {
  fastify.get("/", listProducts);
}
