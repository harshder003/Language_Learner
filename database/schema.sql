-- Users table with authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    forgot_question TEXT NOT NULL,
    forgot_answer_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    language_code TEXT NOT NULL,
    language_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, language_code)
);

-- Learning items (words, sentences, grammar, etc.)
CREATE TABLE IF NOT EXISTS learning_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('word', 'sentence', 'grammar', 'letter')),
    content TEXT NOT NULL,
    translation TEXT,
    meaning TEXT,
    pronunciation TEXT,
    audio_data TEXT,
    example_usage TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (language_id) REFERENCES languages(id)
);

-- Flashcard sessions
CREATE TABLE IF NOT EXISTS flashcard_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    shown_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    was_correct INTEGER NOT NULL CHECK(was_correct IN (0, 1)),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (language_id) REFERENCES languages(id),
    FOREIGN KEY (item_id) REFERENCES learning_items(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_items_user_lang ON learning_items(user_id, language_id);
CREATE INDEX IF NOT EXISTS idx_learning_items_created ON learning_items(created_at);
CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_user ON flashcard_sessions(user_id, language_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_item ON flashcard_sessions(item_id);

