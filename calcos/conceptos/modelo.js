// Formulario y composición gráfica. No deduce tareas, fases ni relaciones.
export const GRUPOS = ['superior2', 'superior1', 'maniobra', 'apoyo', 'spac']
export const NOMBRES = { superior2: 'Dos escalones arriba', superior1: 'Superior inmediato', maniobra: 'Maniobra y unidad propia', apoyo: 'Apoyo de combate', spac: 'SPAC' }
export const ESC = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))
export function normalizarConceptos(valor) {
  const v = valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {}
  return { ...v, esquema: 'conceptos-v1', unidades: Array.isArray(v.unidades) ? v.unidades : [], relaciones: Array.isArray(v.relaciones) ? v.relaciones : [] }
}
export function antecedentesConceptos(valor) {
  return Object.entries(valor || {}).filter(([k,v]) => !['esquema','unidades','relaciones'].includes(k) && typeof v === 'string')
}
export function tieneConceptos(v) { return normalizarConceptos(v).unidades.some(u => String(u.nombre || '').trim()) }
export function validarConceptos(valor) {
  const v = normalizarConceptos(valor), errores = [], ids = new Set()
  for (const u of v.unidades) {
    if (!u.id || ids.has(u.id)) errores.push('Identificador de unidad ausente o repetido.')
    ids.add(u.id)
    if (String(u.nombre || '').length > 54) errores.push('La denominación admite hasta 54 caracteres; use una abreviatura institucional.')
    if (String(u.magnitud || '').length > 8 || String(u.rol || '').length > 8) errores.push('Magnitud y rótulo admiten hasta 8 caracteres.')
    if (!GRUPOS.includes(u.grupo)) errores.push('Grupo de unidad inválido.')
  }
  for (const g of ['superior2','superior1']) if (v.unidades.filter(u => u.grupo === g).length > 1) errores.push(`Sólo se admite un registro para ${NOMBRES[g]}.`)
  for (const r of v.relaciones) {
    if (!ids.has(r.desde) || !ids.has(r.hasta) || r.desde === r.hasta) errores.push('Relación con extremos inválidos.')
    if (!['directa','indirecta'].includes(r.tipo)) errores.push('Tipo de relación inválido.')
  }
  return errores
}
export function nuevaUnidad(id, grupo = 'maniobra') {
  return { id, grupo, nombre: '', magnitud: '', simbolo: '', rol: '', esfuerzo: false, tarea: '', proposito: '', fases: [] }
}
export function eliminarUnidad(valor, id) {
  const v = normalizarConceptos(valor)
  return { ...v, unidades: v.unidades.filter(u => u.id !== id), relaciones: v.relaciones.filter(r => r.desde !== id && r.hasta !== id) }
}
// Longitudes conservadoras para que nunca se corte una palabra larga o un párrafo.
export function envolver(texto, limite = 32) {
  const resultado = []
  for (const parrafo of String(texto || 'SIN DATO').split(/\r?\n/)) {
    let linea = ''
    for (let palabra of parrafo.split(/\s+/).filter(Boolean)) {
      if (linea && (linea.length + palabra.length + 1 > limite)) { resultado.push(linea); linea = '' }
      while (palabra.length > limite) { if (linea) { resultado.push(linea); linea = '' }; resultado.push(palabra.slice(0, limite)); palabra = palabra.slice(limite) }
      if (palabra) linea = linea ? `${linea} ${palabra}` : palabra
    }
    resultado.push(linea)
  }
  return resultado
}
function lineasUnidad(u) {
  const lineas = []
  const campo = (k, v) => lineas.push(...envolver(`${k}: ${v || 'SIN DATO'}`, 29))
  campo('T', u.tarea); campo('P', u.proposito)
  for (const f of u.fases || []) {
    lineas.push(...envolver(f.nombre || 'FASE SIN IDENTIFICAR', 29))
    campo('T', f.tarea); campo('P', f.proposito)
    for (const k of ['pt','pe','paf','efecto']) if (f[k]) campo(k.toUpperCase(), f[k])
  }
  return lineas
}
const texto = (x,y,t,size=14,bold=false) => `<text x="${x}" y="${y}" font-size="${size}"${bold?' font-weight="bold"':''}>${ESC(t)}</text>`
function simbolo(u,x,y,w=160) {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="54" fill="white" stroke="black" stroke-width="1.5"/>`
  if (u.simbolo === 'infanteria') s += `<path d="M${x},${y} l${w},54 M${x+w},${y} l-${w},54" fill="none" stroke="black"/>`
  else if (u.simbolo === 'artilleria') s += `<circle cx="${x+w/2}" cy="${y+27}" r="7" fill="black"/>`
  else if (u.simbolo === 'ingenieria') s += `<path d="M${x+50},${y+35} v-18 h60 v18 M${x+80},${y+17} v18" fill="none" stroke="black" stroke-width="4"/>`
  else if (u.simbolo === 'caballeria') s += `<path d="M${x},${y+54} L${x+w},${y}" stroke="black"/>`
  else s += texto(x+10,y+33,u.simbolo || '',16,true)
  s += texto(x+w/2-12,y-7,u.magnitud || '—',14,true)
  const rot = [u.rol, u.esfuerzo ? 'EP' : ''].filter(Boolean).join(' / ')
  if (rot) s += texto(x+w+6,y+20,rot,12,true)
  if (u.rol === 'OD') s += `<polygon points="${x+w+25},${y+26} ${x+w+29},${y+37} ${x+w+41},${y+37} ${x+w+32},${y+44} ${x+w+35},${y+55} ${x+w+25},${y+48} ${x+w+15},${y+55} ${x+w+18},${y+44} ${x+w+9},${y+37} ${x+w+21},${y+37}" fill="white" stroke="black"/>`
  if (u.esfuerzo) s += `<path d="M${x+w+8},${y+67} l17,-15 l17,15 M${x+w+8},${y+75} l17,-15 l17,15" fill="none" stroke="black"/>`
  return s
}
function flecha(x1,y1,x2,y2,tipo='directa') {
  return `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="black" stroke-width="2" ${tipo==='indirecta'?'stroke-dasharray="9 7"':''} marker-end="url(#punta)"/>`
}
function superior(u,y,rot) {
  const obj = u || { nombre: 'SIN DATO', tarea: '', proposito: '' }
  let s = texto(40,y+12,rot,13,true) + simbolo(obj,320,y+15)
  s += envolver(obj.nombre || 'SIN DATO',26).slice(0,2).map((t,i)=>texto(320,y+87+i*16,t,13,true)).join('')
  // Los textos completos van además en las páginas de detalle; aquí sólo se
  // muestran si caben, con referencia expresa cuando necesitan continuación.
  for (const [i,k] of ['tarea','proposito'].entries()) {
    const ls = envolver(`${i?'P':'T'}: ${obj[k] || 'SIN DATO'}`,62)
    s += ls.slice(0,2).map((t,j)=>texto(560,y+30+i*40+j*16,t,13)).join('')
    if (ls.length > 2) s += texto(560,y+62+i*40,'(texto completo en continuación)',11)
  }
  return s
}
function inicio(sub) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="800" viewBox="0 0 1100 800"><defs><marker id="punta" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z"/></marker></defs><rect width="1100" height="800" fill="white"/><g fill="black" font-family="Arial, sans-serif">${texto(40,30,'HOJA DE TRABAJO DE CONCEPTOS ENTRELAZADOS',22,true)}${texto(40,53,sub,14,true)}`
}
function fin(n) {
  return texto(40,769,'REFERENCIAS: OD = operación decisiva · OC = configuración · EP = esfuerzo principal',12) + flecha(40,786,90,786) + texto(100,790,'Directa',11) + flecha(220,786,270,786,'indirecta') + texto(280,790,'Indirecta',11) + texto(1000,790,`Hoja ${n}`,11) + '</g></svg>'
}
export function laminasConceptos(valor) {
  const v = normalizarConceptos(valor), paginas = [], dibujadas = new Set(), pendientes = []
  const errores = validarConceptos(v)
  if (errores.length) throw new Error(errores.join('\n'))
  const superiores = ['superior2','superior1'].map(g => v.unidades.find(u => u.grupo === g))
  const propias = v.unidades.filter(u => u.grupo === 'maniobra')
  const conectar = posiciones => v.relaciones.map((r,i) => {
    const a = posiciones.get(r.desde), b = posiciones.get(r.hasta)
    if (!a || !b) return ''
    dibujadas.add(i)
    if (a.y === b.y) return a.x < b.x ? flecha(a.x+82,a.y+27,b.x-82,b.y+27,r.tipo) : flecha(a.x-82,a.y+27,b.x+82,b.y+27,r.tipo)
    return a.y > b.y ? flecha(a.x+85,a.y,b.x+85,b.y+50,r.tipo) : flecha(a.x+85,a.y+50,b.x+85,b.y,r.tipo)
  }).join('')
  const tarjeta = (u,x,y,inicioTexto,desde=0,cantidad=16) => {
    let p = simbolo(u,x,y)
    p += envolver(u.nombre || 'SIN DATO',27).map((t,j)=>texto(x,y+77+j*16,t,14,true)).join('')
    p += lineasUnidad(u).slice(desde,desde+cantidad).map((t,j)=>texto(x,inicioTexto+j*17,t,14)).join('')
    return p
  }
  for(let offset=0;offset<Math.max(propias.length,1);offset+=4) {
    let p = inicio('RELACIÓN VERTICAL Y HORIZONTAL'), pos = new Map()
    p += superior(superiores[0],70,'DOS ESCALONES ARRIBA') + superior(superiores[1],180,'SUPERIOR INMEDIATO')
    superiores.forEach((u,i)=>{if(u)pos.set(u.id,{x:400,y:85+i*110})})
    propias.slice(offset,offset+4).forEach((u,i)=>{
      const x=40+i*265
      p += tarjeta(u,x,340,470)
      pos.set(u.id,{x:x+80,y:340})
      if(lineasUnidad(u).length>16) pendientes.push({u,desde:16})
    })
    p += conectar(pos)
    if(!propias.length) p += texto(40,450,'Maniobra y unidad propia: SIN DATO',16)
    paginas.push(p+fin(paginas.length+1))
  }
  superiores.filter(Boolean).forEach(u=>{
    if(['tarea','proposito'].some(k=>envolver(`${k==='tarea'?'T':'P'}: ${u[k]||'SIN DATO'}`,62).length>2)||(u.fases||[]).length) pendientes.push({u,desde:0})
  })
  const apoyos=v.unidades.filter(u=>['apoyo','spac'].includes(u.grupo))
  for(let offset=0;offset<Math.max(apoyos.length,1);offset+=4) {
    let p = inicio('APOYO DE COMBATE Y SPAC'), pos = new Map()
    propias.slice(0,4).forEach((u,i)=>{
      const x=40+i*265
      p += simbolo(u,x,95) + envolver(u.nombre||'SIN DATO',27).map((t,j)=>texto(x,174+j*16,t,14,true)).join('')
      pos.set(u.id,{x:x+80,y:95})
    })
    apoyos.slice(offset,offset+4).forEach((u,i)=>{
      const x=40+i*265
      p += texto(x,315,NOMBRES[u.grupo].toUpperCase(),12,true) + tarjeta(u,x,340,470)
      pos.set(u.id,{x:x+80,y:340})
      if(lineasUnidad(u).length>16) pendientes.push({u,desde:16})
    })
    p += conectar(pos)
    if(!apoyos.length) p+=texto(40,450,'Apoyo de combate y SPAC: SIN DATO',16)
    else if(!apoyos.some(u=>u.grupo==='spac')) p+=texto(40,744,'SPAC: SIN DATO',12)
    else if(!apoyos.some(u=>u.grupo==='apoyo')) p+=texto(40,744,'Apoyo de combate: SIN DATO',12)
    paginas.push(p+fin(paginas.length+1))
  }
  // Continuaciones sin reducción de letra, ni pérdida de texto.
  for(let offset=0;offset<pendientes.length;offset+=4) {
    const lote=pendientes.slice(offset,offset+4)
    const max=Math.max(...lote.map(({u,desde})=>lineasUnidad(u).length-desde))
    for(let linea=0;linea<max;linea+=28) {
      let p=inicio('CONTINUACIÓN DE TAREAS Y PROPÓSITOS')
      lote.forEach(({u,desde},i)=>{p+=tarjeta(u,40+i*265,95,235,desde+linea,28)})
      paginas.push(p+fin(paginas.length+1))
    }
  }
  // Relaciones que cruzan páginas o grupos: ningún vínculo se omite.
  const extras=v.relaciones.filter((r,i)=>!dibujadas.has(i))
  for(let i=0;i<extras.length;i+=5) {
    let p=inicio('CONTINUACIÓN DE RELACIONES')
    extras.slice(i,i+5).forEach((r,j)=>{
      const a=v.unidades.find(u=>u.id===r.desde), b=v.unidades.find(u=>u.id===r.hasta), y=100+j*125
      p+=simbolo(a,40,y)+simbolo(b,760,y)+flecha(230,y+25,735,y+25,r.tipo)
      p+=envolver(a.nombre||'SIN DATO',27).map((t,k)=>texto(40,y+73+k*16,t,13,true)).join('')
      p+=envolver(b.nombre||'SIN DATO',27).map((t,k)=>texto(760,y+73+k*16,t,13,true)).join('')
    })
    paginas.push(p+fin(paginas.length+1))
  }
  return paginas
}
export function conceptosHTML(v) {
  return laminasConceptos(v).map(svg=>`<div style="page-break-after:always;overflow:auto">${svg}</div>`).join('')
}
