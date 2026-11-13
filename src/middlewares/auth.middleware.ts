import { FastifyReply, FastifyRequest } from "fastify";

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void | FastifyReply> => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ message: "Token inválido ou expirado" });
  }
};
