import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const database = getDb()
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
  let language_code = ''
  try {
    const database = getDb()
    const body = await request.json()
    const { user_id, language_code: langCode, language_name } = body
    language_code = langCode || ''
    
    if (!user_id || !language_code || !language_name) {
      return NextResponse.json(
        { error: 'user_id, language_code, and language_name are required' },
        { status: 400 }
      )
    }
    
    // Ensure user exists (create if doesn't exist)
    const userCheck = database.prepare('SELECT id FROM users WHERE id = ?').get(user_id)
    if (!userCheck) {
      // Create user if it doesn't exist
      database.prepare('INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)').run(
        user_id,
        `user_${user_id}`
      )
    }
    
    // Check if language already exists for this user
    const existingLanguage = database.prepare(
      'SELECT id FROM languages WHERE user_id = ? AND language_code = ?'
    ).get(user_id, language_code)
    
    if (existingLanguage) {
      return NextResponse.json(
        { error: `Language with code "${language_code}" already exists for this user` },
        { status: 409 }
      )
    }
    
    const result = database.prepare(
      'INSERT INTO languages (user_id, language_code, language_name) VALUES (?, ?, ?)'
    ).run(user_id, language_code, language_name)
    
    // Verify the insert succeeded
    if (!result.lastInsertRowid || result.lastInsertRowid === 0) {
      return NextResponse.json(
        { error: 'Failed to insert language' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      user_id,
      language_code,
      language_name,
      created_at: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error creating language:', error)
    
    // Handle unique constraint violation
    if (error.message?.includes('UNIQUE constraint') || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { error: `Language with code "${language_code}" already exists for this user` },
        { status: 409 }
      )
    }
    
    return NextResponse.json({ error: error.message || 'Failed to create language' }, { status: 500 })
  }
}
