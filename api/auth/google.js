import { OAuth2Client } from "google-auth-library";
import { getDb } from "../_db.js";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const credential=req.body?.credential;
    const clientId=process.env.GOOGLE_CLIENT_ID;
    if(!credential||!clientId) return res.status(400).json({error:"Google sign-in is not configured"});
    const client=new OAuth2Client(clientId);
    const ticket=await client.verifyIdToken({idToken:credential,audience:clientId});
    const p=ticket.getPayload();
    if(!p?.email||!p.email_verified) return res.status(401).json({error:"Google account email is not verified"});
    const user={id:p.sub,name:p.name||"",email:p.email,picture:p.picture||"",isAdmin:false,authType:"google"};
    try{
      const db=await getDb();
      await db.collection("users").updateOne({id:user.id},{$set:{...user,lastLoginAt:new Date()}},{upsert:true});
    }catch(e){ if(process.env.MONGODB_URI) throw e; }
    return res.status(200).json({user});
  }catch(e){return res.status(401).json({error:"Google sign-in verification failed"});}
}
