import crypto from "node:crypto";
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"});}
  const keyId=process.env.RAZORPAY_KEY_ID, keySecret=process.env.RAZORPAY_KEY_SECRET;
  if(!keyId||!keySecret)return res.status(503).json({error:"Online payment is not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Environment Variables."});
  const {action}=req.body||{};
  try{
    if(action==="create"){
      const amount=Math.round(Number(req.body.amount)*100);
      if(!Number.isFinite(amount)||amount<100)return res.status(400).json({error:"Invalid payment amount"});
      const response=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(`${keyId}:${keySecret}`).toString("base64"),"Content-Type":"application/json"},body:JSON.stringify({amount,currency:"INR",receipt:String(req.body.receipt||"ksr-order").slice(0,40),payment_capture:1})});
      const data=await response.json();if(!response.ok)return res.status(502).json({error:data.error?.description||"Could not create online payment"});
      return res.status(200).json({keyId,orderId:data.id,amount:data.amount,currency:data.currency});
    }
    if(action==="verify"){
      const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body||{};
      if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature)return res.status(400).json({error:"Payment verification details are missing"});
      const expected=crypto.createHmac("sha256",keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      const a=Buffer.from(expected),b=Buffer.from(String(razorpay_signature));
      if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(400).json({error:"Online payment signature verification failed"});
      return res.status(200).json({verified:true,razorpayOrderId:razorpay_order_id,razorpayPaymentId:razorpay_payment_id});
    }
    return res.status(400).json({error:"Unknown payment action"});
  }catch(e){return res.status(502).json({error:"Online payment service is unavailable",detail:process.env.NODE_ENV==="development"?e.message:undefined});}
}
