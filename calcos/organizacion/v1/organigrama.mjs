// 🏛️ Las unidades que dependen de MI unidad, puestas A MANO — 10-11-2026.
//
// Sergio, en la F2·P3 «Tareas específicas, implícitas y esenciales» le salía «Todavía no hay nada en
// el calco para sembrar esta hoja… en 🪖 Unidades tocá ⊞ Disgregar». Su problema: «los documentos no
// están bien redactados, entonces debo agregar manualmente a las unidades que cuenta ese CE-II… que se
// abra 🪖 Unidades y empiece a colocar las unidades que dependen de mi cuerpo de ejército… todas esas
// unidades (del organigrama) bajo la dependencia del CE-II».
//
// Qué hay ahora:
//   · En la F2·P3 un recuadro «🪖 Las unidades de CE-II» con ⊞ Disgregar (el mismo de 🪖 Unidades) y
//     «🪖 Agregar a mano sus dependientes», que abre 🪖 Unidades ya puesto en «Depende de: CE-II».
//   · En 🪖 Unidades (fichas propias) un bloque «🏛️ Organización»: «Depende de» (toda ficha que se
//     coloque queda bajo esa unidad, `dependeDe`, lo mismo que deja Disgregar) y, si la madre es un
//     Cuerpo de Ejército, el organigrama tipo del CE (14 unidades, editables): 📍 carga una en el
//     formulario para colocarla con un clic, o ⚡ pone todas las tildadas alrededor del CE.
// ⚡ deja al CE como su Puesto Comando, igual que Disgregar, y «⊟ Reagrupar» las vuelve a quitar.
//
// 10-11-2026 (tarde) — Sergio: «no puedo armar las unidades que quiero, la DIV 1 es la DIV MEC… sería más
// fácil si pudiera cambiarlas ahí mismo de mecanizadas a infantería». Ahora cada fila tiene ESCALÓN y ARMA;
// las que ya están en la carta cambian al instante (con ↶ Deshacer); ➕ agrega una fila, ✕ la quita, y
// 📋 «Pegar lista» arma el organigrama desde un texto (una unidad por renglón: «DIV MEC 1», «BAT ING 100»…).
// La lista de las que faltan colocar se guarda en este navegador, por unidad madre.

import { ubicarAlrededor, ESCALONES } from '../../disgregar/v1/disgregar.mjs?v=disgregar20261020'

const ENEMIGO = ['enemigo', 'enemigas', 'rojo']
const esPropia = (u) => !!u && !ENEMIGO.includes(String(u.bando || '').toLowerCase()) && !u.esAgrupacion
const esFicha = (u) => ['unidad', 'pc'].includes(u?.tipo || 'unidad')
export const clave = (s) =>
  String(s || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '')
const nivel = (e) => ESCALONES.indexOf(e)
const nombre = (u) => String(u?.designacion || '').trim() || 'la unidad'

// El organigrama tipo del Cuerpo de Ejército (el cuadro de Sergio). Todo se puede corregir antes de poner.
export const PLANTILLA_CE = [
  { id: 'div1', escalon: 'division', arma: 'infanteria', designacion: 'DIV-1', numeroUnidad: '1' },
  { id: 'divmec2', escalon: 'division', arma: 'mecanizada', designacion: 'DIV. MEC.-2', numeroUnidad: '2' },
  { id: 'divmec10', escalon: 'division', arma: 'mecanizada', designacion: 'DIV. MEC.-10', numeroUnidad: '10' },
  { id: 'satmont', escalon: 'regimiento', arma: 'ninguna', textoSimbolo: 'SAT.MONT.', designacion: 'RGTO. SAT. MONT. 100', numeroUnidad: '100' },
  { id: 'artaa', escalon: 'regimiento', arma: 'antiaerea', designacion: 'RGTO. ART. AA 100', numeroUnidad: '100', reducida: true },
  { id: 'art', escalon: 'regimiento', arma: 'artilleria', designacion: 'RGTO. ART. 100', numeroUnidad: '100', reducida: true },
  { id: 'at', escalon: 'batallon', arma: 'antitanque', designacion: 'BAT. AT 100', numeroUnidad: '100' },
  { id: 'ing', escalon: 'batallon', arma: 'ingenieria', designacion: 'BAT. ING. 100', numeroUnidad: '100', reducida: true },
  { id: 'com', escalon: 'batallon', arma: 'comunicaciones', designacion: 'BAT. COM. 100', numeroUnidad: '100' },
  { id: 'flecha', escalon: 'batallon', arma: 'ninguna', textoSimbolo: '↑', designacion: 'BAT. 100 (círculo con flecha)', numeroUnidad: '100', dudoso: true },
  { id: 'pm', escalon: 'batallon', arma: 'policiamilitar', designacion: 'BAT. P.M. 100', numeroUnidad: '100' },
  { id: 'cys', escalon: 'batallon', arma: 'ninguna', textoSimbolo: 'C Y S', designacion: 'BAT. C Y S 100', numeroUnidad: '100' },
  { id: 'log', escalon: 'batallon', arma: 'logistica', designacion: 'BAT. LOG. 100', numeroUnidad: '100' },
  { id: 'aviacion', escalon: 'compania', arma: 'aviacion', designacion: 'CÍA. AV. EJ. 100', numeroUnidad: '100' },
]

