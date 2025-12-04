package main

import (
	"language-learner/api"
	"language-learner/database"
	"log"
	"net/http"
	"os"
)

func main() {
	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.CloseDB()

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Setup routes
	http.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		// Remove /api prefix for handler
		r.URL.Path = r.URL.Path[4:]
		api.Handler(w, r)
	})

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

