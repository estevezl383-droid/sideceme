const ENDPOINT='https://ofsyiylhdrdiqtnbaovo.supabase.co/functions/v1/efm-verificar';
const result=document.getElementById('resultado'),check=document.getElementById('comprobar'),file=document.getElementById('archivo'),status=document.getElementById('huella'),retry=document.getElementById('reintentar');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fecha=s=>s?String(s).slice(0,10).split('-').reverse().join('/'):'PENDIENTE';
const hora=s=>s?new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz',dateStyle:'short',timeStyle:'medium'}).format(new Date(s)):'PENDIENTE';
let expected='',checking=0;
async function consultar(){
 retry.disabled=true;expected='';checking++;check.hidden=true;file.value='';status.className='';status.textContent='Todavía no has seleccionado un archivo.';result.textContent='Consultando la emisión del documento…';
 try{
  const token=new URL(location.href).searchParams.get('t')||'';if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error('El código de verificación no es válido. Escanea el QR de tu hoja.');
  const response=await fetch(ENDPOINT+'?t='+encodeURIComponent(token),{cache:'no-store',referrerPolicy:'no-referrer'}),data=await response.json();
  if(!response.ok||data.ok!==true)throw Error(data.error||'No se pudo consultar la emisión.');
  const d=data.documento;if(!d||!/^[a-f0-9]{64}$/.test(data.sha256))throw Error('La respuesta de verificación está incompleta. Volvé a consultar.');
  const aviso=data.vigente===true?'Emisión registrada · coincide con los datos actuales.':data.vigente===false?'Emisión registrada · copia anterior. Los datos de la evaluación han cambiado. Solicita una hoja actualizada.':'Emisión registrada · no se pudo comprobar si los datos siguen vigentes. Volvé a consultar.';
  result.innerHTML=`<p class="aviso ${data.vigente===true?'':'anterior'}">${esc(aviso)}</p><p>Para verificar que el archivo recibido no fue modificado, utiliza «Comprobar el archivo PDF».</p><dl><dt>Alumno</dt><dd>${esc([d.grado,d.nombre].filter(Boolean).join(' '))}</dd><dt>Ciclo</dt><dd>${esc(d.ciclo)}</dd><dt>Evaluación</dt><dd>${esc(d.evaluacion)}</dd><dt>Fecha</dt><dd>${esc(fecha(d.fecha))}</dd><dt>Estado al emitir</dt><dd>${esc(d.estado)}</dd><dt>Nota final</dt><dd>${esc(d.final??'PENDIENTE')}</dd><dt>Emisión</dt><dd>${esc(hora(d.emitido_en))}</dd><dt>Código</dt><dd><code>${esc(d.codigo)}</code></dd></dl><table><thead><tr><th>Prueba</th><th>Nota</th><th>Conformidad al emitir</th></tr></thead><tbody>${d.pruebas.map(r=>`<tr><td>${esc(r.nombre)}</td><td>${esc(r.nota??'PENDIENTE')}</td><td>${r.confirmado_en?'Conforme · '+esc(hora(r.confirmado_en)):'Pendiente'}</td></tr>`).join('')}</tbody></table>`;
  expected=data.sha256;check.hidden=false;
 }catch(e){result.innerHTML=`<p class="aviso error">${esc(e.message||'No se pudo verificar el documento. Volvé a consultar.')}</p>`;}finally{retry.disabled=false;}
}
file.onchange=async()=>{
 const id=++checking,chosen=file.files[0],hash=expected;if(!chosen||!hash)return;
 status.className='';status.textContent='Comprobando el archivo…';
 try{const bytes=await chosen.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes),actual=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');if(id!==checking)return;status.className='aviso '+(actual===hash?'':'error');status.textContent=actual===hash?'PDF auténtico: el archivo coincide exactamente con la emisión registrada.':'El archivo no coincide con esta emisión. Descarga la hoja desde SIDECEME y compruébala de nuevo.';}catch{if(id===checking){status.className='aviso error';status.textContent='No se pudo comprobar el archivo. Inténtalo nuevamente.';}}
};
retry.onclick=consultar;consultar();