// Las que pueden ser «madre»: fichas propias (unidad o PC) de batallón para arriba.
export function candidatasMadre(unidades = []) {
  return (unidades || [])
    .filter((u) => esPropia(u) && esFicha(u) && nivel(u.escalon) >= nivel('batallon'))
    .sort((a, b) => nivel(b.escalon) - nivel(a.escalon))
}

export const dependientesDe = (unidades = [], madreId) =>
  (unidades || []).filter((u) => madreId != null && u.dependeDe != null && String(u.dependeDe) === String(madreId))

// Mi unidad en la carta: la que nombra la Orden (CE - II = CE-II); si no, la cabeza que ya tiene
// dependientes; si no, la única ficha propia del escalón más alto (división o más).
export function madrePropia(unidades = [], nombreUnidad = '') {
  const c = candidatasMadre(unidades)
  const k = clave(nombreUnidad)
  if (k) {
    const exacta = c.find((u) => clave(u.designacion) === k)
    if (exacta) return exacta
  }
  const cabezas = c.filter((u) => dependientesDe(unidades, u.id).length && (u.dependeDe == null || u.dependeDe === ''))
  if (cabezas.length === 1) return cabezas[0]
  if (c.length && nivel(c[0].escalon) >= nivel('division') && (c.length === 1 || nivel(c[1].escalon) < nivel(c[0].escalon))) return c[0]
  return null
}

// Al colocar una ficha con el formulario: «Depende de» sólo vale para las propias.
export function fichaColocada(actual = {}) {
  const { dependeDe, ...resto } = actual || {}
  if (dependeDe == null || dependeDe === '' || resto.bando !== 'propias') return resto
  return { ...resto, dependeDe }
}

// ⚡ Pone las filas elegidas alrededor de la madre, bajo su dependencia. La madre queda como su PC.
export function ponerOrganigrama(unidades = [], madreId, filas = [], { base = Date.now() } = {}) {
  const us = unidades || []
  // El panel usa este mismo camino (con su ↶ Deshacer) para corregir o quitar una ficha ya puesta.
  const orden = (filas || [])[0]
  if (orden && orden.__cambiar != null) return editarFicha(us, orden.__cambiar, orden.campos)
  if (orden && orden.__quitar != null) return quitarFicha(us, orden.__quitar)
  const madre = us.find((u) => String(u.id) === String(madreId))
  if (!madre) return null
  const ya = new Set(dependientesDe(us, madre.id).map((u) => clave(u.designacion)))
  const poner = (filas || []).filter((f) => f && String(f.designacion || '').trim() && !ya.has(clave(f.designacion)))
  if (!poner.length) return { unidades: null, aviso: `🏛️ Esas unidades ya dependen de ${nombre(madre)} en la carta: no se duplicaron.` }
  const previas = us.filter((u) => String(u.dependeDe) === String(madre.id)).length
  const lugares = ubicarAlrededor(madre, previas + poner.length).slice(previas)
  const nuevas = poner.map((f, i) => ({
    id: base + i + Math.random(),
    bando: 'propias',
    tipo: 'unidad',
    escalon: f.escalon,
    arma: f.arma,
    instalacion: '',
    designacion: String(f.designacion).trim(),
    ...(f.numeroUnidad ? { numeroUnidad: String(f.numeroUnidad) } : {}),
    ...(f.textoSimbolo ? { textoSimbolo: f.textoSimbolo } : {}),
    ...(f.reducida ? { reducida: true } : {}),
    futura: false,
    agrupacion: false,
    dependeDe: madre.id,
    ...lugares[i],
  }))
  const d = madre.disgregada || {}
  const resultado = us.map((u) =>
    u.id === madre.id
      ? {
          ...u,
          tipo: 'pc',
          disgregada: {
            puestas: [...(d.puestas || []), ...nuevas.map((x) => x.id)],
            vinculadas: d.vinculadas || [],
            tipoAntes: d.tipoAntes || (u.tipo === 'pc' ? 'pc' : u.tipo || 'unidad'),
          },
        }
      : u,
  )
  return {
    unidades: [...resultado, ...nuevas],
    nuevas,
    aviso:
      `🏛️ ${nuevas.length} unidad(es) puestas alrededor de ${nombre(madre)}, bajo su dependencia: ${nuevas.map(nombre).join(', ')}. ` +
      `${nombre(madre)} queda como su Puesto Comando. Arrastralas a su lugar; «⊟ Reagrupar» las quita y «↶ Deshacer» vuelve atrás.`,
  }
}


