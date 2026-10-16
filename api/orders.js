import { getDb } from "./_db.js";
import crypto from "node:crypto";
import { defaultSettings } from "./settings.js";
import { verifiedUser, requireAdmin } from "./_auth.js";
import { sendPushToEmails } from "./_push.js";
export default async function handler(req,res){
  try{
    const db=await getDb(); const col=db.collection("orders");
    if(req.method==="POST"){
      const o=req.body||{};
      if(!o.id||!Array.isArray(o.items)||!o.items.length||!o.customer?.name||!o.customer?.phone||!o.customer?.address) return res.status(400).json({error:"Order details are incomplete"});
      const keySecret=process.env.RAZORPAY_KEY_SECRET;
      if(!keySecret||!o.razorpayOrderId||!o.razorpayPaymentId||!o.razorpaySignature) return res.status(402).json({error:"Verified online payment is required before placing an order."});
      const expectedSignature=crypto.createHmac("sha256",keySecret).update(`${o.razorpayOrderId}|${o.razorpayPaymentId}`).digest("hex");
      const expectedBuffer=Buffer.from(expectedSignature), providedBuffer=Buffer.from(String(o.razorpaySignature));
      if(expectedBuffer.length!==providedBuffer.length||!crypto.timingSafeEqual(expectedBuffer,providedBuffer)) return res.status(402).json({error:"Online payment verification failed."});
      const settingsDoc=await db.collection("appSettings").findOne({_id:"main"});
      const settings={...defaultSettings,...(settingsDoc?.settings||{})};
      const phone=String(o.customer.phone).replace(/[^0-9]/g,"");
      const email=String(o.email||o.customer.email||"").trim().toLowerCase();
      const identityChecks=[]; if(phone) identityChecks.push({"customer.phone":{$regex:phone.slice(-10).split("").join("[^0-9]*")+"[^0-9]*$"}}); if(email) identityChecks.push({email});
      const prior=identityChecks.length?await col.findOne({$or:identityChecks},{projection:{_id:1}}):null;
      const isFirstOrder=!prior; const subtotal=Math.max(0,Number(o.subtotal)||0); const delivery=isFirstOrder&&settings.firstOrderFree?0:Math.max(0,Number(settings.deliveryFee)||0);
      const order={...o,id:String(o.id),subtotal,delivery,total:subtotal+delivery,status:"Order received",firstOrder:isFirstOrder,customer:{...o.customer,name:String(o.customer.name).trim(),phone:String(o.customer.phone).trim(),email},email,createdAt:new Date(o.createdAt||Date.now())};
      if(!order.deliverySlot||!/^\d{4}-\d{2}-\d{2}\|(morning|evening)$/.test(String(order.deliverySlot))) return res.status(400).json({error:"Please choose a valid delivery time slot."});
      const keyId=process.env.RAZORPAY_KEY_ID, razorpaySecret=process.env.RAZORPAY_KEY_SECRET;
      const paymentCheck=await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(String(o.razorpayOrderId))}`,{headers:{Authorization:"Basic "+Buffer.from(`${keyId}:${razorpaySecret}`).toString("base64")}});
      const paymentOrder=await paymentCheck.json();
      if(!paymentCheck.ok||Number(paymentOrder.amount)!==Math.round(Number(order.total)*100)||paymentOrder.currency!=="INR") return res.status(402).json({error:"Payment amount does not match this order. Please try checkout again."});
      const paymentCheckResponse=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(String(o.razorpayPaymentId))}`,{headers:{Authorization:"Basic "+Buffer.from(`${keyId}:${razorpaySecret}`).toString("base64")}});
      const paymentDetails=await paymentCheckResponse.json();
      if(!paymentCheckResponse.ok||paymentDetails.status!=="captured"||paymentDetails.order_id!==o.razorpayOrderId||Number(paymentDetails.amount)!==Math.round(Number(order.total)*100)) return res.status(402).json({error:"Payment is not captured for this order."});
      order.payment="Online payment";order.paymentVerified=true;
      await col.insertOne(order);
      try {
        const admins = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
        await sendPushToEmails(admins, { title: 'New KSR Dairy Foods order', body: `Order ${order.id} from ${order.customer.name} · ₹${Number(order.total || 0)}`, url: '/admin', tag: `order-${order.id}`, icon: settings.logoImage });
      } catch (e) { /* order remains saved even if push delivery fails */ }
      return res.status(201).json({order});
    }
    if(req.method==="GET"){
      const user=await verifiedUser(req); const email=String(req.query.email||"");
      if(!user) return res.status(401).json({error:"Sign in required to retrieve saved orders"});
      const isAdmin=user.isAdmin; if(!isAdmin && email.toLowerCase()!==user.email.toLowerCase()) return res.status(403).json({error:"You can only view your own orders"});
      const filter=isAdmin && !email?{}:{email:user.email}; const orders=await col.find(filter,{projection:{_id:0}}).sort({createdAt:-1}).limit(100).toArray();
      return res.status(200).json({orders});
    }
    if(req.method==="PATCH"){
      const admin=await requireAdmin(req,res); if(!admin) return;
      const {id,status}=req.body||{}; const allowed=["Order received","Confirmed","Preparing","Out for delivery","Delivered","Cancelled"];
      if(!id||!allowed.includes(status)) return res.status(400).json({error:"Invalid order status"});
      const order=await col.findOne({id:String(id)}); if(!order) return res.status(404).json({error:"Order not found"});
      await col.updateOne({id:String(id)},{$set:{status,updatedAt:new Date(),statusUpdatedBy:admin.email}});
      try {
        const recipient = String(order.email || order.customer?.email || '').trim().toLowerCase();
        if (recipient) { const currentSettings=await db.collection("appSettings").findOne({_id:"main"}); const logo=currentSettings?.settings?.logoImage||"/icons/ksr-192.png"; await sendPushToEmails([recipient], { title: 'KSR Dairy Foods order update', body: `Order ${order.id}: ${status}`, url: '/', tag: `order-${order.id}-${status}`, icon: logo }); }
      } catch (e) { /* order status remains saved if push delivery fails */ }
      return res.status(200).json({ok:true,notificationQueued:true});
    }
    res.setHeader("Allow","GET, POST, PATCH"); return res.status(405).json({error:"Method not allowed"});
  }catch(e){return res.status(503).json({error:"Orders API unavailable. Configure MongoDB Atlas.",detail:process.env.NODE_ENV==="development"?e.message:undefined});}
}
