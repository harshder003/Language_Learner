package handlers

import (
	"encoding/json"
	"language-learner/database"
	"language-learner/models"
	"net/http"
	"strconv"
	"time"
)

func CreateLearningItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var item models.LearningItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO learning_items 
		(user_id, language_id, type, content, translation, meaning, pronunciation, example_usage, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	result, err := database.DB.Exec(query,
		item.UserID, item.LanguageID, item.Type, item.Content,
		item.Translation, item.Meaning, item.Pronunciation,
		item.ExampleUsage, item.Notes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	item.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func GetLearningItems(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("user_id")
	languageID := r.URL.Query().Get("language_id")
	dateFilter := r.URL.Query().Get("date_filter") // day, week, month, biweekly, all

	query := `SELECT id, user_id, language_id, type, content, translation, meaning, 
		pronunciation, example_usage, notes, created_at 
		FROM learning_items WHERE user_id = ?`

	args := []interface{}{userID}
	if languageID != "" {
		query += " AND language_id = ?"
		args = append(args, languageID)
	}

	// Apply date filter
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
		query += " AND created_at >= ?"
		args = append(args, timeThreshold.Format(time.RFC3339))
	}

	query += " ORDER BY created_at DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []models.LearningItem
	for rows.Next() {
		var item models.LearningItem
		var createdAt string
		err := rows.Scan(&item.ID, &item.UserID, &item.LanguageID, &item.Type,
			&item.Content, &item.Translation, &item.Meaning, &item.Pronunciation,
			&item.ExampleUsage, &item.Notes, &createdAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		item.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func DeleteLearningItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "id parameter required", http.StatusBadRequest)
		return
	}

	_, err := database.DB.Exec("DELETE FROM learning_items WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

