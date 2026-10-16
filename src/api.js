const localProducts = [
  { id:"milk", name:"Farm Fresh Milk", category:"Milk", price:32, unit:"500 ml", description:"Fresh, creamy everyday milk for your family.", image:"https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=900&q=85", tag:"Daily essential", stock:100 },
  { id:"curd", name:"Thick Set Curd", category:"Curd", price:35, unit:"500 g", description:"Smooth, naturally tangy curd with a rich texture.", image:"https://images.unsplash.com/photo-1571212515416-fcae7b9a1f2d?auto=format&fit=crop&w=900&q=85", tag:"Customer favourite", stock:80 },
  { id:"paneer", name:"Soft Fresh Paneer", category:"Paneer", price:95, unit:"200 g", description:"Soft paneer, perfect for curries, grills and snacks.", image:"https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=85", tag:"Made fresh", stock:35 },
  { id:"ghee", name:"Pure Cow Ghee", category:"Ghee", price:285, unit:"250 ml", description:"Aromatic golden ghee for everyday cooking and celebrations.", image:"https://images.unsplash.com/photo-1630413224030-3e3a4f9a5f25?auto=format&fit=crop&w=900&q=85", tag:"Traditional", stock:25 },
  { id:"buttermilk", name:"Spiced Buttermilk", category:"Drinks", price:20, unit:"250 ml", description:"A refreshing, lightly spiced drink served chilled.", image:"https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=85", tag:"Cool & refreshing", stock:60 },
  { id:"butter", name:"Creamy White Butter", category:"Butter", price:75, unit:"100 g", description:"Delicious creamy butter for toast, parathas and more.", image:"https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=900&q=85", tag:"Small batch", stock:30 }
];
export const seedProducts = localProducts;
export async function api(path, options = {}) {
  try {
    const res = await fetch(path, { headers: { "Content-Type":"application/json", ...(sessionStorage.getItem("ksr-google-credential") ? { Authorization: `Bearer ${sessionStorage.getItem("ksr-google-credential")}` } : {}), ...(options.headers||{}) }, ...options });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  } catch (e) {
    if (path.startsWith("/api/products") && (!navigator.onLine || e instanceof TypeError)) return { products: localProducts, demo:true };
    throw e;
  }
}
