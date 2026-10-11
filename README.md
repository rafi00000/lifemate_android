# LifeMate

An integrated daily-life companion for Android: tasks and reminders, expenses and budgets (in taka), bills and subscriptions, grocery lists (shareable), and quick notes, all on one calm dashboard.

BUBT CSE project (intake 47/3).

| | |
|---|---|
| Mobile (`mobile/`) | React Native 0.86 · Expo SDK 57 · Expo Router · TypeScript · TanStack Query · Zustand · Axios · Reanimated · Expo Notifications |
| API (`server/`) | Node.js · Express 5 · TypeScript · zod · JWT + bcrypt |
| Database | MongoDB Atlas · Mongoose |
| API testing | `postman/LifeMate.postman_collection.json` |

## 1. Run locally (development)

Requires Node.js 20+. From the project root:

```bash
npm install
npm run dev
```

`npm install` installs the root, `server` and `mobile` packages. `npm run dev` starts the API (with a built-in local database and demo account) and the Expo app in one terminal.

Install **Expo Go** from the Play Store, connect the phone to the same Wi-Fi as the PC, and scan the QR code. Expo's keys (`r` reload, `w` web) work in the same terminal; `Ctrl + C` stops both. The app finds the API on the PC automatically. If it can't connect, allow Node.js through Windows Firewall on private networks.

Demo login: `demo@lifemate.app` / `LifeMate2026`.

## 2. Deploy the API (needed for the APK)

An installed APK can't reach `localhost`, so the API must be online over HTTPS.

**MongoDB Atlas:** create a free M0 cluster, add a database user, allow access from `0.0.0.0/0` (Network Access), and copy the connection string. Add the database name: `...mongodb.net/lifemate?retryWrites=true&w=majority`.

**Render (free web service):** push this repository to GitHub, then create a Web Service with:

| Setting | Value |
|---|---|
| Root directory | `server` |
| Build command | `npm install --include=dev && npm run build` |
| Start command | `npm start` |
| Environment | `NODE_ENV=production`, `MONGODB_URI=<Atlas string>`, `JWT_ACCESS_SECRET=<48+ random chars>`, `TRUST_PROXY=1` |

Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Check `https://<your-service>.onrender.com/health` returns `{"status":"ok"}`.

Optional demo data on Atlas: put `MONGODB_URI` and `JWT_ACCESS_SECRET` in `server/.env`, then run `npm --prefix server run seed`.

The free tier sleeps after 15 idle minutes; open `/health` once before a demo to wake it.

## 3. Build the APK (Expo EAS, no Android Studio needed)

Run these inside `mobile/`.

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com/api/v1`.
2. Commit the code (EAS builds from git):
   ```bash
   git add .
   git commit -m "LifeMate"
   ```
3. Log in and link the project (answer **yes** to creating the EAS project):
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
4. Upload the variables from `.env` to the EAS `preview` environment. `.env` is git-ignored, so cloud builds can't read it directly:
   ```bash
   npx eas-cli@latest env:push preview --path .env
   ```
5. Build from the project root (answer **yes** to generating an Android keystore):
   ```bash
   npm run build:apk
   ```
6. After about 10–20 minutes, EAS shows a download link and QR code for the `.apk`. Open it on the phone and allow "Install unknown apps".

If the API URL changes, edit `.env`, repeat step 4 with `--force`, and build again.

## Scripts (run from the project root)

| Command | What it does |
|---|---|
| `npm install` | Install everything (root, server, mobile) |
| `npm run dev` | API with local demo database + Expo app (phone via Expo Go) |
| `npm run dev:web` | Same, but opens the app in the browser |
| `npm run dev:atlas` | API using `MONGODB_URI` from `server/.env` + Expo app |
| `npm run seed` | Add demo data to the database in `server/.env` |
| `npm test` | Server and mobile tests |
| `npm run check` | Typecheck, lint and all tests |
| `npm run build:apk` | Build the Android APK with EAS (see step 3) |
