@echo off
title Stop Hontime Platform
echo Stopping all running Hontime services...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /f /t /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /f /t /pid %%a >nul 2>&1

echo All Hontime services stopped successfully.
