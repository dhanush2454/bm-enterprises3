# Phase 1 — Cross-Device Login + Push Notifications

## What changed
- `index.html` — your app, with login/register/logout and reminders/notifications
  now backed by Supabase (cross-device accounts) and OneSignal (real push).
- `api/schedule-reminder.js` — Vercel function that schedules a push at an exact time.
- `api/cancel-reminder.js` — Vercel function that cancels a scheduled push.
- `01_schema.sql` — run this once in Supabase to create the needed tables.
- `OneSignalSDKWorker.js` — required file, must sit at your site's root.
- `vercel.json` — Vercel function config.
- `.env.example` — which environment variables to set in Vercel (not secret values).

## ⚠️ First: rotate your OneSignal REST API key
You pasted your real REST API key in chat earlier. Go to OneSignal →
Settings → Keys & IDs → regenerate it, and use the NEW key below. Never
put this key in index.html or commit it to GitHub — Vercel env vars only.

## Step 1 — Run the SQL schema
1. Supabase dashboard → SQL Editor → New query.
2. Paste the entire contents of `01_schema.sql` → Run.
3. Check Table Editor → you should now see `profiles`, `custom_reminders`, `notifs`.

## Step 2 — Push everything to GitHub
```
git init
git add .
git commit -m "Phase 1: cross-device login + push notifications"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 3 — Deploy to Vercel
1. vercel.com → Add New Project → import this repo.
2. Before first deploy, add Environment Variables (Project Settings → Environment Variables):
   - `ONESIGNAL_APP_ID` = `f4d56eeb-0525-469c-bf3d-3ec19923abf3`
   - `ONESIGNAL_REST_API_KEY` = (your NEW regenerated key)
3. Deploy. Note the URL Vercel gives you, e.g. `https://your-app.vercel.app`.

## Step 4 — Point OneSignal at your real domain
1. OneSignal dashboard → Settings → your app → update the Site URL to your
   real Vercel domain (or custom domain once you attach one).
2. Make sure `OneSignalSDKWorker.js` is reachable at
   `https://your-app.vercel.app/OneSignalSDKWorker.js` (it will be automatically,
   since it's at the project root — Vercel serves it as a static file).

## Step 5 — Test cross-device login
1. On your phone, open the deployed URL → Register a new account.
2. On your laptop, open the SAME deployed URL → Login with that same email/password.
3. It should log in immediately — no "user not found."

## Step 6 — Test cross-device push
1. While logged in on your phone, allow notifications when prompted.
2. Create a reminder for ~2 minutes from now (Reminders → + Reminder).
3. Close the app fully on your phone (swipe away, don't just lock screen).
4. On your laptop, log in with the same email and also allow notifications when prompted.
5. Wait for the scheduled time — both devices should get a real OS-level push
   notification (not just something inside the open tab), even with the
   phone app fully closed.

## Known limits of Phase 1 (by design, see chat)
Operator/manager team lists, editing your profile, and changing your
password still use local-only storage for now — those will be migrated
in Phase 2, alongside jobs/invoices/machines/etc.
