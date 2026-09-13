@echo off
setlocal
title INAM TECH ZONE - Cloudflare Update
cd /d "%~dp0"

set "WRANGLER_JS=%CD%\.itz-cloudflare-cli\node_modules\wrangler\bin\wrangler.js"
if not exist "%WRANGLER_JS%" (
  echo Cloudflare deployment tool is not ready. Run DEPLOY-CLOUDFLARE-ALL-IN-ONE.bat first.
  goto :failed
)
if not exist "out\index.html" goto :failed
if not exist "out\_worker.js" goto :failed
call node "%WRANGLER_JS%" r2 bucket info inam-tech-zone-media >nul 2>&1
if errorlevel 1 (
  echo Cloudflare R2 is not active. Run DEPLOY-CLOUDFLARE-ALL-IN-ONE.bat first.
  goto :failed
)
call node "%WRANGLER_JS%" d1 execute inam-tech-zone-db --remote --file migrations/0001_initial.sql --yes
if errorlevel 1 goto :failed
call node "%WRANGLER_JS%" pages deploy out --project-name inam-tech-zone-commerce --branch main --no-bundle
if errorlevel 1 goto :failed

echo.
echo SUCCESS: Cloudflare website, API and database schema are updated.
echo.
pause
exit /b 0

:failed
echo.
echo Update failed. Run DEPLOY-CLOUDFLARE-ALL-IN-ONE.bat to repair the setup.
echo.
pause
exit /b 1
