import { getDb } from "./_db.js";
import { verifiedUser, requireAdmin } from "./_auth.js";
import { sendPushToEmails } from "./_push.js";
export default async function handler(req,res){
  try{
    const db=await getDb(); const col=db.collection("orders");
    if(req.method==="POST"){
      const o=req.body||{};
      if(!o.id||!Array.isArray(o.items)||!o.items.length||!o.customer?.name||!o.customer?.phone||!o.customer?.address) return res.status(400).json({error:"Order details are incomplete"});
      const order={...o,id:String(o.id),status:"Order received",customer:{...o.customer,name:String(o.customer.name).trim(),phone:String(o.customer.phone).trim()},createdAt:new Date(o.createdAt||Date.now())};
      await col.insertOne(order);
      try {
        const admins = (process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
        await sendPushToEmails(admins, { title: 'New KSR Dairy Foods order', body: `Order ${order.id} from ${order.customer.name} · ₹${Number(order.total || 0)}`, url: '/admin', tag: `order-${order.id}` });
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
        if (recipient) await sendPushToEmails([recipient], { title: 'KSR Dairy Foods order update', body: `Order ${order.id}: ${status}`, url: '/', tag: `order-${order.id}-${status}` });
      } catch (e) { /* order status remains saved if push delivery fails */ }
      return res.status(200).json({ok:true,notificationQueued:true});
    }
    res.setHeader("Allow","GET, POST, PATCH"); return res.status(405).json({error:"Method not allowed"});
  }catch(e){return res.status(503).json({error:"Orders API unavailable. Configure MongoDB Atlas.",detail:process.env.NODE_ENV==="development"?e.message:undefined});}
}
