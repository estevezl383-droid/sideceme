/* La sesión y las designaciones se verifican en efm-campo en cada solicitud. */
(()=>{
 'use strict';
 const session=()=>{try{const s=getSession();return s?.tipo==='docente'&&s.user?.id&&!sessionStorage.getItem('sideceme_soporte')?s:null;}catch{return null;}};
 let loading=false,open=false,checking=false,allowedId='',checkedId='',checkedAt=0;
 const owner=()=>session()?.user.id===allowedId&&!!allowedId;
 const invoke=async body=>{
  if(!owner())throw new Error('USÁ TU CUENTA PERSONAL HABILITADA');
  const {data,error}=await sb.functions.invoke('efm-campo',{body:{...body,token:getTokenSesion()}});
  if(error){let message='NO SE PUDO GUARDAR. REINTENTÁ CON LA MARCA CONSERVADA.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
  if(!data?.ok)throw new Error(data?.error||'SOLICITUD RECHAZADA');return data;
 };
 async function abrir(){
  if(loading||open||!owner())return;loading=true;
  try{
   if(!document.getElementById('efmc-style')){const s=document.createElement('link');s.id='efmc-style';s.rel='stylesheet';s.href='efm-campo/style.css?v=11';document.head.append(s);}
   const app=await import('./app.mjs?v=11');open=true;const id=allowedId;await app.abrir({invoke,owner:id,authorized:()=>owner()&&allowedId===id,onClose:()=>{open=false;}});
  }catch(e){alert(e.message);}finally{loading=false;}
 }
 async function refresh(){
  const s=session(),id=s?.user.id||'';
  if(id!==checkedId){allowedId='';checkedAt=0;}
  if(id&&!checking&&(Date.now()-checkedAt>30000||id!==checkedId)){
   checking=true;checkedId=id;checkedAt=Date.now();
   try{const r=await sb.functions.invoke('efm-campo',{body:{accion:'acceso',token:getTokenSesion()}});if(session()?.user.id===id)allowedId=!r.error&&r.data?.ok?id:'';}catch{allowedId='';}finally{checking=false;}
  }
  document.querySelectorAll('[data-efmc-launch]').forEach(e=>{if(!owner())e.remove();});if(!owner())return;
  for(const id of ['screen-prof-panel','screen-disc-panel','screen-eval-panel','screen-ef-panel','screen-planif-panel','screen-jc-panel','screen-panel-generico']){
   const container=document.querySelector('#'+id+' .menu-container')||document.querySelector('#'+id+' .disc-container');
   if(!container||container.querySelector('[data-efmc-launch]'))continue;
   const b=document.createElement('button');b.className='btn-mega';b.dataset.efmcLaunch='1';b.style.cssText='background:linear-gradient(135deg,#164959,#18372e);margin:0 0 12px;border:1px solid #5dcdb5;color:white;width:100%';b.innerHTML='<span class="mega-icon">⏱</span><span>EVALUACIÓN FÍSICA DIGITAL<br><small>ORGANIZACIÓN Y PRUEBAS ASIGNADAS</small></span>';b.onclick=abrir;container.prepend(b);
  }
 }
 const observer=new MutationObserver(refresh);observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});setInterval(refresh,2000);refresh();
})();
