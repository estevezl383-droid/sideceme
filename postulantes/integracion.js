// Acceso visible desde los paneles habituales. La autorización efectiva es del servidor.
(()=>{
 'use strict';if(window.__postulantesIntegracion)return;window.__postulantesIntegracion=true;
 const ids=['P001','P002','P020','P030','P032'];
 const destino=new URL('postulantes/?personal=1',location.href);
 const allowed=()=>{try{const s=getSession();return s?.tipo==='docente'&&ids.includes(s.user?.id)&&!sessionStorage.getItem('sideceme_soporte');}catch{return false;}};
 function refresh(){
  const autorizado=allowed();
  document.querySelectorAll('[data-postulantes-menu]').forEach(e=>{if(!autorizado)e.remove();});
  if(!autorizado)return;
  if(new URLSearchParams(location.search).get('volver')==='postulantes'){location.replace(destino.href);return;}
  for(const id of ['screen-prof-panel','screen-disc-panel','screen-eval-panel','screen-ef-panel','screen-planif-panel','screen-jc-panel','screen-panel-generico']){
   const host=document.querySelector('#'+id+' .menu-container')||document.querySelector('#'+id+' .disc-container');
   if(!host||host.querySelector('[data-postulantes-menu]'))continue;
   const a=document.createElement('a');a.href=destino.href;a.dataset.postulantesMenu='1';a.className='btn-mega';
   a.style.cssText='display:block;text-decoration:none;width:100%;margin:0 0 14px;padding:20px;background:linear-gradient(135deg,#153f52,#1c5148);border:1px solid #c2a35d;border-radius:10px;color:white;text-align:left';
   a.innerHTML='<strong>POSTULANTES 2027</strong><br><small>RELACIÓN NOMINAL · FOTOGRAFÍAS · CI · CUENTAS Y EVALUACIONES</small>';host.prepend(a);
  }
 }
 refresh();setInterval(refresh,1500);
})();
