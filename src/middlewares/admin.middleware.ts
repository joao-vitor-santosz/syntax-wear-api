import { FastifyReply, FastifyRequest } from "fastify";

export const requireAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void | FastifyReply> => {
  if (request.user.role !== "ADMIN") {
    return reply.status(403).send({ message: "Acesso restrito a administradores" });
  }
};
