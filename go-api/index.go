package handler

import (
	"language-learner/database"
	"language-learner/handlers"
	"net/http"
	"strings"
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
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := r.URL.Path
	
	// Strip /api prefix if present (Vercel routes /api/* to this handler)
	path = strings.TrimPrefix(path, "/api")
	if path == "" {
		path = "/"
	}

	switch {
	case strings.HasPrefix(path, "/auth/login"):
		handlers.HandleLogin(w, r)
	case strings.HasPrefix(path, "/auth/signup"):
		handlers.HandleSignup(w, r)
	case strings.HasPrefix(path, "/auth/verify"):
		handlers.HandleVerify(w, r)
	case strings.HasPrefix(path, "/auth/forgot-password"):
		handlers.HandleForgotPassword(w, r)
	case strings.HasPrefix(path, "/auth/reset-password"):
		handlers.HandleResetPassword(w, r)
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
	case path == "/items/delete" || strings.HasPrefix(path, "/items/delete"):
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

