@echo off
REM Double-click to resize icons to 16x16, 48x48, 128x128 in MainGo\icons
cd /d "%~dp0"
echo Running from: %CD%
echo.
node tools\fix-icons.mjs
if errorlevel 1 (
  echo.
  echo FAILED. Install Node from https://nodejs.org
  echo Put icon16/48/128.png in the assets folder, then try again.
  pause
  exit /b 1
)
echo.
node tools\check-icons.mjs
echo.
echo If all say OK, copy the icons folder into your store zip folder and re-zip.
pause
