// probar-enlaces.mjs — prueba los TROZOS parcheados sacándolos del compilado.
//
//   node "probar-enlaces.mjs" <compilado-parcheado.js>
//
// No levanta la Mesa entera (necesita la página publicada): saca del archivo
// las piezas que tocó el parche y las corre con dobles de `f.jsx`, del
// `localStorage` y de los avisos. Si algo quedó mal escrito, acá revienta.
import { readFileSync } from 'node:fs'

const archivo = process.argv[2]
if (!archivo) { console.error('Uso: node probar-enlaces.mjs <compilado.js>'); process.exit(1) }
const js = readFileSync(archivo, 'utf8')
let fallas = 0
const ok = (t) => console.log('✅ ' + t)
const mal = (t, e) => { fallas++; console.error('❌ ' + t + (e ? ' → ' + e : '')) }

// ---- Doble del navegador --------------------------------------------------
const guardado = new Map()
globalThis.localStorage = {
  getItem: (k) => (guardado.has(k) ? guardado.get(k) : null),
  setItem: (k, v) => guardado.set(k, String(v)),
  removeItem: (k) => guardado.delete(k),
}
globalThis.window = { location: { href: 'https://x.github.io/sideceme/calcos/', hash: '' } }

// ---- 1 · las funciones del paquete + enlaceDePuesto (QU) ------------------
const i1 = js.indexOf('const lle="pmtd_base_repartida"')
const f1 = js.indexOf('const e9="pmtd_puesto_recordado"')
if (i1 < 0 || f1 < 0 || f1 < i1) mal('1 · no encontré el bloque del paquete en el compilado')
else {
  const bloque = js.slice(i1, f1)
  try {
    const fn = new Function('window', 'localStorage', bloque + '\nreturn{QU,SIDEmpacarBase,SIDDesempacarBase,SIDPaqueteGuardado,SIDRecordarPaquete,SIDPaqueteDeLaURL}')
    const api = fn(globalThis.window, globalThis.localStorage)
    const base = { tipoArchivo: 'base-pmtd', ejercicio: 'PRUEBA', mision: 'La División ataca…', aoi: { type: 'Polygon', coordinates: [[[-65, -18], [-64, -18], [-64, -17], [-65, -18]]] }, unidades: [{ id: 'u1' }] }
    const paq = await api.SIDEmpacarBase(base)
    if (!paq || paq[0] !== 'z') mal('1 · el paquete no salió comprimido'); else ok('1 · la BASE se empaqueta (gzip + base64url)')
    const vuelta = await api.SIDDesempacarBase(paq)
    JSON.stringify(vuelta) === JSON.stringify(base) ? ok('1 · y se desempaqueta igualita (ida y vuelta)') : mal('1 · la BASE volvió distinta')
    ;(await api.SIDDesempacarBase('zBASURA')) === null ? ok('1 · un paquete roto devuelve null (no tumba la Mesa)') : mal('1 · un paquete roto no devolvió null')
    const sinBase = api.QU('g4')
    sinBase.includes('?puesto=g4') && !sinBase.includes('#') ? ok('1 · sin BASE repartida el enlace va pelado') : mal('1 · el enlace sin BASE salió raro: ' + sinBase)
    api.SIDRecordarPaquete(paq)
    const conBase = api.QU('g4')
    conBase.includes('?puesto=g4') && conBase.includes('#b=' + paq) ? ok('1 · con la BASE repartida el enlace la lleva detrás del #') : mal('1 · el enlace no llevó la BASE')
    globalThis.window.location.hash = '#b=' + paq
    api.SIDPaqueteDeLaURL() === paq ? ok('1 · el paquete se lee de la dirección') : mal('1 · no se leyó el paquete de la dirección')
  } catch (e) { mal('1 · el bloque del paquete no corre', e.message) }
}

// ---- 2 · la pantalla del candado ------------------------------------------
const i2 = js.indexOf('if(!Ne.permitido){const SIDrol=')
const f2 = js.indexOf('const VP=', i2)
if (i2 < 0 || f2 < 0) mal('2 · no encontré la pantalla del candado')
else {
  const bloque = js.slice(i2, f2)
  const visto = []
  const f = {
    jsx: (t, p) => ({ t, p }),
    jsxs: (t, p) => ({ t, p }),
  }
  const texto = (n) => {
    if (n == null || n === false) return ''
    if (Array.isArray(n)) return n.map(texto).join('')
    if (typeof n === 'object') return texto(n.p?.children)
    return String(n)
  }
  for (const [puesto, debeDecir] of [['g4', 'G-4'], ['g2', 'G-2'], [null, 'Mesa del Estado Mayor']]) {
    try {
      const fn = new Function('f', 'Ne', 'bN', 'cle', 'SIDPaqueteGuardado', 'location', bloque + '\nreturn null')
      const arbol = fn(f, { permitido: false, mensaje: 'Tu sesión de SIDECEME no está activa.' },
        () => puesto, () => null, () => 'zPAQUETE', { href: '', reload() {} })
      const t = texto(arbol)
      if (!t.includes(debeDecir)) mal(`2 · el candado con puesto ${puesto || '(ninguno)'} no dice «${debeDecir}»`)
      else if (!t.includes('Entrar a SIDECEME')) mal('2 · el candado no tiene el botón de entrar')
      else visto.push(puesto || 'sin puesto')
    } catch (e) { mal('2 · la pantalla del candado no corre', e.message) }
  }
  if (visto.length === 3) ok('2 · el candado se dibuja y nombra el puesto (' + visto.join(', ') + ')')
}

