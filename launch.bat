@echo off
setlocal

cd /d "%~dp0"

set PORT=8000

start "Cursor Character" cmd /k "python -m http.server %PORT%"

ping 127.0.0.1 -n 2 >nul

start "Cursor Character" msedge --app=http://127.0.0.1:%PORT%/
