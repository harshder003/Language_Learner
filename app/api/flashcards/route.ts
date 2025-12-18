import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const database = getDb()
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
    
    let query = `SELECT li.id, li.user_id, li.language_id, li.type, li.content, 
      li.translation, li.meaning, li.pronunciation, li.audio_data, li.example_usage, li.notes, li.created_at,
      MAX(fs.shown_at) as last_reviewed,
      COUNT(fs.id) as review_count,
      SUM(CASE WHEN fs.was_correct = 1 THEN 1 ELSE 0 END) as correct_count
      FROM learning_items li
      LEFT JOIN flashcard_sessions fs ON li.id = fs.item_id
      WHERE li.user_id = ?`
    
    const params: any[] = [parseInt(userId)]
    
    if (languageId) {
      query += ' AND li.language_id = ?'
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
      
      query += ' AND li.created_at >= ?'
      params.push(threshold.toISOString())
    }
    
    query += ' GROUP BY li.id ORDER BY li.created_at DESC'
    
    const flashcards = database.prepare(query).all(...params)
    
    // Format the results
    const formatted = flashcards.map((card: any) => ({
      ...card,
      review_count: card.review_count || 0,
      correct_count: card.correct_count || 0,
      last_reviewed: card.last_reviewed || null
    }))
    
    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const database = getDb()
    const body = await request.json()
    const { user_id, language_id, item_id, was_correct } = body
    
    // Ensure user exists
    const userCheck = database.prepare('SELECT id FROM users WHERE id = ?').get(user_id)
    if (!userCheck) {
      database.prepare('INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)').run(
        user_id,
        `user_${user_id}`
      )
    }
    
    const result = database.prepare(
      'INSERT INTO flashcard_sessions (user_id, language_id, item_id, was_correct) VALUES (?, ?, ?, ?)'
    ).run(user_id, language_id, item_id, was_correct ? 1 : 0)
    
    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      user_id,
      language_id,
      item_id,
      was_correct,
      shown_at: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

