@echo off
cd /d "%%~dp0"
if not exist "node_modules" npm install
start "" cmd /k "npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
