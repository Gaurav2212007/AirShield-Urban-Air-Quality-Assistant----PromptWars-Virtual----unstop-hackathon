@echo off 
cd /d "%%~dp0" 
if not exist ".env" echo [MISSING .env] Put .env with GEMINI_API_KEY in this folder for live chatbot replies. 
if not exist "node_modules\tsx\dist\cli.mjs" call npm install --legacy-peer-deps 
start "AirShield Server" cmd /k "npm run dev" 
timeout /t 5 /nobreak >nul 
start "" "http://localhost:3000" 
