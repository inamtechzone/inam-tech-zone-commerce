# INAM TECH ZONE Commerce

A complete responsive commerce web app for hardware, tools, electrical, CCTV, solar, networking, alarm, access control, fire alarm and accessories.

## Included experiences

- Professional responsive storefront, product catalog and 1–6 image product preview
- Dedicated `/products`, `/solutions`, `/services` and `/support` pages
- Six complete solution paths with product and quote actions
- Eight professional service capabilities and three engagement levels
- Support center with order tracking, quotation, call, WhatsApp, email, map, FAQ and warranty actions
- Cart, coupons, checkout, order success, wishlist, comparison, datasheet download and project quotes
- Separate `/admin` workspace for dashboard, products, orders, quotes, categories, customers, promotions, analytics and settings
- Server-confirmed save/delete actions, visible success/error messages and accurate live totals
- Google Sheets shared data, Google Drive image uploads and approximately 3-second active-device synchronization
- ITZ blue/violet palette, `#f3f5f7` light canvas and complete dark mode
- GitHub Actions and Vercel deployment configuration

## Main routes

- `/` storefront
- `/products` product catalog
- `/solutions` complete system solutions
- `/services` professional services
- `/support` support center
- `/admin` separate administration panel

## Local preview

```bash
pnpm install
pnpm dev
```

Without Google Apps Script the demonstration admin uses:

- Email: `admin@inamtechzone.com`
- Password: `inamtech2026`

Production administrators must be configured through `setupStore()`.

## Shared Google backend

1. Create a standalone Google Apps Script project.
2. Replace its code with `google-apps-script/Code.gs` and use `google-apps-script/appsscript.json` as the manifest.
3. Run `setupStore('owner@example.com', 'a-secure-password')` once.
4. Deploy as a Web app: execute as yourself and allow access to anyone.
5. Copy the `/exec` URL into Vercel as `INAM_API_ENDPOINT` for Production, Preview and Development.
6. Redeploy Vercel.

Google Sheets is the shared source of truth. Browser storage is only the offline mirror, so desktop and mobile use the same products and commerce records.

## GitHub and Vercel

Double-click `PUSH-UPDATE.bat`, or push the `main` branch normally. Import `https://github.com/inamtechzone/inam-tech-zone-commerce.git` into Vercel and add:

- `INAM_API_ENDPOINT`: deployed Apps Script `/exec` URL used by the same-domain synchronization gateway
- `INAM_SITE_URL`: final website URL

See `START-HERE-URDU.txt` and `DEPLOYMENT-GUIDE.md` for the full walkthrough.
