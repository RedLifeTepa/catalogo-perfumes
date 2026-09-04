import {db,doc,getDoc,addDoc,collection,getDocs,updateDoc,serverTimestamp} from "./firebase-config.js";

const $=s=>document.querySelector(s);
let products=[],cats=[],business={},heroCandidates=[],heroIndex=0,heroTimer=null;
let selectedCategory="",specialFilter="";
let cart=JSON.parse(localStorage.getItem("aura-cart")||"[]");

const money=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:business.moneda||"MXN"}).format(Number(n||0));
const drive=v=>{if(!v)return"";let m=v.match(/\/d\/([^/]+)/)||v.match(/[?&]id=([^&]+)/);return m?`https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`:v};
const img=p=>drive(p.imagen||p.urlOriginalDrive||"");

async function init(){
 try{
  let cs=null,ps=null,cf=null,errors=[];
  try{cs=await getDocs(collection(db,"categorias"))}catch(e){console.error("Categorías:",e);errors.push("categorías")}
  try{ps=await getDocs(collection(db,"productos"))}catch(e){console.error("Productos:",e);errors.push("productos")}
  try{cf=await getDoc(doc(db,"configuracion","empresa"))}catch(e){console.error("Configuración:",e);errors.push("configuración")}
  cats=cs?cs.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.activo===true).sort((a,b)=>(a.orden||0)-(b.orden||0)):[];
  products=ps?ps.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.activo===true):[];
  if(cf?.exists())business=cf.data();
  renderConfig();renderFilters();renderProducts();setupHero();renderCart();renderExtras();
  if(errors.length)showCatalogDiagnostic("No fue posible leer: "+errors.join(", ")+". Revisa las reglas Firestore v1.1.4.");
  else if(!products.length)showCatalogDiagnostic("Firebase respondió correctamente, pero no devolvió productos activos.");
 }catch(e){
  console.error(e);
  $("#products").innerHTML=`<div class="empty">No fue posible cargar el catálogo: ${e.code||e.message}</div>`;
 }
}

function showCatalogDiagnostic(text){let el=document.querySelector("#catalogDiagnostic");if(!el){el=document.createElement("div");el.id="catalogDiagnostic";el.className="catalog-diagnostic";document.querySelector(".catalog")?.prepend(el)}el.textContent=text}
function renderConfig(){
 $("#brandName").textContent=business.nombre||"AuraERP";
 if(business.logo){$("#brandLogo").src=drive(business.logo);$("#brandLogo").style.display="block"}else $("#brandLogo").style.display="none";
}

function renderFilters(){
 const specials=[
  ["","▦","Todos"],["oferta","🏷️","Ofertas"],["promocion","📣","Promociones"],["destacado","⭐","Destacados"],["nuevo","🟢","Nuevos"],["proximoLanzamiento","🚀","Próximos lanzamientos"]
 ];
 $("#chips").innerHTML=specials.map(([v,i,t],n)=>`<button class="chip ${n===0?"active":""}" data-filter="${v}">${i} ${t}</button>`).join("")+
 cats.map(c=>`<button class="chip" data-cat="${c.id}">▣ ${c.nombre}</button>`).join("");
 $("#chips").onclick=e=>{
  const b=e.target.closest(".chip");if(!b)return;
  selectedCategory=b.dataset.cat||"";specialFilter=b.dataset.filter||"";
  document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===b));
  renderProducts();
 };
}

function getFiltered(){
 const q=$("#search").value.trim().toLowerCase();
 let arr=products.filter(p=>
  (!selectedCategory||p.categoriaID===selectedCategory)&&
  (!specialFilter||p[specialFilter]===true)&&
  (!q||(p.nombre||"").toLowerCase().includes(q)||(p.descripcion||"").toLowerCase().includes(q)||(p.categoriaNombre||"").toLowerCase().includes(q))
 );
 const sort=$("#sortProducts").value;
 if(sort==="priceAsc")arr.sort((a,b)=>Number(effectivePrice(a))-Number(effectivePrice(b)));
 if(sort==="priceDesc")arr.sort((a,b)=>Number(effectivePrice(b))-Number(effectivePrice(a)));
 if(sort==="name")arr.sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||"","es"));
 if(sort==="recent")arr.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
 return arr;
}
const effectivePrice=p=>p.oferta&&Number(p.precioOferta||0)>0?Number(p.precioOferta):Number(p.precioMenudeo||0);

