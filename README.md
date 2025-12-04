# Language Learner

A web application for tracking and learning languages with flashcards. Log your daily learnings (words, sentences, grammar, letters) and practice with customizable flashcards.

## Features

- **Multi-language Support**: Learn multiple languages simultaneously
- **Daily Logging**: Log words, sentences, grammar rules, and letters with translations, meanings, pronunciations, and examples
- **Flashcard System**: Practice with flashcards filtered by date (previous day, week, biweekly, month, or all time)
- **Progress Tracking**: Track your flashcard performance (correct/incorrect answers)
- **Learning History**: View and manage all your logged learnings

## Tech Stack

- **Frontend**: Next.js 14 (React) with TypeScript and Tailwind CSS
- **Backend**: Go with SQLite database
- **Deployment**: Vercel

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Go 1.21+

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Go dependencies**:
   ```bash
   go mod download
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Database

The application uses SQLite for data storage. The database file (`language_learner.db`) will be created automatically on first run.

### Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── log/               # Log new learnings
│   ├── flashcards/        # Flashcard practice
│   ├── languages/         # Language management
│   └── history/           # Learning history
├── api/                   # Go API handlers (for Vercel)
├── handlers/              # Go request handlers
├── database/              # Database setup and schema
├── models/                # Data models
└── lib/                   # Frontend utilities
```

## Usage

1. **Add Languages**: Go to "Manage Languages" and add the languages you're learning
2. **Log Learnings**: Use "Log New Learning" to add words, sentences, grammar, or letters
3. **Practice**: Use "Practice with Flashcards" to review your learnings
4. **Track Progress**: View your learning history and flashcard performance

## Deployment to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect Next.js
   - The app uses Next.js API routes (not Go serverless functions) for Vercel compatibility
   - Go code is included for reference or local development with a separate Go server

3. **Database Considerations**:
   - **Important**: SQLite with `better-sqlite3` may have limitations on Vercel's serverless platform
   - For production on Vercel, consider:
     - **Vercel Postgres** (recommended): Update `lib/db.ts` to use Postgres
     - **PlanetScale**: MySQL-compatible serverless database
     - **Supabase**: PostgreSQL with good Vercel integration
   - The current SQLite setup works for local development
   - On Vercel, the database file is stored in `/tmp` which is ephemeral (data may be lost between deployments)

## Environment Variables

Create a `.env.local` file for local development:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DB_PATH=language_learner.db
```

For Vercel deployment, set these in the Vercel dashboard.

## Notes

- The app uses localStorage for user identification (simple MVP approach)
- For production, consider adding proper authentication
- Database migrations are handled automatically on first run
- Flashcard sessions are tracked to help you review your progress

