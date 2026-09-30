/* SIDE-CEME v2.9.420 — parche del HORARIO INTEGRADO */
(function(){
  'use strict';
  function MAY(v){ return String(v==null?'':v).toLocaleUpperCase('es-BO'); }
  function mayInput(el){ if(!el)return; var p=el.selectionStart; el.value=MAY(el.value); try{if(p!==null)el.setSelectionRange(p,p);}catch(_){} }
  window._plpMay=MAY; window._plpMayInput=mayInput;

  var vm=document.getElementById('version-marker'); if(vm) vm.textContent='v2.9.420';

  /* Todo lo escrito en el horario sale en MAYÚSCULAS. */
  document.addEventListener('input',function(ev){
    var el=ev.target;
    if(!el || !el.closest || !el.closest('#screen-planif-cal')) return;
    if((el.tagName==='INPUT'||el.tagName==='TEXTAREA') && el.type!=='date' && el.type!=='checkbox'){
      var id=el.id||'';
      if(!/desde|hasta|cierre-h/i.test(id)) mayInput(el);
    }
  },true);
  if(typeof _plpLeerForm==='function'){
    var leer0=_plpLeerForm;
    _plpLeerForm=function(){
      var c=leer0();
      ['actividad','lugar','responsable','asisten','uniforme','motivo'].forEach(function(k){ if(c[k]!=null)c[k]=MAY(c[k]).trim(); });
      return c;
    };
  }

  /* Solo puede_mover modifica propuestas ajenas: Morales, Villarroel y Sof. Arce. */
  _plpPuedeEditar=function(p){
    var u=PLP.perfil||{};
    if(!u || !p || p.estado==='retirada') return false;
    if(u.mover || u.aprobar) return true;
    return !!(u.proponer && p.creado_por===u.id && _plpAbierta(_plpSemanaDe(p.fecha)));
  };

  /* Las eliminaciones del horario base quitan la fila, pero no agregan otra. */
  if(typeof _plpMezclarBloque==='function'){
    var mez0=_plpMezclarBloque;
    _plpMezclarBloque=function(k,bloque,props,cab){
      props=props||[];
      var borran=props.filter(function(p){return p.estado==='aprobada'&&p.ocultar_base&&p.mueve&&(p.audiencias||[]).indexOf(k)>=0;});
      var out=mez0(k,bloque,props.filter(function(p){return !p.ocultar_base;}),cab);
      if(!out||!out.dias)return out;
      out.dias.forEach(function(d){
        var bd=borran.filter(function(p){return p.mueve.fecha===d.iso;});
        if(bd.length) d.filas=(d.filas||[]).filter(function(f){
          return !bd.some(function(p){return _plpEsEsaFila(f,p.mueve);});
        });
        if(d.libre)d.libre=MAY(d.libre);
        (d.filas||[]).forEach(function(f){
          ['act','uc','modulo','codigo','lugar','asisten','resp','unif'].forEach(function(k){
            if(f[k]!=null)f[k]=MAY(f[k]);
          });
        });
      });
      return out;
    };
  }

  /* Eventos base: solo los tres autorizados; EFM conserva su permiso específico. */
  if(typeof _plpArmarEventos==='function'){
    var armar0=_plpArmarEventos;
    _plpArmarEventos=function(){
      var u=PLP.perfil||{};
      return armar0().filter(function(ev){
        if(ev.extendedProps && ev.extendedProps.tipo==='prop' && ev.extendedProps.p && ev.extendedProps.p.ocultar_base) return false;
        if(ev.extendedProps && ev.extendedProps.tipo==='base' && !ev.allDay){
          var f=ev.extendedProps.fila||{};
          var ok=!!(u.mover || (u.efm && _plpEsFilaEfm(f)));
          ev.editable=ok; ev.startEditable=ok; ev.durationEditable=ok;
        }
        return true;
      });
    };
  }
  if(typeof _plpMovido==='function'){
    var mov0=_plpMovido;
    _plpMovido=async function(info){
      var x=info&&info.event&&info.event.extendedProps||{}, u=PLP.perfil||{};
      if(x.tipo==='base'){
        var f=x.fila||{};
        if(!u.mover && !(u.efm&&_plpEsFilaEfm(f))){ if(info&&info.revert)info.revert(); return; }
      }
      return mov0(info);
    };
  }

  /* Jefe de Estudios corrige y aprueba la propuesta en un solo guardado. */
  if(typeof plpAprobar==='function'){
    plpAprobar=async function(){
      var ed=PLP.edit;if(!ed||!ed.p||!ed.p.id)return;
      var p=ed.p, u=PLP.perfil||{};
      if(!u.aprobar)return;
      if(_plpPuedeEditar(p)){
        var c=_plpLeerForm(), e=_plpValidar(c);
        if(e){alert('⚠️ '+e);return;}
        if(JSON.stringify(c)!==ed.original){
          var g=await _plpInvoke('guardar',{id:p.id,version:p.version,campos:c});
          if(!g||!g.ok){alert('❌ '+((g&&g.error)||'No se pudo guardar'));return;}
          p=g.propuesta||p;
          if(p.estado==='aprobada'){PLP.volverSiCancela=false;_plpCerrarModal();_plpRecargar();return;}
        }
      }
      var r=await _plpInvoke('aprobar',{id:p.id,version:p.version});
      if(!r||!r.ok){alert('❌ '+((r&&r.error)||'No se pudo aprobar'));return;}
      PLP.volverSiCancela=false; _plpCerrarModal(); _plpRecargar();
    };
  }

  /* Más altura para que las actividades cortas no se monten visualmente. */
  window.plpAplicarZoom419=function(){
    var el=document.getElementById('plp-cal'); if(!el)return;
    if(!PLP.zoom419){
      try{PLP.zoom419=parseFloat(localStorage.getItem('sideceme_plp_zoom')||'2.05')||2.05;}catch(_){PLP.zoom419=2.05;}
    }
    el.style.setProperty('--plp-slot-h',PLP.zoom419+'em');
  };
  window.plpZoomNormal=function(){PLP.zoom419=2.05;plpZoom419(0);};
  window.plpZoomAmpliado=function(){PLP.zoom419=6;plpZoom419(0);};
  window.plpZoom419=function(d){
    PLP.zoom419=Math.max(1.35,Math.min(8,Math.round(((PLP.zoom419||2.05)+d)*100)/100));
    try{localStorage.setItem('sideceme_plp_zoom',String(PLP.zoom419));}catch(_){}
    plpAplicarZoom419(); if(PLP.cal)PLP.cal.updateSize();
  };
  if(typeof _plpBarra==='function'){
    var bar0=_plpBarra;
    _plpBarra=function(){
      bar0();
      var u=PLP.perfil||{}, el=document.getElementById('plp-barra'); if(!el)return;
      var enc=el.querySelector('.plp-enc-gr');
      if(enc){
        if(!u.mover) enc.remove();
        else {enc.textContent='🔗 ENCAJAR EL DÍA — EDITAR HORAS, TEXTO Y FILAS';}
      }
      if(!el.querySelector('.plp-zoom')){
        var prev=el.querySelector('.plp-prev-gr'), z=document.createElement('div');
        z.className='plp-zoom';
        z.innerHTML='<b>ALTURA DEL HORARIO</b><button type="button" onclick="plpZoom419(-.25)" title="COMPACTAR">−</button><button type="button" onclick="plpZoom419(.25)" title="AMPLIAR">+</button><button class="plp-zoom-label" onclick="plpZoomNormal()">NORMAL</button><button class="plp-zoom-label" onclick="plpZoomAmpliado()">AMPLIADO</button>';
        if(prev) el.insertBefore(z,prev); else el.appendChild(z);
      }
      plpAplicarZoom419();
    };
  }
  if(typeof goPlanifCal==='function'){
    var go0=goPlanifCal;
    goPlanifCal=async function(fecha){var r=await go0(fecha);if(PLP.cal){
      var mount=PLP.cal.getOption('eventDidMount');
      function layout(a){if(mount)mount(a);var h=a.el.closest('.fc-timegrid-event-harness');if(h)h.classList.remove('plp-h-base','plp-h-prop');a.el.title=MAY(a.event.title||'');}
      PLP.cal.setOption('eventDidMount',layout);
      document.querySelectorAll('#plp-cal .fc-timegrid-event-harness').forEach(function(h){h.classList.remove('plp-h-base','plp-h-prop');});
    }setTimeout(plpAplicarZoom419,0);return r;};
  }

  /* Botón directo al editor del día al tocar una fila gris. */
  if(typeof _plpAbrir==='function'){
    var abrir0=_plpAbrir;
    _plpAbrir=function(ev){
      abrir0(ev);
      var x=ev&&ev.extendedProps||{}, u=PLP.perfil||{};
      if(x.tipo!=='base'||!u.mover||!ev.start)return;
      var f=x.fila||{}; if(!f.desde||!f.hasta)return;
      var dlg=document.getElementById('plp-dlg'); if(!dlg||dlg.querySelector('.plp-editar-dia419'))return;
      var b=document.createElement('button'); b.className='plp-enc-gr plp-editar-dia419';
      b.textContent='✏️ EDITAR HORAS, TEXTO, AGREGAR O QUITAR FILAS DE ESTE DÍA';
      b.onclick=function(){_plpCerrarModal();plpEncajarAbrir(_plpIso(ev.start));};
      dlg.appendChild(b);
    };
  }

  /* ENCAJAR: ahora es editor manual completo, además de los dos modos automáticos. */
  var encAbr0=typeof plpEncajarAbrir==='function'?plpEncajarAbrir:null;
  if(encAbr0){
    plpEncajarAbrir=function(iso){
      if(!(PLP.perfil||{}).mover)return;
      encAbr0(iso);
      if(PLP.enc){PLP.enc.modo='manual';PLP.enc.manual=false;PLP.enc.calc=null;_plpEncajarPintar();}
    };
  }
  plpEncajarDia=function(iso){if(PLP.enc){if(PLP.enc.saving)return; if(cambios(PLP.enc.calc||[]).length&&!confirm('¿DESCARTAR LOS CAMBIOS SIN GUARDAR DE ESTE DÍA?')){_plpEncajarPintar();return;} PLP.enc.iso=iso;PLP.enc.modo='manual';PLP.enc.manual=false;PLP.enc.calc=null;_plpEncajarPintar();}};
  plpEncajarModo=function(m){var e=PLP.enc;if(!e||e.saving)return;var filas=e.calc.filter(function(x){return !x.eliminar;}).slice().sort(function(a,b){return a.na-b.na;});var cur=null;filas.forEach(function(x,i){if(m==='correr'&&cur!==null&&x.na<cur){var dur=x.nz-x.na;x.na=cur;x.nz=cur+dur;}if(m==='recortar'&&filas[i+1]&&x.nz>filas[i+1].na&&filas[i+1].na-x.na>=5)x.nz=filas[i+1].na;cur=cur===null?x.nz:Math.max(cur,x.nz);});e.modo=m;e.manual=true;_plpEncajarPintar();};

  window._plpEncFilaHora=function(i,campo,el){
    var e=PLP.enc,x=e&&e.calc&&e.calc[i];if(!x||!el)return;
    var v=_plpNormHora(el.value),m=_plpMin(v);if(m===null){el.focus();return;}
    el.value=v;x[campo]=m;x.saved=false;x.manual=true;e.manual=true;_plpEncajarPintar();
  };
  window._plpEncFilaTexto=function(i,el){
    var e=PLP.enc,x=e&&e.calc&&e.calc[i];if(!x||!el)return;
    mayInput(el);x.txt=MAY(el.value).trim();x.saved=false;x.manual=true;e.manual=true;
  };
  window.plpEncFilaDur=function(i,d){
    var e=PLP.enc,x=e&&e.calc&&e.calc[i];if(!x||x.eliminar)return;
    x.nz=Math.max(x.na+5,Math.min(1439,x.nz+d));x.saved=false;x.manual=true;e.manual=true;_plpEncajarPintar();
  };
  window.plpEncFilaBorrar=function(i){
    var e=PLP.enc,x=e&&e.calc&&e.calc[i];if(!x)return;
    if(x.tipo==='nueva')e.calc.splice(i,1);else{x.eliminar=!x.eliminar;x.saved=false;x.manual=true;}
    e.manual=true;_plpEncajarPintar();
  };
  window.plpEncFilaAgregar=function(){
    var e=PLP.enc;if(!e)return;if(!Array.isArray(e.calc))e.calc=[];
    var a=e.calc.filter(function(x){return !x.eliminar;}),ini=a.length?Math.max.apply(null,a.map(function(x){return x.nz;})):480;
    if(!isFinite(ini)||ini>1405)ini=480;
    e.calc.push({tipo:'nueva',a:ini,z:ini+30,na:ini,nz:ini+30,txt:'NUEVA ACTIVIDAD',origTxt:'',v:(PLP.vista==='todas'?'planta':PLP.vista),nueva:true});
    e.calc.sort(function(x,y){return x.na-y.na;});e.manual=true;_plpEncajarPintar();
  };
  window.plpEncFilaMover=function(i,delta){
    var e=PLP.enc;if(!e||e.saving)return;var x=e.calc[i],filas=e.calc.filter(function(r){return !r.eliminar;}).sort(function(a,b){return a.na-b.na;});var j=filas.indexOf(x),y=filas[j+delta];if(!y)return;
    var primero=delta<0?y:x,segundo=delta<0?x:y,inicio=primero.na,d1=primero.nz-primero.na,d2=segundo.nz-segundo.na,gap=Math.max(0,segundo.na-primero.nz);
    segundo.na=inicio;segundo.nz=inicio+d2;primero.na=segundo.nz+gap;primero.nz=primero.na+d1;
    x.saved=false;y.saved=false;e.manual=true;e.calc.sort(function(a,b){return a.na-b.na;});_plpEncajarPintar();
  };
  function cambios(r){return r.filter(function(x){return !x.saved&&(x.eliminar||x.tipo==='nueva'||x.na!==x.a||x.nz!==x.z||MAY(x.txt)!==MAY(x.origTxt===undefined?x.txt:x.origTxt));});}
  function choques(r){var a=r.filter(function(x){return !x.eliminar;}).slice().sort(function(x,y){return x.na-y.na||x.nz-y.nz;}),o=[];for(var i=0;i<a.length-1;i++)if(a[i].nz>a[i+1].na)o.push([a[i],a[i+1]]);return o;}

  _plpEncajarPintar=function(){
    var e=PLP.enc;if(!e)return;
    var oldMotivo=document.getElementById('plp-enc-motivo');if(oldMotivo)e.motivo=MAY(oldMotivo.value);
    var bl=_plpBloquesDia(e.iso).filter(function(x){return !(x.p&&x.p.ocultar_base);});
    if(!e.manual||!Array.isArray(e.calc)){
      e.calc=(e.modo==='manual'?bl.map(function(x){return Object.assign({},x,{na:x.a,nz:x.z});}):_plpEncajarCalc(bl,e.modo)).map(function(x){x.origTxt=x.txt;x.txt=MAY(x.txt);x.eliminar=false;return x;});
    }
    var r=e.calc,chg=cambios(r),bad=r.filter(function(x){return !x.eliminar&&(x.nz<=x.na||x.nz>1439||!String(x.txt||'').trim());}),col=choques(r);
    var nombre=function(x){return _plDiaNombre(x)+' '+_plDiaNum(x);};
    var h='<div class="plp-dlg-h">🔗 ENCAJAR EL DÍA — EDITAR TODO DESDE AQUÍ</div>'
      +'<div class="pl-hint" style="margin:0 0 8px">CAMBIÁ <b>HORAS</b>, <b>DURACIÓN</b> Y <b>TEXTO</b>; TAMBIÉN PODÉS <b>AGREGAR</b> O <b>QUITAR</b> FILAS.</div>'
      +'<label class="pl-full">DÍA<select class="pl-i" onchange="plpEncajarDia(this.value)">'
      +e.dias.map(function(x){return '<option value="'+x+'"'+(x===e.iso?' selected':'')+'>'+_plEsc(MAY(nombre(x)))+(e.conChoque.indexOf(x)>=0?'  ⚠️ HAY CASILLAS ENCIMADAS':'  ✅ YA ESTÁ BIEN')+'</option>';}).join('')
      +'</select></label><div class="plp-enc-modo">'
      +'<button class="pl-tab'+(e.modo==='recortar'?' on':'')+'" onclick="plpEncajarModo(\'recortar\')">✂️ RECORTAR AUTOMÁTICAMENTE</button>'
      +'<button class="pl-tab'+(e.modo==='correr'?' on':'')+'" onclick="plpEncajarModo(\'correr\')">➡️ CORRER AUTOMÁTICAMENTE</button></div>'
      +'<div class="plp-enc-t"><table><tr><th></th><th>AHORA</th><th>DESDE</th><th>HASTA</th><th>DURA</th><th>ACTIVIDAD</th><th>ACCIONES</th></tr>'
      +r.map(function(x,i){
        var cam=cambios([x]).length>0,mal=!x.eliminar&&(x.nz<=x.na||x.nz>1439||!String(x.txt||'').trim());
        return '<tr class="'+(cam?'plp-enc-cam ':'')+(mal?'plp-enc-mal ':'')+(x.eliminar?'plp-enc-del ':'')+(x.tipo==='nueva'?'plp-enc-new':'')+'">'
        +'<td>'+(x.tipo==='base'?'▦':(x.tipo==='nueva'?'➕':'🔵'))+'</td><td>'+(x.tipo==='nueva'?'—':(_plpHHMM(x.a)+'–'+_plpHHMM(x.z)))+'</td>'
        +'<td><input class="pl-i plp-enc-hora" value="'+_plpHHMM(x.na)+'" onchange="_plpEncFilaHora('+i+',\'na\',this)"'+(x.eliminar?' disabled':'')+'></td>'
        +'<td><input class="pl-i plp-enc-hora" value="'+_plpHHMM(x.nz)+'" onchange="_plpEncFilaHora('+i+',\'nz\',this)"'+(x.eliminar?' disabled':'')+'></td>'
        +'<td><b>'+_plEsc(_plpDur(x.nz-x.na))+'</b></td><td><input class="pl-i plp-enc-act" value="'+_plEsc(MAY(x.txt||''))+'" oninput="_plpEncFilaTexto('+i+',this)"'+(x.eliminar?' disabled':'')+'></td>'
        +'<td class="plp-enc-ops"><button onclick="plpEncFilaDur('+i+',-5)"'+(x.eliminar?' disabled':'')+'>−5</button><button onclick="plpEncFilaDur('+i+',5)"'+(x.eliminar?' disabled':'')+'>+5</button>'
        +'<button title="MOVER ARRIBA" onclick="plpEncFilaMover('+i+',-1)">↑</button><button title="MOVER ABAJO" onclick="plpEncFilaMover('+i+',1)">↓</button><button onclick="plpEncFilaBorrar('+i+')">'+(x.eliminar?'↩️':'🗑️')+'</button></td></tr>';
      }).join('')+'</table></div><button class="plp-enc-add" onclick="plpEncFilaAgregar()">➕ AGREGAR FILA A ESTE DÍA</button>';
    if(col.length)h+='<div class="plp-av plp-av-err">⚠️ TODAVÍA HAY <b>'+col.length+'</b> SUPERPOSICIÓN(ES). CORREGÍ LAS HORAS ANTES DE GUARDAR.</div>';
    if(bad.length)h+='<div class="plp-av plp-av-err">⚠️ HAY '+bad.length+' FILA(S) CON HORA O TEXTO INVÁLIDO.</div>';
    h+='<label class="pl-full plp-justif">📝 MOTIVO DEL REACOMODO<textarea class="pl-i" id="plp-enc-motivo" rows="2" oninput="_plpMayInput(this)">' + _plEsc(e.motivo||'REACOMODO DEL HORARIO PARA EVITAR SUPERPOSICIONES.') + '</textarea></label>'
      +'<div class="plp-av plp-av-pend">SE VAN A GUARDAR <b>'+chg.length+'</b> CAMBIO(S). LAS FILAS GRISES QUEDAN COMO PROPUESTA HASTA SU APROBACIÓN.</div>';
    h+='<div class="plp-btns">'+'<button class="btn-primary pl-b" onclick="plpEncajarAplicar()">💾 GUARDAR CAMBIOS DEL DÍA</button>'
      +'<span style="flex:1"></span><button class="pl-add" onclick="_plpCerrarModal()">CERRAR</button></div><div id="plp-enc-res"></div>';
    _plpModal(h);var dlg=document.getElementById('plp-dlg');if(dlg)dlg.classList.add('plp-dlg-wide');
  };

  plpEncajarAplicar=async function(){
    var e=PLP.enc,u=PLP.perfil||{};if(!e||e.saving||!Array.isArray(e.calc)||!u.mover)return;
    var t=document.getElementById('plp-enc-motivo'),motivo=MAY(t?String(t.value).trim():'');
    var chg=cambios(e.calc);if(!chg.length)return;
    if(choques(e.calc).length){alert('⚠️ TODAVÍA HAY CASILLAS ENCIMADAS. CORREGÍ LAS HORAS.');return;}
    if(e.calc.some(function(x){return !x.eliminar&&(x.nz<=x.na||x.nz>1439||!String(x.txt||'').trim());})){alert('⚠️ HAY UNA FILA CON HORA O TEXTO INVÁLIDO.');return;}
    if(!confirm('¿GUARDAR '+chg.length+' CAMBIO(S) DEL '+MAY(_plDiaNombre(e.iso)+' '+_plDiaNum(e.iso))+'?'))return;
    var res=document.getElementById('plp-enc-res');if(res)res.innerHTML='<div class="pl-hint">⏳ GUARDANDO...</div>';
    e.saving=true; var dlg=document.getElementById('plp-dlg');if(dlg)dlg.querySelectorAll('button,input,textarea,select').forEach(function(el){el.disabled=true;});
    var ok=0,fallos=[];
    for(var q=0;q<chg.length;q++){
      var x=chg[q],rr=null;
      if(x.eliminar){
        if(x.tipo==='prop') rr=await _plpInvoke('retirar',{id:x.p.id,version:x.p.version});
        else if(x.tipo==='base'){
          var f=x.fila;
          rr=await _plpInvoke('guardar',{campos:{fecha:e.iso,desde:f.desde,hasta:f.hasta,actividad:MAY(x.origTxt||x.txt),lugar:MAY(f.lugar||''),responsable:MAY(f.resp||''),asisten:MAY(f.asisten||'TODOS'),uniforme:MAY(f.unif||''),audiencias:[x.v],recortar:false,motivo:motivo,mueve:{fecha:e.iso,desde:f.desde,hasta:f.hasta,texto:MAY(x.origTxt||x.txt)},ocultar_base:true}});
        }
      }else if(x.tipo==='prop'){
        rr=await _plpInvoke('guardar',{id:x.p.id,version:x.p.version,campos:{desde:_plpHHMM(x.na),hasta:_plpHHMM(x.nz),actividad:MAY(x.txt),motivo:motivo}});
      }else if(x.tipo==='base'){
        var f2=x.fila;
        if(_plpEsFilaEfm(f2)&&!u.efm){fallos.push(MAY(x.txt).slice(0,34)+': EL E.F.M. SOLO LO MUEVEN SUS ENCARGADOS');continue;}
        rr=await _plpInvoke('guardar',{campos:{fecha:e.iso,desde:_plpHHMM(x.na),hasta:_plpHHMM(x.nz),actividad:MAY(x.txt),lugar:MAY(f2.lugar||''),responsable:MAY(f2.resp||''),asisten:MAY(f2.asisten||'TODOS'),uniforme:MAY(f2.unif||''),audiencias:[x.v],recortar:true,motivo:motivo,mueve:{fecha:e.iso,desde:f2.desde,hasta:f2.hasta,texto:MAY(x.origTxt||x.txt)},ocultar_base:false}});
      }else if(x.tipo==='nueva'){
        rr=await _plpInvoke('guardar',{campos:{fecha:e.iso,desde:_plpHHMM(x.na),hasta:_plpHHMM(x.nz),actividad:MAY(x.txt),lugar:'',responsable:MAY(u.seccion?u.seccion+'.':''),asisten:'TODOS',uniforme:'',audiencias:[x.v],recortar:true,motivo:motivo,ocultar_base:false}});
      }
      if(rr&&rr.ok){ok++;x.saved=true;if(rr.propuesta){x.p=rr.propuesta;x.tipo='prop';}x.a=x.na;x.z=x.nz;x.origTxt=x.txt;}else fallos.push(MAY(x.txt).slice(0,34)+': '+((rr&&rr.error)||'ERROR'));
    }
    if(res)res.innerHTML='<div class="plp-av '+(fallos.length?'plp-av-err':'plp-av-ok')+'">✅ '+ok+' CAMBIO(S) GUARDADO(S).'+(fallos.length?'<br>⚠️ NO SE PUDO CON:<br>'+fallos.map(_plEsc).join('<br>'):'')+'</div>';
    e.saving=false;if(dlg)dlg.querySelectorAll('button,input,textarea,select').forEach(function(el){el.disabled=false;});_plpRecargar();if(!fallos.length)setTimeout(_plpCerrarModal,900);
  };
})();

