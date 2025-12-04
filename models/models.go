package models

import "time"

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"created_at"`
}

type Language struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	LanguageCode string    `json:"language_code"`
	LanguageName string    `json:"language_name"`
	CreatedAt    time.Time `json:"created_at"`
}

type LearningItem struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	LanguageID     int       `json:"language_id"`
	Type           string    `json:"type"` // word, sentence, grammar, letter
	Content        string    `json:"content"`
	Translation    string    `json:"translation,omitempty"`
	Meaning        string    `json:"meaning,omitempty"`
	Pronunciation  string    `json:"pronunciation,omitempty"`
	ExampleUsage   string    `json:"example_usage,omitempty"`
	Notes          string    `json:"notes,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type FlashcardSession struct {
	ID         int       `json:"id"`
	UserID     int       `json:"user_id"`
	LanguageID int       `json:"language_id"`
	ItemID     int       `json:"item_id"`
	ShownAt    time.Time `json:"shown_at"`
	WasCorrect bool      `json:"was_correct"`
}

type FlashcardItem struct {
	LearningItem
	LastReviewed *time.Time `json:"last_reviewed,omitempty"`
	ReviewCount  int        `json:"review_count"`
	CorrectCount int        `json:"correct_count"`
}

