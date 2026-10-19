import {catalogo} from './catalogo.js';
export const normalizar=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function iniciales(nombre){const p=String(nombre||'').replace(/^(?:(?:TCNL|TCL|CNL|MY|CAP|TTE|SUBTTE|SOF|SGTO|GRAL|DEM)\.?\s+)+/i,'').trim().split(/\s+/).filter(Boolean);return (p.length>2?[p[0],...p.slice(-2)]:p).map(x=>x[0]).join('').toUpperCase()}
export function registroHoja(h,ctx={}){const g=ctx.g||(/^g[1-5]$/.test(ctx.campo)?ctx.campo:null)||({'i':'g1','ii':'g2','iii':'g3','iv':'g4','v':'g5'}[normalizar(ctx.seccion).replace(/^.*sec /,'').split(' ')[0]])||'g3';const id=h?.id||h;let plantilla=null;if(['aprecActiva','aprecOrientacion','aprecOps'].includes(id))plantilla=({'g1':'aprec-personal','g2':'aprec-inteligencia','g3':'aprec-operaciones','g4':'aprec-logistica','g5':'aprec-acgm'})[g];if(g==='g3')plantilla=({ivr:'orden-reconocimiento',prep1:'prep1',prep2:'prep2',prep3:'prep3',opord:'orden-operaciones'})[id]||plantilla;if(id==='anexoF7P1')plantilla=({g1:'plan-personal',g4:'plan-aspc'})[g]||null;return {militar:['alerta','guiaInicial'].includes(id),g,hoja:id,paso:ctx.pasoDocumento||h?.num||'',plantilla,nivel:id==='anexoF7P1'?'anexo':'principal'}}
export function registroDirecto(tipo,g,ctx={}){const p=({apreciacion:{g1:'aprec-personal',g2:'aprec-inteligencia',g3:'aprec-operaciones',g4:'aprec-logistica',g5:'aprec-acgm',art:'aprec-artilleria',ing:'aprec-ingenieria',com:'aprec-comunicaciones',ada:'aprec-ada'},plan:{ing:'plan-ingenieria',com:'plan-comunicaciones',ada:'plan-ada',fuegos:'plan-fuegos',art:'apendice-fuegos'},documento:{log:'plan-logistica',engano:'plan-engano',recon:'orden-reconocimiento',movim:'orden-movimiento',calco:'calco'},anexo:{g1:'plan-personal',g4:'plan-aspc'},orden:{g3:'orden-operaciones'}})[tipo]?.[g]||null;return {militar:tipo==='anexo',g,hoja:tipo+':'+g,paso:ctx.pasoDocumento||'',plantilla:p,nivel:tipo==='anexo'?'anexo':p==='apendice-fuegos'?'apendice':'principal'}}
export function identidad(ctx,r){return JSON.stringify([ctx.ejercicio||'',ctx.unidad||'',r.g,r.hoja,r.paso,r.plantilla,r.nivel])}
export function contenidos(secciones){const out=[],repetidos=new Map();function visit(ns,path=[]){for(const n of ns||[]){const ruta=n.titulo?[...path,n.titulo]:path;if(n.texto||n.tabla||n.imagen||n.svg){const base=JSON.stringify(ruta),num=repetidos.get(base)||0;repetidos.set(base,num+1);out.push({id:base+':'+num,ruta:ruta.join(' / '),nodo:{...n,hijos:undefined},destino:null})}visit(n.hijos,ruta)}}visit(secciones);return out}
export function sugerencias(items,plantilla){const comparar=s=>normalizar(String(s||'').replace(/\(Opcional\)/gi,'').replace(/\bUU\./g,'Unidades'));const apartados=catalogo[plantilla]?.apartados||[];return items.map(it=>{const path=comparar(it.ruta),leaf=comparar(it.ruta.split(' / ').at(-1));let m=apartados.filter(a=>comparar(a.ruta)===path);if(!m.length)m=apartados.filter(a=>comparar(a.titulo)===leaf);if(!m.length&&plantilla==='orden-reconocimiento'&&it.nodo.tabla){const cols=(it.nodo.tabla.cabecera||[]).map(x=>normalizar(typeof x==='string'?x:x.t));if(cols.includes('organo de reconocimiento')&&cols.includes('tarea')&&cols.includes('area objetivo a reconocer'))m=apartados.filter(a=>normalizar(a.ruta)==='ejecucion tareas para las unidades subordinadas');}const destino=m.length===1?m[0].ruta:null;return {...it,destino,sugerido:destino||destinoCercano(it,apartados,comparar)}})}
export function aplicarPlantilla(items,plantilla,cfg={}){const modelo=catalogo[plantilla];if(!modelo?.apartados.length)return null;const nodes=[],stack=[],lookup=new Map();for(const a of modelo.apartados){const n={titulo:a.titulo,hijos:[],ruta:a.ruta,nivel:a.nivel};stack.length=Math.min(stack.length,a.nivel-1);(stack.length?stack.at(-1).hijos:nodes).push(n);stack.push(n);lookup.set(a.ruta,n)}const org=[],propios=[];for(const it of items){const d=cfg.asignaciones?.[it.id]||it.destino;if(d===DESTINO_ORG){org.push(it);continue}if(d===DESTINO_PROPIO){propios.push(it);continue}const dest=lookup.get(d);if(!dest)throw Error('Asigne el contenido «'+it.ruta+'» a un apartado antes de exportar.');(dest.contenido??=[]).push({...it.nodo,titulo:tituloPropio(it,dest.titulo),sinRotulo:true})}function trim(ns){return ns.filter(n=>cfg.completo||n.nivel<=2||n.contenido?.length||n.hijos.some(h=>lookupCon(h))).map(n=>({...n,hijos:[...(n.contenido||[]),...trim(n.hijos)],texto:!n.contenido?.length&&!n.hijos.length?'[Pendiente de elaboración]':''}))}function lookupCon(n){return !!n.contenido?.length||n.hijos.some(lookupCon)}const out=trim(nodes);if(org.length)out.unshift({titulo:'ORGANIZACIÓN DE LA TAREA.',sinRotulo:true,hijos:org.map(it=>({...it.nodo,titulo:tituloPropio(it,'Organización de la Tarea'),sinRotulo:true}))});const grupos=new Map();for(const it of propios){const t=it.ruta.split(' / ')[0]||'Otros contenidos de la hoja';if(!grupos.has(t))grupos.set(t,[]);grupos.get(t).push(it)}for(const [t,its] of grupos)out.push({titulo:t,sinRotulo:true,hijos:its.map(it=>({...it.nodo,titulo:tituloPropio(it,t),sinRotulo:true}))});return out}
export function validarPadre(cfg,ctx,registro,registros){if(cfg.nivel==='principal')return null;const esperado={anexo:'principal',apendice:'anexo',agregado:'apendice'}[cfg.nivel];const padre=registros[cfg.padre];if(!padre||padre.ejercicio!==ctx.ejercicio||padre.unidad!==ctx.unidad||padre.nivel!==esperado)throw Error('Seleccione o registre el documento padre de esta unidad y ejercicio.');return padre}