/* v2.9.421 — duplicar actividades y planificación directa. */
(function(){
  'use strict';
  function may(v){return String(v==null?'':v).toLocaleUpperCase('es-BO');}
  function todo(p){return p&&p.desde==='00:00'&&p.hasta==='23:59';}
  var abrir=_plpAbrir;
  _plpAbrir=function(ev){
    abrir(ev);
    if(!(PLP.perfil||{}).proponer)return;
    PLP.duplicarOrigen=ev;
    var dlg=document.getElementById('plp-dlg');if(!dlg)return;
    var b=document.createElement('button');b.className='btn-primary pl-b';b.type='button';b.textContent='📋 DUPLICAR ACTIVIDAD';b.onclick=plpDuplicarAbrir;dlg.appendChild(b);
  };
  window.plpDuplicarAbrir=function(){
    var ev=PLP.duplicarOrigen;if(!ev)return;var x=ev.extendedProps||{},p=x.p||{},f=x.fila||{};
    PLP.duplicar={actividad:may(p.actividad||ev.title),lugar:may(p.lugar||f.lugar||''),responsable:may(p.responsable||f.resp||''),asisten:may(p.asisten||f.asisten||'TODOS'),uniforme:may(p.uniforme||f.unif||''),audiencias:p.audiencias||[PLP.vista==='todas'?'planta':PLP.vista]};
    var dia=_plpIso(ev.start),all=!!ev.allDay||todo(p),desde=p.desde||f.desde||'08:00',hasta=p.hasta||f.hasta||'09:00';
    _plpModal('<div class="plp-dlg-h">📋 DUPLICAR ACTIVIDAD</div><div class="plp-dato-t">'+_plEsc(PLP.duplicar.actividad)+'</div><label class="pl-full">DÍA DE DESTINO<input class="pl-i" type="date" id="plp-dup-dia" value="'+dia+'"></label><label><input type="checkbox" id="plp-dup-todo" onchange="plpDuplicarTodo()"'+(all?' checked':'')+'> TODO EL DÍA</label><div id="plp-dup-horas"><label>DESDE<input class="pl-i" type="time" id="plp-dup-desde" value="'+desde+'"></label><label>HASTA<input class="pl-i" type="time" id="plp-dup-hasta" value="'+hasta+'"></label></div><label class="pl-full">MOTIVO<textarea class="pl-i" id="plp-dup-motivo" oninput="_plpMayInput(this)">DUPLICACIÓN DE ACTIVIDAD EN EL HORARIO.</textarea></label><div class="pl-hint">'+((PLP.perfil||{}).mover?'SE APLICA DIRECTAMENTE Y APARECE EN PLOMO.':'SE CREA UNA NUEVA SUGERENCIA PARA APROBACIÓN.')+'</div><div class="plp-btns"><button class="btn-primary pl-b" id="plp-dup-guardar" onclick="plpDuplicarGuardar()">DUPLICAR</button><button class="pl-add" onclick="_plpCerrarModal()">CANCELAR</button></div><div id="plp-dup-res"></div>');plpDuplicarTodo();
  };
  window.plpDuplicarTodo=function(){var all=document.getElementById('plp-dup-todo').checked;document.getElementById('plp-dup-horas').hidden=all;};
  window.plpDuplicarGuardar=async function(){
    var src=PLP.duplicar;if(!src||src.guardando)return;
    var all=document.getElementById('plp-dup-todo').checked,c=Object.assign({},src,{fecha:document.getElementById('plp-dup-dia').value,desde:all?'00:00':document.getElementById('plp-dup-desde').value,hasta:all?'23:59':document.getElementById('plp-dup-hasta').value,motivo:may(document.getElementById('plp-dup-motivo').value),recortar:false});delete c.guardando;
    var err=_plpValidar(c);if(err){alert(may(err));return;}
    src.guardando=true;var b=document.getElementById('plp-dup-guardar');b.disabled=true;
    try{var r=await _plpInvoke('guardar',{campos:c});if(!r||!r.ok){document.getElementById('plp-dup-res').textContent=may(r&&r.error||'NO SE PUDO DUPLICAR');return;}PLP.duplicar=null;_plpCerrarModal();_plpRecargar();}
    finally{src.guardando=false;if(b.isConnected)b.disabled=false;}
  };
  var eventos=_plpArmarEventos;
  _plpArmarEventos=function(){return eventos().map(function(ev){var x=ev.extendedProps||{},p=x.p;if(p&&todo(p)){ev.start=p.fecha;delete ev.end;ev.allDay=true;ev.editable=false;ev.startEditable=false;ev.durationEditable=false;}
    if(p&&p.estado==='aprobada'&&['P030','P032','S002'].indexOf(p.creado_por)>=0){x.cls=(x.cls||[]).filter(function(c){return c!=='plp-aprobada'&&c!=='plp-pendiente';}).concat(['plp-planificacion-directa']);}
    ev.title=may(ev.title);return ev;});};
  var bloques=_plpBloquesDia;
  _plpBloquesDia=function(iso){return bloques(iso).filter(function(x){return !todo(x.p);});};
  var fila=_plpFilaDeProp;
  _plpFilaDeProp=function(k,p,cab,idx){var f=fila(k,p,cab,idx);if(todo(p)){f.desde='';f.hasta='';f.span=true;}return f;};
  var form=_plpForm;
  _plpForm=function(p,aviso){form(p,aviso);if((PLP.perfil||{}).mover){var dlg=document.getElementById('plp-dlg');if(dlg)dlg.querySelectorAll('.plp-av').forEach(function(e){if(/hasta que|al aprobarse/i.test(e.textContent))e.textContent='LOS CAMBIOS DE PLANIFICACIÓN SE APLICAN DIRECTAMENTE AL GUARDAR.';});}};
  var pintar=_plpEncajarPintar;
  _plpEncajarPintar=function(){pintar();if((PLP.perfil||{}).mover){var d=document.getElementById('plp-dlg');if(d)d.querySelectorAll('.plp-av-pend').forEach(function(el){el.textContent='LOS CAMBIOS SE APLICAN DIRECTAMENTE Y QUEDAN EN PLOMO.';});}};
  var vm=document.getElementById('version-marker');if(vm)vm.textContent='v2.9.421';
})();

