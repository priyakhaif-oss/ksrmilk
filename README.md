# KSR Dairy Foods — Full Replace Website

React + Vite storefront with MongoDB-backed products/orders/profiles, private `/admin` route, a Progressive Web App (PWA) install button, and browser push notifications (no email provider / no Resend).

## Included
- Customer storefront, product search, cart, checkout, order tracking and profile.
- Private admin at `/admin`; no admin link appears in customer navigation. Admin signs in using server-only values in `api/_admin-config.js` (or overriding Vercel environment variables); customer sign-in is not required to place an order.
- Accept/reject orders and update order status in admin.
- Web Push notifications: new orders notify subscribed admins; status changes notify subscribed customers. Push can arrive when the site is closed if the browser/device permits it and the user has granted notification permission.
- PWA manifest, service worker and KSR Dairy Foods home-screen icon. “Download App” prompts browser installation; it installs the website as an app, it does not download an APK.
- Floating WhatsApp and call shortcuts for **+91 70363 73186**. WhatsApp opens a pre-filled message; the customer taps Send themselves. The call shortcut opens the phone dialer.
- Customer profile and order data are saved in MongoDB when configured. Cash on delivery is removed; checkout uses Razorpay online payment and requires payment keys. Categories can be added and removed in Admin → Categories. 
- Admin can upload product photos and the website logo directly from a phone/computer in `/admin`. Photos are compressed in the browser and stored in MongoDB GridFS; products and branding save database-backed image URLs. No separate image-hosting account is required.
- Admin Website settings edit first-order free delivery promotion, delivery fee, daily morning/evening slots, green/white theme, homepage morning/evening text, header logo/browser icon and customer-care hours. Settings are saved in MongoDB and customers refresh/poll for updates.
- Delivery slot choices use the current local time: before morning delivery starts both same-day windows are offered; after morning starts only the upcoming evening window; after the evening window closes the next day’s morning and evening are offered.
-  Admin login at `/admin` uses username/password only; customers can place orders without signing in.

## Admin login defaults (change before production)

The server-only file `api/_admin-config.js` contains fallback credentials so `/admin` can be tested without configuring three environment variables first:
- Username: `ksradmin`
- Password: `KSR-Dairy@2026`

Change the username, password, and session secret in that file before public launch. **Keep the GitHub repository PRIVATE** if using source-code defaults; anyone with repository access can read them. The session secret is server-only and is never bundled into the browser. You can instead override all three with Vercel Environment Variables, which is safer. Products/orders/settings still require a working MongoDB Atlas connection.

The checkout now includes an interactive OpenStreetMap: tap to drop a pin or drag the pin to adjust the exact delivery point. The browser location button is optional; customers can search or pick the pin manually.

## Required hosting environment variables
Set these in Vercel (or your Node hosting) and redeploy:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/ksr_dairy?retryWrites=true&w=majority
MONGODB_DB=ksr_dairy
ADMIN_EMAILS=admin@example.com
ADMIN_USERNAME=choose-a-username
ADMIN_PASSWORD=use-a-long-random-password
ADMIN_SESSION_SECRET=use-a-different-long-random-secret
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
VAPID_PUBLIC_KEY=generated_public_key
VAPID_PRIVATE_KEY=generated_private_key
VAPID_SUBJECT=mailto:admin@example.com
```

### Online payment setup
1. Create a Razorpay account and activate payments.
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel → Project → Settings → Environment Variables. Use test keys until you are ready for live payments.
3. Redeploy the project. Orders are only saved after Razorpay returns a successful payment and the server verifies the signature.

### Enable website push notifications (no Resend/email)
1. Install dependencies: `npm install`.
2. Generate a VAPID key pair by running `npx web-push generate-vapid-keys`.
3. Copy the generated public key to `VAPID_PUBLIC_KEY` and private key to `VAPID_PRIVATE_KEY` in hosting environment variables. Set `VAPID_SUBJECT` to a contact email address (this is just the Web Push protocol contact, not an email notification service).
4. Deploy/redeploy the website after setting the variables.
5. Open the live HTTPS website on the admin's phone/computer, sign in at `/admin`, and tap the bell button to enable browser notifications. Keep notifications allowed in device/browser settings.
6. Customers may enable browser notifications where supported. Status notifications require a matching email and supported customer authentication.

The site does not run a permanent process in the background. The browser's service worker receives push events and displays notifications when supported. Notifications require HTTPS, a supported browser, permission, a working deployment and VAPID keys. On iPhone, users generally need to add the site to the Home Screen and allow notifications.

## Upload real product photos directly in Admin (recommended)

1. Configure MongoDB Atlas and deploy the website over HTTPS.
2. Sign in at `/admin` using the `ADMIN_USERNAME` and `ADMIN_PASSWORD` configured in hosting, then open **Products**.
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
# Edit .env and set a real MongoDB Atlas URI and your own admin username/password/secret
npm run dev
```

The development command uses `vercel dev` so `/api/*` endpoints work locally as well as the React site. Admin sign-in will not work with the example placeholder values: edit `.env` and set `MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` first. The admin username/password are the values you choose in `.env`; they are not preset by this project. Do not upload `.env` or share it publicly.

For push notifications, localhost is generally treated as a secure context; on a deployed site use HTTPS. MongoDB Atlas must permit network access from your hosting environment. This project was packaged for deployment, but a live deployment and push delivery cannot be verified until your MongoDB, Razorpay, VAPID and hosting settings are configured.

## White-screen fix in this replacement
The initial render now calculates `isAdmin` before any React effects use it. This avoids a JavaScript temporal-dead-zone error in the effect dependency array that could stop the app from rendering. A React error boundary also shows a recovery message instead of a completely blank page if a different rendering error occurs. After replacing the project, redeploy with a fresh build (clear the hosting build cache if the old blank screen persists).


## Admin-managed website settings
Open `/admin` and sign in with the username/password from the hosting environment. Choose **Website settings** to edit the free-first-order delivery promotion, delivery fee, morning/evening times, logo/favicon image, green theme colors, homepage message and customer-care hours. Uploads are stored in MongoDB GridFS. Save the settings to publish them; the storefront polls for settings while customers browse.

Default delivery slots are morning 6 AM–9 AM and evening 6 PM–8 PM. Available slots are filtered against local device time. First-order free delivery is also checked server-side using the phone number and/or email on prior orders, so the server determines the final order total. Keep regular MongoDB backups.

### Admin website image controls
In `/admin` → **Website settings** → **Branding and theme**, upload or set URLs for the website logo/browser icon, homepage milk photo, and family breakfast photo. Each image shows a preview and is saved to MongoDB GridFS when uploaded; click **Save website settings** to publish the changes. Text inputs retain focus while typing.