// Corrige una ficha ya puesta (arma, escalón, nombre…). Sin aviso: el cambio se ve en la carta.
export function editarFicha(unidades = [], id, campos = {}) {
  const us = unidades || []
  if (!us.some((u) => String(u.id) === String(id))) return null
  return { unidades: us.map((u) => (String(u.id) === String(id) ? { ...u, ...campos } : u)), aviso: '' }
}

// Quita una ficha de la carta (y de la lista de puestas de su madre).
export function quitarFicha(unidades = [], id) {
  const us = unidades || []
  const u = us.find((x) => String(x.id) === String(id))
  if (!u) return null
  const resto = us
    .filter((x) => String(x.id) !== String(id))
    .map((x) => (x.disgregada?.puestas?.some((p) => String(p) === String(id)) ? { ...x, disgregada: { ...x.disgregada, puestas: x.disgregada.puestas.filter((p) => String(p) !== String(id)) } } : x))
  return { unidades: resto, aviso: `🗑 ${nombre(u)} salió de la carta. «↶ Deshacer» la vuelve a poner.` }
}

// Las armas de la Mesa (mismo id que el formulario de 🪖 Unidades).
export const ARMAS = [
  ['infanteria', 'Infantería'], ['mecanizada', 'Infantería Mecanizada'], ['motorizada', 'Infantería Motorizada'], ['andina', 'Infantería Andina / Montaña'],
  ['selva', 'Infantería de Selva'], ['aerotransportada', 'Aerotransportada'], ['caballeria', 'Caballería'], ['cabmec', 'Caballería Mecanizada'], ['blindada', 'Blindada'],
  ['artilleria', 'Artillería'], ['antiaerea', 'Artillería Antiaérea'], ['antitanque', 'Antitanque (AT)'], ['ingenieria', 'Ingeniería'], ['comunicaciones', 'Comunicaciones'],
  ['aviacion', 'Aviación del Ejército'], ['inteligencia', 'Inteligencia'], ['policiamilitar', 'Policía Militar'], ['logistica', 'Logística (Bat. Log.)'],
  ['intendencia', 'Intendencia / Abastecimiento'], ['materialbelico', 'Material Bélico'], ['sanidad', 'Sanidad'], ['transporte', 'Transporte'],
  ['mantenimiento', 'Mantenimiento / Material'], ['veterinaria', 'Veterinaria'], ['morteros', 'Morteros'], ['ametralladoras', 'Ametralladoras'], ['lanzacohetes', 'Lanzacohetes'],
  ['ninguna', '(sin arma / texto)'],
]
export const ESCALONES_FILA = [['seccion', 'Sec.'], ['compania', 'Cía.'], ['batallon', 'Bat.'], ['regimiento', 'Rgto.'], ['brigada', 'Brig.'], ['division', 'DIV']]

const numeroDe = (s) => {
  const m = String(s || '').match(/\d+/g)
  return m ? m[m.length - 1] : ''
}

