// Presentación breve de los campos preliminares. Nunca modifica la hoja fuente.
const limpiar=s=>String(s||'').replace(/\s+SIN DATO\s*[—–-]\s*verificar\.?\s*$/i,'').trim();
const punto=s=>s&&!/[.!?]$/.test(s)?s+'.':s;
function primeraFrase(s){return s.replace(/\b(DIV|MEC|BRIG|GRAL|No|Nro|Esc|Dpto|Prov|Tcnl|Cnl)\.(?=\s)/gi,'$1\uE000').split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ])/u)[0].replace(/\uE000/g,'.').trim()}
function objeto(s,spec,cfg){
 s=limpiar(s);
 // Solo abreviar el preámbulo de emisión; los asuntos ya escritos se conservan.
 if(!/^(?:Emisi[oó]n|Elaboraci[oó]n) de (?:la |el )?/i.test(s))return primeraFrase(s);
 const mision=(spec.secciones||[]).find(n=>/^MISI[ÓO]N\.?$/i.test(n.titulo||''))?.texto||'';
 const unidad=String(cfg.unidad||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const accion=unidad?mision.match(new RegExp('^(?:La|El)\\s+'+unidad+'\\s+(defiende|ataca)\\b','i'))?.[1]:null;
 const tipo=accion?(/^defiende$/i.test(accion)?'Defensivas':'Ofensivas'):null;
 if(tipo&&cfg.unidad)return `La ${cfg.unidad} en la ejecución de Operaciones ${tipo}.`;
 return punto(primeraFrase(s).split(/\s+para\s+/i)[0]);
}
function carta(s){
 s=limpiar(s).replace(/^Carta\s+/i,'');
 const escala=s.match(/(?:,?\s*(?:a\s+)?(?:escala|esc\.)\s*)(1\s*:\s*[\d.,]+)/i);
 if(escala)return punto(s.slice(0,escala.index).trim()+', Esc. '+escala[1].replace(/\s/g,'').replace(/[.,]$/,''));
 return primeraFrase(s);
}
function anexos(s){
 s=limpiar(s);
 const entradas=[...s.matchAll(/(?:\bAnexo\s+[“"]?|[“"])([A-Z]|\d+)[”"]?\s+/gi)];
 if(!entradas.length)return s.split('\n').map(primeraFrase).join('\n');
 return entradas.map((m,i)=>{
  let nombre=s.slice(m.index+m[0].length,entradas[i+1]?.index??s.length).replace(/\s+y\s*$/i,'');
  nombre=primeraFrase(nombre).replace(/\s+de la Orden(?:\s+General)?\s+de Operaciones\b.*$/i,'').trim();
  return `“${m[1]}” ${punto(nombre)}`;
 }).join('\n');
}
export function textoOCA(rotulo,texto,spec={},cfg={}){
 const r=String(rotulo||'').replace(/[:.]/g,'').trim().toUpperCase();
 if(r==='OBJETO')return objeto(texto,spec,cfg);
 if(/^CARTAS?$/.test(r))return carta(texto);
 if(/^ANEXOS?$/.test(r))return anexos(texto);
 return texto;
}
