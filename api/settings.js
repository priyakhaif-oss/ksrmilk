import { getDb } from "./_db.js";
import { requireAdmin } from "./_auth.js";
export const defaultSettings={
  deliveryFee:25, firstOrderFree:true, promoText:"Free delivery on your first order!",
  morningStart:"06:00", morningEnd:"09:00", eveningStart:"18:00", eveningEnd:"20:00",
  logoImage:"/icons/ksr-512.png", primaryGreen:"#176b3a", secondaryGreen:"#2f8a50", backgroundWhite:"#ffffff",
  morningHeadline:"Good morning — start with good milk.", eveningHeadline:"Good evening — goodness for your table.",
  customerCare:"Sun – Sat · 7 AM – 8 PM"
};
const allowed=Object.keys(defaultSettings);
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  try {
    const db=await getDb(); const col=db.collection("appSettings");
    if(req.method==="GET") { const doc=await col.findOne({_id:"main"}); const settings={...defaultSettings,...(doc?.settings||{})}; return res.status(200).json({settings}); }
    if(req.method==="PUT") { const admin=await requireAdmin(req,res); if(!admin) return; const incoming=req.body?.settings||{}; const clean={}; for(const key of allowed){ if(incoming[key]!==undefined) clean[key]=incoming[key]; }
      for(const k of ["morningStart","morningEnd","eveningStart","eveningEnd"]){if(clean[k]!==undefined&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(clean[k]))) return res.status(400).json({error:`Invalid time for ${k}`});}
      for(const k of ["primaryGreen","secondaryGreen","backgroundWhite"]){if(clean[k]!==undefined&&!/^#[0-9a-fA-F]{6}$/.test(String(clean[k]))) return res.status(400).json({error:`Invalid color for ${k}`});}
      if(clean.deliveryFee!==undefined) clean.deliveryFee=Math.max(0,Number(clean.deliveryFee)||0);
      clean.updatedAt=new Date(); await col.updateOne({_id:"main"},{$set:{settings:clean,updatedAt:new Date(),updatedBy:admin.email}},{upsert:true}); const doc=await col.findOne({_id:"main"}); return res.status(200).json({settings:{...defaultSettings,...doc.settings}});
    }
    res.setHeader("Allow","GET, PUT"); return res.status(405).json({error:"Method not allowed"});
  } catch(e){return res.status(503).json({error:"Settings unavailable. Configure MongoDB Atlas.",detail:process.env.NODE_ENV==="development"?e.message:undefined});}
}
