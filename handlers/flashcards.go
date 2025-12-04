package handlers

import (
	"database/sql"
	"encoding/json"
	"language-learner/database"
	"language-learner/models"
	"net/http"
	"time"
)

func GetFlashcards(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("user_id")
	languageID := r.URL.Query().Get("language_id")
	dateFilter := r.URL.Query().Get("date_filter") // day, week, month, biweekly, all

	if userID == "" {
		http.Error(w, "user_id parameter required", http.StatusBadRequest)
		return
	}

	// Build query to get learning items with flashcard stats
	query := `SELECT li.id, li.user_id, li.language_id, li.type, li.content, 
		li.translation, li.meaning, li.pronunciation, li.example_usage, li.notes, li.created_at,
		MAX(fs.shown_at) as last_reviewed,
		COUNT(fs.id) as review_count,
		SUM(CASE WHEN fs.was_correct = 1 THEN 1 ELSE 0 END) as correct_count
		FROM learning_items li
		LEFT JOIN flashcard_sessions fs ON li.id = fs.item_id
		WHERE li.user_id = ?`

	args := []interface{}{userID}
	if languageID != "" {
		query += " AND li.language_id = ?"
		args = append(args, languageID)
	}

	// Apply date filter to learning items
	if dateFilter != "" && dateFilter != "all" {
		var timeThreshold time.Time
		now := time.Now()
		switch dateFilter {
		case "day":
			timeThreshold = now.AddDate(0, 0, -1)
		case "week":
			timeThreshold = now.AddDate(0, 0, -7)
		case "biweekly":
			timeThreshold = now.AddDate(0, 0, -14)
		case "month":
			timeThreshold = now.AddDate(0, -1, 0)
		}
		query += " AND li.created_at >= ?"
		args = append(args, timeThreshold.Format(time.RFC3339))
	}

	query += " GROUP BY li.id ORDER BY li.created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var flashcards []models.FlashcardItem
	for rows.Next() {
		var card models.FlashcardItem
		var createdAt, lastReviewed sql.NullString
		var reviewCount, correctCount sql.NullInt64

		err := rows.Scan(&card.ID, &card.UserID, &card.LanguageID, &card.Type,
			&card.Content, &card.Translation, &card.Meaning, &card.Pronunciation,
			&card.ExampleUsage, &card.Notes, &createdAt, &lastReviewed,
			&reviewCount, &correctCount)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		card.CreatedAt, _ = time.Parse(time.RFC3339, createdAt.String)
		if lastReviewed.Valid {
			t, _ := time.Parse(time.RFC3339, lastReviewed.String)
			card.LastReviewed = &t
		}
		card.ReviewCount = int(reviewCount.Int64)
		card.CorrectCount = int(correctCount.Int64)

		flashcards = append(flashcards, card)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(flashcards)
}

func RecordFlashcardSession(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var session models.FlashcardSession
	if err := json.NewDecoder(r.Body).Decode(&session); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO flashcard_sessions (user_id, language_id, item_id, was_correct)
		VALUES (?, ?, ?, ?)`

	wasCorrect := 0
	if session.WasCorrect {
		wasCorrect = 1
	}

	result, err := database.DB.Exec(query, session.UserID, session.LanguageID, session.ItemID, wasCorrect)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	session.ID = int(id)
	session.ShownAt = time.Now()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(session)
}

