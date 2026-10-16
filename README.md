# KSR Dairy Foods — Full Replace Website

React + Vite storefront with MongoDB-backed products/orders/profiles, private `/admin` route, a Progressive Web App (PWA) install button, and browser push notifications (no email provider / no Resend).

## Included
- Customer storefront, product search, cart, checkout, order tracking and profile.
- Private admin at `/admin`; no admin link appears in customer navigation. Admin must sign in with a Google account listed in `ADMIN_EMAILS`.
- Accept/reject orders and update order status in admin.
- Web Push notifications: new orders notify subscribed admins; status changes notify subscribed customers. Push can arrive when the site is closed if the browser/device permits it and the user has granted notification permission.
- PWA manifest, service worker and KSR Dairy Foods home-screen icon. “Download App” prompts browser installation; it installs the website as an app, it does not download an APK.
- Floating WhatsApp and call shortcuts for **+91 70363 73186**. WhatsApp opens a pre-filled message; the customer taps Send themselves. The call shortcut opens the phone dialer.
- Customer profile and order data are saved in MongoDB when configured.
- Admin can upload real product photos directly from a phone/computer in `/admin` → Products. Photos are compressed in the browser and stored as binary files in MongoDB GridFS; products save a permanent database-backed image URL. No separate image-hosting account is required.
- Google sign-in opens an explicit Google sign-in dialog with the official Google account chooser/button; after successful sign-in, customers return to the home page. Admins signing in from `/admin` return to the admin portal.

## Required hosting environment variables
Set these in Vercel (or your Node hosting) and redeploy:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/ksr_dairy?retryWrites=true&w=majority
MONGODB_DB=ksr_dairy
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id.apps.googleusercontent.com
ADMIN_EMAILS=admin@example.com
VAPID_PUBLIC_KEY=generated_public_key
VAPID_PRIVATE_KEY=generated_private_key
VAPID_SUBJECT=mailto:admin@example.com
```

### Why only one Google Client ID now?
Use **one** Google OAuth Web Client ID in `GOOGLE_CLIENT_ID`. The Vite build reuses the same public client ID for the browser login, while the API uses it to verify the Google credential. It is normal for the ID to be visible in website code; never put a Google *client secret* in the frontend. In Google Cloud Console, add the deployed website domain under Authorized JavaScript origins.

### Enable website push notifications (no Resend/email)
1. Install dependencies: `npm install`.
2. Generate a VAPID key pair by running `npx web-push generate-vapid-keys`.
3. Copy the generated public key to `VAPID_PUBLIC_KEY` and private key to `VAPID_PRIVATE_KEY` in hosting environment variables. Set `VAPID_SUBJECT` to a contact email address (this is just the Web Push protocol contact, not an email notification service).
4. Deploy/redeploy the website after setting the variables.
5. Open the live HTTPS website on the admin's phone/computer, sign in at `/admin`, and tap the bell button to enable browser notifications. Keep notifications allowed in device/browser settings.
6. Customers sign in with Google and tap the bell button to enable notifications. The order email on the order must match the signed-in email for status pushes to be routed to that customer's browser.

The site does not run a permanent process in the background. The browser's service worker receives push events and displays notifications when supported. Notifications require HTTPS, a supported browser, permission, a working deployment and VAPID keys. On iPhone, users generally need to add the site to the Home Screen and allow notifications.

## Upload real product photos directly in Admin (recommended)

1. Configure MongoDB Atlas and deploy the website over HTTPS.
2. Sign in with an email included in `ADMIN_EMAILS`, then open `/admin` → **Products**.
3. Click **Add product** or the pencil icon on an existing product.
4. Under **Upload product photo to MongoDB**, choose a real photo from your phone/computer.
5. Wait for the success message and image preview, then click **Save product**.

The browser compresses the photo to a web-friendly JPEG and uploads it to MongoDB GridFS. The product record stores an image URL such as `/api/product-image?id=<MongoDB file id>`, so it remains available after redeploys and across devices as long as the MongoDB database/files are retained. This does not depend on a local `public/images` folder or an external image host. Keep regular MongoDB backups; no storage can be promised to last literally forever if the database/account is deleted or its storage is lost. For manual/static images, you may still put files in `public/images/` and enter `/images/milk.jpg` in the Image URL field.

Keep your logo/app icons in `public/icons/` if you want to replace the current KSR icon.

## Install the website as an app
Tap **Download App**. On supported Android/desktop browsers this opens the native install prompt. If no prompt appears, use the browser menu (⋮) and choose **Install app** or **Add to Home screen**. This creates a home-screen app named **KSR Dairy Foods** with the website icon; it is not an Android APK file.

## Run locally
```bash
npm install
cp .env.example .env
npm run dev
```

For push notifications, localhost is generally treated as a secure context; on a deployed site use HTTPS. MongoDB Atlas must permit network access from your hosting environment. This project was packaged for deployment, but a live deployment and push delivery cannot be verified until your own Google, MongoDB, VAPID and hosting settings are configured.
