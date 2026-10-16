import { getDb, sampleProducts } from "./_db.js";
import { requireAdmin } from "./_auth.js";
export default async function handler(req,res){
  try{
    const db=await getDb(); const col=db.collection("products");
    if(req.method==="GET"){
      const count=await col.countDocuments();
      if(!count) await col.insertMany(sampleProducts.map(p=>({...p,createdAt:new Date()})));
      const products=await col.find({}, {_id:0}).sort({name:1}).toArray();
      return res.status(200).json({products});
    }
    if(req.method==="POST"||req.method==="PUT"){
      if(!await requireAdmin(req,res)) return;
      const p=req.body||{};
      if(!p.id||!p.name||!p.category||!Number.isFinite(Number(p.price))) return res.status(400).json({error:"Missing or invalid product fields"});
      const clean={...p,price:Number(p.price),stock:Number(p.stock||0),updatedAt:new Date()};
      await col.updateOne({id:String(p.id)},{$set:clean},{upsert:true});
      return res.status(200).json({product:clean});
    }
    if(req.method==="DELETE"){
      if(!await requireAdmin(req,res)) return;
      const id=String(req.query.id||"");
      if(!id) return res.status(400).json({error:"Product id is required"});
      await col.deleteOne({id}); return res.status(200).json({ok:true});
    }
    res.setHeader("Allow","GET, POST, PUT, DELETE"); return res.status(405).json({error:"Method not allowed"});
  }catch(e){return res.status(503).json({error:"Products API unavailable. Configure MongoDB Atlas.",detail:process.env.NODE_ENV==="development"?e.message:undefined});}
}
