
function publicDriveImage(url){
 if(!url)return "";
 const s=String(url).trim();
 let m=s.match(/\/file\/d\/([^/]+)/);
 if(!m)m=s.match(/[?&]id=([^&]+)/);
 if(m)return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000`;
 return s;
}
import {db,doc,getDoc} from "./firebase-config.js";
const $=s=>document.querySelector(s);
async function load(){
 let business={};try{let s=await getDoc(doc(db,"configuracion","empresa"));if(s.exists())business=s.data()}catch(e){}
 
 const logo=business.logo||business.logoUrl||business.logotipo||"";
 document.querySelectorAll("[data-company-logo]").forEach(img=>{
   if(logo){img.src=publicDriveImage(logo);img.classList.add("has-logo");img.style.display="block"}
   else{img.removeAttribute("src");img.classList.remove("has-logo");img.style.display="none"}
 });

 const name=String(business.nombre??"").trim();document.querySelectorAll("[data-company]").forEach(x=>{x.textContent=name;x.style.display=name?"":"none"});
 document.querySelectorAll("[data-year]").forEach(x=>x.textContent=new Date().getFullYear());
 document.querySelectorAll("[data-date]").forEach(x=>x.textContent=new Date().toLocaleDateString("es-MX",{day:"numeric",month:"long",year:"numeric"}));
 if($("#faqList")){$("#faqList").innerHTML=(business.preguntasFrecuentes||[]).map(x=>`<details><summary>${escapeHTML(x.pregunta)}</summary><div>${escapeHTML(x.respuesta).replace(/\n/g,"<br>")}</div></details>`).join("")||'<p>Aún no se han publicado preguntas frecuentes.</p>'}
}
function escapeHTML(v){return String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
load();
setTimeout(async()=>{try{let sn=await getDoc(doc(db,"configuracion","empresa")),d=sn.exists()?sn.data():{},web=Math.max(60,Number(d.logoWebSize||160)),mobile=Math.max(50,Number(d.logoMobileSize||110));document.querySelectorAll("[data-company-logo]").forEach(img=>{img.style.maxWidth=web+"px";img.style.width="auto";img.dataset.mobileWidth=mobile})}catch(e){}},250);

async function syncPublicHeaderLogos(){
 try{
  const sn=await getDoc(doc(db,"configuracion","empresa")),d=sn.exists()?sn.data():{},raw=publicDriveImage(d.logo||d.logoUrl||d.logotipo||""),web=Math.max(60,Number(d.logoWebSize||160)),mobile=Math.max(50,Number(d.logoMobileSize||110)),size=innerWidth<=700?mobile:web;
  document.querySelectorAll("[data-company-logo]").forEach(img=>{if(raw){img.style.display="none";img.onload=()=>{img.classList.add("has-logo");img.style.display="block";img.style.width=size+"px";img.style.maxWidth=size+"px";img.style.height="auto"};img.onerror=()=>{img.style.display="none";img.classList.remove("has-logo")};img.src=raw}else{img.style.display="none"}});
 }catch(e){console.warn("Public logo",e)}
}
setTimeout(syncPublicHeaderLogos,250);addEventListener("resize",syncPublicHeaderLogos);
