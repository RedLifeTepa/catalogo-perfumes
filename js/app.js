import {auth,db,onAuthStateChanged,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,doc,getDoc,setDoc,addDoc,collection,serverTimestamp,getDocs,updateDoc,query,where,limit,runTransaction} from "./firebase-config.js";
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);let cats=[],products=[],entity=null,editing=null;
async function log(action){try{await addDoc(collection(db,"bitacora"),{action,uid:auth.currentUser?.uid,email:auth.currentUser?.email,createdAt:serverTimestamp()})}catch(e){console.warn(e)}}
$("#loginForm").onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,$("#email").value.trim(),$("#password").value)}catch(x){$("#loginMsg").textContent="No fue posible iniciar sesión."}};
$("#resetBtn").onclick=async()=>{try{await sendPasswordResetEmail(auth,$("#email").value.trim());$("#loginMsg").textContent="Correo enviado."}catch(e){$("#loginMsg").textContent="Escribe un correo válido."}};
$("#logoutBtn").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{if(!u){$("#login").style.display="grid";$("#app").style.display="none";return}const s=await getDoc(doc(db,"usuarios",u.uid));if(!s.exists()||s.data().activo!==true){$("#loginMsg").textContent="Usuario sin perfil activo.";await signOut(auth);return}$("#userLabel").textContent=s.data().nombre||u.email;$("#login").style.display="none";$("#app").style.display="flex";$("#firebaseStatus").textContent="Firebase conectado";await loadCategories();await loadProducts()});
$("#nav").onclick=e=>{const b=e.target.closest("[data-module]");if(!b)return;$$(".nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".module").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.module).classList.add("active");$("#sidebar").classList.remove("open")};
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("aura-theme",document.body.classList.contains("dark")?"dark":"light")};if(localStorage.getItem("aura-theme")==="dark")document.body.classList.add("dark");
$("#saveConfig").onclick=async()=>{try{await setDoc(doc(db,"configuracion","empresa"),{nombre:$("#businessName").value.trim(),whatsapp:$("#whatsapp").value.trim(),logo:$("#businessLogo")?.value.trim()||"",moneda:$("#currency")?.value||"MXN",facebook:$("#cfgFacebook")?.value.trim()||"",instagram:$("#cfgInstagram")?.value.trim()||"",beneficios:[{icon:"🚚",title:"Envíos seguros",text:"A todo México"},{icon:"🛡️",title:"Productos originales",text:"Garantía de autenticidad"},{icon:"🎧",title:"Atención personalizada",text:"Estamos para ayudarte"},{icon:"🔒",title:"Compra segura",text:"Tus datos protegidos"},{icon:"🏅",title:"Mayoreo disponible",text:"Precios especiales"}],updatedAt:serverTimestamp()},{merge:true});$("#configMsg").style.color="var(--ok)";$("#configMsg").textContent="Configuración guardada.";await log("Actualizó configuración")}catch(e){$("#configMsg").textContent="No fue posible guardar."}};
const modal=$("#modal");function openM(t,h){$("#modalTitle").textContent=t;$("#formFields").innerHTML=h;modal.classList.add("open")}function closeM(){modal.classList.remove("open");entity=editing=null}$("#closeModal").onclick=$("#cancelModal").onclick=closeM;
function drive(v){if(!v)return"";let m=v.match(/\/d\/([^/]+)/)||v.match(/[?&]id=([^&]+)/);return m?`https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`:v}
async function loadCategories(){
 try{
  const s=await getDocs(collection(db,"categorias"));
  cats=s.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>(x.orden||0)-(y.orden||0));
  const tbody=$("#categoriesTable");
  if(tbody) tbody.innerHTML=cats.map(c=>`<tr><td>${c.nombre||""}</td><td>${c.orden||0}</td><td><span class="badge">${c.activo!==false?"Activo":"Inactivo"}</span></td><td><button class="smallbtn editCat" data-id="${c.id}">Editar</button> <button class="smallbtn toggleCat" data-id="${c.id}">${c.activo!==false?"Desactivar":"Activar"}</button></td></tr>`).join("")||'<tr><td colspan="4">Sin categorías.</td></tr>';
  const filter=$("#productCategoryFilter");
  if(filter) filter.innerHTML='<option value="">Todas las categorías</option>'+cats.filter(c=>c.activo!==false).map(c=>`<option value="${c.id}">${c.nombre}</option>`).join("");
  const k=$("#kpiCategories");if(k)k.textContent=cats.length;
  $$(".editCat").forEach(b=>b.onclick=()=>editCat(b.dataset.id));$$(".toggleCat").forEach(b=>b.onclick=()=>toggleCat(b.dataset.id));
 }catch(e){console.error("loadCategories",e);const t=$("#categoriesTable");if(t)t.innerHTML=`<tr><td colspan="4">Error al cargar categorías: ${e.code||e.message}</td></tr>`}
}
function catForm(c={}){return`<div class="field"><label>Nombre *</label><input name="nombre" required value="${c.nombre||""}"></div><div class="form-grid"><div class="field"><label>Orden</label><input name="orden" type="number" value="${c.orden||0}"></div><div class="field"><label>Estado</label><select name="activo"><option value="true" ${c.activo!==false?"selected":""}>Activo</option><option value="false" ${c.activo===false?"selected":""}>Inactivo</option></select></div></div>`}
$("#newCategory").onclick=()=>{entity="cat";openM("Nueva categoría",catForm())};function editCat(id){entity="cat";editing=cats.find(x=>x.id===id);openM("Editar categoría",catForm(editing))}async function toggleCat(id){let c=cats.find(x=>x.id===id);await updateDoc(doc(db,"categorias",id),{activo:c.activo===false,updatedAt:serverTimestamp()});await log("Cambió estado de categoría");await loadCategories()}
function prodForm(p={}){let o=cats.filter(c=>c.activo!==false).map(c=>`<option value="${c.id}" ${p.categoriaID===c.id?"selected":""}>${c.nombre}</option>`).join("");return`<div class="form-grid"><div class="field"><label>Nombre *</label><input name="nombre" required value="${p.nombre||""}"></div><div class="field"><label>Categoría *</label><select name="categoriaID" required><option value="">Selecciona</option>${o}</select></div><div class="field"><label>Precio menudeo *</label><input name="precioMenudeo" type="number" min="0" step=".01" required value="${p.precioMenudeo??""}"></div><div class="field"><label>Precio mayoreo</label><input name="precioMayoreo" type="number" min="0" step=".01" value="${p.precioMayoreo??""}"></div><div class="field"><label>Costo</label><input name="costo" type="number" min="0" step=".01" value="${p.costo??""}"></div><div class="field"><label>Precio de oferta</label><input name="precioOferta" type="number" min="0" step=".01" value="${p.precioOferta??""}"></div><div class="field"><label>Stock</label><input name="stock" type="number" min="0" value="${p.stock??0}"></div><div class="field"><label>Stock mínimo</label><input name="stockMinimo" type="number" min="0" value="${p.stockMinimo??0}"></div><div class="field"><label>SKU</label><input name="sku" value="${p.sku||""}"></div></div><div class="field"><label>Descripción</label><textarea name="descripcion">${p.descripcion||""}</textarea></div><div class="field"><label>Texto de promoción</label><input name="textoPromocion" placeholder="Ej. Regalo incluido, 2x1..." value="${p.textoPromocion||""}"></div><div class="field"><label>URL imagen / Google Drive</label><input name="imagen" id="imageUrl" value="${p.urlOriginalDrive||""}"><img id="imgPreview" class="preview" src="${drive(p.urlOriginalDrive||"")}"></div><div class="checkrow"><label><input name="activo" type="checkbox" ${p.activo!==false?"checked":""}> Activo</label><label><input name="oferta" type="checkbox" ${p.oferta?"checked":""}> Oferta</label><label><input name="promocion" type="checkbox" ${p.promocion?"checked":""}> Promoción</label><label><input name="destacado" type="checkbox" ${p.destacado?"checked":""}> Destacado</label><label><input name="nuevo" type="checkbox" ${p.nuevo?"checked":""}> Nuevo</label></div>`}
$("#newProduct").onclick=()=>{if(!cats.length)return alert("Primero crea una categoría.");entity="prod";openM("Nuevo producto",prodForm());preview()};function preview(){let i=$("#imageUrl"),p=$("#imgPreview");if(i)i.oninput=()=>p.src=drive(i.value)}
function editProd(id){entity="prod";editing=products.find(x=>x.id===id);openM("Editar producto",prodForm(editing));preview()}
async function loadProducts(){
 try{
  const s=await getDocs(collection(db,"productos"));
  products=s.docs.map(d=>({id:d.id,...d.data()}));
  const k=$("#kpiProducts");if(k)k.textContent=products.length;
  renderProducts();
 }catch(e){
  console.error("loadProducts",e);
  const t=$("#productsTable");if(t)t.innerHTML=`<tr><td colspan="6">Error al cargar productos: ${e.code||e.message}</td></tr>`;
 }
}
function renderProducts(){let q=$("#productSearch").value.toLowerCase(),c=$("#productCategoryFilter").value;let a=products.filter(p=>(!q||(p.nombre||"").toLowerCase().includes(q))&&(!c||p.categoriaID===c));$("#productsTable").innerHTML=a.map(p=>`<tr><td>${p.nombre}</td><td>${p.categoriaNombre||""}</td><td>$${Number(p.precioMenudeo||0).toFixed(2)}</td><td>${p.stock||0}</td><td><span class="badge">${p.activo!==false?"Activo":"Inactivo"}</span></td><td><button class="smallbtn editProd" data-id="${p.id}">Editar</button></td></tr>`).join("")||'<tr><td colspan="6">Sin productos.</td></tr>';$$(".editProd").forEach(b=>b.onclick=()=>editProd(b.dataset.id))}
$("#productSearch").oninput=renderProducts;$("#productCategoryFilter").onchange=renderProducts;
$("#entityForm").onsubmit=async e=>{e.preventDefault();let f=new FormData(e.target);try{if(entity==="cat"){let d={nombre:String(f.get("nombre")).trim(),orden:Number(f.get("orden")||0),activo:f.get("activo")==="true",updatedAt:serverTimestamp()};editing?await updateDoc(doc(db,"categorias",editing.id),d):await addDoc(collection(db,"categorias"),{...d,createdAt:serverTimestamp()});await log(editing?"Editó categoría":"Creó categoría");await loadCategories()}else{let cid=f.get("categoriaID"),cat=cats.find(x=>x.id===cid),raw=f.get("imagen")||"";let d={nombre:String(f.get("nombre")).trim(),categoriaID:cid,categoriaNombre:cat?.nombre||"",precioMenudeo:Number(f.get("precioMenudeo")),precioMayoreo:Number(f.get("precioMayoreo")||0),costo:Number(f.get("costo")||0),precioOferta:Number(f.get("precioOferta")||0),textoPromocion:String(f.get("textoPromocion")||"").trim(),stock:Number(f.get("stock")||0),stockMinimo:Number(f.get("stockMinimo")||0),sku:String(f.get("sku")||""),descripcion:String(f.get("descripcion")||""),urlOriginalDrive:raw,imagen:drive(raw),activo:f.has("activo"),oferta:f.has("oferta"),promocion:f.has("promocion"),destacado:f.has("destacado"),nuevo:f.has("nuevo"),updatedAt:serverTimestamp()};editing?await updateDoc(doc(db,"productos",editing.id),d):await addDoc(collection(db,"productos"),{...d,createdAt:serverTimestamp(),numeroVistas:0,numeroVentas:0,numeroPedidos:0});await log(editing?"Editó producto":"Creó producto");await loadProducts()}closeM()}catch(x){alert("No se pudo guardar. Revisa permisos de Firestore.")}};
if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js");
async function loadOrdersLegacy(){try{let s=await getDocs(collection(db,"pedidos"));let rows=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));document.querySelector("#ordersTable").innerHTML=rows.map(o=>`<tr><td>${o.folio||""}</td><td>${o.clienteNombre||""}</td><td>${o.telefono||""}</td><td>$${Number(o.total||0).toFixed(2)}</td><td><span class="badge">${o.estado||"nuevo"}</span></td></tr>`).join("")||'<tr><td colspan="5">Sin pedidos.</td></tr>'}catch(e){document.querySelector("#ordersTable").innerHTML='<tr><td colspan="5">No fue posible consultar pedidos.</td></tr>'}}
/* v0.6 handler below */

