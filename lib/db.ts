// Database utility for Next.js API routes
// Using sql.js (WASM-based) for Vercel compatibility - no native compilation required
// Note: For production, consider using Vercel Postgres or another cloud database
// SQLite on serverless is ephemeral - data may be lost between deployments

import initSqlJs from 'sql.js'
import path from 'path'
import fs from 'fs'

// Compatibility wrapper to match better-sqlite3 API
class SQLiteDatabase {
  private db: any // sql.js Database instance

  constructor(db: any) {
    this.db = db
  }

  prepare(sql: string) {
    return {
      get: (...params: any[]) => {
        const stmt = this.db.prepare(sql)
        try {
          if (params.length > 0) {
            stmt.bind(params)
          }
          const result = stmt.step() ? stmt.getAsObject() : undefined
          return result
        } finally {
          stmt.free()
        }
      },
      all: (...params: any[]) => {
        const stmt = this.db.prepare(sql)
        try {
          if (params.length > 0) {
            stmt.bind(params)
          }
          const results: any[] = []
          while (stmt.step()) {
            results.push(stmt.getAsObject())
          }
          return results
        } finally {
          stmt.free()
        }
      },
      run: (...params: any[]) => {
        const stmt = this.db.prepare(sql)
        try {
          if (params.length > 0) {
            stmt.bind(params)
          }
          stmt.step()
          const lastInsertRowid = this.db.exec('SELECT last_insert_rowid()')
          return {
            lastInsertRowid: lastInsertRowid.length > 0 ? Number(lastInsertRowid[0].values[0][0]) : 0
          }
        } finally {
          stmt.free()
        }
      }
    }
  }

  exec(sql: string) {
    this.db.run(sql)
  }

  close() {
    this.db.close()
  }
}

let db: SQLiteDatabase | null = null
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null

export async function getDb(): Promise<SQLiteDatabase> {
  if (db) return db

  // Initialize sql.js
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    })
  }

  // For Vercel, use /tmp directory (writable but ephemeral)
  // For local, use project root
  const isVercel = process.env.VERCEL === '1'
  const dbDir = isVercel ? '/tmp' : process.cwd()
  const dbPath = path.join(dbDir, 'language_learner.db')

  let database: InstanceType<typeof SQL.Database>

  // Try to load existing database, or create new one
  try {
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath)
      database = new SQL.Database(buffer)
    } else {
      database = new SQL.Database()
    }
  } catch (error) {
    // If file doesn't exist or can't be read, create new database
    database = new SQL.Database()
  }

  db = new SQLiteDatabase(database)
  
  // Initialize schema
  const schema = fs.readFileSync(path.join(process.cwd(), 'database/schema.sql'), 'utf-8')
  db.exec(schema)

  // Run migrations for existing databases
  migrateDatabase(db)

  // Save database to file (for local development)
  if (!isVercel) {
    const data = database.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }

  return db
}

function migrateDatabase(database: SQLiteDatabase) {
  try {
    // Check if users table exists
    const tableExists = database.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).get()

    if (!tableExists) {
      // Table doesn't exist, schema.sql will create it
      return
    }

    // Check if users table has the old schema
    const tableInfo = database.prepare("PRAGMA table_info(users)").all() as Array<{ name: string; type: string }>
    const columnNames = tableInfo.map((col: any) => col.name)

    // If password_hash column doesn't exist, we need to migrate
    if (!columnNames.includes('password_hash')) {
      console.log('Migrating database schema: Adding authentication columns...')
      
      // SQLite doesn't support ALTER TABLE ADD COLUMN with multiple columns in one statement
      // So we need to add them one by one
      // Note: We add them as nullable first, then clean up old data
      
      // Add password_hash column (nullable for now)
      database.exec('ALTER TABLE users ADD COLUMN password_hash TEXT')
      
      // Add forgot_question column (nullable for now)
      database.exec('ALTER TABLE users ADD COLUMN forgot_question TEXT')
      
      // Add forgot_answer_hash column (nullable for now)
      database.exec('ALTER TABLE users ADD COLUMN forgot_answer_hash TEXT')

      // For existing users without passwords, delete them and their data
      // Since they can't authenticate with the new system anyway
      const usersWithoutPassword = database.prepare(
        'SELECT id FROM users WHERE password_hash IS NULL OR password_hash = ""'
      ).all() as Array<{ id: number }>
      
      if (usersWithoutPassword.length > 0) {
        console.log(`Removing ${usersWithoutPassword.length} old user(s) without passwords...`)
        // Delete related data first (due to foreign keys)
        const userIds = usersWithoutPassword.map(u => u.id)
        for (const userId of userIds) {
          // Delete in order: flashcard_sessions -> learning_items -> languages -> users
          database.prepare('DELETE FROM flashcard_sessions WHERE user_id = ?').run(userId)
          database.prepare('DELETE FROM learning_items WHERE user_id = ?').run(userId)
          database.prepare('DELETE FROM languages WHERE user_id = ?').run(userId)
          database.prepare('DELETE FROM users WHERE id = ?').run(userId)
        }
      }
      
      console.log('Database migration completed!')
      console.log('Note: Old users without passwords have been removed. Please sign up again.')
    }

    // Check if learning_items table needs audio_data column
    const itemsTableInfo = database.prepare("PRAGMA table_info(learning_items)").all() as Array<{ name: string; type: string }>
    const itemsColumnNames = itemsTableInfo.map((col: any) => col.name)

    if (!itemsColumnNames.includes('audio_data')) {
      console.log('Adding audio_data column to learning_items table...')
      database.exec('ALTER TABLE learning_items ADD COLUMN audio_data TEXT')
      console.log('audio_data column added successfully!')
    }
  } catch (error) {
    console.error('Migration error:', error)
    // Don't throw - let the app continue, but log the error
  }
}