/* v2.9.422 — revisión editable, planificación sin etiquetas y avisos propios. */
(function(){
  'use strict';
  var editores=['P030','P032','S002'];
  function directa(p){return !!(p&&p.estado==='aprobada'&&editores.indexOf(p.creado_por)>=0);}
  window._plpEsDirecta=directa;
  var contenido=_plpContenido;
  _plpContenido=function(a){
    if(directa((a.event.extendedProps||{}).p)){
      var ev=a.event;
      return contenido({timeText:a.timeText,event:{start:ev.start,end:ev.end,title:ev.title,extendedProps:{tipo:'base'}}});
    }
    return contenido(a);
  };
  var eventos=_plpArmarEventos;
  _plpArmarEventos=function(){
    var out=eventos();
    out.forEach(function(ev){if(directa((ev.extendedProps||{}).p))ev.extendedProps.cls=['plp-base','plp-planificacion-directa'].concat(ev.allDay?['plp-franja']:[]);});
    // Una duplicación de la misma banda de día completo se muestra una sola vez.
    return out.filter(function(ev){return !(ev.allDay&&ev.extendedProps.tipo==='base'&&out.some(function(p){return p.allDay&&p.extendedProps.tipo==='prop'&&directa(p.extendedProps.p)&&p.start===ev.start&&_plpNormTxt(p.title)===_plpNormTxt(ev.title);}));});
  };
  var form=_plpForm;
  _plpForm=function(p,aviso){
    form(p,aviso);
    var dlg=document.getElementById('plp-dlg');if(!dlg)return;
    if(directa(p)){
      dlg.querySelectorAll('.plp-quien,.plp-av-just').forEach(function(el){el.remove();});
      var pill=dlg.querySelector('.plp-pill');if(pill)pill.textContent='HORARIO';
    }
    if((PLP.perfil||{}).mover){
      dlg.querySelectorAll('button').forEach(function(b){if(b.getAttribute('onclick')==='plpGuardar()'&&!p.id)b.textContent='💾 GUARDAR EN EL HORARIO';});
    }
  };

  var avisos=[],leidos=new Set(),usuario=null,busy=false,timer=null;
  function key(){return 'sideceme_horario_avisos_'+usuario;}
  function quitar(){document.querySelectorAll('.plp-alerta-personal').forEach(function(el){el.remove();});}
  function pendientes(){return avisos.filter(function(a){return !leidos.has(String(a.id));});}
  function pintar(){
    quitar();var lista=pendientes();if(!lista.length)return;
    var sc=document.querySelector('.screen.active');if(!sc)return;
    var cont=sc.querySelector('.menu-container')||sc.querySelector('.disc-container');
    if(!cont&&sc.id==='screen-planif-cal')cont=document.getElementById('plp-aviso');
    if(!cont)return;
    var b=document.createElement('button');b.type='button';b.className='plp-alerta-personal';
    b.textContent='🔴 TIENES '+lista.length+' AVISO(S) SOBRE TU SOLICITUD DE HORARIO — REVISAR';
    b.onclick=window.plpAvisosAbrir;cont.prepend(b);
  }
  window.plpAvisosActualizar=async function(){
    if(busy||document.hidden)return;
    var tok=getTokenSesion();if(!tok){quitar();usuario=null;return;}
    busy=true;
    try{
      var perfil=await _plpPerfil();if(!perfil){quitar();return;}
      if(usuario!==perfil.id){usuario=perfil.id;avisos=[];try{leidos=new Set(JSON.parse(localStorage.getItem(key())||'[]'));}catch(_){leidos=new Set();}}
      var r=await _plpInvoke('avisos');if(getTokenSesion()!==tok)return;
      if(r&&r.ok){avisos=r.avisos||[];pintar();}
    }finally{busy=false;}
  };
  window.plpAvisosAbrir=function(){
    var lista=pendientes();
    _plpModal('<div class="plp-dlg-h">🔴 RESPUESTA A TU SOLICITUD DE HORARIO</div>'+lista.map(function(a){
      var p=a.despues||{},ant=a.antes||{},cambio=ant.fecha!==p.fecha||ant.desde!==p.desde||ant.hasta!==p.hasta;
      return '<div class="plp-av plp-av-err"><b>'+_plEsc(p.estado==='rechazada'?'❌ SOLICITUD RECHAZADA':(cambio?'⏰ HORARIO MODIFICADO Y APROBADO':'✅ SOLICITUD APROBADA'))+'</b><p>'+_plEsc(p.actividad)+'</p><p>'+_plEsc(p.fecha+' · '+p.desde+'–'+p.hasta)+'</p>'
        +(cambio?'<p>ANTES: '+_plEsc(ant.fecha+' · '+ant.desde+'–'+ant.hasta)+'</p>':'')
        +(p.motivo_rechazo?'<p>MOTIVO: '+_plEsc(p.motivo_rechazo)+'</p>':'')
        +'<p>'+_plEsc(a.autoridad||'JEFATURA DE ESTUDIOS')+'</p><button class="pl-add" onclick="plpAvisoVer('+Number(a.id)+')">VER ACTIVIDAD</button> <button class="btn-primary pl-b" onclick="plpAvisoLeido('+Number(a.id)+')">ENTENDIDO</button></div>';
    }).join('')+'<button class="pl-add" onclick="_plpCerrarModal()">CERRAR</button>');
  };
  window.plpAvisoVer=async function(id){
    var a=avisos.find(function(x){return Number(x.id)===id;});if(!a)return;
    await goPlanifCal(a.propuesta.fecha);_plpForm(a.propuesta);
  };
  window.plpAvisoLeido=function(id){
    leidos.add(String(id));try{localStorage.setItem(key(),JSON.stringify(Array.from(leidos).slice(-500)));}catch(_){}
    pintar();if(pendientes().length)plpAvisosAbrir();else _plpCerrarModal();
  };
  var boton=_plpBoton;
  _plpBoton=async function(){await boton();await plpAvisosActualizar();if(!timer)timer=setInterval(plpAvisosActualizar,30000);};
  var barra=_plpBarra;
  _plpBarra=function(){barra();pintar();};
  var vm=document.getElementById('version-marker');if(vm)vm.textContent='v2.9.422';
})();
