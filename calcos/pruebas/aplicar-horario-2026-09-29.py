from pathlib import Path
import re, sys

p=Path("index.html")
s=p.read_text(encoding="utf-8")
orig=s

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{label}: esperaba 1 coincidencia, encontré {n}")
    s=s.replace(old,new,1)
    print("OK",label)

# Estado de zoom.
one(
"""const PLP = { perfil:null, perfilTok:null, cal:null, vista:'planta', semanas:[], props:[],
  conBase:false, cacheKey:null, recargar:false, origen:null, pendientesN:0,
  volverSiCancela:false, base:null };""",
"""const PLP = { perfil:null, perfilTok:null, cal:null, vista:'planta', semanas:[], props:[],
  conBase:false, cacheKey:null, recargar:false, origen:null, pendientesN:0,
  volverSiCancela:false, base:null, zoom:0 };""",
"PLP.zoom")

# Las propuestas ocultas sirven para quitar una fila gris: no deben recortar ni aparecer como fila nueva.
start=s.index("function _plpMezclarBloque(")
end=s.index("// Con qué se choca una actividad", start)
fn=s[start:end]
old="""    const ps=aprob.filter(function(p){ return p.fecha===d.iso; })
      .sort(function(a,b){ return _plpMin(a.desde)-_plpMin(b.desde); });
    const seVan=mudanzas.filter(function(p){ return p.mueve.fecha===d.iso; });"""
new="""    const ps=aprob.filter(function(p){ return p.fecha===d.iso; })
      .sort(function(a,b){ return _plpMin(a.desde)-_plpMin(b.desde); });
    const psVis=ps.filter(function(p){ return !p.ocultar_base; });
    const seVan=mudanzas.filter(function(p){ return p.mueve.fecha===d.iso; });"""
if fn.count(old)!=1: raise SystemExit("mezcla psVis: ancla inválida")
fn=fn.replace(old,new,1)
fn=fn.replace("if(ps.some(function(p){ return p.tipo==='efm' && !p.mueve; }))",
              "if(psVis.some(function(p){ return p.tipo==='efm' && !p.mueve; }))",1)
# Solo dentro de esta función, las dos iteraciones que recortan e insertan.
if fn.count("    ps.forEach(function(p){")!=2:
    raise SystemExit(f"mezcla ps.forEach: esperaba 2, hallé {fn.count('    ps.forEach(function(p){')}")
fn=fn.replace("    ps.forEach(function(p){","    psVis.forEach(function(p){")
s=s[:start]+fn+s[end:]
print("OK mezcla ocultar_base")

# Permisos: solo los tres puede_mover editan actividades ajenas.
m=re.search(r"function _plpPuedeEditar\\(p\\)\\{.*?\\n\\}",s,re.S)
if not m: raise SystemExit("permisos editar ajenas: función no encontrada")
s=s[:m.start()]+"""function _plpPuedeEditar(p){
  const u=PLP.perfil;
  if(!u || p.estado==='retirada') return false;
  // v2.9.420 — SOLO quienes tienen puede_mover (Morales, Villarroel y Arce)
  // pueden modificar propuestas ajenas. El Jefe de Estudios aprueba/rechaza,
  // pero no cambia el pedido de otra persona.
  if(u.mover) return true;
  return !!(u.proponer && p.creado_por===u.id && _plpAbierta(_plpSemanaDe(p.fecha)));
}"""+s[m.end():]
print("OK permisos editar ajenas")

# Filas grises: únicamente mover autorizados (o EFM para sus encargados).
one(
"editable:true, startEditable:!!u.proponer, durationEditable:!!u.proponer,",
"editable:!!u.mover || (!!u.efm && _plpEsFilaEfm(f)), startEditable:!!u.mover || (!!u.efm && _plpEsFilaEfm(f)), durationEditable:!!u.mover || (!!u.efm && _plpEsFilaEfm(f)),",
"permisos filas base")

# No pintar propuestas técnicas usadas para ocultar una base.
one(
"""  PLP.props.forEach(function(p){
    if(PLP.conBase && v!=='todas' && (p.audiencias||[]).indexOf(v)<0) return;""",
"""  PLP.props.forEach(function(p){
    if(p.ocultar_base) return;
    if(PLP.conBase && v!=='todas' && (p.audiencias||[]).indexOf(v)<0) return;""",
"no pintar ocultar_base")

