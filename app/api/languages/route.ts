import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const database = await getDb()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }
    
    // Ensure user exists
    const userCheck = database.prepare('SELECT id FROM users WHERE id = ?').get(parseInt(userId))
    if (!userCheck) {
      database.prepare('INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)').run(
        parseInt(userId),
        `user_${userId}`
      )
    }
    
    const languages = database.prepare(
      'SELECT id, user_id, language_code, language_name, created_at FROM languages WHERE user_id = ?'
    ).all(parseInt(userId))
    
    return NextResponse.json(languages)
  } catch (error: any) {
    console.error('Error fetching languages:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const database = await getDb()
    const body = await request.json()
    const { user_id, language_code, language_name } = body
    
    // Ensure user exists (create if doesn't exist)
    const userCheck = database.prepare('SELECT id FROM users WHERE id = ?').get(user_id)
    if (!userCheck) {
      // Create user if it doesn't exist
      database.prepare('INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)').run(
        user_id,
        `user_${user_id}`
      )
    }
    
    const result = database.prepare(
      'INSERT INTO languages (user_id, language_code, language_name) VALUES (?, ?, ?)'
    ).run(user_id, language_code, language_name)
    
    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      user_id,
      language_code,
      language_name,
      created_at: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error creating language:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
