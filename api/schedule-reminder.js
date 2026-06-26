// /api/schedule-reminder.js
// Vercel Serverless Function.
// Called from the browser to schedule a PUSH notification that will be
// delivered by OneSignal's servers at the exact time requested —
// even if the user has fully closed the tab/app on every device.
//
// Why this has to run on a server (not in the browser):
// The OneSignal REST API key is a secret. If we called OneSignal directly
// from the browser with that key, anyone could read it from the page
// source and send push notifications to your entire user base.
// This function keeps that key only in Vercel's environment variables.

export default async function handler(req, res) {
  // Allow the browser (your app) to call this from any origin you control.
  // Tighten "Access-Control-Allow-Origin" to your real domain once deployed.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const { userId, title, message, sendAtISO, reminderId } = req.body || {};

    if (!userId || !message || !sendAtISO) {
      return res.status(400).json({ error: 'userId, message and sendAtISO are required' });
    }

    // Basic sanity check: sendAtISO must be a real, parseable date.
    const sendAtDate = new Date(sendAtISO);
    if (isNaN(sendAtDate.getTime())) {
      return res.status(400).json({ error: 'sendAtISO is not a valid date' });
    }

    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return res.status(500).json({ error: 'Server is missing OneSignal env vars' });
    }

    // include_aliases targets the user by the external_id we set via
    // OneSignal.login(userId) on the frontend — NOT by device/browser.
    // This is what makes it cross-device: every device where this user
    // has logged in and granted notification permission gets a
    // subscription tagged with the same external_id, and OneSignal
    // fans the notification out to all of them.
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [String(userId)] },
      target_channel: 'push',
      headings: { en: title || 'BM Enterprises' },
      contents: { en: message },
      send_after: sendAtDate.toISOString(), // OneSignal will hold and fire it at this exact time
      data: { reminderId: reminderId || null },
    };

    const osResp = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const osData = await osResp.json();

    if (!osResp.ok) {
      console.error('OneSignal error:', osData);
      return res.status(502).json({ error: 'OneSignal rejected the request', details: osData });
    }

    // osData.id is OneSignal's notification id — save this in Supabase
    // (custom_reminders.onesignal_notification_id) so we can cancel it
    // later if the user deletes/edits the reminder before it fires.
    return res.status(200).json({ ok: true, onesignalId: osData.id });
  } catch (err) {
    console.error('schedule-reminder error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
