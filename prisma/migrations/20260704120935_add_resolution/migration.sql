-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('Right', 'Wrong', 'Mixed');

-- CreateTable
CREATE TABLE "Resolution" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "satisfaction" INTEGER NOT NULL,
    "learnings" TEXT,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resolution_decisionId_key" ON "Resolution"("decisionId");

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
