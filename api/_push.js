import webpush from 'web-push';
import { getDb } from './_db.js';

let configured = false;
function configurePush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@ksrdairyfoods.in', publicKey, privateKey);
    configured = true;
  }
  return true;
}
export function getVapidPublicKey() { return process.env.VAPID_PUBLIC_KEY || ''; }
export async function sendPushToEmails(emails, payload) {
  if (!configurePush()) return { sent: 0, configured: false };
  const targets = [...new Set((emails || []).map(e => String(e || '').trim().toLowerCase()).filter(Boolean))];
  if (!targets.length) return { sent: 0, configured: true };
  const db = await getDb();
  const col = db.collection('pushSubscriptions');
  const subscriptions = await col.find({ email: { $in: targets } }).toArray();
  let sent = 0;
  await Promise.all(subscriptions.map(async row => {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
      sent++;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) await col.deleteOne({ _id: row._id });
    }
  }));
  return { sent, configured: true };
}