export const esDocumentoMilitar=registro=>!!(registro?.plantilla||registro?.militar);
export function etiquetaWord(hoja,ctx={}){return esDocumentoMilitar(registroHoja(hoja,ctx))?'📄 Word (formato militar)':'📄 Word (hoja de trabajo)'}

// ─── 18-10-2026: el diálogo «Revisar formato del documento» se llena solo ───────────────────────────
// Sergio, con la captura del Anexo de Apoyo de Servicio de Combate: «¿por qué no se rellena sola?». Los
// renglones que no coinciden EXACTO con un apartado del modelo quedaban en «Seleccione apartado» y el
// DOCX no salía hasta elegirlos uno por uno; el anexo pedía además su letra, su asunto y el padre.
// · sugerido: el apartado más cercano (lo exacto sigue en `destino`, y la descarga directa sin
//   diálogo no cambia): «Organización de la Tarea» va a su bloque sin numerar antes de SITUACIÓN; lo
//   que empieza con el título de un apartado («2.- Condiciones meteorológicas.»), a ese apartado; si no,
//   el título más hondo que coincide (igual, o con todas sus palabras: «Personal» → «Funciones de
//   Personal»; las fases → el Concepto de Apoyo) y si no, el de arriba («SITUACIÓN.»); lo que no tiene
//   dónde ir se conserva con su título de la hoja, al final. El título propio del renglón se mantiene
//   (sin numerar) cuando el apartado es otro: «Mantenimiento.» no se pierde dentro de «Funciones Logísticas.».
// · completarSubordinado: la letra y el asunto del anexo salen de su título o del cuadro de anexos de la
//   OGO (el de la Mesa: «F» Apoyo de Servicio de Combate…); el padre, de la OGO registrada o del número
//   de la Orden del título («… ORDEN DE OPERACIONES Nº 3»). Un padre escrito sólo con su número («24»)
//   es la ORDEN GENERAL DE OPERACIONES No. 24.
export const DESTINO_ORG='§org',DESTINO_PROPIO='§propio';
export const DESTINOS_ESPECIALES=[[DESTINO_ORG,'ORGANIZACIÓN DE LA TAREA (sin numerar, antes de SITUACIÓN)'],[DESTINO_PROPIO,'Conservar con su título de la hoja (al final)']];
const VACIAS=new Set(['de','del','la','las','el','los','y','e','en','a','al','por','para','con','sin','o','u']);
const palabras=s=>s.split(' ').filter(w=>w&&!VACIAS.has(w)&&!/^\d+$/.test(w)).map(w=>w.replace(/(?<=[a-z]{3})e?s$/,''));
function tituloPropio(it,titulo){const t=it.nodo?.titulo;return t&&normalizar(t)!==normalizar(titulo)?t:''}
export function destinoCercano(it,apartados,comparar=normalizar){
  const segs=String(it.ruta||'').split(' / ').filter(Boolean);
  if(!segs.length||!apartados.length)return DESTINO_PROPIO;
  if(/^organizacion de la tarea\b/.test(comparar(segs[0])))return DESTINO_ORG;
  const top=comparar(segs[0]),enSeccion=apartados.filter(a=>comparar(a.ruta.split(' / ')[0])===top),pool=enSeccion.length?enSeccion:apartados;
  const elegir=c=>{const min=Math.min(...c.map(a=>a.nivel));return c.find(a=>a.nivel===min).ruta};
  const lead=comparar(String(it.nodo?.texto||'').replace(/^\s*(?:\d+|[a-zA-Z])\s*[.)]\s*-?\s*/,'').slice(0,160));
  if(lead){const c=pool.filter(a=>{const t=comparar(a.titulo);return t.length>=4&&(lead===t||lead.startsWith(t+' '))});if(c.length)return elegir(c)}
  for(let k=segs.length-1;k>=0;k--){
    const s=comparar(segs[k]);if(!s)continue;
    let c=pool.filter(a=>comparar(a.titulo)===s);
    if(!c.length&&k>0){const ws=palabras(s);if(ws.length)c=pool.filter(a=>{const t=palabras(comparar(a.titulo));return ws.every(w=>t.includes(w))})}
    if(!c.length&&/^fases?\b/.test(s))c=pool.filter(a=>/^concepto( de apoyo| de la operacion)?$/.test(comparar(a.titulo)));
    if(c.length)return elegir(c)
  }
  return DESTINO_PROPIO
}
// La letra de cada anexo en la OGO de la Mesa (el cuadro de anexos de la Orden General de Operaciones del G-3).
const LETRAS=[[/servicio de combate|\bspac\b|\basc\b/,'F'],[/logistic/,'G'],[/personal/,'H'],[/asuntos civiles|acgm|gobierno militar/,'I'],[/inteligencia/,'B'],[/fuegos/,'C'],[/antiaere|\bada\b/,'D'],[/ingenieria/,'E'],[/comunicaciones/,'J'],[/engano/,'K'],[/organizacion de la tarea/,'A']];
export function tituloPadre(s){const m=String(s||'').match(/^\s*(?:N[º°o]\.?\s*)?(\d[\w/.-]*)\s*$/i);return m?'ORDEN GENERAL DE OPERACIONES No. '+m[1]:String(s||'').trim()}
function letraAnexo(asunto,ctx={}){
  const a=normalizar(asunto);if(!a)return'';
  const plano=(x,p=0)=>x==null||p>6?'':typeof x==='string'?x:typeof x==='object'?Object.values(x).map(v=>plano(v,p+1)).join('\n'):'';
  const d=ctx.datosIntegrados||{},textos=[d.g3?.opord,d.ordenSup?.anexos,ctx.orden?.anexos,ctx.ordenSup?.anexos].map(x=>plano(x));
  for(const t of textos)for(const l of t.split(/\n|;/)){const n=normalizar(l);if(!n.includes(a))continue;const m=l.match(/(?:ANEXO\s*)?["“']([A-Z])["”']/i)||l.match(/^\s*([A-Z])\s*[-–.:)]/);if(m)return m[1].toUpperCase()}
  const r=LETRAS.find(([re])=>re.test(a));return r?r[1]:''
}
export function completarSubordinado(cfg,{spec={},ctx={},registros={},key}={}){
  if(!cfg||cfg.nivel==='principal')return cfg;
  const titulo=String(spec.titulo||'');
  if(!cfg.asunto){const m=titulo.match(/\(([^()]{3,80})\)/);if(m)cfg.asunto=m[1].trim().toUpperCase()}
  if(!cfg.identificador){const m=titulo.match(/^\s*(?:ANEXO|AP[ÉE]NDICE|AGREGADO)\s*["“”']\s*([A-Z0-9]{1,3})\s*["“”']/i);cfg.identificador=m?m[1].toUpperCase():letraAnexo(cfg.asunto,ctx)}
  if(cfg.padreTitulo)cfg.padreTitulo=tituloPadre(cfg.padreTitulo);
  if(!(cfg.padre&&registros[cfg.padre])&&!cfg.padreTitulo){
    const esperado={anexo:'principal',apendice:'anexo',agregado:'apendice'}[cfg.nivel],unidad=cfg.unidad||ctx.unidad;
    const cand=Object.entries(registros).filter(([k,v])=>k!==key&&!v.referencia&&v.ejercicio===ctx.ejercicio&&v.unidad===unidad&&v.nivel===esperado&&(esperado!=='principal'||v.registro?.plantilla==='orden-operaciones'));
    if(cand.length===1)cfg.padre=cand[0][0];
    else if(esperado==='principal'){const n=(titulo.match(/OPERACIONES\s*N[º°o]?\.?\s*(\d[\w/.-]*)/i)||[])[1];if(n){cfg.padreTitulo=tituloPadre(n);cfg.padreNivel='principal';cfg.padre='referencia:'+JSON.stringify([ctx.ejercicio,unidad,'principal',cfg.padreTitulo]);registros[cfg.padre]={ejercicio:ctx.ejercicio,unidad,nivel:'principal',titulo:cfg.padreTitulo,referencia:true}}}
  }
  return cfg
}
