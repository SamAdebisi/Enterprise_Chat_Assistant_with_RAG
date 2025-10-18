#!/bin/bash

echo "🚀 Starting Enterprise Chat Assistant with RAG System"
echo "=================================================="

# Check if required environment files exist
if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  Creating API environment file..."
    cp apps/api/.env.example apps/api/.env
fi

if [ ! -f "apps/inference/.env" ]; then
    echo "⚠️  Creating Inference environment file..."
    cp apps/inference/.env.example apps/inference/.env
fi

if [ ! -f "apps/web/.env" ]; then
    echo "⚠️  Creating Web environment file..."
    cp apps/web/.env.example apps/web/.env
fi

echo ""
echo "📋 System Requirements:"
echo "- Node.js 18+ (for API and Web services)"
echo "- Python 3.9+ (for Inference service)"
echo "- OpenAI API Key (for LLM functionality)"
echo "- Firebase Project (for authentication and storage)"
echo ""

echo "🔧 Starting Services..."
echo ""

# Start API Service
echo "1. Starting API Service (Port 8080)..."
cd apps/api
npm install --legacy-peer-deps
npm run dev &
API_PID=$!
cd ../..

# Start Inference Service
echo "2. Starting Inference Service (Port 8000)..."
cd apps/inference
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
INFERENCE_PID=$!
cd ../..

# Start Web Service
echo "3. Starting Web Service (Port 5173)..."
cd apps/web
npm install
npm run dev &
WEB_PID=$!
cd ../..

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🔍 Checking service health..."

# Check API Service
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ API Service: Running at http://localhost:8080"
else
    echo "❌ API Service: Not responding"
fi

# Check Inference Service
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Inference Service: Running at http://localhost:8000"
else
    echo "❌ Inference Service: Not responding"
fi

# Check Web Service
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Web Service: Running at http://localhost:5173"
else
    echo "❌ Web Service: Not responding"
fi

echo ""
echo "🌐 Access the application at: http://localhost:5173"
echo ""
echo "📚 API Documentation:"
echo "- Health Check: http://localhost:8080/health"
echo "- Inference Health: http://localhost:8000/health"
echo ""
echo "🛑 To stop all services, press Ctrl+C"
echo ""

# Keep script running
wait
