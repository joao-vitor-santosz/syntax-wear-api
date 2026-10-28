import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const orderSeeds = [
  {
    createdAt: new Date("2026-10-10T12:00:00.000Z"),
    status: "PENDING" as const,
    paymentMethod: "PIX",
    shippingAddress: {
      recipient: "Cliente de teste",
      street: "Rua Exemplo",
      number: "100",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      postalCode: "01000-000",
    },
    items: [
      { productSlug: "tenis-street-classic", quantity: 1, size: "40" },
      { productSlug: "chinelo-wave-basic", quantity: 2, size: "39" },
    ],
  },
  {
    createdAt: new Date("2026-10-11T12:00:00.000Z"),
    status: "DELIVERED" as const,
    paymentMethod: "CREDIT_CARD",
    shippingAddress: {
      recipient: "Cliente de teste",
      street: "Avenida Exemplo",
      number: "250",
      neighborhood: "Jardins",
      city: "São Paulo",
      state: "SP",
      postalCode: "01400-000",
    },
    items: [
      { productSlug: "tenis-runner-performance", quantity: 1, size: "41" },
      { productSlug: "sandalia-comfort-soft", quantity: 1, size: "37" },
    ],
  },
] as const;

async function main() {
  const userEmail = process.env.SEED_ORDER_USER_EMAIL;

  if (!userEmail) {
    throw new Error(
      "Defina SEED_ORDER_USER_EMAIL com o e-mail de um usuário já cadastrado para criar os pedidos de exemplo.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    throw new Error(`Nenhum usuário encontrado com o e-mail ${userEmail}.`);
  }

  const productSlugs = [
    ...new Set(orderSeeds.flatMap((order) => order.items.map((item) => item.productSlug))),
  ];
  const products = await prisma.product.findMany({
    where: { slug: { in: productSlugs } },
  });
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const missingProductSlugs = productSlugs.filter(
    (slug) => !productsBySlug.has(slug),
  );

  if (missingProductSlugs.length > 0) {
    throw new Error(
      `Produtos necessários não encontrados. Execute o seed de produtos antes: ${missingProductSlugs.join(", ")}.`,
    );
  }

  for (const orderSeed of orderSeeds) {
    const items = orderSeed.items.map((item) => {
      const product = productsBySlug.get(item.productSlug);

      if (!product) {
        throw new Error(`Produto não encontrado: ${item.productSlug}.`);
      }

      return {
        productId: product.id,
        price: product.price,
        quantity: item.quantity,
        size: item.size,
      };
    });

    const total = items.reduce(
      (sum, item) => sum.add(item.price.mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    await prisma.$transaction(async (transaction) => {
      const existingOrder = await transaction.order.findFirst({
        where: {
          userId: user.id,
          createdAt: orderSeed.createdAt,
        },
      });

      const orderData = {
        userId: user.id,
        total,
        status: orderSeed.status,
        shippingAddress: orderSeed.shippingAddress,
        paymentMethod: orderSeed.paymentMethod,
      };

      const order = existingOrder
        ? await transaction.order.update({
            where: { id: existingOrder.id },
            data: orderData,
          })
        : await transaction.order.create({
            data: {
              ...orderData,
              createdAt: orderSeed.createdAt,
            },
          });

      await transaction.orderItem.deleteMany({
        where: { orderId: order.id },
      });
      await transaction.orderItem.createMany({
        data: items.map((item) => ({
          ...item,
          orderId: order.id,
        })),
      });
    });
  }

  console.log(`${orderSeeds.length} pedidos de exemplo inseridos ou atualizados.`);
}

main()
  .catch((error) => {
    console.error("Erro ao executar o seed de pedidos:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
