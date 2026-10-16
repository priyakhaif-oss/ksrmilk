import crypto from "node:crypto";
import { ADMIN_SESSION_SECRET } from "./_admin-config.js";
function secret(){ return ADMIN_SESSION_SECRET; }
function safeEqual(a,b){ const aa=Buffer.from(String(a)); const bb=Buffer.from(String(b)); return aa.length===bb.length && crypto.timingSafeEqual(aa,bb); }
function sign(value){ return crypto.createHmac("sha256",secret()).update(value).digest("base64url"); }
export function createAdminToken(username){
  if(!secret()) throw new Error("Admin session secret is missing from server configuration");
  const payload=Buffer.from(JSON.stringify({sub:username,exp:Date.now()+12*60*60*1000})).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function adminFromToken(token){
  if(!token||!secret()) return null;
  const parts=token.split("."); if(parts.length!==2||!safeEqual(sign(parts[0]),parts[1])) return null;
  try { const p=JSON.parse(Buffer.from(parts[0],"base64url").toString("utf8")); if(!p.sub||p.exp<Date.now()) return null; const email=(process.env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean)[0]||`${p.sub}@admin.ksrdairyfoods.local`; return {id:`admin:${p.sub}`,name:"KSR Admin",email,isAdmin:true,username:p.sub,authType:"password"}; } catch { return null; }
}
export async function verifiedUser(req){
  const header=req.headers.authorization||""; const token=header.startsWith("Bearer ")?header.slice(7):"";
  const admin=adminFromToken(token); if(admin) return admin;
  return null;
}
export async function requireAdmin(req,res){ const user=await verifiedUser(req); if(!user?.isAdmin){res.status(403).json({error:"Admin username/password sign-in required"});return null;} return user; }
