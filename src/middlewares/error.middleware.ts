import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      message: "Erro de validação (zod)",
      errors: z.treeifyError(error),
    });
  }

  if(error.code === "FST_ERR_VALIDATION"){
    return reply.status(400).send({
      message: "Erro de validação (fastify)",
      errors: error.validation,
    })
  }

  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  return reply.status(500).send({ message: "Erro interno do servidor" });
};
