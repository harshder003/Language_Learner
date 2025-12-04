package handler

import (
	"language-learner/database"
	"language-learner/handlers"
	"net/http"
)

func init() {
	// Initialize database
	if err := database.InitDB(); err != nil {
		panic(err)
	}
}

func Handler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := r.URL.Path

	switch {
	case path == "/languages" || path == "/languages/":
		if r.Method == http.MethodPost {
			handlers.CreateLanguage(w, r)
		} else {
			handlers.GetLanguages(w, r)
		}
	case path == "/items" || path == "/items/":
		if r.Method == http.MethodPost {
			handlers.CreateLearningItem(w, r)
		} else {
			handlers.GetLearningItems(w, r)
		}
	case path == "/items/delete" || path == "/items/delete/":
		handlers.DeleteLearningItem(w, r)
	case path == "/flashcards" || path == "/flashcards/":
		if r.Method == http.MethodPost {
			handlers.RecordFlashcardSession(w, r)
		} else {
			handlers.GetFlashcards(w, r)
		}
	default:
		http.NotFound(w, r)
	}
}

