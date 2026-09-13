# INAM TECH ZONE — Cloudflare-Only Advanced Commerce V8.2

Version 8.2 adds Excel-compatible product CSV import/export, a matching migration template, a calmer high-performance color system and screen-fitted product previews.

This release uses one Cloudflare platform from end to end:

- Cloudflare Pages: responsive storefront, full admin panel and edge API
- Cloudflare D1: products, categories, stock, orders, customers, quotes, promotions, settings and secure admin sessions
- Cloudflare R2: product images, hero media and private business files
- Cloudflare Worker: authentication, validation, checkout calculations, synchronization and protected file operations

Google Drive, OneDrive, Google Apps Script, Google Sheets, Vercel APIs and external databases are not used.

## Deploy

Read `START-HERE-CLOUDFLARE-URDU.txt`, then double-click `DEPLOY-CLOUDFLARE-ALL-IN-ONE.bat`.

The deployment prepares the Pages project, checks the D1 database, creates/checks the private R2 bucket and publishes the prebuilt production app. If Cloudflare reports that R2 is not active, enable R2 in the same Cloudflare account and run the file again. The app deliberately has no third-party storage fallback.

## Admin

- URL: `/admin/`
- Temporary email: `admin@inamtechzone.com`
- Temporary password: `ITZ-Temp#8427-Admin`

Change the temporary password immediately in Admin → Settings → Integrations.

## Media and files

- Product editor: drag/drop or select 1–6 JPG, PNG, WebP, GIF or AVIF images, maximum 6 MB each.
- Image URL: the server imports the remote image into R2 first; the product stores only its Cloudflare path.
- Hero image: upload from Admin → Settings → Brand; it is saved in R2.
- Cloud Files: private images, PDF, TXT, CSV, JSON, Word, Excel, PowerPoint and ZIP files, maximum 10 MB each.
- Private files can only be listed, downloaded or deleted through an authenticated administrator session.
- Product deletion removes unreferenced R2 images; images shared by a duplicated product are preserved.

Built-in product photography is bundled with the site and served by Cloudflare Pages. Browser storage is only a local cache for responsive UI; D1 and R2 remain authoritative.
