import {db,collection,getDocs} from "./firebase-config.js";

const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(n||0));
const dateOf=v=>v?.toDate?v.toDate():v?.seconds?new Date(v.seconds*1000):v?new Date(v):null;
let D={sales:[],orders:[],products:[],clients:[],payments:[],tasks:[],inventory:[]};

const Q=[
["💵","¿Cuánto vendí este mes?","ventas"],["🏆","¿Cuál es mi producto más vendido?","ventas"],["📈","¿Cuál tiene mayor utilidad?","ventas"],
["👀","¿Qué producto tiene muchas vistas pero pocas ventas?","productos"],["💳","¿Qué clientes me deben?","clientes"],["⭐","¿Quiénes son mis mejores clientes?","clientes"],
["📦","¿Qué productos debo reabastecer?","productos"],["⛔","¿Qué productos están agotados?","productos"],["💰","¿Cuánto dinero tengo por cobrar?","clientes"],
["🧾","¿Cuál es mi ticket promedio?","ventas"],["🕒","¿Qué clientes llevan mucho tiempo sin comprar?","clientes"],["🏷️","¿Qué promociones me convendría realizar?","oportunidades"],
["📊","¿Cómo se compara este mes contra el anterior?","ventas"],["🐢","¿Cuáles son mis productos con menor movimiento?","productos"],["⏰","¿Qué tareas CRM están vencidas?","crm"],
["🛍️","¿Qué pedidos siguen sin convertirse en venta?","pedidos"],["📈","¿Cuánto margen estoy obteniendo?","ventas"],["🎯","¿Qué debería revisar hoy?","oportunidades"],
["🔎","¿Dónde estoy perdiendo oportunidades?","oportunidades"],["📋","Dame un resumen ejecutivo de mi negocio.","direccion"]
];
const groups=[
["💰 Ventas y rentabilidad",[0,1,2,9,12,16]],["📦 Productos e inventario",[3,6,7,13]],
["👥 Clientes y cobranza",[4,5,8,10]],["🎯 Oportunidades y seguimiento",[11,14,15,17,18]],["📊 Dirección",[19]]
];

function monthSales(offset=0){let n=new Date(),m=n.getMonth()+offset,y=n.getFullYear();while(m<0){m+=12;y--}while(m>11){m-=12;y++}return D.sales.filter(v=>{let d=dateOf(v.createdAt);return d&&d.getMonth()===m&&d.getFullYear()===y})}
const revenue=s=>s.reduce((a,v)=>a+Number(v.total||0),0);
function units(sales=D.sales){let m={};sales.forEach(v=>(v.productos||[]).forEach(i=>m[i.productoID]=(m[i.productoID]||0)+Number(i.cantidad||0)));return m}
function profit(sales){let z=0;sales.forEach(v=>(v.productos||[]).forEach(i=>{let p=D.products.find(x=>x.id===i.productoID);z+=(Number(i.precioUnitario||0)-Number(p?.costo||0))*Number(i.cantidad||0)}));return z}
function days(v){let d=dateOf(v);return d?Math.floor((Date.now()-d.getTime())/86400000):9999}
function list(rows){return `<ul class="ai-answer-list">${rows.map(x=>`<li>${x}</li>`).join("")}</ul>`}