let crmClients=[];
const stageLabel=s=>({cliente_potencial:"Potencial",cliente_nuevo:"Nuevo",cliente_recurrente:"Recurrente",cliente_inactivo:"Inactivo",liquidado:"Liquidado"})[s]||s||"Potencial";
async function loadClients(){
 try{
  let s=await getDocs(collection(db,"clientes")); crmClients=s.docs.map(d=>({id:d.id,...d.data()}));
  // Consolidate legacy/public duplicate prospects by normalized phone for display.
  const byPhone=new Map();
  for(const c of crmClients){let key=(c.telefonoNormalizado||String(c.telefono||"").replace(/\D/g,"")||c.id);let old=byPhone.get(key);if(!old)byPhone.set(key,{...c,_ids:[c.id]});else{old.numeroPedidos=Number(old.numeroPedidos||0)+Number(c.numeroPedidos||0);old.numeroCompras=Number(old.numeroCompras||0)+Number(c.numeroCompras||0);old.totalComprado=Number(old.totalComprado||0)+Number(c.totalComprado||0);old.totalPendiente=Number(old.totalPendiente||0)+Number(c.totalPendiente||0);old._ids.push(c.id);if((c.updatedAt?.seconds||c.createdAt?.seconds||0)>(old.updatedAt?.seconds||old.createdAt?.seconds||0)){old.nombre=c.nombre||old.nombre;old.correo=c.correo||old.correo;}}}
  crmClients=[...byPhone.values()];
  renderClients();
 }catch(e){$("#clientsTable").innerHTML='<tr><td colspan="7">No fue posible consultar clientes.</td></tr>'}
}
function renderClients(){
 let q=($("#clientSearch").value||"").toLowerCase(),st=$("#clientStage").value;
 let arr=crmClients.filter(c=>(!q||(c.nombre||"").toLowerCase().includes(q)||(c.telefono||"").includes(q))&&(!st||c.etapaCRM===st));
 $("#crmTotal").textContent=crmClients.length;$("#crmPotential").textContent=crmClients.filter(c=>(c.etapaCRM||"cliente_potencial")==="cliente_potencial").length;$("#crmNew").textContent=crmClients.filter(c=>c.etapaCRM==="cliente_nuevo").length;$("#crmRecurring").textContent=crmClients.filter(c=>c.etapaCRM==="cliente_recurrente").length;
 $("#clientsTable").innerHTML=arr.map(c=>`<tr><td><div class="client-name">${c.nombre||""}</div><div class="client-sub">${c.correo||""}</div></td><td>${c.telefono||""}</td><td><span class="stage">${stageLabel(c.etapaCRM)}</span></td><td>${c.numeroPedidos||0}</td><td>$${Number(c.totalComprado||0).toFixed(2)}</td><td>$${Number(c.totalPendiente||0).toFixed(2)}</td><td><button class="smallbtn viewClient" data-id="${c.id}">Ver ficha</button></td></tr>`).join("")||'<tr><td colspan="7">Sin clientes.</td></tr>';
 $$(".viewClient").forEach(b=>b.onclick=()=>openClient(b.dataset.id));
}
async function openClient(id){
 let c=crmClients.find(x=>x.id===id); if(!c)return;
 let orders=[];try{let s=await getDocs(collection(db,"pedidos"));orders=s.docs.map(d=>({id:d.id,...d.data()})).filter(o=>(o.telefono||"").replace(/\D/g,"")===(c.telefono||"").replace(/\D/g,"")).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0))}catch(e){}
 $("#clientDetail").innerHTML=`<div class="client-profile"><div class="profile-box"><h3>${c.nombre||""}</h3><p><strong>Teléfono:</strong> ${c.telefono||""}</p><p><strong>Correo:</strong> ${c.correo||"—"}</p><label>Etapa CRM<select id="detailStage"><option value="cliente_potencial">Potencial</option><option value="cliente_nuevo">Nuevo</option><option value="cliente_recurrente">Recurrente</option><option value="cliente_inactivo">Inactivo</option><option value="liquidado">Liquidado</option></select></label><label>Notas<textarea id="clientNotes" class="notes-area">${c.notas||""}</textarea></label><button id="saveClientCRM" class="btn btn-primary fit">Guardar ficha</button></div><div class="profile-box"><h3>Historial de pedidos</h3><ul class="history-list">${orders.map(o=>`<li><strong>${o.folio||""}</strong><br><small>${o.estado||"nuevo"} · $${Number(o.total||0).toFixed(2)}</small></li>`).join("")||"<li>Sin pedidos.</li>"}</ul></div></div>`;
 $("#detailStage").value=c.etapaCRM||"cliente_potencial";$("#clientModal").classList.add("open");
 $("#saveClientCRM").onclick=async()=>{try{await updateDoc(doc(db,"clientes",c.id),{etapaCRM:$("#detailStage").value,notas:$("#clientNotes").value,updatedAt:serverTimestamp()});await log("Actualizó ficha CRM de cliente");$("#clientModal").classList.remove("open");await loadClients()}catch(e){alert("No se pudo actualizar la ficha.")}};
}
$("#refreshClients").onclick=loadClients;$("#clientSearch").oninput=renderClients;$("#clientStage").onchange=renderClients;$("#closeClient").onclick=()=>$("#clientModal").classList.remove("open");

