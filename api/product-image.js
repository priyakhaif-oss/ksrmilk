import { GridFSBucket, ObjectId } from "mongodb";
import { getDb } from "./_db.js";
import { requireAdmin } from "./_auth.js";

export const config = { api: { bodyParser: { sizeLimit: "5mb" } } };

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: "productImages" });

    if (req.method === "POST") {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
      const { data, filename = "product.jpg" } = req.body || {};
      const match = typeof data === "string" && data.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
      if (!match) return res.status(400).json({ error: "Choose a valid JPG, PNG, WEBP, or GIF image." });
      const buffer = Buffer.from(match[2], "base64");
      if (!buffer.length || buffer.length > 3 * 1024 * 1024) return res.status(413).json({ error: "Image is too large. Choose a smaller photo (max 3 MB after compression)." });
      const contentType = match[1];
      const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "product-image";
      const upload = bucket.openUploadStream(safeName, { contentType, metadata: { uploadedBy: admin.email, createdAt: new Date() } });
      const completed = new Promise((resolve, reject) => { upload.once("finish", resolve); upload.once("error", reject); });
      upload.end(buffer);
      await completed;
      return res.status(201).json({ image: `/api/product-image?id=${upload.id.toString()}`, imageId: upload.id.toString() });
    }

    if (req.method === "GET") {
      const id = String(req.query.id || "");
      if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid image id" });
      const files = await bucket.find({ _id: new ObjectId(id) }).limit(1).toArray();
      if (!files.length) return res.status(404).json({ error: "Image not found" });
      const file = files[0];
      res.setHeader("Content-Type", file.contentType || file.metadata?.contentType || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Content-Type-Options", "nosniff");
      const stream = bucket.openDownloadStream(file._id);
      stream.on("error", () => { if (!res.headersSent) res.status(404).end("Image not found"); else res.end(); });
      stream.pipe(res);
      return;
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(503).json({ error: "Product image storage unavailable. Configure MongoDB Atlas.", detail: process.env.NODE_ENV === "development" ? e.message : undefined });
  }
}
