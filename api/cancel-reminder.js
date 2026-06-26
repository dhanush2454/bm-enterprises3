// /api/cancel-reminder.js
// Cancels a previously scheduled push (e.g. user deleted the reminder
// or marked it done before the scheduled time arrived).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  try {
    const { onesignalId } = req.body || {};
    if (!onesignalId) return res.status(400).json({ error: 'onesignalId is required' });

    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    const osResp = await fetch(
      `https://api.onesignal.com/notifications/${onesignalId}?app_id=${ONESIGNAL_APP_ID}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Key ${ONESIGNAL_REST_API_KEY}` },
      }
    );

    const osData = await osResp.json().catch(() => ({}));

    if (!osResp.ok) {
      // Not fatal — the notification may have already fired/expired.
      console.warn('OneSignal cancel warning:', osData);
      return res.status(200).json({ ok: false, details: osData });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('cancel-reminder error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
