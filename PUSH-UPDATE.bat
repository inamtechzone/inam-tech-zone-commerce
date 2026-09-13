@echo off
setlocal
title INAM TECH ZONE - GitHub Update
cd /d "%~dp0"
set "SAFE_DIR=%CD:\=/%"

git config --global --get-all safe.directory | findstr /x /l /c:"%SAFE_DIR%" >nul
if errorlevel 1 git config --global --add safe.directory "%SAFE_DIR%"

echo.
echo Updating INAM TECH ZONE on GitHub...
if not exist ".git" git init
git branch -M main
git config user.name >nul 2>&1
if errorlevel 1 git config user.name "INAM TECH ZONE"
git config user.email >nul 2>&1
if errorlevel 1 git config user.email "admin@inamtechzone.com"
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin https://github.com/inamtechzone/inam-tech-zone-commerce.git
) else (
  git remote set-url origin https://github.com/inamtechzone/inam-tech-zone-commerce.git
)

git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Update INAM TECH ZONE commerce"
  if errorlevel 1 goto :failed
)

echo Checking GitHub before publishing...
git fetch origin main
if errorlevel 1 (
  echo.
  echo GitHub could not be reached. Check internet and GitHub login, then run this file again.
  echo.
  pause
  exit /b 1
)

git push --force-with-lease -u origin main
if errorlevel 1 (
  echo.
  echo Push stopped safely because GitHub changed. Run this file again to re-check.
  echo.
  pause
  exit /b 1
)

echo.
echo Update completed. A connected Cloudflare Pages project will now build the website.
echo.
pause
exit /b 0

:failed
echo.
echo Git commit could not be created. Check the message above, then run this file again.
echo.
pause
exit /b 1
