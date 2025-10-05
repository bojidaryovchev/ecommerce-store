-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('SALES_TAX', 'VAT', 'GST', 'EXEMPT');

-- CreateTable
CREATE TABLE "TaxRate" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "rate" DECIMAL(5,4) NOT NULL,
    "type" "TaxType" NOT NULL DEFAULT 'SALES_TAX',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxRate_country_idx" ON "TaxRate"("country");

-- CreateIndex
CREATE INDEX "TaxRate_country_state_idx" ON "TaxRate"("country", "state");

-- CreateIndex
CREATE INDEX "TaxRate_isActive_idx" ON "TaxRate"("isActive");

-- CreateIndex
CREATE INDEX "TaxRate_startDate_endDate_idx" ON "TaxRate"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "TaxRate_country_state_city_postalCode_key" ON "TaxRate"("country", "state", "city", "postalCode");
