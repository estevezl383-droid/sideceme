/* Piloto exclusivo Morales. La validación definitiva reside en efm-campo. */
(()=>{
 'use strict';
 const owner=()=>{try{const s=getSession();return s?.tipo==='docente'&&s.user?.id==='P030'&&String(s.user.ci)==='4889191'&&!sessionStorage.getItem('sideceme_soporte');}catch{return false;}};
 let loading=false,open=false;
 const invoke=async body=>{
  if(!owner())throw new Error('PRUEBA EXCLUSIVA DE TCNL. MORALES');
  const {data,error}=await sb.functions.invoke('efm-campo',{body:{...body,token:getTokenSesion()}});
  if(error){let message='NO SE PUDO GUARDAR. REINTENTÁ CON LA MARCA CONSERVADA.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
  if(!data?.ok)throw new Error(data?.error||'SOLICITUD RECHAZADA');return data;
 };
 async function abrir(){
  if(loading||open||!owner())return;loading=true;
  try{
   if(!document.getElementById('efmc-style')){const s=document.createElement('link');s.id='efmc-style';s.rel='stylesheet';s.href='efm-campo/style.css?v=7';document.head.append(s);}
   const app=await import('./app.mjs?v=10');open=true;await app.abrir({invoke,owner:'P030',authorized:owner,onClose:()=>{open=false;}});
  }catch(e){alert(e.message);}finally{loading=false;}
 }
 function refresh(){
  document.querySelectorAll('[data-efmc-launch]').forEach(e=>{if(!owner())e.remove();});
  if(!owner())return;
  for(const id of ['screen-prof-panel','screen-disc-panel','screen-eval-panel','screen-ef-panel','screen-planif-panel','screen-jc-panel','screen-panel-generico']){
   const container=document.querySelector('#'+id+' .menu-container')||document.querySelector('#'+id+' .disc-container');
   if(!container||container.querySelector('[data-efmc-launch]'))continue;
   const b=document.createElement('button');b.className='btn-mega';b.dataset.efmcLaunch='1';b.style.cssText='background:linear-gradient(135deg,#164959,#18372e);margin:0 0 12px;border:1px solid #5dcdb5;color:white;width:100%';b.innerHTML='<span class="mega-icon">⏱</span><span>EVALUACIÓN FÍSICA DIGITAL<br><small>PRUEBA PERSONAL · TCNL. MORALES</small></span>';b.onclick=abrir;container.prepend(b);
  }
 }
 const observer=new MutationObserver(()=>{refresh();});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});setInterval(refresh,2000);refresh();
})();
