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
    if(u.mover) return true;
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

  /* Jefe de Estudios aprueba/rechaza; no guarda cambios sobre ficha ajena. */
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
