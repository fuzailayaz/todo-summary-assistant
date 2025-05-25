#!/bin/bash

# Kill any existing processes on these ports
kill -9 $(lsof -ti:3001,5002) 2> /dev/null

# Start the backend server in the background
echo "🚀 Starting backend server on port 5002..."
cd server && npm install && npm run dev &

# Store the backend server's process ID
BACKEND_PID=$!

# Give backend a moment to start
sleep 3

# Start the frontend server
echo "🚀 Starting frontend on http://localhost:3001"
cd ../client && npm install && PORT=3001 npm start

echo "\n✅ Servers are starting..."
echo "   - Frontend: http://localhost:3001"
echo "   - Backend API: http://localhost:5002"

echo "\nTo stop both servers, press Ctrl+C in this terminal"

# When the frontend server is stopped (Ctrl+C), also stop the backend server
echo "Stopping backend server..."
kill $BACKEND_PID
