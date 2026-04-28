import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/prisma'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId:    session.user.id,
      type:      'EXPENSE',
      isDeleted: false,
      date:      { gte: sixMonthsAgo }
    },
    include: { category: true },
    orderBy: { date: 'asc' }
  })

  if (transactions.length === 0) {
    return NextResponse.json({
      predictions:     [],
      total_predicted: 0,
      months_of_data:  0,
      message:         'No transaction data available for prediction'
    })
  }

  const payload = {
    transactions: transactions.map(t => ({
      amount:   Number(t.amount),
      date:     t.date.toISOString().split('T')[0],
      category: t.category?.name ?? 'Uncategorized'
    })),
    months_ahead: 1
  }

  const res = await fetch(`${ML_SERVICE_URL}/predict`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })

  const result = await res.json()
  return NextResponse.json(result)
}