import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const database = await getDb()
    const body = await request.json()
    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password
    // Check if user exists first
    const userCheck = database
      .prepare('SELECT id FROM users WHERE id = ?')
      .get(userId)
    
    if (!userCheck) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    database
      .prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .run(passwordHash, userId)

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

