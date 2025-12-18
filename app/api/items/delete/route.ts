import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const database = getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
    }
    
    database.prepare('DELETE FROM learning_items WHERE id = ?').run(parseInt(id))
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

