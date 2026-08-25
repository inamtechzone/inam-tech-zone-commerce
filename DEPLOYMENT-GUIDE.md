# Deployment guide

## 1. Push the complete folder

Run `PUSH-UPDATE.bat`. It fetches the existing GitHub branch, then uses `force-with-lease` to safely replace the old unrelated repository history with this verified final project. The folder points to:

`https://github.com/inamtechzone/inam-tech-zone-commerce.git`

## 2. Deploy the Google backend

1. Open Google Apps Script and create a standalone project.
2. Copy `google-apps-script/Code.gs` into the editor.
3. Enable the manifest and replace it with `google-apps-script/appsscript.json`.
4. Run:

   ```javascript
   setupStore('owner@example.com', 'replace-with-a-secure-password')
   ```

5. Approve Sheets and Drive permissions.
6. Select **Deploy → New deployment → Web app**.
7. Use **Execute as: Me** and **Who has access: Anyone**.
8. Copy the URL ending in `/exec`.

For future backend updates, use **Deploy → Manage deployments → Edit → New version → Deploy**.

## 3. Configure Vercel

Import the GitHub repository and add these Environment Variables:

```text
NEXT_PUBLIC_INAM_API_ENDPOINT=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
INAM_SITE_URL=https://your-domain.com
```

Apply both variables to Production, Preview and Development, then redeploy.

## 4. Verify

- `/products`, `/solutions`, `/services`, `/support` and `/admin` open directly.
- Admin header shows **Google synced**.
- Create a test product on one device and confirm it appears on another active device within about 10 seconds.
- Test quote submission and order tracking.

Do not commit passwords, tokens, Sheet IDs or Drive IDs.
