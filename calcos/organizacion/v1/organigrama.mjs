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

// ─── Lo que se ve (React del compilado: R = { jsx, jsxs, useState }) ────────────────────────────

const st = {
  caja: { background: '#16202e', border: '1px solid #2f5d8a', borderRadius: 8, padding: '8px 10px', margin: '6px 0', fontSize: 12.5, color: '#dfe7f3', lineHeight: 1.4 },
  tit: { fontWeight: 800, color: '#9fd0ff', fontSize: 13, cursor: 'pointer' },
  sel: { width: '100%', background: '#0f1622', color: '#e8eef7', border: '1px solid #3a4a63', borderRadius: 6, padding: '6px', fontSize: 13, marginTop: 4 },
  fila: { display: 'flex', alignItems: 'center', gap: 5, margin: '3px 0' },
  inp: { flex: 1, minWidth: 0, background: '#0f1622', color: '#e8eef7', border: '1px solid #3a4a63', borderRadius: 5, padding: '4px 6px', fontSize: 12 },
  btn: { background: '#1f5a7a', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 12 },
  btnGrande: { width: '100%', background: '#2f6df0', color: '#fff', border: 'none', borderRadius: 7, padding: '9px', cursor: 'pointer', fontWeight: 800, fontSize: 13, marginTop: 6 },
  btnVerde: { width: '100%', background: '#0e7a4a', color: '#fff', border: 'none', borderRadius: 7, padding: '9px', cursor: 'pointer', fontWeight: 800, fontSize: 13, marginTop: 6 },
  nota: { fontSize: 11.5, color: '#9fb0c8', marginTop: 4 },
  ok: { color: '#9fe6a0', fontSize: 11.5, whiteSpace: 'nowrap' },
}

const ESC = { batallon: 'Bat.', regimiento: 'Rgto.', brigada: 'Brig.', division: 'DIV', cuerpo: 'CE', ejercito: 'Ej.' }

// En 🪖 Unidades, con fichas propias.
export function PanelOrganizacion({ R, unidades = [], actual = {}, onActual, colocando = false, onToggleColocar, onPoner }) {
  const [edit, setEdit] = R.useState({})
  const [fuera, setFuera] = R.useState({})
  const [abierto, setAbierto] = R.useState(null)
  if (actual.bando !== 'propias' || (actual.tipo || 'unidad') === 'instalacion') return null
  const madres = candidatasMadre(unidades)
  const madre = madres.find((u) => String(u.id) === String(actual.dependeDe)) || null
  const verAbierto = abierto == null ? !!madre : abierto
  const deps = madre ? dependientesDe(unidades, madre.id) : []
  const yaClaves = new Set(deps.map((u) => clave(u.designacion)))
  const esCE = madre && nivel(madre.escalon) >= nivel('cuerpo')
  const filas = PLANTILLA_CE.map((p) => ({ ...p, designacion: edit[p.id] != null ? edit[p.id] : p.designacion }))
  const elegidas = filas.filter((f) => !fuera[f.id] && !yaClaves.has(clave(f.designacion)))
  const cargar = (f) => {
    const { id, dudoso, ...campos } = f
    onActual?.({ ...actual, tipo: 'unidad', instalacion: '', textoSimbolo: '', numeroUnidad: '', reducida: false, ...campos, dependeDe: madre.id })
    if (!colocando) onToggleColocar?.()
  }
  const elegir = (v) => {
    const m = madres.find((u) => String(u.id) === v)
    onActual?.({ ...actual, dependeDe: m ? m.id : '' })
    setAbierto(true)
  }
  const h = R.jsx
  const hs = R.jsxs
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
            madre &&
              h('div', {
                style: st.nota,
                children: deps.length ? `Ya dependen de ${nombre(madre)}: ${deps.map(nombre).join(', ')}.` : `Todavía no hay ninguna unidad bajo ${nombre(madre)}.`,
              }),
            esCE &&
              hs('div', {
                style: { marginTop: 8 },
                children: [
                  hs('div', {
                    style: { fontWeight: 700, color: '#cfe6ff' },
                    children: ['Organigrama tipo del Cuerpo de Ejército', h('span', { style: { fontWeight: 400, color: '#9fb0c8' }, children: ' — corregí nombres y números; 📍 la coloca con un clic en la carta' })],
                  }),
                  ...filas.map((f) => {
                    const ya = yaClaves.has(clave(f.designacion))
                    return hs(
                      'div',
                      {
                        style: st.fila,
                        children: [
                          h('input', { type: 'checkbox', disabled: ya, checked: !ya && !fuera[f.id], title: 'Entra en «⚡ Poner las tildadas»', onChange: (e) => setFuera({ ...fuera, [f.id]: !e.target.checked }) }),
                          h('span', { style: { width: 34, color: '#9fb0c8', fontSize: 11 }, children: ESC[f.escalon] || (f.escalon === 'compania' ? 'Cía.' : f.escalon) }),
                          h('input', {
                            style: st.inp,
                            value: f.designacion,
                            title: f.dudoso ? 'No reconocí el símbolo del círculo con flecha: escribí su nombre y, al colocarla, elegí su arma.' : '',
                            onChange: (e) => setEdit({ ...edit, [f.id]: e.target.value }),
                          }),
                          ya ? h('span', { style: st.ok, children: '✓ en la carta' }) : h('button', { style: st.btn, title: 'Cargarla en el formulario y colocarla con un clic en la carta', onClick: () => cargar(f), children: '📍' }),
                        ],
                      },
                      f.id,
                    )
                  }),
                  h('button', {
                    style: { ...st.btnVerde, opacity: elegidas.length ? 1 : 0.5 },
                    disabled: !elegidas.length,
                    onClick: () => onPoner?.(madre.id, elegidas),
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
