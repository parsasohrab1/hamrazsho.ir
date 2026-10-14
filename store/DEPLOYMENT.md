# Deployment

## Backend (API) — one Linux server with Docker

```bash
git clone https://github.com/parsasohrab1/hamdam.git && cd hamdam/backend
cp .env.example .env        # then edit: NODE_ENV=production, real JWT secrets,
                            # SMS_PROVIDER=kavenegar + keys, BAZAAR_API_SECRET,
                            # CORS_ORIGINS=https://hamrazsho.ir, PUBLIC_API_URL=https://api.hamrazsho.ir
API_DOMAIN=api.hamrazsho.ir POSTGRES_PASSWORD='<strong password>' \
  docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api npm run seed:skills   # once
```

- Point the `api.hamrazsho.ir` DNS A record at the server first; Caddy obtains the HTTPS certificate automatically.
- Migrations run automatically on every container start (`prisma migrate deploy`).
- The server refuses to start in production with placeholder JWT secrets.
- Health check: `curl https://api.hamrazsho.ir/health`.
- Backups: `docker compose -f docker-compose.prod.yml exec postgres pg_dump -U hamraz hamraz > backup.sql` (schedule daily).

## Mobile builds (EAS)

```bash
cd mental-wellness-assistant
npm i -g eas-cli && eas login && eas init     # once; sets EAS_PROJECT_ID
eas build -p android --profile bazaar         # APK for Cafe Bazaar (with Bazaar billing)
eas build -p android --profile myket          # APK for Myket
eas build -p android --profile play           # AAB for Google Play
```

Bump `APP_VERSION` and `ANDROID_VERSION_CODE` in `eas.json` → `build.base.env` for every upload.
Set `EXPO_PUBLIC_BAZAAR_RSA_KEY` (bazaar profile) and `EXPO_PUBLIC_API_BASE_URL`.

## Website

```bash
cd mental-wellness-assistant
npm run build:web       # → dist/  (read-only showcase + content library)
npm run export:legal    # → ../store/legal/privacy.html, terms.html
```

Upload `dist/` to the web host for `hamrazsho.ir`; serve `privacy.html` at `/privacy` and `terms.html` at `/terms`.
