.PHONY: dev go-server install build

# Install dependencies
install:
	npm install
	go mod download

# Run Next.js dev server (uses Next.js API routes)
dev:
	npm run dev

# Run Go server separately (optional, for testing Go backend)
go-server:
	go run cmd/server/main.go

# Build for production
build:
	npm run build

# Run production build
start:
	npm start

