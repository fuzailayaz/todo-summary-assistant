# Todo Summary Assistant

A full-stack application that helps you manage your todos and generate AI-powered summaries of your pending tasks, with the ability to send them to Slack.

## Features

- **Todo Management**: Add, edit, and delete todos
- **AI-Powered Summaries**: Generate meaningful summaries of your pending todos using OpenAI's GPT model
- **Slack Integration**: Send summaries directly to a Slack channel
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Material-UI for a clean, professional look

## Tech Stack

- **Frontend**: React, Material-UI
- **Backend**: Node.js, Express
- **AI**: OpenAI API (GPT-3.5-turbo)
- **Messaging**: Slack Incoming Webhooks
- **State Management**: React Context API

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher) or yarn
- OpenAI API key
- Slack workspace with admin permissions to create webhooks

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/todo-summary-assistant.git
cd todo-summary-assistant
```

### 2. Set up the backend

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory based on the `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```
   PORT=5000
   NODE_ENV=development
   OPENAI_API_KEY=your_openai_api_key_here
   SLACK_WEBHOOK_URL=your_slack_webhook_url_here
   ```

### 3. Set up the frontend

1. Navigate to the client directory:
   ```bash
   cd ../client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the client directory:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

### 4. Running the application

1. Start the backend server:
   ```bash
   # From the project root
   cd server
   npm run dev
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   # From the project root
   cd client
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Configuration

### OpenAI API Key

1. Sign up for an account at [OpenAI](https://platform.openai.com/)
2. Navigate to the API keys section
3. Create a new secret key and add it to your `.env` file

### Slack Webhook

1. Go to [Slack API](https://api.slack.com/)
2. Create a new app or select an existing one
3. Go to Incoming Webhooks and activate them
4. Click "Add New Webhook to Workspace"
5. Select the channel where you want to receive notifications
6. Copy the Webhook URL and add it to your `.env` file

## Project Structure

```
todo-summary-assistant/
├── client/                    # Frontend React application
│   ├── public/               # Static files
│   └── src/                  # Source files
│       ├── components/       # Reusable UI components
│       ├── context/          # React context providers
│       ├── services/         # API service functions
│       └── App.js            # Main application component
└── server/                   # Backend Node.js/Express server
    ├── config/              # Configuration files
    ├── controllers/         # Route controllers
    ├── middleware/          # Express middleware
    ├── routes/             # API routes
    ├── services/           # Business logic
    └── server.js           # Server entry point
```

## Available Scripts

### Client

- `npm start`: Start the development server
- `npm test`: Run tests
- `npm run build`: Build for production
- `npm run eject`: Eject from Create React App

### Server

- `npm start`: Start the production server
- `npm run dev`: Start the development server with hot-reload

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Create React App](https://create-react-app.dev/)
- [Material-UI](https://mui.com/)
- [OpenAI API](https://platform.openai.com/)
- [Slack API](https://api.slack.com/)
