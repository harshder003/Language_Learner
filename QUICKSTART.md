# Quick Start Guide

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Add a Language**:
   - Click "Manage Languages" from the home page
   - Click "+ Add Language"
   - Enter language code (e.g., "es" for Spanish) and name (e.g., "Spanish")
   - Click "Add Language"

2. **Log Your First Learning**:
   - Click "Log New Learning"
   - Select your language
   - Choose type (word, sentence, grammar, or letter)
   - Enter the content in the target language
   - Fill in translation, meaning, pronunciation, etc. (optional)
   - Click "Log Learning"

3. **Practice with Flashcards**:
   - Click "Practice with Flashcards"
   - Select language and date filter
   - Click "Show Answer" to reveal the answer
   - Mark yourself as "Correct" or "Incorrect"
   - Continue through all flashcards

4. **View History**:
   - Click "Learning History" to see all your logged items
   - Filter by language and date range
   - Delete items if needed

## Features

### Date Filters for Flashcards
- **Previous Day**: Items from yesterday
- **Previous Week**: Items from the last 7 days
- **Previous 2 Weeks**: Items from the last 14 days
- **Previous Month**: Items from the last 30 days
- **All Time**: All items you've ever logged

### Learning Item Types
- **Word**: Individual words
- **Sentence**: Complete sentences
- **Grammar**: Grammar rules or patterns
- **Letter**: Individual letters or characters

## Tips

- Log learnings daily for best results
- Use flashcards regularly to reinforce memory
- Fill in all fields (translation, meaning, examples) for better learning
- Review previous weeks' content periodically

## Troubleshooting

**Database errors**: Make sure you have write permissions in the project directory. The database file (`language_learner.db`) will be created automatically.

**Port already in use**: If port 3000 is busy, Next.js will automatically use the next available port.

**API errors**: Make sure the development server is running and check the browser console for detailed error messages.

