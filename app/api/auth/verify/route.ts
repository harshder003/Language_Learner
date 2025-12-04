import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    return NextResponse.json({
      valid: true,
      userId: decoded.userId,
      username: decoded.username
    })
  } catch (error: any) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }
}

