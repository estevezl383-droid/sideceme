export const JEFES=['P019','P020','P030'];
export const COLORES={ROJO:'#ef4444',AMARILLO:'#eab308',VERDE:'#22c55e',GUINDO:'#800020',ANARANJADO:'#f97316',AZUL:'#3b82f6',MORADO:'#a855f7',ROSADO:'#ec4899',CELESTE:'#38bdf8',BLANCO:'#f8fafc',GRIS:'#64748b',NEGRO:'#111827'};
export const ESTACIONES={talla_peso:'TALLA / PESO',flexiones:'FLEXIONES',abdominales:'ABDOMINALES',aerobica:'AERÓBICA 3.200 M',natacion:'NATACIÓN',barras:'BARRAS · EXCELENCIA'};
export const CONDICIONES={NORMAL:'REALIZA LAS PRUEBAS',CON_PAPELETA:'SOLICITUD DE NO REALIZAR CON PAPELETA MÉDICA',SIN_PAPELETA:'SOLICITUD DE NO REALIZAR SIN PAPELETA',NO_ASISTIO:'NO ASISTIÓ / FALTÓ'};
export const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
export const puedeEvaluar=p=>p?.activo===true&&!p.es_suboficial&&!p.es_auxiliar&&!p.solo_lectura&&!/^S\d/.test(p.id)&&!/^(SOF|SGTO|SARG|CIV)/.test(norm(p.grado));
export function validarPlan(p,roster,personal){
 if(!p||!String(p.nombre||'').trim()||p.nombre.length>100||!['1ER CICLO','2DO CICLO'].includes(p.ciclo)||!['PILOTO','EVALUACION'].includes(p.modo)||typeof p.habilitado!=='boolean'||!Array.isArray(p.grupos)||!p.grupos.length||p.grupos.length>12)return 'REVISAR NOMBRE, CICLO, MODO Y GRUPOS.';
 const colors=new Set(),members=new Set(),ids=new Set();
 for(const g of p.grupos){
  if(!g.id||typeof g.id!=='string'||! /^[a-zA-Z0-9_-]{1,60}$/.test(g.id)||ids.has(g.id)||!COLORES[g.color]||colors.has(g.color)||!Array.isArray(g.alumnos)||!g.alumnos.length)return 'CADA GRUPO NECESITA ALUMNOS Y UN COLOR ÚNICO. NEGRO ES EXCLUSIVO DE EXCELENCIA.';
  ids.add(g.id);colors.add(g.color);
  for(const id of g.alumnos){if(members.has(id)||!roster.some(c=>c.id===id&&c.ciclo===p.ciclo))return 'CURSANTE REPETIDO O AJENO AL CICLO.';members.add(id);}
  if(!g.encargados||Object.keys(g.encargados).some(k=>!ESTACIONES[k]))return 'PRUEBA NO VÁLIDA.';
  for(const [prueba,ps] of Object.entries(g.encargados)){if(!Array.isArray(ps)||new Set(ps).size!==ps.length||ps.some(id=>!puedeEvaluar(personal.find(x=>x.id===id))))return 'SOLO PROFESORES HABILITADOS PUEDEN EVALUAR.';if(prueba==='barras'&&g.color!=='NEGRO'&&ps.length)return 'BARRAS SE ORGANIZA EN EL GRUPO NEGRO.';}
  if(p.habilitado&&Object.keys(ESTACIONES).filter(x=>x!=='barras'||g.color==='NEGRO').some(k=>!g.encargados[k]?.length))return 'ASIGNÁ EVALUADORES A TODAS LAS PRUEBAS ANTES DE HABILITAR.';
  if(!Array.isArray(g.apoyos)||g.apoyos.length>100||g.apoyos.some(a=>!String(a.tarea||'').trim()||a.tarea.length>200||(!a.personal_id&&!String(a.nombre||'').trim())||(a.personal_id&&!personal.some(x=>x.id===a.personal_id))||String(a.nombre||'').length>160))return 'REVISAR PERSONAL DE APOYO Y TAREAS.';
 }
 return null;
}
export function asignaciones(plan,actor){return !plan?.habilitado?[]:plan.grupos.flatMap(g=>Object.keys(ESTACIONES).filter(p=>g.encargados[p]?.includes(actor)).map(prueba=>({grupo:g.id,color:g.color,prueba,alumnos:g.alumnos})));}
export const puedeRegistrar=(plan,actor,id,prueba)=>asignaciones(plan,actor).some(a=>a.prueba===prueba&&a.alumnos.includes(id));
// Coincidencia exacta por CI/ID o conjunto completo de nombres; nunca asigna coincidencias parciales.
export function importarLineas(lines,roster){
 const grupos=[],pendientes=[],usados=new Set();let current=null,collect=true;
 for(const raw of lines){const line=norm(raw);if(!line)continue;
  const color=Object.keys(COLORES).find(c=>new RegExp('\\bGRUPO\\s+'+c+'\\b').test(line));
  if(color){collect=true;current=grupos.find(g=>g.color===color);if(!current){current={id:crypto.randomUUID(),color,alumnos:[],encargados:{},apoyos:[]};grupos.push(current);}continue;}
  if(!current)continue;
  if(/^(ENCARGADOS|PROFESORES ENCARGADOS|PERSONAL DE APOYO|APOYO ADMINISTRATIVO)/.test(line)){collect=false;continue;}
  if(!collect||/^(CURSANTES|NOMINA|RELACION NOMINAL|N GRADO|GRADO APELLIDOS)/.test(line))continue;
  const tokens=line.split(' '),matches=roster.filter(c=>tokens.includes(norm(c.id))||(c.ci&&tokens.includes(norm(c.ci)))||norm(c.nombre_completo).split(' ').every(t=>tokens.includes(t)));
  if(matches.length!==1){pendientes.push({linea:raw,motivo:matches.length?'COINCIDENCIA AMBIGUA':'NO RECONOCIDO'});continue;}
  const c=matches[0];if(usados.has(c.id)){pendientes.push({linea:raw,motivo:'CURSANTE REPETIDO'});continue;}current.alumnos.push(c.id);usados.add(c.id);
 }
 return {grupos,pendientes};
}
