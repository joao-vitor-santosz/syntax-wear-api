import z from "zod";

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  cpf: z.string().optional(),
  dateOfBirth: z.iso.date("Data de nascimento inválida").optional(),
  phone: z.string().optional(),
});

export const productFiltersSchema = z
  .object({
    page: z.coerce.number().int().min(1, "Página deve ser no mínimo 1").optional(),
    limit: z.coerce.number().int().min(1, "Limite deve ser no mínimo 1").optional(),
    minPrice: z.coerce.number().min(0, "Preço mínimo não pode ser negativo").optional(),
    maxPrice: z.coerce.number().min(0, "Preço máximo não pode ser negativo").optional(),
    search: z.string().optional(),
    sortBy: z.enum(["price", "name", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    categoryId: z.coerce.number().int().min(1, "ID da categoria deve ser no mínimo 1").optional(),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    {
      message: "Preço mínimo não pode ser maior que o preço máximo",
      path: ["minPrice"],
    },
  );

export const categoryFiltersSchema = z.object({
  page: z.coerce.number().int().min(1, "Página deve ser no mínimo 1").optional(),
  limit: z.coerce.number().int().min(1, "Limite deve ser no mínimo 1").optional(),
  search: z.string().optional(),
});


  export const createProductSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    price: z.number().nonnegative("Preço não pode ser negativo"),
    slug: z.string().min(1, "Slug é obrigatório"),
    stock: z.number().int().nonnegative("Estoque não pode ser negativo"),
    active: z.boolean(),
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    categoryId: z.number().int().nonnegative("ID da categoria não pode ser negativo"),
  });

  export const updateProductSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").optional(),
    description: z.string().min(1, "Descrição é obrigatória").optional(),
    price: z.number().nonnegative("Preço não pode ser negativo").optional(),
    slug: z.string().min(1, "Slug é obrigatório").optional(),
    stock: z.number().int().nonnegative("Estoque não pode ser negativo").optional(),
    active: z.boolean().optional(),
    categoryId: z.number().int().min(1, "ID da categoria deve ser no mínimo 1").optional(),
    sizes: z.array(z.string()).optional(),
    colors: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
  });

  export const deleteProductSchema = z.object({
    id: z.number().int().nonnegative("ID não pode ser negativo"),
  });