import { OAuth2Client } from "google-auth-library";
export async function verifiedUser(req){
  const header=req.headers.authorization||""; const token=header.startsWith("Bearer ")?header.slice(7):"";
  if(!token||!process.env.GOOGLE_CLIENT_ID) return null;
  try { const client=new OAuth2Client(process.env.GOOGLE_CLIENT_ID); const ticket=await client.verifyIdToken({idToken:token,audience:process.env.GOOGLE_CLIENT_ID}); const p=ticket.getPayload(); if(!p?.email||!p.email_verified) return null; const admins=(process.env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean); return {id:p.sub,name:p.name||"",email:p.email,isAdmin:admins.includes(p.email.toLowerCase())}; } catch { return null; }
}
export async function requireAdmin(req,res){ const user=await verifiedUser(req); if(!user?.isAdmin){res.status(403).json({error:"Admin authorization required"});return null;} return user; }
