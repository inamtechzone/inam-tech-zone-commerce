@echo off
title INAM TECH ZONE - GitHub Update
cd /d "%~dp0"
set "SAFE_DIR=%CD:\=/%"
git config --global --get-all safe.directory | findstr /x /l /c:"%SAFE_DIR%" >nul
if errorlevel 1 git config --global --add safe.directory "%SAFE_DIR%"
echo.
echo Updating INAM TECH ZONE on GitHub...
git branch -M main
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin https://github.com/inamtechzone/inam-tech-zone-commerce.git
) else (
  git remote set-url origin https://github.com/inamtechzone/inam-tech-zone-commerce.git
)
git add -A
git commit -m "Update INAM TECH ZONE commerce" 2>nul
echo Checking the current GitHub branch before replacement...
git fetch origin main
if errorlevel 1 (
  echo.
  echo Could not read GitHub. Check internet access and GitHub login, then try again.
  echo.
  pause
  exit /b 1
)
echo Publishing the verified final project...
git push --force-with-lease -u origin main
echo.
if errorlevel 1 (
  echo Push stopped safely because GitHub changed after the last check.
  echo Run this file again to re-check and publish the final project.
) else (
  echo Update completed. Vercel will now build the website.
)
echo.
pause
