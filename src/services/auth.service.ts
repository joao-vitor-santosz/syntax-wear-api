import { AuthRequest, RegisterRequest } from "../types/index.js";
import { prisma } from "../utils/prisma.js";
import bcrypt from "bcrypt";
import type { Prisma } from "@prisma/client";

const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  cpf: true,
  birthDate: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  role: true,
} satisfies Prisma.UserSelect;

export const registerUser = async (payload: RegisterRequest) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new Error("Email já cadastrado.");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const newUser = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      cpf: payload.cpf,
      birthDate: payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : undefined,
      phone: payload.phone,
      role: "USER",
    },
    select: publicUserSelect,
  });

  return newUser;
};

export const loginUser = async (data: AuthRequest) => {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
    select: {
      ...publicUserSelect,
      password: true,
    },
  });

  if(!user) {
    throw new Error("Usuário não encontrado.");
  }

  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if(!isValidPassword) {
    throw new Error("Senha inválida.");
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};