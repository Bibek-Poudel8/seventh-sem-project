import 'dotenv/config'
import { PrismaClient, Prisma } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SYSTEM_CATEGORY_IDS = [
  'sys_charity_donations',
  'sys_entertainment_recreation',
  'sys_financial_services',
  'sys_food_dining',
  'sys_government_legal',
  'sys_healthcare_medical',
  'sys_income',
  'sys_miscellaneous',
  'sys_shopping_retail',
  'sys_transportation',
  'sys_utilities_bills'
]

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randAmountForCategory(catId: string) {
  switch (catId) {
    case 'sys_food_dining':
      return +(Math.random() * (2000 - 150) + 150).toFixed(2)
    case 'sys_transportation':
      return +(Math.random() * (800 - 50) + 50).toFixed(2)
    case 'sys_utilities_bills':
      return +(Math.random() * (8000 - 1500) + 1500).toFixed(2)
    case 'sys_shopping_retail':
      return +(Math.random() * (12000 - 300) + 300).toFixed(2)
    case 'sys_entertainment_recreation':
      return +(Math.random() * (2500 - 100) + 100).toFixed(2)
    case 'sys_healthcare_medical':
      return +(Math.random() * (6000 - 300) + 300).toFixed(2)
    case 'sys_charity_donations':
      return +(Math.random() * (2000 - 100) + 100).toFixed(2)
    case 'sys_financial_services':
      return +(Math.random() * (1200 - 50) + 50).toFixed(2)
    case 'sys_miscellaneous':
      return +(Math.random() * (900 - 20) + 20).toFixed(2)
    default:
      return +(Math.random() * (1000 - 50) + 50).toFixed(2)
  }
}

function randomDateInMonth(year: number, monthIndex: number) {
  const day = randInt(1, 26)
  const hour = randInt(7, 22)
  const minute = randInt(0, 59)
  return new Date(Date.UTC(year, monthIndex, day, hour, minute, 0))
}

async function main() {
  console.log('Seeding transactions using existing categories (will not create categories)')

  // Use provided seed user id (can be overridden with SEED_USER_ID env var)
  const DEFAULT_SEED_USER_ID = 'cmoxxubx40000kwk40f9v31dg'
  const seedUserId = process.env.SEED_USER_ID ?? DEFAULT_SEED_USER_ID

  let user = await prisma.user.findUnique({ where: { id: seedUserId } })
  if (!user) {
    // create a deterministic email to avoid unique collisions
    const seedEmail = `seed.user+${seedUserId}@example.com`
    user = await prisma.user.create({ data: { id: seedUserId, email: seedEmail, name: 'Seed User' } })
    console.log(`Created seed user with id=${seedUserId}`)
  } else {
    console.log(`Using existing user with id=${seedUserId}`)
  }

  // Ensure at least one payment method exists for the user
  let paymentMethod = await prisma.paymentMethod.findFirst({ where: { userId: user.id } })
  if (!paymentMethod) {
    paymentMethod = await prisma.paymentMethod.create({
      data: { userId: user.id, name: 'Checking Account', type: 'BANK_ACCOUNT', balance: new Prisma.Decimal(50000) }
    })
  }

  // Fetch categories map (only existing categories will be used)
  const cats = await prisma.category.findMany({ where: { id: { in: SYSTEM_CATEGORY_IDS } } })
  const catsById = Object.fromEntries(cats.map(c => [c.id, c]))

  const missing = SYSTEM_CATEGORY_IDS.filter(id => !catsById[id])
  if (missing.length) {
    console.warn('Warning: the following categories were not found in the database and will be skipped:', missing)
  }

  // Months to generate: Jan-Apr 2026 (4 months of natural spending)
  const months = [
    { year: 2026, monthIndex: 0 },
    { year: 2026, monthIndex: 1 },
    { year: 2026, monthIndex: 2 },
    { year: 2026, monthIndex: 3 }
  ]

  // Weighted category distribution for everyday transactions (only include existing categories)
  const weightedCats = [
    'sys_food_dining',
    'sys_food_dining',
    'sys_food_dining',
    'sys_transportation',
    'sys_transportation',
    'sys_shopping_retail',
    'sys_utilities_bills',
    'sys_entertainment_recreation',
    'sys_miscellaneous',
    'sys_healthcare_medical',
    'sys_charity_donations',
    'sys_financial_services'
  ].filter(id => Boolean(catsById[id]))

  let created = 0

  for (const m of months) {
    // Regular salary/income once a month
    const incomeCategory = catsById['sys_income']
    if (incomeCategory) {
      const incomeDate = new Date(Date.UTC(m.year, m.monthIndex, randInt(24, 28), 9, 0, 0))
      await prisma.transaction.create({
        data: {
          userId: user.id,
          categoryId: incomeCategory.id,
          paymentMethodId: paymentMethod.id,
          amount: new Prisma.Decimal('60000.00'),
          type: 'INCOME',
          description: 'Salary',
          date: incomeDate
        }
      })
      created++
    }

    // Monthly utilities bill (1 per month)
    if (catsById['sys_utilities_bills']) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          categoryId: catsById['sys_utilities_bills'].id,
          paymentMethodId: paymentMethod.id,
          amount: new Prisma.Decimal(randAmountForCategory('sys_utilities_bills').toFixed(2)),
          type: 'EXPENSE',
          description: 'Utilities (electricity / internet)',
          date: randomDateInMonth(m.year, m.monthIndex)
        }
      })
      created++
    }

    // Per-month random number of everyday transactions (20-30)
    const count = randInt(20, 30)
    for (let i = 0; i < count; i++) {
      const catId = pick(weightedCats)
      const category = catsById[catId]
      if (!category) continue

      const amount = randAmountForCategory(catId)
      const descriptionSamples: Record<string, string[]> = {
        sys_food_dining: ['Cafe', 'Grocery', 'Restaurant', 'Lunch', 'Dinner', 'Takeaway'],
        sys_transportation: ['Taxi', 'Gas', 'Bus fare', 'Ride share', 'Parking'],
        sys_shopping_retail: ['Mall purchase', 'Online order', 'Clothing', 'Gadget'],
        sys_entertainment_recreation: ['Cinema', 'Concert', 'Streaming subscription', 'Event'],
        sys_miscellaneous: ['Small purchase', 'Office supplies', 'One-off fee'],
        sys_healthcare_medical: ['Pharmacy', 'Clinic visit', 'Medicine'],
        sys_charity_donations: ['Charity donation', 'Crowdfunding'],
        sys_financial_services: ['Bank fee', 'Transfer fee']
      }

      const samples = descriptionSamples[catId] || ['Purchase']
      const description = pick(samples)

      await prisma.transaction.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          paymentMethodId: paymentMethod.id,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          type: category.type,
          description: description || category.name,
          date: randomDateInMonth(m.year, m.monthIndex)
        }
      })
      created++
    }
  }

  console.log(`Created ${created} transactions for user ${user.email}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
