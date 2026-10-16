import crypto from "node:crypto";
import { createAdminToken } from "./_auth.js";
const equal=(a,b)=>{const x=Buffer.from(String(a||""));const y=Buffer.from(String(b||""));return x.length===y.length&&crypto.timingSafeEqual(x,y)};
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"});}
  const expectedUser=process.env.ADMIN_USERNAME||""; const expectedPass=process.env.ADMIN_PASSWORD||"";
  if(!expectedUser||!expectedPass||!process.env.ADMIN_SESSION_SECRET) return res.status(503).json({error:"Configure ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET in hosting settings."});
  const {username,password}=req.body||{};
  if(!equal(username,expectedUser)||!equal(password,expectedPass)) return res.status(401).json({error:"Incorrect admin username or password."});
  try { const token=createAdminToken(expectedUser); const email=(process.env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean)[0]||`${expectedUser}@admin.ksrdairyfoods.local`; return res.status(200).json({token,user:{id:`admin:${expectedUser}`,name:"KSR Admin",email,isAdmin:true,authType:"password"}}); }
  catch { return res.status(503).json({error:"Admin session is not configured securely. Set ADMIN_SESSION_SECRET."}); }
}
