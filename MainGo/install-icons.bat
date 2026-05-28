@echo off
REM Double-click this file (or run from cmd) to write icon16/48/128.png into MainGo\icons
cd /d "%~dp0"
node tools\build-icons.mjs
if errorlevel 1 (
  echo Node failed. Install Node.js from https://nodejs.org then try again.
  pause
  exit /b 1
)
echo Icons written to %~dp0icons
pause
