// Database utility for Next.js API routes
// Using in-memory database for Vercel serverless compatibility
// Note: Data is ephemeral and will be lost between deployments
// For production, consider using Vercel Postgres or another cloud database

// Simple in-memory database implementation
interface DatabaseRow {
  [key: string]: any
}

class InMemoryDatabase {
  private tables: Map<string, DatabaseRow[]> = new Map()
  private lastInsertId: number = 0

  constructor() {
    this.initializeSchema()
  }

  private initializeSchema() {
    // Initialize tables
    this.tables.set('users', [])
    this.tables.set('languages', [])
    this.tables.set('learning_items', [])
    this.tables.set('flashcard_sessions', [])
  }

  prepare(sql: string) {
    return {
      get: (...params: any[]) => {
        const result = this.executeQuery(sql, params, true)
        return result.length > 0 ? result[0] : undefined
      },
      all: (...params: any[]) => {
        return this.executeQuery(sql, params, false)
      },
      run: (...params: any[]) => {
        this.executeQuery(sql, params, false)
        return {
          lastInsertRowid: this.lastInsertId
        }
      }
    }
  }

  exec(sql: string) {
    // Handle CREATE TABLE statements
    if (sql.includes('CREATE TABLE')) {
      // Tables are already initialized, just return
      return
    }
    // Handle other exec statements
    const statements = sql.split(';').filter(s => s.trim())
    for (const statement of statements) {
      if (statement.trim()) {
        this.executeQuery(statement.trim(), [], false)
      }
    }
  }

  private executeQuery(sql: string, params: any[], single: boolean): DatabaseRow[] {
    const upperSql = sql.toUpperCase().trim()
    
    // SELECT queries
    if (upperSql.startsWith('SELECT')) {
      return this.handleSelect(sql, params, single)
    }
    
    // INSERT queries
    if (upperSql.startsWith('INSERT')) {
      this.handleInsert(sql, params)
      return []
    }
    
    // UPDATE queries
    if (upperSql.startsWith('UPDATE')) {
      this.handleUpdate(sql, params)
      return []
    }
    
    // DELETE queries
    if (upperSql.startsWith('DELETE')) {
      this.handleDelete(sql, params)
      return []
    }
    
    // ALTER TABLE (for migrations)
    if (upperSql.startsWith('ALTER TABLE')) {
      // Just return, schema changes are handled in migrations
      return []
    }
    
    // PRAGMA queries
    if (upperSql.startsWith('PRAGMA')) {
      return this.handlePragma(sql)
    }
    
    return []
  }

  private handleSelect(sql: string, params: any[], single: boolean): DatabaseRow[] {
    const upperSql = sql.toUpperCase()
    let results: DatabaseRow[] = []
    
    // Handle JOIN queries (for flashcards)
    if (sql.includes('LEFT JOIN') || sql.includes('JOIN')) {
      return this.handleJoinQuery(sql, params, single)
    }
    
    // Get table name
    const fromMatch = sql.match(/FROM\s+(\w+)/i)
    if (!fromMatch) return []
    
    const tableName = fromMatch[1]
    const table = this.tables.get(tableName) || []
    
    // Simple WHERE clause handling
    let filtered = [...table]
    
    if (sql.includes('WHERE')) {
      const whereClause = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|$)/i)?.[1] || ''
      
      // Handle user_id = ?
      if (whereClause.includes('user_id')) {
        const userIdx = whereClause.split('?').length - 1
        const userId = params[userIdx - 1] || params[0]
        filtered = filtered.filter(row => row.user_id === parseInt(userId))
      }
      
      // Handle language_id = ?
      if (whereClause.includes('language_id')) {
        const langIdx = whereClause.split('?').length - 1
        const langId = params[langIdx - 1] || params[1]
        if (langId) {
          filtered = filtered.filter(row => row.language_id === parseInt(langId))
        }
      }
      
      // Handle id = ?
      if (whereClause.includes('id = ?')) {
        const id = params[0]
        filtered = filtered.filter(row => row.id === parseInt(id))
      }
      
      // Handle username = ?
      if (whereClause.includes('username = ?')) {
        const username = params[0]
        filtered = filtered.filter(row => row.username === username)
      }
      