# En la lista de bloques del día tampoco se muestra una propuesta técnica de ocultación.
start=s.index("function _plpBloquesDia(")
end=s.index("function _plpHayChoque",start)
fn=s[start:end]
old="""  PLP.props.forEach(function(p){
    if(p.fecha!==iso || p.estado==='rechazada' || p.estado==='retirada') return;"""
new="""  PLP.props.forEach(function(p){
    if(p.ocultar_base) return;
    if(p.fecha!==iso || p.estado==='rechazada' || p.estado==='retirada') return;"""
if fn.count(old)!=1: raise SystemExit("bloques ocultar_base: ancla inválida")
fn=fn.replace(old,new,1)
s=s[:start]+fn+s[end:]
print("OK bloques ocultar_base")

# Alineación del arrastre de base con el backend.
one(
"if(!u.proponer || !f.desde || !f.hasta || !viejo || !viejo.start){ info.revert(); return; }",
"if((!u.mover && !(u.efm && _plpEsFilaEfm(f))) || !f.desde || !f.hasta || !viejo || !viejo.start){ info.revert(); return; }",
"arrastre base autorizado")

# Botón ENCAJAR solamente para quienes realmente reacomodan; agregar zoom.
old="""  if(u.mover || u.aprobar) h+='<button class="plp-enc-gr" onclick="plpEncajarAbrir()">🔗 ENCAJAR EL DÍA — que nada quede encimado</button>';
  h+='<button class="plp-prev-gr" onclick="plpVistaPrevia()">👁️ Vista previa — cómo sale impreso</button>';"""
new="""  if(u.mover) h+='<button class="plp-enc-gr" onclick="plpEncajarAbrir()">🔗 ENCAJAR EL DÍA — que nada quede encimado</button>';
  h+='<span class="plp-zoom-ctl">🔎 ALTURA '
    +'<button class="pl-add" onclick="plpZoom(-1)" title="Achicar">−</button>'
    +'<button class="pl-add" onclick="plpZoom(0)" title="Volver al tamaño normal">NORMAL</button>'
    +'<button class="pl-add" onclick="plpZoom(1)" title="Ampliar">＋</button></span>';
  h+='<button class="plp-prev-gr" onclick="plpVistaPrevia()">👁️ Vista previa — cómo sale impreso</button>';"""
one(old,new,"barra zoom y encajar")

# Texto de ayuda.
one("+(u.aprobar||u.mover\n      ? 'Como podés <b>reacomodar el horario</b>, movés y estirás <b>cualquier</b> actividad, sea de quien sea: '",
    "+(u.mover\n      ? 'Como podés <b>reacomodar el horario</b>, movés y estirás <b>cualquier</b> actividad, sea de quien sea: '",
    "hint permisos")

# Zoom vertical.
anchor="async function goPlanifCal(fecha){"
zoom_js=r"""
function _plpAplicarZoom(){
  const el=document.getElementById('plp-cal'); if(!el) return;
  let st=document.getElementById('plp-zoom-css');
  if(!st){
    st=document.createElement('style'); st.id='plp-zoom-css';
    st.textContent='#plp-cal.plp-zoom .fc-timegrid-slot{height:var(--plp-slot-h)!important}'
      +'#plp-cal.plp-zoom .fc-timegrid-event{min-height:18px}';
    document.head.appendChild(st);
  }
  const alturas=[0,26,34,44,56];
  const z=Math.max(0,Math.min(4,PLP.zoom||0));
  if(!z){ el.classList.remove('plp-zoom'); el.style.removeProperty('--plp-slot-h'); }
  else { el.classList.add('plp-zoom'); el.style.setProperty('--plp-slot-h',alturas[z]+'px'); }
}
function plpZoom(delta){
  if(delta===0) PLP.zoom=0;
  else PLP.zoom=Math.max(0,Math.min(4,(PLP.zoom||0)+delta));
  _plpAplicarZoom();
}

"""
if s.count(anchor)!=1: raise SystemExit("zoom anchor")
s=s.replace(anchor,zoom_js+anchor,1)
print("OK zoom funciones")

