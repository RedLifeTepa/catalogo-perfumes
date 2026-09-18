import {db,doc,getDoc} from "./firebase-config.js";
const $=s=>document.querySelector(s);
async function load(){
 let business={};try{let s=await getDoc(doc(db,"configuracion","empresa"));if(s.exists())business=s.data()}catch(e){}
 
 const logo=business.logo||business.logoUrl||business.logotipo||"";
 document.querySelectorAll("[data-company-logo]").forEach(img=>{
   if(logo){img.src=logo;img.classList.add("has-logo");img.style.display="block"}
   else{img.removeAttribute("src");img.classList.remove("has-logo");img.style.display="none"}
 });

 const name=(business.nombre??"").trim();document.querySelectorAll("[data-company]").forEach(x=>{x.textContent=name;x.style.display=name?"":"none"});
 document.querySelectorAll("[data-year]").forEach(x=>x.textContent=new Date().getFullYear());
 document.querySelectorAll("[data-date]").forEach(x=>x.textContent=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}));
 if($("#faqList")){$("#faqList").innerHTML=(business.preguntasFrecuentes||[]).map(x=>`<details><summary>${escapeHTML(x.pregunta)}</summary><div>${escapeHTML(x.respuesta).replace(/\n/g,"<br>")}</div></details>`).join("")||'<p>Aún no se han publicado preguntas frecuentes.</p>'}
}
function escapeHTML(v){return String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
load();