-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Financial', 'Career', 'Relationships', 'Health', 'Housing', 'Other');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('Pending', 'Resolved');

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cost" DECIMAL(65,30),
    "risks" TEXT,
    "notes" TEXT,
    "confidence" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "reviewDate" DATE NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pros" TEXT,
    "cons" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Decision_ownerId_idx" ON "Decision"("ownerId");

-- CreateIndex
CREATE INDEX "Decision_reviewDate_idx" ON "Decision"("reviewDate");

-- CreateIndex
CREATE INDEX "Decision_category_idx" ON "Decision"("category");

-- CreateIndex
CREATE INDEX "Option_decisionId_idx" ON "Option"("decisionId");

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
