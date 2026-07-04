import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_URL_NON_POOLING!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.owner.findFirst();
  if (existing) {
    console.log(`Owner already seeded (id=${existing.id}), skipping.`);
    return;
  }

  const owner = await prisma.owner.create({ data: {} });
  console.log(`Seeded Owner id=${owner.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
