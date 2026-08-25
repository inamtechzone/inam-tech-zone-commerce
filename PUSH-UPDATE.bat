@echo off
title INAM TECH ZONE - GitHub Update
cd /d "%~dp0"
echo.
echo Updating INAM TECH ZONE on GitHub...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/inamtechzone/inam-tech-zone-commerce.git
git add -A
git commit -m "Update INAM TECH ZONE commerce" 2>nul
git push -u origin main
echo.
if errorlevel 1 (
  echo Push failed. Sign in to GitHub, then run this file again.
) else (
  echo Update completed. Vercel will now build the website.
)
echo.
pause