one("  PLP.cal.render();\n  _plpBarra();","  PLP.cal.render();\n  _plpAplicarZoom();\n  _plpBarra();","aplicar zoom")

# Encajar: solo puede_mover.
one(
"""function plpEncajarAbrir(iso){
  const u=PLP.perfil||{};
  if(!u.mover && !u.aprobar) return;""",
"""function plpEncajarAbrir(iso){
  const u=PLP.perfil||{};
  if(!u.mover) return;""",
"encajar permisos")

# Añadir modo manual a los botones normales.
old="""    +'<button class="pl-tab'+(e.modo==='correr'?' on':'')+'" onclick="plpEncajarModo(\\'correr\\')">➡️ Correr — cada una conserva su duración y empuja a la siguiente</button>'
    +'</div>';"""
new="""    +'<button class="pl-tab'+(e.modo==='correr'?' on':'')+'" onclick="plpEncajarModo(\\'correr\\')">➡️ Correr — cada una conserva su duración y empuja a la siguiente</button>'
    +'<button class="pl-tab'+(e.modo==='manual'?' on':'')+'" onclick="plpEncajarModo(\\'manual\\')">✏️ EDITAR A MANO — horas, texto, agregar o eliminar</button>'
    +'</div>';"""
one(old,new,"tab manual")

