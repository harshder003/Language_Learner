import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const database = getDb()
    const body = await request.json()
    const { username, password, forgot_question, forgot_answer } = body

    if (!username || !password || !forgot_question || !forgot_answer) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = database
      .prepare('SELECT id FROM users WHERE username = ?')
      .get(username)

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Hash password and forgot answer
    const passwordHash = await hashPassword(password)
    const forgotAnswerHash = await hashPassword(forgot_answer.toLowerCase().trim())

    // Insert new user
    const result = database
      .prepare(
        'INSERT INTO users (username, password_hash, forgot_question, forgot_answer_hash) VALUES (?, ?, ?, ?)'
      )
      .run(username, passwordHash, forgot_question, forgotAnswerHash)

    return NextResponse.json({
      success: true,
      userId: Number(result.lastInsertRowid),
      message: 'User created successfully'
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

