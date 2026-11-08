@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Opening the standalone offline app.
  start "" "%~dp0index.html"
  pause
  exit /b
)
start "" "http://localhost:3000"
node scripts/serve.mjs
pause
