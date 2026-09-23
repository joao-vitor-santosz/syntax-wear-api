import { FastifyInstance } from "fastify";
import { listProducts } from "../controllers/products.controller";

export async function productRoutes(fastify: FastifyInstance) {
  fastify.get("/", listProducts);
}