function renderProducts(){
 const arr=getFiltered();
 $("#count").textContent=`${arr.length} producto${arr.length===1?"":"s"}`;
 $("#products").innerHTML=arr.map(p=>{
  const offer=p.oferta&&Number(p.precioOferta||0)>0, price=effectivePrice(p);
  return `<article class="product">
   <div class="product-img">
    <div class="badges overlay">
     ${p.oferta?'<span class="badge offer">OFERTA</span>':""}
     ${p.promocion?'<span class="badge promo">PROMOCIÓN</span>':""}
     ${p.destacado?'<span class="badge featured">DESTACADO</span>':""}
     ${p.nuevo?'<span class="badge new">NUEVO</span>':""}${p.proximoLanzamiento?'<span class="badge upcoming">PRÓXIMAMENTE</span>':""}
    </div>
    <img src="${img(p)}" alt="${p.nombre||"Producto"}" onerror="this.style.opacity=.25">
   </div>
   <div class="product-body">
    <div class="category">${p.categoriaNombre||""}</div>
    <h3>${p.nombre||"Producto"}</h3>
    ${p.promocion&&p.textoPromocion?`<div class="promo-text">${p.textoPromocion}</div>`:""}
    <div class="prices"><span class="price ${offer?"sale-price":""}">${money(price)}</span>${offer?`<span class="old-price">${money(p.precioMenudeo)}</span>`:""}</div>
    ${Number(p.precioMayoreo||0)>0?`<div class="wholesale">Mayoreo desde ${money(p.precioMayoreo)}</div>`:"<div class='wholesale'>&nbsp;</div>"}
    <div class="product-actions"><button class="btn btn-light view" data-id="${p.id}">◉ Ver producto</button><button class="btn btn-gold add" data-id="${p.id}">🛒 Agregar</button></div>
   </div>
  </article>`;
 }).join("")||'<div class="empty">No encontramos productos con esos filtros.</div>';
 document.querySelectorAll(".view").forEach(b=>b.onclick=()=>showProduct(b.dataset.id));
 document.querySelectorAll(".add").forEach(b=>b.onclick=()=>addCart(b.dataset.id));
}

function setupHero(){
 heroCandidates=products.filter(p=>p.destacado||p.oferta||p.promocion||p.nuevo||p.proximoLanzamiento);
 if(!heroCandidates.length)heroCandidates=[...products];
 heroCandidates.sort(()=>Math.random()-.5);heroIndex=0;renderHero();
 clearInterval(heroTimer);if(heroCandidates.length>1)heroTimer=setInterval(nextHero,6000);
}
function renderHero(){
 const p=heroCandidates[heroIndex];if(!p)return;
 $("#hero").classList.remove("hero-animate");void $("#hero").offsetWidth;$("#hero").classList.add("hero-animate");
 $("#heroTag").textContent=p.oferta?"OFERTA":p.promocion?"PROMOCIÓN":p.destacado?"★ DESTACADO":p.proximoLanzamiento?"PRÓXIMO LANZAMIENTO":p.nuevo?"NUEVO":"RECOMENDADO";
 $("#heroName").textContent=p.nombre||"Producto";
 $("#heroText").textContent=p.textoPromocion||p.descripcion||p.categoriaNombre||"Descubre este producto.";
 $("#heroImg").src=img(p);
 const price=effectivePrice(p);
 let priceBox=$("#heroPrice");
 if(!priceBox){priceBox=document.createElement("div");priceBox.id="heroPrice";priceBox.className="hero-price";$("#heroText").after(priceBox)}
 priceBox.innerHTML=`<strong>${money(price)}</strong>${Number(p.precioMayoreo||0)>0?`<small>Mayoreo desde ${money(p.precioMayoreo)}</small>`:""}`;
 $("#heroView").onclick=()=>showProduct(p.id);
 $("#heroWA").onclick=()=>openWA(`Hola, me interesa ${p.nombre}.`);
 $("#heroDots").innerHTML=heroCandidates.map((_,i)=>`<button class="hero-dot ${i===heroIndex?"active":""}" data-i="${i}"></button>`).join("");
 document.querySelectorAll(".hero-dot").forEach(b=>b.onclick=()=>{heroIndex=Number(b.dataset.i);renderHero()});
}
function nextHero(){if(!heroCandidates.length)return;heroIndex=(heroIndex+1)%heroCandidates.length;renderHero()}
function prevHero(){if(!heroCandidates.length)return;heroIndex=(heroIndex-1+heroCandidates.length)%heroCandidates.length;renderHero()}

