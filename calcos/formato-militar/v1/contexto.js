// Recupera datos registrados. No crea ubicaciones, horarios ni decisiones de operación.
import {normalizar,iniciales} from './modelo.js?v=integrado20261001';
const texto=v=>typeof v==='string'?v.trim():'';
export function nombreUsuarioPlataforma(sesion){
 if(!sesion){try{sesion=JSON.parse(globalThis.sessionStorage?.getItem('sideceme_session')||globalThis.localStorage?.getItem('sideceme_session_p')||'null')}catch{}}
 const u=sesion?.user||sesion?.usuario||sesion;
 return texto(u?.nombre_completo)||texto(u?.nombreCompleto)||[texto(u?.nombres)||texto(u?.nombre),texto(u?.apellidos)||[texto(u?.apellido_paterno),texto(u?.apellido_materno)].filter(Boolean).join(' ')].filter(Boolean).join(' ');
}
function membrete(documentos,unidad){
 const ordenados=[...(documentos||[])].sort((a,b)=>(a.categoria==='orden'?0:1)-(b.categoria==='orden'?0:1));
 for(const d of ordenados){const ls=String(d.texto||'').split(/[\r\n\t|]+/).map(s=>s.replace(/[*_#]/g,'').trim()).filter(Boolean).slice(0,25);
  for(let i=0;i<Math.min(ls.length,12);i++){const m=ls[i].match(/^(CE\s*[. -]*\s*[IVX]+|CUERPO\s+DE\s+EJ[ÉE]RCITO\s*[. -]*\s*[IVX]+|DIV\.?\s*(?:MEC\.?)?\s*[-–]?\s*\d+|BRIG\.?\s*[-–]?\s*\d+)\s*[,.]?$/i);if(!m)continue;
   if(normalizar(m[1])===normalizar(unidad))continue;
   // El membrete precede al texto de situación. No toma menciones de la organización enemiga.
   if(ls.slice(0,i).some(l=>/situaci[oó]n|enemig|organizaci[oó]n/i.test(l)))continue;
   return {valor:m[1].toUpperCase().replace(/^CE\s*[. -]*\s*/,'CE-'),fuente:'Membrete de '+(d.nombre||'documento cargado')};
  }
 }
 return null;
}
const coordenada=n=>{const c=n?.geometry?.type==='Point'?n.geometry.coordinates:n?.coords;return Array.isArray(c)&&c.length===2&&c.every(Number.isFinite)?c:Number.isFinite(n?.lat)&&Number.isFinite(n?.lng)?[n.lng,n.lat]:null};
const km=(a,b)=>{const r=x=>x*Math.PI/180,x=r(b[1]-a[1]),y=r(b[0]-a[0]);return 12742*Math.asin(Math.sqrt(Math.sin(x/2)**2+Math.cos(r(a[1]))*Math.cos(r(b[1]))*Math.sin(y/2)**2))};
function localidad(datos,unidad){
 const propios=(datos.unidades||[]).filter(u=>u.tipo==='pc'&&!/enemig/i.test(u.bando||'')&&coordenada(u));
 const nivel=/div|dimec/i.test(unidad)?'division':/brig/i.test(unidad)?'brigada':/^r[ciba]/i.test(unidad)?'regimiento':null;
 const directos=propios.filter(u=>normalizar(u.designacion||u.nombre).includes(normalizar(unidad)));
 const pcs=directos.length?directos:nivel&&propios.some(u=>u.escalon===nivel)?propios.filter(u=>u.escalon===nivel):propios;
 if(pcs.length!==1)return null;const pc=pcs[0];let poblaciones=[];
 for(const capas of [datos.datosCapas,datos.datosAnalizados]){const c=capas?.poblaciones_puntos;poblaciones.push(...(c?.fc?.features||c?.features||[]))}
 for(const p of datos.cmoc?.poblaciones||[])poblaciones.push(p);
 const candidatos=poblaciones.map(p=>({p,c:coordenada(p),nombre:texto(p.properties?.nombre||p.properties?.name||p.properties?.Nombre||p.nombre||p.name)})).filter(p=>p.c&&p.nombre).map(p=>({...p,distancia:km(coordenada(pc),p.c)})).sort((a,b)=>a.distancia-b.distancia);
 const p=candidatos[0];if(!p||p.distancia>50)return null;
 return {valor:p.nombre,fuente:'Calco: '+(pc.designacion||pc.nombre||'PC registrado')+'; capa de poblaciones (localidad más cercana al punto existente)',distanciaKm:p.distancia};
}
function fechaReferencia(datos,registro){
 const nombre=normalizar(({ivr:'reconocimiento',prep1:'preparatoria 1',prep2:'preparatoria 2',prep3:'preparatoria 3',opord:'orden de operaciones',guiaInicial:'guia inicial'})[registro?.hoja]||'');
 const filas=datos.hojasG?.jem?.lineaTiempoAct||datos.g3?.lineaTiempoAct||[];
 if(nombre)for(const f of Array.isArray(filas)?filas:[]){const actividad=normalizar(f.Actividad||f.actividad);const fecha=texto(f['Fecha y hora']||f.fechaHora);if(actividad.includes(nombre)&&fecha)return {valor:fecha,fuente:'Línea de tiempo actualizada / '+(f.Actividad||f.actividad)}}
 const lt=datos.g3?.lineaTiempo||datos.picb?.lineaTiempo||datos.hojasG?.jem?.lineaTiempo||{};
 const fecha=texto(lt.fechaActual||lt.momentoActual||lt.fechaHora)||texto(lt.recepcion);
 return fecha?{valor:fecha,fuente:lt.fechaActual||lt.momentoActual||lt.fechaHora?'Línea de tiempo / momento registrado del ejercicio':'Línea de tiempo / recepción de la orden (referencia inicial del ejercicio)'}:null;
}
export function integrarContexto(ctx,datos={},registro={}){
 const out={...ctx},fuentes={};for(const k of ['unidadSuperior','lugar','fechaTactica'])if(ctx.contextoDocumental?.automaticos?.[k]?.valor===out[k])out[k]='';const poner=(k,valor,fuente)=>{if(texto(valor)){out[k]=valor;fuentes[k]={valor,fuente}}};
 const identidad=datos.ops?.unidadConsiderada;if(identidad?.confirmada)poner('unidad',identidad.nombre,'Identidad confirmada del ejercicio');
 const orden=datos.ordenSup||ctx.ordenSup||ctx.orden||{};
 if(!out.unidadSuperior){const m=membrete(datos.documentos,out.unidad);poner('unidadSuperior',orden.escalonSuperior||m?.valor,orden.escalonSuperior?'Orden superior / escalón superior':m?.fuente)}
 if(!out.lugar){const l=localidad(datos,out.unidad);poner('lugar',l?.valor||orden.puestoMando,l?.fuente||'Orden / puesto de mando registrado')}
 if(!out.fechaTactica&&!out.fechaHora){const f=fechaReferencia(datos,registro);poner('fechaTactica',f?.valor,f?.fuente)}
 const usuario=nombreUsuarioPlataforma(datos.usuarioPlataforma);poner('autor',usuario||ctx.autor||datos.autorEM,usuario?'Usuario activo de SIDECEME':'Elaborador registrado del ejercicio');
 poner('inicialesElaborador',iniciales(out.autor)||orden.clave||'XYZ',out.autor?'Iniciales del elaborador':'Clave registrada o marcador XYZ');
 poner('inicialesJem',ctx.inicialesJem||datos.ops?.inicialesJem||'XYZ',ctx.inicialesJem||datos.ops?.inicialesJem?'Iniciales JEM registradas':'Marcador XYZ solicitado para dato no registrado');
 return {...out,fuentesContexto:fuentes,datosIntegrados:datos};
}
export function completarConfiguracion(cfg,guardado,ctx){
 const campos={superior:ctx.unidadSuperior,lugar:ctx.lugar,fechaHora:ctx.fechaTactica||ctx.fechaHora,iniciales:ctx.inicialesElaborador||iniciales(ctx.autor)||'XYZ',jem:ctx.inicialesJem||'XYZ',inicialesAut:ctx.inicialesAut||'XYZ'};
 for(const [k,v] of Object.entries(campos)){const previo=guardado?.autollenado?.[k]?.valor;if(v&&(!cfg[k]||cfg[k]===previo))cfg[k]=v;}
 // La clave del elaborador pertenece al usuario que trabaja ahora, no al autor de otra orden.
 if(ctx.fuentesContexto?.autor?.fuente==='Usuario activo de SIDECEME')cfg.iniciales=campos.iniciales;
 if(!cfg.numero)cfg.numero='01';
 if(cfg.superior&&(!cfg.distribucion||cfg.distribucion.includes('[Unidad superior pendiente]')))cfg.distribucion=`Original: ${cfg.superior}\nCopia 1-12: UU. DEP.\nCopia 13: ARCHIVO`;
 const keys={superior:'unidadSuperior',lugar:'lugar',fechaHora:'fechaTactica',iniciales:'inicialesElaborador',jem:'inicialesJem'};
 cfg.autollenado=Object.fromEntries(Object.entries(keys).map(([k,c])=>[k,{valor:campos[k]||cfg[k],fuente:ctx.fuentesContexto?.[c]?.fuente||'Dato registrado del ejercicio'}]));
 return cfg;
}

export function contextoParaGuardar(cfg,ctx){const out={ejercicio:ctx.ejercicio,unidad:cfg.unidad,unidadSuperior:cfg.superior,lugar:cfg.lugar,fechaTactica:cfg.fechaHora,autor:ctx.autor,automaticos:{}};for(const [campo,k] of Object.entries({unidadSuperior:'superior',lugar:'lugar',fechaTactica:'fechaHora'})){const v=cfg.autollenado?.[k];if(v&&cfg[k]===v.valor&&v.fuente!=='Dato registrado del ejercicio')out.automaticos[campo]={...v}}return out}
