import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { comparePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const database = await getDb()
    const body = await request.json()
    const { username, forgot_answer } = body

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = database
      .prepare('SELECT id, forgot_question, forgot_answer_hash FROM users WHERE username = ?')
      .get(username) as { id: number; forgot_question: string; forgot_answer_hash: string } | undefined

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If no answer provided, just return the question
    if (!forgot_answer) {
      return NextResponse.json({
        success: true,
        userId: user.id,
        question: user.forgot_question
      })
    }

    // Verify forgot answer
    const isValid = await comparePassword(forgot_answer.toLowerCase().trim(), user.forgot_answer_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Incorrect answer' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      userId: user.id
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