async function showProduct(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 const offer=p.oferta&&Number(p.precioOferta||0)>0;
 $("#detail").innerHTML=`<div class="detail"><img src="${img(p)}"><div><div class="category">${p.categoriaNombre||""}</div><h2>${p.nombre}</h2><p class="muted">${p.descripcion||"Sin descripción."}</p>${p.textoPromocion?`<p class="promo-text">${p.textoPromocion}</p>`:""}<div class="prices"><span class="price ${offer?"sale-price":""}">${money(effectivePrice(p))}</span>${offer?`<span class="old-price">${money(p.precioMenudeo)}</span>`:""}</div>${p.precioMayoreo?`<div class="wholesale">Mayoreo desde ${money(p.precioMayoreo)}</div><select id="detailMode" class="mode-select"><option value="menudeo">Menudeo</option><option value="mayoreo">Mayoreo (mínimo 3 unidades)</option></select>`:""}<button id="detailAdd" class="btn btn-gold wide" style="margin-top:10px">Agregar al carrito</button></div></div>`;
 $("#detailModal").classList.add("open");
 $("#detailAdd").onclick=()=>{addCart(id,$("#detailMode")?.value||"menudeo");$("#detailModal").classList.remove("open")};
 try{await updateDoc(doc(db,"productos",id),{numeroVistas:Number(p.numeroVistas||0)+1});p.numeroVistas=Number(p.numeroVistas||0)+1}catch(e){}
}

function addCart(id,mode="menudeo"){
 const p=products.find(x=>x.id===id);if(!p)return;
 const isWholesale=mode==="mayoreo"&&Number(p.precioMayoreo||0)>0;
 const unit=isWholesale?Number(p.precioMayoreo):effectivePrice(p);
 let x=cart.find(i=>i.id===id&&i.mode===mode);
 if(x)x.qty++;else cart.push({id:p.id,nombre:p.nombre,imagen:img(p),mode,qty:isWholesale?3:1,minQty:isWholesale?3:1,precio:unit});
 saveCart();$("#cartDrawer").classList.add("open");
}
function saveCart(){localStorage.setItem("aura-cart",JSON.stringify(cart));renderCart()}
function renderCart(){
 cart.forEach(x=>{if(x.mode==="mayoreo"&&x.qty<3)x.qty=3});
 const n=cart.reduce((s,x)=>s+x.qty,0),t=cart.reduce((s,x)=>s+x.qty*x.precio,0);
 $("#cartCount").textContent=n;$("#cartTotal").textContent=money(t);
 $("#cartItems").innerHTML=cart.map((x,i)=>`<div class="cart-line"><img src="${x.imagen}"><div><h4>${x.nombre}</h4><small>${x.mode==="mayoreo"?`Mayoreo · ${money(x.precio)} c/u · mínimo 3`:`Menudeo · ${money(x.precio)}`}</small><div class="qty"><button data-op="minus" data-i="${i}">−</button><span>${x.qty}</span><button data-op="plus" data-i="${i}">+</button></div></div><button class="remove" data-op="remove" data-i="${i}">✕</button></div>`).join("")||'<p class="muted">Tu carrito está vacío.</p>';
 $("#cartItems").onclick=e=>{let b=e.target.closest("[data-op]");if(!b)return;let i=Number(b.dataset.i);if(b.dataset.op==="plus")cart[i].qty++;if(b.dataset.op==="minus"){let min=cart[i].mode==="mayoreo"?3:1;cart[i].qty=Math.max(min,cart[i].qty-1)}if(b.dataset.op==="remove")cart.splice(i,1);saveCart()};
}