// ---- 2bis · el arranque: qué pasa al entrar por el enlace -----------------
{
  const i = js.indexOf('je.useEffect(()=>{if(Cg.current)return;Cg.current=!0;let q=bN();')
  const f = js.indexOf('},[gm,za]);', i)
  if (i < 0 || f < 0) mal('2bis · no encontré el arranque por enlace')
  else {
    const cuerpo = js.slice(i, f + '},[gm,za]);'.length)
      .replace('je.useEffect(()=>{', '(async function(){')
      .replace('},[gm,za]);', '})()')
    const correr = async (caso) => {
      const dicho = { verde: [], rojo: [], mesa: false, base: null }
      const Cg = { current: false }
      const fn = new Function('Cg', 'bN', 'cle', 'Ae', 'dn', 'za', 'bi', 'he', 'A4e', 'gm',
        'SIDPaqueteGuardado', 'SIDDesempacarBase', 'localStorage', 'return ' + cuerpo)
      await fn(Cg, () => caso.url, () => caso.recordado, caso.aoi, caso.unidades || [],
        (m) => dicho.verde.push(m), () => { dicho.mesa = true }, (m) => dicho.rojo.push(m),
        () => caso.local, (b) => { dicho.base = b; return !!b },
        () => caso.paquete, async (p) => (p === 'bueno' ? { tipoArchivo: 'base-pmtd', de: 'enlace' } : null),
        { getItem: () => (caso.instructor ? '1' : null) })
      await new Promise((r) => setTimeout(r, 10))
      return dicho
    }
    const casos = [
      ['entra por el enlace y la BASE está en esta computadora',
        { url: 'g4', local: { de: 'local' } }, (d) => d.base?.de === 'local' && d.mesa && /esta computadora/.test(d.verde[0])],
      ['entra por el enlace con la BASE adentro (otra computadora)',
        { url: 'g4', local: null, paquete: 'bueno' }, (d) => d.base?.de === 'enlace' && d.mesa && /el enlace/.test(d.verde[0])],
      ['vuelve del login de SIDECEME (sin ?puesto, con el puesto recordado)',
        { url: null, recordado: 'g2', paquete: 'bueno' }, (d) => d.base?.de === 'enlace' && /G2/.test(d.verde[0])],
      ['el enlace vino pelado: lo dice en rojo, no deja la carta muda',
        { url: 'g4', local: null, paquete: null }, (d) => !d.base && /no llegó la BASE/.test(d.rojo[0] || '')],
      ['el paquete llegó roto: lo dice en rojo',
        { url: 'g4', local: null, paquete: 'roto' }, (d) => !d.base && /no se pudo leer/.test(d.rojo[0] || '')],
      ['el instructor no se come la BASE de un enlace viejo',
        { url: null, recordado: 'g3', instructor: true, paquete: 'bueno' }, (d) => !d.base && !d.verde.length && !d.rojo.length],
      ['con trabajo abierto no se pisa nada',
        { url: 'g4', aoi: { hay: 1 }, local: { de: 'local' } }, (d) => !d.base],
    ]
    for (const [nombre, caso, bien] of casos) {
      try {
        const d = await correr(caso)
        bien(d) ? ok('2bis · ' + nombre) : mal('2bis · ' + nombre, JSON.stringify(d))
      } catch (e) { mal('2bis · ' + nombre, e.message) }
    }
  }
}

// ---- 3 · los textos que tienen que estar ----------------------------------
const textos = [
  ['el aviso de que no llegó la BASE', 'pero no llegó la BASE del G-3'],
  ['el instructivo de «copiar los 5 juntos»', 'CÓMO SE ABRE (importante)'],
  ['el aviso verde de los enlaces con BASE', 'Los enlaces llevan la BASE adentro'],
  ['el aviso ámbar de los enlaces pelados', 'Todavía van pelados'],
  ['la explicación del candado en el panel', 'primero entra a SIDECEME con su usuario'],
  ['el aviso al repartir', 'los 5 enlaces ya la llevan adentro'],
]
for (const [nombre, t] of textos) {
  const n = js.split(t).length - 1
  n === 1 ? ok('3 · está ' + nombre) : mal(`3 · ${nombre}: aparece ${n} veces`)
}

console.log(fallas ? `\n❌ ${fallas} falla(s)` : '\n✅ Todo bien')
process.exit(fallas ? 1 : 0)