      // Handle created_at >= ?
      if (whereClause.includes('created_at >= ?')) {
        const dateParam = params.find(p => typeof p === 'string' && p.includes('T'))
        if (dateParam) {
          const threshold = new Date(dateParam)
          filtered = filtered.filter(row => {
            const rowDate = new Date(row.created_at)
            return rowDate >= threshold
          })
        }
      }
    }
    
    // ORDER BY
    if (sql.includes('ORDER BY')) {
      const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)?/i)
      if (orderMatch) {
        const column = orderMatch[1]
        const direction = (orderMatch[2] || 'ASC').toUpperCase()
        filtered.sort((a, b) => {
          const aVal = (a as any)[column]
          const bVal = (b as any)[column]
          if (direction === 'DESC') {
            return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
          }
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        })
      }
    }
    
    results = filtered
    
    return single ? results.slice(0, 1) : results
  }

  private handleInsert(sql: string, params: any[]) {
    const match = sql.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)/i)
    if (!match) return
    
    const tableName = match[1]
    const columns = match[2].split(',').map(c => c.trim())
    const table = this.tables.get(tableName) || []
    
    const row: DatabaseRow = {
      id: ++this.lastInsertId
    }
    
    columns.forEach((col, idx) => {
      if (params[idx] !== undefined) {
        row[col] = params[idx]
      } else {
        row[col] = null
      }
    })
    
    // Set created_at/shown_at if not provided
    if (!row.created_at && !row.shown_at) {
      if (tableName === 'flashcard_sessions') {
        row.shown_at = new Date().toISOString()
      } else {
        row.created_at = new Date().toISOString()
      }
    }
    
    // Handle was_correct boolean conversion
    if (row.was_correct !== undefined) {
      row.was_correct = row.was_correct ? 1 : 0
    }
    
    table.push(row)
    this.tables.set(tableName, table)
  }

  private handleUpdate(sql: string, params: any[]) {
    const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)/i)
    if (!match) return
    
    const tableName = match[1]
    const setClause = match[2]
    const whereClause = match[3]
    const table = this.tables.get(tableName) || []
    
    // Parse SET clause
    const setParts = setClause.split(',').map(s => s.trim())
    const updates: { [key: string]: any } = {}
    setParts.forEach((part, idx) => {
      const [key] = part.split('=')
      updates[key.trim()] = params[idx]
    })
    
    // Parse WHERE clause
    let whereParam: any = null
    if (whereClause.includes('id = ?')) {
      whereParam = params[params.length - 1]
    }
    
    // Update rows
    table.forEach(row => {
      if (whereParam && row.id === parseInt(whereParam)) {
        Object.assign(row, updates)
      }
    })
    
    this.tables.set(tableName, table)
  }

  private handleDelete(sql: string, params: any[]) {
    const match = sql.match(/DELETE FROM\s+(\w+)(?:\s+WHERE\s+(.+))?/i)
    if (!match) return
    
    const tableName = match[1]
    const whereClause = match[2]
    let table = this.tables.get(tableName) || []
    
    if (whereClause) {
      if (whereClause.includes('id = ?')) {
        const id = params[0]
        table = table.filter(row => row.id !== parseInt(id))
      } else if (whereClause.includes('user_id = ?')) {
        const userId = params[0]
        table = table.filter(row => row.user_id !== parseInt(userId))
      }
    } else {
      table = []
    }
    
    this.tables.set(tableName, table)
  }

  private handleJoinQuery(sql: string, params: any[], single: boolean): DatabaseRow[] {
    // Handle flashcard query with LEFT JOIN
    const learningItems = this.tables.get('learning_items') || []
    const flashcardSessions = this.tables.get('flashcard_sessions') || []
    
    let filtered = [...learningItems]
    
    // Apply WHERE filters
    if (sql.includes('WHERE')) {
      const whereClause = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|$)/i)?.[1] || ''
      
      if (whereClause.includes('li.user_id')) {
        const userId = params[0]
        filtered = filtered.filter(row => row.user_id === parseInt(userId))
      }
      
      if (whereClause.includes('li.language_id')) {
        const langId = params[1]
        if (langId) {
          filtered = filtered.filter(row => row.language_id === parseInt(langId))
        }
      }
      
      if (whereClause.includes('li.created_at >= ?')) {
        const dateParam = params.find(p => typeof p === 'string' && p.includes('T'))
        if (dateParam) {
          const threshold = new Date(dateParam)
          filtered = filtered.filter(row => {
            const rowDate = new Date(row.created_at)
            return rowDate >= threshold
          })
        }
      }
    }
    
    // Add flashcard session data
    const results = filtered.map(item => {
      const sessions = flashcardSessions.filter(s => s.item_id === item.id)
      const lastReviewed = sessions.length > 0 
        ? sessions.sort((a, b) => new Date(b.shown_at).getTime() - new Date(a.shown_at).getTime())[0].shown_at
        : null
      const reviewCount = sessions.length
      const correctCount = sessions.filter(s => s.was_correct === 1 || s.was_correct === true).length
      
      return {
        ...item,
        last_reviewed: lastReviewed,
        review_count: reviewCount,
        correct_count: correctCount
      }
    })
    
    // ORDER BY
    if (sql.includes('ORDER BY')) {
      const orderMatch = sql.match(/ORDER BY\s+(\w+\.\w+|\w+)\s+(ASC|DESC)?/i)
      if (orderMatch) {
        const column = orderMatch[1].split('.').pop() || orderMatch[1]
        const direction = (orderMatch[2] || 'DESC').toUpperCase()
        results.sort((a, b) => {
          const aVal = (a as any)[column]
          const bVal = (b as any)[column]
          if (direction === 'DESC') {
            return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
          }
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        })
      }
    }
    
    return single ? results.slice(0, 1) : results
  }

  private handlePragma(sql: string): DatabaseRow[] {
    // Handle PRAGMA table_info(users)
    const match = sql.match(/PRAGMA\s+table_info\((\w+)\)/i)
    if (!match) return []
    
    const tableName = match[1]
    const table = this.tables.get(tableName) || []
    
    if (table.length === 0) {
      // Return default columns based on table name
      if (tableName === 'users') {
        return [
          { name: 'id', type: 'INTEGER' },
          { name: 'username', type: 'TEXT' },
          { name: 'password_hash', type: 'TEXT' },
          { name: 'forgot_question', type: 'TEXT' },
          { name: 'forgot_answer_hash', type: 'TEXT' },
          { name: 'created_at', type: 'DATETIME' }
        ]
      } else if (tableName === 'learning_items') {
        return [
          { name: 'id', type: 'INTEGER' },
          { name: 'user_id', type: 'INTEGER' },
          { name: 'language_id', type: 'INTEGER' },
          { name: 'type', type: 'TEXT' },
          { name: 'content', type: 'TEXT' },
          { name: 'translation', type: 'TEXT' },
          { name: 'meaning', type: 'TEXT' },
          { name: 'pronunciation', type: 'TEXT' },
          { name: 'audio_data', type: 'TEXT' },
          { name: 'example_usage', type: 'TEXT' },
          { name: 'notes', type: 'TEXT' },
          { name: 'created_at', type: 'DATETIME' }
        ]
      }
    }
    
    // Return columns from first row
    const firstRow = table[0]
    if (firstRow) {
      return Object.keys(firstRow).map(key => ({
        name: key,
        type: typeof firstRow[key] === 'number' ? 'INTEGER' : 'TEXT'
      }))
    }
    
    return []
  }
}

let db: InMemoryDatabase | null = null

export function getDb(): InMemoryDatabase {
  if (db) return db

  db = new InMemoryDatabase()
  
  // Initialize schema (tables are already created in constructor)
  // Run migrations
  migrateDatabase(db)

  return db
}

function migrateDatabase(database: InMemoryDatabase) {
  try {
    // Check if users table exists and has data
    const users = database.prepare('SELECT * FROM users LIMIT 1').all()
    
    // Schema is already initialized, migrations handled automatically
    // by the in-memory structure
  } catch (error) {
    console.error('Migration error:', error)
  }
}