// Un renglón escrito como lo escribe el oficial («DIV MEC 1», «Rgto. Art. AA 100», «Cía. Av. Ej. 100») → fila.
export function leerRenglon(texto = '') {
  const designacion = String(texto || '').replace(/^[\s\-–•*·\d]+[.)]\s+/, '').trim()
  if (!designacion) return null
  const k = ' ' + designacion.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, ' ').trim() + ' '
  const t = (re) => re.test(k)
  const escalon = t(/ (DIV|DIVISION|DI) /) || /^DIV/.test(k.trim()) ? 'division'
    : t(/ (BRIG|BRIGADA|BR) /) ? 'brigada'
    : t(/ (RGTO|REGIMIENTO|REG|RI|RC|GRUPO|GA) /) ? 'regimiento'
    : t(/ (CIA|COMPANIA|CA|ESCUADRON|ESC|BATERIA|BTRIA) /) ? 'compania'
    : t(/ (SEC|SECCION|PELOTON) /) ? 'seccion'
    : 'batallon'
  const arma = t(/ (AA|DAA|ANTIAEREA?) /) ? 'antiaerea'
    : t(/ (AT|ANTITANQUE) /) ? 'antitanque'
    : t(/ (ART|ARTILLERIA) /) ? 'artilleria'
    : t(/ (ING|INGENIERIA|INGENIEROS) /) ? 'ingenieria'
    : t(/ (COM|COMUNICACIONES|TRANSM) /) ? 'comunicaciones'
    : t(/ (AV|AVIACION) /) ? 'aviacion'
    : t(/ (LOG|LOGISTICA|LOGISTICO) /) ? 'logistica'
    : t(/ (PM|P M|POLICIA) /) ? 'policiamilitar'
    : t(/ (SAN|SANIDAD) /) ? 'sanidad'
    : t(/ (INT|INTELIGENCIA) /) ? 'inteligencia'
    : t(/ (TRANSP|TRANSPORTE) /) ? 'transporte'
    : t(/ (MB|MATERIAL BELICO) /) ? 'materialbelico'
    : t(/ (INTENDENCIA) /) ? 'intendencia'
    : t(/ (MANT|MANTENIMIENTO) /) ? 'mantenimiento'
    : t(/ CAB(ALLERIA)? MEC/) ? 'cabmec'
    : t(/ MEC(ANIZADA?|ANIZADO)? /) ? 'mecanizada'
    : t(/ MOT(ORIZADA?|ORIZADO)? /) ? 'motorizada'
    : t(/ (BLIND|BLINDADA?|BLINDADO|TQ|TANQUES?) /) ? 'blindada'
    : t(/ (PARA|PARACAIDISTA|AEROTRANSPORTADA) /) ? 'aerotransportada'
    : t(/ SELVA /) ? 'selva'
    : t(/ (ANDINA|MONTANA) /) ? 'andina'
    : t(/ (CAB|CABALLERIA) /) ? 'caballeria'
    : 'infanteria'
  return { escalon, arma, designacion, numeroUnidad: numeroDe(designacion) }
}

export const leerLista = (texto = '') => String(texto || '').split(/\n|;/).map(leerRenglon).filter(Boolean)

const GUARDA = 'sid-organigrama-faltan:'
const leerGuardada = (k) => {
  try {
    const v = JSON.parse(localStorage.getItem(GUARDA + k) || 'null')
    return Array.isArray(v) ? v : null
  } catch {
    return null
  }
}
const guardar = (k, filas) => {
  try {
    localStorage.setItem(GUARDA + k, JSON.stringify(filas))
  } catch {}
}

// ─── Lo que se ve// ─── Lo que se ve (React del compilado: R = { jsx, jsxs, useState }) ────────────────────────────