let adminOrders=[],sales=[];
const mx=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(n||0));
function saleFolio(){return `VTA-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`}
async function loadOrders(){
 try{
  let s=await getDocs(collection(db,"pedidos"));adminOrders=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  $("#ordersTable").innerHTML=adminOrders.map(o=>`<tr><td>${o.folio||""}</td><td>${o.clienteNombre||""}</td><td>${o.telefono||""}</td><td>${mx(o.total)}</td><td><span class="badge">${o.estado||"nuevo"}</span></td><td>${o.estado==="nuevo"?`<button class="smallbtn convertSale" data-id="${o.id}">Convertir en venta</button>`:"—"}</td></tr>`).join("")||'<tr><td colspan="6">Sin pedidos.</td></tr>';
  $$(".convertSale").forEach(b=>b.onclick=()=>openSale(b.dataset.id));
 }catch(e){$("#ordersTable").innerHTML='<tr><td colspan="6">No fue posible consultar pedidos.</td></tr>'}
}
function openSale(id){
 let o=adminOrders.find(x=>x.id===id);if(!o)return;
 $("#saleDetail").innerHTML=`<div class="sale-summary"><strong>${o.folio}</strong><br>${o.clienteNombre}<br>Total: ${mx(o.total)}</div><div class="sale-options"><label>Tipo de venta<select id="saleType"><option value="contado">Contado</option><option value="credito">Crédito</option></select></label><label>Pago inicial<input id="initialPayment" type="number" min="0" max="${Number(o.total||0)}" step=".01" value="${Number(o.total||0)}"></label></div><p class="muted">En contado el pago debe cubrir el total. En crédito puedes registrar un anticipo o dejarlo en $0.</p><button id="confirmSale" class="btn btn-primary fit">Confirmar venta</button><div id="saleMsg" class="msg"></div>`;
 $("#saleModal").classList.add("open");
 $("#saleType").onchange=()=>{$("#initialPayment").value=$("#saleType").value==="contado"?Number(o.total||0):0};
 $("#confirmSale").onclick=()=>createSale(o);
}
async function createSale(o){
 let type=$("#saleType").value,payment=Number($("#initialPayment").value||0),total=Number(o.total||0),m=$("#saleMsg");
 if(payment<0||payment>total){m.textContent="El pago inicial no es válido.";return}
 if(type==="contado"&&Math.abs(payment-total)>0.001){m.textContent="Una venta de contado debe quedar totalmente pagada.";return}
 let folio=saleFolio(),saldo=Math.max(0,total-payment),estado=saldo===0?"liquidada":payment>0?"abono_parcial":"pendiente";
 try{
  // Resolver cliente de forma privada: solo un usuario autenticado consulta clientes.
  let phone=String(o.telefono||"").replace(/\D/g,""),clienteID=o.clienteID||null,clientRef=null,clientData=null;
  if(clienteID){clientRef=doc(db,"clientes",clienteID);let cs=await getDoc(clientRef);if(cs.exists())clientData=cs.data()}
  if(!clientData&&phone){
    let qs=await getDocs(query(collection(db,"clientes"),where("telefonoNormalizado","==",phone),limit(1)));
    if(!qs.empty){clienteID=qs.docs[0].id;clientRef=doc(db,"clientes",clienteID);clientData=qs.docs[0].data()}
  }
  if(!clientData){
    clienteID="tel_"+phone;clientRef=doc(db,"clientes",clienteID);
    await setDoc(clientRef,{nombre:o.clienteNombre||"",telefono:o.telefono||"",telefonoNormalizado:phone,correo:o.correo||"",estadoCliente:"potencial",etapaCRM:"cliente_potencial",numeroPedidos:1,numeroCompras:0,totalComprado:0,totalPendiente:0,activo:true,createdAt:serverTimestamp()});
    clientData=(await getDoc(clientRef)).data();
  }
  const saleRef=doc(collection(db,"ventas")),payRef=payment>0?doc(collection(db,"abonos")):null,orderRef=doc(db,"pedidos",o.id);
  await runTransaction(db,async tx=>{
    const freshOrder=await tx.get(orderRef);if(!freshOrder.exists())throw new Error("Pedido inexistente");
    if(freshOrder.data().estado!=="nuevo")throw new Error("Este pedido ya fue procesado");
    const freshClient=await tx.get(clientRef);let cd=freshClient.data()||{},compras=Number(cd.numeroCompras||0)+1;
    let stockOps=[];
    for(const item of (o.productos||[])){let pr=doc(db,"productos",item.productoID),snap=await tx.get(pr);if(!snap.exists())throw new Error("Producto no encontrado: "+item.nombre);let pd=snap.data(),before=Number(pd.stock||0),qty=Number(item.cantidad||0),after=before-qty;if(after<0)throw new Error("Stock insuficiente para "+item.nombre);stockOps.push({ref:pr,pd,before,after,qty,item,moveRef:doc(collection(db,"movimientosInventario"))})}
    tx.set(saleRef,{folio,pedidoID:o.id,pedidoFolio:o.folio||"",clienteID,clienteNombre:o.clienteNombre||"",telefono:o.telefono||"",productos:o.productos||[],tipo:type,total,totalPagado:payment,saldo,estado,createdAt:serverTimestamp(),usuarioCreacion:auth.currentUser.uid});
    if(payRef)tx.set(payRef,{ventaID:saleRef.id,ventaFolio:folio,clienteID,clienteNombre:o.clienteNombre||"",monto:payment,metodo:"no_especificado",observaciones:"Pago inicial al convertir pedido",createdAt:serverTimestamp(),usuario:auth.currentUser.uid});
    tx.update(orderRef,{estado:"confirmado",clienteID,ventaID:saleRef.id,ventaFolio:folio,updatedAt:serverTimestamp()});
    tx.update(clientRef,{numeroCompras:compras,totalComprado:Number(cd.totalComprado||0)+total,totalPendiente:Number(cd.totalPendiente||0)+saldo,estadoCliente:"cliente",etapaCRM:compras>1?"cliente_recurrente":"cliente_nuevo",ultimaCompra:serverTimestamp(),updatedAt:serverTimestamp()});
    for(const op of stockOps){tx.update(op.ref,{stock:op.after,updatedAt:serverTimestamp()});tx.set(op.moveRef,{productoID:op.item.productoID,productoNombre:op.item.nombre||op.pd.nombre||"",tipo:"venta",cambio:-op.qty,cantidad:op.qty,stockAnterior:op.before,stockNuevo:op.after,motivo:"Salida automática por venta",referencia:folio,ventaID:saleRef.id,origen:"venta",usuario:auth.currentUser.uid,usuarioEmail:auth.currentUser.email,createdAt:serverTimestamp()})}
  });
  await log(`Convirtió pedido ${o.folio} en venta ${folio}`);
  $("#saleModal").classList.remove("open");await refreshAllData(true);
 }catch(e){console.error(e);m.textContent=e.message==="Este pedido ya fue procesado"?"Este pedido ya fue convertido anteriormente.":"No se pudo crear la venta de forma segura."}
}
async function loadSales(){
 try{let s=await getDocs(collection(db,"ventas"));sales=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));renderSales()}catch(e){$("#salesTable").innerHTML='<tr><td colspan="7">No fue posible consultar ventas.</td></tr>'}
}
function renderSales(){
 let q=($("#salesSearch").value||"").toLowerCase(),t=$("#salesType").value,arr=sales.filter(v=>(!q||(v.folio||"").toLowerCase().includes(q)||(v.clienteNombre||"").toLowerCase().includes(q))&&(!t||v.tipo===t));
 let total=sales.reduce((s,v)=>s+Number(v.total||0),0),paid=sales.reduce((s,v)=>s+Number(v.totalPagado||0),0),pending=sales.reduce((s,v)=>s+Number(v.saldo||0),0);
 $("#salesTotal").textContent=mx(total);$("#salesPaid").textContent=mx(paid);$("#salesPending").textContent=mx(pending);$("#salesCount").textContent=sales.length;
 $("#salesTable").innerHTML=arr.map(v=>`<tr><td>${v.folio||""}</td><td>${v.clienteNombre||""}</td><td>${v.tipo||""}</td><td>${mx(v.total)}</td><td>${mx(v.totalPagado)}</td><td>${mx(v.saldo)}</td><td><span class="badge">${v.estado||""}</span></td></tr>`).join("")||'<tr><td colspan="7">Sin ventas.</td></tr>';
}
$("#refreshOrders").onclick=loadOrders;$("#refreshSales").onclick=loadSales;$("#salesSearch").oninput=renderSales;$("#salesType").onchange=renderSales;$("#closeSale").onclick=()=>$("#saleModal").classList.remove("open");

let collectionSales=[],allPayments=[],activeCollectionSale=null;
async function loadCollections(){try{let vs=await getDocs(collection(db,"ventas")),ps=await getDocs(collection(db,"abonos"));collectionSales=vs.docs.map(d=>({id:d.id,...d.data()})).filter(v=>v.tipo==="credito");allPayments=ps.docs.map(d=>({id:d.id,...d.data()}));renderCollections()}catch(e){$("#collectionsTable").innerHTML='<tr><td colspan="7">No fue posible consultar cobranza.</td></tr>'}}
function renderCollections(){let q=($("#collectionSearch").value||"").toLowerCase(),st=$("#collectionStatus").value,arr=collectionSales.filter(v=>(!q||(v.folio||"").toLowerCase().includes(q)||(v.clienteNombre||"").toLowerCase().includes(q))&&(!st||v.estado===st));$("#collectionPending").textContent=mx(collectionSales.reduce((s,v)=>s+Number(v.saldo||0),0));$("#collectionActive").textContent=collectionSales.filter(v=>Number(v.saldo||0)>0).length;$("#collectionPaid").textContent=collectionSales.filter(v=>Number(v.saldo||0)===0).length;$("#paymentCount").textContent=allPayments.length;$("#collectionsTable").innerHTML=arr.map(v=>`<tr><td>${v.folio}</td><td>${v.clienteNombre}</td><td>${mx(v.total)}</td><td>${mx(v.totalPagado)}</td><td><strong>${mx(v.saldo)}</strong></td><td><span class="badge">${v.estado}</span></td><td>${Number(v.saldo)>0?`<button class="smallbtn addPayment" data-id="${v.id}">Abonar</button>`:'<span class="paid-state">Liquidada</span>'} <button class="smallbtn histPay" data-id="${v.id}">Historial</button> <button class="smallbtn waPay" data-id="${v.id}">WhatsApp</button></td></tr>`).join("")||'<tr><td colspan="7">Sin créditos.</td></tr>';$$(".addPayment").forEach(b=>b.onclick=()=>openPayment(b.dataset.id));$$(".histPay").forEach(b=>b.onclick=()=>historyPayment(b.dataset.id));$$(".waPay").forEach(b=>b.onclick=()=>sendBalance(collectionSales.find(v=>v.id===b.dataset.id)))}
function openPayment(id){let v=collectionSales.find(x=>x.id===id);activeCollectionSale=v;$("#paymentDetail").innerHTML=`<div class="finance-summary"><div><small>Total</small><strong>${mx(v.total)}</strong></div><div><small>Abonado</small><strong>${mx(v.totalPagado)}</strong></div><div><small>Saldo</small><strong>${mx(v.saldo)}</strong></div></div><div class="payment-grid"><label>Monto<input id="paymentAmount" type="number" min=".01" max="${v.saldo}" step=".01"></label><label>Método<select id="paymentMethod"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option><option value="otro">Otro</option></select></label><label style="grid-column:1/-1">Observaciones<textarea id="paymentNotes"></textarea></label></div><button id="savePayment" class="btn btn-primary fit" style="margin-top:15px">Registrar abono</button><div id="paymentMsg" class="msg"></div>`;$("#paymentModal").classList.add("open");$("#savePayment").onclick=savePayment}
async function savePayment(){
 let v=activeCollectionSale,amount=Number($("#paymentAmount").value||0),m=$("#paymentMsg");
 if(!v||amount<=0||amount>Number(v.saldo||0)){m.textContent="El abono debe ser mayor a $0 y no superar el saldo.";return}
 try{
  const saleRef=doc(db,"ventas",v.id),payRef=doc(collection(db,"abonos"));
  await runTransaction(db,async tx=>{
    const saleSnap=await tx.get(saleRef);if(!saleSnap.exists())throw new Error("Venta inexistente");
    const fresh=saleSnap.data(),currentBalance=Number(fresh.saldo||0);
    if(amount>currentBalance)throw new Error("El saldo cambió. Actualiza e intenta nuevamente.");
    let newPaid=Number(fresh.totalPagado||0)+amount,newBalance=Math.max(0,Number(fresh.total||0)-newPaid),state=newBalance===0?"liquidada":"abono_parcial";
    let clientRef=fresh.clienteID?doc(db,"clientes",fresh.clienteID):null,clientSnap=clientRef?await tx.get(clientRef):null;
    tx.set(payRef,{ventaID:v.id,ventaFolio:fresh.folio,clienteID:fresh.clienteID||"",clienteNombre:fresh.clienteNombre||"",monto:amount,metodo:$("#paymentMethod").value,observaciones:$("#paymentNotes").value||"",createdAt:serverTimestamp(),usuario:auth.currentUser.uid});
    tx.update(saleRef,{totalPagado:newPaid,saldo:newBalance,estado:state,ultimoAbono:serverTimestamp(),updatedAt:serverTimestamp()});
    if(clientRef&&clientSnap.exists())tx.update(clientRef,{totalPendiente:Math.max(0,Number(clientSnap.data().totalPendiente||0)-amount),updatedAt:serverTimestamp()});
  });
  await log(`Registró abono de ${mx(amount)} en ${v.folio}`);$("#paymentModal").classList.remove("open");await refreshAllData(true);
  let fresh=collectionSales.find(x=>x.id===v.id)||v;sendBalance(fresh,amount);
 }catch(e){console.error(e);m.textContent=e.message||"No fue posible registrar el abono."}
}
function historyPayment(id){let v=collectionSales.find(x=>x.id===id),p=allPayments.filter(x=>x.ventaID===id);$("#paymentHistory").innerHTML=`<h3>${v.folio} · ${v.clienteNombre}</h3><ul class="history-list">${p.map(x=>`<li><strong>${mx(x.monto)}</strong> · ${x.metodo}<br><small>${x.observaciones||"Sin observaciones"}</small></li>`).join("")||"<li>Sin abonos.</li>"}</ul>`;$("#historyModal").classList.add("open")}
function sendBalance(v,last=null){if(!v)return;let text=Number(v.saldo||0)===0?`Hola, ${v.clienteNombre}. Te confirmamos que tu cuenta ${v.folio} ha quedado completamente liquidada.\n\nMuchas gracias por tu confianza y por tu compra.`:`Hola, ${v.clienteNombre}.${last?` Muchas gracias por tu abono de ${mx(last)}.`:""}\n\nTu saldo actualizado de la cuenta ${v.folio} es ${mx(v.saldo)}.\n\n¡Muchas gracias por tu pago y por tu confianza!`;window.open(`https://wa.me/${String(v.telefono||"").replace(/\D/g,"")}?text=${encodeURIComponent(text)}`,"_blank")}
$("#refreshCollections").onclick=loadCollections;$("#collectionSearch").oninput=renderCollections;$("#collectionStatus").onchange=renderCollections;$("#closePayment").onclick=()=>$("#paymentModal").classList.remove("open");$("#closeHistory").onclick=()=>$("#historyModal").classList.remove("open");

