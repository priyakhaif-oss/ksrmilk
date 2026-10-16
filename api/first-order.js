import { getDb } from "./_db.js";
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"});}
  try{
    const phone=String(req.body?.phone||"").replace(/[^0-9]/g,"");
    const email=String(req.body?.email||"").trim().toLowerCase();
    const checks=[];
    if(phone.length>=10) checks.push({"customer.phone":{$regex:phone.slice(-10).split("").join("[^0-9]*")+"[^0-9]*$"}});
    if(email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) checks.push({email});
    if(!checks.length) return res.status(200).json({isFirstOrder:null});
    const db=await getDb(); const prior=await db.collection("orders").findOne({$or:checks},{projection:{_id:1}});
    return res.status(200).json({isFirstOrder:!prior});
  }catch{return res.status(503).json({error:"Could not check first-order eligibility."});}
}
