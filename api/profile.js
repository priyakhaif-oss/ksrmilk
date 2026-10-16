import { getDb } from "./_db.js";
import { verifiedUser } from "./_auth.js";
export default async function handler(req,res){
  const user=await verifiedUser(req); if(!user) return res.status(401).json({error:"Sign in required"});
  try{ const db=await getDb(); const col=db.collection("users");
    if(req.method==="GET"){const saved=await col.findOne({id:user.id},{projection:{_id:0}});return res.status(200).json({profile:saved||user});}
    if(req.method==="PUT"){const p=req.body||{}; const profile={id:user.id,email:user.email,name:String(p.name||user.name).trim(),phone:String(p.phone||"").trim(),address:String(p.address||"").trim(),city:String(p.city||"").trim(),pincode:String(p.pincode||"").trim(),updatedAt:new Date()}; await col.updateOne({id:user.id},{$set:profile},{upsert:true}); return res.status(200).json({profile});}
    res.setHeader("Allow","GET, PUT");return res.status(405).json({error:"Method not allowed"});
  }catch(e){return res.status(503).json({error:"Profile storage unavailable. Configure MongoDB Atlas."});}
}
