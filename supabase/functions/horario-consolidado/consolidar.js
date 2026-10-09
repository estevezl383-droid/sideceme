function _plpMin(t){
  const m=/^\s*(\d{1,2})\s*[:.hH]\s*(\d{2})/.exec(String(t==null?'':t));
  if(!m) return null;
  const h=+m[1], mi=+m[2];
  return (h>23||mi>59) ? null : h*60+mi;
}
function _plpHHMM(n){ return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'); }
function _plpUnif(cab, idx, txt){
  cab=cab||{};
  if(/DEPORTE|ENTRENAMIENTO F[IÍ]SICO|EFM/i.test(String(txt||''))) return cab.unif_dep||'N° 8';
  return (idx<=2) ? (cab.unif_lmx||'N° 3-C') : (cab.unif_jv||'N° 3-C');
}

// Fila del documento que genera una propuesta aprobada.
function _plpFilaDeProp(k, p, cab, idx){
  const unif=String(p.uniforme||'').trim() || _plpUnif(cab, idx, p.actividad);
  if(k==='planta'){
    return { desde:p.desde, hasta:p.hasta, act:p.actividad, lugar:p.lugar||'',
      asisten:p.asisten||'TODOS', resp:p.responsable||'', unif:unif, span:false, prop:p.id };
  }
  // En los ciclos va como en el horario firmado: el texto ocupa MÓDULO + U.C. +
  // CÓDIGO y conserva LUGAR, UNIFORME y RESPONSABLE (fila `act3`).
  return { desde:p.desde, hasta:p.hasta, modulo:'', uc:p.actividad, codigo:'', lugar:p.lugar||'',
    unif:unif, resp:p.responsable||'', span:false, act3:true, prop:p.id };
}

// Texto comparable: sin dobles espacios, sin may/min.
function _plpNormTxt(t){ return String(t||'').replace(/\s+/g,' ').trim().toUpperCase(); }

// ¿`f` es exactamente la fila del horario base descrita en `mv` (lo que guarda
// planif_propuestas.mueve)? Se compara hora de inicio, hora de fin y texto.
function _plpEsEsaFila(f, mv){
  if(!f || !mv) return false;
  if(String(f.desde||'')!==String(mv.desde||'') || String(f.hasta||'')!==String(mv.hasta||'')) return false;
  return _plpNormTxt(f.act||f.uc)===_plpNormTxt(mv.texto);
}

// ¿Esta fila del horario base es la del Entrenamiento Físico Militar?
// (la del PDF firmado dice «PARTE ... Y ENTRENAMIENTO FÍSICO MILITAR»).
function _plpEsFilaEfm(f){
  return /ENTRENAMIENTO F[IÍ]SICO/i.test(String((f && (f.act || f.uc)) || ''));
}

// Mezcla la base de UN bloque (planta / c1 / c2) con las propuestas aprobadas.
// Devuelve una COPIA; la base guardada no se toca nunca.
//  - Las filas `fijo` (partes, EFM, deportes) no se recortan.
//  - Las demás se recortan o se parten donde cae una aprobada con recortar=true.
//  - Un día escrito como "Día completo" (libre) pasa a banda + filas, como plUsarFilas.
function _plpMezclarBloque(k, bloque, props, cab){
  if(!bloque || !Array.isArray(bloque.dias)) return bloque;
  const out=JSON.parse(JSON.stringify(bloque));
  const aprob=(props||[]).filter(function(p){
    return p.estado==='aprobada' && (p.audiencias||[]).indexOf(k)>=0
      && _plpMin(p.desde)!==null && _plpMin(p.hasta)!==null;
  });
  if(!aprob.length) return out;
  // v2.9.377 — filas del horario base que alguien arrastró a otro día u hora.
  // Ojo: el día del que SALEN no es el mismo al que LLEGAN, por eso van aparte.
  const mudanzas=aprob.filter(function(p){ return p.mueve && p.mueve.fecha; });
  out.dias.forEach(function(d, idx){
    const ps=aprob.filter(function(p){ return p.fecha===d.iso; })
      .sort(function(a,b){ return _plpMin(a.desde)-_plpMin(b.desde); });
    const seVan=mudanzas.filter(function(p){ return p.mueve.fecha===d.iso; });
    if(!ps.length && !seVan.length) return;
    let filas=Array.isArray(d.filas)?d.filas:[];
    const libre=String(d.libre||'').trim();
    if(libre){
      // El documento ignora las filas de un día libre: se conserva solo la banda.
      const f={ desde:'', hasta:'', span:true };
      if(k==='planta') f.act=libre; else f.uc=libre;
      filas=[f]; d.libre='';
    }
    // v2.9.377 — la fila que se arrastró desaparece de su lugar original. Vale
    // también para las `fijo` (E.F.M., partes, deportes), que nunca se recortan.
    if(seVan.length){
      filas=filas.filter(function(f){
        return !seVan.some(function(p){ return _plpEsEsaFila(f, p.mueve); });
      });
    }
    // Compatibilidad v2.9.375: una propuesta marcada 'efm' SIN `mueve` saca el
    // Entrenamiento Físico del día donde aterriza.
    if(ps.some(function(p){ return p.tipo==='efm' && !p.mueve; })){
      filas=filas.filter(function(f){ return !_plpEsFilaEfm(f); });
    }
    const res=[];
    filas.forEach(function(f){
      const a=_plpMin(f.desde), b=_plpMin(f.hasta);
      if(f.fijo || a===null || b===null || b<=a){ res.push(f); return; }
      let segs=[[a,b]];
      ps.forEach(function(p){
        if(p.recortar===false) return;
        const pa=_plpMin(p.desde), pb=_plpMin(p.hasta), nx=[];
        segs.forEach(function(s){
          if(pb<=s[0] || pa>=s[1]){ nx.push(s); return; }
          if(pa>s[0]) nx.push([s[0],pa]);
          if(pb<s[1]) nx.push([pb,s[1]]);
        });
        segs=nx;
      });
      segs.forEach(function(s){
        if(s[0]===a && s[1]===b){ res.push(f); return; }
        const c=Object.assign({}, f);
        c.desde=_plpHHMM(s[0]); c.hasta=_plpHHMM(s[1]); c._recortada=true;
        res.push(c);
      });
    });
    ps.forEach(function(p){
      const row=_plpFilaDeProp(k, p, cab, idx), pm=_plpMin(p.desde);
      let pos=res.length;
      for(let i=0;i<res.length;i++){
        const m=_plpMin(res[i].desde);
        if(m!==null && m>pm){ pos=i; break; }
      }
      res.splice(pos, 0, row);
    });
    d.filas=res;
  });
  return out;
}


export function consolidar(sem, props){
  const out=JSON.parse(JSON.stringify(sem));
  const approved=props.filter(p=>p.estado==='aprobada');
  for(const k of ['planta','c1','c2']){
    const block=_plpMezclarBloque(k,out.datos[k],approved.filter(p=>!p.ocultar_base),out.datos.cab||{});
    if(!block)continue;
    for(const d of block.dias||[]){
      const hidden=approved.filter(p=>p.ocultar_base&&p.mueve&&p.mueve.fecha===d.iso&&(p.audiencias||[]).includes(k));
      d.filas=(d.filas||[]).filter(f=>!hidden.some(p=>_plpEsEsaFila(f,p.mueve)));
      const seen=new Set();
      d.filas=d.filas.filter(f=>{
        const p=approved.find(p=>p.id===f.prop);
        if(p&&p.desde==='00:00'&&p.hasta==='23:59'){f.desde='';f.hasta='';f.span=true;}
        if(f.span){const text=_plpNormTxt(f.act||f.uc);if(seen.has(text))return false;seen.add(text);}
        for(const field of ['act','uc','modulo','codigo','lugar','asisten','resp','unif'])if(f[field]!=null)f[field]=String(f[field]).toLocaleUpperCase('es-BO');
        return true;
      });
      if(d.libre)d.libre=String(d.libre).toLocaleUpperCase('es-BO');
    }
    out.datos[k]=block;
  }
  return out;
}
const esc=v=>String(v||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function utc(day,time){return new Date(day+'T'+time+':00-04:00').toISOString().replace(/[-:]/g,'').replace(/\.000Z$/,'Z');}
function fold(line){let chunks=[],current='',bytes=0;for(const c of line){const n=new TextEncoder().encode(c).length;if(bytes+n>73){chunks.push(current);current=' ';bytes=1;}current+=c;bytes+=n;}chunks.push(current);return chunks.join('\r\n');}
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(16);}
export function calendario(records,audience){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//SIDE-CEME//Semana consolidada//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:SIDE-CEME '+audience,'X-WR-TIMEZONE:America/La_Paz'];
  const audiences=audience==='todos'?['planta','c1','c2']:[audience];
  const labels={planta:'PLANTA',c1:'1ER CICLO',c2:'2DO CICLO'};
  for(const record of records){
    const sem=record.datos;
    for(const scope of audiences){
    for(const day of sem.datos[scope]?.dias||[]){
      const rows=day.libre?[{act:day.libre,span:true}]:(day.filas||[]);
      const duplicates=new Map();
      for(const row of rows){
        const title=row.act||row.uc||row.modulo||'';if(!title)continue;
        const key=hash(day.iso+'|'+title+'|'+(row.codigo||''));const count=duplicates.get(key)||0;duplicates.set(key,count+1);
        const uid=(row.prop?'p'+row.prop:key+'-'+count)+'-'+scope+'-'+sem.id+'@sideceme';
        const full=!(row.desde&&row.hasta);if(!full&&(_plpMin(row.desde)===null||_plpMin(row.hasta)<=_plpMin(row.desde)))continue;
        lines.push('BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+new Date(record.creado_en).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),'SEQUENCE:'+record.id);
        if(full){const end=new Date(day.iso+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1);lines.push('DTSTART;VALUE=DATE:'+day.iso.replace(/-/g,''),'DTEND;VALUE=DATE:'+end.toISOString().slice(0,10).replace(/-/g,''));}
        else lines.push('DTSTART:'+utc(day.iso,row.desde),'DTEND:'+utc(day.iso,row.hasta));
        lines.push('SUMMARY:'+esc(audience==='todos'?'['+labels[scope]+'] '+title:title),'LOCATION:'+esc(row.lugar),'DESCRIPTION:'+esc([row.modulo,row.codigo,row.asisten,row.resp,row.unif].filter(Boolean).join(' · ')),'END:VEVENT');
      }
    }
  }
  }
  lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
