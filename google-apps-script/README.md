# Google Apps Script backend

Use `Code.gs` and `appsscript.json` in one standalone Apps Script project. Run `setupStore()` once and deploy the project as a Web app. The script creates and maintains Products, Orders, Quotes, Categories, Customers, Coupons and Settings sheets plus a Google Drive product media folder.

When changing `Code.gs`, publish a new deployment version. The existing `/exec` URL can remain in Vercel.
