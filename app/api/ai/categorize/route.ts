import { NextRequest, NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const { description } = await req.json()

  if (!description) {
    return NextResponse.json({ error: 'Missing description' }, { status: 400 })
  }

  const res = await fetch(`${ML_SERVICE_URL}/categorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })

  const result = await res.json()
  return NextResponse.json(result)
}