function renderExtras(){
 const defaults=[
  {icon:"🚚",title:"Envíos seguros",text:"A todo México"},
  {icon:"🛡️",title:"Productos originales",text:"Garantía de autenticidad"},
  {icon:"🎧",title:"Atención personalizada",text:"Estamos para ayudarte"},
  {icon:"🔒",title:"Compra segura",text:"Tus datos protegidos"},
  {icon:"🏅",title:"Mayoreo disponible",text:"Precios especiales"}
 ];
 const benefits=Array.isArray(business.beneficios)&&business.beneficios.length?business.beneficios:defaults;
 $("#benefits").innerHTML=benefits.map(x=>`<div class="benefit"><div class="benefit-icon">${x.icon}</div><div><strong>${x.title}</strong><small>${x.text}</small></div></div>`).join("");
 $("#copyright").textContent=`© ${new Date().getFullYear()} ${business.nombre||"AuraERP"}. Todos los derechos reservados.`;
 let socials=[];if(business.facebook)socials.push(`<a href="${business.facebook}" target="_blank">ⓕ</a>`);if(business.instagram)socials.push(`<a href="${business.instagram}" target="_blank">◎</a>`);if(business.whatsapp)socials.push(`<a href="https://wa.me/${String(business.whatsapp).replace(/\D/g,"")}" target="_blank">◉</a>`);
 $("#socials").innerHTML=socials.length?`Síguenos: ${socials.join(" ")}`:"";
}

function normalizePhone(v){return String(v||"").replace(/\D/g,"")}
function folio(){return `PED-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`}
function openWA(text){let n=String(business.whatsapp||"").replace(/\D/g,"");window.open(n?`https://wa.me/${n}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank")}

$("#search").oninput=renderProducts;
$("#sortProducts").onchange=renderProducts;
$("#heroPrev").onclick=prevHero;$("#heroNext").onclick=nextHero;
$("#cartOpen").onclick=()=>$("#cartDrawer").classList.add("open");$("#cartClose").onclick=()=>$("#cartDrawer").classList.remove("open");
$("#closeDetail").onclick=()=>$("#detailModal").classList.remove("open");
$("#checkoutBtn").onclick=()=>{if(!cart.length)return alert("Tu carrito está vacío.");$("#checkoutSummary").className="checkout-summary";$("#checkoutSummary").innerHTML=cart.map(x=>`<div>${x.qty} × ${x.nombre} — ${money(x.qty*x.precio)}</div>`).join("")+`<hr><strong>Total: ${$("#cartTotal").textContent}</strong>`;$("#checkoutModal").classList.add("open");$("#cartDrawer").classList.remove("open")};
$("#closeCheckout").onclick=()=>$("#checkoutModal").classList.remove("open");
$("#checkoutForm").onsubmit=async e=>{
 e.preventDefault();let b=$("#submitOrder"),m=$("#checkoutMsg"),f=new FormData(e.target),nombre=String(f.get("nombre")||"").trim(),telefono=String(f.get("telefono")||"").trim(),correo=String(f.get("correo")||"").trim();
 if(!nombre||normalizePhone(telefono).length<7){m.textContent="Revisa nombre y teléfono.";return}
 b.disabled=true;b.textContent="Guardando pedido...";m.textContent="";
 try{
  let total=cart.reduce((s,x)=>s+x.qty*x.precio,0),orderFolio=folio(),items=cart.map(x=>({productoID:x.id,nombre:x.nombre,modalidad:x.mode,cantidad:x.qty,precioUnitario:x.precio,subtotal:x.qty*x.precio}));
  await addDoc(collection(db,"pedidos"),{folio:orderFolio,clienteID:null,clienteNombre:nombre,telefono,correo,estado:"nuevo",productos:items,subtotal:total,total,canal:"catalogo_web",origen:"index",createdAt:serverTimestamp()});
  m.style.color="#15803d";m.textContent=`Pedido ${orderFolio} guardado correctamente.`;
  let text=`Hola, ¿qué tal? Mi nombre es ${nombre}.\n\nEstoy interesado en realizar el pedido ${orderFolio}:\n\n`+items.map(x=>`- ${x.nombre} — ${x.modalidad} — Cantidad: ${x.cantidad} — ${money(x.subtotal)}`).join("\n")+`\n\nTotal: ${money(total)}\nMi teléfono es: ${telefono}.\n\nMuchas gracias.`;
  cart=[];saveCart();setTimeout(()=>openWA(text),500);
 }catch(err){console.error(err);m.style.color="#b42318";m.textContent=err?.code==="permission-denied"?"No fue posible guardar el pedido por permisos de Firebase. Publica las reglas incluidas en v1.1.3.":"No fue posible guardar el pedido. Intenta nuevamente."}
 finally{b.disabled=false;b.textContent="Guardar pedido y continuar"}
};
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");
init();
