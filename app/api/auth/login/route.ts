import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const database = getDb()
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = database
      .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
      .get(username) as { id: number; username: string; password_hash: string } | undefined

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken(user.id, user.username)

    return NextResponse.json({
      success: true,
      token,
      userId: user.id,
      username: user.username
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

