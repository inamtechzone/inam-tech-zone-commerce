# Cloudflare-only deployment

Run `DEPLOY-CLOUDFLARE-ALL-IN-ONE.bat` from the extracted folder. It checks Cloudflare login, prepares the Pages project, applies the D1 schema, creates/checks the R2 bucket and deploys the `out` build.

Required bindings:

- `DB` → `inam-tech-zone-db`
- `MEDIA` → `inam-tech-zone-media`

The Worker serves only `products/` image objects publicly through `/media/products/*`. Objects under `files/` remain private and require an authenticated Admin API request for listing, downloading and deleting.

Cloudflare R2 must be activated on the account before the bucket can be created. The project does not use or fall back to any third-party drive.

After deployment, open `/admin/`, sign in with the temporary credentials from the Urdu guide, then change the password in Settings.