const st = {
  caja: { background: '#16202e', border: '1px solid #2f5d8a', borderRadius: 8, padding: '8px 10px', margin: '6px 0', fontSize: 12.5, color: '#dfe7f3', lineHeight: 1.4 },
  tit: { fontWeight: 800, color: '#9fd0ff', fontSize: 13, cursor: 'pointer' },
  sel: { width: '100%', background: '#0f1622', color: '#e8eef7', border: '1px solid #3a4a63', borderRadius: 6, padding: '6px', fontSize: 13, marginTop: 4 },
  fila: { display: 'flex', alignItems: 'center', gap: 5, margin: '3px 0' },
  bloque: { borderBottom: '1px solid #243246', padding: '3px 0 4px' },
  inp: { flex: 1, minWidth: 0, background: '#0f1622', color: '#e8eef7', border: '1px solid #3a4a63', borderRadius: 5, padding: '4px 6px', fontSize: 12 },
  chico: { background: '#0f1622', color: '#cfe0f5', border: '1px solid #3a4a63', borderRadius: 5, padding: '3px 2px', fontSize: 11.5 },
  btn: { background: '#1f5a7a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  quitar: { background: 'transparent', color: '#ff8f8f', border: '1px solid #6a3a3a', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', fontSize: 11.5 },
  btnLinea: { flex: 1, background: '#22344d', color: '#dbe9ff', border: '1px solid #3a5a80', borderRadius: 6, padding: '6px 4px', cursor: 'pointer', fontWeight: 700, fontSize: 11.5 },
  btnGrande: { width: '100%', background: '#2f6df0', color: '#fff', border: 'none', borderRadius: 7, padding: '9px', cursor: 'pointer', fontWeight: 800, fontSize: 13, marginTop: 6 },
  btnVerde: { width: '100%', background: '#0e7a4a', color: '#fff', border: 'none', borderRadius: 7, padding: '9px', cursor: 'pointer', fontWeight: 800, fontSize: 13, marginTop: 6 },
  nota: { fontSize: 11.5, color: '#9fb0c8', marginTop: 4 },
  sub: { fontSize: 11.5, fontWeight: 800, color: '#9fe6a0', marginTop: 8, letterSpacing: 0.3 },
  ok: { color: '#9fe6a0', fontSize: 11.5, whiteSpace: 'nowrap' },
  area: { width: '100%', boxSizing: 'border-box', minHeight: 90, background: '#0f1622', color: '#e8eef7', border: '1px solid #3a4a63', borderRadius: 6, padding: 6, fontSize: 12, marginTop: 4 },
}

const ESC = { batallon: 'Bat.', regimiento: 'Rgto.', brigada: 'Brig.', division: 'DIV', cuerpo: 'CE', ejercito: 'Ej.' }
const sinTexto = (arma, antes) => (arma !== 'ninguna' ? '' : antes || '')

// En 🪖 Unidades, con fichas propias.
export function PanelOrganizacion({ R, unidades = [], actual = {}, onActual, colocando = false, onToggleColocar, onPoner }) {
  const [fuera, setFuera] = R.useState({})
  const [abierto, setAbierto] = R.useState(null)
  const [borrador, setBorrador] = R.useState({})
  const [faltanMem, setFaltanMem] = R.useState({})
  const [pegar, setPegar] = R.useState(null)
  if (actual.bando !== 'propias' || (actual.tipo || 'unidad') === 'instalacion') return null
  const madres = candidatasMadre(unidades)
  const madre = madres.find((u) => String(u.id) === String(actual.dependeDe)) || null
  const verAbierto = abierto == null ? !!madre : abierto
  const deps = madre ? dependientesDe(unidades, madre.id) : []
  const yaClaves = new Set(deps.map((u) => clave(u.designacion)))
  const esCE = madre && nivel(madre.escalon) >= nivel('cuerpo')
  // Las que faltan colocar: lo guardado para esta madre; si nada, el organigrama tipo (o nada si ya hay dependientes).
  const kM = madre ? clave(madre.designacion) || String(madre.id) : ''
  const guardadas = kM ? faltanMem[kM] || leerGuardada(kM) : null
  const todas = guardadas || (deps.length ? [] : PLANTILLA_CE)
  const faltan = todas.filter((f) => !yaClaves.has(clave(f.designacion)))
  const elegidas = faltan.filter((f) => !fuera[f.id] && String(f.designacion || '').trim())
  const ponerFaltan = (nuevas) => {
    const limpias = nuevas.filter((f) => !yaClaves.has(clave(f.designacion)))
    setFaltanMem({ ...faltanMem, [kM]: limpias })
    guardar(kM, limpias)
  }
  const cambiarFalta = (id, campos) => ponerFaltan(faltan.map((f) => (f.id === id ? { ...f, ...campos } : f)))
  const conNumero = (f) => ({ ...f, numeroUnidad: numeroDe(f.designacion) || f.numeroUnidad || '' })
  const cargar = (f) => {
    const { id, dudoso, ...campos } = conNumero(f)
    if (!guardadas) ponerFaltan(faltan) // que la lista no se pierda cuando caiga la primera en la carta
    onActual?.({ ...actual, tipo: 'unidad', instalacion: '', textoSimbolo: '', numeroUnidad: '', reducida: false, ...campos, dependeDe: madre.id })
    if (!colocando) onToggleColocar?.()
  }
  // Una ficha que ya está en la carta: el cambio va directo a la carta (con ↶ Deshacer).
  const cambiarPuesta = (u, campos) => onPoner?.(madre.id, [{ __cambiar: u.id, campos }])
  const renombrar = (u) => {
    const nuevo = String(borrador[u.id] ?? '').trim()
    const { [u.id]: _, ...resto } = borrador
    setBorrador(resto)
    if (!nuevo || nuevo === u.designacion) return
    // Si en la lista de las que faltan había una con el nombre viejo, ya no falta.
    if (faltan.some((f) => clave(f.designacion) === clave(u.designacion))) ponerFaltan(faltan.filter((f) => clave(f.designacion) !== clave(u.designacion)))
    cambiarPuesta(u, { designacion: nuevo, numeroUnidad: numeroDe(nuevo) || u.numeroUnidad || '' })
  }
  const elegir = (v) => {
    const m = madres.find((u) => String(u.id) === v)
    onActual?.({ ...actual, dependeDe: m ? m.id : '' })
    setAbierto(true)
  }
  const h = R.jsx
  const hs = R.jsxs
  const selEscalon = (valor, onCambio) =>
    h('select', {
      style: { ...st.chico, width: 58 },
      value: valor,
      title: 'Escalón',
      onChange: (e) => onCambio(e.target.value),
      children: ESCALONES_FILA.map(([v, t]) => h('option', { value: v, children: t }, v)),
    })
  const selArma = (valor, onCambio) =>
    h('select', {
      style: { ...st.chico, flex: 1, minWidth: 0 },
      value: valor || 'ninguna',
      title: 'Arma',
      'data-sid': 'arma',
      onChange: (e) => onCambio(e.target.value),
      children: ARMAS.map(([v, t]) => h('option', { value: v, children: t }, v)),
    })

  const filaPuesta = (u) =>
    hs(
      'div',
      {
        style: st.bloque,
        'data-sid': 'puesta',
        children: [
          hs('div', {
            style: st.fila,
            children: [
              h('input', { type: 'checkbox', disabled: true, checked: false, title: 'Ya está en la carta' }),
              h('input', {
                style: st.inp,
                value: borrador[u.id] ?? u.designacion ?? '',
                title: 'Nombre en la carta (Enter para cambiarlo)',
                onChange: (e) => setBorrador({ ...borrador, [u.id]: e.target.value }),
                onBlur: () => renombrar(u),
                onKeyDown: (e) => e.key === 'Enter' && e.target.blur(),
              }),
              h('span', { style: st.ok, title: 'Ya está en la carta', children: '✓' }),
              h('button', {
                style: st.quitar,
                title: 'Quitarla de la carta',
                onClick: () => (typeof confirm !== 'function' || confirm(`¿Quitar ${nombre(u)} de la carta?`)) && onPoner?.(madre.id, [{ __quitar: u.id }]),
                children: '✕',
              }),
            ],
          }),
          hs('div', {
            style: { ...st.fila, paddingLeft: 18 },
            children: [
              selEscalon(u.escalon, (v) => cambiarPuesta(u, { escalon: v })),
              selArma(u.arma, (v) => cambiarPuesta(u, { arma: v, textoSimbolo: sinTexto(v, u.textoSimbolo) })),
            ],
          }),
        ],
      },
      'p' + u.id,
    )

  const filaFalta = (f) =>
    hs(
      'div',
      {
        style: st.bloque,
        'data-sid': 'falta',
        children: [
          hs('div', {
            style: st.fila,
            children: [
              h('input', { type: 'checkbox', checked: !fuera[f.id], title: 'Entra en «⚡ Poner las tildadas»', onChange: (e) => setFuera({ ...fuera, [f.id]: !e.target.checked }) }),
              h('input', {
                style: st.inp,
                value: f.designacion,
                placeholder: 'Nombre (ej. DIV MEC 1)',
                title: f.dudoso ? 'No reconocí el símbolo del círculo con flecha: escribí su nombre y elegí su arma.' : '',
                onChange: (e) => cambiarFalta(f.id, { designacion: e.target.value }),
              }),
              h('button', { style: st.btn, title: 'Cargarla en el formulario y colocarla con un clic en la carta', onClick: () => cargar(f), children: '📍' }),
              h('button', { style: st.quitar, title: 'Sacarla de la lista', onClick: () => ponerFaltan(faltan.filter((x) => x.id !== f.id)), children: '✕' }),
            ],
          }),
          hs('div', {
            style: { ...st.fila, paddingLeft: 18 },
            children: [
              selEscalon(f.escalon, (v) => cambiarFalta(f.id, { escalon: v })),
              selArma(f.arma, (v) => cambiarFalta(f.id, { arma: v, textoSimbolo: sinTexto(v, f.textoSimbolo) })),
            ],
          }),
        ],
      },
      'f' + f.id,
    )

  const nuevaId = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const agregar = () => ponerFaltan([...faltan, { id: nuevaId(), escalon: 'batallon', arma: 'infanteria', designacion: '' }])
  const cargarPegado = () => {
    const leidas = leerLista(pegar).map((f) => ({ ...f, id: nuevaId() }))
    const ya = new Set(faltan.map((f) => clave(f.designacion)))
    ponerFaltan([...faltan, ...leidas.filter((f) => !ya.has(clave(f.designacion)))])
    setPegar(null)
  }

  return hs('div', {
    style: st.caja,
    'data-sid': 'organizacion',
    children: [
      h('div', {
        style: st.tit,
        onClick: () => setAbierto(!verAbierto),
        children: `${verAbierto ? '▾' : '▸'} 🏛️ Organización — depende de: ${madre ? nombre(madre) : '(ninguna)'}`,
      }),
      verAbierto &&
        hs(R.Fragment || 'div', {
          children: [
            hs('label', {
              style: { display: 'block', marginTop: 6, fontSize: 12 },
              children: [
                'Las fichas que coloques quedan bajo la dependencia de:',
                hs('select', {
                  style: st.sel,
                  value: madre ? String(madre.id) : '',
                  onChange: (e) => elegir(e.target.value),
                  children: [
                    h('option', { value: '', children: '— ninguna (ficha suelta) —' }, ''),
                    ...madres.map((u) => h('option', { value: String(u.id), children: `${nombre(u)}${u.tipo === 'pc' ? ' (PC)' : ''} · ${ESC[u.escalon] || u.escalon}` }, String(u.id))),
                  ],
                }),
              ],
            }),
            !madres.length && h('div', { style: st.nota, children: 'Primero colocá la ficha de tu unidad (por ejemplo CE-II, escalón «Cuerpo de Ejército»); después elegila acá.' }),
            madre && !deps.length && h('div', { style: st.nota, children: `Todavía no hay ninguna unidad bajo ${nombre(madre)}.` }),
            madre &&
              hs('div', {
                style: { marginTop: 8 },
                children: [
                  hs('div', {
                    style: { fontWeight: 700, color: '#cfe6ff' },
                    children: [
                      esCE ? 'Organigrama tipo del Cuerpo de Ejército' : `Organigrama de ${nombre(madre)}`,
                      h('span', { style: { fontWeight: 400, color: '#9fb0c8' }, children: ' — cambiá nombre, escalón y arma ahí mismo; 📍 la coloca con un clic en la carta' }),
                    ],
                  }),
                  deps.length > 0 && h('div', { style: st.sub, children: `EN LA CARTA (${deps.length}) — lo que cambies se ve al instante` }),
                  ...deps.map(filaPuesta),
                  (faltan.length > 0 || deps.length > 0) && h('div', { style: { ...st.sub, color: '#ffd68a' }, children: `POR COLOCAR (${faltan.length})` }),
                  ...faltan.map(filaFalta),
                  hs('div', {
                    style: { ...st.fila, marginTop: 6 },
                    children: [
                      h('button', { style: st.btnLinea, onClick: agregar, title: 'Una fila más para escribir', children: '➕ Agregar unidad' }),
                      h('button', { style: st.btnLinea, onClick: () => setPegar(pegar == null ? '' : null), title: 'Pegá o escribí la lista, una unidad por renglón', children: '📋 Pegar lista' }),
                      esCE && h('button', { style: st.btnLinea, onClick: () => ponerFaltan([...faltan, ...PLANTILLA_CE.filter((p) => !faltan.some((f) => clave(f.designacion) === clave(p.designacion)))]), title: 'Agrega las 14 del organigrama tipo que no estén', children: '↺ Tipo CE' }),
                    ],
                  }),
                  pegar != null &&
                    hs('div', {
                      children: [
                        h('textarea', {
                          style: st.area,
                          value: pegar,
                          placeholder: 'Una por renglón, como la escribís:\nDIV MEC 1\nDIV INF 2\nBRIG. BLIND. 5\nRGTO. ART. 100\nBAT. ING. 100\nCÍA. AV. EJ. 100',
                          onChange: (e) => setPegar(e.target.value),
                        }),
                        h('div', { style: st.nota, children: 'Leo el escalón (DIV, BRIG, RGTO, BAT, CÍA) y el arma (MEC, MOT, INF, BLIND, ART, AA, ING, COM, LOG, P.M., AT, AV…). Después corregí lo que haga falta en cada fila.' }),
                        hs('div', {
                          style: st.fila,
                          children: [
                            h('button', { style: { ...st.btn, flex: 1 }, disabled: !String(pegar).trim(), onClick: cargarPegado, children: `✓ Cargar ${leerLista(pegar).length} a la lista` }),
                            h('button', { style: st.quitar, onClick: () => setPegar(null), children: 'Cancelar' }),
                          ],
                        }),
                      ],
                    }),
                  h('button', {
                    style: { ...st.btnVerde, opacity: elegidas.length ? 1 : 0.5 },
                    disabled: !elegidas.length,
                    onClick: () => {
                      onPoner?.(madre.id, elegidas.map(conNumero))
                      ponerFaltan(faltan.filter((f) => !elegidas.includes(f)))
                    },
                    children: elegidas.length ? `⚡ Poner las ${elegidas.length} tildadas alrededor de ${nombre(madre)}` : `✓ Todas están bajo ${nombre(madre)}`,
                  }),
                  h('div', { style: st.nota, children: `Quedan en círculo alrededor de ${nombre(madre)}, que pasa a ser su Puesto Comando; arrastralas a su lugar.` }),
                ],
              }),
          ],
        }),
    ],
  })
}

// En la F2·P3 (y donde haga falta): Disgregar o agregar a mano, sin salir de la hoja.
export function CajaDependientes({ R, unidades = [], unidad = '', onDisgregar, onAgregar }) {
  const h = R.jsx
  const hs = R.jsxs
  const madre = madrePropia(unidades, unidad)
  const deps = madre ? dependientesDe(unidades, madre.id) : []
  const nom = madre ? nombre(madre) : String(unidad || '').trim() || 'tu unidad'
  return hs('div', {
    style: st.caja,
    'data-sid': 'dependientes',
    children: [
      h('div', { style: { ...st.tit, cursor: 'default' }, children: `🪖 Las unidades de ${nom}` }),
      !madre &&
        h('div', {
          style: st.nota,
          children: `No encuentro en la carta la ficha de ${nom}. Colocala en 🪖 Unidades (escalón de tu unidad) y volvé: acá vas a poder disgregarla o agregarle sus dependientes a mano.`,
        }),
      madre &&
        h('div', {
          style: st.nota,
          children: deps.length
            ? `${deps.length} dependiente(s) en la carta: ${deps.map(nombre).join(', ')}.`
            : `${nom} está como UNA sola ficha: la hoja no tiene a quién darle las tareas. Disgregala (las lee de la Orden o las escribís) o agregá sus unidades a mano.`,
        }),
      madre &&
        h('button', {
          style: st.btnGrande,
          onClick: () => onDisgregar?.(madre.id),
          children: madre.disgregada ? `⊟ Reagrupar ${nom}` : `⊞ Disgregar ${nom}`,
        }),
      h('button', {
        style: st.btnVerde,
        onClick: () => onAgregar?.(madre ? madre.id : null),
        children: madre ? `🪖 Agregar a mano las unidades de ${nom}` : '🪖 Abrir Unidades para colocar mi unidad',
      }),
      madre && h('div', { style: st.nota, children: 'Abre 🪖 Unidades con «Depende de» ya puesto y el organigrama tipo del CE: cada unidad que coloques queda bajo su dependencia.' }),
    ],
  })
}
