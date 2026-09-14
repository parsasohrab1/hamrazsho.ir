# Yavar backend

API server for the یاور (Yāvar) voice assistant: phone + OTP authentication,
a generic per-user key-value sync store (mirrors the client app's
AsyncStorage keys), and file uploads (e.g. style-advisor photos).

## Stack

- Node.js + TypeScript + Express
- PostgreSQL via Prisma ORM
- JWT access + refresh tokens
- Docker Compose for local Postgres (and an optional containerized API)

## Design notes

- **Auth**: phone number + OTP code, no passwords. Codes are 6-digit,
  bcrypt-hashed before storage (never stored in plaintext), expire after
  `OTP_TTL_MIN` minutes, and are rate-limited both per-IP and per-phone.
  See `src/routes/auth.ts`, `src/services/otpService.ts`.
- **SMS delivery is pluggable** (`src/services/smsProvider.ts`): the default
  `console` provider logs the code instead of sending it (and echoes it in
  the API response outside production) so local dev needs no SMS account.
  A real `kavenegar` provider is implemented but requires a real
  `KAVENEGAR_API_KEY` — it throws rather than pretending to send a message
  it can't actually send.
- **Sync store** (`src/routes/data.ts`, model `UserData`): deliberately a
  generic `(userId, key, value: JSON)` table instead of one normalized
  schema per client feature. This mirrors the ~20 AsyncStorage keys the
  client already uses (e.g. `mind_companion_mood_log_v1`) so every existing
  feature gets sync without a slow per-feature migration. See the comment
  in `prisma/schema.prisma` for the full tradeoff and when to split a key
  out into its own table later.
- **File storage is pluggable** (`src/services/storageProvider.ts`): the
  default `local` provider writes under `UPLOADS_DIR`. An `s3` provider is
  stubbed but intentionally throws instead of pretending to upload — fill
  it in with real credentials before switching `STORAGE_PROVIDER=s3`.
- Every route that reads/writes user data or files is scoped to the
  authenticated `req.userId` — there is no endpoint that can be used to
  read another user's data by id-guessing.

## API summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | — | liveness check |
| POST | `/auth/request-otp` | — | send (or, in dev, echo) a login code to a phone number |
| POST | `/auth/verify-otp` | — | verify the code, create the user if new, return tokens |
| POST | `/auth/refresh` | — | exchange a refresh token for a new token pair |
| GET | `/data` | Bearer | list all synced key/value pairs for this user |
| GET | `/data/:key` | Bearer | read one key |
| PUT | `/data/:key` | Bearer | upsert one key (`{ "value": ... }`, max 256KB JSON) |
| DELETE | `/data/:key` | Bearer | delete one key |
| GET | `/files` | Bearer | list this user's uploaded files (metadata only) |
| POST | `/files` | Bearer | upload a file (multipart, field `file`, optional `key`) |
| GET | `/files/:id` | Bearer | download a file's bytes |
| DELETE | `/files/:id` | Bearer | delete a file |

Authenticated requests send `Authorization: Bearer <accessToken>`.

## Local development

```bash
cp .env.example .env
docker compose up -d postgres   # local Postgres only
npm install
npm run prisma:migrate          # creates tables, generates the Prisma client
npm run dev                     # http://localhost:4000
```

With `SMS_PROVIDER=console` (the `.env.example` default), `POST
/auth/request-otp` logs the code to the server console and also returns it
as `devCode` in the JSON response (only when `NODE_ENV !== production`), so
you can complete the login flow without a real SMS account.

## Running everything in Docker

```bash
cp .env.example .env
docker compose up -d --build
```

This starts Postgres and the API together; migrations still need to be run
once against it (`docker compose exec api npm run prisma:deploy`).

## Environment variables

See `.env.example` for the full list with inline explanations (JWT
secrets/TTLs, OTP TTL/attempts/cooldown, SMS provider selection, storage
provider selection, upload size limit). The server refuses to start in
`NODE_ENV=production` if the JWT secrets are still the `dev_only_*`
placeholders.

## Testing

```bash
npm run typecheck
npm test
```

Tests cover the pure-function services (`otpService`, `jwtService`,
`userDataValidation`) — no database is required to run them; `jest.setup.js`
supplies the env vars `env.ts` requires so these files can be imported in
isolation.

## Deployment

Sized for an initial ~10,000-user launch (see the product's SRS for the
full reasoning): a single VPS/cloud instance with 4 vCPU / 8GB RAM / 100GB
SSD comfortably runs Postgres + this API together, with room to move
Postgres to its own managed instance first if load grows. `Dockerfile` is a
multi-stage build (compiles TypeScript + generates the Prisma client in a
build stage; the runtime image installs production dependencies only).
Data-residency requirements for mental-health data may require a
domestic/physical-server hosting choice rather than an international
cloud provider — confirm this before choosing a production host.
