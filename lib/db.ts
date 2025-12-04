// Database utility for Next.js API routes
// Note: For Vercel production, consider using Vercel Postgres or another cloud database
// SQLite works for local development but has limitations on serverless platforms

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  // For Vercel, use /tmp directory (writable)
  // For local, use project root
  const isVercel = process.env.VERCEL === '1'
  const dbDir = isVercel ? '/tmp' : process.cwd()
  const dbPath = path.join(dbDir, 'language_learner.db')

  // Ensure directory exists
  if (!isVercel) {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  db = new Database(dbPath)
  
  // Initialize schema
  const schema = fs.readFileSync(path.join(process.cwd(), 'database/schema.sql'), 'utf-8')
  db.exec(schema)

  // Run migrations for existing databases
  migrateDatabase(db)

  return db
}

function migrateDatabase(database: Database.Database) {
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
    const columnNames = tableInfo.map(col => col.name)

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
        userIds.forEach((userId: number) => {
          // Delete in order: flashcard_sessions -> learning_items -> languages -> users
          database.prepare('DELETE FROM flashcard_sessions WHERE user_id = ?').run(userId)
          database.prepare('DELETE FROM learning_items WHERE user_id = ?').run(userId)
          database.prepare('DELETE FROM languages WHERE user_id = ?').run(userId)
          database.prepare('DELETE FROM users WHERE id = ?').run(userId)
        })
      }
      
      console.log('Database migration completed!')
      console.log('Note: Old users without passwords have been removed. Please sign up again.')
    }

    // Check if learning_items table needs audio_data column
    const itemsTableInfo = database.prepare("PRAGMA table_info(learning_items)").all() as Array<{ name: string; type: string }>
    const itemsColumnNames = itemsTableInfo.map(col => col.name)

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

