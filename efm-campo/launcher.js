/* La sesión, el modo de soporte y las designaciones se verifican en el servidor. */
(()=>{
 'use strict';
 const enSoporte=()=>!!sessionStorage.getItem('sideceme_soporte');
 const session=()=>{try{const s=getSession();return ['docente','cursante'].includes(s?.tipo)&&s.user?.id&&(s.tipo==='cursante'||!enSoporte())?s:null;}catch{return null;}};
 const key=()=>{const s=session();return s?[s.tipo,s.user.id,enSoporte()?'soporte':'personal'].join(':'):'';};
 let loading=false,open=false,checking=false,allowedKey='',checkedKey='',checkedAt=0,studentData=null,accessError='';
 const owner=()=>!!allowedKey&&key()===allowedKey;
 const invoke=async body=>{
  if(!owner())throw new Error('USÁ TU CUENTA PERSONAL O EL ACCESO DE CONSULTA HABILITADO');
  const {data,error}=await sb.functions.invoke('efm-campo',{body:{...body,token:getTokenSesion()}});
  if(error){let message='NO SE PUDO COMPLETAR LA CONSULTA. REINTENTÁ.';try{message=(await error.context.json()).error||message;}catch{}throw new Error(message);}
  if(!data?.ok)throw new Error(data?.error||'SOLICITUD RECHAZADA');return data;
 };
 async function abrir(evaluacionId=''){
  if(loading||open||!owner())return;loading=true;
  try{
   if(!document.getElementById('efmc-style')){const s=document.createElement('link');s.id='efmc-style';s.rel='stylesheet';s.href='efm-campo/style.css?v=13';document.head.append(s);}
   const tipo=session().tipo,app=tipo==='cursante'?await import('./alumno.mjs?v=15'):await import('./app.mjs?v=14');
   open=true;const account=allowedKey;await app.abrir({invoke,evaluacionId,owner:session().user.id,authorized:()=>owner()&&allowedKey===account,onClose:()=>{open=false;}});
  }catch(e){open=false;alert(e.message);}finally{loading=false;}
 }
 const style='background:linear-gradient(135deg,#164959,#18372e);margin:0 0 12px;border:1px solid #5dcdb5;color:white;width:100%;white-space:normal';
 function pendientes(plan){
  const latest=new Map();
  for(const r of studentData?.registros||[]){if(r.organizacion_id!==plan.id)continue;const prev=latest.get(r.prueba);if(!prev||Number(r.revision)>Number(prev.revision))latest.set(r.prueba,r);}
  return {total:latest.size,pendientes:[...latest.values()].filter(r=>!r.conformidad).length};
 }
 function carpetas(account){
  const container=document.querySelector('#cur-tab-inicio');if(!container)return;
  const plans=studentData?.organizaciones||[],signature=JSON.stringify([account,owner(),accessError,studentData?.solo_lectura,plans.map(p=>[p.id,p.nombre,p.fecha,pendientes(p)])]);
  let host=container.querySelector('[data-efmc-student-folders]');
  if(host?.dataset.signature===signature)return;
  if(!host){host=document.createElement('section');host.dataset.efmcStudentFolders='1';container.prepend(host);}
  host.dataset.signature=signature;host.dataset.account=account;host.replaceChildren();
  const title=document.createElement('h3');title.textContent='📁 EVALUACIÓN FÍSICA';host.append(title);
  for(const plan of plans.length?plans:[{id:'',nombre:'Evaluación física'}]){
   const b=document.createElement('button');b.className='btn-mega';b.dataset.efmcLaunch='1';b.dataset.evaluacion=plan.id;b.style.cssText=style;
   const content=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=plan.nombre;detail.style.cssText='display:block;line-height:1.7;font-size:12px';
   const status=pendientes(plan);detail.textContent=accessError||(!owner()?'CONSULTANDO TUS EVALUACIONES…':plan.id?[plan.fecha.split('-').reverse().join('/'),status.total?status.pendientes+' REGISTRO(S) PENDIENTE(S) DE CONFORMIDAD':'SIN REGISTROS TODAVÍA',studentData?.solo_lectura?'SOPORTE · SÓLO CONSULTA':'REVISAR MARCAS Y NOTAS'].join(' · '):'CONSULTAR MIS EVALUACIONES');
   content.append(name,detail);b.append(content);b.disabled=!owner()&&!accessError;
   b.onclick=()=>{if(owner())abrir(plan.id);else{checkedAt=0;refresh();}};host.append(b);
  }
 }
 async function refresh(){
  const s=session(),account=key();
  if(account!==checkedKey){allowedKey='';checkedAt=0;studentData=null;accessError='';}
  if(account&&!checking&&(!open||!owner())&&(Date.now()-checkedAt>(s.tipo==='cursante'?1800:30000)||account!==checkedKey)){
   checking=true;checkedKey=account;checkedAt=Date.now();
   try{
    const r=await sb.functions.invoke('efm-campo',{body:{accion:s.tipo==='cursante'?'mis_evaluaciones':'acceso',token:getTokenSesion()}});
    if(key()===account){allowedKey=!r.error&&r.data?.ok?account:'';studentData=allowedKey&&s.tipo==='cursante'?r.data:null;accessError='';if(!allowedKey){accessError=r.data?.error||'NO SE PUDO CONSULTAR LA EVALUACIÓN. TOCÁ PARA REINTENTAR.';try{accessError=(await r.error?.context?.json())?.error||accessError;}catch{}}}
   }catch{if(key()===account){allowedKey='';accessError='NO SE PUDO CONECTAR. TOCÁ PARA REINTENTAR.';}}finally{checking=false;}
  }
  document.querySelectorAll('[data-efmc-student-folders]').forEach(e=>{if(s?.tipo!=='cursante'||e.dataset.account!==account)e.remove();});
  if(s?.tipo==='cursante'){carpetas(account);return;}
  document.querySelectorAll('[data-efmc-launch]').forEach(e=>{if(!owner())e.remove();});if(!owner())return;
  for(const id of ['screen-prof-panel','screen-disc-panel','screen-eval-panel','screen-ef-panel','screen-planif-panel','screen-jc-panel','screen-panel-generico']){
   const container=document.querySelector('#'+id+' .menu-container')||document.querySelector('#'+id+' .disc-container');
   if(!container||container.querySelector('[data-efmc-launch]'))continue;
   const b=document.createElement('button');b.className='btn-mega';b.dataset.efmcLaunch='1';b.style.cssText=style;b.innerHTML='<span class="mega-icon">⏱</span><span>EVALUACIÓN FÍSICA DIGITAL<br><small>ORGANIZACIÓN Y PRUEBAS ASIGNADAS</small></span>';b.onclick=()=>abrir();container.prepend(b);
  }
 }
 const observer=new MutationObserver(refresh);observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});setInterval(refresh,2000);refresh();
})();