function answer(i){
 let now=monthSales(),prev=monthSales(-1),rev=revenue(now),u=units(),rank=Object.entries(u).sort((a,b)=>b[1]-a[1]),pft=profit(now);
 switch(i){
  case 0:return `Este mes llevas <strong>${money(rev)}</strong> en ${now.length} venta(s).`;
  case 1:{let x=rank[0],p=x&&D.products.find(z=>z.id===x[0]);return p?`<strong>${p.nombre}</strong> es el más vendido con ${x[1]} unidad(es).`:"Aún no hay ventas suficientes."}
  case 2:{let x=[...D.products].map(p=>({p,m:Number(p.precioMenudeo||0)-Number(p.costo||0)})).sort((a,b)=>b.m-a.m)[0];return x?`<strong>${x.p.nombre}</strong> tiene el mayor margen unitario estimado: ${money(x.m)}.`:"Faltan costos o precios."}
  case 3:{let sold=new Set(rank.slice(0,5).map(x=>x[0])),x=[...D.products].filter(p=>!sold.has(p.id)).sort((a,b)=>Number(b.numeroVistas||0)-Number(a.numeroVistas||0))[0];return x?`Revisa <strong>${x.nombre}</strong>: ${x.numeroVistas||0} vistas y no aparece entre los más vendidos.`:"No detecto un caso claro."}
  case 4:{let x=D.clients.filter(c=>Number(c.totalPendiente||0)>0).sort((a,b)=>Number(b.totalPendiente)-Number(a.totalPendiente));return x.length?`${x.length} cliente(s) tienen saldo.${list(x.slice(0,8).map(c=>`${c.nombre||c.telefono}: ${money(c.totalPendiente)}`))}`:"No hay saldos pendientes."}
  case 5:return list([...D.clients].sort((a,b)=>Number(b.totalComprado||0)-Number(a.totalComprado||0)).slice(0,5).map((c,j)=>`${j+1}. ${c.nombre||c.telefono}: ${money(c.totalComprado)}`));
  case 6:{let x=D.products.filter(p=>p.activo!==false&&Number(p.stock||0)<=Number(p.stockMinimo||0));return x.length?`Debes revisar ${x.length} producto(s).${list(x.map(p=>`${p.nombre}: stock ${p.stock||0}, mínimo ${p.stockMinimo||0}`))}`:"No hay productos bajo mínimo."}
  case 7:{let x=D.products.filter(p=>p.activo!==false&&Number(p.stock||0)<=0);return x.length?list(x.map(p=>p.nombre)):"No hay productos agotados."}
  case 8:return `Tienes <strong>${money(D.clients.reduce((s,c)=>s+Number(c.totalPendiente||0),0))}</strong> por cobrar.`;
  case 9:return now.length?`Ticket promedio del mes: <strong>${money(rev/now.length)}</strong>.`:"No hay ventas este mes.";
  case 10:{let x=D.clients.filter(c=>days(c.ultimaCompra||c.ultimaInteraccion||c.createdAt)>60);return x.length?`${x.length} cliente(s) llevan más de 60 días sin actividad.${list(x.slice(0,8).map(c=>c.nombre||c.telefono))}`:"No detecto clientes inactivos por más de 60 días."}
  case 11:{let x=[...D.products].filter(p=>p.activo!==false).sort((a,b)=>(u[a.id]||0)-(u[b.id]||0)).slice(0,3);return `Consideraría promociones para <strong>${x.map(p=>p.nombre).join(", ")||"productos con baja rotación"}</strong>, revisando antes margen y stock.`}
  case 12:{let pr=revenue(prev),pct=pr?((rev-pr)/pr*100):(rev?100:0);return `Mes actual: <strong>${money(rev)}</strong>. Anterior: <strong>${money(pr)}</strong>. Variación: <strong>${pct>=0?"+":""}${pct.toFixed(1)}%</strong>.`}
  case 13:{let x=[...D.products].filter(p=>p.activo!==false).sort((a,b)=>(u[a.id]||0)-(u[b.id]||0)).slice(0,5);return list(x.map(p=>`${p.nombre}: ${u[p.id]||0} unidad(es)`));}
  case 14:{let x=D.tasks.filter(t=>t.estado!=="completada"&&dateOf(t.fechaProgramada)&&dateOf(t.fechaProgramada)<new Date());return `${x.length} tarea(s) CRM vencida(s).${x.length?list(x.slice(0,8).map(t=>`${t.clienteNombre||"Cliente"} - ${t.tipo||"Seguimiento"}`)):""}`}
  case 15:{let x=D.orders.filter(o=>o.estado==="nuevo");return `Hay <strong>${x.length}</strong> pedido(s) nuevos pendientes de convertir.`}
  case 16:return rev?`Utilidad estimada: <strong>${money(pft)}</strong>. Margen aproximado: <strong>${(pft/rev*100).toFixed(1)}%</strong>.`:"No hay ventas del mes para calcular margen.";
  case 17:case 18:{let o=D.orders.filter(x=>x.estado==="nuevo").length,debt=D.clients.reduce((s,c)=>s+Number(c.totalPendiente||0),0),low=D.products.filter(p=>p.activo!==false&&Number(p.stock||0)<=Number(p.stockMinimo||0)).length,t=D.tasks.filter(x=>x.estado!=="completada"&&dateOf(x.fechaProgramada)&&dateOf(x.fechaProgramada)<new Date()).length;return list([`${o} pedido(s) por atender`,`${money(debt)} por cobrar`,`${low} producto(s) con stock bajo/agotado`,`${t} seguimiento(s) CRM vencido(s)`]);}
  case 19:{let top=rank[0],tp=top&&D.products.find(x=>x.id===top[0]);return list([`Ventas del mes: ${money(rev)} (${now.length} operaciones)`,`Utilidad estimada: ${money(pft)}`,`Por cobrar: ${money(D.clients.reduce((s,c)=>s+Number(c.totalPendiente||0),0))}`,`Clientes: ${D.clients.length}`,`Pedidos nuevos: ${D.orders.filter(o=>o.estado==="nuevo").length}`,`Producto líder: ${tp?tp.nombre+" ("+top[1]+" unidades)":"sin datos"}`]);}
 }
}

function renderButtons(){
 let el=$("#aiSimpleQuestions");if(!el)return;
 el.innerHTML=Q.map((q,i)=>`<button type="button" class="ai-simple-q" data-ai="${i}"><span>${q[0]}</span>${q[1]}</button>`).join("");
 el.querySelectorAll(".ai-simple-q").forEach(b=>b.addEventListener("click",()=>show(Number(b.dataset.ai),b)));
}
function show(i,b){
 document.querySelectorAll(".ai-simple-q").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 $("#aiSimpleTitle").textContent=Q[i][1];$("#aiSimpleAnswer").innerHTML=answer(i);
}
async function load(){
 renderButtons();let status=$("#aiSimpleStatus");status.textContent="Consultando datos de AuraERP...";
 let defs=[["sales","ventas"],["orders","pedidos"],["products","productos"],["clients","clientes"],["payments","abonos"],["tasks","tareasCRM"]];
 let res=await Promise.allSettled(defs.map(x=>getDocs(collection(db,x[1])))),bad=[];
 res.forEach((r,i)=>{let [k,c]=defs[i];if(r.status==="fulfilled")D[k]=r.value.docs.map(d=>({id:d.id,...d.data()}));else bad.push(c)});
 status.textContent=bad.length?`Carga parcial. Sin acceso a: ${bad.join(", ")}`:`Datos listos: ${D.products.length} productos · ${D.clients.length} clientes · ${D.sales.length} ventas · ${D.orders.length} pedidos`;
 status.className="ai-simple-status "+(bad.length?"warn":"ok");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load);else load();
