# Product photos

Recommended: upload photos directly from the Admin Portal at `/admin` → Products → Add/Edit product → **Upload product photo to MongoDB**. The site compresses the image and stores the image bytes in MongoDB GridFS; the product record then points to `/api/product-image?id=...`. This persists through website redeploys and works across devices as long as the MongoDB data is retained. Back up MongoDB regularly.

Alternatively, put static photos in this folder and use `/images/filename.jpg` as the product Image URL. Static photos are part of the website deployment, whereas Admin-uploaded photos live in MongoDB.
