import { getDb } from './_db.js';
import { verifiedUser } from './_auth.js';
import { getVapidPublicKey } from './_push.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') return res.status(200).json({ publicKey: getVapidPublicKey(), enabled: Boolean(getVapidPublicKey()) });
    const user = await verifiedUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in before enabling website notifications.' });
    const db = await getDb();
    const col = db.collection('pushSubscriptions');
    if (req.method === 'POST') {
      const subscription = req.body?.subscription;
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) return res.status(400).json({ error: 'Invalid browser notification subscription.' });
      await col.updateOne({ endpoint: subscription.endpoint }, { $set: { endpoint: subscription.endpoint, subscription, email: user.email.toLowerCase(), isAdmin: user.isAdmin, updatedAt: new Date() } }, { upsert: true });
      return res.status(201).json({ ok: true, message: 'Website notifications enabled.' });
    }
    if (req.method === 'DELETE') {
      const endpoint = req.body?.endpoint;
      if (endpoint) await col.deleteOne({ endpoint, email: user.email.toLowerCase() });
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(503).json({ error: 'Website notifications could not be configured. Check MongoDB and VAPID settings.' });
  }
}
