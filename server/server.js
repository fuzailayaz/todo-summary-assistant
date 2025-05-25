import express from 'express';
import cors from 'cors';
import todoRoutes from './routes/todoRoutes.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorMiddleware.js';
import { initSlack } from './utils/slack.js';

// Configure dotenv to load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server/.env file
dotenv.config({ path: path.join(__dirname, '.env') });

// Verify environment variables are loaded
if (!process.env.SLACK_WEBHOOK_URL && !process.env.SLACK_BOT_TOKEN) {
  console.warn('⚠️ Neither SLACK_WEBHOOK_URL nor SLACK_BOT_TOKEN is configured');
}

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '*** (exists)' : 'Not found');
console.log('GEMINI_MODEL:', process.env.GEMINI_MODEL || 'Using default (gemini-2.0-flash)');
console.log('SLACK_WEBHOOK_URL:', process.env.SLACK_WEBHOOK_URL ? '*** (exists)' : 'Not found');
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? '*** (exists)' : 'Not found');
console.log('SLACK_CHANNEL:', process.env.SLACK_CHANNEL || 'Using default channel');

// Initialize Slack with environment variables
initSlack({
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
  botToken: process.env.SLACK_BOT_TOKEN,
  channel: process.env.SLACK_CHANNEL
});

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/todos', todoRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
