package handlers

import (
	"encoding/json"
	"language-learner/database"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(getJWTSecret())

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "your-secret-key-change-in-production"
	}
	return secret
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type SignupRequest struct {
	Username      string `json:"username"`
	Password      string `json:"password"`
	ForgotQuestion string `json:"forgot_question"`
	ForgotAnswer   string `json:"forgot_answer"`
}

type VerifyRequest struct {
	Token string `json:"token"`
}

type ForgotPasswordRequest struct {
	Username    string `json:"username"`
	ForgotAnswer string `json:"forgot_answer,omitempty"`
}

type ResetPasswordRequest struct {
	UserId      int    `json:"userId"`
	NewPassword string `json:"newPassword"`
}

func HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	// Find user
	var userID int
	var passwordHash string
	err := database.DB.QueryRow(
		"SELECT id, password_hash FROM users WHERE username = ?",
		req.Username,
	).Scan(&userID, &passwordHash)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid username or password"})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid username or password"})
		return
	}

	// Generate token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userId":   userID,
		"username": req.Username,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"token":   tokenString,
		"userId":  userID,
		"username": req.Username,
	})
}

func HandleSignup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" || req.ForgotQuestion == "" || req.ForgotAnswer == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	// Check if username already exists
	var existingID int
	err := database.DB.QueryRow("SELECT id FROM users WHERE username = ?", req.Username).Scan(&existingID)
	if err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Username already exists"})
		return
	}

	// Hash password and forgot answer
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	forgotAnswerHash, err := bcrypt.GenerateFromPassword([]byte(strings.ToLower(strings.TrimSpace(req.ForgotAnswer))), 10)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Insert new user
	result, err := database.DB.Exec(
		"INSERT INTO users (username, password_hash, forgot_question, forgot_answer_hash) VALUES (?, ?, ?, ?)",
		req.Username, string(passwordHash), req.ForgotQuestion, string(forgotAnswerHash),
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	userID, _ := result.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"userId":  userID,
		"message": "User created successfully",
	})
}

func HandleVerify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req VerifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]bool{"valid": false})
		return
	}

	if req.Token == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]bool{"valid": false})
		return
	}

	// Verify token
	token, err := jwt.Parse(req.Token, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]bool{"valid": false})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]bool{"valid": false})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid":    true,
		"userId":   int(claims["userId"].(float64)),
		"username": claims["username"].(string),
	})
}

func HandleForgotPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ForgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Username == "" {
		http.Error(w, "Username is required", http.StatusBadRequest)
		return
	}

	// Find user
	var userID int
	var forgotQuestion, forgotAnswerHash string
	err := database.DB.QueryRow(
		"SELECT id, forgot_question, forgot_answer_hash FROM users WHERE username = ?",
		req.Username,
	).Scan(&userID, &forgotQuestion, &forgotAnswerHash)

	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
		return
	}

	// If no answer provided, just return the question
	if req.ForgotAnswer == "" {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"userId":  userID,
			"question": forgotQuestion,
		})
		return
	}

	// Verify forgot answer
	err = bcrypt.CompareHashAndPassword([]byte(forgotAnswerHash), []byte(strings.ToLower(strings.TrimSpace(req.ForgotAnswer))))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Incorrect answer"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"userId":  userID,
	})
}

func HandleResetPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.UserId == 0 || req.NewPassword == "" {
		http.Error(w, "User ID and new password are required", http.StatusBadRequest)
		return
	}

	// Check if user exists
	var userID int
	err := database.DB.QueryRow("SELECT id FROM users WHERE id = ?", req.UserId).Scan(&userID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
		return
	}

	// Hash new password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), 10)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update password
	_, err = database.DB.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(passwordHash), req.UserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Password reset successfully",
	})
}