# Manual renderer y operaciones.
anchor="function _plpEncajarPintar(){"
manual_js=r"""
function _plpEncMay(v){ return String(v==null?'':v).trim().toLocaleUpperCase('es-BO'); }
function _plpEncInputMay(el){
  if(!el) return;
  const a=el.selectionStart, b=el.selectionEnd;
  el.value=String(el.value||'').toLocaleUpperCase('es-BO');
  try{ el.setSelectionRange(a,b); }catch(_){}
}
function _plpEncActualizarLocal(p){
  if(!p) return;
  const i=PLP.props.findIndex(function(x){ return x.id===p.id; });
  if(i>=0) PLP.props[i]=p; else PLP.props.push(p);
  PLP.recargar=true;
}
function _plpEncManualPintar(){
  const e=PLP.enc; if(!e) return;
  const u=PLP.perfil||{}, bl=_plpBloquesDia(e.iso);
  const nombre=function(x){ return _plDiaNombre(x)+' '+_plDiaNum(x); };
  let h='<div class="plp-dlg-h">✏️ EDITAR EL DÍA — HORARIO INTEGRADO</div>'
    +'<div class="pl-hint" style="margin:0 0 8px"><b>EDICIÓN DIRECTA:</b> cambie horas, texto, agregue o elimine filas. '
    +'Las filas grises se modifican mediante una propuesta auditable: el horario base original no se destruye.</div>'
    +'<label class="pl-full">Día<select class="pl-i" onchange="plpEncajarDia(this.value)">'
    +e.dias.map(function(x){ return '<option value="'+x+'"'+(x===e.iso?' selected':'')+'>'+_plEsc(nombre(x))
      +(e.conChoque.indexOf(x)>=0?'  ⚠️ HAY CASILLAS ENCIMADAS':'  ✅ SIN CHOQUES')+'</option>'; }).join('')
    +'</select></label>'
    +'<div class="plp-enc-modo">'
    +'<button class="pl-tab" onclick="plpEncajarModo(\\'recortar\\')">✂️ RECORTAR</button>'
    +'<button class="pl-tab" onclick="plpEncajarModo(\\'correr\\')">➡️ CORRER</button>'
    +'<button class="pl-tab on" onclick="plpEncajarModo(\\'manual\\')">✏️ EDITAR A MANO</button>'
    +'</div>'
    +'<div class="plp-enc-t"><table><tr><th>TIPO</th><th>DESDE</th><th>HASTA</th><th>ACTIVIDAD</th><th>ACCIONES</th></tr>';
  if(!bl.length) h+='<tr><td colspan="5"><div class="pl-hint">ESTE DÍA NO TIENE FILAS CON HORA.</div></td></tr>';
  bl.forEach(function(x,i){
    const puede=x.tipo==='base' ? !!u.mover : _plpPuedeEditar(x.p);
    const dis=puede?'':' disabled';
    h+='<tr>'
      +'<td><b>'+(x.tipo==='base'?'▦ BASE':'🔵 PROPUESTA')+'</b>'
      +(x.tipo==='prop'&&x.p&&x.p.creado_por_nombre?'<small>'+_plEsc(x.p.creado_por_nombre)+'</small>':'')+'</td>'
      +'<td><input class="pl-i" style="min-width:72px" id="plp-em-d-'+i+'" value="'+_plEsc(_plpHHMM(x.a))+'" inputmode="numeric" maxlength="5"'+dis+'></td>'
      +'<td><input class="pl-i" style="min-width:72px" id="plp-em-h-'+i+'" value="'+_plEsc(_plpHHMM(x.z))+'" inputmode="numeric" maxlength="5"'+dis+'></td>'
      +'<td><textarea class="pl-i" id="plp-em-t-'+i+'" rows="2" oninput="_plpEncInputMay(this)"'+dis+'>'+_plEsc(_plpEncMay(x.txt))+'</textarea></td>'
      +'<td>'+(puede?'<button class="btn-primary pl-b" onclick="plpEncManualGuardar('+i+')">💾 GUARDAR</button> '
        +'<button class="pl-x plp-bw" onclick="plpEncManualEliminar('+i+')">🗑 ELIMINAR</button>':'🔒')+'</td>'
      +'</tr>';
  });
  h+='</table></div>';
  if(u.mover){
    h+='<div class="pl-card" style="margin-top:10px"><div class="pl-card-h">＋ AGREGAR FILA</div>'
      +'<div class="pl-grid2 plp-g3"><label>DESDE<input class="pl-i" id="plp-em-nd" value="08:00" inputmode="numeric" maxlength="5"></label>'
      +'<label>HASTA<input class="pl-i" id="plp-em-nh" value="08:30" inputmode="numeric" maxlength="5"></label>'
      +'<label class="pl-full">ACTIVIDAD<textarea class="pl-i" id="plp-em-nt" rows="2" oninput="_plpEncInputMay(this)" placeholder="NUEVA ACTIVIDAD"></textarea></label></div>'
      +'<button class="btn-primary pl-b" onclick="plpEncManualNueva()">＋ AGREGAR FILA</button></div>';
  }
  h+='<div class="plp-btns"><span style="flex:1"></span><button class="pl-add" onclick="_plpCerrarModal()">CERRAR</button></div>'
    +'<div id="plp-em-res"></div>';
  _plpModal(h);
}
function _plpEncLeer(i){
  const d=document.getElementById('plp-em-d-'+i), h=document.getElementById('plp-em-h-'+i), t=document.getElementById('plp-em-t-'+i);
  return {desde:_plpNormHora(d?d.value:''), hasta:_plpNormHora(h?h.value:''), actividad:_plpEncMay(t?t.value:'')};
}
function _plpEncVal(c){
  if(!c.actividad) return 'ESCRIBA LA ACTIVIDAD.';
  if(!/^\\d{2}:\\d{2}$/.test(c.desde)||!/^\\d{2}:\\d{2}$/.test(c.hasta)) return 'COMPLETE LAS HORAS EN FORMATO HH:MM.';
  if(c.hasta<=c.desde) return 'LA HORA DE FIN DEBE SER POSTERIOR A LA DE INICIO.';
  return '';
}
async function plpEncManualGuardar(i){
  const e=PLP.enc, u=PLP.perfil||{}, bl=_plpBloquesDia(e.iso), x=bl[i];
  if(!e||!x) return;
  const c=_plpEncLeer(i), mal=_plpEncVal(c); if(mal){ alert('⚠️ '+mal); return; }
  let r;
  if(x.tipo==='prop'){
    if(!_plpPuedeEditar(x.p)){ alert('🔒 NO PUEDE MODIFICAR LA PROPUESTA DE OTRO USUARIO.'); return; }
    r=await _plpInvoke('guardar',{id:x.p.id,version:x.p.version,campos:{
      fecha:e.iso, desde:c.desde, hasta:c.hasta, actividad:c.actividad,
      motivo:'AJUSTE MANUAL DEL HORARIO INTEGRADO'
    }});
  } else {
    if(!u.mover){ alert('🔒 NO TIENE PERMISO PARA MODIFICAR EL HORARIO BASE.'); return; }
    const f=x.fila||{};
    r=await _plpInvoke('guardar',{campos:{
      fecha:e.iso, desde:c.desde, hasta:c.hasta, actividad:c.actividad,
      lugar:_plpEncMay(f.lugar||''), responsable:_plpEncMay(f.resp||''), asisten:_plpEncMay(f.asisten||'TODOS'),
      uniforme:_plpEncMay(f.unif||''), audiencias:[x.v], recortar:false,
      motivo:'AJUSTE MANUAL DEL HORARIO INTEGRADO',
      tipo:_plpEsFilaEfm(f)?'efm':'normal',
      mueve:{fecha:e.iso,desde:_plpHHMM(x.a),hasta:_plpHHMM(x.z),texto:_plpEncMay(x.txt)}
    }});
  }
  if(!r||!r.ok){ alert('❌ '+((r&&r.error)||'NO SE PUDO GUARDAR')); return; }
  _plpEncActualizarLocal(r.propuesta);
  e.conChoque=e.dias.filter(function(d){ return _plpHayChoque(_plpBloquesDia(d)); });
  _plpEncManualPintar();
}
async function plpEncManualEliminar(i){
  const e=PLP.enc, u=PLP.perfil||{}, bl=_plpBloquesDia(e.iso), x=bl[i];
  if(!e||!x) return;
  if(!confirm('¿ELIMINAR «'+String(x.txt||'').slice(0,80).toLocaleUpperCase('es-BO')+'» DEL HORARIO?')) return;
  let r;
  if(x.tipo==='prop'){
    if(!_plpPuedeEditar(x.p)){ alert('🔒 NO PUEDE ELIMINAR LA PROPUESTA DE OTRO USUARIO.'); return; }
    r=await _plpInvoke('retirar',{id:x.p.id,version:x.p.version});
    if(r&&r.ok) PLP.props=PLP.props.filter(function(p){ return p.id!==x.p.id; });
  } else {
    if(!u.mover){ alert('🔒 NO TIENE PERMISO PARA ELIMINAR FILAS DEL HORARIO BASE.'); return; }
    const f=x.fila||{};
    r=await _plpInvoke('guardar',{campos:{
      fecha:e.iso, desde:_plpHHMM(x.a), hasta:_plpHHMM(x.z), actividad:_plpEncMay(x.txt),
      lugar:_plpEncMay(f.lugar||''), responsable:_plpEncMay(f.resp||''), asisten:_plpEncMay(f.asisten||'TODOS'),
      uniforme:_plpEncMay(f.unif||''), audiencias:[x.v], recortar:false, ocultar_base:true,
      motivo:'ELIMINAR FILA DEL HORARIO INTEGRADO',
      tipo:_plpEsFilaEfm(f)?'efm':'normal',
      mueve:{fecha:e.iso,desde:_plpHHMM(x.a),hasta:_plpHHMM(x.z),texto:_plpEncMay(x.txt)}
    }});
    if(r&&r.ok) _plpEncActualizarLocal(r.propuesta);
  }
  if(!r||!r.ok){ alert('❌ '+((r&&r.error)||'NO SE PUDO ELIMINAR')); return; }
  PLP.recargar=true;
  e.conChoque=e.dias.filter(function(d){ return _plpHayChoque(_plpBloquesDia(d)); });
  _plpEncManualPintar();
}
async function plpEncManualNueva(){
  const e=PLP.enc, u=PLP.perfil||{}; if(!e||!u.mover) return;
  const d=document.getElementById('plp-em-nd'), h=document.getElementById('plp-em-nh'), t=document.getElementById('plp-em-nt');
  const c={desde:_plpNormHora(d?d.value:''),hasta:_plpNormHora(h?h.value:''),actividad:_plpEncMay(t?t.value:'')};
  const mal=_plpEncVal(c); if(mal){ alert('⚠️ '+mal); return; }
  const v=PLP.vista==='todas'?'planta':PLP.vista;
  const r=await _plpInvoke('guardar',{campos:{
    fecha:e.iso, desde:c.desde, hasta:c.hasta, actividad:c.actividad,
    lugar:'', responsable:'', asisten:'TODOS', uniforme:'', audiencias:[v], recortar:false,
    motivo:'NUEVA FILA AGREGADA DESDE EL EDITOR DEL HORARIO INTEGRADO', tipo:'normal'
  }});
  if(!r||!r.ok){ alert('❌ '+((r&&r.error)||'NO SE PUDO AGREGAR')); return; }
  _plpEncActualizarLocal(r.propuesta);
  e.conChoque=e.dias.filter(function(x){ return _plpHayChoque(_plpBloquesDia(x)); });
  _plpEncManualPintar();
}

"""
if s.count(anchor)!=1: raise SystemExit("manual anchor")
s=s.replace(anchor,manual_js+anchor,1)
print("OK editor manual")

