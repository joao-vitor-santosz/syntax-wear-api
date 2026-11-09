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
    page: z.coerce
      .number()
      .int()
      .min(1, "Página deve ser no mínimo 1")
      .optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limite deve ser no mínimo 1")
      .optional(),
    minPrice: z.coerce
      .number()
      .min(0, "Preço mínimo não pode ser negativo")
      .optional(),
    maxPrice: z.coerce
      .number()
      .min(0, "Preço máximo não pode ser negativo")
      .optional(),
    search: z.string().optional(),
    sortBy: z.enum(["price", "name", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    categoryId: z.coerce
      .number()
      .int()
      .min(1, "ID da categoria deve ser no mínimo 1")
      .optional(),
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
  page: z.coerce
    .number()
    .int()
    .min(1, "Página deve ser no mínimo 1")
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limite deve ser no mínimo 1")
    .optional(),
  search: z.string().optional(),
});

export const orderFiltersSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, "Página deve ser no mínimo 1")
    .optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limite deve ser no mínimo 1")
    .optional(),
  status: z
    .enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"])
    .optional(),
  userId: z.coerce.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const orderParamsSchema = z.object({
  id: z.coerce.number().int().min(1, "ID do pedido deve ser maior que zero"),
});

const addressNameSchema = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(2, `${fieldName} deve ter ao menos 2 caracteres`)
    .max(maxLength, `${fieldName} excede o tamanho permitido`)
    .regex(
      /^[\p{L}\d][\p{L}\d .'’ºª/-]*$/u,
      `${fieldName} contém caracteres inválidos`,
    )
    .regex(/\p{L}/u, `${fieldName} deve conter ao menos uma letra`);

const shippingAddressSchema = z
  .object({
    cep: z
      .string()
      .trim()
      .regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato 00000-000"),
    street: addressNameSchema("Rua", 120),
    number: z
      .string()
      .trim()
      .min(1, "Número é obrigatório")
      .max(20, "Número excede o tamanho permitido")
      .regex(
        /^(?:\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?|s\/n)$/i,
        "Número deve conter um número de endereço válido",
      ),
    complement: z
      .string()
      .trim()
      .min(1, "Complemento não pode ficar vazio")
      .max(100, "Complemento excede o tamanho permitido")
      .regex(
        /^[\p{L}\d#][\p{L}\d .,ºª'’/-]*$/u,
        "Complemento contém caracteres inválidos",
      )
      .optional(),
    neighborhood: addressNameSchema("Bairro", 80),
    city: addressNameSchema("Cidade", 80),
    state: z
      .string()
      .trim()
      .min(2, "Estado deve ter ao menos 2 caracteres")
      .max(50, "Estado excede o tamanho permitido")
      .regex(/^[\p{L} .'’-]+$/u, "Estado deve conter somente letras"),
    country: z
      .string()
      .trim()
      .min(2, "País deve ter ao menos 2 caracteres")
      .max(56, "País excede o tamanho permitido")
      .regex(/^[\p{L} .'’-]+$/u, "País deve conter somente letras"),
  })
  .strict();

const updateShippingAddressSchema = shippingAddressSchema
  .partial()
  .refine((address) => Object.keys(address).length > 0, {
    message: "Informe ao menos um campo do endereço para atualizar",
  });

export const createOrderSchema = z.object({
  userId: z.number().int().min(1).max(2147483647).optional(),
  items: z
    .array(
      z.object({
        productId: z
          .number()
          .int()
          .min(1, "ID do produto deve ser maior que zero"),
        quantity: z
          .number()
          .int()
          .min(1, "Quantidade deve ser maior que zero"),
        size: z
          .string()
          .trim()
          .regex(/^[2-5]\d$/, "Tamanho deve ser numérico, por exemplo 40")
          .optional(),
      }).strict(),
    )
    .min(1, "O pedido deve conter ao menos um item"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["PIX", "CREDIT_CARD"], {
    error: "Forma de pagamento deve ser PIX ou CREDIT_CARD",
  }),
}).strict();

export const updateOrderSchema = z
  .object({
    shippingAddress: updateShippingAddressSchema.optional(),
    paymentMethod: z
      .enum(["PIX", "CREDIT_CARD"], {
        error: "Forma de pagamento deve ser PIX ou CREDIT_CARD",
      })
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um dado para atualizar",
  });

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  description: z.string().optional(),
  active: z.boolean(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  slug: z.string().min(1, "Slug é obrigatório").optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export const deleteCategorySchema = z.object({
  id: z.number().int().min(1, "ID da categoria deve ser maior que zero"),
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
  categoryId: z
    .number()
    .int()
    .nonnegative("ID da categoria não pode ser negativo"),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  description: z.string().min(1, "Descrição é obrigatória").optional(),
  price: z.number().nonnegative("Preço não pode ser negativo").optional(),
  slug: z.string().min(1, "Slug é obrigatório").optional(),
  stock: z
    .number()
    .int()
    .nonnegative("Estoque não pode ser negativo")
    .optional(),
  active: z.boolean().optional(),
  categoryId: z
    .number()
    .int()
    .min(1, "ID da categoria deve ser no mínimo 1")
    .optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

export const deleteProductSchema = z.object({
  id: z.number().int().nonnegative("ID não pode ser negativo"),
});
