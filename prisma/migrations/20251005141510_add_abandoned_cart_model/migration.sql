-- CreateTable
CREATE TABLE "AbandonedCart" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT,
    "itemCount" INTEGER NOT NULL,
    "cartTotal" DECIMAL(10,2) NOT NULL,
    "itemsSnapshot" JSONB NOT NULL,
    "recoveryToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderSent" TIMESTAMP(3),
    "isRecovered" BOOLEAN NOT NULL DEFAULT false,
    "recoveredAt" TIMESTAMP(3),
    "orderCreated" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "recoveryChannel" TEXT,
    "abandonedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCart_cartId_key" ON "AbandonedCart"("cartId");

-- CreateIndex
CREATE UNIQUE INDEX "AbandonedCart_recoveryToken_key" ON "AbandonedCart"("recoveryToken");

-- CreateIndex
CREATE INDEX "AbandonedCart_userEmail_idx" ON "AbandonedCart"("userEmail");

-- CreateIndex
CREATE INDEX "AbandonedCart_recoveryToken_idx" ON "AbandonedCart"("recoveryToken");

-- CreateIndex
CREATE INDEX "AbandonedCart_isRecovered_idx" ON "AbandonedCart"("isRecovered");

-- CreateIndex
CREATE INDEX "AbandonedCart_abandonedAt_idx" ON "AbandonedCart"("abandonedAt");

-- CreateIndex
CREATE INDEX "AbandonedCart_tokenExpiresAt_idx" ON "AbandonedCart"("tokenExpiresAt");

-- CreateIndex
CREATE INDEX "AbandonedCart_remindersSent_idx" ON "AbandonedCart"("remindersSent");

-- AddForeignKey
ALTER TABLE "AbandonedCart" ADD CONSTRAINT "AbandonedCart_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