# El pintor normal deriva al manual.
one(
"""function _plpEncajarPintar(){
  const e=PLP.enc; if(!e) return;
  const bl=_plpBloquesDia(e.iso);""",
"""function _plpEncajarPintar(){
  const e=PLP.enc; if(!e) return;
  if(e.modo==='manual'){ _plpEncManualPintar(); return; }
  const bl=_plpBloquesDia(e.iso);""",
"derivar manual")

# Mayúsculas antes de guardar propuestas.
old="""function _plpLeerForm(){
  const g=function(id){ const e=document.getElementById('plp-f-'+id); return e?String(e.value||'').trim():''; };
  const aud=[]; document.querySelectorAll('.plp-f-aud').forEach(function(c){ if(c.checked) aud.push(c.value); });"""
new="""function _plpLeerForm(){
  const g=function(id){ const e=document.getElementById('plp-f-'+id); return e?String(e.value||'').trim():''; };
  const may=function(v){ return String(v||'').trim().toLocaleUpperCase('es-BO'); };
  const aud=[]; document.querySelectorAll('.plp-f-aud').forEach(function(c){ if(c.checked) aud.push(c.value); });"""
one(old,new,"may helper form")
one(
"""  return { fecha:g('fecha'), desde:_plpNormHora(g('desde')), hasta:_plpNormHora(g('hasta')), actividad:g('actividad'),
    lugar:g('lugar'), responsable:g('responsable'), asisten:g('asisten'), uniforme:g('uniforme'),
    audiencias:aud.sort(), recortar:rec?rec.checked:true,
    motivo:g('justif'),""",
"""  return { fecha:g('fecha'), desde:_plpNormHora(g('desde')), hasta:_plpNormHora(g('hasta')), actividad:may(g('actividad')),
    lugar:may(g('lugar')), responsable:may(g('responsable')), asisten:may(g('asisten')), uniforme:may(g('uniforme')),
    audiencias:aud.sort(), recortar:rec?rec.checked:true,
    motivo:may(g('justif')),""",
"form guardar mayusculas")

