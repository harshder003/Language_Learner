import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const database = await getDb()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const languageId = searchParams.get('language_id')
    const dateFilter = searchParams.get('date_filter') || 'all'
    
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
    
    let query = `SELECT id, user_id, language_id, type, content, translation, meaning, 
      pronunciation, audio_data, example_usage, notes, created_at 
      FROM learning_items WHERE user_id = ?`
    const params: any[] = [parseInt(userId)]
    
    if (languageId) {
      query += ' AND language_id = ?'
      params.push(parseInt(languageId))
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let threshold = new Date()
      
      switch (dateFilter) {
        case 'day':
          threshold.setDate(now.getDate() - 1)
          break
        case 'week':
          threshold.setDate(now.getDate() - 7)
          break
        case 'biweekly':
          threshold.setDate(now.getDate() - 14)
          break
        case 'month':
          threshold.setMonth(now.getMonth() - 1)
          break
      }
      
      query += ' AND created_at >= ?'
      params.push(threshold.toISOString())
    }
    
    query += ' ORDER BY created_at DESC'
    
    const items = database.prepare(query).all(...params)
    
    return NextResponse.json(items)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const database = await getDb()
    const body = await request.json()
    const { user_id, language_id, type, content, translation, meaning, pronunciation, audio_data, example_usage, notes } = body
    
    // Ensure user exists
    const userCheck = database.prepare('SELECT id FROM users WHERE id = ?').get(user_id)
    if (!userCheck) {
      database.prepare('INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)').run(
        user_id,
        `user_${user_id}`
      )
    }
    
    const result = database.prepare(
      `INSERT INTO learning_items 
      (user_id, language_id, type, content, translation, meaning, pronunciation, audio_data, example_usage, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(user_id, language_id, type, content, translation || null, meaning || null, 
      pronunciation || null, audio_data || null, example_usage || null, notes || null)
    
    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      user_id,
      language_id,
      type,
      content,
      translation,
      meaning,
      pronunciation,
      audio_data,
      example_usage,
      notes,
      created_at: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

