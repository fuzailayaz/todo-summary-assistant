// In-memory storage for todos (replace with database in production)
let todos = [];
let currentId = 1;

// AI Configuration
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv to load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

console.log('Controller - GEMINI_API_KEY:', GEMINI_API_KEY ? '*** (exists)' : 'Not found');
console.log('Controller - GEMINI_MODEL:', GEMINI_MODEL);

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not found in controller. AI summarization will be disabled.');
} else {
  console.log('✅ Gemini API key found in controller. AI summarization is enabled.');
}

import { sendTodoSummary, formatTodoSummary } from '../utils/slack.js';

// @desc    Get all todos
// @route   GET /api/todos
// @access  Public
export const getTodos = (req, res) => {
  try {
    res.status(200).json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a todo
// @route   POST /api/todos
// @access  Public
export const createTodo = (req, res) => {
  try {
    const { title, description, completed = false } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newTodo = {
      id: currentId++,
      title: title.trim(),
      description: description ? description.trim() : '',
      completed,
      createdAt: new Date().toISOString(),
    };

    todos.push(newTodo);
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Public
export const deleteTodo = (req, res) => {
  try {
    const { id } = req.params;
    const todoIndex = todos.findIndex(todo => todo.id === Number(id));

    if (todoIndex === -1) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todos = todos.filter(todo => todo.id !== Number(id));
    res.status(200).json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle todo completion status
// @route   PATCH /api/todos/:id/toggle
// @access  Public
export const toggleTodo = (req, res) => {
  try {
    const { id } = req.params;
    const todo = todos.find(todo => todo.id === Number(id));

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.completed = !todo.completed;
    todo.updatedAt = new Date().toISOString();
    res.status(200).json(todo);
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Generate a meaningful summary of todos using Gemini or fallback to simple summary
// @param   {Array} todos - Array of todo items
// @returns {Promise<string>} Generated summary
const generateTodoSummary = async (todos) => {
  // Simple fallback summary
  const generateFallbackSummary = (todos) => {
    const pending = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);
    
    let summary = `You have ${todos.length} total todos.`;
    
    if (pending.length > 0) {
      summary += `\n\n📝 *${pending.length} Pending:*\n`;
      summary += pending.map(t => `• ${t.title}`).join('\n');
    }
    
    if (completed.length > 0) {
      summary += `\n\n✅ *${completed.length} Completed:*\n`;
      summary += completed.map(t => `• ${t.title}`).join('\n');
    }
    
    return summary;
  };

  // If Gemini is not available, use the fallback
  if (!GEMINI_API_KEY) {
    console.log('Using fallback summary (Gemini API key not available)');
    return generateFallbackSummary(todos);
  }

  // Try to use Gemini if available
  try {
    const todoList = todos.map(todo => ({
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      createdAt: todo.createdAt
    }));

    const prompt = `You are a helpful assistant that summarizes todo lists in a friendly, actionable way.
Here's a list of todos:
${JSON.stringify(todoList, null, 2)}

Please provide a concise, friendly summary of these todos. 
Group related items when possible and suggest priorities if appropriate.
If there are completed items, acknowledge them briefly.
Keep it under 200 words and make it sound natural and encouraging.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Error generating summary with Gemini, falling back to simple summary:', error.message);
    return generateFallbackSummary(todos);
  }
};

// @desc    Send summary to Slack
// @param   {string} summary - The summary text to send
// @returns {Promise<boolean>} Success status
export const sendToSlack = async (summary) => {
  try {
    // Format the todos into a nice message
    const { text, blocks } = formatTodoSummary(todos);
    
    // Send the summary using the Slack utility
    const result = await sendTodoSummary(todos);
    
    if (!result.success) {
      console.error('Failed to send to Slack:', result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in sendToSlack:', error);
    return false;
  }
};

// @desc    Summarize todos and send to Slack
// @route   POST /api/todos/summarize
// @access  Public
export const summarizeTodos = async (req, res) => {
  try {
    const pendingTodos = todos.filter(todo => !todo.completed);
    const completedTodos = todos.filter(todo => todo.completed);
    
    if (todos.length === 0) {
      return res.status(200).json({ 
        message: 'No todos found',
        summary: 'Your todo list is empty. Add some tasks to get started!',
      });
    }

    // Generate the summary
    const summary = GEMINI_API_KEY 
      ? await generateTodoSummary(todos).catch(err => {
          console.error('Error generating AI summary, falling back to simple summary:', err);
          return generateSimpleSummary(todos);
        })
      : generateSimpleSummary(todos);

    // Send to Slack
    const sentToSlack = await sendToSlack(summary);

    res.status(200).json({
      success: true,
      message: 'Summary generated successfully',
      summary,
      sentToSlack
    });
  } catch (error) {
    console.error('Error in summarizeTodos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary',
      error: error.message
    });
  }
};

// Simple summary generator as a fallback
function generateSimpleSummary(todos) {
  const completed = todos.filter(todo => todo.completed).length;
  const pending = todos.length - completed;
  
  return `📊 *Todo Summary*\n• Total: ${todos.length}\n• Completed: ${completed}\n• Pending: ${pending}`;
}
