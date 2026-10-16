import { getDb } from "./_db.js";
import { defaultSettings } from "./settings.js";
export default async function handler(req,res){
  res.setHeader("Content-Type","application/manifest+json; charset=utf-8");
  res.setHeader("Cache-Control","no-store, max-age=0");
  if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).end();}
  let settings=defaultSettings;
  try{const db=await getDb();const doc=await db.collection("appSettings").findOne({_id:"main"});settings={...defaultSettings,...(doc?.settings||{})};}catch{}
  const logo=settings.logoImage||"/icons/ksr-512.png";
  return res.status(200).json({name:"KSR Dairy Foods",short_name:"KSR Dairy",description:"Fresh dairy essentials from KSR Dairy Foods.",start_url:"/",scope:"/",display:"standalone",background_color:settings.backgroundWhite||"#ffffff",theme_color:settings.primaryGreen||"#176b3a",icons:[{src:logo,sizes:"512x512",purpose:"any maskable"},{src:logo,sizes:"192x192",purpose:"any"}]});
}
