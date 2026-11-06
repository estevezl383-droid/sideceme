const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function filtrarNomina(lista,q=''){
 const norm=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 const words=norm(q).trim().split(/\s+/).filter(Boolean);
 return lista.filter(p=>words.every(w=>norm(p.nombre_completo+' '+p.ci+' '+p.grado).includes(w)));
}
export function tablaNominal(rows,panel,matrix=false){
 const all=panel.postulantes;
 const head=matrix?'<th>Postulante / CI</th>'+panel.materias.map(m=>'<th title="'+esc(m.nombre)+'">'+esc(m.codigo)+'</th>').join(''):'<th>Grado y nombre completo</th><th>CI / Usuario</th><th>Identidad</th><th>Acceso</th>';
 const body=rows.map(p=>{
  const info=matrix?'<td><b>'+esc(p.grado)+' '+esc(p.nombre_completo)+'</b><small>CI '+esc(p.ci)+'</small></td>'+panel.materias.map(m=>{const e=(panel.resumen||[]).find(e=>e.postulante_id===p.id&&e.materia===m.codigo);return '<td>'+(e?(e.nota==null?esc(e.resultado):'<b>'+esc(e.nota)+'</b> / '+esc(e.escala))+'<small>'+(e.publicada?'Publicada':'Borrador')+'</small>':'<span class="muted">Pendiente</span>')+'</td>';}).join(''):`<td><b>${esc(p.grado)} ${esc(p.nombre_completo)}</b></td><td>${esc(p.ci)}</td><td><span class="pill ${p.identidad_verificada&&p.tiene_foto?'open':'pending'}">${p.identidad_verificada&&p.tiene_foto?'Verificada':'Por revisar'}</span></td><td>${p.habilitado?'Habilitado':'Sin acceso'}</td>`;
  return `<tr><td>${all.findIndex(x=>x.id===p.id)+1}</td><td><span class="nomina-avatar">${p.tiene_foto?`<span>Cargando foto…</span><img data-nomina-foto="${esc(p.id)}" alt="Fotografía de ${esc(p.nombre_completo)}" hidden>`:'<span>Sin foto</span>'}</span></td>${info}<td><button data-abrir="${esc(p.id)}">Ver expediente</button>${panel.actor==='P030'?`<button class="link" data-cuenta="${esc(p.id)}">Ver como postulante</button>`:''}</td></tr>`;
 }).join('');
 return {head:'<tr><th>Nº</th><th>Fotografía</th>'+head+'<th>Cuenta / expediente</th></tr>',body};
}
export function csvNominal(rows){
 const cell=v=>'"'+(/^[=+\-@\t\r]/.test(String(v))?"'":'')+String(v??'').replaceAll('"','""')+'"';
 const data=[['Nº','Grado','Nombre completo','CI','Identidad','Acceso'],...rows.map((p,i)=>[i+1,p.grado,p.nombre_completo,String(p.ci),p.identidad_verificada?'VERIFICADA':'POR REVISAR',p.habilitado?'HABILITADO':'SIN ACCESO'])];
 return '\ufeff'+data.map(row=>row.map(cell).join(';')).join('\r\n');
}
export class FotosNomina{
 constructor(api){this.api=api;this.cache=new Map();this.pending=[];this.active=0;}
 get(p){
  if(!p.tiene_foto)return Promise.resolve(null);
  if(!this.cache.has(p.id)){
   const promise=new Promise((resolve,reject)=>this.pending.push({p,resolve,reject}));this.cache.set(p.id,promise);this.pump();
  }
  return this.cache.get(p.id);
 }
 pump(){
  while(this.active<2&&this.pending.length){const job=this.pending.shift();this.active++;
   this.api('foto',{postulante_id:job.p.id}).then(r=>{if(r.id!==job.p.id)throw new Error('La fotografía no corresponde al expediente solicitado.');if(r.foto&&!/^data:image\/(jpeg|png);base64,/.test(r.foto))throw new Error('Formato de fotografía no válido.');job.resolve(r.foto);}).catch(e=>{this.cache.delete(job.p.id);job.reject(e);}).finally(()=>{this.active--;this.pump();});
  }
 }
}
export function observarFotos(host,rows,fotos){
 const load=async img=>{const p=rows.find(p=>p.id===img.dataset.nominaFoto);if(!p)return;try{const src=await fotos.get(p);if(!img.isConnected)return;if(src){img.onerror=()=>{img.hidden=true;img.previousElementSibling.hidden=false;img.previousElementSibling.textContent='Foto no legible';};img.src=src;img.hidden=false;img.previousElementSibling.hidden=true;}else img.previousElementSibling.textContent='Sin foto';}catch{if(img.isConnected)img.previousElementSibling.textContent='Foto sin cargar. Pulse Actualizar.';}};
 if(!globalThis.IntersectionObserver){host.querySelectorAll('[data-nomina-foto]').forEach(load);return null;}
 const observer=new IntersectionObserver(entries=>{entries.filter(e=>e.isIntersecting).forEach(e=>{observer.unobserve(e.target);load(e.target.querySelector('[data-nomina-foto]'));});},{rootMargin:'180px'});
 host.querySelectorAll('[data-nomina-foto]').forEach(img=>observer.observe(img.parentElement));return observer;
}
export async function imprimirNomina(rows,fotos){
 const images=await Promise.all(rows.map(p=>fotos.get(p)));
 const sheet=document.createElement('section');sheet.id='post-nomina-impresion';
 sheet.innerHTML='<h1>ECEME · GESTIÓN 2027</h1><h2>RELACIÓN NOMINAL DE POSTULANTES</h2><p>Consulta administrativa · '+new Date().toLocaleString('es-BO',{timeZone:'America/La_Paz'})+' · '+rows.length+' postulantes</p><table><thead><tr><th>Nº</th><th>Fotografía</th><th>Grado</th><th>Nombre completo</th><th>CI</th><th>Acceso</th></tr></thead><tbody>'+rows.map((p,i)=>'<tr><td>'+(i+1)+'</td><td>'+(images[i]?'<img src="'+esc(images[i])+'" alt="Fotografía">':'Sin foto')+'</td><td>'+esc(p.grado)+'</td><td>'+esc(p.nombre_completo)+'</td><td>'+esc(p.ci)+'</td><td>'+(p.habilitado?'Habilitado':'Sin acceso')+'</td></tr>').join('')+'</tbody></table>';
 document.querySelector('#post-nomina-impresion')?.remove();document.body.append(sheet);try{await Promise.all([...sheet.querySelectorAll('img')].map(i=>i.decode()));}catch(e){sheet.remove();throw e;}
 const cleanup=()=>sheet.remove();window.addEventListener('afterprint',cleanup,{once:true});window.print();setTimeout(cleanup,60000);
}
