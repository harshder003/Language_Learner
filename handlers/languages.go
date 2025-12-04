package handlers

import (
	"encoding/json"
	"language-learner/database"
	"language-learner/models"
	"net/http"
)

func CreateLanguage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var lang models.Language
	if err := json.NewDecoder(r.Body).Decode(&lang); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	query := `INSERT INTO languages (user_id, language_code, language_name)
		VALUES (?, ?, ?)`

	result, err := database.DB.Exec(query, lang.UserID, lang.LanguageCode, lang.LanguageName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	lang.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(lang)
}

func GetLanguages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "user_id parameter required", http.StatusBadRequest)
		return
	}

	rows, err := database.DB.Query(
		"SELECT id, user_id, language_code, language_name, created_at FROM languages WHERE user_id = ?",
		userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var languages []models.Language
	for rows.Next() {
		var lang models.Language
		var createdAt string
		err := rows.Scan(&lang.ID, &lang.UserID, &lang.LanguageCode, &lang.LanguageName, &createdAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		languages = append(languages, lang)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(languages)
}