# Mientras se escribe también se ve en mayúsculas (solo campos textuales del horario).
old="""  dlg.oninput=dlg.onchange=function(e){
    if(e.target && e.target.id!=='plp-f-motivo') _plpPintarConflictos();
    if(e.target && e.target.id==='plp-f-fecha') _plpRepCambio();
  };"""
new="""  dlg.oninput=dlg.onchange=function(e){
    if(e.target && /^(plp-f-(actividad|lugar|responsable|asisten|uniforme|justif|motivo))$/.test(e.target.id||'')){
      const a=e.target.selectionStart, b=e.target.selectionEnd;
      e.target.value=String(e.target.value||'').toLocaleUpperCase('es-BO');
      try{ e.target.setSelectionRange(a,b); }catch(_){}
    }
    if(e.target && e.target.id!=='plp-f-motivo') _plpPintarConflictos();
    if(e.target && e.target.id==='plp-f-fecha') _plpRepCambio();
  };"""
one(old,new,"mayusculas al escribir")

# Marca de versión localizada en este módulo para rastreo.
s=s.replace("// v2.9.419:", "// v2.9.420:", 1) if "// v2.9.419:" in s else s

if s==orig: raise SystemExit("sin cambios")
p.write_text(s,encoding="utf-8")
print("INDEX PATCHED",len(orig),"->",len(s))
