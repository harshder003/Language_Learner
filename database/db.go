package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() error {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "language_learner.db"
	}

	// Ensure directory exists
	dir := filepath.Dir(dbPath)
	if dir != "." && dir != "" {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return err
		}
	}

	var err error
	DB, err = sql.Open("sqlite3", dbPath+"?_foreign_keys=1")
	if err != nil {
		return err
	}

	// Read and execute schema
	schema, err := os.ReadFile("database/schema.sql")
	if err != nil {
		return err
	}

	_, err = DB.Exec(string(schema))
	if err != nil {
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

