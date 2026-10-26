-- CreateTable
CREATE TABLE IF NOT EXISTS "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key"
ON "categories"("slug");

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "categoryId" INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_categoryId_fkey'
    ) THEN
        ALTER TABLE "products"
        ADD CONSTRAINT "products_categoryId_fkey"
        FOREIGN KEY ("categoryId")
        REFERENCES "categories"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
END $$;
