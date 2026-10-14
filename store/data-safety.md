# Google Play — Data safety form answers

Derived from the actual code (see `mental-wellness-assistant/src/data/legalDocs.ts`). Re-check whenever data handling changes.

| Question | Answer |
|---|---|
| Does the app collect or share user data? | **Yes, collects** (only when the user opts into an account). **Does not share.** |
| Is data encrypted in transit? | Yes (HTTPS) |
| Can users request deletion? | Yes — in-app (Settings → delete account) and by email |

## Data types collected (only with an optional account)

| Type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| Phone number | Yes | No | Yes | Account management (OTP login) |
| Health info — mood log, quit-habit plan | Yes | No | Yes | App functionality (cloud backup/sync) |
| Other user-generated content — companion profile, family notes, career path, emergency contacts | Yes | No | Yes | App functionality (cloud backup/sync) |
| Purchase history | Yes | No | Yes | App functionality (subscription) |

## Not collected
Location (read on-device only, to fill an emergency SMS the user sends themself), audio/voice recordings (not stored; speech-to-text is done by the OS recognizer), photos (stay on the device), contacts list (not read), device IDs, advertising IDs, analytics, crash logs.

## Permissions justification
- `RECORD_AUDIO` — voice conversation; typing always works instead
- `CAMERA` — style advisor photos, only on user action
- `ACCESS_COARSE_LOCATION` — only when preparing an emergency message in Active Listening
- Fine/background location, media/storage read permissions: explicitly **blocked** in `app.config.ts`
