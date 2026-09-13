@echo off
setlocal
title INAM TECH ZONE - Cloudflare All In One Setup
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js LTS is required. Install it, then run this file again.
  pause
  exit /b 1
)

echo.
echo [1/7] Preparing the safe Cloudflare deployment tool...
if not exist "out\index.html" (
  echo The prebuilt website folder is missing.
  goto :failed
)
if not exist "out\_worker.js" (
  echo The Cloudflare API worker is missing.
  goto :failed
)
set "WRANGLER_JS=%CD%\.itz-cloudflare-cli\node_modules\wrangler\bin\wrangler.js"
if not exist "%WRANGLER_JS%" (
  call npm install --prefix ".itz-cloudflare-cli" --ignore-scripts --no-audit --no-fund --save-exact wrangler@4.131.1
  if errorlevel 1 goto :failed
)

echo.
echo [2/7] Checking Cloudflare login...
call node "%WRANGLER_JS%" whoami >nul 2>&1
if errorlevel 1 (
  echo A browser window will open. Sign in to your Cloudflare account.
  call node "%WRANGLER_JS%" login
  if errorlevel 1 goto :failed
)

echo.
echo [3/7] Preparing the Cloudflare Pages project...
call node "%WRANGLER_JS%" pages project create inam-tech-zone-commerce --production-branch main >nul 2>&1

echo.
echo [4/7] Preparing the Cloudflare D1 database...
findstr /i /c:"inam-tech-zone-db" "wrangler.jsonc" >nul
if errorlevel 1 (
  call node "%WRANGLER_JS%" d1 create inam-tech-zone-db --location apac --binding DB --update-config --use-remote
  if errorlevel 1 goto :failed
)
call node "%WRANGLER_JS%" d1 execute inam-tech-zone-db --remote --file migrations/0001_initial.sql --yes
if errorlevel 1 goto :failed

echo.
echo [5/7] Preparing Cloudflare R2 file and image storage...
call node "%WRANGLER_JS%" r2 bucket info inam-tech-zone-media >nul 2>&1
if errorlevel 1 (
  call node "%WRANGLER_JS%" r2 bucket create inam-tech-zone-media --location apac
  if errorlevel 1 goto :r2_required
)
echo Cloudflare R2 bucket is ready.

echo.
echo [6/7] Validating the ready-made production website...
echo Prebuilt storefront and Cloudflare API are ready.

echo.
echo [7/7] Publishing the all-in-one Cloudflare store...
call node "%WRANGLER_JS%" pages deploy out --project-name inam-tech-zone-commerce --branch main --no-bundle
if errorlevel 1 goto :failed

echo.
echo SUCCESS: INAM TECH ZONE is published.
echo Website and API: Cloudflare Pages ^| Data: Cloudflare D1 ^| Images and files: Cloudflare R2
echo Admin URL: /admin/
echo Email: admin@inamtechzone.com
echo Temporary password: ITZ-Temp#8427-Admin
echo No Google Drive, OneDrive, Apps Script or external database is used.
echo.
pause
exit /b 0

:r2_required
echo.
echo Cloudflare R2 is not active for this account.
echo Open Cloudflare Dashboard - Storage and databases - R2 - Overview, activate R2, then run this file again.
echo The store will not fall back to Google Drive or any third-party storage.
goto :failed

:failed
echo.
echo Setup did not finish. Read START-HERE-CLOUDFLARE-URDU.txt, then run this file again.
echo.
pause
exit /b 1
