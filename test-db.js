const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const txs = await prisma.transaction.findMany({
    orderBy: { date: 'asc' }
  });
  console.log("All transactions:");
  txs.forEach(t => {
    console.log(`- ${t.date.toISOString().split('T')[0]}: ${t.type} ${t.amount}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
