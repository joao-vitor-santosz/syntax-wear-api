import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    slug: "tenis",
    name: "Tênis",
    description: "Tênis casuais e esportivos.",
  },
  {
    slug: "botas",
    name: "Botas",
    description: "Botas para diferentes ocasiões e atividades.",
  },
  {
    slug: "sandalias",
    name: "Sandálias",
    description: "Sandálias confortáveis para o dia a dia.",
  },
  {
    slug: "mocassins",
    name: "Mocassins",
    description: "Mocassins para composições casuais e formais.",
  },
  {
    slug: "chinelos",
    name: "Chinelos",
    description: "Chinelos práticos e confortáveis.",
  },
  {
    slug: "sapatilhas",
    name: "Sapatilhas",
    description: "Sapatilhas leves e versáteis.",
  },
];

const products = [
  {
    slug: "tenis-street-classic",
    name: "Tenis Street Classic",
    categorySlug: "tenis",
    images: ["/uploads/tenis-street-classic.jpg"],
    description: "Tenis casual versatil para o dia a dia.",
    price: "299.90",
    sizes: [38, 39, 40, 41, 42],
    colors: ["Branco", "Preto"],
    stock: 25,
  },
  {
    slug: "tenis-runner-performance",
    name: "Tenis Runner Performance",
    categorySlug: "tenis",
    images: ["/uploads/tenis-runner-performance.jpg"],
    description: "Tenis leve para corrida e atividades esportivas.",
    price: "429.90",
    sizes: [38, 39, 40, 41, 42, 43],
    colors: ["Cinza", "Azul"],
    stock: 18,
  },
  {
    slug: "bota-urban-leather",
    name: "Bota Urban Leather",
    categorySlug: "botas",
    images: ["/uploads/bota-urban-leather.jpg"],
    description: "Bota de couro com design urbano e resistente.",
    price: "549.90",
    sizes: [38, 39, 40, 41, 42],
    colors: ["Marrom", "Preto"],
    stock: 12,
  },
  {
    slug: "sandalia-comfort-soft",
    name: "Sandalia Comfort Soft",
    categorySlug: "sandalias",
    images: ["/uploads/sandalia-comfort-soft.jpg"],
    description: "Sandalia confortavel para momentos de descanso.",
    price: "159.90",
    sizes: [35, 36, 37, 38, 39],
    colors: ["Bege", "Preto"],
    stock: 30,
  },
  {
    slug: "mocassim-essential",
    name: "Mocassim Essential",
    categorySlug: "mocassins",
    images: ["/uploads/mocassim-essential.jpg"],
    description: "Mocassim elegante para composicoes casuais e formais.",
    price: "349.90",
    sizes: [38, 39, 40, 41, 42],
    colors: ["Caramelo", "Preto"],
    stock: 14,
  },
  {
    slug: "chinelo-wave-basic",
    name: "Chinelo Wave Basic",
    categorySlug: "chinelos",
    images: ["/uploads/chinelo-wave-basic.jpg"],
    description: "Chinelo pratico e confortavel para todos os dias.",
    price: "79.90",
    sizes: [36, 37, 38, 39, 40, 41, 42],
    colors: ["Preto", "Verde"],
    stock: 45,
  },
  {
    slug: "tenis-court-minimal",
    name: "Tenis Court Minimal",
    categorySlug: "tenis",
    images: ["/uploads/tenis-court-minimal.jpg"],
    description: "Tenis minimalista inspirado nas quadras de tenis.",
    price: "319.90",
    sizes: [38, 39, 40, 41, 42, 43],
    colors: ["Branco", "Verde"],
    stock: 20,
  },
  {
    slug: "bota-trail-adventure",
    name: "Bota Trail Adventure",
    categorySlug: "botas",
    images: ["/uploads/bota-trail-adventure.jpg"],
    description: "Bota robusta para trilhas e aventuras ao ar livre.",
    price: "619.90",
    sizes: [39, 40, 41, 42, 43],
    colors: ["Oliva", "Preto"],
    stock: 9,
  },
  {
    slug: "sapatilha-ballet-light",
    name: "Sapatilha Ballet Light",
    categorySlug: "sapatilhas",
    images: ["/uploads/sapatilha-ballet-light.jpg"],
    description: "Sapatilha leve com acabamento delicado e confortavel.",
    price: "189.90",
    sizes: [34, 35, 36, 37, 38, 39],
    colors: ["Rosa", "Preto"],
    stock: 22,
  },
  {
    slug: "tenis-retro-run",
    name: "Tenis Retro Run",
    categorySlug: "tenis",
    images: ["/uploads/tenis-retro-run.jpg"],
    description: "Tenis com visual retro e conforto contemporaneo.",
    price: "389.90",
    sizes: [38, 39, 40, 41, 42, 43],
    colors: ["Azul", "Laranja"],
    stock: 16,
  },
];

async function main() {
  const categoriesBySlug = new Map<string, number>();

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });

    categoriesBySlug.set(savedCategory.slug, savedCategory.id);
  }

  for (const product of products) {
    const { categorySlug, ...productData } = product;
    const categoryId = categoriesBySlug.get(categorySlug);

    if (categoryId === undefined) {
      throw new Error(`Categoria não encontrada para o produto ${product.slug}.`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...productData, categoryId },
      create: { ...productData, categoryId },
    });
  }

  console.log(
    `${categories.length} categorias e ${products.length} produtos inseridos com sucesso.`,
  );
}

main()
  .catch((error) => {
    console.error("Erro ao executar o seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
