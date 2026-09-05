import {db,doc,getDoc} from "./firebase-config.js";
const $=s=>document.querySelector(s);
async function load(){
 let business={};try{let s=await getDoc(doc(db,"configuracion","empresa"));if(s.exists())business=s.data()}catch(e){}
 const name=business.nombre||"AuraERP";document.querySelectorAll("[data-company]").forEach(x=>x.textContent=name);
 document.querySelectorAll("[data-year]").forEach(x=>x.textContent=new Date().getFullYear());
 document.querySelectorAll("[data-date]").forEach(x=>x.textContent=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}));
 if($("#faqList")){$("#faqList").innerHTML=(business.preguntasFrecuentes||[]).map(x=>`<details><summary>${escapeHTML(x.pregunta)}</summary><div>${escapeHTML(x.respuesta).replace(/\n/g,"<br>")}</div></details>`).join("")||'<p>Aún no se han publicado preguntas frecuentes.</p>'}
}
function escapeHTML(v){return String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
load();