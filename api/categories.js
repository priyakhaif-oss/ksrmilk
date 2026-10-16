import { getDb } from "./_db.js";
import { requireAdmin } from "./_auth.js";
const defaults=["Milk","Curd","Paneer","Ghee","Butter","Drinks"];
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  try{
    const db=await getDb(), col=db.collection("categories");
    if(req.method==="GET"){
      let docs=await col.find({}, {projection:{_id:0,name:1}}).sort({name:1}).toArray();
      if(!docs.length){await col.insertMany(defaults.map(name=>({name,createdAt:new Date()})));docs=defaults.map(name=>({name}));}
      return res.status(200).json({categories:docs.map(x=>x.name)});
    }
    const admin=await requireAdmin(req,res);if(!admin)return;
    if(req.method==="POST"){
      const name=String(req.body?.name||"").trim().replace(/\\s+/g," ");
      if(!name||name.length>40)return res.status(400).json({error:"Category name must be 1–40 characters"});
      const allNames=await col.find({}, {projection:{_id:0,name:1}}).toArray();
      const exists=allNames.some(x=>String(x.name).toLowerCase()===name.toLowerCase());
      if(exists)return res.status(409).json({error:"Category already exists"});
      await col.insertOne({name,createdAt:new Date(),createdBy:admin.username});
      const docs=await col.find({}, {projection:{_id:0,name:1}}).sort({name:1}).toArray();
      return res.status(201).json({categories:docs.map(x=>x.name)});
    }
    if(req.method==="DELETE"){
      const name=String(req.query.name||"").trim();
      if(!name)return res.status(400).json({error:"Category name is required"});
      const used=await db.collection("products").findOne({category:name});
      if(used)return res.status(409).json({error:"Products still use this category. Move or delete them first."});
      await col.deleteOne({name});
      const docs=await col.find({}, {projection:{_id:0,name:1}}).sort({name:1}).toArray();
      return res.status(200).json({categories:docs.map(x=>x.name)});
    }
    res.setHeader("Allow","GET, POST, DELETE");return res.status(405).json({error:"Method not allowed"});
  }catch(e){return res.status(503).json({error:"Categories API unavailable. Configure MongoDB Atlas.",detail:process.env.NODE_ENV==="development"?e.message:undefined});}
}