let reportRows=[],reportHeaders=[];
function tsDate(v){if(!v)return null;if(v.toDate)return v.toDate();if(v.seconds)return new Date(v.seconds*1000);return new Date(v)}
function sameDay(a,b){return a&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
async function loadDashboardReal(){
 try{
  let [vs,ps,cs,prs,os]=await Promise.all([getDocs(collection(db,"ventas")),getDocs(collection(db,"pedidos")),getDocs(collection(db,"clientes")),getDocs(collection(db,"productos")),getDocs(collection(db,"abonos"))]);
  let v=vs.docs.map(d=>d.data()),p=ps.docs.map(d=>d.data()),cl=cs.docs,pr=prs.docs,ab=os.docs.map(d=>d.data()),now=new Date();
  let today=v.filter(x=>sameDay(tsDate(x.createdAt),now)).reduce((s,x)=>s+Number(x.total||0),0);
  let month=v.filter(x=>{let d=tsDate(x.createdAt);return d&&d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()}).reduce((s,x)=>s+Number(x.total||0),0);
  $("#dashToday").textContent=mx(today);$("#dashMonth").textContent=mx(month);$("#dashPending").textContent=mx(v.reduce((s,x)=>s+Number(x.saldo||0),0));$("#dashClients").textContent=cl.size;$("#dashOrders").textContent=p.filter(x=>x.estado==="nuevo").length;$("#dashProducts").textContent=pr.size;$("#dashCollected").textContent=mx(ab.reduce((s,x)=>s+Number(x.monto||0),0));$("#dashSales").textContent=v.length;
  let days=[];for(let i=6;i>=0;i--){let d=new Date();d.setDate(d.getDate()-i);let total=v.filter(x=>sameDay(tsDate(x.createdAt),d)).reduce((s,x)=>s+Number(x.total||0),0);days.push({d,total})}let max=Math.max(...days.map(x=>x.total),1);$("#salesBars").innerHTML=days.map(x=>`<div class="bar-wrap"><div class="bar" title="${mx(x.total)}" style="height:${Math.max(3,(x.total/max)*150)}px"></div><small>${x.d.toLocaleDateString("es-MX",{weekday:"short"})}<br>${mx(x.total)}</small></div>`).join("");
 }catch(e){console.warn("Dashboard",e)}
}
function inRange(x){let d=tsDate(x.createdAt||x.fechaRegistro||x.updatedAt);let f=$("#reportFrom").value?new Date($("#reportFrom").value+"T00:00:00"):null,t=$("#reportTo").value?new Date($("#reportTo").value+"T23:59:59"):null;return (!f||!d||d>=f)&&(!t||!d||d<=t)}
async function generateReport(){
 let type=$("#reportType").value,s=await getDocs(collection(db,type)),data=s.docs.map(d=>({id:d.id,...d.data()})).filter(inRange);reportRows=[];reportHeaders=[];
 if(type==="ventas"){reportHeaders=["Folio","Cliente","Tipo","Total","Pagado","Saldo","Estado"];reportRows=data.map(x=>[x.folio,x.clienteNombre,x.tipo,x.total,x.totalPagado,x.saldo,x.estado])}
 if(type==="abonos"){reportHeaders=["Venta","Cliente","Monto","Método","Observaciones"];reportRows=data.map(x=>[x.ventaFolio,x.clienteNombre,x.monto,x.metodo,x.observaciones])}
 if(type==="clientes"){reportHeaders=["Nombre","Teléfono","Correo","Etapa","Pedidos","Compras","Comprado","Pendiente"];reportRows=data.map(x=>[x.nombre,x.telefono,x.correo,x.etapaCRM,x.numeroPedidos,x.numeroCompras,x.totalComprado,x.totalPendiente])}
 if(type==="pedidos"){reportHeaders=["Folio","Cliente","Teléfono","Total","Estado","Canal"];reportRows=data.map(x=>[x.folio,x.clienteNombre,x.telefono,x.total,x.estado,x.canal])}
 if(type==="productos"){reportHeaders=["Producto","Categoría","Menudeo","Mayoreo","Costo","Stock","Activo"];reportRows=data.map(x=>[x.nombre,x.categoriaNombre,x.precioMenudeo,x.precioMayoreo,x.costo,x.stock,x.activo?"Sí":"No"])}
 $("#reportSummary").innerHTML=`<div class="summary-pill"><strong>${data.length}</strong> registros</div>`+(["ventas","abonos"].includes(type)?`<div class="summary-pill">Importe: <strong>${mx(data.reduce((s,x)=>s+Number(type==="ventas"?x.total:x.monto||0),0))}</strong></div>`:"");
 $("#reportTable").innerHTML=`<div class="print-head">${($("#businessLogo")?.value||"")?`<img src="${driveImage($("#businessLogo").value)}" style="max-width:140px;max-height:70px;object-fit:contain">`:""}<h1>${businessNameForReport()}</h1><p>Reporte de ${type} · ${new Date().toLocaleString("es-MX")}</p></div><table class="table"><thead><tr>${reportHeaders.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${reportRows.map(r=>`<tr>${r.map(x=>`<td>${x??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function businessNameForReport(){return $("#businessName")?.value||"AuraERP"}
function csvEscape(v){let s=String(v??"");return `"${s.replaceAll('"','""')}"`}
function exportCSV(){if(!reportRows.length)return alert("Primero genera un reporte.");let csv="\ufeff"+reportHeaders.map(csvEscape).join(",")+"\n"+reportRows.map(r=>r.map(csvEscape).join(",")).join("\n"),blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=`AuraERP-${$("#reportType").value}-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(u)}
async function loadAudit(){try{let s=await getDocs(collection(db,"bitacora")),rows=s.docs.map(d=>d.data()).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)),q=($("#logSearch").value||"").toLowerCase();rows=rows.filter(x=>!q||(x.action||"").toLowerCase().includes(q)||(x.email||"").toLowerCase().includes(q));$("#auditTable").innerHTML=rows.map(x=>`<tr><td>${tsDate(x.createdAt)?.toLocaleString("es-MX")||"—"}</td><td>${x.action||""}</td><td>${x.email||""}</td></tr>`).join("")||'<tr><td colspan="3">Sin movimientos.</td></tr>'}catch(e){$("#auditTable").innerHTML='<tr><td colspan="3">No fue posible consultar la bitácora.</td></tr>'}}
$("#refreshDashboard").onclick=loadDashboardReal;$("#runReport").onclick=generateReport;$("#reportCSV").onclick=exportCSV;$("#reportPrint").onclick=()=>{if(!reportRows.length)return alert("Primero genera un reporte.");window.print()};$("#refreshLog").onclick=loadAudit;$("#logSearch").oninput=loadAudit;
setTimeout(loadDashboardReal,1200);

let systemUsers=[],backupHistory=[];
async function loadUsers(){
 try{let s=await getDocs(collection(db,"usuarios"));systemUsers=s.docs.map(d=>({id:d.id,...d.data()}));renderUsers()}catch(e){$("#usersTable").innerHTML='<tr><td colspan="5">No fue posible consultar usuarios.</td></tr>'}
}
function renderUsers(){let q=($("#userSearch").value||"").toLowerCase(),r=$("#userRoleFilter").value,arr=systemUsers.filter(u=>(!q||(u.nombre||"").toLowerCase().includes(q)||(u.correo||"").toLowerCase().includes(q))&&(!r||u.rol===r));$("#usersTable").innerHTML=arr.map(u=>`<tr><td>${u.nombre||"—"}</td><td>${u.correo||"—"}</td><td><span class="role-pill">${u.rol||"consulta"}</span></td><td>${u.activo!==false?"Activo":"Desactivado"}</td><td><button class="smallbtn editUser" data-id="${u.id}">Editar</button></td></tr>`).join("")||'<tr><td colspan="5">Sin usuarios.</td></tr>';$$(".editUser").forEach(b=>b.onclick=()=>openUser(b.dataset.id))}
function openUser(id){let u=systemUsers.find(x=>x.id===id);if(!u)return;$("#userDetail").innerHTML=`<div class="field"><label>Nombre</label><input id="editUserName" value="${u.nombre||""}"></div><div class="field"><label>Rol</label><select id="editUserRole"><option value="admin">Administrador</option><option value="supervisor">Supervisor</option><option value="vendedor">Vendedor</option><option value="cobrador">Cobrador</option><option value="consulta">Consulta</option></select></div><div class="field"><label>Estado</label><select id="editUserActive"><option value="true">Activo</option><option value="false">Desactivado</option></select></div><button id="saveUser" class="btn btn-primary fit">Guardar usuario</button>`;$("#editUserRole").value=u.rol||"consulta";$("#editUserActive").value=String(u.activo!==false);$("#userModal").classList.add("open");$("#saveUser").onclick=async()=>{try{await updateDoc(doc(db,"usuarios",id),{nombre:$("#editUserName").value.trim(),rol:$("#editUserRole").value,activo:$("#editUserActive").value==="true",updatedAt:serverTimestamp()});await log(`Actualizó usuario ${u.correo||id}`);$("#userModal").classList.remove("open");await loadUsers()}catch(e){alert("No se pudo actualizar el usuario.")}}}
$("#refreshUsers").onclick=loadUsers;$("#userSearch").oninput=renderUsers;$("#userRoleFilter").onchange=renderUsers;$("#closeUser").onclick=()=>$("#userModal").classList.remove("open");

const backupCollections=["configuracion","usuarios","productos","categorias","clientes","pedidos","ventas","abonos","bitacora","movimientosInventario","tareasCRM"];
function plain(v){if(v===null||v===undefined)return v;if(Array.isArray(v))return v.map(plain);if(typeof v==="object"){if(v.toDate)return v.toDate().toISOString();let o={};for(let k in v)o[k]=plain(v[k]);return o}return v}
async function makeBackup(){
 let btn=$("#makeBackup"),msg=$("#backupMsg");btn.disabled=true;btn.textContent="Generando...";msg.textContent="";
 try{let payload={meta:{app:"AuraERP",version:"0.9.0",createdAt:new Date().toISOString(),createdBy:auth.currentUser.email},data:{}},count=0;
 for(let name of backupCollections){let s=await getDocs(collection(db,name));payload.data[name]=s.docs.map(d=>({id:d.id,...plain(d.data())}));count+=s.size}
 let blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=`AuraERP-respaldo-${new Date().toISOString().replaceAll(":","-").slice(0,19)}.json`;link.click();URL.revokeObjectURL(url);
 await addDoc(collection(db,"respaldos"),{createdAt:serverTimestamp(),usuario:auth.currentUser.email,uid:auth.currentUser.uid,registros:count,tipo:"manual",version:"0.9.0"});await log(`Generó respaldo de ${count} registros`);msg.style.color="var(--ok)";msg.textContent="Respaldo generado correctamente.";await loadBackups()
 }catch(e){console.error(e);msg.textContent="No fue posible generar el respaldo."}finally{btn.disabled=false;btn.textContent="Generar respaldo ahora"}
}
async function loadBackups(){try{let s=await getDocs(collection(db,"respaldos"));backupHistory=s.docs.map(d=>d.data()).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));$("#backupTable").innerHTML=backupHistory.map(x=>`<tr><td>${tsDate(x.createdAt)?.toLocaleString("es-MX")||"—"}</td><td>${x.usuario||""}</td><td>${x.registros||0}</td><td>${x.tipo||""}</td></tr>`).join("")||'<tr><td colspan="4">Sin respaldos.</td></tr>';let last=backupHistory[0];$("#lastBackup").textContent=last?tsDate(last.createdAt)?.toLocaleString("es-MX"):"Sin registro";calcNextBackup(last)}catch(e){}}
function calcNextBackup(last){let freq=localStorage.getItem("aura-backup-frequency")||"manual";$("#backupFrequency").value=freq;if(freq==="manual"||!last){$("#nextBackup").textContent=freq==="manual"?"Manual":"Pendiente";return}let d=tsDate(last.createdAt)||new Date(),days={diario:1,semanal:7,quincenal:15,mensual:30}[freq];d=new Date(d);d.setDate(d.getDate()+days);$("#nextBackup").textContent=d.toLocaleDateString("es-MX")}
$("#makeBackup").onclick=makeBackup;$("#saveBackupConfig").onclick=()=>{localStorage.setItem("aura-backup-frequency",$("#backupFrequency").value);calcNextBackup(backupHistory[0]);$("#backupMsg").style.color="var(--ok)";$("#backupMsg").textContent="Preferencia guardada."};

async function loadNotifications(){
 try{let [vs,ps,prs]=await Promise.all([getDocs(collection(db,"ventas")),getDocs(collection(db,"pedidos")),getDocs(collection(db,"productos"))]);let v=vs.docs.map(d=>d.data()),p=ps.docs.map(d=>d.data()),pr=prs.docs.map(d=>d.data()),notices=[];
 let debt=v.filter(x=>Number(x.saldo||0)>0);if(debt.length)notices.push({c:"warn",i:"💳",t:`${debt.length} crédito(s) con saldo`,s:`Total pendiente ${mx(debt.reduce((a,x)=>a+Number(x.saldo||0),0))}`});
 let orders=p.filter(x=>x.estado==="nuevo");if(orders.length)notices.push({c:"warn",i:"🛍️",t:`${orders.length} pedido(s) nuevo(s)`,s:"Revisa el módulo Pedidos."});
 let low=pr.filter(x=>x.activo!==false&&Number(x.stock||0)<=Number(x.stockMinimo||0));if(low.length)notices.push({c:"danger",i:"📦",t:`${low.length} producto(s) con stock bajo`,s:"Revisa existencias."});
 if(!notices.length)notices.push({c:"ok",i:"✓",t:"Sin alertas críticas",s:"La operación se encuentra al día."});
 $("#notificationsList").innerHTML=notices.map(n=>`<div class="notice ${n.c}"><div class="notice-icon">${n.i}</div><div><strong>${n.t}</strong><small>${n.s}</small></div></div>`).join("")
 }catch(e){$("#notificationsList").innerHTML='<div class="notice danger">No fue posible generar notificaciones.</div>'}
}
$("#refreshNotifications").onclick=loadNotifications;
setTimeout(()=>{loadUsers();loadBackups();loadNotifications()},1500);

// v1.0 RC1: recuperación defensiva de datos maestros.
window.addEventListener("load",()=>setTimeout(async()=>{
 if(auth.currentUser){
  try{await loadCategories()}catch(e){console.error(e)}
  try{await loadProducts()}catch(e){console.error(e)}
 }
},1800));

const rp=document.querySelector("#reloadProducts");if(rp)rp.onclick=async()=>{await loadCategories();await loadProducts()};

async function refreshAllData(silent=false){
 const btn=$("#globalRefresh"),status=$("#syncStatus");
 if(btn)btn.classList.add("spinning");if(status){status.textContent="Sincronizando...";status.className="sync-status syncing"}
 const jobs=[
  ["categorías",()=>loadCategories()],
  ["productos",()=>loadProducts()],["inventario",()=>loadInventory()],["documentos",()=>loadDocumentCenter()],["inteligencia",()=>loadIntelligence()],
  ["pedidos",()=>loadOrders()],
  ["clientes",()=>loadCRMAdvanced()],
  ["ventas",()=>loadSales()],
  ["cobranza",()=>loadCollections()],
  ["dashboard",()=>loadDashboardReal()],
  ["usuarios",()=>loadUsers()],
  ["respaldos",()=>loadBackups()],
  ["notificaciones",()=>loadNotifications()],
  ["bitácora",()=>loadAudit()]
 ];
 let errors=[];
 for(const [name,fn] of jobs){try{await fn()}catch(e){console.error("Refresh "+name,e);errors.push(name)}}
 if(btn)btn.classList.remove("spinning");
 if(status){status.textContent=errors.length?`Error: ${errors.join(", ")}`:"Sincronizado";status.className="sync-status "+(errors.length?"error":"ok")}
 if(!silent&&!errors.length){setTimeout(()=>{if(status){status.textContent="Sincronizado";status.className="sync-status ok"}},1500)}
}
const globalRefresh=$("#globalRefresh");if(globalRefresh)globalRefresh.onclick=()=>refreshAllData(false);
// Actualización automática al recuperar foco/conectividad y cada 60 segundos.
window.addEventListener("focus",()=>{if(auth.currentUser)refreshAllData(true)});
window.addEventListener("online",()=>{if(auth.currentUser)refreshAllData(true)});
setInterval(()=>{if(auth.currentUser&&!document.hidden)refreshAllData(true)},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&auth.currentUser)refreshAllData(true)});
setTimeout(()=>{if(auth.currentUser)refreshAllData(true)},2500);

async function loadCompanyConfig(){
 try{let s=await getDoc(doc(db,"configuracion","empresa"));if(!s.exists())return;let d=s.data();if($("#businessName"))$("#businessName").value=d.nombre||"";if($("#whatsapp"))$("#whatsapp").value=d.whatsapp||"";if($("#businessLogo"))$("#businessLogo").value=d.logo||"";if($("#currency"))$("#currency").value=d.moneda||"MXN";if($("#cfgFacebook"))$("#cfgFacebook").value=d.facebook||"";if($("#cfgInstagram"))$("#cfgInstagram").value=d.instagram||"";updateLogoPreview()}catch(e){}
}
function driveImage(v){if(!v)return"";let m=v.match(/\/d\/([^/]+)/)||v.match(/[?&]id=([^&]+)/);return m?`https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`:v}
function updateLogoPreview(){let p=$("#businessLogoPreview"),v=$("#businessLogo")?.value||"";if(p){p.src=driveImage(v);p.style.display=v?"block":"none"}}
const blogo=$("#businessLogo");if(blogo)blogo.oninput=updateLogoPreview;
setTimeout(loadCompanyConfig,1000);

let inventoryProducts=[],inventoryMoves=[];
function invState(p){let s=Number(p.stock||0),m=Number(p.stockMinimo||0);return s<=0?"out":s<=m?"low":"ok"}
function invStateHTML(p){let st=invState(p),label={ok:"Disponible",low:"Stock bajo",out:"Agotado"}[st];return `<span class="stock-state stock-${st}"><span class="stock-dot"></span>${label}</span>`}
async function loadInventory(){
 try{
  let [ps,ms]=await Promise.all([getDocs(collection(db,"productos")),getDocs(collection(db,"movimientosInventario"))]);
  inventoryProducts=ps.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.activo!==false);
  inventoryMoves=ms.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  renderInventory();renderInventoryMoves();
 }catch(e){console.error("Inventario",e);$("#inventoryTable").innerHTML='<tr><td colspan="6">No fue posible cargar inventario. Publica las reglas v1.2.0.</td></tr>'}
}
function renderInventory(){
 let q=($("#inventorySearch").value||"").toLowerCase(),st=$("#inventoryStatus").value,arr=inventoryProducts.filter(p=>(!q||(p.nombre||"").toLowerCase().includes(q)||(p.sku||"").toLowerCase().includes(q))&&(!st||invState(p)===st));
 $("#invProducts").textContent=inventoryProducts.length;$("#invUnits").textContent=inventoryProducts.reduce((s,p)=>s+Number(p.stock||0),0);$("#invLow").textContent=inventoryProducts.filter(p=>invState(p)==="low").length;$("#invOut").textContent=inventoryProducts.filter(p=>invState(p)==="out").length;
 $("#inventoryTable").innerHTML=arr.map(p=>`<tr><td>${p.nombre||""}</td><td>${p.sku||"—"}</td><td><strong>${Number(p.stock||0)}</strong></td><td>${Number(p.stockMinimo||0)}</td><td>${invStateHTML(p)}</td><td><button class="smallbtn quickMove" data-id="${p.id}">Movimiento</button> <button class="smallbtn viewKardex" data-id="${p.id}">Kardex</button></td></tr>`).join("")||'<tr><td colspan="6">Sin productos.</td></tr>';
 $$(".quickMove").forEach(b=>b.onclick=()=>openInventoryMovement(b.dataset.id));$$(".viewKardex").forEach(b=>b.onclick=()=>openKardex(b.dataset.id));
}
function renderInventoryMoves(){let rows=inventoryMoves.slice(0,100);$("#inventoryMovesTable").innerHTML=rows.map(x=>`<tr><td>${tsDate(x.createdAt)?.toLocaleString("es-MX")||"—"}</td><td>${x.productoNombre||""}</td><td>${x.tipo||""}</td><td class="${Number(x.cambio||0)>=0?"movement-positive":"movement-negative"}">${Number(x.cambio||0)>0?"+":""}${x.cambio||0}</td><td>${x.stockAnterior??""}</td><td>${x.stockNuevo??""}</td><td>${x.referencia||x.motivo||"—"}</td></tr>`).join("")||'<tr><td colspan="7">Sin movimientos.</td></tr>'}
function openInventoryMovement(id=""){
 let opts=inventoryProducts.map(p=>`<option value="${p.id}" ${p.id===id?"selected":""}>${p.nombre} · Stock ${Number(p.stock||0)}</option>`).join("");
 $("#inventoryDetail").innerHTML=`<div class="inventory-form"><label>Producto<select id="invProduct"><option value="">Selecciona</option>${opts}</select></label><label>Tipo<select id="invType"><option value="entrada">Entrada</option><option value="salida">Salida</option><option value="ajuste_positivo">Ajuste +</option><option value="ajuste_negativo">Ajuste -</option></select></label><label>Cantidad<input id="invQty" type="number" min="1" step="1" value="1"></label><label>Referencia<input id="invReference" placeholder="Compra, devolución, folio..."></label><label style="grid-column:1/-1">Motivo / observaciones<textarea id="invReason" required placeholder="Describe el motivo del movimiento"></textarea></label></div><button id="saveInventoryMove" class="btn btn-primary fit" style="margin-top:15px">Registrar movimiento</button><div id="invMsg" class="msg"></div>`;
 $("#inventoryModal").classList.add("open");$("#saveInventoryMove").onclick=saveInventoryMovement;
}
async function saveInventoryMovement(){
 let pid=$("#invProduct").value,type=$("#invType").value,qty=Number($("#invQty").value||0),reason=$("#invReason").value.trim(),ref=$("#invReference").value.trim(),m=$("#invMsg");
 if(!pid||qty<=0||!reason){m.textContent="Selecciona producto, cantidad y escribe el motivo.";return}
 let delta=["entrada","ajuste_positivo"].includes(type)?qty:-qty,productRef=doc(db,"productos",pid),moveRef=doc(collection(db,"movimientosInventario"));
 try{
  await runTransaction(db,async tx=>{let snap=await tx.get(productRef);if(!snap.exists())throw new Error("Producto inexistente");let p=snap.data(),before=Number(p.stock||0),after=before+delta;if(after<0)throw new Error("No hay existencias suficientes");tx.update(productRef,{stock:after,updatedAt:serverTimestamp()});tx.set(moveRef,{productoID:pid,productoNombre:p.nombre||"",tipo,cambio:delta,cantidad:qty,stockAnterior:before,stockNuevo:after,motivo:reason,referencia:ref,origen:"manual",usuario:auth.currentUser.uid,usuarioEmail:auth.currentUser.email,createdAt:serverTimestamp()})});
  await log(`Inventario ${type}: ${delta>0?"+":""}${delta}`);$("#inventoryModal").classList.remove("open");await loadInventory();await loadProducts();await loadNotifications();
 }catch(e){m.textContent=e.message||"No se pudo registrar el movimiento."}
}
function openKardex(id){
 let p=inventoryProducts.find(x=>x.id===id),moves=inventoryMoves.filter(x=>x.productoID===id);
 $("#kardexDetail").innerHTML=`<h3>${p?.nombre||""}</h3><div class="kardex-head"><div><small>Stock actual</small><strong>${Number(p?.stock||0)}</strong></div><div><small>Stock mínimo</small><strong>${Number(p?.stockMinimo||0)}</strong></div><div><small>Estado</small>${invStateHTML(p||{})}</div></div><div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Cambio</th><th>Anterior</th><th>Nuevo</th><th>Referencia</th><th>Motivo</th></tr></thead><tbody>${moves.map(x=>`<tr><td>${tsDate(x.createdAt)?.toLocaleString("es-MX")||"—"}</td><td>${x.tipo}</td><td class="${Number(x.cambio)>=0?"movement-positive":"movement-negative"}">${Number(x.cambio)>0?"+":""}${x.cambio}</td><td>${x.stockAnterior}</td><td>${x.stockNuevo}</td><td>${x.referencia||"—"}</td><td>${x.motivo||"—"}</td></tr>`).join("")||'<tr><td colspan="7">Sin movimientos.</td></tr>'}</tbody></table></div>`;$("#kardexModal").classList.add("open");
}
$("#newInventoryMovement").onclick=()=>openInventoryMovement();$("#inventorySearch").oninput=renderInventory;$("#inventoryStatus").onchange=renderInventory;$("#closeInventory").onclick=()=>$("#inventoryModal").classList.remove("open");$("#closeKardex").onclick=()=>$("#kardexModal").classList.remove("open");
setTimeout(loadInventory,1600);

let docSales=[],docOrders=[],docClients=[],docProducts=[],docPayments=[],docInventory=[];
async function loadDocumentCenter(){
 try{
  let [vs,os,cs,ps,abs,ims]=await Promise.all([getDocs(collection(db,"ventas")),getDocs(collection(db,"pedidos")),getDocs(collection(db,"clientes")),getDocs(collection(db,"productos")),getDocs(collection(db,"abonos")),getDocs(collection(db,"movimientosInventario"))]);
  docSales=vs.docs.map(d=>({id:d.id,...d.data()}));docOrders=os.docs.map(d=>({id:d.id,...d.data()}));docClients=cs.docs.map(d=>({id:d.id,...d.data()}));docProducts=ps.docs.map(d=>({id:d.id,...d.data()}));docPayments=abs.docs.map(d=>({id:d.id,...d.data()}));docInventory=ims.docs.map(d=>({id:d.id,...d.data()}));
  $("#docSaleSelect").innerHTML='<option value="">Selecciona una venta</option>'+docSales.map(x=>`<option value="${x.id}">${x.folio||x.id} · ${x.clienteNombre||""}</option>`).join("");
  $("#docOrderSelect").innerHTML='<option value="">Selecciona un pedido</option>'+docOrders.map(x=>`<option value="${x.id}">${x.folio||x.id} · ${x.clienteNombre||""}</option>`).join("");
  $("#docClientSelect").innerHTML='<option value="">Selecciona un cliente</option>'+docClients.map(x=>`<option value="${x.id}">${x.nombre||x.telefono||x.id}</option>`).join("");
  $("#docProductSelect").innerHTML='<option value="">Selecciona un producto</option>'+docProducts.map(x=>`<option value="${x.id}">${x.nombre||x.id}</option>`).join("");
 }catch(e){console.error("Documentos",e)}
}
async function companyForDoc(){try{let s=await getDoc(doc(db,"configuracion","empresa"));return s.exists()?s.data():{}}catch(e){return{}}}
function escDoc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function docMoney(n){return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(n||0))}
function docDate(v){return tsDate(v)?.toLocaleString("es-MX")||"—"}
async function printProfessional(title,folio,body,meta=""){
 let c=await companyForDoc(),logo=c.logo?driveImage(c.logo):"",w=window.open("","_blank","width=1000,height=800");if(!w)return alert("Permite ventanas emergentes para generar el documento.");
 w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escDoc(title)} ${escDoc(folio)}</title><style>
 @page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#17243a;margin:0;font-size:12px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #173a61;padding-bottom:14px;margin-bottom:18px}.logo{max-width:150px;max-height:70px;object-fit:contain}.company{text-align:right}.company h1{margin:0;color:#173a61;font-size:22px}.doc-title{display:flex;justify-content:space-between;align-items:end;margin:18px 0}.doc-title h2{margin:0;font-size:20px}.folio{font-weight:bold;color:#b88908}.meta{background:#f4f6f9;padding:12px;border-radius:9px;margin-bottom:15px;line-height:1.6}table{width:100%;border-collapse:collapse;margin:12px 0 18px}th{background:#173a61;color:#fff;text-align:left;padding:9px}td{padding:9px;border-bottom:1px solid #dfe4eb}td.num,th.num{text-align:right}.totals{margin-left:auto;width:300px}.totals div{display:flex;justify-content:space-between;padding:6px 0}.totals .grand{font-size:16px;font-weight:bold;border-top:2px solid #173a61;padding-top:9px}.note{margin-top:28px;padding:12px;background:#fff8df;border-left:4px solid #d7aa25}.foot{margin-top:35px;border-top:1px solid #dfe4eb;padding-top:10px;color:#6c7788;text-align:center;font-size:10px}.actions{position:fixed;right:18px;bottom:18px}@media print{.actions{display:none}}</style></head><body>
 <div class="head"><div>${logo?`<img class="logo" src="${logo}">`:""}</div><div class="company"><h1>${escDoc(c.nombre||"AuraERP")}</h1>${c.whatsapp?`<div>WhatsApp: ${escDoc(c.whatsapp)}</div>`:""}</div></div>
 <div class="doc-title"><h2>${escDoc(title)}</h2><div class="folio">${escDoc(folio||"")}</div></div>${meta?`<div class="meta">${meta}</div>`:""}${body}
 <div class="foot">Documento generado por AuraERP · ${new Date().toLocaleString("es-MX")}</div><button class="actions" onclick="window.print()">Imprimir / Guardar PDF</button></body></html>`);w.document.close();
}
function itemsTable(items=[]){return `<table><thead><tr><th>Producto</th><th>Modalidad</th><th class="num">Cantidad</th><th class="num">P. Unitario</th><th class="num">Subtotal</th></tr></thead><tbody>${items.map(x=>`<tr><td>${escDoc(x.nombre)}</td><td>${escDoc(x.modalidad||"")}</td><td class="num">${Number(x.cantidad||0)}</td><td class="num">${docMoney(x.precioUnitario)}</td><td class="num">${docMoney(x.subtotal)}</td></tr>`).join("")}</tbody></table>`}
async function generateSaleDoc(){let v=docSales.find(x=>x.id===$("#docSaleSelect").value);if(!v)return alert("Selecciona una venta.");let body=itemsTable(v.productos)+`<div class="totals"><div><span>Total</span><strong>${docMoney(v.total)}</strong></div><div><span>Pagado</span><strong>${docMoney(v.totalPagado)}</strong></div><div class="grand"><span>Saldo</span><strong>${docMoney(v.saldo)}</strong></div></div><div class="note">Estado: <strong>${escDoc(v.estado)}</strong> · Tipo: ${escDoc(v.tipo)}</div>`;await printProfessional("Comprobante de venta",v.folio,body,`Cliente: <strong>${escDoc(v.clienteNombre)}</strong><br>Teléfono: ${escDoc(v.telefono)}<br>Fecha: ${docDate(v.createdAt)}`)}
async function generateOrderDoc(){let o=docOrders.find(x=>x.id===$("#docOrderSelect").value);if(!o)return alert("Selecciona un pedido.");let body=itemsTable(o.productos)+`<div class="totals"><div class="grand"><span>Total</span><strong>${docMoney(o.total)}</strong></div></div><div class="note">Estado del pedido: <strong>${escDoc(o.estado)}</strong></div>`;await printProfessional("Pedido",o.folio,body,`Cliente: <strong>${escDoc(o.clienteNombre)}</strong><br>Teléfono: ${escDoc(o.telefono)}<br>Correo: ${escDoc(o.correo||"—")}<br>Fecha: ${docDate(o.createdAt)}`)}
async function generateClientDoc(){let c=docClients.find(x=>x.id===$("#docClientSelect").value);if(!c)return alert("Selecciona un cliente.");let sales=docSales.filter(v=>v.clienteID===c.id),pays=docPayments.filter(x=>x.clienteID===c.id);let rows=[...sales.map(v=>({date:v.createdAt,type:"Venta "+v.folio,amount:v.total,balance:v.saldo})),...pays.map(p=>({date:p.createdAt,type:"Abono "+(p.ventaFolio||""),amount:-Number(p.monto||0),balance:""}))].sort((a,b)=>(tsDate(a.date)||0)-(tsDate(b.date)||0));let body=`<div class="totals"><div><span>Total comprado</span><strong>${docMoney(c.totalComprado)}</strong></div><div class="grand"><span>Saldo pendiente</span><strong>${docMoney(c.totalPendiente)}</strong></div></div><table><thead><tr><th>Fecha</th><th>Movimiento</th><th class="num">Importe</th><th class="num">Saldo venta</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${docDate(x.date)}</td><td>${escDoc(x.type)}</td><td class="num">${docMoney(x.amount)}</td><td class="num">${x.balance===""?"—":docMoney(x.balance)}</td></tr>`).join("")||'<tr><td colspan="4">Sin movimientos.</td></tr>'}</tbody></table>`;await printProfessional("Estado de cuenta","",body,`Cliente: <strong>${escDoc(c.nombre)}</strong><br>Teléfono: ${escDoc(c.telefono)}<br>Correo: ${escDoc(c.correo||"—")}<br>Etapa CRM: ${escDoc(c.etapaCRM||"—")}`)}
async function generateKardexDoc(){let p=docProducts.find(x=>x.id===$("#docProductSelect").value);if(!p)return alert("Selecciona un producto.");let moves=docInventory.filter(x=>x.productoID===p.id).sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));let body=`<div class="totals"><div><span>Stock mínimo</span><strong>${Number(p.stockMinimo||0)}</strong></div><div class="grand"><span>Stock actual</span><strong>${Number(p.stock||0)}</strong></div></div><table><thead><tr><th>Fecha</th><th>Tipo</th><th class="num">Cambio</th><th class="num">Anterior</th><th class="num">Nuevo</th><th>Referencia</th></tr></thead><tbody>${moves.map(x=>`<tr><td>${docDate(x.createdAt)}</td><td>${escDoc(x.tipo)}</td><td class="num">${Number(x.cambio)>0?"+":""}${x.cambio}</td><td class="num">${x.stockAnterior}</td><td class="num">${x.stockNuevo}</td><td>${escDoc(x.referencia||x.motivo||"—")}</td></tr>`).join("")||'<tr><td colspan="6">Sin movimientos.</td></tr>'}</tbody></table>`;await printProfessional("Kardex de inventario",p.sku||"",body,`Producto: <strong>${escDoc(p.nombre)}</strong><br>Categoría: ${escDoc(p.categoriaNombre||"—")}`)}
$("#docSaleBtn").onclick=generateSaleDoc;$("#docOrderBtn").onclick=generateOrderDoc;$("#docClientBtn").onclick=generateClientDoc;$("#docProductBtn").onclick=generateKardexDoc;
setTimeout(loadDocumentCenter,1900);

let crmTasks=[];
async function loadCRMAdvanced(){
 try{
  let [cs,ts]=await Promise.all([getDocs(collection(db,"clientes")),getDocs(collection(db,"tareasCRM"))]);
  crmClients=cs.docs.map(d=>({id:d.id,...d.data()}));crmTasks=ts.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(tsDate(a.fechaProgramada)||0)-(tsDate(b.fechaProgramada)||0));
  renderCRMAdvanced();renderCRMAgenda();
 }catch(e){console.error("CRM avanzado",e);$("#clientsTable").innerHTML='<tr><td colspan="6">No fue posible cargar CRM. Publica las reglas v1.4.0.</td></tr>'}
}
function nextTaskForClient(id){return crmTasks.filter(t=>t.clienteID===id&&t.estado!=="completada").sort((a,b)=>(tsDate(a.fechaProgramada)||0)-(tsDate(b.fechaProgramada)||0))[0]}
function daysSince(v){let d=tsDate(v);return d?Math.floor((Date.now()-d.getTime())/86400000):9999}
function requiresAttention(c){let t=nextTaskForClient(c.id),td=t?tsDate(t.fechaProgramada):null;return (td&&td<new Date())||daysSince(c.ultimaInteraccion||c.ultimaCompra||c.updatedAt||c.createdAt)>30}
function renderCRMAdvanced(){
 let q=($("#clientSearch").value||"").toLowerCase(),st=$("#clientStage").value,arr=crmClients.filter(c=>(!q||(c.nombre||"").toLowerCase().includes(q)||(c.telefono||"").includes(q)||(c.etiquetas||[]).join(" ").toLowerCase().includes(q))&&(!st||c.etapaCRM===st));
 let pending=crmTasks.filter(t=>t.estado!=="completada"),overdue=pending.filter(t=>{let d=tsDate(t.fechaProgramada);return d&&d<new Date()});
 $("#crmTotal").textContent=crmClients.length;$("#crmAttention").textContent=crmClients.filter(requiresAttention).length;$("#crmTasks").textContent=pending.length;$("#crmOverdue").textContent=overdue.length;
 $("#clientsTable").innerHTML=arr.map(c=>{let nt=nextTaskForClient(c.id);return `<tr><td><div class="client-name">${c.nombre||""}</div><div class="client-sub">${c.telefono||""}</div></td><td><span class="stage">${stageLabel(c.etapaCRM)}</span></td><td>${(c.etiquetas||[]).map(x=>`<span class="tag">${x}</span>`).join("")||"—"}</td><td>${nt?`${escDoc(nt.tipo||"Seguimiento")}<br><small>${tsDate(nt.fechaProgramada)?.toLocaleString("es-MX")||""}</small>`:(requiresAttention(c)?'<span class="attention">Requiere atención</span>':"—")}</td><td>${mx(c.totalComprado)}</td><td><button class="smallbtn crmProfile" data-id="${c.id}">Ficha</button> <button class="smallbtn crmFollow" data-id="${c.id}">Seguimiento</button></td></tr>`}).join("")||'<tr><td colspan="6">Sin clientes.</td></tr>';
 $$(".crmProfile").forEach(b=>b.onclick=()=>openClientAdvanced(b.dataset.id));$$(".crmFollow").forEach(b=>b.onclick=()=>openCRMTask(b.dataset.id));
}
function renderCRMAgenda(){
 let filter=$("#taskFilter").value,arr=crmTasks.filter(t=>filter==="todas"||t.estado===filter||(filter==="pendiente"&&t.estado!=="completada"));
 $("#crmAgenda").innerHTML=arr.map(t=>{let d=tsDate(t.fechaProgramada),over=t.estado!=="completada"&&d&&d<new Date(),today=d&&sameDay(d,new Date()),c=crmClients.find(x=>x.id===t.clienteID);return `<div class="crm-task ${over?"overdue":today?"today":""} ${t.estado==="completada"?"done":""}"><div class="crm-task-head"><strong>${t.tipo||"Seguimiento"}</strong><small>${d?.toLocaleString("es-MX")||"Sin fecha"}</small></div><div>${c?.nombre||t.clienteNombre||""}</div><small>${t.descripcion||""}</small><div class="crm-task-actions">${t.estado!=="completada"?`<button class="smallbtn completeTask" data-id="${t.id}">✓ Completar</button>`:""}<button class="smallbtn editTask" data-id="${t.id}">Editar</button></div></div>`}).join("")||'<p class="muted">Sin tareas.</p>';
 $$(".completeTask").forEach(b=>b.onclick=()=>completeCRMTask(b.dataset.id));$$(".editTask").forEach(b=>b.onclick=()=>editCRMTask(b.dataset.id));
}
function openCRMTask(clientId="",task=null){
 let opts=crmClients.map(c=>`<option value="${c.id}" ${(task?.clienteID||clientId)===c.id?"selected":""}>${c.nombre||c.telefono}</option>`).join(""),date=task?.fechaProgramada?new Date(tsDate(task.fechaProgramada).getTime()-tsDate(task.fechaProgramada).getTimezoneOffset()*60000).toISOString().slice(0,16):"";
 $("#crmTaskDetail").innerHTML=`<div class="task-form"><label>Cliente<select id="taskClient"><option value="">Selecciona</option>${opts}</select></label><label>Tipo<select id="taskType"><option value="llamada">Llamada</option><option value="whatsapp">WhatsApp</option><option value="correo">Correo</option><option value="visita">Visita</option><option value="cotizacion">Cotización</option><option value="seguimiento">Seguimiento</option></select></label><label>Fecha y hora<input id="taskDate" type="datetime-local" value="${date}"></label><label>Prioridad<select id="taskPriority"><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option></select></label><label style="grid-column:1/-1">Descripción<textarea id="taskDescription">${task?.descripcion||""}</textarea></label></div><button id="saveCRMTask" class="btn btn-primary fit" style="margin-top:15px">Guardar tarea</button><div id="taskMsg" class="msg"></div>`;
 if(task){$("#taskType").value=task.tipo||"seguimiento";$("#taskPriority").value=task.prioridad||"normal"}$("#crmTaskModal").classList.add("open");$("#saveCRMTask").onclick=()=>saveCRMTask(task?.id||null);
}
async function saveCRMTask(id){
 let cid=$("#taskClient").value,c=crmClients.find(x=>x.id===cid),date=$("#taskDate").value,m=$("#taskMsg");if(!cid||!date){m.textContent="Selecciona cliente y fecha.";return}
 let data={clienteID:cid,clienteNombre:c?.nombre||"",tipo:$("#taskType").value,fechaProgramada:new Date(date),prioridad:$("#taskPriority").value,descripcion:$("#taskDescription").value.trim(),estado:"pendiente",updatedAt:serverTimestamp(),usuario:auth.currentUser.uid};
 try{if(id)await updateDoc(doc(db,"tareasCRM",id),data);else await addDoc(collection(db,"tareasCRM"),{...data,createdAt:serverTimestamp()});if(cid)await updateDoc(doc(db,"clientes",cid),{proximaAccion:new Date(date),ultimaInteraccion:serverTimestamp(),updatedAt:serverTimestamp()});await log(id?"Editó tarea CRM":"Creó tarea CRM");$("#crmTaskModal").classList.remove("open");await loadCRMAdvanced()}catch(e){m.textContent="No fue posible guardar la tarea."}
}
async function completeCRMTask(id){let t=crmTasks.find(x=>x.id===id);try{await updateDoc(doc(db,"tareasCRM",id),{estado:"completada",completadaAt:serverTimestamp(),updatedAt:serverTimestamp()});if(t?.clienteID)await updateDoc(doc(db,"clientes",t.clienteID),{ultimaInteraccion:serverTimestamp(),updatedAt:serverTimestamp()});await log("Completó tarea CRM");await loadCRMAdvanced()}catch(e){alert("No fue posible completar la tarea.")}}
function editCRMTask(id){openCRMTask("",crmTasks.find(x=>x.id===id))}
async function openClientAdvanced(id){
 let c=crmClients.find(x=>x.id===id);if(!c)return;let orders=[];try{let s=await getDocs(collection(db,"pedidos"));orders=s.docs.map(d=>d.data()).filter(o=>o.clienteID===id||(o.telefono||"").replace(/\D/g,"")===(c.telefono||"").replace(/\D/g,""))}catch(e){}
 $("#clientDetail").innerHTML=`<div class="client-profile"><div class="profile-box"><h3>${c.nombre||""}</h3><p><strong>Teléfono:</strong> ${c.telefono||""}</p><p><strong>Correo:</strong> ${c.correo||"—"}</p><label>Etapa CRM<select id="detailStage"><option value="cliente_potencial">Potencial</option><option value="cliente_nuevo">Nuevo</option><option value="cliente_recurrente">Recurrente</option><option value="cliente_inactivo">Inactivo</option><option value="liquidado">Liquidado</option></select></label><label>Etiquetas<input id="clientTags" value="${(c.etiquetas||[]).join(", ")}" placeholder="VIP, mayoreo, frecuente..."></label><label>Notas<textarea id="clientNotes" class="notes-area">${c.notas||""}</textarea></label><button id="saveClientCRM" class="btn btn-primary fit">Guardar ficha</button> <button id="profileTask" class="btn fit">+ Seguimiento</button></div><div class="profile-box"><h3>Resumen comercial</h3><p>Total comprado: <strong>${mx(c.totalComprado)}</strong></p><p>Saldo pendiente: <strong>${mx(c.totalPendiente)}</strong></p><p>Pedidos: <strong>${c.numeroPedidos||0}</strong></p><h3>Pedidos recientes</h3><ul class="history-list">${orders.slice(0,8).map(o=>`<li>${o.folio||""} · ${mx(o.total)} · ${o.estado||""}</li>`).join("")||"<li>Sin pedidos.</li>"}</ul></div></div>`;
 $("#detailStage").value=c.etapaCRM||"cliente_potencial";$("#clientModal").classList.add("open");$("#profileTask").onclick=()=>{ $("#clientModal").classList.remove("open");openCRMTask(id)};
 $("#saveClientCRM").onclick=async()=>{try{await updateDoc(doc(db,"clientes",id),{etapaCRM:$("#detailStage").value,etiquetas:$("#clientTags").value.split(",").map(x=>x.trim()).filter(Boolean),notas:$("#clientNotes").value,updatedAt:serverTimestamp()});await log("Actualizó ficha CRM avanzada");$("#clientModal").classList.remove("open");await loadCRMAdvanced()}catch(e){alert("No se pudo actualizar.")}};
}
$("#newCRMTask").onclick=()=>openCRMTask();$("#clientSearch").oninput=renderCRMAdvanced;$("#clientStage").onchange=renderCRMAdvanced;$("#taskFilter").onchange=renderCRMAgenda;$("#closeCRMTask").onclick=()=>$("#crmTaskModal").classList.remove("open");
setTimeout(loadCRMAdvanced,1700);

let intelligenceData={sales:[],orders:[],products:[],clients:[],payments:[]};
function intelStart(days){if(days==="all")return null;let d=new Date();d.setDate(d.getDate()-Number(days));return d}
function afterDate(v,start){let d=tsDate(v);return !start||!d||d>=start}
async function loadIntelligence(){
 try{
  let [vs,os,ps,cs,abs]=await Promise.all([getDocs(collection(db,"ventas")),getDocs(collection(db,"pedidos")),getDocs(collection(db,"productos")),getDocs(collection(db,"clientes")),getDocs(collection(db,"abonos"))]);
  intelligenceData={sales:vs.docs.map(d=>({id:d.id,...d.data()})),orders:os.docs.map(d=>({id:d.id,...d.data()})),products:ps.docs.map(d=>({id:d.id,...d.data()})),clients:cs.docs.map(d=>({id:d.id,...d.data()})),payments:abs.docs.map(d=>({id:d.id,...d.data()}))};renderIntelligence();
 }catch(e){console.error("Inteligencia",e);$("#intelRecommendations").innerHTML='<div class="recommendation danger"><strong>No fue posible analizar los datos</strong><small>Revisa la conexión con Firebase.</small></div>'}
}
function renderIntelligence(){
 let days=$("#intelPeriod").value,start=intelStart(days),sales=intelligenceData.sales.filter(x=>afterDate(x.createdAt,start)),orders=intelligenceData.orders.filter(x=>afterDate(x.createdAt,start)),products=intelligenceData.products,clients=intelligenceData.clients;
 let revenue=sales.reduce((s,v)=>s+Number(v.total||0),0),ticket=sales.length?revenue/sales.length:0,confirmed=orders.filter(o=>o.estado==="confirmado").length,conversion=orders.length?confirmed/orders.length*100:0;
 let cost=0,units={};sales.forEach(v=>(v.productos||[]).forEach(i=>{units[i.productoID]=(units[i.productoID]||0)+Number(i.cantidad||0);let p=products.find(x=>x.id===i.productoID);cost+=Number(p?.costo||0)*Number(i.cantidad||0)}));let profit=revenue-cost,margin=revenue?profit/revenue*100:0;
 $("#intelRevenue").textContent=mx(revenue);$("#intelProfit").textContent=mx(profit);$("#intelMargin").textContent=`Margen estimado ${margin.toFixed(1)}%`;$("#intelTicket").textContent=mx(ticket);$("#intelConversion").textContent=`${conversion.toFixed(1)}%`;
 // Previous period comparison
 if(days!=="all"){let n=Number(days),prevEnd=new Date(start),prevStart=new Date(start);prevStart.setDate(prevStart.getDate()-n);let prev=intelligenceData.sales.filter(x=>{let d=tsDate(x.createdAt);return d&&d>=prevStart&&d<prevEnd}).reduce((s,v)=>s+Number(v.total||0),0),pct=prev?((revenue-prev)/prev*100):(revenue?100:0);$("#intelRevenueTrend").textContent=`${pct>=0?"↑":"↓"} ${Math.abs(pct).toFixed(1)}% vs periodo anterior`;$("#intelRevenueTrend").className="trend "+(pct>=0?"up":"down")}else $("#intelRevenueTrend").textContent="";
 let top=Object.entries(units).map(([id,qty])=>({p:products.find(x=>x.id===id),qty})).filter(x=>x.p).sort((a,b)=>b.qty-a.qty).slice(0,5);
 $("#intelTopProducts").innerHTML=rankHTML(top.map(x=>({name:x.p.nombre,sub:`${x.qty} unidad(es)`,value:mx(x.qty*Number(x.p.precioMenudeo||0))})));
 let viewed=[...products].sort((a,b)=>Number(b.numeroVistas||0)-Number(a.numeroVistas||0)).slice(0,5);$("#intelViewed").innerHTML=rankHTML(viewed.map(p=>({name:p.nombre,sub:`${p.numeroVistas||0} vistas`,value:p.destacado?"Destacado":""})));
 let best=[...clients].sort((a,b)=>Number(b.totalComprado||0)-Number(a.totalComprado||0)).slice(0,5);$("#intelClients").innerHTML=rankHTML(best.map(c=>({name:c.nombre||c.telefono,sub:`${c.numeroCompras||0} compra(s)`,value:mx(c.totalComprado)})));
 let active=products.filter(p=>p.activo!==false),out=active.filter(p=>Number(p.stock||0)<=0),low=active.filter(p=>Number(p.stock||0)>0&&Number(p.stock||0)<=Number(p.stockMinimo||0)),healthy=active.length-out.length-low.length;
 $("#intelInventory").innerHTML=`<div class="health-row"><span>🟢 Disponibles</span><strong>${healthy}</strong></div><div class="health-row"><span>🟡 Stock bajo</span><strong>${low.length}</strong></div><div class="health-row"><span>🔴 Agotados</span><strong>${out.length}</strong></div><div class="health-row"><span>Unidades totales</span><strong>${active.reduce((s,p)=>s+Number(p.stock||0),0)}</strong></div>`;
 renderRecommendations({sales,orders,products,clients,revenue,profit,margin,conversion,top,viewed,out,low});
 renderIntelChart(sales,days==="all"?30:Math.min(Number(days),30));
}
function rankHTML(rows){return `<ol class="rank-list">${rows.map((x,i)=>`<li><span class="rank">${i+1}</span><div class="rank-main"><strong>${x.name||"—"}</strong><small>${x.sub||""}</small></div><strong>${x.value||""}</strong></li>`).join("")||"<li>Sin información suficiente.</li>"}</ol>`}
function renderRecommendations(d){
 let rec=[];
 if(d.low.length)rec.push({c:"warn",t:"Reponer inventario",s:`${d.low.length} producto(s) están en stock bajo. Conviene programar reposición.`});
 if(d.out.length)rec.push({c:"danger",t:"Productos agotados",s:`${d.out.length} producto(s) activos tienen stock 0 y podrían perder ventas.`});
 let highViews=d.viewed.filter(p=>Number(p.numeroVistas||0)>=5&&!d.top.some(x=>x.p.id===p.id));if(highViews.length)rec.push({c:"info",t:"Mucho interés, pocas ventas",s:`${highViews[0].nombre} recibe visitas pero no está entre los más vendidos. Revisa precio, oferta o presentación.`});
 if(d.margin<20&&d.revenue>0)rec.push({c:"warn",t:"Margen reducido",s:`El margen estimado del periodo es ${d.margin.toFixed(1)}%. Revisa costos y precios.`});
 if(d.conversion<30&&d.orders.length>=3)rec.push({c:"info",t:"Conversión de pedidos",s:`Solo ${d.conversion.toFixed(1)}% de los pedidos se han convertido en venta. Revisa seguimiento comercial.`});
 let debt=d.clients.filter(c=>Number(c.totalPendiente||0)>0);if(debt.length)rec.push({c:"warn",t:"Cobranza pendiente",s:`${debt.length} cliente(s) mantienen saldo. Total: ${mx(debt.reduce((s,c)=>s+Number(c.totalPendiente||0),0))}.`});
 let inactive=d.clients.filter(c=>daysSince(c.ultimaInteraccion||c.ultimaCompra||c.createdAt)>60);if(inactive.length)rec.push({c:"info",t:"Reactivar clientes",s:`${inactive.length} cliente(s) llevan más de 60 días sin interacción. Puedes crear una campaña de seguimiento.`});
 if(!rec.length)rec.push({c:"good",t:"Operación saludable",s:"No detectamos alertas comerciales importantes con la información disponible."});
 $("#intelRecommendations").innerHTML=rec.map(x=>`<div class="recommendation ${x.c}"><strong>${x.t}</strong><small>${x.s}</small></div>`).join("");
}
function renderIntelChart(sales,days){let rows=[];for(let i=days-1;i>=0;i--){let d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);let total=sales.filter(v=>sameDay(tsDate(v.createdAt),d)).reduce((s,v)=>s+Number(v.total||0),0);rows.push({d,total})}let max=Math.max(...rows.map(x=>x.total),1);$("#intelSalesChart").innerHTML=rows.map(x=>`<div class="intel-col"><div class="intel-bar" title="${mx(x.total)}" style="height:${Math.max(3,x.total/max*175)}px"></div><small>${x.d.getDate()}/${x.d.getMonth()+1}</small></div>`).join("")}
$("#intelPeriod").onchange=renderIntelligence;
setTimeout(loadIntelligence,2100);
