// ============================================================
// EDGE FUNCTION: wargame-ops — Juego de Guerra (PMTD) de SIDECEME.  ·  v2.9.443
// Wargame multijugador POR TURNOS, combate DETERMINISTA, con NIEBLA DE GUERRA.
//
// Roles:
//   • ÁRBITRO (profesor que crea/arbitra): crea la partida, define bandos,
//     coloca unidades y terreno, inicia y RESUELVE cada turno. Ve TODO.
//   • EM (Estado Mayor): entra a su bando con una CLAVE, envía órdenes de sus
//     unidades y consulta el estado CON NIEBLA (solo sus unidades + enemigos
//     detectados + eventos visibles para su bando).
//
// Acciones:
//   crear_partida, listar_partidas, agregar_bando, agregar_unidad,
//   importar_escenario, cargar_terreno, iniciar, enviar_orden,
//   estado (con niebla), resolver_turno (árbitro), historial.
//
// Auth: token de sesión (tabla 'sesiones'). JWT: OFF. service_role.
// SQL: WARGAME_setup.sql · Motor: wargame-engine.js (inline abajo).
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};
// ============================================================
// v2.9.313 — LA HORA DEL SERVIDOR VIAJA EN TODAS LAS RESPUESTAS.
//
// El vuelo automático del dron es determinista sobre el tiempo, así que dos
// navegadores con el mismo reloj lo ven en el mismo lugar. Con las dos ventanas
// en la misma Mac eso alcanzaba. Pero el ejercicio se juega con cada Estado
// Mayor en SU máquina, y ahí cada una tiene su propio reloj: como el vuelo va
// acelerado ×40, un desfase de 2 segundos entre dos laptops separa los aparatos
// 2,2 km. O sea que el escenario vuelve a partirse, igual que antes.
//
// La solución es la de siempre en esto: que TODOS midan contra el mismo reloj,
// y el único que comparten es el del servidor. Va en `ok()` y no en una acción
// nueva, así lo trae CUALQUIER respuesta —incluido el latido de 4 s que ya
// estaba yendo y viniendo— sin una sola llamada de red de más.
//
// El navegador se queda con la diferencia contra su propio reloj y la aplica.
// `ahora_ms` es hora UTC en milisegundos: no depende de la zona horaria de
// nadie, así que sirve igual si alguna máquina la tiene mal configurada.
// ============================================================
const ok = (extra?: object) => new Response(JSON.stringify({ ok: true, ahora_ms: Date.now(), ...extra }), { status: 200, headers: corsHeaders });
const err = (msg: string, status = 400) => new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: corsHeaders });

// Roles de profesor que pueden crear/arbitrar partidas.
const ARBITRAN = ["ciencia_tecnologia", "comandante", "jefe_estudios", "profesor", "sub_ef", "evaluaciones", "jefe_disciplina", "jefe_sac"];

// Tipos de `wg_terreno`. Los DOCTRINALES entran al motor (movilidad y bonos de
// defensa). Los VISUALES son el fondo de carta que trae el Generador de Calcos
// (ríos, curvas de nivel, caminos, poblados…): se guardan y se dibujan, pero el
// motor NUNCA los mira.
// `ae` (área de empeño) y `defensivo` NO cambian la movilidad: entran al motor
// sólo para que la bitácora AVISE cuando una unidad termina adentro.
const TIPOS_DOCTRINA = ["restringido", "severo", "clave", "ae", "defensivo", "minado"];
const TIPOS_VISUALES = ["hidro", "elevacion", "via", "poblado", "vegetacion", "jurisdiccion",
  "eje_log", "obstaculo"];
// v2.9.221 — lo que el MOTOR necesita al resolver. `via` no es doctrinal para
// la importación (es una línea, no un polígono), pero SÍ para la movilidad:
// sin ella el motorizado no puede cruzar terreno restringido por la carretera.
// v2.9.226: `interdiccion` son las fajas batidas por la artillería — las pone
// el propio juego al resolver y vencen solas.
// v2.9.324: `minado` es un obstáculo sembrado por un bando — detiene y desgasta
// al que entra, así que el motor SÍ tiene que verlo.
const TIPOS_MOTOR = [...TIPOS_DOCTRINA, "via", "interdiccion", "minado"];
// v2.9.439 — los tipos que el plan de barreras importado puede traer CON BANDO
// (como las obras construidas en la partida): los construidos tienen efecto
// (`minado` detiene, `severo`/`restringido` frenan al enemigo) y los proyectados
// sólo se ven (`obstaculo`). Con bando viajan con niebla, en `obras`.
const TIPOS_OBRA_DE_BANDO = ["minado", "severo", "restringido", "defensivo", "obstaculo"];
// ============================================================
// v2.9.439 — EL TERRENO SE PIDE POR PÁGINAS. (⚠️ ÉSTE ERA EL BUG GRANDE.)
// Sergio, con la partida «ZAPATO II» abierta: «deberían poder verse los
// caminos… el calco de vegetación… el plan de barreras». Estaban en la base
// (1.782 elementos de carta) pero PostgREST entrega como MÁXIMO 1.000 filas por
// consulta, aunque se le pida `.limit(3000)` — el mismo tope que ya mordió a
// las notas y a las sanciones (v2.9.407). Llegaban, en el orden en que se
// importaron, el CMOC, la hidrografía, las 763 curvas de nivel y 84 de los 751
// caminos; el resto de los caminos, las poblaciones, la vegetación, las
// jurisdicciones y las 13 obras del plan de barreras no llegaban NUNCA.
// Ahora se pide de a 1.000 (ordenado por id, para que las páginas no se pisen)
// y con lo que pesa en el combate PRIMERO: el CMOC, los ejes y el plan de
// barreras, después los caminos y la hidrografía, y al final las curvas.
// ============================================================
const PAGINA_FILAS = 1000;
async function todasLasFilas(consulta: () => any, tope = 20000) {
  const filas: any[] = [];
  for (let desde = 0; desde < tope; desde += PAGINA_FILAS) {
    const { data, error } = await consulta().range(desde, Math.min(tope, desde + PAGINA_FILAS) - 1);
    if (error) return { data: filas, error };
    filas.push(...(data || []));
    if (!data || data.length < PAGINA_FILAS) break;
  }
  return { data: filas, error: null };
}
// En qué orden se manda la carta: lo que decide el combate y el plan primero.
const ORDEN_CARTA: string[] = ["restringido", "severo", "clave", "ae", "defensivo", "minado", "obstaculo",
  "eje_log", "via", "hidro", "poblado", "vegetacion", "jurisdiccion", "elevacion"];
function ordenarCarta(filas: any[]) {
  const pos = (t: string) => { const i = ORDEN_CARTA.indexOf(t); return i < 0 ? ORDEN_CARTA.length : i; };
  return [...(filas || [])].sort((a: any, b: any) => pos(a.tipo) - pos(b.tipo));
}
// v2.9.439 — los MEDIOS de una unidad que llegan del Generador (COE y
// planeamiento). Se guardan tal cual en `wg_unidades.medios`, con un tope de
// tamaño: son datos para leer, no un lugar para meter cualquier cosa.
function limpiarMedios(m: any) {
  if (!m || typeof m !== "object" || Array.isArray(m)) return null;
  try {
    const t = JSON.stringify(m);
    if (!t || t.length > 16000) return null;
    return JSON.parse(t);
  } catch (_e) { return null; }
}
// La munición con que ARRANCA: sólo sistemas del catálogo y números sanos.
function limpiarMunicion(m: any) {
  if (!m || typeof m !== "object" || Array.isArray(m)) return null;
  const out: any = {};
  for (const [k, v] of Object.entries(m)) {
    if (!ARMAS[k]) continue;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) out[k] = Math.min(99, Number(n.toFixed(2)));
  }
  return Object.keys(out).length ? out : null;
}

// ============================================================
// MOTOR (inline, idéntico a wargame-engine.js) — determinista, sin deps.
// ============================================================
const R_TIERRA = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
function haversineKm(a: number[], b: number[]) {
  const dLat = rad(b[1] - a[1]), dLng = rad(b[0] - a[0]);
  const la1 = rad(a[1]), la2 = rad(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R_TIERRA * Math.asin(Math.min(1, Math.sqrt(h)));
}
// v2.9.443 — EL ANILLO GRANDE SE MIRA POR FRANJAS. Desde esta versión el suelo
// se mira cada 50 m (antes cada 500 m): diez veces más preguntas «¿este punto
// está adentro?». Un sector restringido del Generador puede tener miles de
// vértices, y recorrerlos todos en cada pregunta no entra en el CPU de la Edge
// Function. Se parte el anillo en franjas horizontales una sola vez: un punto
// sólo puede cortar los lados que cruzan su latitud, así que basta mirar los de
// su franja. El resultado es idéntico al del recorrido completo.
const _franjasDe = new WeakMap<any, any>();
function franjasDe(ring: number[][]) {
  let b = _franjasDe.get(ring);
  if (b) return b;
  const n = ring.length;
  let y0 = Infinity, y1 = -Infinity;
  for (const p of ring) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  const nb = Math.max(1, Math.min(1024, Math.ceil(n / 6)));
  const dy = (y1 - y0) / nb || 1e-12;
  const franjas: number[][] = Array.from({ length: nb }, () => []);
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const ya = ring[i][1], yb = ring[j][1];
    const lo = Math.max(0, Math.floor((Math.min(ya, yb) - y0) / dy));
    const hi = Math.min(nb - 1, Math.floor((Math.max(ya, yb) - y0) / dy));
    for (let k = lo; k <= hi; k++) franjas[k].push(i);
  }
  b = { y0, y1, dy, nb, franjas };
  _franjasDe.set(ring, b);
  return b;
}
function puntoEnAnillo(pt: number[], ring: number[][]) {
  let dentro = false;
  const n = ring.length;
  if (n > 48) {
    const b = franjasDe(ring);
    if (pt[1] < b.y0 || pt[1] > b.y1) return false;
    const k = Math.min(b.nb - 1, Math.max(0, Math.floor((pt[1] - b.y0) / b.dy)));
    for (const i of b.franjas[k]) {
      const j = i === 0 ? n - 1 : i - 1;
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      const corta = (yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi || 1e-12) + xi;
      if (corta) dentro = !dentro;
    }
    return dentro;
  }
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const corta = (yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi || 1e-12) + xi;
    if (corta) dentro = !dentro;
  }
  return dentro;
}
// v2.9.431 — LOS HUECOS DEL POLÍGONO SON TERRENO TRANSITABLE. El Generador
// exporta un sector restringido como un polígono con anillos interiores (islas
// de campo abierto adentro: 64 huecos en un solo polígono de 36 km² medido en
// la partida «qwert»). Hasta acá sólo se miraba el anillo exterior, así que el
// motor trataba esas islas como terreno restringido: una unidad parada en un
// hueco figuraba «adentro» y una marcha por el hueco se cobraba como
// restringida. Ahora: dentro del exterior Y fuera de todos los huecos.
function puntoEnPoligono(pt: number[], anillos: number[][][]) {
  if (!anillos || !anillos.length || !puntoEnAnillo(pt, anillos[0])) return false;
  for (let i = 1; i < anillos.length; i++) if (puntoEnAnillo(pt, anillos[i])) return false;
  return true;
}
function puntoEnGeom(pt: number[], geom: any) {
  if (!geom) return false;
  if (geom.type === "Polygon") return puntoEnPoligono(pt, geom.coordinates);
  if (geom.type === "MultiPolygon") return geom.coordinates.some((poly: any) => puntoEnPoligono(pt, poly));
  return false;
}
// v2.9.201 — PREFILTRO POR CAJA. El terreno que llega del Generador de Calcos
// son CIENTOS de polígonos (escenario real medido: 615 polígonos, 20.000
// vértices). Sin la caja, cada paso de 0,5 km de cada unidad recorría los
// 20.000 vértices y el turno no cerraba dentro del CPU de la Edge Function.
// Verificado en Node contra el terreno real: ×12 más rápido, resultado idéntico.
function cajaDeGeom(geom: any): number[] | null {
  if (!geom) return null;
  const anillos = geom.type === "Polygon" ? [geom.coordinates[0]]
    : geom.type === "MultiPolygon" ? geom.coordinates.map((p: any) => p[0])
    // v2.9.221: los CAMINOS son líneas y ahora entran al motor.
    : geom.type === "LineString" ? [geom.coordinates]
    : geom.type === "MultiLineString" ? geom.coordinates : null;
  if (!anillos) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const anillo of anillos) for (const p of anillo) {
    if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
  }
  return x0 === Infinity ? null : [x0, y0, x1, y1];
}
// v2.9.324: el centro de una zona, para poder decir «este obstáculo cae dentro
// del paso que abrió la brecha». Las zonas de obra son círculos, así que el
// centro de su caja es el centro de verdad.
function centroDeGeom(geom: any): number[] | null {
  const c = cajaDeGeom(geom);
  return c ? [(c[0] + c[2]) / 2, (c[1] + c[3]) / 2] : null;
}
function prepararTerreno(terreno: any[]) {
  // v2.9.451: la carta ya preparada sale tal cual — el grafo de caminos (que se guarda
  // por carta) se arma una sola vez para el 🤖 G-4 automático y para el turno.
  if (terreno && (terreno as any)._prep) return terreno;
  const out: any = (terreno || []).map((t: any) => (t && t._caja ? t : { ...t, _caja: cajaDeGeom(t && t.geojson) }));
  out._prep = true;
  return out;
}
function fueraDeCaja(pt: number[], t: any) {
  const c = t._caja;
  return !!c && (pt[0] < c[0] || pt[0] > c[2] || pt[1] < c[1] || pt[1] > c[3]);
}
// v2.9.221 — LOS CAMINOS SE ANDAN. Hasta acá la capa `via` era DECORACIÓN: el
// motor no la miraba, así que un motorizado quedaba clavado «a los 0.0 km» en
// cuanto el sector era restringido, aunque tuviera una carretera por delante.
const CAMINO_KM = 0.15;
// ============================================================
// v2.9.443 — EL SUELO SE MIRA CADA 50 m, Y SÓLO EL CAMINO DE VERDAD ABRE PASO.
// Sergio: «rojo hay veces que pasa sobre terreno severamente restringido y no se
// detiene, pasa normal… terreno restringido y severamente restringido no se pasa».
// Medido en «ZAPATO II»: en el turno 1 el BAT. INF. BLIN. rojo cruzó 117 m de
// terreno severo sin ningún camino. Había dos causas:
//   1) la marcha miraba el suelo sólo en la punta de cada paso de 500 m: una
//      franja más angosta quedaba entre dos miradas y se la saltaba;
//   2) TODO el calco de comunicaciones contaba como carretera —también las
//      sendas, el ferrocarril y los aeródromos— y a 150 m de cualquiera de esas
//      líneas «mandaba el camino». Con 751 líneas en la carta, la ficha iba de
//      una a otra y cruzaba.
// Ahora el suelo se mira cada 50 m (como ya se hacía con el campo minado) y:
//   · abren paso las carreteras, los caminos, las calles y las vías militares;
//   · la senda (huella) sólo le sirve a la tropa a pie;
//   · el ferrocarril y el aeródromo no son caminos;
//   · los RÍOS (±50 m de su traza) y las LAGUNAS frenan a los vehículos; se
//     cruzan por el puente de un camino (a 50 m o menos de la traza) o por el
//     que tienda la ingeniería; la tropa a pie VADEA el río despacio. El
//     humedal (bofedal) es terreno restringido. Las quebradas y arroyos no
//     frenan (Sergio, 31-10-2026: «a) sí · b) sí»).
// Para que no se haga lento, la carta se indexa una vez en una grilla de ~1 km:
// cada pregunta mira sólo lo que hay en su celda.
// ============================================================
const MUESTRA_KM = 0.05;      // el suelo se mira cada 50 m
const RIO_BANDA_KM = 0.05;    // un río ocupa ±50 m alrededor de su traza
const PUENTE_KM = 0.05;       // un camino a ≤50 m del agua la cruza: es el puente
const CELDA_GRADOS = 0.01;    // grilla del índice (~1,1 km)
const TIPOS_POLIGONO_IDX = ["restringido", "severo", "clave", "ae", "defensivo", "minado", "interdiccion"];
// Qué es cada elemento de la capa de comunicaciones para la marcha.
//   líneas:    "camino" (abre paso a todos) · "senda" (sólo a pie) · null (no es camino)
//   polígonos: "brecha" (la abrió la ingeniería: pasa a través de todo menos del
//              agua) · "puente" (cruza el agua) · null (el aeródromo importado)
// Lo importado antes de la v2.9.439 no trae la capa (`e.k`): se mira el nombre, y
// si no dice nada, la línea sigue siendo camino, como siempre.
function claseVia(t: any): string | null {
  const g = (t && t.geojson) || {};
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    if (g.obra === "puente") return "puente";
    return (t.bando || g.obra === "brecha") ? "brecha" : null;
  }
  const k = g.e && g.e.k;
  if (k === "comunicaciones_ffcc" || k === "comunicaciones_aero") return null;
  if (k === "comunicaciones_huellas") return "senda";
  if (k) return "camino";
  const nom = String(g.nom || "");
  if (/ferrocarril|v[ií]a f[eé]rrea|l[ií]nea f[eé]rrea/i.test(nom)) return null;
  if (/\b(senda|sendero|huella|trocha|camino de herradura)\b/i.test(nom)) return "senda";
  return "camino";
}
// Qué es cada elemento del calco hidrográfico para la marcha.
//   "rio" (línea de río o canal) · "agua" (laguna, lago, embalse: no se cruza)
//   "humedal" (bofedal o cuerpo de agua sin nombre: terreno restringido) · null
// La Mesa separa «Ríos y canales» (hidro_lineas), «Lagos, embalses y humedales»
// (hidro_poligonos) y «Quebradas / drenaje» (hidro_quebradas). Lo importado
// antes de la v2.9.439 no trae la capa: se mira el nombre («Río Lauca»,
// «Laguna Macaya», «Quebrada»); una línea sin nombre no frena.
function claseAgua(t: any): string | null {
  const g = (t && t.geojson) || {};
  const k = g.e && g.e.k;
  const nom = String(g.nom || "");
  if (k === "hidro_quebradas") return null;
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    if (/\b(laguna|lago|lagunilla|embalse|represa|reservorio|dique)\b/i.test(nom)) return "agua";
    return "humedal";
  }
  if (/quebrada|arroyo|riachuelo|acequia|zanja|vertiente/i.test(nom)) return null;
  if (k === "hidro_lineas") return "rio";
  return /^\s*r[ií]o\b/i.test(nom) ? "rio" : null;
}
// ---------- El índice de la carta (grilla) ----------
const _indices = new WeakMap<any, any>();
function claveCelda(cx: number, cy: number) { return (cx + 20000) * 40000 + (cy + 20000); }
function indiceDe(terreno: any[]) {
  const arr = terreno || [];
  let idx = _indices.get(arr);
  if (idx) return idx;
  const celdas = new Map<number, any>();
  const celda = (cx: number, cy: number) => {
    const k = claveCelda(cx, cy);
    let c = celdas.get(k);
    if (!c) { c = { polis: [], segs: [] }; celdas.set(k, c); }
    return c;
  };
  const enCaja = (x0: number, y0: number, x1: number, y1: number, fn: (c: any) => void) => {
    const cx0 = Math.floor(x0 / CELDA_GRADOS), cx1 = Math.floor(x1 / CELDA_GRADOS);
    const cy0 = Math.floor(y0 / CELDA_GRADOS), cy1 = Math.floor(y1 / CELDA_GRADOS);
    if ((cx1 - cx0 + 1) * (cy1 - cy0 + 1) > 250000) return;   // un polígono absurdo no traba el turno
    for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) fn(celda(cx, cy));
  };
  for (const t of arr) {
    if (!t || !t.geojson || !t.geojson.type) continue;
    const g = t.geojson;
    const poli = g.type === "Polygon" || g.type === "MultiPolygon";
    if (poli) {
      if (t.tipo === "via") { const cv = claseVia(t); if (!cv) continue; t._via = cv; }
      else if (t.tipo === "hidro") { const ca = claseAgua(t); if (!ca || ca === "rio") continue; t._agua = ca; }
      else if (!TIPOS_POLIGONO_IDX.includes(t.tipo)) continue;
      if (!t._caja) t._caja = cajaDeGeom(g);
      const c = t._caja;
      if (!c) continue;
      enCaja(c[0], c[1], c[2], c[3], (ce) => ce.polis.push(t));
      continue;
    }
    let clase: string | null = null, margen = 0;
    if (t.tipo === "via") { clase = claseVia(t); margen = CAMINO_KM; }
    else if (t.tipo === "hidro") { clase = claseAgua(t) === "rio" ? "rio" : null; margen = RIO_BANDA_KM; }
    if (!clase) continue;
    for (const linea of lineasDe(g)) {
      for (let i = 1; i < linea.length; i++) {
        const a = linea[i - 1], b = linea[i];
        if (!a || !b) continue;
        const dLat = margen / 110.57, dLng = dLat / Math.max(1e-6, Math.cos(rad((a[1] + b[1]) / 2)));
        const seg = { a, b, c: clase, t };
        enCaja(Math.min(a[0], b[0]) - dLng, Math.min(a[1], b[1]) - dLat,
          Math.max(a[0], b[0]) + dLng, Math.max(a[1], b[1]) + dLat, (ce) => ce.segs.push(seg));
      }
    }
  }
  idx = {
    celdas,
    celdaDe(pt: number[]) {
      return celdas.get(claveCelda(Math.floor(pt[0] / CELDA_GRADOS), Math.floor(pt[1] / CELDA_GRADOS))) || null;
    },
  };
  _indices.set(arr, idx);
  return idx;
}
// ¿El tramo a→b pasa sólo por celdas sin nada en la carta? Ahí la marcha puede ir
// de a 500 m: es campo abierto y no hay nada que mirar.
function tramoLibre(idx: any, a: number[], b: number[]) {
  const cx0 = Math.floor(Math.min(a[0], b[0]) / CELDA_GRADOS), cx1 = Math.floor(Math.max(a[0], b[0]) / CELDA_GRADOS);
  const cy0 = Math.floor(Math.min(a[1], b[1]) / CELDA_GRADOS), cy1 = Math.floor(Math.max(a[1], b[1]) / CELDA_GRADOS);
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cy = cy0; cy <= cy1; cy++) {
      const c = idx.celdas.get(claveCelda(cx, cy));
      if (c && (c.polis.length || c.segs.length)) return false;
    }
  }
  return true;
}
// Lo que hay en el punto, de una sola mirada a su celda: distancia al camino más
// cercano, si cae en una brecha o un puente, y si cae en agua.
function sueloEn(pt: number[], c: any, aPie: boolean) {
  let dCamino = Infinity, poli: string | null = null, agua: string | null = null, rio = false;
  for (const s of c.segs) {
    if (s.c === "rio") { if (!rio && distPtSegKm(pt, s.a, s.b) <= RIO_BANDA_KM) rio = true; continue; }
    if (s.c === "senda" && !aPie) continue;
    const d = distPtSegKm(pt, s.a, s.b);
    if (d < dCamino) dCamino = d;
  }
  for (const t of c.polis) {
    if (!t._via && !t._agua) continue;
    if (fueraDeCaja(pt, t) || !puntoEnGeom(pt, t.geojson)) continue;
    if (t._via) { if (t._via === "puente" || !poli) poli = t._via; continue; }
    if (t._agua === "agua") agua = "agua";
    else if (!agua) agua = "humedal";
  }
  if (rio && agua !== "agua") agua = "rio";
  return { dCamino, poli, agua };
}
// v2.9.443: ¿el punto cae en una brecha o puente abiertos por la ingeniería?
function brechaEn(pt: number[], terreno: any[]) {
  const c = indiceDe(terreno).celdaDe(pt);
  if (!c) return null;
  for (const t of c.polis) {
    if (t._via && !fueraDeCaja(pt, t) && puntoEnGeom(pt, t.geojson)) return t._via;
  }
  return null;
}
function distPtSegKm(p: number[], a: number[], b: number[]) {
  const kx = 111.32 * Math.cos(rad(p[1])), ky = 110.57;
  const px = (p[0] - a[0]) * kx, py = (p[1] - a[1]) * ky;
  const bx = (b[0] - a[0]) * kx, by = (b[1] - a[1]) * ky;
  const L = bx * bx + by * by;
  let t = L > 0 ? (px * bx + py * by) / L : 0;
  t = t < 0 ? 0 : (t > 1 ? 1 : t);
  const dx = px - bx * t, dy = py - by * t;
  return Math.sqrt(dx * dx + dy * dy);
}
function lineasDe(geom: any): number[][][] {
  if (!geom) return [];
  if (geom.type === "LineString") return [geom.coordinates];
  if (geom.type === "MultiLineString") return geom.coordinates;
  return [];
}
function fueraDeCajaCon(pt: number[], t: any, holguraKm: number) {
  const c = t._caja;
  if (!c) return false;
  const dLat = holguraKm / 110.57;
  const dLng = dLat / Math.max(1e-6, Math.cos(rad(pt[1])));
  return pt[0] < c[0] - dLng || pt[0] > c[2] + dLng || pt[1] < c[1] - dLat || pt[1] > c[3] + dLat;
}
// ============================================================
// v2.9.354 — EL EJE NO ES UNA RUTA: ES UNA DECISIÓN DEL G-4.
// Sergio: «el eje es la planificación del G-4 y ahí es donde se puede
// equivocar, y hay que dejarle que se equivoque».
// Desde la v2.9.345 el `eje_log` contaba como camino, y esa era la razón de
// que el G-4 NO PUDIERA equivocarse: trazara por donde trazara —una ruta, un
// río, la ladera de un cerro— el motor le daba 50 km/h. Un eje trazado sobre
// la nada rendía igual que uno trazado sobre la carretera, así que planificar
// bien no servía de nada.
// Ahora manda el SUELO. El eje bien planificado sigue rindiendo 50 km/h,
// porque un G-4 lo traza sobre rutas y esas rutas ya son `via`. El mal
// planificado frena a la columna — y ahí el alumno aprende por qué el EPA se
// estudia sobre la carta antes de dibujarlo.
// v2.9.234: una brecha abierta por zapadores es un ÁREA por la que se pasa,
// no una traza. Sin esto la obra terminada no habría servido de nada.
// v2.9.443: con el índice de la carta, y sin sendas, ferrocarril ni aeródromos.
// ============================================================
function enCamino(pt: number[], terreno: any[], aPie = false) {
  const c = indiceDe(terreno).celdaDe(pt);
  if (!c) return false;
  const s = sueloEn(pt, c, aPie);
  return !!s.poli || s.dCamino <= CAMINO_KM;
}
// ============================================================
// v2.9.439 — EL OBSTÁCULO CONSTRUIDO ES DE UN BANDO Y LE PESA AL OTRO.
// Una zanja antitanque, una alambrada o una demolición (las del plan de
// barreras que llega construido de la Mesa y las obras de la partida) llevan
// `bando`: frenan al ENEMIGO y su dueño conoce los pasos, igual que en el campo
// minado. Y mandan sobre el camino: antes «la carretera manda sobre todo», así
// que la voladura del puente o la zanja que corta la ruta no frenaban a nadie.
// Sin `bando` (bono de defensa, observación) todo cuenta como siempre.
// ============================================================
function obstaculoContra(pt: number[], terreno: any[], bando: string) {
  const c = indiceDe(terreno).celdaDe(pt);
  return c ? obstaculoEnCelda(pt, c, bando) : null;
}
function obstaculoEnCelda(pt: number[], c: any, bando: string) {
  let r: string | null = null;
  for (const t of c.polis) {
    if (!t.bando || t.bando === bando || t._via) continue;
    if (t.tipo !== "severo" && t.tipo !== "restringido") continue;
    if (fueraDeCaja(pt, t) || !puntoEnGeom(pt, t.geojson)) continue;
    if (t.tipo === "severo") return "severo";
    r = "restringido";
  }
  return r;
}
// v2.9.439 — CON QUÉ SE TOPÓ. La obra enemiga que corta el paso en ese punto,
// para que la bitácora diga «zanja antitanque» y no «terreno severo»: el que la
// encontró no sabía que estaba ahí, y lo que corresponde es abrir brecha.
const NOMBRE_OBRA: any = { zanja_at: "zanja antitanque", demolicion: "demolición", bloqueo: "bloqueo de ruta",
  minado_ap: "campo minado AP", minado_ac: "campo minado AC", minado_mixto: "campo minado mixto",
  alambre_simple: "alambrada", alambre_doble: "alambrada doble", concertina: "concertina",
  concertina_triple: "concertina triple", abatida: "abatida" };
function obraQueCorta(pt: number[], terreno: any[], bando: string) {
  const c = indiceDe(terreno).celdaDe(pt);
  for (const t of (c ? c.polis : [])) {
    if (!t.bando || t.bando === bando || t.tipo !== "severo" || t._via) continue;
    if (!fueraDeCaja(pt, t) && puntoEnGeom(pt, t.geojson)) return t;
  }
  return null;
}
function nombreObra(t: any) {
  const g = (t && t.geojson) || {};
  return NOMBRE_OBRA[g.obs] || (g.nom ? String(g.nom).replace(/\s*\(.*\)\s*$/, "") : "obstáculo");
}
// La clase de terreno en un punto, para la marcha de `bando` con su `medio`:
//   camino · libre · restringido · severo · rio · agua
// En este orden manda:
//   1) el AGUA (río o laguna): sólo se cruza por un puente (camino a ≤50 m, o
//      el que tendió la ingeniería) — y el puente volado por el enemigo, no;
//   2) la BRECHA de la ingeniería: pasa a través de la roca, del monte y del
//      obstáculo del enemigo;
//   3) el OBSTÁCULO SEVERO del enemigo (zanja, demolición): corta también el camino;
//   4) el CAMINO (a 150 m de una carretera o camino; la senda sólo a pie);
//   5) el terreno natural: severo, restringido (y el humedal), o libre.
// Sin `bando` las obras de los bandos cuentan como terreno natural (bono de
// defensa, observación), como siempre.
function claseTerreno(pt: number[], terreno: any[], bando?: string, medio?: string) {
  const c = indiceDe(terreno).celdaDe(pt);
  if (!c) return "libre";
  const obs = bando ? obstaculoEnCelda(pt, c, bando) : null;
  const s = sueloEn(pt, c, medio === "pie");
  if (s.agua === "agua" || s.agua === "rio") {
    if (s.poli === "puente" || s.dCamino <= PUENTE_KM) return obs === "severo" ? "severo" : (obs || "camino");
    return s.agua;
  }
  if (s.poli) return "camino";
  if (obs === "severo") return "severo";
  if (s.dCamino <= CAMINO_KM) return obs || "camino"; // la carretera manda sobre el terreno natural
  let restringido = obs === "restringido" || s.agua === "humedal";
  for (const t of c.polis) {
    if (t._via || t._agua) continue;
    if (bando && t.bando) continue;   // v2.9.439: las obras de un bando ya se miraron arriba
    if (t.tipo !== "severo" && t.tipo !== "restringido") continue;
    if (fueraDeCaja(pt, t) || !puntoEnGeom(pt, t.geojson)) continue;
    if (t.tipo === "severo") return "severo";
    restringido = true;
  }
  return restringido ? "restringido" : "libre";
}
// v2.9.226: ¿el punto cae en una zona INTERDICTADA todavía viva? Las zonas
// vencen: el fuego de interdicción no dura para siempre.
function enInterdiccion(pt: number[], terreno: any[], turno?: any) {
  const c = indiceDe(terreno).celdaDe(pt);
  for (const t of (c ? c.polis : [])) {
    if (t.tipo !== "interdiccion") continue;
    if (turno != null && t.hasta_turno != null && turno > t.hasta_turno) continue;
    if (fueraDeCaja(pt, t)) continue;
    if (puntoEnGeom(pt, t.geojson)) return true;
  }
  return false;
}
function enTerrenoClave(pt: number[], terreno: any[]) {
  const c = indiceDe(terreno).celdaDe(pt);
  return !!c && c.polis.some((t: any) => t.tipo === "clave" && !fueraDeCaja(pt, t) && puntoEnGeom(pt, t.geojson));
}
// ============================================================
// v2.9.324 — CAMPO MINADO. No es «terreno lento»: es un obstáculo que DETIENE.
//
// La diferencia con la interdicción es la que enseña: el fuego de interdicción
// encarece el paso y se aguanta si hay prisa; un campo minado te para en seco y
// no se pasa por voluntad, se pasa abriendo BRECHA. Por eso no devuelve un
// multiplicador de velocidad sino la zona en la que se entró.
//
// El que lo sembró pasa: conoce sus pasillos. Ésa es la razón doctrinal por la
// que un obstáculo propio no estorba y por la que hay que registrarlos.
// ============================================================
// v2.9.440 — EL CAMPO MINADO EXPLOTA, Y NADIE LO SALTA.
// Sergio, con la partida «ZAPATO II»: «esta unidad de rojo pasó por encima del
// campo minado sin novedad, lo cruzó como si fuera terreno normal… debería ir
// explotando y explotando hasta detenerse y reducirse por lo menos».
// Dos cosas cambian:
//   1) EL SUELO SE MIRA CADA 50 m. La marcha avanza de a 500 m y el campo se
//      buscaba sólo en la punta de cada paso: un campo angosto, o tomado en
//      diagonal, podía quedar ENTRE dos puntas y la columna pasaba de largo.
//   2) LA VANGUARDIA ENTRA SIN SABERLO. Salta la primera mina, la orden de alto
//      tarda en llegar a toda la columna y saltan más —una cada 100 m de campo—
//      hasta la tercera. Cada detonación se lleva su parte según el medio y el
//      tipo de campo, y se ve en la película. La unidad queda DETENIDA al borde,
//      donde lo encontró: fija y localizada para el fuego del dueño.
// (La búsqueda punto por punto de la v2.9.324, `enMinado`, dio paso a
// `campoEnPaso`, dentro de `moverUnidad`.)
// ============================================================
const MINA_MUESTRA_KM = 0.05;
const MINA_CADA_KM = 0.1;
const MINA_DETONACIONES = 3;
// Lo que se lleva CADA detonación, en fracción del poder que le queda. La mina
// anticarro (AC) no salta bajo un hombre; la antipersonal (AP) apenas raya un
// blindado. Tres detonaciones en un campo mixto cuestan lo de la v2.9.324: a
// pie 10 %, oruga 18 %, motorizado 22 %, camión 30 %.
const MINA_GOLPE: any = {
  pie: { ap: 0.05, ac: 0.01, mixto: 0.035 },
  oruga: { ap: 0.01, ac: 0.08, mixto: 0.065 },
  motor: { ap: 0.02, ac: 0.10, mixto: 0.08 },
  rueda: { ap: 0.04, ac: 0.13, mixto: 0.11 },
};
const NOMBRE_CAMPO: any = { ap: "antipersonal", ac: "anticarro", mixto: "mixto" };
// AP, AC o mixto. Lo importado antes de la v2.9.439 no trae `obs`: se lee la
// sigla del rótulo («CM AC (proyectado)»). El que se siembra en la partida es
// mixto («minas AP y AT»).
function tipoDeCampo(z: any) {
  const g = (z && z.geojson) || {};
  if (g.obs === "minado_ap") return "ap";
  if (g.obs === "minado_ac") return "ac";
  if (g.obs) return "mixto";
  const nom = String(g.nom || "").toUpperCase();
  if (/^CM AP\b/.test(nom)) return "ap";
  if (/^CM AC\b/.test(nom)) return "ac";
  return "mixto";
}
// Dónde están las minas: el campo DIBUJADO (`dib`) cuando la fila es una zona
// de efecto con margen (el plan de barreras de la Mesa); si no, la zona misma
// (el campo que se siembra en la partida). El margen de 150 m existía porque el
// suelo se miraba cada 500 m; mirándolo cada 50, las minas saltan donde están
// dibujadas y no en el pasto de al lado.
function geomDelCampo(t: any) {
  const g = t && t.geojson, d = g && g.dib;
  return d && (d.type === "Polygon" || d.type === "MultiPolygon") ? d : g;
}
// Los campos minados que le pesan a una unidad: los del otro bando y los que no
// tienen dueño (el dueño conoce sus pasillos). Se arma una vez por marcha —son
// un puñado entre cientos de filas— con la geometría de las minas y su caja.
function camposContra(terreno: any[], bando?: string) {
  const out: any[] = [];
  for (const t of terreno || []) {
    if (!t || t.tipo !== "minado" || (bando && t.bando === bando)) continue;
    const geom = geomDelCampo(t);
    out.push({ fila: t, geom, _caja: cajaDeGeom(geom) });
  }
  return out;
}
// ¿El punto pisa ese campo?
function pisaCampo(pt: number[], c: any) {
  return !fueraDeCaja(pt, c) && puntoEnGeom(pt, c.geom);
}
// Cuánto adentro de un campo está un punto: la distancia a su borde más cercano.
function distAlBordeKm(pt: number[], geom: any) {
  const polis = geom && geom.type === "Polygon" ? [geom.coordinates]
    : geom && geom.type === "MultiPolygon" ? geom.coordinates : [];
  let d = Infinity;
  for (const poli of polis) {
    for (const anillo of poli) {
      for (let i = 1; i < anillo.length; i++) d = Math.min(d, distPtSegKm(pt, anillo[i - 1], anillo[i]));
    }
  }
  return d;
}
// ¿El tramo a→b pasa cerca de la caja de la zona? Prefiltro barato.
function tramoTocaCaja(a: number[], b: number[], t: any, holguraKm = 0.06) {
  const c = t && t._caja;
  if (!c) return true;
  const dLat = holguraKm / 110.57, dLng = dLat / Math.max(1e-6, Math.cos(rad(a[1])));
  return !(Math.max(a[0], b[0]) < c[0] - dLng || Math.min(a[0], b[0]) > c[2] + dLng
    || Math.max(a[1], b[1]) < c[1] - dLat || Math.min(a[1], b[1]) > c[3] + dLat);
}
// Dónde saltan las minas: la primera donde entró y una cada 100 m de campo por
// la dirección de la marcha, hasta la tercera — o hasta que se termine el campo
// o la ruta.
function puntosDeDetonacion(entrada: number[], destino: number[], zona: any) {
  const pts: number[][] = [entrada];
  const total = haversineKm(entrada, destino);
  for (let k = 1; k < MINA_DETONACIONES; k++) {
    const dk = k * MINA_CADA_KM;
    if (total <= 0 || dk > total + 1e-9) break;
    const f = dk / total;
    const q = [entrada[0] + (destino[0] - entrada[0]) * f, entrada[1] + (destino[1] - entrada[1]) * f];
    if (!pisaCampo(q, zona)) break;
    pts.push(q);
  }
  return pts;
}
// Cuánto le cuesta a la unidad: cada detonación se lleva su fracción de lo que
// le QUEDA (la segunda pega sobre lo que dejó la primera).
function golpeDeMinas(u: any, zona: any, n: number) {
  const g = MINA_GOLPE[medioDe(u)] || MINA_GOLPE.pie;
  const f = g[tipoDeCampo(zona)] != null ? g[tipoDeCampo(zona)] : g.mixto;
  return 1 - Math.pow(1 - f, Math.max(0, n));
}
// ============================================================
// Lo que una BRECHA levanta al abrirse.
//
// ⚠️ TRAMPA: `restringido` y `severo` son TAMBIÉN los tipos del terreno natural
// que viene del Generador (un pantano, una cordillera). Si se borrara por tipo
// a secas, abrir una brecha de 600 m eliminaría del tablero el polígono entero
// de terreno severo de media carta. Lo que distingue a un obstáculo CONSTRUIDO
// es que tiene `bando`: lo sembró alguien. El terreno importado no lo tiene.
//
// La posición defensiva no está en la lista a propósito: no es un obstáculo, es
// una obra propia — volar la trinchera del enemigo es asaltarla, no zapar.
// ============================================================
const OBSTACULO_TIPOS = ["minado", "restringido", "severo"];
function esObstaculoConstruido(z: any) {
  return !!(z && z.bando && OBSTACULO_TIPOS.includes(z.tipo));
}
// ============================================================
// v2.9.440 — EL PLAN DE BARRERAS SE CONSTRUYE EN LA PARTIDA, SIN VOLVER A
// IMPORTAR. «ZAPATO II» entró antes de la v2.9.439: sus 13 obras están como
// dibujo (`obstaculo`, «CM MX (proyectado)», sin dueño) y el motor no las ve,
// así que el blindado rojo cruzó el campo minado como si fuera campo abierto.
// Reimportar la reinicia en el turno 0. Ahora el árbitro decide, en cualquier
// turno, si el plan está CONSTRUIDO —con la zona de efecto y el dueño que le da
// la importación de la v2.9.439— o PROYECTADO (se ve punteado, no frena).
// Mismas siglas, efectos y márgenes que `_wgEscenarioDesde` del Juego.
// ============================================================
const OBS_ABREV: any = { alambre_simple: "AL", alambre_doble: "AL 2", concertina: "CONC",
  concertina_triple: "CONC 3", zanja_at: "ZAT", abatida: "ABT", minado_ap: "CM AP", minado_ac: "CM AC",
  minado_mixto: "CM MX", minado_ficticio: "CM FIC", demolicion: "DEM", bloqueo: "BLQ" };
const OBS_POR_ABREV: any = Object.fromEntries(Object.entries(OBS_ABREV).map(([k, v]) => [v, k]));
const OBS_MECANICO: any = { minado_ap: "minado", minado_ac: "minado", minado_mixto: "minado",
  zanja_at: "severo", demolicion: "severo", bloqueo: "severo",
  alambre_simple: "restringido", alambre_doble: "restringido", concertina: "restringido",
  concertina_triple: "restringido", abatida: "restringido" };
const OBS_AREA = ["minado_ap", "minado_ac", "minado_mixto", "minado_ficticio"];
// Qué obra de la Mesa es una fila (por `obs`, o por la sigla del rótulo en lo
// importado antes de la v2.9.439), o null si no es del plan de barreras.
function obraDelPlan(t: any) {
  const g = (t && t.geojson) || {};
  if (g.obs && OBS_ABREV[g.obs]) return g.obs;
  if (t && t.tipo === "obstaculo") return OBS_POR_ABREV[String(g.nom || "").replace(/\s*\(.*$/, "").trim()] || null;
  return null;
}
function nombreObraPlan(t: any) {
  const obs = obraDelPlan(t);
  return obs ? `${NOMBRE_OBRA[obs] || obs} (${OBS_ABREV[obs]})` : nombreObra(t);
}
// La ZONA DE EFECTO de una obra construida: la obra y `rKm` alrededor (la
// envolvente convexa de un círculo en cada vértice). Gemelo de
// `_wgHuellaObstaculo` del Juego: para la línea recta o el rectángulo que traza
// la Mesa es exactamente la franja.
function huellaObstaculo(g: any, rKm: number) {
  const pts: number[][] = [];
  const verts = !g ? [] : g.type === "Point" ? [g.coordinates]
    : g.type === "LineString" ? g.coordinates
    : g.type === "Polygon" ? g.coordinates[0] : [];
  for (const v of verts || []) {
    const lng = Number(v[0]), lat = Number(v[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    const dy = rKm / 110.57, dx = rKm / (111.32 * Math.cos(rad(lat)) || 1e-9);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; pts.push([lng + dx * Math.cos(a), lat + dy * Math.sin(a)]); }
  }
  if (pts.length < 3) return null;
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cruz = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const abajo: number[][] = [], arriba: number[][] = [];
  for (const p of pts) {
    while (abajo.length >= 2 && cruz(abajo[abajo.length - 2], abajo[abajo.length - 1], p) <= 0) abajo.pop();
    abajo.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (arriba.length >= 2 && cruz(arriba[arriba.length - 2], arriba[arriba.length - 1], p) <= 0) arriba.pop();
    arriba.push(p);
  }
  const casco = abajo.slice(0, -1).concat(arriba.slice(0, -1))
    .map((p) => [Math.round(p[0] * 1e6) / 1e6, Math.round(p[1] * 1e6) / 1e6]);
  if (casco.length < 3) return null;
  casco.push(casco[0]);
  return { type: "Polygon", coordinates: [casco] };
}
// Lo que hay que cambiar en las filas para que el plan quede construido (o
// proyectado). Sólo toca lo del plan: el CMOC importado y las obras hechas en la
// partida no tienen `obs` ni sigla de la Mesa, y no se tocan. Lo que no tenía
// dueño (importado antes de la v2.9.439) pasa a ser del AZUL, como en la
// importación: el plan de barreras es el propio, y así viaja con niebla.
function planDeBarreras(filas: any[], construir: boolean) {
  const cambios: any[] = [];
  for (const t of filas || []) {
    const obs = obraDelPlan(t);
    if (!obs || t.id == null) continue;
    const g = t.geojson || {};
    const dib = (g.dib && g.dib.type) ? g.dib : { type: g.type, coordinates: g.coordinates };
    if (!dib.type || !dib.coordinates) continue;
    const ab = OBS_ABREV[obs], bando = t.bando || "azul";
    const yaConstruido = t.tipo !== "obstaculo" || g.est === "construido";
    if (construir) {
      if (yaConstruido) continue;
      const mec = OBS_MECANICO[obs];   // el campo minado ficticio no detiene a nadie
      const huella = mec ? huellaObstaculo(dib, OBS_AREA.includes(obs) ? 0.15 : 0.3) : null;
      cambios.push(huella
        ? { id: t.id, tipo: mec, bando, geojson: { ...huella, nom: ab, obs, est: "construido", dib } }
        : { id: t.id, tipo: "obstaculo", bando, geojson: { ...dib, nom: ab, obs, est: "construido" } });
    } else {
      if (!yaConstruido) continue;
      cambios.push({ id: t.id, tipo: "obstaculo", bando, geojson: { ...dib, nom: ab + " (proyectado)", obs, est: "proyectado" } });
    }
  }
  return cambios;
}
// Las obras PROYECTADAS del plan por las que pasó una marcha (las que tendrían
// efecto construidas y son del otro bando). No frenan: sólo se avisa al árbitro.
function obrasProyectadasEnRuta(ruta: number[][], terreno: any[], bando?: string) {
  const out: any[] = [];
  if (!Array.isArray(ruta) || ruta.length < 2) return out;
  for (const t of terreno || []) {
    if (!t || t.tipo !== "obstaculo" || (t.geojson && t.geojson.est === "construido")) continue;
    if ((t.bando || "azul") === bando) continue;   // el dueño sabe que todavía no está
    const obs = obraDelPlan(t);
    if (!obs || !OBS_MECANICO[obs]) continue;
    // La misma zona que tendría construida: las minas, donde están dibujadas;
    // la zanja, la alambrada o la demolición, con su franja de 300 m.
    const g = t.geojson || {};
    const dib = (g.dib && g.dib.type) ? g.dib : g;
    const zona = OBS_MECANICO[obs] === "minado" && /Polygon$/.test(dib.type || "") ? dib : huellaObstaculo(dib, 0.3);
    if (!zona) continue;
    const z = { geojson: zona, _caja: cajaDeGeom(zona) };
    let pasa = false;
    for (let i = 1; i < ruta.length && !pasa; i++) {
      const a = ruta[i - 1], b = ruta[i];
      if (!tramoTocaCaja(a, b, z)) continue;
      const n = Math.max(1, Math.ceil(haversineKm(a, b) / MINA_MUESTRA_KM));
      for (let j = 0; j <= n && !pasa; j++) {
        const q = [a[0] + (b[0] - a[0]) * (j / n), a[1] + (b[1] - a[1]) * (j / n)];
        if (!fueraDeCaja(q, z) && puntoEnGeom(q, zona)) pasa = true;
      }
    }
    if (pasa) out.push(t);
  }
  return out;
}
// v2.9.221: `camino` es la clase más rápida para TODOS los medios, y la única
// forma de que el motorizado atraviese un sector restringido o severo.
// v2.9.353 — EL CONVOY RUEDA SOBRE LLANTAS, NO SOBRE ORUGAS.
// Sergio: «asumiendo que estos vehículos son camiones o tráilers, su capacidad
// de desplazamiento es por llantas de vehículos militares — eso también tenés
// que verlo».
// Un camión militar 6×6 CARGADO no se mueve como el vehículo táctico:
//   · en carretera rinde igual o mejor (va por ruta, es su medio natural);
//   · campo traviesa cae a menos de la mitad — columna, sin dispersarse;
//   · en terreno restringido PASA, pero al paso del hombre que lo guía (el 6×6
//     tiene tracción en los tres ejes; el vehículo táctico común, no);
//   · en terreno severo NO ENTRA, y ahí no hay tracción que valga.
// De ahí sale la razón de que el abastecimiento se planifique sobre un EJE.
// ============================================================
// v2.9.443 — LO RESTRINGIDO Y LO SEVERAMENTE RESTRINGIDO NO SE PASAN.
// Sergio: «ya sabes, terreno restringido y severamente restringido no se pasa»;
// y confirmado el 31-10-2026: la infantería a pie SÍ cruza el restringido,
// despacio, y vadea los ríos despacio.
//   · RESTRINGIDO: ningún vehículo (ni rueda, ni motorizado, ni oruga). La
//     tropa a pie, a 1,5 km/h.
//   · SEVERAMENTE RESTRINGIDO: no pasa nadie.
//   · RÍO: ningún vehículo sin puente; la tropa a pie vadea a 0,5 km/h.
//   · LAGUNA: no pasa nadie.
// En todos, el paso es por un camino de verdad, por un puente o por la brecha
// que abra la ingeniería (y eso lleva horas: 🛠️ obras).
// ============================================================
const VEL: any = {
  motor: { camino: 50, libre: 40, restringido: null, severo: null, rio: null, agua: null },
  oruga: { camino: 32, libre: 28, restringido: null, severo: null, rio: null, agua: null },
  // v2.9.358 — VELOCIDAD DE COLUMNA, NO DE VEHÍCULO SUELTO. 35 km/h es la marcha
  // de una columna cargada por camino de tercera o cuarta (tierra, ripio), que es
  // por donde va el abastecimiento de verdad; no por autopista.
  rueda: { camino: 35, libre: 12, restringido: null, severo: null, rio: null, agua: null },   // camión militar 6×6
  pie: { camino: 6, libre: 5, restringido: 1.5, severo: null, rio: 0.5, agua: null },
};
// El medio que le toca a cada unidad. El convoy va por llantas aunque su
// columna `medio` diga «motor» — así no hace falta migrar la base.
function medioDe(u: any) { return esConvoy(u) ? "rueda" : (u && u.medio) || "pie"; }
const OBS: any = { camino: 1.0, libre: 1.0, restringido: 0.5, severo: 0.3, rio: 1.0, agua: 1.0 };
// Cómo se nombra cada clase en la bitácora.
const NOM_CLASE: any = { camino: "camino", libre: "campo abierto", restringido: "terreno restringido",
  severo: "terreno severamente restringido", rio: "un río sin puente", agua: "una laguna" };
// v2.9.351 — lo que le cuesta al convoy salirse del camino: 40 km/h campo
// traviesa pasan a 16. No es un castigo: es por qué existe el eje logístico.
// ============================================================
// v2.9.358 — EL CONVOY VA POR CAMINOS. PUNTO.
// Sergio: «todavía cruza cerros como si nada; en realidad sólo debería poder
// moverse por caminos de tercera y cuarta».
// Bajar la velocidad campo traviesa no alcanzaba: con 2 h de turno, a 18 km/h
// una columna igual se comía 36 km de serranía, que es exactamente lo que no
// puede pasar. Un convoy NO cruza cerros: marcha por ruta y sale de ella sólo
// para el último tramo, el de la entrega.
// Eso es este tope: puede salir del camino, pero POCO. Pasado eso la columna se
// detiene donde llegó — no se la castiga ni se le prohíbe la orden: se le cobra
// la planificación, que es lo que hay que enseñar.
// v2.9.444 — Y AHORA NI ESO. Sergio (03-11-2026): «los abastecimientos siempre se
// deben mover por carretera o caminos… no se pueden desplazar por campo
// traviesa». Toda marcha del convoy se rehace sobre la red vial (`rutaConvoy`):
// fuera del camino anda sólo la SALIDA de su instalación hasta la ruta. Medido en
// «CE-IV9»: las instalaciones del G-4 quedaron a 0,1–1,6 km del camino.
const CONVOY_FUERA_RUTA_KM = 2;


// ---------- Combustible (v2.9.225) ----------
// AUTONOMÍA con el tanque lleno, en km de terreno FÁCIL. El de a pie no gasta.
// ⚠️ CIFRAS DE REFERENCIA — a validar contra las tablas del reglamento.
// v2.9.334: la cifra sale del REGLAMENTO (capacidad de apoyo del Bat. Log.:
// «Clase III: hasta 200 km por carreteras»), no del tanque del vehículo. Con
// los 600/450 de antes nadie se quedaba nunca sin combustible: medido sobre
// las partidas reales, lo más que había andado una unidad eran 52 km.
const AUTONOMIA_KM: any = { motor: 200, oruga: 150, rueda: 200, pie: 0 };
// Cuánto MÁS consume cada clase de terreno: por eso se planifica la ruta
// logística y no sólo la táctica.
const CONSUMO_TERRENO: any = { camino: 0.9, libre: 1.0, restringido: 1.6, severo: 2.2, rio: 2.2, agua: 2.2 };
// Lo que gasta por km ESA unidad en esa clase: el camión cargado fuera de camino
// gasta la mitad más (v2.9.351). v2.9.443: una sola cuenta para el tope del
// tanque y para lo que se anota — antes el convoy frenaba con el ×1,5 pero se le
// anotaba sin él, y la previsión del Juego decía otra cifra.
function gastoPorKm(u: any, clase: string) {
  const g = CONSUMO_TERRENO[clase] != null ? CONSUMO_TERRENO[clase] : 1;
  return esConvoy(u) && clase !== "camino" ? g * 1.5 : g;
}
// ---------- Misiones de artillería (v2.9.226) ----------
// INTERDICTAR no busca destruir a nadie: busca NEGAR el uso de un camino, un
// vado o un paso. Por eso no se resuelve con daño instantáneo, sino con una
// zona que QUEDA batida y castiga a todo el que la cruce, propios incluidos.
const MISIONES: any = { destruccion: 1, interdiccion: 1, neutralizacion: 1 };
const INTERDICCION_TURNOS: any = { obus155: 4, obus105: 3, mortero120: 3, mortero81: 2, mortero60: 2,
  lanzacohetes: 2 };   // v2.9.439: la salva satura, pero no sostiene el fuego
const INTERDICCION_ANCHO = 2.5;
const INTERDICCION_POR_KM = 0.06;
// v2.9.201 — BUCLE INFINITO CORREGIDO (ésta era la causa REAL del cartel
// "Edge Function returned a non-2xx status code" al Resolver turno).
// La condición vieja era `avanzado < totalDest`: comparaba la SUMA de los
// tramos recorridos contra la distancia medida al principio. Cuando la unidad
// LLEGABA al destino y le sobraba tiempo del turno, esa suma quedaba a ~1e-13
// km del total por redondeo de coma flotante, y cada vuelta nueva agregaba un
// tramo infinitesimal que se perdía en el mismo redondeo: el `while` no
// terminaba NUNCA. Medido en Node: 200.000 vueltas con la unidad ya a 1 cm del
// destino, y seguía. Acá adentro eso agota el CPU del worker → 500 sin cuerpo.
// Ahora el corte se hace por la distancia REAL que falta, que sí llega a cero.
function moverUnidad(u: any, destino: number[], terreno: any[], horas: number, pasoKm = 0.5, turno: any = null) {
  const _medio = medioDe(u);
  const vel = VEL[_medio] || VEL.pie;
  // v2.9.334 — EL TANQUE SE ACABA DE VERDAD. Desde la v2.9.225 el motor llevaba
  // la cuenta del consumo y hasta avisaba «TANQUE VACÍO», pero era una frase:
  // nada la hacía cumplir. Ahora la autonomía que le queda LIMITA la marcha,
  // igual que el reloj o el terreno infranqueable.
  const tanque = tanqueDe(u);   // v2.9.439: la autonomía planificada de ESA unidad
  const autonomia = tanque > 0 ? Math.max(0, tanque - (Number(u.combustible_km) || 0)) : Infinity;
  const idx = indiceDe(terreno);
  let pos = [u.lng, u.lat];
  const totalDest = haversineKm(pos, destino);
  const porClase0 = () => ({ camino: 0, libre: 0, restringido: 0, severo: 0, rio: 0, agua: 0 });
  // Ya está ahí: misma forma que el resto de los caminos, si no la bitácora y el
  // replay reciben campos vacíos y revientan al formatear.
  if (totalDest < 1e-4) return { lng: pos[0], lat: pos[1], detenida: false, motivo: "en destino",
    avanzadoKm: 0, totalKm: 0, ruta: [[pos[0], pos[1]]], tiempos: [0], cons: [0], batido: [0], horasUsadas: 0, llego: true,
    porClase: porClase0(), consumoKm: 0, kmBatido: 0, minado: null };
  let presupuesto = horas, avanzado = 0, detenida = false, motivo = "", guardia = 0;
  // Con el tanque en cero no arranca (misma forma de retorno de siempre).
  if (autonomia <= 1e-6) return { lng: pos[0], lat: pos[1], detenida: true, motivo: "sin combustible",
    avanzadoKm: 0, totalKm: totalDest, ruta: [[pos[0], pos[1]]], tiempos: [0], cons: [0], batido: [0], horasUsadas: 0, llego: false,
    porClase: porClase0(), consumoKm: 0, kmBatido: 0, minado: null,
    seco: true };
  // v2.9.203: la ruta para el replay y la bitácora. v2.9.443: con la HORA de cada
  // punto (desde que arrancó), lo gastado hasta ahí y los km batidos: el turno se
  // resuelve en el tiempo — dónde estaba cada uno a cada hora — y si un choque la
  // detiene a mitad de camino, se sabe exactamente cuánto anduvo y cuánto gastó.
  const ruta: number[][] = [[pos[0], pos[1]]];
  const tiempos: number[] = [0], cons: number[] = [0], batido: number[] = [0];
  // v2.9.208: ¿arranca metida en terreno que su medio NO cruza? Antes se detenía
  // «a los 0.0 km» TODOS los turnos y quedaba muerta en el tablero para siempre.
  const claseSalida = claseTerreno(pos, terreno, u.bando, _medio);   // v2.9.439: los obstáculos del otro bando
  const atrapada = vel[claseSalida] == null;
  let saliendo = atrapada;
  // v2.9.431 — DE DONDE NO SE CRUZA, SÓLO SE SALE. La regla de la 208 dejaba a
  // la unidad atrapada marchar «a paso de hombre» hacia CUALQUIER destino —
  // también hacia otro punto ADENTRO del mismo terreno. Medido en la partida
  // «qwert»: una división motorizada colocada por el árbitro dentro de un
  // sector restringido hizo 1,7 km y 1,5 km en dos turnos por terreno que su
  // medio no cruza, y la bitácora decía «LLEGÓ» sin explicar nada. Ahora, si el
  // destino también está en terreno que no cruza, no se mueve y se dice por qué.
  const claseDestino = claseTerreno(destino, terreno, u.bando, _medio);
  if (atrapada && vel[claseDestino] == null) {
    return { lng: pos[0], lat: pos[1], detenida: true,
      motivo: `está DENTRO de ${NOM_CLASE[claseSalida] || claseSalida}, que «${_medio}» NO cruza, y el destino `
        + `también cae en ${NOM_CLASE[claseDestino] || claseDestino}. De ahí sólo se SALE: dale un destino `
        + `(o un punto de paso) en terreno transitable o sobre un camino, o mandá zapadores a abrir paso`,
      avanzadoKm: 0, totalKm: totalDest, ruta: [[pos[0], pos[1]]], tiempos: [0], cons: [0], batido: [0],
      horasUsadas: 0, llego: false, porClase: porClase0(), consumoKm: 0, kmBatido: 0, minado: null,
      kmSalida: 0, claseSalida, sigueAdentro: true };
  }
  let kmSalida = 0;   // km hechos a paso de hombre para SALIR del terreno que no cruza
  // v2.9.225 — POR DÓNDE FUE Y QUÉ LE COSTÓ: km por clase de terreno, de donde
  // salen la velocidad media, el reparto camino/campo y el consumo.
  const porClase: any = porClase0();
  let consumoKm = 0, tUsado = 0;
  // v2.9.358: km que la columna lleva ANDADOS fuera de camino en este turno.
  let kmFueraRuta = Number(u._kmFueraRuta) || 0;   // v2.9.443: el tope de 4 km vale para TODO el turno, no por tramo
  const topeFuera = esConvoy(u) ? CONVOY_FUERA_RUTA_KM : Infinity;
  // v2.9.226: km recorridos DENTRO de una zona interdictada.
  let kmBatido = 0;
  // v2.9.324: si entró en un campo minado enemigo, cuál. Uno solo: la marcha se
  // corta ahí, así que no hay un segundo.
  let minado: any = null;
  // v2.9.440: y dónde saltaron las minas (para la bitácora, las bajas y la película).
  let detonaciones: number[][] = [];
  // v2.9.440 — LOS CAMPOS QUE LE PESAN A ESTA UNIDAD, y de cuáles ARRANCA
  // ADENTRO (la frenaron ahí, la puso el árbitro o el campo se construyó
  // encima). De ésos sale por sus propias huellas: ninguna mina salta mientras
  // no se meta más adentro de lo que ya estaba.
  const campos = camposContra(terreno, u.bando);
  const salida = new Map<any, number>();
  for (const c of campos) if (pisaCampo(pos, c)) salida.set(c, distAlBordeKm(pos, c.geom));
  // ¿El paso a→b entra en un campo minado? Se mira el suelo cada 50 m y se
  // devuelve hasta dónde llega (el último punto antes de pisarlo) y por dónde
  // entraría. v2.9.443: por la brecha abierta en el campo se pasa sin pisar minas.
  const campoEnPaso = (a: number[], b: number[]) => {
    if (!campos.length) return null;
    const cerca = campos.filter((c: any) => tramoTocaCaja(a, b, c));
    for (const c of [...salida.keys()]) if (!cerca.includes(c)) salida.delete(c);
    if (!cerca.length) return null;
    const n = Math.max(1, Math.ceil(haversineKm(a, b) / MINA_MUESTRA_KM));
    let antes = a;
    for (let j = 1; j <= n; j++) {
      const q = [a[0] + (b[0] - a[0]) * (j / n), a[1] + (b[1] - a[1]) * (j / n)];
      const porLaBrecha = !!brechaEn(q, terreno);
      for (const c of cerca) {
        if (porLaBrecha || !pisaCampo(q, c)) { salida.delete(c); continue; }
        const p0 = salida.get(c);
        if (p0 != null && distAlBordeKm(q, c.geom) <= p0 + MINA_MUESTRA_KM) continue;   // sale por sus huellas
        return { corte: antes, entrada: q, zona: c };
      }
      antes = q;
    }
    return null;
  };
  // La vanguardia pisó el campo: saltan las minas y la columna se detiene.
  const pisarCampo = (tope: any) => {
    minado = tope.zona.fila;
    detonaciones = puntosDeDetonacion(tope.entrada, destino, tope.zona);
    detenida = true;
    const n = detonaciones.length;
    motivo = `se topó con un OBSTÁCULO ENEMIGO — campo minado ${NOMBRE_CAMPO[tipoDeCampo(minado)]} — `
      + `${n > 1 ? `saltaron ${n} minas` : "saltó una mina"} y la columna se detuvo al borde`;
  };
  const anotar = (clase: string, km: number, pt?: number[]) => {
    if (porClase[clase] == null) porClase[clase] = 0;
    porClase[clase] += km;
    consumoKm += km * gastoPorKm(u, clase);
    if (pt && enInterdiccion(pt, terreno, turno)) kmBatido += km;
  };
  const registrar = () => {
    ruta.push([pos[0], pos[1]]); tiempos.push(tUsado); cons.push(consumoKm); batido.push(kmBatido);
  };
  while (true) {
    const restante = haversineKm(pos, destino);
    if (restante <= 1e-6) break; // llegó (1 mm)
    if (++guardia > 400000) { motivo = "corte de seguridad"; break; }
    // v2.9.443 — EL PASO: 50 m donde la carta tiene algo (un borde, un camino,
    // un río, un campo minado); 500 m de un saque por el campo abierto vacío.
    const largo = Math.min(pasoKm, restante);
    const fL = largo / restante;
    const lejos = [pos[0] + (destino[0] - pos[0]) * fL, pos[1] + (destino[1] - pos[1]) * fL];
    const paso = tramoLibre(idx, pos, lejos) ? largo : Math.min(MUESTRA_KM, restante);
    const frac = paso / restante;
    let sig = [pos[0] + (destino[0] - pos[0]) * frac, pos[1] + (destino[1] - pos[1]) * frac];
    // v2.9.324 — EL CAMPO MINADO PARA LA MARCHA, ANTES DE PISARLO DEL TODO.
    // Se corta en el borde, no en el medio: una columna que toca un campo
    // minado se detiene y se despliega, no lo sigue atravesando. Y se corta
    // ANTES de mover, así la unidad queda DONDE LO ENCONTRÓ — que es el dato
    // que después le sirve al otro bando para saber que su obstáculo funcionó.
    // v2.9.440: el paso se acorta hasta el borde (mirado cada 50 m) y la unidad
    // llega hasta ahí; si el reloj o el tanque no le alcanzan, no lo pisa.
    const tope = campoEnPaso(pos, sig);
    if (tope) {
      sig = tope.corte;
      if (haversineKm(pos, sig) < 1e-6) { pisarCampo(tope); break; }   // ya estaba en el borde
    }
    const clase = claseTerreno(sig, terreno, u.bando, _medio);   // v2.9.439
    let v = vel[clase];
    // Doctrina: del terreno que no se cruza SE SALE, pero a paso de hombre (el
    // vehículo se remolca, la tropa desembarca). Al pisar terreno transitable
    // recupera su velocidad propia.
    const aPasoDeHombre = v == null && saliendo;
    if (aPasoDeHombre) v = (VEL.pie[clase] || 2) * 0.5;
    else if (v != null) saliendo = false;
    if (v == null) {
      detenida = true;
      const obra = clase === "severo" ? obraQueCorta(sig, terreno, u.bando) : null;
      motivo = obra
        ? `se topó con un OBSTÁCULO ENEMIGO — ${nombreObra(obra)} — infranqueable para ${esConvoy(u) ? "la columna" : u.medio}`
        : esConvoy(u)
        ? (clase === "rio" || clase === "agua"
          ? `${NOM_CLASE[clase]}: la columna no lo cruza — el eje tiene que pasar por un puente`
          : `${NOM_CLASE[clase] || "terreno " + clase}: por acá no pasa un camión — el eje no está trazado sobre ruta`)
        : `${clase === "rio" || clase === "agua" ? NOM_CLASE[clase] : "terreno " + clase} infranqueable para ${_medio}`;
      break;
    }
    // ============================================================
    // v2.9.351 — EL CONVOY NO ES UN VEHÍCULO TÁCTICO.
    // Sergio: «estos vehículos se deben mover por terreno de acuerdo a sus
    // capacidades, por eso el G-4 debe mover bien sus piezas».
    // Una columna de camiones CARGADOS rinde en carretera como cualquier
    // motorizado, pero fuera de camino no: va al PASO, en columna, sin poder
    // dispersarse, y consume mucho más. Ésa es la razón doctrinaria de que el
    // abastecimiento se planifique sobre un EJE (el EPA) y no en línea recta —
    // y ahora el motor la hace valer: por el eje llega, campo traviesa no.
    // ============================================================
    const pasoReal = haversineKm(pos, sig);
    const tPaso = pasoReal / v;
    // v2.9.334: además del reloj, el TANQUE limita el tramo.
    const gasta = gastoPorKm(u, clase);
    const kmPorTanque = (autonomia === Infinity || gasta <= 0)
      ? Infinity : Math.max(0, (autonomia - consumoKm) / gasta);
    const kmPorTiempo = presupuesto * v;
    if (tPaso > presupuesto + 1e-9 || kmPorTanque < pasoReal - 1e-9) {
      const seFrenaPorTanque = kmPorTanque < kmPorTiempo;
      const kmPosibles = Math.max(0, Math.min(pasoReal, kmPorTiempo, kmPorTanque));
      const f2 = pasoReal > 0 ? kmPosibles / pasoReal : 0;
      pos = [pos[0] + (sig[0] - pos[0]) * f2, pos[1] + (sig[1] - pos[1]) * f2];
      avanzado += kmPosibles;
      anotar(clase, kmPosibles, pos);
      if (aPasoDeHombre) kmSalida += kmPosibles;
      const tParcial = Math.min(presupuesto, kmPosibles / v);
      tUsado += tParcial; presupuesto -= tParcial;
      registrar();
      if (clase !== "camino") kmFueraRuta += kmPosibles;
      if (seFrenaPorTanque) { detenida = true; motivo = "sin combustible"; }
      else { presupuesto = 0; motivo = "fin del turno"; }
      break;
    }
    presupuesto -= tPaso; tUsado += tPaso; pos = sig; avanzado += pasoReal;
    anotar(clase, pasoReal, pos);
    if (aPasoDeHombre) kmSalida += pasoReal;
    registrar();
    if (tope) { pisarCampo(tope); break; }   // v2.9.440: llegó al borde y la vanguardia entró
    if (clase !== "camino") {
      kmFueraRuta += pasoReal;
      if (kmFueraRuta >= topeFuera - 1e-9) {
        detenida = true;
        motivo = `fuera de ruta: la columna se alejó ${kmFueraRuta.toFixed(1)} km del camino`;
        break;
      }
    }
    if (atrapada && !motivo) motivo = "salió a paso de hombre del terreno que no cruza";
    if (presupuesto <= 1e-9) { motivo = "fin del turno"; break; }
  }
  return { lng: pos[0], lat: pos[1], detenida, motivo, avanzadoKm: avanzado, totalKm: totalDest,
    ruta, tiempos, cons, batido,
    horasUsadas: Math.max(0, Math.min(horas, tUsado)), llego: !detenida && haversineKm(pos, destino) <= 1e-3,
    porClase, consumoKm, kmBatido, minado, detonaciones, kmFueraRuta,
    fueraDeRuta: motivo.startsWith("fuera de ruta"),
    seco: motivo === "sin combustible",
    // v2.9.431: para que la bitácora cuente la salida a paso de hombre.
    kmSalida, claseSalida: atrapada ? claseSalida : null, sigueAdentro: atrapada && saliendo };
}

// v2.9.220 — MARCHA POR UNA RUTA DE VARIOS PUNTOS, EN UN SOLO TURNO. Antes la
// orden llevaba UN destino: con puntos de paso la unidad gastaba un turno entero
// por tramo y se frenaba en cada hito aunque le sobrara medio día de marcha.
// v2.9.443: con la hora, lo gastado y lo batido en cada punto, y la hora en que
// llegó a cada punto de paso (`llegadas`): si un choque la detiene a mitad de
// camino, los puntos de paso que todavía no alcanzó siguen pendientes.
function moverPorRuta(u: any, ruta: any[], terreno: any[], horas: number, turno: any = null) {
  const pts = (ruta || []).filter((p: any) => Array.isArray(p) && p.length >= 2);
  if (!pts.length) return moverUnidad(u, [u.lng, u.lat], terreno, horas);
  let pos: any = { ...u };
  let restante = horas, avanzado = 0, consumidos = 0;
  const rutaTot: number[][] = [[u.lng, u.lat]];
  const tiemposTot: number[] = [0], consTot: number[] = [0], batTot: number[] = [0];
  const llegadas: number[] = [];
  let detenida = false, motivo = "", llego = false, seco = false;
  const porClase: any = { camino: 0, libre: 0, restringido: 0, severo: 0, rio: 0, agua: 0 };
  let consumoKm = 0, kmBatido = 0, minado: any = null, detonaciones: number[][] = [];
  let kmSalida = 0, claseSalida: any = null, sigueAdentro = false;   // v2.9.431
  let kmFueraRuta = 0, fueraDeRuta = false;
  let tAcum = 0;
  const gastadoAntes = Number(u.combustible_km) || 0;   // v2.9.334
  const totalKm = pts.reduce((s: number, p: any, i: number) => s + haversineKm(i ? pts[i - 1] : [u.lng, u.lat], p), 0);
  for (let i = 0; i < pts.length; i++) {
    if (restante <= 1e-9) { motivo = "fin del turno"; break; }
    const r: any = moverUnidad(pos, pts[i], terreno, restante, 0.5, turno);
    pos = { ...pos, lng: r.lng, lat: r.lat };
    if (r.ruta && r.ruta.length > 1) {
      for (let k = 1; k < r.ruta.length; k++) {
        rutaTot.push(r.ruta[k]);
        tiemposTot.push(tAcum + (r.tiempos ? r.tiempos[k] : 0));
        consTot.push(consumoKm + (r.cons ? r.cons[k] : 0));
        batTot.push(kmBatido + (r.batido ? r.batido[k] : 0));
      }
    }
    avanzado += r.avanzadoKm;
    for (const k of Object.keys(r.porClase || {})) porClase[k] = (porClase[k] || 0) + r.porClase[k];
    consumoKm += r.consumoKm || 0;
    kmBatido += r.kmBatido || 0;
    kmFueraRuta = r.kmFueraRuta || kmFueraRuta;
    if (r.fueraDeRuta) fueraDeRuta = true;
    if (r.minado) { minado = r.minado; detonaciones = r.detonaciones || []; }
    if (r.seco) seco = true;
    if (r.kmSalida > 0 || r.claseSalida) {
      kmSalida += r.kmSalida || 0;
      claseSalida = claseSalida || r.claseSalida;
    }
    sigueAdentro = !!r.sigueAdentro;
    // v2.9.334: el tramo siguiente tiene que saber lo que ya se gastó en éste.
    pos.combustible_km = gastadoAntes + consumoKm;
    pos._kmFueraRuta = kmFueraRuta;
    tAcum += r.horasUsadas;
    restante = Math.max(0, restante - r.horasUsadas);
    motivo = r.motivo;
    if (r.detenida) { detenida = true; break; }
    if (!r.llego) { motivo = "fin del turno"; break; }
    llegadas.push(tAcum);
    consumidos = i + 1;
    llego = (i === pts.length - 1);
  }
  return { lng: pos.lng, lat: pos.lat, detenida, motivo, avanzadoKm: avanzado, totalKm,
    ruta: rutaTot, tiempos: tiemposTot, cons: consTot, batido: batTot, llegadas,
    horasUsadas: Math.max(0, horas - restante), llego, consumidos,
    porClase, consumoKm, kmBatido, minado, detonaciones, seco, kmSalida, claseSalida, sigueAdentro,
    kmFueraRuta, fueraDeRuta };
}

// v2.9.225 — CÓMO FUE LA MARCHA Y QUÉ COSTÓ: velocidad media, por qué clase de
// camino, y cuánto combustible se lleva gastado desde el principio.
function textoMarcha(u: any, r: any, usadoAntes: number) {
  const partes: string[] = [];
  if (r.seco) partes.push("⛔ SE QUEDÓ SIN COMBUSTIBLE en la marcha");   // v2.9.334
  // v2.9.358 — que la bitácora ENSEÑE por qué se detuvo. Si sólo dijera «se
  // detuvo», el alumno cambiaría la orden; diciéndole que el problema es el
  // TRAZADO, cambia el eje, que es la decisión que estaba mal.
  if (r.fueraDeRuta) {
    partes.push(`⛔ SE DETUVO FUERA DE RUTA — la columna se alejó ${(r.kmFueraRuta || 0).toFixed(1)} km `
      + `del camino y una columna de camiones no cruza campo traviesa. `
      + `El eje tiene que ir SOBRE caminos (sirven los de tercera y cuarta): `
      + `retrazalo, o mandá zapadores a abrir paso.`);
  }
  // v2.9.431 — QUE SE ENTIENDA POR QUÉ UN MOTORIZADO ANDUVO POR TERRENO QUE NO
  // CRUZA: arrancó adentro (lo colocaron ahí, o lo empujó el combate) y lo
  // único que puede hacer es salir, a paso de hombre.
  if (r.kmSalida > 0.05 && r.claseSalida) {
    const vSal = (VEL.pie[r.claseSalida] || 2) * 0.5;
    partes.push(`🚶 arrancó DENTRO de ${NOM_CLASE[r.claseSalida] || r.claseSalida}, que «${medioDe(u)}» NO cruza: `
      + `hizo ${r.kmSalida.toFixed(1)} km a paso de hombre (${vSal.toFixed(1)} km/h — vehículos remolcados, `
      + `tropa a pie) ${r.sigueAdentro ? "y TODAVÍA ESTÁ ADENTRO: el turno que viene sigue saliendo"
        : "hasta salir a terreno transitable"}`);
  }
  if (r.horasUsadas > 0 && r.avanzadoKm > 0) {
    const vm = r.avanzadoKm / r.horasUsadas;
    partes.push(`🚗 media ${vm < 10 ? vm.toFixed(1) : vm.toFixed(0)} km/h`);
  }
  const tot = Object.values(r.porClase || {}).reduce((s: any, v: any) => s + v, 0) as number;
  if (tot > 0.05) {
    const NOM: any = { camino: "camino", libre: "campo abierto", restringido: "terreno restringido", severo: "terreno severo",
      rio: "vadeando ríos", agua: "agua" };
    const reparto = Object.entries(r.porClase)
      .filter(([, km]: any) => km > 0.05)
      .sort((a: any, b: any) => b[1] - a[1])
      .map(([k, km]: any) => `${Math.round((100 * km) / tot)} % ${NOM[k] || k}`);
    if (reparto.length) partes.push(`🛣️ ${reparto.join(" · ")}`);
  }
  const tanque = tanqueDe(u);   // v2.9.439
  if (tanque > 0 && r.consumoKm > 0.05) {
    const acum = (Number(usadoAntes) || 0) + r.consumoKm;
    const pct = Math.round((100 * acum) / tanque);
    const resta = Math.max(0, tanque - acum);
    let aviso = "";
    if (pct >= 100) aviso = " — ⛔ TANQUE VACÍO: no se mueve hasta reabastecer";
    else if (pct >= 80) aviso = " — ⚠️ menos de un quinto de tanque";
    else if (pct >= 60) aviso = " — hay que prever el reabastecimiento";
    partes.push(`⛽ gastó ${r.consumoKm.toFixed(1)} km de autonomía · lleva `
      + `${acum.toFixed(0)} de ${tanque} km (${pct} %), le quedan ${resta.toFixed(0)} km${aviso}`);
  }
  return partes.join(" · ");
}

// ---------- Lectura militar del movimiento (bitácora) — v2.9.203 ----------
function ralearRuta(ruta: number[][], max = 40) {
  if (!ruta || ruta.length <= max) return ruta || [];
  const paso = (ruta.length - 1) / (max - 1);
  const out: number[][] = [];
  for (let i = 0; i < max; i++) out.push(ruta[Math.round(i * paso)]);
  return out;
}
function horasATexto(h: number) {
  const tot = Math.max(0, Math.round((h || 0) * 60));
  const hh = Math.floor(tot / 60), mm = tot % 60;
  return hh ? `${hh} h ${mm} min` : `${mm} min`;
}
function enArea(pt: number[], terreno: any[], tipo: string) {
  const c = TIPOS_POLIGONO_IDX.includes(tipo) ? indiceDe(terreno).celdaDe(pt) : null;
  const lista = c ? c.polis : (TIPOS_POLIGONO_IDX.includes(tipo) ? [] : (terreno || []));
  return lista.some((t: any) => t.tipo === tipo && !fueraDeCaja(pt, t) && puntoEnGeom(pt, t.geojson));
}
// El corazón didáctico: una orden mal dada tiene que DELATARSE en la bitácora.
function avisosPosicion(u: any, unidades: any[], terreno: any[], rango = 3) {
  const avisos: string[] = [];
  const pt = [u.lng, u.lat];
  if (enArea(pt, terreno, "ae")) avisos.push("🎯 quedó DENTRO de un área de empeño");
  const clase = claseTerreno(pt, terreno);
  if (clase === "severo") avisos.push("⛰️ terminó en terreno severamente restringido");
  else if (clase === "restringido") avisos.push("⛰️ terminó en terreno restringido");
  if (enTerrenoClave(pt, terreno)) avisos.push("⭐ ocupa terreno clave");
  const enemigos = (unidades || []).filter((e: any) => e.bando !== u.bando && poderEfectivo(e) > 0);
  let mejorVista: any = null;
  for (const e of enemigos) {
    const d = haversineKm(pt, [e.lng, e.lat]);
    if (d <= alcanceObs(e, terreno) && (!mejorVista || d < mejorVista.d)) mejorVista = { e, d };
  }
  if (mejorVista) avisos.push(`👁️ quedó A LA VISTA de ${nombreUnidad(mejorVista.e)} (a ${mejorVista.d.toFixed(1)} km)`);
  let contacto: any = null;
  for (const e of enemigos) {
    const d = haversineKm(pt, [e.lng, e.lat]);
    if (d <= rango && (!contacto || d < contacto.d)) contacto = { e, d };
  }
  if (contacto) {
    const pMio = poderEfectivo(u) * bonoDefensa(pt, terreno);
    const pEne = poderEfectivo(contacto.e);
    const rel = pMio > 0 ? pEne / pMio : 99;
    const como = rel >= 3 ? "MUY superior" : rel >= 1.5 ? "superior" : rel >= 1 ? "pareja" : "inferior";
    avisos.push(`⚔️ quedó en contacto (${contacto.d.toFixed(1)} km) con una fuerza ${como} (${rel.toFixed(1)}:1 en su contra)`);
  }
  return avisos;
}
// v2.9.211 — nombre legible (las unidades importadas vienen sin designación).
const ARMA_NOM: any = { infanteria:"Inf", caballeria:"Cab", artilleria:"Art", blindada:"Bld",
  mecanizada:"Mec", motorizada:"Mot", cabmec:"Cab Mec", antiaerea:"AA", logistica:"Log", ninguna:"PC",
  ingenieria:"Ing", comunicaciones:"Com", aerotransportada:"Aert", aviacion:"Avn",
  sanidad:"San", intendencia:"Int", transporte:"Tte", mantenimiento:"Mant",
  antitanque:"AT", morteros:"Mort", ametralladoras:"Amtr", lanzacohetes:"LC",
  policiamilitar:"PM", veterinaria:"Vet", convoy:"Convoy" };
const ESCALON_NOM: any = { equipo:"Eq", escuadra:"Esc", seccion:"Secc", compania:"Cía",
  batallon:"Bón", regimiento:"Rgto", brigada:"Brig", division:"Div", cuerpo:"CE", ejercito:"Ej" };
function nombreUnidad(u: any) {
  if (!u) return "Unidad";
  const bando = u.bando === "rojo" ? "🔴" : u.bando === "azul" ? "🔵" : "";
  const propio = (u.designacion || "").trim();
  if (propio) return `${bando} ${propio}`.trim();
  const armado = `${ESCALON_NOM[u.escalon] || ""} ${ARMA_NOM[u.arma] || ""}`.trim();
  return `${bando} ${armado || "Unidad"}${u.id != null ? " #" + u.id : ""}`.trim();
}
function textoMovimiento(u: any, r: any) {
  const quien = nombreUnidad(u);
  const t = horasATexto(r.horasUsadas);
  if (r.detenida) return `🛑 ${quien}: DETENIDA a los ${r.avanzadoKm.toFixed(1)} km de ${r.totalKm.toFixed(1)} — ${r.motivo} (${t}). `
    + (/^entró EN CONTACTO/.test(r.motivo || "")
      ? `Está TRABADA con el enemigo: mientras siga en contacto no avanza. Para salir, ROMPER CONTACTO (↩️); para seguir, hay que vencerlo.`
      : /FUERA DE COMBATE/.test(r.motivo || "")
      ? `La unidad quedó donde la alcanzó el fuego.`
      : /^se topó con un OBSTÁCULO/.test(r.motivo || "")
      ? `HASTA ACÁ PUEDE LLEGAR por ese camino: hay que ABRIR BRECHA con ingeniería (🛠️) o rodearlo con puntos de paso.`
      : `HASTA ACÁ PUEDE LLEGAR por ese camino: hay que rodear el obstáculo con puntos de paso o cambiarle el destino.`);
  if (r.llego) return `✅ ${quien}: LLEGÓ al final de su ruta — ${r.avanzadoKm.toFixed(1)} km en ${t}.`;
  const pct = r.totalKm > 0 ? Math.round((100 * r.avanzadoKm) / r.totalKm) : 0;
  // v2.9.222: decir QUÉ HACER, no sólo qué pasó.
  return `🚚 ${quien}: avanzó ${r.avanzadoKm.toFixed(1)} km de ${r.totalKm.toFixed(1)} (${pct} %) en ${t} — `
    + `se le acabó el turno, NO el camino: sigue la marcha sola el turno que viene, no hay que darle la orden otra vez.`;
}
// ---------- Armamento (v2.9.217) ----------
// El MISMO catálogo que muestra el panel 🎯 ARMAMENTO del frontend. Tiene que
// estar acá porque hasta ahora el alcance era una ayuda visual de planeamiento
// y nada más: el motor resolvía todo a 3 km fijos, así que un obús 155 y un
// fusil batían exactamente igual. Ahora el alcance MANDA en el fuego deliberado.
// ⚠️ CIFRAS DE REFERENCIA — falta validarlas contra el reglamento boliviano.
// `radio` = radio de EFECTO del estallido en km · `pot` = fracción de poder que
// le saca a quien esté en el centro (en el borde de la zona, la mitad).
const ARMAS: any = {
  fusil: { id: "fusil", nom: "Fusilería", alcance: 0.6, radio: 0.05, pot: 0.10, uf: 8, contra: "personal" },
  ametralladora: { id: "ametralladora", nom: "Ametralladora", alcance: 1.0, radio: 0.10, pot: 0.14, uf: 7, contra: "personal" },
  pesada: { id: "pesada", nom: "Ametralladora .50", alcance: 2.0, radio: 0.12, pot: 0.18, uf: 6, contra: "personal y vehículo liviano" },
  mortero60: { id: "mortero60", nom: "Mortero 60 mm", alcance: 2.0, radio: 0.15, pot: 0.18, uf: 6, contra: "personal", indirecto: true },
  mortero81: { id: "mortero81", nom: "Mortero 81 mm", alcance: 5.5, radio: 0.20, pot: 0.25, uf: 5, contra: "personal", indirecto: true },
  mortero120: { id: "mortero120", nom: "Mortero 120 mm", alcance: 8.0, radio: 0.30, pot: 0.35, uf: 4, contra: "personal y posiciones", indirecto: true },
  srAT: { id: "srAT", nom: "S/R 106 mm (AT)", alcance: 1.1, radio: 0.05, pot: 0.20, uf: 4, contra: "blindados" },
  misilAT: { id: "misilAT", nom: "Misil antitanque", alcance: 3.5, radio: 0.06, pot: 0.30, uf: 3, contra: "blindados" },
  canon: { id: "canon", nom: "Cañón de tanque", alcance: 2.5, radio: 0.10, pot: 0.25, uf: 5, contra: "blindados y posiciones" },
  obus105: { id: "obus105", nom: "Obús 105 mm", alcance: 11.0, radio: 0.35, pot: 0.40, uf: 5, contra: "áreas", indirecto: true },
  obus155: { id: "obus155", nom: "Obús 155 mm", alcance: 24.0, radio: 0.50, pot: 0.55, uf: 4, contra: "áreas", indirecto: true },
  // v2.9.439 — LOS QUE FALTABAN. Sergio: «el armamento debe pasar a esa GALM».
  // El GALM-1 (Grupo de Artillería de Lanzadores Múltiples) y la batería LAR-160
  // del enemigo entraban con fusiles y morteros de infantería, porque el arma
  // «lanzacohetes» no estaba acá y caía en la dotación por defecto. El alcance es
  // el del ejercicio de la Escuela (Anexo C: LAR-160 «≈ 30 km»; concepto de la
  // operación: GALM-1 «alcance 30 km»). 2 UF = las «2 cargas completas por
  // lanzador» de la tasa del Anexo G: dos salvas y a recargar.
  lanzacohetes: { id: "lanzacohetes", nom: "Lanzacohetes múltiple", alcance: 30.0, radio: 1.0, pot: 0.45, uf: 2, contra: "áreas (fuego de saturación)", indirecto: true },
  // La antiaérea (Gepard 35 mm «≈ 4 km» del Anexo C, RBS-70): contra aeronaves
  // y drones; sus cañones también baten vehículos livianos y personal.
  antiaereo: { id: "antiaereo", nom: "Antiaérea (cañón / misil)", alcance: 4.0, radio: 0.08, pot: 0.15, uf: 4, contra: "aeronaves y drones · vehículos livianos" },
  zapa: { id: "zapa", nom: "Medios de zapa", alcance: 0, radio: 0, pot: 0, uf: 0, contra: "terreno: brechas y obstáculos", ingenieria: true },
};
// v2.9.439: la división (y el CE) trae lo ORGÁNICO de una división —su
// artillería, su antiaérea y su ingeniería—, no sólo lo de la brigada.
const _INF: any = { base: ["fusil", "ametralladora"], compania: ["pesada", "mortero60"],
  batallon: ["pesada", "mortero81", "srAT"], regimiento: ["pesada", "mortero81", "srAT"],
  brigada: ["pesada", "mortero120", "misilAT"], division: ["obus105", "antiaereo", "zapa"] };
const _CAB: any = { base: ["ametralladora", "pesada"], compania: ["canon"], batallon: ["canon", "misilAT"],
  regimiento: ["canon", "misilAT"], brigada: ["canon", "misilAT"], division: ["obus105", "antiaereo", "zapa"] };
const _APOYO: any = { base: ["fusil"] };
const DOTACION: any = {
  infanteria: _INF, motorizada: _INF, andina: _INF, selva: _INF,
  caballeria: _CAB, cabmec: _CAB,
  // v2.9.439 — la infantería MECANIZADA (VCI/VTP) tiene su ametralladora pesada
  // en el vehículo y misiles antitanque desde la compañía.
  mecanizada: { base: ["fusil", "ametralladora", "pesada"], compania: ["misilAT"],
    batallon: ["mortero81", "misilAT"], regimiento: ["mortero81", "misilAT"],
    brigada: ["mortero120", "misilAT", "canon"], division: ["obus105", "obus155", "antiaereo", "zapa"] },
  blindada: { base: ["canon", "pesada"], batallon: ["canon", "pesada", "misilAT"],
    division: ["obus155", "antiaereo", "zapa"] },
  artilleria: { base: ["fusil"], compania: ["obus105"], batallon: ["obus105"],
    regimiento: ["obus105", "obus155"], brigada: ["obus155"] },
  lanzacohetes: { base: ["fusil", "lanzacohetes"], compania: ["pesada"] },
  antiaerea: { base: ["fusil", "antiaereo"], compania: ["pesada"] },
  morteros: { base: ["fusil", "mortero81"], batallon: ["mortero120"] },
  antitanque: { base: ["fusil", "srAT"], batallon: ["misilAT"] },
  ametralladoras: { base: ["ametralladora", "pesada"] },
  ingenieria: { base: ["fusil", "zapa"] },
  comunicaciones: _APOYO, logistica: _APOYO, sanidad: _APOYO, intendencia: _APOYO,
  transporte: _APOYO, mantenimiento: _APOYO, materialbelico: _APOYO, veterinaria: _APOYO, aviacion: _APOYO,
  inteligencia: { base: ["fusil", "ametralladora"] }, policiamilitar: { base: ["fusil", "ametralladora"] },
  aerotransportada: { base: ["fusil", "ametralladora"], batallon: ["pesada", "mortero60", "misilAT"] },
  // v2.9.439 — EL PUESTO DE COMANDO no es una fuerza de maniobra: se defiende
  // con su seguridad. Antes el «CE-1» (arma «ninguna») entraba con la dotación
  // de una división de infantería y poder 150.
  ninguna: { base: ["fusil", "pesada"] },
  // v2.9.335 — el convoy va armado apenas: «asegurar CON LIMITACIONES su propia
  // defensa». No es una unidad de combate: es un blanco que hay que escoltar.
  convoy: { base: ["fusil"] },
};
// ============================================================
// v2.9.439 — LOS MEDIOS DE VERDAD DE CADA UNIDAD (COE y planeamiento).
// Sergio: «trasladado las unidades con lo que realmente tienen de acuerdo a su
// COE… se debe poder realmente acabar el combustible, acabar la munición de
// acuerdo a lo que se planificó».
// El catálogo de arriba es la REFERENCIA por arma y escalón. Al importar del
// Generador, cada unidad trae `medios` (columna jsonb de wg_unidades): los
// sistemas que TIENE —del COE de la biblioteca o del planeamiento del G-4—, su
// dotación en UF (la tasa del Anexo G) y la autonomía planificada (con el
// consumo de la altura). Si los trae, mandan; si no, el catálogo.
// ============================================================
function mediosDe(u: any) {
  const m = u && u.medios;
  return m && typeof m === "object" && !Array.isArray(m) ? m : null;
}
function sistemasPropios(u: any): string[] | null {
  const m = mediosDe(u);
  const s = m && m.sistemas;
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  const ids = Object.keys(s).filter((id) => ARMAS[id]);
  return ids.length ? ids : null;
}
// La dotación de un sistema: la planificada para ESA unidad o la del catálogo.
function ufTope(u: any, armaId: string) {
  const m = mediosDe(u);
  const s = m && m.sistemas && m.sistemas[armaId];
  const v = Number(s && s.uf);
  if (Number.isFinite(v) && v > 0) return v;
  return Number(ARMAS[armaId] && ARMAS[armaId].uf) || 0;
}
// La autonomía: la planificada (el Anexo G puede subir el consumo por la altura)
// o la del reglamento por medio. El de a pie no lleva tanque.
function tanqueDe(u: any) {
  const base = AUTONOMIA_KM[medioDe(u)] || 0;
  if (!base) return 0;
  const m = mediosDe(u);
  const a = Number(m && m.autonomiaKm);
  return Number.isFinite(a) && a > 0 ? a : base;
}
function armamentoDe(u: any) {
  if (!u) return [];
  const propios = sistemasPropios(u);
  if (propios) return propios.map((id) => ARMAS[id]).sort((a: any, b: any) => a.alcance - b.alcance);
  const d = DOTACION[u.arma] || DOTACION.infanteria;
  const ids: string[] = [...(d.base || [])];
  const orden = ["seccion", "compania", "batallon", "regimiento", "brigada", "division", "cuerpo"];
  const hasta = orden.indexOf(u.escalon);
  for (let i = 0; i <= hasta && i < orden.length; i++) {
    for (const x of (d[orden[i]] || [])) if (!ids.includes(x)) ids.push(x);
  }
  if (["division", "cuerpo", "ejercito"].includes(u.escalon)) {
    for (const x of (d.brigada || d.regimiento || [])) if (!ids.includes(x)) ids.push(x);
  }
  return ids.map((id) => ARMAS[id]).filter(Boolean).sort((a: any, b: any) => a.alcance - b.alcance);
}
// Con qué sistema empeña realmente. Si el EM no eligió (o eligió uno que su
// dotación no tiene), se toma el de MAYOR alcance. La zapa no bate blancos.
// ---------- Obras de ingeniería (v2.9.234) ----------
// La zapa no es un arma: es TIEMPO aplicado al terreno. Cambia por dónde se
// puede pasar y dónde se puede aguantar. ⚠️ CIFRAS DE REFERENCIA.
// ============================================================
// v2.9.324 — EL TIEMPO DE LA OBRA SE MIDE EN HORAS DE TRABAJO, NO EN TURNOS.
//
// Pedido de Sergio: obstáculos y campos minados «enfocado a la realidad,
// considerando el tiempo de construcción de obstáculos o posiciones defensivas».
//
// Hasta acá cada obra tenía un número FIJO de turnos, y eso tenía dos defectos
// de fondo: (1) no se parecía a nada real, y (2) no dependía de cuánto DURA un
// turno — con turnos de 6 h una posición defensiva salía en el mismo «3» que
// con turnos de 1 h. Ahora la obra cuesta HORAS DE TRABAJO y el juego calcula
// cuántos turnos son, que es como se planifica de verdad: el ingeniero informa
// horas y el Estado Mayor las convierte en turnos según el ritmo de la operación.
//
// ⚠️ CIFRAS DE REFERENCIA, para una unidad tipo BATALLÓN trabajando sobre su
// propio frente. Órdenes de magnitud de manual de campaña, no del reglamento
// boliviano — hay que validarlas contra las tablas de la ECEME antes del
// ejercicio real, y por eso están todas juntas y a la vista acá.
// ============================================================
const OBRAS: any = {
  // v2.9.443 — LA BRECHA ES UN CORREDOR. Sergio: «la ingeniería puede trabajar en
  // terrenos restringidos como ríos o campos minados de acuerdo a sus
  // posibilidades, pero eso toma tiempo». Antes abría un círculo de 600 m; ahora
  // abre un CORREDOR de 200 m de ancho desde donde está la cuadrilla hacia el
  // punto que se marque (hasta 2 km), y cuesta HORAS POR KILÓMETRO según el suelo
  // (`horas` = h/km para un batallón de ingeniería). Por el corredor se pasa a
  // través del terreno restringido, del severo, del campo minado y del obstáculo
  // enemigo — no del agua: para eso está el puente.
  brecha: { id: "brecha", nom: "Abrir brecha (corredor)", icono: "🛠️", tipo: "via",
    desc: "Abre un corredor de paso de hasta 2 km por terreno restringido, severo o minado. Queda transitable — y lo usan LOS DOS bandos.",
    horas: { camino: 1, libre: 1.5, restringido: 3, severo: 6, rio: 6, agua: 12 }, ancho: 0.1, porKm: true,
    soloIng: true, detalle: "Explosivos y maquinaria: limpia el campo minado, rellena, despeja y marca el paso. Se trabaja desde donde está la cuadrilla hacia el punto marcado." },
  // v2.9.443 — EL PUENTE. Un río sin puente frena a los vehículos; la ingeniería
  // lo cruza tendiendo un puente táctico (o preparando un vado) sobre el punto.
  puente: { id: "puente", nom: "Tender puente / vado", icono: "🌉", tipo: "via",
    desc: "Cruza el río: desde que está, los vehículos pasan por ahí — los DOS bandos.",
    horas: { rio: 3, camino: 1, libre: 3, restringido: 3, severo: 3, agua: 3 }, ancho: 0.12,
    soloIng: true, detalle: "Puente táctico de dotación o vado preparado sobre la traza del río. Una laguna no se puentea: se rodea." },
  defensiva: { id: "defensiva", nom: "Posición defensiva", icono: "🛡️", tipo: "defensivo",
    desc: "Cava y fortifica: quien la ocupe pelea protegido.",
    horas: { camino: 6, libre: 6, restringido: 5, severo: 5 }, ancho: 1.2,
    detalle: "Pozos de tirador, asentamientos de arma y cubiertas. En roca o pantano se tarda más… pero el terreno ya protege." },
  obstaculo: { id: "obstaculo", nom: "Obstáculo", icono: "⛓️", tipo: "restringido",
    desc: "Crea un impedimento donde no lo había: frena al que quiera pasar por ahí.",
    horas: { camino: 4, libre: 4, restringido: 3, severo: 3 }, ancho: 1.5,
    detalle: "Abatís, cráteres, barricadas: lo que haya a mano para negar una avenida." },
  // v2.9.324 — LAS TRES NUEVAS.
  alambrada: { id: "alambrada", nom: "Alambrada de concertina", icono: "〰️", tipo: "restringido",
    desc: "Retarda y canaliza: no impide el paso, obliga a hacerlo por donde vos querés.",
    horas: { camino: 3, libre: 3, restringido: 4, severo: 5 }, ancho: 0.8,
    detalle: "Doble concertina sobre unos 300 m de frente. Es el obstáculo más barato y el que más rinde si está batido por fuego." },
  minado: { id: "minado", nom: "Campo minado", icono: "💣", tipo: "minado",
    desc: "DETIENE al que entra y le cuesta bajas. Sólo se cruza abriendo brecha.",
    horas: { camino: 4, libre: 4, restringido: 5, severo: 6 }, ancho: 1.0,
    detalle: "Siembra a mano de minas AP y AT. Tu propio bando conoce las brechas y pasa; el enemigo se para en seco." },
  foso: { id: "foso", nom: "Foso antitanque", icono: "🕳️", tipo: "severo",
    desc: "Corta el paso de todo lo que tenga ruedas u orugas. La infantería a pie lo salva.",
    horas: { camino: 10, libre: 10, restringido: 13, severo: 16 }, ancho: 1.2,
    soloIng: true, detalle: "Excavación con maquinaria pesada: es la obra más cara en tiempo y la que más se nota." },
};
const RINDE_ZAPA: any = { seccion: 0.55, compania: 0.8, batallon: 1, regimiento: 1.2,
  brigada: 1.5, division: 1.8, cuerpo: 2.2, ejercito: 2.5 };
// ============================================================
// v2.9.324 — LA INFANTERÍA TAMBIÉN FORTIFICA (pedido de Sergio).
//
// Antes esto era `puedeZapar`, un sí/no que dejaba afuera a todo el que no
// fuera ingeniería. Y es falso: la infantería cava sus pozos, tiende alambrada
// y siembra minas — con pico, pala y a mano. Lo que NO puede es abrir brechas
// con explosivos ni excavar un foso antitanque: eso necesita máquinas.
//
// Rinde 0,55 = tarda casi el doble que ingeniería en la misma obra. Ésa es la
// diferencia, y es la que hace que valga la pena tener zapadores.
// ============================================================
const RINDE_ARMA: any = { ingenieria: 1, infanteria: 0.55, aerotransportada: 0.5 };
// Lo que cuesta ENTRAR en un campo minado, por medio: ahora mina por mina, en
// `MINA_GOLPE` (v2.9.440). El de a pie pierde hombres; el vehículo pierde el
// vehículo, y por eso paga el doble. El camión de llantas (v2.9.353) es lo que
// peor lleva una mina — sin blindaje de casco y con la carga arriba, un solo
// estallido saca del ruedo al vehículo y a lo que llevaba. Por eso el eje de
// abastecimiento se barre antes de usarlo.
function capacidadObra(u: any) {
  if (!u) return null;
  if (armamentoDe(u).some((a: any) => a.ingenieria)) return { rinde: 1, ing: true };
  const r = RINDE_ARMA[u.arma];
  return r ? { rinde: r, ing: false } : null;
}
function puedeHacerObra(u: any, obraId: string) {
  const cap = capacidadObra(u);
  if (!cap) return null;
  if (OBRAS[obraId] && OBRAS[obraId].soloIng && !cap.ing) return null;
  return cap;
}
// Horas de trabajo que pide la obra en ESE terreno, ya corregidas por el
// escalón que la hace y por si es ingeniería o tropa con pala.
// v2.9.443 — EL CORREDOR DE LA BRECHA: desde `desde` hacia `hacia`, hasta 2 km.
const BRECHA_MAX_KM = 2;
function tramoDeBrecha(desde: number[], hacia: number[]) {
  const d = haversineKm(desde, hacia);
  if (d < 1e-6) return [desde, desde];
  const f = Math.min(1, BRECHA_MAX_KM / d);
  return [desde, [desde[0] + (hacia[0] - desde[0]) * f, desde[1] + (hacia[1] - desde[1]) * f]];
}
// Las horas de trabajo del corredor: la suma, cada 100 m, de lo que cuesta ese suelo.
function horasDeCorredor(u: any, desde: number[], hasta: number[], terreno: any[]) {
  const L = haversineKm(desde, hasta);
  const n = Math.max(1, Math.ceil(L / 0.1));
  let h = 0;
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    const cl = claseTerreno([desde[0] + (hasta[0] - desde[0]) * f, desde[1] + (hasta[1] - desde[1]) * f], terreno);
    const hk = OBRAS.brecha.horas[cl];
    h += (hk != null ? hk : 1.5) * (L / n);
  }
  const cap = capacidadObra(u);
  const rinde = (RINDE_ZAPA[u && u.escalon] || 1) * ((cap && cap.rinde) || 1);
  return Math.max(0.5, h) / Math.max(0.1, rinde);
}
function horasDeObra(u: any, obraId: string, pt: number[], terreno: any[], desde?: number[]) {
  const obra: any = OBRAS[obraId];
  if (!obra) return 0;
  if (obra.porKm) {
    const d0 = desde || (u ? [u.lng, u.lat] : pt);
    const [a, b] = tramoDeBrecha(d0, pt);
    return horasDeCorredor(u, a, b, terreno);
  }
  const clase = claseTerreno(pt, terreno);
  const base = obra.horas[clase] != null ? obra.horas[clase] : 4;
  const cap = capacidadObra(u);
  const rinde = (RINDE_ZAPA[u && u.escalon] || 1) * ((cap && cap.rinde) || 1);
  return base / Math.max(0.1, rinde);
}
function turnosDeObra(u: any, obraId: string, pt: number[], terreno: any[], horasTurno = 2, desde?: number[]) {
  const h = horasDeObra(u, obraId, pt, terreno, desde);
  if (!h) return 0;
  // Se redondea PARA ARRIBA: una obra a medio hacer no sirve de nada, así que
  // el turno en que se termina se paga entero.
  return Math.max(1, Math.ceil(h / Math.max(0.25, Number(horasTurno) || 2)));
}

// ============================================================
// v2.9.325 — TAREAS TÁCTICAS. La orden dice QUÉ HACER y PARA QUÉ.
//
// Pedido de Sergio. Hasta acá el cursante daba órdenes de «mover», «atacar»,
// «replegar» o «zapar»: verbos de MECÁNICA. En la realidad no se ordena mover,
// se ordena una TAREA con un PROPÓSITO — fijar, desbordar, retardar, asegurar —
// y ahí está la diferencia que hay que enseñar: FIJAR y ATACAR mueven la misma
// ficha por el mismo camino, pero el criterio de éxito es OPUESTO. Al que ataca
// se le pide destruir; al que fija se le pide que el otro no se vaya, y si se
// desgastó consiguiéndolo, fracasó.
//
// El motor resuelve IGUAL que antes: la tarea no cambia la física del combate.
// Lo que cambia es que la bitácora deja de contar sólo lo que pasó y empieza a
// juzgarlo CONTRA LO QUE SE ORDENÓ. Eso es corrección doctrinal automática, y
// es lo que convierte al juego en instrumento de evaluación.
//
// `base` es la orden que el motor ya sabe ejecutar. Cada tarea se apoya en una.
// ============================================================
const TAREAS: any = {
  // ---------- OFENSIVAS ----------
  destruir: { id: 'destruir', nom: 'DESTRUIR', grupo: 'Ofensiva', base: 'atacar', pideBlanco: true,
    proposito: 'Dejar al enemigo incapaz de combatir como unidad organizada.',
    doctrina: 'Es la tarea más cara en poder y munición. Si sólo necesitás que deje de estorbar, NEUTRALIZAR alcanza.' },
  neutralizar: { id: 'neutralizar', nom: 'NEUTRALIZAR', grupo: 'Ofensiva', base: 'atacar', pideBlanco: true,
    proposito: 'Callar la posición el tiempo necesario para maniobrar.',
    doctrina: 'No pide destruirlo. Empeñarse a fondo para «asegurar» la neutralización es gastar poder que después va a faltar.' },
  fijar: { id: 'fijar', nom: 'FIJAR', grupo: 'Ofensiva', base: 'atacar', pideBlanco: true,
    proposito: 'Impedir que el enemigo se retire o refuerce otro punto.',
    doctrina: 'Fijar NO es destruir: se logra con la amenaza y el fuego justo. Si te desgastaste vos, el fijado sos vos.' },
  desbordar: { id: 'desbordar', nom: 'DESBORDAR', grupo: 'Ofensiva', base: 'mover', pideDestino: true,
    proposito: 'Evitar el frente y aparecer en el flanco o la retaguardia.',
    doctrina: 'Si la ruta pasa por el área de empeño enemiga no estás desbordando: estás atacando de frente por un camino más largo.' },
  asaltar: { id: 'asaltar', nom: 'ASALTAR', grupo: 'Ofensiva', base: 'atacar', pideBlanco: true,
    proposito: 'Tomar la posición enemiga y quedarse en ella.',
    doctrina: 'El asalto termina OCUPANDO. Batir y no ocupar deja el terreno libre para que el enemigo vuelva.' },
  perseguir: { id: 'perseguir', nom: 'PERSEGUIR', grupo: 'Ofensiva', base: 'mover', pideDestino: true,
    proposito: 'No dejar que el enemigo rompa contacto ni se reorganice.',
    doctrina: 'Se persigue con lo que tenga movilidad. Perseguir despacio es sólo caminar detrás.' },
  // ---------- RECONOCIMIENTO ----------
  reconocer: { id: 'reconocer', nom: 'RECONOCER', grupo: 'Reconocimiento', base: 'mover', pideDestino: true,
    proposito: 'Obtener información del enemigo o del terreno, sin empeñarse.',
    doctrina: 'Quien reconoce INFORMA, no pelea. Si volvió golpeado hiciste reconocimiento por el fuego, que es otra tarea y cuesta.' },
  vigilar: { id: 'vigilar', nom: 'VIGILAR', grupo: 'Reconocimiento', base: 'defender',
    proposito: 'Observar un sector y alertar temprano, sin empeñarse.',
    doctrina: 'La vigilancia que no informa nada no es vigilancia: es una unidad parada.' },
  // ---------- DEFENSIVAS ----------
  defender: { id: 'defender', nom: 'DEFENDER', grupo: 'Defensiva', base: 'defender',
    proposito: 'Mantener el terreno y derrotar al que ataque.',
    doctrina: 'Defender admite ceder algo de terreno para conservar la fuerza. RETENER no.' },
  retener: { id: 'retener', nom: 'RETENER', grupo: 'Defensiva', base: 'defender',
    proposito: 'No ceder ESTE terreno, pase lo que pase.',
    doctrina: 'Retener no admite cambiar terreno por tiempo. Si te moviste, no retuviste — aunque hayas conservado la unidad.' },
  bloquear: { id: 'bloquear', nom: 'BLOQUEAR', grupo: 'Defensiva', base: 'zapa',
    proposito: 'Negar al enemigo una avenida de aproximación.',
    doctrina: 'Un obstáculo que nadie bate por fuego es un obstáculo regalado: se levanta con tiempo y nada más.' },
  asegurar: { id: 'asegurar', nom: 'ASEGURAR', grupo: 'Defensiva', base: 'mover', pideDestino: true,
    proposito: 'Impedir que el enemigo use u observe ese punto.',
    doctrina: 'Asegurar es quedarse. Pasar por el punto y seguir de largo no asegura nada.' },
  cubrir: { id: 'cubrir', nom: 'CUBRIR', grupo: 'Seguridad', base: 'defender',
    proposito: 'Proteger a la fuerza principal manteniéndose entre ella y el enemigo.',
    doctrina: 'El que cubre pelea si hace falta: por eso se le da poder, a diferencia del que sólo vigila.' },
  // ---------- RETRÓGRADAS ----------
  retardar: { id: 'retardar', nom: 'RETARDAR', grupo: 'Retrógrada', base: 'replegar', pideDestino: true,
    proposito: 'Ganar tiempo cediendo espacio, sin empeñarse decisivamente.',
    doctrina: 'El que retarda cambia terreno por tiempo y CONSERVA la fuerza. Si se empeñó a fondo, dejó de retardar y pasó a defender.' },
  romper: { id: 'romper', nom: 'ROMPER CONTACTO', grupo: 'Retrógrada', base: 'replegar', pideDestino: true,
    proposito: 'Desengancharse del enemigo para recuperar libertad de acción.',
    doctrina: 'Romper contacto cuesta: el que se va paga y no devuelve. Se hace cuando conviene, no cuando ya no queda otra.' },
}
// Cuánto poder perdió, en porcentaje de su máximo.
function _pctPerdido(antes: any, ahora: any) {
  const max = Number((antes && antes.poder_max) || (ahora && ahora.poder_max)) || 0
  if (!max) return 0
  const a = Number(antes && antes.poder_actual) || 0
  const d = Number(ahora && ahora.poder_actual) || 0
  return Math.max(0, ((a - d) / max) * 100)
}
function _distEntre(a: any, b: any) {
  if (!a || !b) return null
  return haversineKm([a.lng, a.lat], [b.lng, b.lat])
}
// ============================================================
// LA EVALUACIÓN. Devuelve `{ estado, texto }` y NUNCA inventa: cuando no hay
// con qué juzgar dice «sin datos» en vez de aprobar por defecto. Un veredicto
// falso enseña peor que ninguno.
//   cumplida · parcial · no · sin_datos
// ============================================================
function evaluarTarea(orden: any, ctx: any): any {
  const T = TAREAS[orden && orden.tarea]
  if (!T) return null
  const antes = ctx.antes.get(orden.unidad_id)
  const u = ctx.despues.get(orden.unidad_id)
  if (!antes || !u) return null
  const moviKm = _distEntre(antes, u) || 0
  const perdi = _pctPerdido(antes, u)
  const blancoId = orden.objetivo_id
  const bAntes = blancoId != null ? ctx.antes.get(blancoId) : null
  const bAhora = blancoId != null ? ctx.despues.get(blancoId) : null
  const perdioBlanco = (bAntes && bAhora) ? _pctPerdido(bAntes, bAhora) : null
  const blancoMovio = (bAntes && bAhora) ? (_distEntre(bAntes, bAhora) || 0) : null
  const fuera = bAhora && bAhora.estado === 'fuera_combate'
  const costo = perdi >= 1 ? ` Te costó ${perdi.toFixed(0)} % de tu poder.` : ''
  const R = (estado: string, texto: string) => ({ estado, texto });

  switch (T.id) {
    case 'destruir':
      if (bAhora == null) return R('sin_datos', 'No se pudo evaluar: no hay blanco registrado en la orden.')
      if (fuera) return R('cumplida', `El blanco quedó FUERA DE COMBATE.${costo}`)
      if (perdioBlanco >= 40) return R('parcial', `Le sacaste ${perdioBlanco.toFixed(0)} %, pero sigue combatiendo. Destruir pide relación de fuerzas: revisá con qué lo empeñaste.${costo}`)
      return R('no', `El blanco conserva su capacidad (perdió ${(perdioBlanco || 0).toFixed(0)} %).${costo}`)

    case 'neutralizar': {
      if (bAhora == null) return R('sin_datos', 'No se pudo evaluar: no hay blanco registrado en la orden.')
      const callado = (Number(bAhora.suprimida_hasta) || 0) >= (ctx.turno || 0) || (perdioBlanco || 0) >= 15
      if (fuera) return R('cumplida', `Quedó neutralizado — de hecho lo destruiste. Ojo: neutralizar no lo pedía, y el poder que gastaste de más ya no lo tenés para el objetivo siguiente.${costo}`)
      if (callado) return R('cumplida', `La posición quedó callada el tiempo necesario para maniobrar.${costo}`)
      return R('no', `El blanco sigue en condiciones de intervenir: no lo callaste.${costo}`)
    }

    case 'fijar': {
      if (bAhora == null) return R('sin_datos', 'No se pudo evaluar: no hay blanco registrado en la orden.')
      if (blancoMovio > 1.0) return R('no', `SE TE FUE: el blanco se desplazó ${blancoMovio.toFixed(1)} km. Fijar es impedirle moverse, y no lo lograste.${costo}`)
      if (perdi >= 25) return R('parcial', `Quedó fijado, pero te costó ${perdi.toFixed(0)} % de tu poder. Fijar se hace con la amenaza y el fuego justo: con ese desgaste el que quedó fijado sos vos.`)
      return R('cumplida', `El blanco no se movió (${(blancoMovio || 0).toFixed(1)} km) y conservaste la fuerza.${costo}`)
    }

    case 'desbordar': {
      const pasoPorAE = ctx.enArea ? ctx.enArea([u.lng, u.lat], 'ae') : false
      if (ctx.pelearon.has(u.id)) return R('parcial', `Llegaste, pero te empeñaste en el camino: eso ya no es desbordar, es atacar de frente por una ruta más larga.${costo}`)
      if (pasoPorAE) return R('parcial', 'Terminaste DENTRO del área de empeño enemiga. El desbordamiento evita el frente, no lo rodea para meterse igual.')
      if (moviKm < 0.5) return R('no', 'No te desplazaste: no hay desbordamiento sin movimiento.')
      return R('cumplida', `Te desplazaste ${moviKm.toFixed(1)} km hasta el flanco sin empeñarte de frente.`)
    }

    case 'asaltar': {
      if (bAntes == null) return R('sin_datos', 'No se pudo evaluar: no hay blanco registrado en la orden.')
      const ocupa = (_distEntre(u, bAntes) || 99) <= 1.5
      if ((fuera || (perdioBlanco || 0) >= 40) && ocupa) return R('cumplida', `Batiste la posición y la estás OCUPANDO.${costo}`)
      if (fuera || (perdioBlanco || 0) >= 40) return R('parcial', `Lo batiste, pero quedaste a ${(_distEntre(u, bAntes) || 0).toFixed(1)} km: no ocupaste la posición y el terreno sigue libre para que vuelva.${costo}`)
      return R('no', `No lograste desalojarlo de la posición.${costo}`)
    }

    case 'perseguir': {
      if (bAntes == null || bAhora == null) return R('sin_datos', 'No se pudo evaluar: no hay blanco registrado en la orden.')
      const d0 = _distEntre(antes, bAntes), d1 = _distEntre(u, bAhora)
      if (d0 == null || d1 == null) return R('sin_datos', 'No se pudo medir la distancia al perseguido.')
      if (d1 < d0 - 0.3) return R('cumplida', `Le recortaste ${(d0 - d1).toFixed(1)} km: sigue sin poder reorganizarse.`)
      if (d1 > d0 + 0.3) return R('no', `Se te alejó ${(d1 - d0).toFixed(1)} km. Con esa movilidad no se persigue.`)
      return R('parcial', 'Mantuviste la distancia, pero no le recortaste: no alcanza para impedirle romper contacto.')
    }

    case 'reconocer': {
      const vio = (ctx.detectadas && ctx.detectadas.size) || 0
      if (vio && perdi <= 5) return R('cumplida', `Informaste ${vio} contacto${vio > 1 ? 's' : ''} sin empeñarte.`)
      if (vio) return R('parcial', `Informaste ${vio} contacto${vio > 1 ? 's' : ''}, pero perdiendo ${perdi.toFixed(0)} %: eso es reconocimiento POR EL FUEGO, que es otra tarea y se paga.`)
      if (perdi > 5) return R('no', `Volviste golpeado (${perdi.toFixed(0)} %) y sin información: lo peor de los dos mundos.`)
      return R('no', 'No obtuviste ningún contacto nuevo. Revisá el itinerario y hacia dónde mira la observación.')
    }

    case 'vigilar': {
      const vio = (ctx.detectadas && ctx.detectadas.size) || 0
      if (moviKm > 1.0) return R('no', `Dejaste el sector (${moviKm.toFixed(1)} km): sin puesto de observación no hay alerta temprana.`)
      if (vio) return R('cumplida', `En el sector y con ${vio} contacto${vio > 1 ? 's' : ''} informado${vio > 1 ? 's' : ''}.`)
      return R('parcial', 'Estás en el sector pero no informaste nada. Puede que no haya enemigo — o que estés mirando al lado equivocado.')
    }

    case 'defender':
      if (u.estado === 'fuera_combate') return R('no', 'La posición se perdió con la unidad.')
      if (moviKm > 1.5) return R('no', `Cediste ${moviKm.toFixed(1)} km: eso ya no es defender esta posición.`)
      return R('cumplida', `Mantenés la posición${perdi >= 1 ? ` (perdiste ${perdi.toFixed(0)} %)` : ''}.`)

    case 'retener':
      if (u.estado === 'fuera_combate') return R('no', 'El terreno se perdió con la unidad. Retener a toda costa tiene este precio: hay que ordenarlo sabiéndolo.')
      if (moviKm > 0.3) return R('no', `Te moviste ${moviKm.toFixed(1)} km. RETENER no admite cambiar terreno por tiempo — para eso está DEFENDER o RETARDAR.`)
      return R('cumplida', `El terreno sigue en tus manos${perdi >= 1 ? ` (perdiste ${perdi.toFixed(0)} %)` : ''}.`)

    case 'bloquear': {
      const t = u.trabajo
      if (ctx.obraTerminada && ctx.obraTerminada.has(u.id)) {
        // Un obstáculo sin fuego encima NO es un bloqueo cumplido: es un
        // obstáculo regalado. Por eso baja a «a medias» en vez de aprobarse con
        // una advertencia al pie, que es lo que nadie lee.
        return ctx.obraBatida && ctx.obraBatida.has(u.id)
          ? R('cumplida', 'Obstáculo terminado y BATIDO POR FUEGO desde tu dispositivo: así cumple.')
          : R('parcial', 'Obstáculo terminado, pero NINGUNA unidad tuya lo bate por fuego. Un obstáculo no cubierto sólo le cuesta tiempo al enemigo: lo levanta y pasa.')
      }
      if (t) return R('parcial', `La obra avanza: faltan ${t.restan} de ${t.total} turnos. Hasta que no esté, la avenida sigue abierta.`)
      return R('no', 'No hay obra en curso ni terminada: la avenida sigue abierta.')
    }

    case 'asegurar': {
      const dest = (orden.destino_lng != null) ? [orden.destino_lng, orden.destino_lat] : null
      if (!dest) return R('sin_datos', 'No se pudo evaluar: la orden no trae el punto a asegurar.')
      const d = haversineKm([u.lng, u.lat], dest)
      if (d > 1.0) return R('no', `Quedaste a ${d.toFixed(1)} km del punto: asegurar es QUEDARSE ahí.`)
      const cerca = ctx.enemigosCerca ? ctx.enemigosCerca(u) : 0
      if (cerca) return R('parcial', `Estás en el punto, pero con ${cerca} enemigo${cerca > 1 ? 's' : ''} a la vista: todavía lo puede observar o batir.`)
      return R('cumplida', 'En el punto y sin enemigo que lo observe.')
    }

    case 'cubrir':
      if (u.estado === 'fuera_combate') return R('no', 'La cobertura se perdió con la unidad.')
      if (moviKm > 2.0) return R('parcial', `Te desplazaste ${moviKm.toFixed(1)} km. El que cubre se mantiene ENTRE la fuerza principal y el enemigo.`)
      return R('cumplida', `Cobertura mantenida${perdi >= 1 ? ` (aguantaste ${perdi.toFixed(0)} % de desgaste)` : ''}.`)

    case 'retardar': {
      if (u.estado === 'fuera_combate') return R('no', 'La unidad se perdió. Retardar es ganar tiempo CONSERVANDO la fuerza — si la gastás, el retardo termina acá.')
      if (perdi >= 20) return R('parcial', `Ganaste tiempo, pero perdiendo ${perdi.toFixed(0)} %: eso ya no es retardar, es defender sin haberlo ordenado.`)
      if (moviKm < 0.3) return R('parcial', 'No cediste espacio. Retardar es cambiar terreno por tiempo: quedarse quieto es defender.')
      return R('cumplida', `Cediste ${moviKm.toFixed(1)} km conservando la fuerza${perdi >= 1 ? ` (sólo ${perdi.toFixed(0)} % de desgaste)` : ''}.`)
    }

    case 'romper': {
      const a0 = ctx.enemigoMasCerca ? ctx.enemigoMasCerca(antes) : null
      const a1 = ctx.enemigoMasCerca ? ctx.enemigoMasCerca(u) : null
      if (a0 == null) return R('sin_datos', 'No había contacto que romper al empezar el turno.')
      if (a1 == null || a1 > ctx.rango) return R('cumplida', `Te desenganchaste: el enemigo más cercano quedó a ${a1 == null ? '—' : a1.toFixed(1)} km.${costo}`)
      return R('no', `Seguís en contacto (enemigo a ${a1.toFixed(1)} km).${costo}`)
    }
  }
  return null
}
const _TAREA_ICONO: any = { cumplida: '✅', parcial: '⚠️', no: '❌', sin_datos: 'ℹ️' }
const _TAREA_ROTULO: any = { cumplida: 'TAREA CUMPLIDA', parcial: 'CUMPLIDA A MEDIAS', no: 'TAREA NO CUMPLIDA', sin_datos: 'SIN EVALUAR' }
// El renglón de bitácora. Va aparte del de movimiento a propósito: uno cuenta
// lo que pasó, éste JUZGA — y el cursante tiene que poder distinguirlos.
function textoTarea(u: any, orden: any, ev: any) {
  const T = TAREAS[orden.tarea]
  if (!T || !ev) return null
  const prop = (orden.proposito && String(orden.proposito).trim()) || T.proposito
  return `${_TAREA_ICONO[ev.estado]} ${_TAREA_ROTULO[ev.estado]} — ${nombreUnidad(u)} tenía que `
    + `${T.nom} (${prop}). ${ev.texto}`
    + ((ev.estado === 'no' || ev.estado === 'parcial') && T.doctrina ? ` 📖 ${T.doctrina}` : '')
}

// ---------- Drones de observación (v2.9.232) ----------
// La observación propia es un CÍRCULO: ve igual en todas direcciones. El dron ve
// MUCHO más lejos, pero sólo hacia donde lo apuntan. Ésa es la decisión que
// enseña: mirar al norte es aceptar no ver el sur. Alcance y apertura salen del
// ESCALÓN; lo que decide el EM es el RUMBO.
const DRON: any = {
  seccion:    { km: 6,  apertura: 50 },
  compania:   { km: 10, apertura: 55 },
  batallon:   { km: 16, apertura: 60 },
  regimiento: { km: 20, apertura: 60 },
  brigada:    { km: 28, apertura: 65 },
  division:   { km: 36, apertura: 70 },
  cuerpo:     { km: 45, apertura: 70 },
  ejercito:   { km: 55, apertura: 75 },
};
function dronDe(u: any) {
  if (!u || u.dron_rumbo == null) return null;
  if (poderEfectivo(u) <= 0) return null;
  const cfg = DRON[u.escalon] || DRON.batallon;
  return { rumbo: ((Number(u.dron_rumbo) || 0) % 360 + 360) % 360, km: cfg.km, apertura: cfg.apertura };
}
function rumboEntre(a: number[], b: number[]) {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
function difRumbo(a: number, b: number) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}
// ============================================================
// v2.9.285 — EL DRON MIRA DESDE DONDE ESTÁ VOLANDO.
//
// Sergio: «del rojo el dron no identificó ninguna posición de las unidades,
// pasé varias veces por ahí y no hubo nada».
//
// Éste era el agujero. La detección salía del PUESTO DE MANDO y en un cono de
// 60°, así que daba lo mismo por dónde volara el aparato: el sensor seguía
// clavado en la unidad de tierra. Y el CW 40 merodea a decenas de kilómetros de
// ahí. Volar el dron literalmente no cambiaba nada.
//
// Ahora, si el bando mandó dónde está volando (`dron_vuelo`), el sensor se mide
// DESDE ESE PUNTO y bate un CÍRCULO, no un cono: la torreta es giroestabilizada
// y mira en todo el derredor, que es lo que la pantalla ya hacía desde la 261.
// Sin `dron_vuelo` (partida vieja, aparato recién despegado) se cae al
// comportamiento de antes, así que nada se rompe.
// ============================================================
// El aparato REAL que se vuela en pantalla es uno solo por bando: el CW 40, con
// su alcance de sensor propio. La tabla `DRON` por escalón es del modelo viejo
// y sigue valiendo mientras el aparato no esté desplegado. Sin esto la estación
// decía «Observa 24 km» y el servidor detectaba a 16 (un batallón): el operador
// volaba encima del enemigo y no le aparecía nada.
const CW40_SENSOR_KM = 24;
function ojoDron(u: any) {
  const dron: any = dronDe(u);
  if (!dron) return null;
  const v: any = u.dron_vuelo;
  const vivo = v && Number.isFinite(Number(v.lng)) && Number.isFinite(Number(v.lat));
  if (!vivo) return { pos: [u.lng, u.lat], dron, volando: false };
  return { pos: [Number(v.lng), Number(v.lat)],
           dron: { ...dron, km: CW40_SENSOR_KM }, volando: true };
}
// ============================================================
// v2.9.285 — QUÉ ALCANZA A VER UN BANDO EN ESTE INSTANTE.
// Es el gemelo de `_wgBandoVeA` del navegador, y tiene que seguir siéndolo: si
// los dos no dicen lo mismo, la pantalla dibuja fichas que el servidor no
// reconoce (o al revés) y vuelve el «cada uno juega otro escenario».
//   · el CW 40 bate un círculo desde donde está VOLANDO,
//   · la tropa de tierra ve lo que tiene encima y nada más.
// Se usa igual desde `estado` y desde `pulso` — a propósito, una sola fuente.
// ============================================================
const VISTA_TROPA_KM = 4;
function idsVisiblesEnVivo(bando: string, unidades: any[]) {
  const vistos = new Set<any>();
  const viva = (u: any) => u && u.estado !== "fuera_combate"
    && Number.isFinite(Number(u.lng)) && Number.isFinite(Number(u.lat));
  const mias = (unidades || []).filter((u: any) => u.bando === bando && viva(u));
  const enemigas = (unidades || []).filter((u: any) => u.bando !== bando && viva(u));
  if (!mias.length || !enemigas.length) return vistos;
  for (const obs of mias) {
    const o = ojoDron(obs);
    for (const en of enemigas) {
      if (vistos.has(en.id)) continue;
      const pt = [Number(en.lng), Number(en.lat)];
      if (haversineKm([obs.lng, obs.lat], pt) <= VISTA_TROPA_KM) { vistos.add(en.id); continue; }
      if (o && haversineKm(o.pos, pt) <= o.dron.km) vistos.add(en.id);
    }
  }
  return vistos;
}
function enConoDron(u: any, pt: number[]) {
  const o = ojoDron(u);
  if (!o) return false;
  const d = haversineKm(o.pos, pt);
  if (d > o.dron.km) return false;
  // Volando: círculo alrededor del aparato. En tierra: el cono de siempre.
  if (o.volando) return true;
  return difRumbo(rumboEntre([u.lng, u.lat], pt), o.dron.rumbo) <= o.dron.apertura / 2;
}

// ---------- Munición (v2.9.230) ----------
// En UNIDADES DE FUEGO (UF): no se planifica «tantos proyectiles», se planifica
// cuántas veces puede batir esa pieza antes de quedarse muda.
const COSTO_UF: any = { destruccion: 1, interdiccion: 2, neutralizacion: 1, empeno: 1, encuentro: 0.5 };
function municionDe(u: any, armaId: string) {
  const arma: any = ARMAS[armaId];
  if (!arma) return 0;
  const m = u && u.municion;
  if (m && Object.prototype.hasOwnProperty.call(m, armaId)) return Math.max(0, Number(m[armaId]) || 0);
  return ufTope(u, armaId);   // v2.9.439: la dotación planificada de ESA unidad
}
function gastarMunicion(u: any, armaId: string, uf: number) {
  const hay = municionDe(u, armaId);
  const gasta = Math.min(hay, Math.max(0, Number(uf) || 0));
  if (!u.municion) u.municion = {};
  u.municion[armaId] = Number((hay - gasta).toFixed(2));
  return gasta;
}
function armamentoConMunicion(u: any) {
  return armamentoDe(u).filter((a: any) => !a.ingenieria && a.alcance > 0 && municionDe(u, a.id) > 0);
}
function armaDeFuego(u: any, id: any) {
  const dispo = armamentoDe(u).filter((a: any) => !a.ingenieria && a.alcance > 0);
  if (!dispo.length) return null;
  // v2.9.230: el sistema pedido se respeta AUNQUE esté seco (para poder avisar);
  // si no se pidió ninguno, se toma el de mayor alcance que todavía tenga con qué.
  if (id) { const pedida = dispo.find((a: any) => a.id === id); if (pedida) return pedida; }
  const conMunicion = dispo.filter((a: any) => municionDe(u, a.id) > 0);
  const lista = conMunicion.length ? conMunicion : dispo;
  return lista[lista.length - 1];
}
// v2.9.219 — CONCENTRACIÓN DE FUEGO SOBRE UN PUNTO DEL TERRENO. Hasta acá sólo
// se podía atacar una FICHA, que no es como se pide el fuego: se bate una ZONA
// y le pega a todo el que esté adentro, los propios incluidos.
function resolverFuegoArea(atac: any, punto: number[], arma: any, unidades: any[], terreno: any[]) {
  const d = haversineKm([atac.lng, atac.lat], punto);
  if (d > arma.alcance) return { alcanza: false, d, bajas: [] as any[], tocadas: [] as any[] };
  const bajas: any[] = [], tocadas: any[] = [];
  for (const u of unidades) {
    if (poderEfectivo(u) <= 0) continue;
    const du = haversineKm([u.lng, u.lat], punto);
    if (du > arma.radio) continue;
    const cerca = 1 - 0.5 * (arma.radio > 0 ? du / arma.radio : 0);
    const perd = Math.min(0.95, (arma.pot * cerca) / bonoDefensa([u.lng, u.lat], terreno));
    const nuevo = Math.max(0, poderEfectivo(u) * (1 - perd));
    const estado = nuevo <= u.poder_max * 0.2 ? "fuera_combate" : (nuevo <= u.poder_max * 0.6 ? "desgastada" : "activa");
    bajas.push({ id: u.id, poderNuevo: Number(nuevo.toFixed(2)), estado });
    tocadas.push({ u, du, perd });
  }
  return { alcanza: true, d, bajas, tocadas };
}
function textoFuego(atac: any, arma: any, res: any) {
  const zona = `zona batida ${Math.round(arma.radio * 1000)} m`;
  const base = `💥 ${nombreUnidad(atac)} tiró con ${arma.nom} a ${res.d.toFixed(1)} km (${zona})`;
  if (!res.tocadas.length) return base + " — cayó en VACÍO: no había nadie en la zona. Munición gastada y posición delatada.";
  // v2.9.222: además de cuánto perdió, CÓMO QUEDÓ — con nombre y en palabras.
  const porId = new Map(res.bajas.map((b: any) => [b.id, b]));
  const partes = res.tocadas.map((t: any) => {
    const b: any = porId.get(t.u.id);
    return `${nombreUnidad(t.u)} → ${b ? estadoEnPalabras(t.u, b) : "−" + Math.round(t.perd * 100) + " %"}`;
  });
  const amigo = res.tocadas.some((t: any) => t.u.bando === atac.bando);
  return base + " — " + partes.join(" · ") + "." + (amigo ? " ⚠️ FUEGO AMIGO: había fuerza propia en la zona batida." : "");
}
// Regla de Sergio: el tiro que no llega se dispara IGUAL — gasta munición y
// delata la posición. El error no es «no pasó nada».
function textoFuegoPerdido(atac: any, def: any, arma: any, d: number) {
  return `🔥 ${nombreUnidad(atac)}: DISPARÓ FUERA DE ALCANCE contra ${nombreUnidad(def)} — `
    + `${arma.nom} bate hasta ${arma.alcance.toFixed(1)} km y el blanco está a ${d.toFixed(1)} km. `
    + `Los tiros cayeron cortos: gastó munición y DELATÓ SU POSICIÓN.`;
}
// ============================================================
// v2.9.334 — REABASTECIMIENTO: LAS INSTALACIONES DEL G-4 PASAN A SERVIR.
// Hasta acá eran DIBUJO («el motor NO las interpreta»), así que daba lo mismo
// dónde las pusiera el G-4. Ahora, al final del turno, la unidad que quedó
// dentro del radio de una instalación PROPIA repone lo que ésa distribuye:
// Clase III → combustible, Clase V → munición. Es el proceso «por cuenta
// propia» del reglamento: por eso lo que decide es la DISTANCIA.
// ============================================================
const REABASTECER_KM = 3;
// v2.9.344 — LA INSTALACIÓN SE AGOTA.
// Hasta acá un Puesto de Distribución reabastecía INFINITAS veces, y entonces
// la decisión del G-4 no costaba nada: daba igual poner uno o cinco, y el
// escalón superior no hacía falta nunca. `cap` son las CARGAS que puede
// entregar antes de quedar seco (una carga = una unidad reabastecida). Es lo
// que obliga a prever la reposición y lo que hace que perder el ASDI duela.
// v2.9.351 — `despacha` = qué VEHÍCULOS puede formar cada puesto. De un Punto de
// Municionamiento no sale un aguatero, y del Puesto de Socorro no salen bidones:
// sale la ambulancia. Es lo que separa un puesto de otro en la carta.
// `sostiene` (Clase I y agua) y `sanidad` (evacuación) son los efectos nuevos:
// no reponen combustible ni munición — restituyen PODER DE COMBATE, que es lo
// que hace de verdad el apoyo de servicio de combate cuando llega a tiempo.
const INSTAL_LOG: any = {
  log_abas:  { nom: "Puesto de abastecimiento", clases: ["I", "III"], combustible: 1, municion: 0, cap: 12,
               despacha: ["I", "AGUA", "III"], sostiene: 1 },
  log_muni:  { nom: "Punto de municionamiento", clases: ["V"], combustible: 0, municion: 1, cap: 10,
               despacha: ["V"] },
  log_soco:  { nom: "Puesto de socorro", clases: ["VIII"], combustible: 0, municion: 0, cap: 14,
               despacha: ["EVAC"], sanidad: 1 },
  log_trans: { nom: "Centro de transporte", clases: ["III", "IX"], combustible: 0.5, municion: 0, cap: 8,
               despacha: ["I", "AGUA", "III"], sostiene: 1 },
  log_trenc: { nom: "Tren de Combate", clases: ["I", "III", "V"], combustible: 0.5, municion: 0.5, cap: 4,
               despacha: ["III", "V"], sostiene: 1 },
  log_trenk: { nom: "Tren de Campaña", clases: ["I", "III", "V"], combustible: 1, municion: 1, cap: 8,
               despacha: ["I", "III", "V"], sostiene: 1 },
  log_asdi:  { nom: "Área de Servicios (ASDI)", clases: ["I", "III", "V", "VIII"], combustible: 1, municion: 1, cap: 20,
               despacha: ["I", "AGUA", "III", "V", "EVAC"], sostiene: 1, sanidad: 1 },
  // v2.9.448 — la del G-1: de acá salen los reemplazos (una carga = 50 hombres).
  log_reemp: { nom: "Unidad de Reemplazos", clases: [], combustible: 0, municion: 0, cap: 6,
               despacha: ["REEMP"], reemplazos: 1 },
};
// Cargas ya entregadas por una instalación (viven en su propio geojson, así no
// hace falta ni una columna nueva ni SQL).
function usadoDe(x: any) { return Number((x && x.geojson && x.geojson.usado) || 0); }
function capDe(x: any) { const I = x && INSTAL_LOG[x.tipo]; return I && I.cap ? Number(I.cap) : 0; }
function instalSeca(x: any) { const c = capDe(x); return c > 0 && usadoDe(x) >= c; }
// Anota una carga entregada y marca la fila para que se guarde al cerrar el turno.
function gastarCargaInstal(x: any) {
  if (!x || !INSTAL_LOG[x.tipo]) return;
  if (!x.geojson) x.geojson = {};
  x.geojson.usado = usadoDe(x) + 1;
  x._sucia = true;
}
function esInstalacionLog(tipo: string) { return !!INSTAL_LOG[tipo]; }
// ============================================================
// v2.9.335 — LOS CONVOYES: EL PROCESO «A DOMICILIO».
// El reglamento describe dos procesos y el juego sólo tenía uno. POR CUENTA
// PROPIA = la unidad va al Puesto de Distribución (v2.9.334). A DOMICILIO = «la
// instalación proveedora LLEVA los abastecimientos, con sus medios, hasta los
// elementos apoyados» — eso es el convoy.
// Un convoy es una UNIDAD: así hereda movimiento, niebla, detección y combate, y
// por eso puede ser ATACADO en ruta. Interdictar el EPA deja de ser una frase.
// ============================================================
const CONVOY_ARMA = "convoy";
const CONVOY_CAPACIDAD = 3;
// v2.9.443 — EL CONVOY ES UNA SECCIÓN DE CAMIONES, NO UNA FUERZA DE COMBATE. Con
// 15 de poder (más que un batallón, 12) el convoy de víveres Cnv-I-1 de «ZAPATO II»
// «abrió fuego» sobre el PEL. REC. BLIN. rojo con relación 24,3:1. Ahora pelea
// con lo de una sección (2) y nunca empieza un combate: sólo se defiende.
const CONVOY_PODER = 2;
const CONVOY_PODER_VIEJO = 15;
const CONVOY_PAQUETE = 2;   // v2.9.443: cargas de cada clase de un paquete logístico (III + V + I)
const CONVOY_OBS_KM = 3;
function esConvoy(u: any) { return !!u && u.arma === CONVOY_ARMA; }
// v2.9.335 — LA INSTALACIÓN LOGÍSTICA ES UN BLANCO. Batir el área de retaguardia
// es media doctrina, y es lo que obliga al G-4 a pensar dónde pone el ASDI
// («fuera del alcance de los morteros y, si es posible, de la artillería»).
// El radio es más generoso que el del estallido sobre tropa: una instalación es
// un área con vehículos, carpas y estibas, no un punto.
const INSTAL_RADIO_EXTRA = 0.4;
function instalacionesBatidas(punto: number[], arma: any, instalaciones: any[], bandoAtacante: string) {
  const r = (arma && arma.radio ? arma.radio : 0.2) + INSTAL_RADIO_EXTRA;
  return (instalaciones || []).filter((x: any) => {
    if (!x || !INSTAL_LOG[x.tipo] || x.bando === bandoAtacante) return false;
    const pt = puntoInstalacion(x);
    return pt && haversineKm(punto, pt) <= r;
  });
}
function cargaDe(u: any, clase: string) {
  const c = (u && u.carga) || {};
  return Math.max(0, Number(c[clase]) || 0);
}
// v2.9.351 — cinco clases, no dos. Cada una con su vehículo y su efecto.
const CONVOY_CLASES = ["I", "AGUA", "III", "V", "EVAC", "REEMP"];   // v2.9.448: REEMP = reemplazos (G-1)
// Lo que restituye una entrega, en fracción del poder MÁXIMO de la unidad.
// Modesto a propósito: el apoyo de servicio de combate sostiene, no resucita.
const SOSTEN_PCT = 0.08;   // Clase I + agua: raciones y agua mantienen el rendimiento
const EVAC_PCT   = 0.15;   // evacuación: el herido tratado a tiempo vuelve a la línea
// ============================================================
// v2.9.447 — LA CLASE I SE CONSUME. Sergio (03-11-2026): «considerando
// alimentación también». Hasta acá «el tiempo no daba hambre ni sed».
// Cada unidad lleva sus raciones y su agua en DÍAS (`carga.racion`); el tope es su
// nivel planificado (Anexo de Logística: «3 días operativos + 1 de seguridad»).
// Se gasta un día cada 24 h. Sin raciones ni agua, pierde el 8 % de su poder por
// día (`carga.hambre` lleva lo perdido). La Clase I que le llega rellena los días
// y le devuelve lo que perdió por hambre.
// ⚠️ 8 %/día: cifra de referencia, a validar con las tablas de la Escuela.
// ============================================================
const HAMBRE_PCT_DIA = 0.08;
function topeRacion(u: any) { const m = mediosDe(u); const n = Number(m && m.nivelDias); return n > 0 ? Math.min(10, n) : 3; }
function racionDe(u: any) { const c = u && u.carga; const r = c ? Number(c.racion) : NaN; return Number.isFinite(r) ? Math.max(0, r) : topeRacion(u); }
function conRacion(u: any) { return !!(u && !esConvoy(u) && u.carga && u.carga.racion != null); }
// ============================================================
// v2.9.448 — LAS BAJAS, LA EVACUACIÓN (G-4) Y LOS REEMPLAZOS (G-1).
// Sergio (03-11-2026): «si necesitan reemplazos de personal, evacuaciones… deben
// haber evacuaciones que soliciten las unidades… el G-4 tendrá un rol demasiado
// importante: podrá mover sus vehículos de evacuación mientras hay combate… el
// G-1 como reemplazos».
//   · Lo que una unidad pierde en el turno (combate, fuego, minas, interdicción)
//     son HOMBRES: poder perdido / poder máximo × su efectivo. El 70 % son heridos
//     que esperan evacuación (`carga.heridos`); el resto, muertos. Le faltan esos
//     hombres (`carga.faltan`) hasta que lleguen reemplazos.
//   · El herido que espera se agrava: el 1,5 % por hora muere.
//   · Se evacúa POR CUENTA PROPIA (a 3 km o menos de un puesto de socorro o del
//     ASDI propio) o con AMBULANCIAS (convoy EVAC del G-4: por camino, carga 20
//     heridos cada 30 min y los lleva a su puesto).
//   · Los REEMPLAZOS los manda el G-1 desde la Unidad de Reemplazos (convoy REEMP,
//     50 hombres por carga): la unidad recupera el poder de los hombres que recibe.
// ⚠️ Cifras de referencia, a validar con las tablas de la Escuela.
// ============================================================
const EFECTIVO_REF: any = { equipo: 6, escuadra: 10, seccion: 35, compania: 130, batallon: 600, regimiento: 1500,
  brigada: 3500, division: 10000, cuerpo: 30000, ejercito: 60000 };
function hombresDe(u: any) { const m = mediosDe(u); const n = Number(m && m.efectivo); return n > 0 ? n : (EFECTIVO_REF[u && u.escalon] || 600); }
const HERIDOS_PCT = 0.7;
const MUERE_H = 0.015;          // de los heridos que esperan, por hora
const HERIDOS_POR_CARGA = 20;   // una carga de ambulancias
const HOMBRES_POR_CARGA = 50;   // una carga de reemplazos
function num(x: any) { const n = Number(x); return Number.isFinite(n) ? n : 0; }
function herDe(u: any) { return Math.max(0, num(u && u.carga && u.carga.heridos)); }
function lugarAmbulancia(cv: any) { return Math.max(0, cargaDe(cv, "EVAC") * HERIDOS_POR_CARGA - num(cv && cv.carga && cv.carga.aBordo)); }
function cargaTotal(u: any) { return CONVOY_CLASES.reduce((a, k) => a + cargaDe(u, k), 0); }
function claseQueLleva(u: any) { return CONVOY_CLASES.find((k) => cargaDe(u, k) > 0) || null; }
function gastarCarga(u: any, clase: string) {
  if (!u.carga) u.carga = {};
  u.carga[clase] = Math.max(0, cargaDe(u, clase) - 1);
}
// ============================================================
// v2.9.443 — EL ABASTECIMIENTO QUE FUNCIONA.
// Sergio: «si se realiza un abastecimiento el vehículo deja su abastecimiento y
// vuelve, no deja abastecido a cada aparato de la unidad, sólo abastece una vez
// y luego se va… yo sí quiero que se les acabe la munición y el combustible, de
// acuerdo a lo que ellos planificaron… por eso deben funcionar los
// abastecimientos».
// Medido en «ZAPATO II»: los dos convoyes eran de Clase I; a la DIV MEC-2 le
// dieron «+6 de poder» dos turnos y ni un litro ni un tiro. Cada CARGA del
// convoy abastecía a UNA sola unidad, de UNA sola clase, y la estiba de la
// instalación no bajaba al recargarlo: se recargaba gratis, infinitas veces.
// Ahora las cantidades son de verdad, en CARGAS DE BATALLÓN: lo que necesita un
// batallón para llenar el tanque entero, o para completar toda su dotación de
// munición. Una división pesa 8 batallones; una compañía, 0,4 (PESO_ESCALON).
//   · El convoy (y el puesto) REPARTE entre TODAS las unidades propias que
//     quedan a 3 km o menos lo que le falta a CADA una: el tanque y cada sistema
//     de arma hasta su dotación planificada, nunca más. Si no alcanza para todos,
//     reparte en proporción y lo dice.
//   · Lo que entrega sale de su carga; la carga del convoy sale de la estiba de
//     su instalación al formarlo y al recargarlo. Agotada, no entrega más: la
//     repone el escalón superior (el árbitro, con 📦 Reponer).
//   · Los topes son los planificados (dotación de cada sistema, autonomía).
// ============================================================
const PESO_ESCALON: any = { equipo: 0.05, escuadra: 0.1, seccion: 0.25, compania: 0.4, batallon: 1,
  regimiento: 1.5, brigada: 3, division: 8, cuerpo: 20, ejercito: 40 };
// v2.9.446: con su efectivo, si se sabe (`medios.peso`: 600 H = una carga de batallón).
// Una «división» de 3.570 H no carga como una de 10.000.
function pesoDe(u: any) {
  const m = mediosDe(u);
  if (m && Number(m.peso) > 0) return Number(m.peso);
  const p = PESO_ESCALON[u && u.escalon]; return p != null ? p : 1;
}
const r3 = (x: number) => Math.round(x * 1000) / 1000;
// La fracción del tanque que le falta (0 = lleno, 1 = vacío).
function faltaTanque(u: any) {
  const t = tanqueDe(u);
  if (!(t > 0)) return 0;
  return Math.max(0, Math.min(1, (Number(u.combustible_km) || 0) / t));
}
// Los sistemas que se reponen con Clase V (no la zapa) y la fracción media de su
// dotación que le falta a la unidad.
function sistemasConDotacion(u: any) {
  return armamentoDe(u).filter((a: any) => !a.ingenieria && ufTope(u, a.id) > 0);
}
function faltaMunicion(u: any) {
  const s = sistemasConDotacion(u);
  if (!s.length) return 0;
  return s.reduce((acc: number, a: any) => acc + Math.max(0, 1 - municionDe(u, a.id) / ufTope(u, a.id)), 0) / s.length;
}
function faltaPoder(u: any) {
  const tope = Math.max(0, Number(u.poder_max) || 0);
  return tope > 0 ? Math.max(0, tope - Math.max(0, Number(u.poder_actual) || 0)) : 0;
}
// Cuántas cargas necesita la unidad de esa clase, si la fuente entrega a lo más
// `factor` de lo que le falta por turno (el Tren de Combate llena medio tanque).
function necesidad(u: any, clase: string, factor: number) {
  const p = pesoDe(u), tope = Math.max(0, Number(u.poder_max) || 0);
  if (clase === "III") return p * Math.min(factor, faltaTanque(u));
  if (clase === "V") return p * Math.min(factor, faltaMunicion(u));
  // v2.9.447: con sus raciones a la vista, lo que le falta para el tope (un tope
  // entero = una carga de batallón por cada batallón que pesa).
  if (clase === "I" && conRacion(u)) return p * Math.min(factor, Math.max(0, 1 - racionDe(u) / topeRacion(u)));
  if (clase === "I") return tope > 0 ? p * Math.min(1, faltaPoder(u) / (tope * SOSTEN_PCT)) : 0;
  // v2.9.448: los reemplazos, en cargas de 50 hombres (lo que le falta por bajas).
  if (clase === "REEMP") return Math.max(0, num(u.carga && u.carga.faltan)) / HOMBRES_POR_CARGA;
  if (clase === "EVAC") return tope > 0 ? p * Math.min(1, faltaPoder(u) / (tope * EVAC_PCT)) : 0;
  return 0;
}
// Lo que hace una entrega de `n` cargas de esa clase.
function entregar(u: any, clase: string, n: number) {
  const p = pesoDe(u);
  if (n <= 1e-9 || !(p > 0)) return 0;
  if (clase === "III") {
    const t = tanqueDe(u);
    const km = Math.min(Number(u.combustible_km) || 0, (n / p) * t);
    u.combustible_km = Number(Math.max(0, (Number(u.combustible_km) || 0) - km).toFixed(2));
    return km;
  }
  if (clase === "V") {
    const falta = p * faltaMunicion(u);
    const f = falta > 0 ? Math.min(1, n / falta) : 0;
    let uf = 0;
    if (!u.municion) u.municion = {};
    for (const a of sistemasConDotacion(u)) {
      const tope = ufTope(u, a.id), hay = municionDe(u, a.id);
      const sube = Math.max(0, tope - hay) * f;
      if (sube <= 1e-6) continue;
      u.municion[a.id] = Number(Math.min(tope, hay + sube).toFixed(2));
      uf += sube;
    }
    return uf;
  }
  // v2.9.448 — los reemplazos: hombres que se incorporan y el poder que traen.
  if (clase === "REEMP") {
    const falta = Math.max(0, num(u.carga && u.carga.faltan));
    const hombres = Math.min(falta, Math.round(n * HOMBRES_POR_CARGA));
    if (hombres <= 0) return 0;
    const pm = Math.max(0, Number(u.poder_max) || 0);
    const nuevo = Math.min(pm, (Number(u.poder_actual) || 0) + pm * hombres / hombresDe(u));
    u.poder_actual = Number(nuevo.toFixed(2));
    u.estado = nuevo <= pm * 0.2 ? "fuera_combate" : (nuevo <= pm * 0.6 ? "desgastada" : "activa");
    u.carga = { ...(u.carga || {}), faltan: falta - hombres, reemplazos: num(u.carga && u.carga.reemplazos) + hombres };
    return hombres;
  }
  // v2.9.447 — Clase I con raciones: rellena días y devuelve lo perdido por hambre.
  if (clase === "I" && conRacion(u)) {
    const tope = topeRacion(u), antes = racionDe(u);
    const dias = Math.max(0, Math.min(tope - antes, (n / p) * tope));
    const c: any = { ...u.carga, racion: Math.round((antes + dias) * 100) / 100 };
    const hambre = Math.max(0, Number(c.hambre) || 0);
    if (hambre > 0 && dias > 0) {
      const pm = Math.max(0, Number(u.poder_max) || 0);
      const vuelve = Math.min(hambre, faltaPoder(u));
      const nuevo = Math.min(pm, (Number(u.poder_actual) || 0) + vuelve);
      u.poder_actual = Number(nuevo.toFixed(2));
      u.estado = nuevo <= pm * 0.2 ? "fuera_combate" : (nuevo <= pm * 0.6 ? "desgastada" : "activa");
      c.hambre = Math.round((hambre - vuelve) * 100) / 100;
    }
    u.carga = c;
    return dias;
  }
  const tope = Math.max(0, Number(u.poder_max) || 0);
  const pct = clase === "I" ? SOSTEN_PCT : EVAC_PCT;
  const sube = Math.min(faltaPoder(u), (n / p) * tope * pct);
  if (sube > 0) {
    const nuevo = Math.min(tope, (Number(u.poder_actual) || 0) + sube);
    u.poder_actual = Number(nuevo.toFixed(2));
    u.estado = nuevo <= tope * 0.2 ? "fuera_combate" : (nuevo <= tope * 0.6 ? "desgastada" : "activa");
  }
  return sube;
}
// Las fuentes de abastecimiento del turno: las instalaciones (estiba común a
// todas sus clases) y los convoyes (carga por clase; el agua sostiene igual que
// la Clase I).
function fuentesDeApoyo(instalaciones: any[], convoyes: any[]) {
  const out: any[] = [];
  for (const x of instalaciones || []) {
    const I = x && INSTAL_LOG[x.tipo];
    if (!I) continue;
    const pt = puntoInstalacion(x);
    if (!pt) continue;
    const clases: any = {};
    if (I.combustible) clases.III = I.combustible;
    if (I.municion) clases.V = I.municion;
    if (I.sostiene) clases.I = 1;
    if (I.reemplazos) clases.REEMP = 1;   // v2.9.448 (la sanidad evacúa aparte: `evacuarPorCuentaPropia`)
    out.push({ nom: I.nom, pt, bando: x.bando, instal: x, convoy: null, clases,
      stock: (_k: string) => Math.max(0, capDe(x) - usadoDe(x)),
      gastar: (_k: string, n: number) => {
        if (!x.geojson) x.geojson = {};
        x.geojson.usado = r3(usadoDe(x) + n);
        x._sucia = true;
      } });
  }
  for (const cv of convoyes || []) {
    if (!esConvoy(cv) || cv.estado === "fuera_combate") continue;
    const clases: any = {};
    if (cargaDe(cv, "III") > 0) clases.III = 1;
    if (cargaDe(cv, "V") > 0) clases.V = 1;
    if (cargaDe(cv, "I") > 0 || cargaDe(cv, "AGUA") > 0) clases.I = 1;
    if (cargaDe(cv, "REEMP") > 0) clases.REEMP = 1;   // v2.9.448 (la ambulancia carga heridos aparte)
    if (!Object.keys(clases).length) continue;
    out.push({ nom: `Convoy ${(cv.designacion || "").trim()}`.trim(), pt: [cv.lng, cv.lat], bando: cv.bando,
      instal: null, convoy: cv, clases,
      stock: (k: string) => k === "I" ? cargaDe(cv, "I") + cargaDe(cv, "AGUA") : cargaDe(cv, k),
      gastar: (k: string, n: number) => {
        if (!cv.carga) cv.carga = {};
        if (k === "I") {
          const a = Math.min(cargaDe(cv, "I"), n);
          cv.carga.I = r3(cargaDe(cv, "I") - a);
          cv.carga.AGUA = r3(Math.max(0, cargaDe(cv, "AGUA") - (n - a)));
        } else cv.carga[k] = r3(Math.max(0, cargaDe(cv, k) - n));
      } });
  }
  return out;
}
// EL REPARTO DEL FINAL DE LA JORNADA. Primero las instalaciones fijas (la carga
// del convoy es escasa y no se gasta en una unidad parada sobre el Puesto de
// Distribución), después los convoyes. Devuelve, por unidad, lo que recibió.
// v2.9.444 — Con `horasConvoy` (id → horas que el convoy estuvo PARADO en el turno)
// el convoy entrega sólo parado y lo que da su tiempo de descarga (HORAS_DESCARGA);
// en marcha no reparte nada. Primero, a la unidad que fue a abastecer. Sin el mapa
// (pruebas viejas, `reabastecer`), como antes.
function repartirAbastecimiento(unidades: any[], instalaciones: any[], horasConvoy?: Map<any, number>) {
  const fuentes = fuentesDeApoyo(instalaciones, (unidades || []).filter(esConvoy));
  const orden = [...fuentes.filter((f: any) => !f.convoy), ...fuentes.filter((f: any) => f.convoy)];
  const reg = new Map<any, any>();
  const porFuente: any[] = [];
  for (const f of orden) {
    let horas = Infinity;
    if (f.convoy && horasConvoy) {
      if ((f.convoy.carga || {}).fase === "vuelta") continue;   // vuelve con lo que le quedó: no reparte en el camino
      horas = Math.max(0, Number(horasConvoy.get(f.convoy.id)) || 0);
      if (horas <= 1e-6) continue;
    }
    const cerca = (unidades || []).filter((u: any) => u && !esConvoy(u) && u.estado !== "fuera_combate"
      && u.bando === f.bando && Number.isFinite(Number(u.lng)) && haversineKm([u.lng, u.lat], f.pt) <= REABASTECER_KM);
    if (!cerca.length) continue;
    const prio = f.convoy && f.convoy.carga ? f.convoy.carga.apoya : null;
    const grupos = prio != null && cerca.some((u: any) => String(u.id) === String(prio))
      ? [cerca.filter((u: any) => String(u.id) === String(prio)), cerca.filter((u: any) => String(u.id) !== String(prio))]
      : [cerca];
    const hecho = { f, cargas: 0, unidades: new Set<any>(), parcial: false, sigue: false, horas: 0 };
    for (const grupo of grupos) {
      for (const k of ["III", "V", "I", "REEMP"]) {
        const factor = f.clases[k];
        if (!factor || !grupo.length) continue;
        const stock = f.stock(k);
        if (stock <= 1e-6) continue;
        const nec = grupo.map((u: any) => ({ u, n: necesidad(u, k, factor) })).filter((x: any) => x.n > 1e-4);
        const total = nec.reduce((s: number, x: any) => s + x.n, 0);
        if (total <= 1e-6) continue;
        const hPorCarga = f.convoy ? (HORAS_DESCARGA[k] || 1) : 0;
        const porTiempo = hPorCarga > 0 ? horas / hPorCarga : Infinity;
        if (porTiempo <= 1e-6) continue;
        const da = Math.min(stock, total, porTiempo), prop = da / total;
        // Lo que no se dio: o no había (PARCIAL), o no dio el tiempo (sigue descargando).
        const porReloj = prop < 0.999 && porTiempo < Math.min(stock, total) - 1e-9;
        for (const x of nec) {
          const n = x.n * prop;
          const cant = entregar(x.u, k, n);
          if (cant <= 1e-6) continue;
          let e = reg.get(x.u.id);
          if (!e) { e = { u: x.u, de: [], clases: new Set<string>(), km: 0, uf: 0, poder: 0, aDomicilio: false, parcial: false, sigue: false }; reg.set(x.u.id, e); }
          if (!e.de.includes(f.nom)) e.de.push(f.nom);
          e.clases.add(k);
          if (k === "III") e.km += cant; else if (k === "V") e.uf += cant;
          else if (k === "I" && conRacion(x.u)) e.dias = (e.dias || 0) + cant;   // v2.9.447: días de raciones
          else if (k === "REEMP") e.hombres = (e.hombres || 0) + cant;            // v2.9.448: hombres
          else e.poder += cant;
          if (f.convoy) e.aDomicilio = true;
          if (porReloj) e.sigue = true; else if (prop < 0.999) e.parcial = true;
          hecho.unidades.add(x.u);
        }
        f.gastar(k, da);
        hecho.cargas += da;
        if (hPorCarga > 0) { const h = da * hPorCarga; horas -= h; hecho.horas += h; }
        if (porReloj) hecho.sigue = true; else if (prop < 0.999) hecho.parcial = true;
      }
    }
    if (hecho.cargas > 1e-6) porFuente.push(hecho);
  }
  return { reg, porFuente };
}
// ============================================================
// v2.9.445 — 📻 LOS PEDIDOS DE LOS COMANDANTES. Sergio (03-11-2026): «que los
// comandantes pidan reabastecimiento de munición, Clase III combustible, todas
// las clases… en la vista del azul sólo lo de azul y del rojo sólo lo de rojo».
// Al cerrar el turno, la unidad que BAJÓ de franja (menos de 40 % · menos de 20 % ·
// nada) lo pide por radio, en un renglón. Sólo cuando empeora: lo que sigue
// pendiente lo muestra la pantalla, calculado de la ficha y siempre al día.
// ============================================================
function franjaResto(resto: number) { return resto <= 1e-3 ? 3 : resto < 0.2 ? 2 : resto < 0.4 ? 1 : 0; }
// Lo que le queda del arma PRINCIPAL más baja (la batería pide por su obús, no por
// el promedio con sus fusiles). Sin armas pesadas, la más baja de todas.
const ARMAS_LIVIANAS = ["fusil", "ametralladora", "pesada"];
function municionPrincipal(u: any) {
  const s = sistemasConDotacion(u);
  if (!s.length) return null;
  const pesadas = s.filter((a: any) => !ARMAS_LIVIANAS.includes(a.id));
  let peor: any = null;
  for (const a of (pesadas.length ? pesadas : s)) {
    const r = Math.max(0, Math.min(1, municionDe(u, a.id) / ufTope(u, a.id)));
    if (!peor || r < peor.resto) peor = { resto: r, arma: a };
  }
  return peor;
}
function pedidosDelTurno(antes: Map<any, any>, U: Map<any, any>) {
  const out: any[] = [];
  const pedir = (u: any, f: number, txt: string[]) => out.push({ tipo: "pedido", bando: u.bando, lat: u.lat, lng: u.lng,
    descripcion: txt[f - 1], bandos_visibles: [u.bando] });
  for (const u of U.values()) {
    if (!u || esConvoy(u) || u.estado === "fuera_combate") continue;
    const a = antes.get(u.id);
    if (!a) continue;
    const nom = nombreUnidad(u);
    const t = tanqueDe(u);
    if (t > 0) {
      const r1 = 1 - faltaTanque(u), f1 = franjaResto(r1);
      if (f1 > franjaResto(1 - faltaTanque(a))) {
        const pct = Math.round(100 * r1), km = Math.round(r1 * t);
        pedir(u, f1, [`📻 ${nom}: pide Cl III — le queda ${pct} % (${km} km).`,
          `📻 ⚠️ ${nom}: pide Cl III URGENTE — ${pct} % (${km} km).`,
          `📻 ⛔ ${nom}: SIN COMBUSTIBLE, no se mueve. Pide Cl III.`]);
      }
    }
    // v2.9.448 — 🚑 los heridos nuevos piden evacuación; 👥 los hombres que faltan, reemplazos.
    {
      const h1 = herDe(u), h0 = herDe(a);
      if (h1 >= 5 && h1 - h0 >= 1) out.push({ tipo: "pedido", bando: u.bando, lat: u.lat, lng: u.lng, bandos_visibles: [u.bando],
        descripcion: `📻 ${nom}: pide evacuación — ${Math.round(h1)} heridos (+${Math.round(h1 - h0)}).` });
      const f1 = num(u.carga && u.carga.faltan), f0 = num(a.carga && a.carga.faltan), hom = hombresDe(u);
      const fuerza = Math.round(100 * (1 - f1 / hom));
      if (f1 - f0 >= 1 && fuerza < 90) out.push({ tipo: "pedido", bando: u.bando, lat: u.lat, lng: u.lng, bandos_visibles: [u.bando],
        descripcion: `📻 ${fuerza < 75 ? "⚠️ " : ""}${nom}: pide reemplazos — le faltan ${Math.round(f1)} hombres (${fuerza} %).` });
    }
    // v2.9.447 — Cl I: los días de raciones y agua que le quedan.
    {
      const tr = topeRacion(u), r1 = racionDe(u) / tr, f1 = franjaResto(r1);
      if (f1 > franjaResto(racionDe(a) / topeRacion(a))) {
        const dias = racionDe(u).toFixed(1).replace(".0", "");
        pedir(u, f1, [`📻 ${nom}: pide Cl I — raciones y agua para ${dias} día(s).`,
          `📻 ⚠️ ${nom}: pide Cl I URGENTE — raciones y agua para ${dias} día(s).`,
          `📻 ⛔ ${nom}: SIN RACIONES NI AGUA, pierde poder. Pide Cl I.`]);
      }
    }
    const m1 = municionPrincipal(u), m0 = municionPrincipal(a);
    if (m1 && m0) {
      const f1 = franjaResto(m1.resto);
      if (f1 > franjaResto(m0.resto)) {
        const que = `${m1.arma.nom} ${Math.round(100 * m1.resto)} %`;
        pedir(u, f1, [`📻 ${nom}: pide Cl V — ${que}.`,
          `📻 ⚠️ ${nom}: pide Cl V URGENTE — ${que}.`,
          `📻 ⛔ ${nom}: SIN MUNICIÓN de ${m1.arma.nom}. Pide Cl V.`]);
      }
    }
  }
  return out;
}
// El renglón de bitácora de la unidad que se abasteció: qué recibió y cómo quedó.
function textoAbastecido(e: any) {
  const u = e.u, partes: string[] = [];
  if (e.km > 0.05) {
    const t = tanqueDe(u);
    partes.push(`⛽ Cl III: +${e.km.toFixed(0)} km de autonomía (queda con ${(t - (Number(u.combustible_km) || 0)).toFixed(0)} de ${t} km)`);
  }
  if (e.uf > 1e-3) {
    const lista = sistemasConDotacion(u).map((a: any) => `${a.nom} ${municionDe(u, a.id).toFixed(1)}/${ufTope(u, a.id)} UF`);
    partes.push(`🎯 Cl V: ${lista.join(" · ")}`);
  }
  if (e.hombres > 0) partes.push(`👥 Reemplazos: +${Math.round(e.hombres)} hombres (le faltan ${Math.round(num(u.carga && u.carga.faltan))})`);
  if (e.dias > 0.01) partes.push(`🥫 Cl I y agua: +${e.dias.toFixed(1)} día(s) (lleva ${racionDe(u).toFixed(1)} de ${topeRacion(u)})`);
  if (e.poder > 0.01) {
    const txt = e.poder < 10 ? e.poder.toFixed(1) : e.poder.toFixed(0);
    partes.push(e.clases.has("EVAC") && !e.clases.has("I")
      ? `🚑 Evacuación sanitaria: bajas evacuadas, +${txt} de poder de combate`
      : `🥫 Cl I y agua${e.clases.has("EVAC") ? " + evacuación" : ""}: sostenimiento, +${txt} de poder de combate`);
  }
  if (e.parcial) partes.push("⚠️ PARCIAL: lo que había no alcanzó para completar a todos los que estaban al alcance");
  else if (e.sigue) partes.push("⏳ la descarga sigue");
  // v2.9.448: los reemplazos no «reabastecen»: se incorporan.
  if (e.clases.size === 1 && e.clases.has("REEMP")) return `👥 ${nombreUnidad(u)} recibió reemplazos de ${e.de.join(" + ")} — ${partes.join(" · ")}`;
  return `📦 ${nombreUnidad(u)} se reabasteció${e.aDomicilio ? " A DOMICILIO" : ""} en ${e.de.join(" + ")} — ${partes.join(" · ")}`;
}
// v2.9.443 — compatibilidad: abastecer UNA unidad con las fuentes dadas.
function reabastecer(u: any, fuentes: any[]) {
  if (!u || u.estado === "fuera_combate" || esConvoy(u)) return null;
  const insts = (fuentes || []).filter((x: any) => x && INSTAL_LOG[x.tipo]);
  const cvs = (fuentes || []).filter((x: any) => esConvoy(x));
  const { reg } = repartirAbastecimiento([u, ...cvs], insts);
  const e = reg.get(u.id);
  if (!e) return null;
  return { combustible: e.km, municion: e.uf, poder: e.poder, clases: [...e.clases].map((k) => k === "I" ? "I" : k),
    instalacion: e.de.join(" + "), aDomicilio: e.aDomicilio, texto: textoAbastecido(e) };
}
// Lo que puede llevar un convoy, por clase: lo que se fijó al formarlo; si es de
// antes de la v2.9.443, CONVOY_CAPACIDAD de lo que llevaba (o de lo primero que
// despache el puesto, si volvió vacío).
function capacidadConvoy(cv: any, despacha: Set<string>) {
  const c = (cv && cv.carga) || {};
  if (c.cap && typeof c.cap === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(c.cap)) if (CONVOY_CLASES.includes(k) && Number(v) > 0) out[k] = Number(v);
    if (Object.keys(out).length) return out;
  }
  const llevaba = CONVOY_CLASES.filter((k) => cargaDe(cv, k) > 0);
  const clases = llevaba.length ? llevaba : CONVOY_CLASES.filter((k) => despacha.has(k)).slice(0, 1);
  const out: any = {};
  for (const k of clases) out[k] = CONVOY_CAPACIDAD;
  return out;
}
// v2.9.443 — EL CONVOY QUE VUELVE A LA INSTALACIÓN SE RECARGA DE SU ESTIBA. Antes
// se llenaba gratis, infinitas veces: el escalón superior no hacía falta nunca.
// v2.9.444 — ¿Llegó a una instalación propia que despacha (para darlo por vuelto)?
function cercaDeSuInstalacion(cv: any, instalaciones: any[]) {
  return (instalaciones || []).some((x: any) => {
    if (!x || !INSTAL_LOG[x.tipo] || x.bando !== cv.bando || !(INSTAL_LOG[x.tipo].despacha || []).length) return false;
    const pt = puntoInstalacion(x);
    return !!pt && haversineKm([cv.lng, cv.lat], pt) <= REABASTECER_KM;
  });
}
function recargarConvoy(cv: any, instalaciones: any[]) {
  if (!esConvoy(cv) || cv.estado === "fuera_combate") return null;
  const cerca = (instalaciones || []).filter((x: any) => {
    if (!x || !x.tipo || !INSTAL_LOG[x.tipo] || x.bando !== cv.bando) return false;
    const pt = puntoInstalacion(x);
    return pt && haversineKm([cv.lng, cv.lat], pt) <= REABASTECER_KM;
  });
  if (!cerca.length) return null;
  const dan = new Set<string>();
  for (const x of cerca) for (const k of (INSTAL_LOG[x.tipo].despacha || [])) dan.add(k);
  const cap = capacidadConvoy(cv, dan);
  if (!cv.carga) cv.carga = {};
  const partes: string[] = [], secos = new Set<string>();
  for (const [k, tope] of Object.entries(cap) as any) {
    let falta = Number(tope) - cargaDe(cv, k);
    if (falta <= 1e-6) continue;
    const pedido = falta;
    for (const x of cerca) {
      if (!(INSTAL_LOG[x.tipo].despacha || []).includes(k)) continue;
      const hay = Math.max(0, capDe(x) - usadoDe(x));
      if (hay <= 1e-6) { secos.add(INSTAL_LOG[x.tipo].nom); continue; }
      const toma = Math.min(hay, falta);
      if (!x.geojson) x.geojson = {};
      x.geojson.usado = r3(usadoDe(x) + toma);
      x._sucia = true;
      cv.carga[k] = r3(cargaDe(cv, k) + toma);
      falta -= toma;
      if (falta <= 1e-6) break;
    }
    const tomo = pedido - falta;
    if (tomo > 1e-6) partes.push(`${tomo.toFixed(1)} carga(s) de ${k === "AGUA" ? "agua" : (k === "EVAC" ? "evacuación" : "Clase " + k)}`);
  }
  // v2.9.443: y su PROPIO tanque se llena en el puesto que reparte Clase III
  // (también de la estiba). Si no, el convoy se quedaba seco en la quinta vuelta.
  const gastado = Number(cv.combustible_km) || 0;
  if (gastado >= 0.5 && tanqueDe(cv) > 0) {   // v2.9.451: medio km o más (antes salía «⛽ su tanque +0 km»)
    const nec = pesoDe(cv) * faltaTanque(cv);
    for (const x of cerca) {
      const I = INSTAL_LOG[x.tipo];
      if (!I.combustible) continue;
      const hay = Math.max(0, capDe(x) - usadoDe(x));
      if (hay <= 1e-6) continue;
      const toma = Math.min(hay, nec);
      if (!x.geojson) x.geojson = {};
      x.geojson.usado = r3(usadoDe(x) + toma);
      x._sucia = true;
      const km = Math.min(gastado, (toma / pesoDe(cv)) * tanqueDe(cv));
      cv.combustible_km = Number(Math.max(0, gastado - km).toFixed(2));
      partes.push(`⛽ su tanque +${km.toFixed(0)} km`);
      break;
    }
  }
  const nombres = [...new Set(cerca.map((x: any) => INSTAL_LOG[x.tipo].nom))];
  if (!partes.length) {
    if (!secos.size) return null;
    return { texto: `⛔ ${nombreUnidad(cv)} no pudo recargar: ${[...secos].join(" + ")} está AGOTADO — `
      + `hay que reponerlo del escalón superior.` };
  }
  return { texto: `🚚 ${nombreUnidad(cv)} recargó en ${nombres.join(" + ")} — ${partes.join(" · ")}`
    + `${secos.size ? ` (⚠️ ${[...secos].join(" + ")} se quedó sin estiba)` : ""}. Listo para salir.` };
}

function puntoInstalacion(x: any): number[] | null {
  if (!x) return null;
  const g = x.geojson || x;
  if (Array.isArray(g)) return g.length >= 2 ? [Number(g[0]), Number(g[1])] : null;
  if (g && Number.isFinite(Number(g.lng)) && Number.isFinite(Number(g.lat))) return [Number(g.lng), Number(g.lat)];
  if (g && g.type === "Point" && Array.isArray(g.coordinates)) return [Number(g.coordinates[0]), Number(g.coordinates[1])];
  if (g && g.geometry) return puntoInstalacion({ geojson: g.geometry });
  return null;
}
function poderEfectivo(u: any, turno?: any) {
  if (!u || u.estado === "fuera_combate") return 0;
  const p = Math.max(0, Number(u.poder_actual) || 0);
  // v2.9.226: una unidad NEUTRALIZADA pelea a media máquina mientras dura la
  // supresión. No está destruida: está con la cabeza gacha.
  if (u._suprimida) return p * 0.5;
  if (turno != null && u.suprimida_hasta != null && turno <= u.suprimida_hasta) return p * 0.5;
  return p;
}
function bonoDefensa(pt: number[], terreno: any[]) {
  let b = 1.0;
  const clase = claseTerreno(pt, terreno);
  if (clase === "restringido") b = 1.3;
  if (clase === "severo") b = 1.6;
  if (enTerrenoClave(pt, terreno)) b += 0.2;
  return b;
}
// v2.9.223 — ¿PUEDE RESPONDER EL BLANCO? Hasta acá TODO empeño se resolvía
// como un asalto con desgaste mutuo: una batería que tiraba desde 4 km recibía
// bajas del blanco aunque el blanco no llegara ni cerca. Doctrina: si el batido
// no alcanza al tirador, no hay contrabatería y el que tira no paga nada.
// v2.9.443 — EL TIRO SALE JUSTO AL ENTRAR AL ALCANCE (la hora la calcula el cruce en el plano); medido después
// sobre la esfera da unos centímetros más y se juzgaba «corto». Un margen de 2 por mil (16 m a 8 km).
function dentroDeAlcance(d: number, alcance: number) { return d <= alcance * 1.002 + 1e-3; }
function puedeResponder(defensor: any, atacante: any, terreno: any[]) {
  const arma: any = armaDeFuego(defensor, null);
  if (!arma) return { puede: false, arma: null as any, d: 0 };
  const d = haversineKm([defensor.lng, defensor.lat], [atacante.lng, atacante.lat]);
  // v2.9.230 — SIN MUNICIÓN NO HAY CONTRABATERÍA.
  const seco = municionDe(defensor, arma.id) <= 0;
  return { puede: dentroDeAlcance(d, arma.alcance) && !seco, arma, d, seco };
}
function resolverCombate(atacantes: any[], defensor: any, terreno: any[], arma?: any, responde = true) {
  const pA = atacantes.reduce((s, u) => s + poderEfectivo(u), 0);
  const bono = bonoDefensa([defensor.lng, defensor.lat], terreno);
  const pD = poderEfectivo(defensor) * bono;
  if (pA <= 0 || pD <= 0) return { ratio: null, resultado: "sin_combate", bajas: [], desc: "sin poder de combate" };
  const ratio = pA / pD;
  let perdAtac: number, perdDef: number, resultado: string;
  if (ratio >= 3) { resultado = "atacante_decisivo"; perdAtac = 0.10; perdDef = 0.55; }
  else if (ratio >= 1.5) { resultado = "atacante_avanza"; perdAtac = 0.20; perdDef = 0.40; }
  else if (ratio >= 1) { resultado = "combate_indeciso"; perdAtac = 0.30; perdDef = 0.30; }
  else if (ratio >= 1 / 1.5) { resultado = "defensor_resiste"; perdAtac = 0.40; perdDef = 0.20; }
  else { resultado = "atacante_rechazado"; perdAtac = 0.50; perdDef = 0.10; }
  const aplicar = (u: any, perd: number) => {
    const nuevo = Math.max(0, poderEfectivo(u) * (1 - perd));
    // v2.9.223: si NO perdió nada, no se le toca el estado (una unidad parada
    // justo en el umbral pasaba a «fuera de combate» sin recibir un solo tiro).
    if (perd <= 0) return { id: u.id, poderNuevo: Number(nuevo.toFixed(2)), estado: u.estado || "activa" };
    const estado = nuevo <= u.poder_max * 0.2 ? "fuera_combate" : (nuevo <= u.poder_max * 0.6 ? "desgastada" : "activa");
    return { id: u.id, poderNuevo: Number(nuevo.toFixed(2)), estado };
  };
  const bajas = [...atacantes.map((u) => aplicar(u, responde ? perdAtac : 0)), aplicar(defensor, perdDef)];
  // v2.9.217: si el fuego fue deliberado, la bitácora dice CON QUÉ se batió.
  return { ratio: Number(ratio.toFixed(2)), resultado, bajas, desc: `${arma ? arma.nom + " — " : ""}Relación ${ratio.toFixed(1)}:1 (terreno×${bono.toFixed(1)}) → ${resultado.replace(/_/g, " ")}` };
}
function alcanceObs(u: any, terreno: any[]) {
  const clase = claseTerreno([u.lng, u.lat], terreno);
  let r = (Number(u.obs_km) || 4) * (OBS[clase] ?? 1);
  if (enTerrenoClave([u.lng, u.lat], terreno)) r *= 1.5;
  return r;
}
// v2.9.217 — EL QUE DISPARA SE DELATA. `disparadoras` son los ids de las
// unidades que abrieron fuego este turno: quedan localizadas por el enemigo
// aunque nadie las tuviera a la vista. Vale igual si el tiro dio o cayó corto
// — de hecho el tiro perdido es el peor negocio: no hace daño y encima te ubica.
function detectar(unidades: any[], terreno: any[], disparadoras?: any) {
  const vivas = unidades.filter((u) => poderEfectivo(u) > 0);
  const porBando: any = { rojo: [], azul: [] };
  for (const u of vivas) (porBando[u.bando] || (porBando[u.bando] = [])).push(u);
  const det: any = { rojo: new Set(), azul: new Set() };
  for (const obs of vivas) {
    const enemigoBando = obs.bando === "rojo" ? "azul" : "rojo";
    const alc = alcanceObs(obs, terreno);
    for (const en of (porBando[enemigoBando] || [])) {
      // Observación propia: círculo. Dron: cono largo hacia donde lo apuntaron.
      if (haversineKm([obs.lng, obs.lat], [en.lng, en.lat]) <= alc) { det[obs.bando].add(en.id); continue; }
      if (enConoDron(obs, [en.lng, en.lat])) det[obs.bando].add(en.id);
    }
  }
  // El fogonazo, el estampido y el cráter ubican al tirador.
  const delataron = disparadoras instanceof Set ? disparadoras : new Set(disparadoras || []);
  for (const u of vivas) {
    if (!delataron.has(u.id)) continue;
    const enemigo = u.bando === "rojo" ? "azul" : "rojo";
    (det[enemigo] || (det[enemigo] = new Set())).add(u.id);
  }
  return det;
}
// ============================================================
// v2.9.443 — EL PODER DEL APOYO, Y QUIÉN EMPIEZA UN COMBATE.
// Sergio: «moví vehículos de abastecimiento y ellos estaban disparando como si
// fueran división… eso no es posible».
// Medido en «ZAPATO II»: el poder salía SÓLO del escalón (una compañía logística
// valía lo mismo que una de infantería), el convoy tenía 15 (más que un
// batallón) y en el combate de encuentro el más fuerte «abría fuego». En el
// turno 9 el convoy de víveres Cnv-I-1 abrió fuego sobre el PEL. REC. BLIN. rojo
// con relación 24,3:1. Y el PC del CE-1 peleaba con 150, como un cuerpo.
// Ahora:
//   · el servicio de combate (logística, sanidad, intendencia, transporte,
//     mantenimiento, material bélico, veterinaria) pelea con el 15 % del poder de
//     su escalón; comunicaciones con el 25 %; el PC con su seguridad; el convoy
//     como una sección;
//   · ninguno de ellos EMPIEZA un combate: si se topa con una fuerza de combate,
//     el que abre fuego es la fuerza de combate; dos de apoyo no se pelean.
// Las partidas importadas antes conservan el poder viejo del escalón: el motor
// lo corrige solo, una vez, y se lo dice al árbitro. Lo que el árbitro puso a
// mano (un valor que no es el del escalón) no se toca.
// ============================================================
const PODER_ESCALON: any = { equipo: 0.5, escuadra: 1, seccion: 2, compania: 4, batallon: 12, regimiento: 20,
  brigada: 40, division: 80, cuerpo: 150, ejercito: 300 };
const ESC_ORDEN = ["equipo", "escuadra", "seccion", "compania", "batallon", "regimiento", "brigada", "division", "cuerpo", "ejercito"];
const ARMAS_SERVICIO = ["logistica", "sanidad", "intendencia", "transporte", "mantenimiento", "materialbelico", "veterinaria"];
const FACTOR_SERVICIO = 0.15;
const FACTOR_COMUNICACIONES = 0.25;
function esPC(u: any) { const m = mediosDe(u); return !!u && (u.arma === "ninguna" || !!(m && m.pc)); }
function esNoCombatiente(u: any) {
  return !!u && (esConvoy(u) || esPC(u) || ARMAS_SERVICIO.includes(u.arma) || u.arma === "comunicaciones");
}
function poderDeReferencia(u: any) {
  if (esConvoy(u)) return CONVOY_PODER;
  const esc = PODER_ESCALON[u.escalon] != null ? u.escalon : "batallon";
  const base = PODER_ESCALON[esc];
  if (esPC(u)) return ESC_ORDEN.indexOf(esc) >= ESC_ORDEN.indexOf("division") ? PODER_ESCALON.compania : PODER_ESCALON.seccion;
  if (ARMAS_SERVICIO.includes(u.arma)) return Math.round(base * FACTOR_SERVICIO * 10) / 10;
  if (u.arma === "comunicaciones") return Math.round(base * FACTOR_COMUNICACIONES * 10) / 10;
  return base;
}
function poderViejo(u: any) {
  if (esConvoy(u)) return CONVOY_PODER_VIEJO;
  return PODER_ESCALON[PODER_ESCALON[u.escalon] != null ? u.escalon : "batallon"];
}
function normalizarPoderes(U: Map<any, any>) {
  const cambios: any[] = [];
  for (const u of U.values()) {
    if (!esNoCombatiente(u)) continue;
    const max = Number(u.poder_max) || 0;
    if (!(max > 0)) continue;
    const ref = poderDeReferencia(u);
    if (ref >= max - 1e-9) continue;                       // sólo baja
    if (Math.abs(max - poderViejo(u)) > 1e-6) continue;    // lo que puso el árbitro a mano, se respeta
    const f = ref / max;
    u.poder_max = ref;
    u.poder_actual = Number(((Number(u.poder_actual) || 0) * f).toFixed(2));
    cambios.push({ u, de: max, a: ref });
  }
  return cambios;
}
// ============================================================
// v2.9.443 — CON QUÉ SE PELEA DE CERCA.
// En el combate de encuentro (dos que se topan a 3 km o menos) disparan las
// armas de tiro directo y los morteros orgánicos; la artillería (obuses,
// lanzacohetes) tira sólo cuando se le ordena fuego. Medido en «ZAPATO II»: la
// DIV MEC-2 combatió seis veces a 0,7–2,7 km gastando munición de Obús 155 —en
// el turno 9 «respondió con Obús 155» a un enemigo que estaba a 700 m— y le
// queda 0,5 de 4 UF de artillería. Ahora cada sistema que pelea gasta lo suyo.
// ============================================================
function esDeCerca(a: any) { return !!a && !a.ingenieria && a.alcance > 0 && (!a.indirecto || /^mortero/.test(a.id)); }
function armasCercanas(u: any, conMunicion = true) {
  return armamentoDe(u).filter((a: any) => esDeCerca(a) && (!conMunicion || municionDe(u, a.id) > 0));
}
// ============================================================
// v2.9.443 — EL TURNO SE RESUELVE EN EL TIEMPO.
// Sergio: «hay veces que las unidades disparan hacia la posición antes de que
// lleguen… hay veces que no se sincroniza».
// Era así: el motor movía a TODOS hasta el final y recién después resolvía el
// fuego. Sin hora en la matriz, el tirador quedaba en su punto de LLEGADA y el
// blanco en un punto de la MITAD de su marcha; el choque de encuentro buscaba el
// contacto contando puntos de la ruta, no horas; y los dos que se topaban
// seguían hasta su destino, como si se atravesaran. La película, que sólo sabía
// esperar a los que terminaban en ese lugar, tiraba los demás disparos en el
// segundo cero: al vacío, antes de que nadie llegara.
// Ahora cada marcha es una TRAYECTORIA con la hora de cada punto, y el turno se
// juega en orden cronológico:
//   · dos enemigos que quedan a 3 km o menos ENTRAN EN CONTACTO a esa hora, se
//     DETIENEN ahí y se trenzan ahí (los dos de apoyo no se trenzan; el que
//     rompe contacto no se detiene);
//   · el empeño ordenado se tira a la hora en que el blanco entra al alcance (o a
//     la H+ de la matriz), con los dos donde estaban a esa hora;
//   · la concentración sobre un punto cae a su H+, o cuando el tirador termina
//     de ponerse en posición (H+0 si no se mueve);
//   · la unidad que queda fuera de combate a una hora se detiene ahí y no hace
//     nada más; la mina salta a la hora en que la columna llega al campo.
// Todo impacto lleva su hora: la película dispara cuando los dos están ahí.
// ============================================================
function trQuieta(u: any) {
  const p = [Number(u.lng), Number(u.lat)];
  return { pts: [p], tt: [0], cons: [0], bat: [0], tStop: Infinity, mueve: false, caja: [p[0], p[1], p[0], p[1]] };
}
function trDeMarcha(r: any, inicio: number) {
  const pts = (r.ruta && r.ruta.length) ? r.ruta : [[r.lng, r.lat]];
  const n = pts.length;
  const tt = (r.tiempos && r.tiempos.length === n) ? r.tiempos.map((t: number) => t + inicio)
    : pts.map((_: any, i: number) => inicio + (n > 1 ? (i / (n - 1)) * (Number(r.horasUsadas) || 0) : 0));
  const cons = (r.cons && r.cons.length === n) ? r.cons : pts.map((_: any, i: number) => n > 1 ? (i / (n - 1)) * (Number(r.consumoKm) || 0) : 0);
  const bat = (r.batido && r.batido.length === n) ? r.batido : pts.map((_: any, i: number) => n > 1 ? (i / (n - 1)) * (Number(r.kmBatido) || 0) : 0);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  return { pts, tt, cons, bat, tStop: Infinity, mueve: n > 1, caja: [x0, y0, x1, y1], inicio };
}
function trFin(tr: any) { return Math.min(tr.tStop, tr.tt[tr.tt.length - 1]); }
function trIdx(tt: number[], h: number) {
  let lo = 0, hi = tt.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tt[m] <= h) lo = m; else hi = m; }
  return lo;
}
function trPos(tr: any, h: number) {
  const hh = Math.min(h, tr.tStop), tt = tr.tt, p = tr.pts;
  if (tt.length < 2 || hh <= tt[0]) return p[0];
  if (hh >= tt[tt.length - 1]) return p[p.length - 1];
  const i = trIdx(tt, hh), t0 = tt[i], t1 = tt[i + 1];
  const f = t1 > t0 ? (hh - t0) / (t1 - t0) : 0;
  return [p[i][0] + (p[i + 1][0] - p[i][0]) * f, p[i][1] + (p[i + 1][1] - p[i][1]) * f];
}
function trValor(tr: any, arr: number[], h: number) {
  const hh = Math.min(h, tr.tStop), tt = tr.tt;
  if (tt.length < 2 || hh <= tt[0]) return arr[0] || 0;
  if (hh >= tt[tt.length - 1]) return arr[arr.length - 1] || 0;
  const i = trIdx(tt, hh), t0 = tt[i], t1 = tt[i + 1];
  const f = t1 > t0 ? (hh - t0) / (t1 - t0) : 0;
  return (arr[i] || 0) + ((arr[i + 1] || 0) - (arr[i] || 0)) * f;
}
// Los puntos de la trayectoria hasta la hora h (para la traza y la distancia).
function trHasta(tr: any, h: number) {
  const hh = Math.min(h, trFin(tr));
  const pts: number[][] = [], tt: number[] = [];
  for (let i = 0; i < tr.pts.length; i++) {
    if (tr.tt[i] > hh + 1e-9) break;
    pts.push(tr.pts[i]); tt.push(tr.tt[i]);
  }
  if (!pts.length) { pts.push(tr.pts[0]); tt.push(tr.tt[0]); }
  if (tt[tt.length - 1] < hh - 1e-9) { pts.push(trPos(tr, hh)); tt.push(hh); }
  return { pts, tt };
}
function largoKm(pts: number[][]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]);
  return d;
}
// Las horas en que alguna de las dos trayectorias cambia de tramo (entre dos de
// ellas, las dos van en línea recta y el contacto se calcula exacto).
function trTiempos(a: any, b: any, h0: number, h1: number) {
  const fa = Math.min(h1, trFin(a)), fb = Math.min(h1, trFin(b));
  const out: number[] = [h0, h1];
  for (const t of a.tt) if (t > h0 && t < h1 && t <= fa) out.push(t);
  for (const t of b.tt) if (t > h0 && t < h1 && t <= fb) out.push(t);
  if (fa > h0 && fa < h1) out.push(fa);
  if (fb > h0 && fb < h1) out.push(fb);
  out.sort((x, y) => x - y);
  const u: number[] = [];
  for (const t of out) if (!u.length || t - u[u.length - 1] > 1e-9) u.push(t);
  return u;
}
function cajasCerca(a: any, b: any, r: number) {
  const dLat = r / 110.57, dLng = dLat / Math.max(0.2, Math.cos(rad((a.caja[1] + b.caja[3]) / 2)));
  return !(a.caja[2] + dLng < b.caja[0] || b.caja[2] + dLng < a.caja[0]
    || a.caja[3] + dLat < b.caja[1] || b.caja[3] + dLat < a.caja[1]);
}
// En un tramo en el que los dos van en línea recta: ¿en qué fracción quedan a r?
function cruceRadio(a0: number[], b0: number[], a1: number[], b1: number[], r: number) {
  const kx = 111.32 * Math.cos(rad(a0[1])), ky = 110.57;
  const d0x = (a0[0] - b0[0]) * kx, d0y = (a0[1] - b0[1]) * ky;
  const d1x = (a1[0] - b1[0]) * kx, d1y = (a1[1] - b1[1]) * ky;
  const vx = d1x - d0x, vy = d1y - d0y;
  const A = vx * vx + vy * vy, B = 2 * (d0x * vx + d0y * vy), C = d0x * d0x + d0y * d0y - r * r;
  if (C <= 0) return 0;
  if (A < 1e-12) return null;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return null;
  const s = (-B - Math.sqrt(disc)) / (2 * A);
  return s >= 0 && s <= 1 ? s : null;
}
// La primera hora (≥ h0) en que a y b quedan a r km o menos. null si nunca.
function trPrimerAlcance(a: any, b: any, r: number, h0: number, h1: number) {
  if (h1 < h0 - 1e-12) return null;
  if (!cajasCerca(a, b, r)) return null;
  const ts = trTiempos(a, b, h0, h1);
  let pa = trPos(a, ts[0]), pb = trPos(b, ts[0]);
  if (haversineKm(pa, pb) <= r + 1e-9) return ts[0];
  for (let k = 1; k < ts.length; k++) {
    const qa = trPos(a, ts[k]), qb = trPos(b, ts[k]);
    const s = cruceRadio(pa, pb, qa, qb, r);
    if (s != null) return ts[k - 1] + (ts[k] - ts[k - 1]) * s;
    pa = qa; pb = qb;
  }
  return null;
}
// La hora en que a y b pasaron más cerca (para el tiro que nunca tuvo alcance).
function trMasCerca(a: any, b: any, h0: number, h1: number) {
  const ts = trTiempos(a, b, h0, Math.max(h0, h1));
  let pa = trPos(a, ts[0]), pb = trPos(b, ts[0]);
  let mejor = { h: ts[0], d: haversineKm(pa, pb) };
  for (let k = 1; k < ts.length; k++) {
    const qa = trPos(a, ts[k]), qb = trPos(b, ts[k]);
    const kx = 111.32 * Math.cos(rad(pa[1])), ky = 110.57;
    const d0x = (pa[0] - pb[0]) * kx, d0y = (pa[1] - pb[1]) * ky;
    const vx = (qa[0] - qb[0]) * kx - d0x, vy = (qa[1] - qb[1]) * ky - d0y;
    const A = vx * vx + vy * vy;
    const s = A > 1e-12 ? Math.max(0, Math.min(1, -(d0x * vx + d0y * vy) / A)) : 1;
    const h = ts[k - 1] + (ts[k] - ts[k - 1]) * s;
    const d = haversineKm(trPos(a, h), trPos(b, h));
    if (d < mejor.d) mejor = { h, d };
    pa = qa; pb = qb;
  }
  return mejor;
}
// Ralea la traza para la película, conservando la hora de cada punto.
function ralearConTiempos(pts: number[][], tt: number[], max = 60) {
  if (pts.length <= max) return { ruta: pts, tt };
  const paso = (pts.length - 1) / (max - 1);
  const ruta: number[][] = [], t2: number[] = [];
  for (let i = 0; i < max; i++) { const k = Math.round(i * paso); ruta.push(pts[k]); t2.push(tt[k]); }
  return { ruta, tt: t2 };
}
// ============================================================
// v2.9.443 — LA RED DE CAMINOS, PARA EL CONVOY QUE VA SOLO.
// El convoy agregado a una unidad la sigue, y el convoy vacío vuelve a su
// instalación, SIN que el G-4 le marque la ruta punto por punto: va por la red
// vial de la carta (las carreteras y caminos de verdad; no sendas) por el
// camino más corto. Los tramos que el calco dejó sueltos por unos metros se
// sueldan. Sin red (una carta sin caminos), va en línea recta y el motor lo
// frena donde corresponda — como a cualquiera.
// ============================================================
const _grafos = new WeakMap<any, any>();
function grafoVial(terreno: any[]) {
  const arr = terreno || [];
  let g = _grafos.get(arr);
  if (g) return g;
  const nodos: number[][] = [], ady: number[][] = [], pes: number[][] = [];
  const porClave = new Map<string, number>();
  const nodo = (p: number[]) => {
    const k = Math.round(Number(p[0]) * 1e5) + "," + Math.round(Number(p[1]) * 1e5);
    let i = porClave.get(k);
    if (i == null) { i = nodos.length; nodos.push([Number(p[0]), Number(p[1])]); ady.push([]); pes.push([]); porClave.set(k, i); }
    return i;
  };
  const unir = (i: number, j: number) => {
    if (i === j) return;
    const d = haversineKm(nodos[i], nodos[j]);
    ady[i].push(j); pes[i].push(d); ady[j].push(i); pes[j].push(d);
  };
  const extremos: number[] = [];
  for (const t of arr) {
    if (!t || t.tipo !== "via" || claseVia(t) !== "camino") continue;
    for (const l of lineasDe(t.geojson)) {
      let prev = -1, pAnt: any = null;
      for (const p of l) {
        if (!Array.isArray(p)) continue;
        // Los tramos largos se parten cada 500 m: así cualquier punto del camino
        // tiene un nodo cerca para entrar o salir de la red.
        if (pAnt) {
          const n = Math.floor(haversineKm(pAnt, p) / 0.5);
          for (let k = 1; k <= n; k++) {
            const f = k / (n + 1);
            const i = nodo([pAnt[0] + (p[0] - pAnt[0]) * f, pAnt[1] + (p[1] - pAnt[1]) * f]);
            if (prev >= 0) unir(prev, i);
            prev = i;
          }
        }
        const i = nodo(p);
        if (prev >= 0) unir(prev, i);
        prev = i; pAnt = p;
      }
      if (l.length >= 2) extremos.push(nodo(l[0]), nodo(l[l.length - 1]));
    }
  }
  const celdas = new Map<number, number[]>();
  for (let i = 0; i < nodos.length; i++) {
    const k = claveCelda(Math.floor(nodos[i][0] / CELDA_GRADOS), Math.floor(nodos[i][1] / CELDA_GRADOS));
    let c = celdas.get(k);
    if (!c) { c = []; celdas.set(k, c); }
    c.push(i);
  }
  const cercano = (p: number[], maxKm: number, excepto = -1) => {
    const r = Math.ceil(maxKm) + 1;
    const cx = Math.floor(p[0] / CELDA_GRADOS), cy = Math.floor(p[1] / CELDA_GRADOS);
    let mejor = -1, dm = maxKm;
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const c = celdas.get(claveCelda(cx + dx, cy + dy));
        if (!c) continue;
        for (const i of c) {
          if (i === excepto) continue;
          const d = haversineKm(p, nodos[i]);
          if (d < dm) { dm = d; mejor = i; }
        }
      }
    }
    return mejor >= 0 ? mejor : null;
  };
  for (const e of extremos) {
    if (ady[e].length > 1) continue;
    const c = cercano(nodos[e], 0.03, e);
    if (c != null && !ady[e].includes(c)) unir(e, c);
  }
  g = { nodos, ady, pes, cercano };
  _grafos.set(arr, g);
  return g;
}
// El camino más corto por la red vial (A*): [entrada a la red, …, salida, hasta].
function rutaPorCaminos(terreno: any[], desde: number[], hasta: number[], maxAcceso = 3) {
  const g = grafoVial(terreno);
  if (!g.nodos.length) return null;
  const a = g.cercano(desde, maxAcceso), b = g.cercano(hasta, maxAcceso);
  if (a == null || b == null) return null;
  if (a === b) return [g.nodos[a], hasta];
  const n = g.nodos.length;
  const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1);
  const cerrado = new Uint8Array(n);
  const heap: number[][] = [];
  const push = (f: number, i: number) => {
    heap.push([f, i]);
    let k = heap.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop() as number[];
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1, r = l + 1;
        let m = k;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]]; k = m;
      }
    }
    return top;
  };
  dist[a] = 0;
  push(haversineKm(g.nodos[a], g.nodos[b]), a);
  let it = 0;
  while (heap.length && ++it < 500000) {
    const [, i] = pop();
    if (cerrado[i]) continue;
    if (i === b) break;
    cerrado[i] = 1;
    const ad = g.ady[i], ps = g.pes[i];
    for (let k = 0; k < ad.length; k++) {
      const j = ad[k];
      if (cerrado[j]) continue;
      const nd = dist[i] + ps[k];
      if (nd < dist[j]) { dist[j] = nd; prev[j] = i; push(nd + haversineKm(g.nodos[j], g.nodos[b]), j); }
    }
  }
  if (!Number.isFinite(dist[b])) return null;
  const camino: number[][] = [];
  for (let i = b; i >= 0; i = prev[i]) { camino.push(g.nodos[i]); if (i === a) break; }
  camino.reverse();
  camino.push(hasta);
  return camino;
}
// ============================================================
// v2.9.444 — EL CONVOY VA POR EL CAMINO HASTA DONDE EL CAMINO LLEGA.
// Sergio: «muchas veces no habrá camino a la unidad apoyada, por lo tanto se debe
// considerar que llegue lo más cerca posible, o sea que pare en el camino».
// `rutaConvoy` entra a la red a lo más CONVOY_FUERA_RUTA_KM de donde está (la
// salida de su instalación) y termina en el punto del camino ALCANZABLE más cercano
// a `hasta` — aunque la unidad esté lejos de toda ruta. Cuánto queda entre ese
// punto y la unidad (`dParada`) decide si hay abastecimiento: a más de
// REABASTECER_KM, no.
// ============================================================
// El pie de la perpendicular de `p` sobre el tramo a–b (plano local, en grados
// corregidos por la latitud: sobra para tramos de 500 m).
function pieEnTramo(p: number[], a: number[], b: number[]) {
  const k = Math.cos((Number(p[1]) * Math.PI) / 180);
  const ax = a[0] * k, ay = a[1], bx = b[0] * k, by = b[1], px = p[0] * k, py = p[1];
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  const t = L2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L2)) : 0;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function rutaConvoy(terreno: any[], desde: number[], hasta: number[]) {
  const g = grafoVial(terreno);
  const nada = (motivo: string) => ({ sinCamino: true, motivo, ruta: [] as number[][], parada: desde,
    dParada: haversineKm(desde, hasta), km: 0, acceso: 0 });
  if (!g.nodos.length) return nada("la carta no tiene caminos");
  const a = g.cercano(desde, CONVOY_FUERA_RUTA_KM);
  if (a == null) return nada(`no hay camino a menos de ${CONVOY_FUERA_RUTA_KM} km`);
  const n = g.nodos.length;
  const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1);
  const cerrado = new Uint8Array(n);
  const heap: number[][] = [];
  const push = (f: number, i: number) => {
    heap.push([f, i]);
    let k = heap.length - 1;
    while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; }
  };
  const pop = () => {
    const top = heap[0], last = heap.pop() as number[];
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1, r = l + 1;
        let m = k;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]]; k = m;
      }
    }
    return top;
  };
  // Dijkstra entero desde la entrada: el mejor nodo es el alcanzable más cercano a
  // `hasta` (a igual distancia, el de camino más corto).
  dist[a] = 0; push(0, a);
  let mejor = a, dMejor = haversineKm(g.nodos[a], hasta), it = 0;
  while (heap.length && ++it < 2000000) {
    const [, i] = pop();
    if (cerrado[i]) continue;
    cerrado[i] = 1;
    const d = haversineKm(g.nodos[i], hasta);
    if (d < dMejor - 1e-9 || (Math.abs(d - dMejor) <= 1e-9 && dist[i] < dist[mejor])) { mejor = i; dMejor = d; }
    const ad = g.ady[i], ps = g.pes[i];
    for (let k = 0; k < ad.length; k++) {
      const j = ad[k];
      if (cerrado[j]) continue;
      const nd = dist[i] + ps[k];
      if (nd < dist[j]) { dist[j] = nd; prev[j] = i; push(nd, j); }
    }
  }
  const idx: number[] = [];
  for (let i = mejor; i >= 0; i = prev[i]) { idx.push(i); if (i === a) break; }
  idx.reverse();
  const ruta = idx.map((i) => g.nodos[i]);
  // El punto del camino más cercano: el pie sobre los tramos que tocan al mejor nodo.
  let fin = g.nodos[mejor], dFin = dMejor;
  for (const j of g.ady[mejor]) {
    const q = pieEnTramo(hasta, g.nodos[mejor], g.nodos[j]);
    const dq = haversineKm(q, hasta);
    if (dq < dFin - 1e-6) { dFin = dq; fin = q; }
  }
  if (haversineKm(fin, ruta[ruta.length - 1]) > 0.005) {
    // Si el pie cae sobre el tramo por el que llegó, se corta ahí (no va y vuelve).
    const ant = ruta.length > 1 ? ruta[ruta.length - 2] : null;
    if (ant && haversineKm(pieEnTramo(fin, ant, ruta[ruta.length - 1]), fin) < 0.005) ruta[ruta.length - 1] = fin;
    else ruta.push(fin);
  }
  let km = 0;
  for (let i = 1; i < ruta.length; i++) km += haversineKm(ruta[i - 1], ruta[i]);
  return { sinCamino: false, motivo: "", ruta, parada: ruta[ruta.length - 1], dParada: dFin, km,
    acceso: haversineKm(desde, g.nodos[a]) };
}
// La ruta del G-4 (sus puntos de paso), pasada al camino: cada punto se lleva al
// punto de la red más cercano que se pueda alcanzar desde el anterior.
function rutaConvoyPorPuntos(terreno: any[], desde: number[], puntos: number[][]) {
  const pts = (puntos || []).filter((p: any) => Array.isArray(p) && p.length >= 2);
  let cur = desde, ruta: number[][] = [], km = 0, acceso = 0, ult: any = null;
  for (let i = 0; i < pts.length; i++) {
    const r = rutaConvoy(terreno, cur, pts[i]);
    if (r.sinCamino) {
      if (i === 0) return r;
      break;
    }
    if (i === 0) acceso = r.acceso;
    for (const p of r.ruta) if (!ruta.length || haversineKm(ruta[ruta.length - 1], p) > 1e-4) ruta.push(p);
    km += r.km; cur = r.parada; ult = r;
  }
  if (!ult) return rutaConvoy(terreno, desde, desde);
  return { sinCamino: false, motivo: "", ruta, parada: cur, dParada: ult.dParada, km, acceso };
}
// v2.9.444 — LA DESCARGA LLEVA TIEMPO (horas por CARGA DE BATALLÓN, de cada clase).
// ⚠️ Cifras de referencia propuestas el 03-11-2026, a validar con las tablas de la
// Escuela: Cl III 1 h, Cl V 1 h 30, Cl I y agua 30 min, evacuación 30 min.
const HORAS_DESCARGA: any = { III: 1, V: 1.5, I: 0.5, AGUA: 0.5, EVAC: 0.5, REEMP: 0.5 };   // EVAC: 20 heridos · REEMP: 50 hombres
const ESPERA_MIN_H = 0.5;   // aunque la unidad no venga, el convoy espera lo mínimo en el punto
// Cuánto tarda en descargar lo que necesita ESA unidad (con lo que el convoy lleva).
function horasDescarga(cv: any, u: any) {
  if (!cv || !u) return ESPERA_MIN_H;
  let h = 0;
  // v2.9.448: la ambulancia tarda lo que lleva cargar los heridos de esa unidad (lo que entre).
  if (cargaDe(cv, "EVAC") > 0) h += Math.min(herDe(u), lugarAmbulancia(cv)) / HERIDOS_POR_CARGA * HORAS_DESCARGA.EVAC;
  for (const k of ["III", "V", "I", "REEMP"]) {
    const hay = k === "I" ? cargaDe(cv, "I") + cargaDe(cv, "AGUA") : cargaDe(cv, k);
    if (hay <= 1e-6) continue;
    h += Math.min(hay, necesidad(u, k, 1)) * HORAS_DESCARGA[k];
  }
  return Math.max(ESPERA_MIN_H, h);
}
// Recorta la ruta para que termine a `km` del objetivo: el convoy se queda
// DETRÁS de la unidad que apoya, no encima de ella.
function rutaHastaCerca(ruta: number[][], objetivo: number[], km: number) {
  for (let i = 0; i < ruta.length; i++) {
    if (haversineKm(ruta[i], objetivo) > km) continue;
    if (i === 0) return [];
    const a = ruta[i - 1], b = ruta[i];
    let lo = 0, hi = 1;
    for (let k = 0; k < 30; k++) {
      const m = (lo + hi) / 2;
      if (haversineKm([a[0] + (b[0] - a[0]) * m, a[1] + (b[1] - a[1]) * m], objetivo) > km) lo = m; else hi = m;
    }
    return [...ruta.slice(0, i), [a[0] + (b[0] - a[0]) * lo, a[1] + (b[1] - a[1]) * lo]];
  }
  return ruta;
}
// ============================================================
// v2.9.443 — LO QUE SIGUE SOLO (sin pisar nunca una orden del turno).
//   1) LA MARCHA QUE NO TERMINÓ SIGUE EL TURNO QUE VIENE, y la sigue el SERVIDOR.
//      La bitácora lo prometía («sigue la marcha sola, no hay que darle la orden
//      otra vez»), pero lo hacía sólo la pantalla que apretó «Jugar turno»: en
//      la del otro bando, o al recargar, la marcha se cortaba. Para pararla:
//      ⏹ Alto (orden «defender»).
//   2) EL CONVOY AGREGADO a una unidad («🤝 Apoyar a…») la sigue: si quedó a más
//      de 2 km, va por los caminos hasta quedar 1,5 km detrás de ella.
//   3) EL CONVOY VACÍO vuelve solo, por los caminos, a la instalación de la que
//      salió; ahí recarga de la estiba y, si estaba agregado, vuelve a la unidad.
// v2.9.444 — EL CONVOY, SIEMPRE POR EL CAMINO (`rutaConvoy`):
//   2) «🚚 ABASTECER A…» (la orden `apoyar`) va al punto del camino más cercano a
//      la unidad, PARA y descarga (`fase: "descarga"`); terminada, vuelve.
//   3) Vacío o con la descarga terminada (`fase: "vuelta"`), vuelve por el camino a
//      su instalación y queda ahí, recargado, esperando orden del G-4.
//   4) La marcha del G-4 que no terminó sigue por el camino hasta su destino.
// Sin camino a menos de CONVOY_FUERA_RUTA_KM no sale: se avisa una vez por turno.
// ============================================================
const APOYO_KM = 1.5;
function ordenesAutomaticas(estado: any, U: Map<any, any>, instal: any[], terreno: any[], ordenes: any[], avisos: any[] = []) {
  const ya = new Set((ordenes || []).map((o: any) => o.unidad_id));
  const out: any[] = [];
  const prev = new Map((estado.trazasPrevias || []).map((t: any) => [t.id, t]));
  for (const o of estado.ordenesPrevias || []) {
    if (!o || ya.has(o.unidad_id)) continue;
    if (o.tipo !== "mover" && o.tipo !== "replegar") continue;
    const u: any = U.get(o.unidad_id);
    if (!u || poderEfectivo(u) <= 0) continue;
    if (esConvoy(u)) continue;   // v2.9.444: el convoy sigue por el camino (más abajo), no por su traza vieja
    const t: any = prev.get(o.unidad_id);
    if (!t || t.llego || t.detenida || t.minado || t.contacto) continue;
    const ruta = Array.isArray(o.ruta) && o.ruta.length ? o.ruta : (o.destino_lng != null ? [[o.destino_lng, o.destino_lat]] : []);
    const resto = ruta.slice(Number(t.consumidos) || 0);
    if (!resto.length) continue;
    const fin = resto[resto.length - 1];
    out.push({ id: null, unidad_id: u.id, bando: u.bando, tipo: o.tipo, destino_lng: fin[0], destino_lat: fin[1],
      ruta: resto, tarea: o.tarea || null, proposito: o.proposito || null, auto: "sigue" });
    ya.add(u.id);
  }
  const avisar = (cv: any, texto: string) => {
    if (cv.carga && cv.carga.avisado === estado.turno) return;
    cv.carga = { ...(cv.carga || {}), avisado: estado.turno };
    avisos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng, descripcion: texto, bandos_visibles: [cv.bando] });
  };
  const marchar = (cv: any, r: any, extra: any) => {
    const fin = r.parada;
    out.push(Object.assign({ id: null, unidad_id: cv.id, bando: cv.bando, tipo: "mover", destino_lng: fin[0], destino_lat: fin[1],
      ruta: r.ruta }, extra));
    ya.add(cv.id);
  };
  for (const cv of U.values()) {
    if (!esConvoy(cv) || ya.has(cv.id) || poderEfectivo(cv) <= 0) continue;
    const carga = cv.carga || {};
    const aqui = [Number(cv.lng), Number(cv.lat)];
    if (carga.fase === "descarga") continue;   // parado en el punto, descargando
    // VACÍO, o TERMINÓ SU DESCARGA: vuelve por el camino a su instalación.
    if (cargaTotal(cv) <= 1e-6 || carga.fase === "vuelta") {
      const propias = (instal || []).filter((x: any) => x && x.bando === cv.bando && INSTAL_LOG[x.tipo]
        && (INSTAL_LOG[x.tipo].despacha || []).length && puntoInstalacion(x));
      let ori = propias.find((x: any) => carga.origen != null && String(x.id) === String(carga.origen));
      if (!ori) ori = propias.slice().sort((a: any, b: any) =>
        haversineKm(aqui, puntoInstalacion(a) as number[]) - haversineKm(aqui, puntoInstalacion(b) as number[]))[0];
      if (!ori) continue;
      const p = puntoInstalacion(ori) as number[];
      if (haversineKm(aqui, p) <= REABASTECER_KM - 0.5) continue;   // ya está en el puesto: recarga al final del turno
      const r = rutaConvoy(terreno, aqui, p);
      if (r.sinCamino) { avisar(cv, `⛔ ${nombreUnidad(cv)} no puede volver: ${r.motivo}. El convoy no anda campo traviesa.`); continue; }
      if (haversineKm(aqui, r.parada) < 0.05) {
        avisar(cv, `⛔ ${nombreUnidad(cv)} no encuentra camino hasta ${INSTAL_LOG[ori.tipo].nom}: queda a ${r.dParada.toFixed(1)} km.`);
        continue;
      }
      marchar(cv, r, { auto: "volver", hacia: INSTAL_LOG[ori.tipo].nom });
      continue;
    }
    // «🚚 ABASTECER A…»: al punto del camino más cercano a la unidad (aunque se mueva).
    if (carga.apoya != null) {
      const x: any = U.get(carga.apoya);
      if (!x || x.bando !== cv.bando || poderEfectivo(x) <= 0) {
        cv.carga = { ...carga, apoya: null, fase: "vuelta" };
        avisar(cv, `↩️ ${nombreUnidad(cv)}: la unidad que iba a abastecer ya no está. Vuelve a su instalación.`);
        continue;
      }
      const r = rutaConvoy(terreno, aqui, [Number(x.lng), Number(x.lat)]);
      if (r.sinCamino) { avisar(cv, `⛔ ${nombreUnidad(cv)} no sale: ${r.motivo}. El convoy no anda campo traviesa.`); continue; }
      if (haversineKm(aqui, r.parada) <= 0.3) {
        // Ya está en el punto: descarga desde H+0.
        cv.carga = { ...carga, fase: "descarga", llegoH: 0, resta: horasDescarga(cv, x), dParada: r.dParada, entrego: 0 };
        continue;
      }
      marchar(cv, r, { auto: "apoyar", apoya: x.id, dParada: r.dParada });
      continue;
    }
    // La marcha que el G-4 le dio y no terminó: sigue por el camino.
    if (Array.isArray(carga.destino) && carga.destino.length >= 2) {
      const r = rutaConvoy(terreno, aqui, carga.destino);
      if (r.sinCamino || haversineKm(aqui, r.parada) < 0.05) { cv.carga = { ...carga, destino: null }; continue; }
      marchar(cv, r, { auto: "camino" });
    }
  }
  return out;
}
// ============================================================
// v2.9.451 — 🤖 EL G-4 AUTOMÁTICO. Lo acordado con Sergio (03-11-2026): «la logística
// roja se mueve sola, para que el G-2 se dedique a presionar», y «al rojo también se
// le acaba todo». Al cerrar el turno, el G-4 del bando que nadie juega (por defecto el
// rojo; el árbitro lo cambia) hace lo que haría uno de carne:
//   · mira lo que le falta a cada unidad — Cl III, Cl V (el arma principal) y Cl I
//     por debajo del 60 %, heridos que esperan, hombres que faltan — y atiende primero
//     lo urgente (a igual urgencia, la unidad que más pesa);
//   · manda el convoy que tiene listo o FORMA uno en el puesto más cercano que
//     despache esa clase, de su estiba (agotada, se acabó): a lo más dos por puesto y
//     por turno. Si a la unidad le faltan dos clases y el puesto las da, va un paquete;
//   · el convoy anda con las reglas de todos (v2.9.444): sólo por camino, para en el
//     punto más cercano, descarga y vuelve. Si ese punto queda a más de 3 km de la
//     unidad, no la abastece y lo dice;
//   · lo que ya va en camino no se repite, y lo que la unidad saca sola de una
//     instalación propia a 3 km (por cuenta propia) tampoco.
// Si un G-4 de carne le da una orden a un convoy, manda él.
// ⚠️ 60 % y dos convoyes por puesto y por turno: cifras de referencia, a validar.
// ============================================================
const G4_UMBRAL = 0.6;
const G4_FORMA_TURNO = 2;
const G4_HERIDOS_MIN = 5;
const G4_PRUEBAS = 3;              // rutas que prueba por pedido (convoyes o puestos más cercanos)
const G4_ANCLA_CAMINO_KM = 15;     // hasta dónde busca camino para su Área de Servicios
const G4_INSTAL = "log_asdi";
const G4_CLASE_TXT: any = { III: "Cl III", V: "Cl V", I: "Cl I", EVAC: "evacuación", REEMP: "reemplazos" };
// Lo que le falta a la unidad, con su urgencia (3 = sin nada o casi) y una frase corta.
function necesidadesG4(u: any) {
  const out: any[] = [];
  if (!u || esConvoy(u) || u.estado === "fuera_combate" || poderEfectivo(u) <= 0) return out;
  const urg = (r: number) => r < 0.2 ? 3 : r < 0.4 ? 2 : 1;
  if (tanqueDe(u) > 0) {
    const r = 1 - faltaTanque(u);
    if (r < G4_UMBRAL) out.push({ k: "III", urg: urg(r), txt: `Cl III ⛽ ${Math.round(100 * r)} %` });
  }
  const m = municionPrincipal(u);
  if (m && m.resto < G4_UMBRAL) out.push({ k: "V", urg: urg(m.resto), txt: `Cl V 🎯 ${Math.round(100 * m.resto)} %` });
  if (conRacion(u)) {
    const r = racionDe(u) / topeRacion(u);
    if (r < G4_UMBRAL) out.push({ k: "I", urg: urg(r), txt: `Cl I 🥫 ${racionDe(u).toFixed(1).replace(".0", "")} d` });
  }
  const h = herDe(u);
  if (h >= G4_HERIDOS_MIN) out.push({ k: "EVAC", urg: h >= 40 ? 3 : 2, txt: `🚑 ${Math.round(h)} heridos` });
  const f = num(u.carga && u.carga.faltan);
  if (f >= HOMBRES_POR_CARGA / 2) out.push({ k: "REEMP", urg: f / hombresDe(u) > 0.25 ? 2 : 1, txt: `👥 faltan ${Math.round(f)}` });
  return out;
}
// Las clases que puede dar ese convoy ahora (el agua cuenta como Clase I; la
// ambulancia, si le queda lugar).
function clasesDeConvoy(cv: any) {
  const out: string[] = [];
  if (cargaDe(cv, "III") > 1e-6) out.push("III");
  if (cargaDe(cv, "V") > 1e-6) out.push("V");
  if (cargaDe(cv, "I") + cargaDe(cv, "AGUA") > 1e-6) out.push("I");
  if (cargaDe(cv, "EVAC") > 1e-6 && lugarAmbulancia(cv) >= 1) out.push("EVAC");
  if (cargaDe(cv, "REEMP") > 1e-6) out.push("REEMP");
  return out;
}
// ¿La unidad a 3 km de esa instalación lo saca sola al final del turno?
function daPorCuentaPropia(x: any, k: string) {
  const I = x && INSTAL_LOG[x.tipo];
  if (!I) return false;
  if (k === "EVAC") return !!I.sanidad;
  if (instalSeca(x)) return false;
  return (k === "III" && I.combustible > 0) || (k === "V" && I.municion > 0) || (k === "I" && !!I.sostiene)
    || (k === "REEMP" && !!I.reemplazos);
}
// El plan del G-4 automático de `bando`: { asignar: [{convoy, para, motivo}],
// formar: [{instal, clase, para, motivo}], faltan: [{u, k, por: estiba|instal|camino, km}] }.
function planG4(bando: string, unidades: any[], instalaciones: any[], terreno: any[], ordenes: any[]) {
  const plan: any = { asignar: [], formar: [], faltan: [] };
  const S = (x: any) => String(x);
  const propias = (unidades || []).filter((u: any) => u && u.bando === bando
    && Number.isFinite(Number(u.lng)) && Number.isFinite(Number(u.lat)));
  const convoyes = propias.filter((u: any) => esConvoy(u) && u.estado !== "fuera_combate" && poderEfectivo(u) > 0);
  const conOrden = new Set((ordenes || []).filter(Boolean).map((o: any) => S(o.unidad_id)));
  // Lo que ya va en camino (unidad|clase): las misiones en curso y las órdenes de este turno.
  const enCamino = new Set<string>();
  const marcar = (uid: any, cv: any) => { for (const k of clasesDeConvoy(cv)) enCamino.add(S(uid) + "|" + k); };
  for (const cv of convoyes) {
    const c = cv.carga || {};
    if (c.apoya != null && (c.fase === "ida" || c.fase === "descarga")) marcar(c.apoya, cv);
  }
  for (const o of ordenes || []) {
    if (!o || o.tipo !== "apoyar" || o.objetivo_id == null) continue;
    const cv = convoyes.find((x: any) => S(x.id) === S(o.unidad_id));
    if (cv) marcar(o.objetivo_id, cv);
  }
  // Los convoyes listos: sin misión, sin marcha a mano y sin orden de este turno.
  const libres = convoyes.filter((cv: any) => {
    const c = cv.carga || {};
    if (conOrden.has(S(cv.id)) || c.apoya != null || ["ida", "descarga", "vuelta"].includes(c.fase)) return false;
    if (Array.isArray(c.destino) && c.destino.length >= 2) return false;
    if (num(c.aBordo) >= 0.5) return false;
    return clasesDeConvoy(cv).length > 0;
  });
  const instal = (instalaciones || []).filter((x: any) => x && x.bando === bando && INSTAL_LOG[x.tipo] && puntoInstalacion(x));
  const despachan = instal.filter((x: any) => (INSTAL_LOG[x.tipo].despacha || []).length);
  const stock = new Map<any, number>(despachan.map((x: any) => [x.id, Math.max(0, capDe(x) - usadoDe(x))]));
  const formadas = new Map<any, number>();
  const nec: any[] = [];
  for (const u of propias) {
    if (esConvoy(u)) continue;
    const pu = [Number(u.lng), Number(u.lat)];
    for (const n of necesidadesG4(u)) {
      if (enCamino.has(S(u.id) + "|" + n.k)) continue;
      if (instal.some((x: any) => daPorCuentaPropia(x, n.k) && haversineKm(pu, puntoInstalacion(x) as number[]) <= REABASTECER_KM)) continue;
      nec.push({ u, pu, ...n });
    }
  }
  nec.sort((a: any, b: any) => b.urg - a.urg || pesoDe(b.u) - pesoDe(a.u));
  const atendida = new Set<string>();
  const lejos = new Map<any, number>();   // unidad → a cuántos km del camino quedó (no la alcanza nadie)
  const pide = (u: any, k: string) => nec.some((m: any) => m.u === u && m.k === k);
  const motivo = (u: any, cls: string[]) => nec.filter((m: any) => m.u === u && cls.includes(m.k)).map((m: any) => m.txt).join(" · ");
  let sinRuta = false;   // el puesto no tiene camino a 2 km (el convoy no anda campo traviesa)
  const prueba = (desde: number[], n: any) => {
    const r = rutaConvoy(terreno, desde, n.pu);
    if (r.sinCamino) { sinRuta = true; return false; }
    if (r.dParada > REABASTECER_KM) { lejos.set(n.u.id, Math.min(lejos.get(n.u.id) ?? Infinity, r.dParada)); return false; }
    return true;
  };
  const cerca = (n: any) => (a: any, b: any) => haversineKm(a, n.pu) - haversineKm(b, n.pu);
  for (const n of nec) {
    const clave = S(n.u.id) + "|" + n.k;
    if (atendida.has(clave)) continue;
    if (lejos.has(n.u.id)) { plan.faltan.push({ u: n.u, k: n.k, por: "camino", km: lejos.get(n.u.id) }); atendida.add(clave); continue; }
    // 1) El convoy listo más cercano que lleve esa clase.
    const cands = libres.filter((cv: any) => clasesDeConvoy(cv).includes(n.k))
      .sort((a: any, b: any) => cerca(n)([a.lng, a.lat], [b.lng, b.lat])).slice(0, G4_PRUEBAS);
    const cv = cands.find((c: any) => prueba([Number(c.lng), Number(c.lat)], n));
    if (cv) {
      const cls = clasesDeConvoy(cv).filter((k: string) => pide(n.u, k));
      plan.asignar.push({ convoy: cv, para: n.u, motivo: motivo(n.u, cls) });
      libres.splice(libres.indexOf(cv), 1);
      for (const k of cls) atendida.add(S(n.u.id) + "|" + k);
      continue;
    }
    // 2) Formar uno en el puesto más cercano que despache esa clase y tenga estiba.
    const deEsa = despachan.filter((x: any) => (INSTAL_LOG[x.tipo].despacha || []).includes(n.k));
    const conEstiba = deEsa.filter((x: any) => (stock.get(x.id) || 0) > 0.05);
    if (!deEsa.length || !conEstiba.length) {
      if (!lejos.has(n.u.id)) { plan.faltan.push({ u: n.u, k: n.k, por: deEsa.length ? "estiba" : "instal" }); atendida.add(clave); continue; }
    }
    const puestos = conEstiba.filter((x: any) => (formadas.get(x.id) || 0) < G4_FORMA_TURNO)
      .sort((a: any, b: any) => cerca(n)(puntoInstalacion(a), puntoInstalacion(b))).slice(0, G4_PRUEBAS);
    sinRuta = false;
    const x = puestos.find((p: any) => prueba(puntoInstalacion(p) as number[], n));
    if (x) {
      const desp = INSTAL_LOG[x.tipo].despacha || [];
      const tres = ["III", "V", "I"].filter((k) => desp.includes(k));
      const otra = tres.some((k) => k !== n.k && pide(n.u, k) && !atendida.has(S(n.u.id) + "|" + k));
      const paquete = tres.includes(n.k) && tres.length >= 2 && otra;
      const cls = paquete ? tres : [n.k];
      stock.set(x.id, Math.max(0, (stock.get(x.id) || 0) - (paquete ? CONVOY_PAQUETE : CONVOY_CAPACIDAD) * cls.length));
      formadas.set(x.id, (formadas.get(x.id) || 0) + 1);
      plan.formar.push({ instal: x, clase: paquete ? "PAQUETE" : n.k, para: n.u, motivo: motivo(n.u, cls) });
      for (const k of cls) atendida.add(S(n.u.id) + "|" + k);
      continue;
    }
    if (lejos.has(n.u.id)) { plan.faltan.push({ u: n.u, k: n.k, por: "camino", km: lejos.get(n.u.id) }); atendida.add(clave); }
    else if (sinRuta) { plan.faltan.push({ u: n.u, k: n.k, por: "camino", km: null }); atendida.add(clave); }
    // Si no, los puestos ya formaron lo suyo en este turno: espera al próximo.
  }
  return plan;
}
// Las redes de caminos que no se tocan entre sí (cada nodo, el número de su red).
function redesVial(g: any) {
  if (g._redes) return g._redes;
  const red = new Int32Array(g.nodos.length).fill(-1);
  let n = 0;
  for (let s = 0; s < g.nodos.length; s++) {
    if (red[s] >= 0) continue;
    const pila = [s]; red[s] = n;
    while (pila.length) { const i = pila.pop() as number; for (const j of g.ady[i]) if (red[j] < 0) { red[j] = n; pila.push(j); } }
    n++;
  }
  g._redes = red;
  return red;
}
// Dónde instala el G-4 automático su Área de Servicios si el bando no tiene ninguna
// instalación: junto a su unidad logística (o su PC más alto, o la unidad más
// alejada del enemigo), sobre el camino. Medido en «CE-IV9»: el camino más cercano a
// la CÍA. LOG. roja era un tramo suelto de 2 km, sin salida, y desde ahí no se
// llegaba a nadie. Por eso va sobre la RED que llega a más unidades propias (a 3 km
// o menos de algún punto suyo) y, en esa red, lo más cerca de su unidad logística.
function anclaLogistica(bando: string, unidades: any[], terreno: any[]) {
  const vale = (u: any) => u && !esConvoy(u) && u.estado !== "fuera_combate"
    && Number.isFinite(Number(u.lng)) && Number.isFinite(Number(u.lat));
  const propias = (unidades || []).filter((u: any) => vale(u) && u.bando === bando);
  if (!propias.length) return null;
  const ESC = Object.keys(EFECTIVO_REF);   // del equipo al ejército
  const alto = (a: any, b: any) => ESC.indexOf(b.escalon) - ESC.indexOf(a.escalon);
  const nom = (u: any) => String(u.designacion || "").trim();
  let ref: any = propias.filter((u: any) => u.arma === "logistica" || /\bLOG\b|LOG[ÍI]ST/i.test(nom(u))).sort(alto)[0]
    || propias.filter((u: any) => /^PC\b/i.test(nom(u))).sort(alto)[0];
  if (!ref) {
    const ene = (unidades || []).filter((u: any) => vale(u) && u.bando !== bando);
    const c = ene.length ? [ene.reduce((s: number, u: any) => s + Number(u.lng), 0) / ene.length,
      ene.reduce((s: number, u: any) => s + Number(u.lat), 0) / ene.length] : null;
    ref = c ? propias.slice().sort((a: any, b: any) => haversineKm([b.lng, b.lat], c) - haversineKm([a.lng, a.lat], c))[0] : propias[0];
  }
  const p = [Number(ref.lng), Number(ref.lat)];
  const g = grafoVial(terreno);
  const red = redesVial(g);
  const cerca = new Map<number, any>();   // red → su nodo más cercano a la unidad logística
  for (let i = 0; i < g.nodos.length; i++) {
    const d = haversineKm(p, g.nodos[i]);
    if (d > G4_ANCLA_CAMINO_KM) continue;
    const m = cerca.get(red[i]);
    if (!m || d < m.d) cerca.set(red[i], { i, d });
  }
  if (!cerca.size) return { ref, pt: p, dCamino: null };
  const alcanza = new Map<number, number>([...cerca.keys()].map((r) => [r, 0]));
  for (const u of propias) {
    const pu = [Number(u.lng), Number(u.lat)], ya = new Set<number>();
    for (let i = 0; i < g.nodos.length; i++) {
      const r = red[i];
      if (!alcanza.has(r) || ya.has(r) || haversineKm(pu, g.nodos[i]) > REABASTECER_KM) continue;
      ya.add(r); alcanza.set(r, (alcanza.get(r) || 0) + pesoDe(u));
    }
  }
  let mejor: any = null;
  for (const [r, m] of cerca) {
    const a = alcanza.get(r) || 0;
    if (!mejor || a > mejor.a + 1e-9 || (Math.abs(a - mejor.a) <= 1e-9 && m.d < mejor.d)) mejor = { a, i: m.i, d: m.d };
  }
  return { ref, pt: g.nodos[mejor.i].slice(), dCamino: mejor.d };
}
function resolverTurno(estado: any) {
  // v2.9.430 — UNA ORDEN POR UNIDAD, LA ÚLTIMA. En la base quedaron turnos con
  // dos y tres órdenes para la misma unidad (doble envío desde el navegador):
  // el motor las corría TODAS, una detrás de la otra, y la ficha aparecía al
  // doble de distancia con dos trazas que en pantalla la hacían saltar.
  {
    const ult = new Map<any, any>();
    for (const o of estado.ordenes || []) {
      const prev = ult.get(o.unidad_id);
      if (!prev || Number(o.id || 0) >= Number(prev.id || 0)) ult.set(o.unidad_id, o);
    }
    estado = { ...estado, ordenes: [...ult.values()] };
  }
  const horas = estado.duracion_turno_horas || 2;
  const rango = estado.rango_combate_km || 3;
  const terreno = prepararTerreno(estado.terreno); // v2.9.201: cajas para el prefiltro
  const eventos: any[] = [];
  const U = new Map<any, any>(estado.unidades.map((u: any) => [u.id, { ...u, carga: u.carga ? { ...u.carga } : u.carga,
    municion: u.municion ? { ...u.municion } : u.municion }]));
  const _instalTodas: any[] = (estado.instalaciones || []).filter((x: any) => x && esInstalacionLog(x.tipo));
  // v2.9.443: el poder del apoyo (una sola vez, en las partidas viejas).
  const ajustados = normalizarPoderes(U);
  if (ajustados.length) {
    eventos.push({ tipo: "aviso",
      descripcion: `⚖️ Se ajustó el poder de combate de ${ajustados.length} unidad(es) de apoyo, que entraron con el `
        + `de su escalón (como si fueran fuerzas de maniobra): `
        + ajustados.map((c: any) => `${nombreUnidad(c.u)} ${c.de}→${c.a}`).join(" · ")
        + `. El servicio de combate pelea con el 15 % de su escalón, comunicaciones con el 25 %, el PC con su `
        + `seguridad y el convoy como una sección; ninguno empieza un combate.`,
      bandos_visibles: [] });
  }
  // ---- Las órdenes del turno: las dadas, el apoyo de los convoyes y lo que sigue solo ----
  let ordenes: any[] = [...(estado.ordenes || [])];
  for (const o of ordenes) {
    const u: any = U.get(o.unidad_id);
    if (!u || !esConvoy(u)) continue;
    // v2.9.443 — «🤝 APOYAR A…»: el convoy queda agregado a esa unidad.
    // v2.9.444 — «🚚 ABASTECER A…»: va por camino al punto más cercano a la unidad,
    // para, descarga el tiempo que lleva y vuelve (la misma orden `apoyar`).
    if (o.tipo === "apoyar") {
      const x: any = U.get(o.objetivo_id);
      if (!x || x.bando !== u.bando || esConvoy(x)) {
        eventos.push({ tipo: "logistica", bando: u.bando, lat: u.lat, lng: u.lng,
          descripcion: `🚫 ${nombreUnidad(u)}: abastece sólo a una unidad propia (no a otro convoy).`,
          bandos_visibles: [u.bando] });
        continue;
      }
      // v2.9.451: la orden del 🤖 G-4 automático lleva el pedido que atiende (`o.g4`).
      u.carga = { ...(u.carga || {}), apoya: x.id, fase: "ida", destino: null, resta: null, llegoH: null, entrego: 0, auto: !!o.g4 };
      const r = rutaConvoy(terreno, [Number(u.lng), Number(u.lat)], [Number(x.lng), Number(x.lat)]);
      const bot = o.g4 ? "🤖 " : "", pedido = o.g4 ? ` (${o.g4})` : "";
      eventos.push({ tipo: "logistica", bando: u.bando, lat: u.lat, lng: u.lng,
        descripcion: r.sinCamino
          ? `${bot}⛔ ${nombreUnidad(u)} → ${nombreUnidad(x)}: ${r.motivo}. El convoy no anda campo traviesa.`
          : `${bot}🚚 ${nombreUnidad(u)} → ${nombreUnidad(x)}${pedido}: ${r.km.toFixed(1)} km por camino; para a ${r.dParada.toFixed(1)} km de la unidad`
            + (r.dParada > REABASTECER_KM
              ? `. ⚠️ Más de ${REABASTECER_KM} km: si la unidad no se acerca, no hay abastecimiento.`
              : ` y ${cargaDe(u, "EVAC") > 0 ? "carga heridos" : "descarga"} ~${horasATexto(horasDescarga(u, x))}; después vuelve.`),
        bandos_visibles: [u.bando] });
    } else if (["mover", "replegar", "defender"].includes(o.tipo)) {
      // Una orden a mano del G-4: manda él (deja la misión y la vuelta).
      u.carga = { ...(u.carga || {}), apoya: null, fase: null, destino: null, resta: null, auto: false };
      if (o.tipo !== "defender" && o.destino_lat != null) {
        // v2.9.444 — sus puntos de paso, llevados al camino.
        const pts = Array.isArray(o.ruta) && o.ruta.length ? o.ruta : [[o.destino_lng, o.destino_lat]];
        const r = rutaConvoyPorPuntos(terreno, [Number(u.lng), Number(u.lat)], pts);
        if (r.sinCamino || !r.ruta.length) {
          o._sinCamino = true;
          eventos.push({ tipo: "logistica", bando: u.bando, lat: u.lat, lng: u.lng,
            descripcion: `⛔ ${nombreUnidad(u)} no se mueve: ${r.motivo || "sin camino"}. El convoy no anda campo traviesa.`,
            bandos_visibles: [u.bando] });
        } else {
          o.ruta = r.ruta; o.destino_lng = r.parada[0]; o.destino_lat = r.parada[1];
          u.carga.destino = r.parada;   // si no llega en este turno, sigue solo por el camino
        }
      }
    }
  }
  ordenes = ordenes.filter((o: any) => o.tipo !== "apoyar" && !o._sinCamino);
  const automaticas = ordenesAutomaticas(estado, U, _instalTodas, terreno, ordenes, eventos);
  ordenes = [...ordenes, ...automaticas];
  const ordenesNuevas = automaticas.filter((o: any) => o.auto === "sigue");
  // v2.9.203: se guarda la RUTA (replay) y la bitácora cuenta cuánto avanzó, en
  // cuánto tiempo y qué peligros quedaron sobre la unidad.
  const trazas: any[] = [];
  // v2.9.220: dónde cayeron los fuegos. Viaja en la RESPUESTA (no se guarda),
  // como las trazas, para que la pantalla pueda encender el incendio ahí.
  const impactos: any[] = [];
  // v2.9.225 — ROMPER CONTACTO. El choque por proximidad era OBLIGATORIO: dos
  // unidades enemigas cerca se trenzaban TODOS los turnos y al turno 60 no
  // quedaba nadie. Un comandante puede replegarse.
  const replegando = new Set<any>();
  const posInicial = new Map([...U.values()].map((x: any) => [x.id, [x.lng, x.lat]]));
  // ---- 1) LA MARCHA DE CADA UNO, ENTERA Y CON SUS HORAS ----
  const TR = new Map<any, any>();
  const marcha = new Map<any, any>();
  for (const o of ordenes) {
    if ((o.tipo !== "mover" && o.tipo !== "replegar") || o.destino_lat == null) continue;
    const u: any = U.get(o.unidad_id);
    if (!u || poderEfectivo(u) <= 0 || marcha.has(u.id)) continue;
    if (o.tipo === "replegar") replegando.add(u.id);
    // v2.9.220: si la orden trae RUTA, se recorre entera con el tiempo del turno.
    const pts = Array.isArray(o.ruta) && o.ruta.length ? o.ruta : [[o.destino_lng, o.destino_lat]];
    // v2.9.223 — SINCRONIZACIÓN: la orden puede arrancar más tarde dentro del
    // turno (H+1, H+1.5…) y entonces dispone sólo de las horas que quedan.
    const inicio = Math.max(0, Math.min(horas, Number(o.inicio) || 0));
    const r: any = moverPorRuta(u, pts, terreno, horas - inicio, estado.turno);
    marcha.set(u.id, { o, r, inicio, usadoAntes: Number(u.combustible_km) || 0 });
    TR.set(u.id, trDeMarcha(r, inicio));
  }
  for (const u of U.values()) if (!TR.has(u.id)) TR.set(u.id, trQuieta(u));
  const procesados = new Set<any>();   // los que combatieron (para evaluar la tarea)
  const disparadoras = new Set<any>(); // abrieron fuego → quedan localizadas
  const zonas: any[] = [];             // v2.9.226: zonas NUEVAS que deja el turno
  const zonasBorrar: any[] = [];
  const instalBorrar: any[] = [];
  // v2.9.325 — EL «ANTES» DEL TURNO, para poder evaluar las tareas al final.
  const _antes = new Map((estado.unidades || []).map((x: any) => [x.id, { ...x }]));
  const _obraTerminada = new Set<any>();
  for (const x of U.values()) {
    (x as any)._suprimida = (x as any).suprimida_hasta != null
      && (Number(estado.turno) || 0) <= (x as any).suprimida_hasta;
  }
  const hMas = (h: number) => { const m = Math.round(h * 60); return `H+${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`; };
  const vivo = (x: any) => !!x && poderEfectivo(x) > 0;
  const sucios = new Set<any>();
  const detener = (id: any, h: number) => {
    const tr = TR.get(id);
    if (tr && h < tr.tStop - 1e-9) { tr.tStop = Math.max(0, h); sucios.add(id); }
  };
  // ---- 2) ROMPER CONTACTO, a H+0 (se juzga por dónde estaban al empezar) ----
  // Desenganchar de un enemigo que te tenía encima cuesta, aunque después te
  // alejes 15 km. Si no, replegarse saldría gratis y sería siempre la mejor jugada.
  const paresHechos = new Set<string>();
  const claveP = (a: any, b: any) => (String(a) < String(b) ? `${a}|${b}` : `${b}|${a}`);
  for (const id of replegando) {
    const u: any = U.get(id);
    if (!vivo(u)) continue;
    const p0: any = posInicial.get(id); if (!p0) continue;
    let perseguidor: any = null, dMin = Infinity;
    for (const e of U.values()) {
      if ((e as any).bando === u.bando || !vivo(e)) continue;
      if (esNoCombatiente(e)) continue;   // v2.9.443: el apoyo no persigue a nadie
      const pe: any = posInicial.get((e as any).id); if (!pe) continue;
      const d = haversineKm(p0, pe);
      if (d <= rango && d < dMin) { dMin = d; perseguidor = e; }
    }
    if (!perseguidor) continue; // no estaba en contacto: se fue limpio
    procesados.add(u.id);
    paresHechos.add(claveP(u.id, perseguidor.id));
    if (replegando.has(perseguidor.id)) {
      procesados.add(perseguidor.id);
      eventos.push({ tipo: "combate", lat: u.lat, lng: u.lng,
        descripcion: `↩️ ${nombreUnidad(u)} y ${nombreUnidad(perseguidor)} ROMPIERON CONTACTO: `
          + `los dos se replegaron y no hubo empeño.`,
        bandos_visibles: ["rojo", "azul"], ratio: null, resultado: "sin_empeno" });
      continue;
    }
    // v2.9.439: el que persigue SIN MUNICIÓN no castiga a nadie; el que tira, gasta.
    // v2.9.443: con lo que se pelea de cerca, no con la artillería.
    const cercP = armasCercanas(perseguidor);
    const armaP: any = cercP[cercP.length - 1];
    if (!armaP) {
      eventos.push({ tipo: "combate", lat: u.lat, lng: u.lng,
        descripcion: `↩️ ${nombreUnidad(u)} ROMPIÓ CONTACTO sin castigo: ${nombreUnidad(perseguidor)} `
          + `no tenía con qué tirarle (SIN MUNICIÓN).`,
        bandos_visibles: ["rojo", "azul"], ratio: null, resultado: "rompio_contacto" });
      continue;
    }
    gastarMunicion(perseguidor, armaP.id, COSTO_UF.encuentro);
    const bono = bonoDefensa(p0, terreno);
    const perd = Math.min(0.5, 0.18 / bono);
    const antes = poderEfectivo(u);
    const nuevo = Math.max(0, antes * (1 - perd));
    u.poder_actual = Number(nuevo.toFixed(2));
    u.estado = nuevo <= u.poder_max * 0.2 ? "fuera_combate" : (nuevo <= u.poder_max * 0.6 ? "desgastada" : "activa");
    impactos.push({ lng: p0[0], lat: p0[1], radio: armaP.radio, arma: armaP.id,
      nom: armaP.nom, bando: perseguidor.bando, tocadas: 1, encuentro: true,
      desde: posInicial.get(perseguidor.id), indirecto: !!armaP.indirecto, hora: 0 });
    disparadoras.add(perseguidor.id);
    procesados.add(perseguidor.id);
    if (!vivo(u)) detener(u.id, 0);
    eventos.push({ tipo: "combate", lat: p0[1], lng: p0[0],
      descripcion: `↩️ ${nombreUnidad(u)} ROMPIÓ CONTACTO y se replegó bajo el fuego de `
        + `${nombreUnidad(perseguidor)} (lo tenía a ${dMin.toFixed(1)} km): aguantó el castigo de la `
        + `persecución y no devolvió fuego — perdió ${(antes - nuevo).toFixed(0)} y quedó `
        + `${nuevo <= u.poder_max * 0.2 ? "FUERA DE COMBATE" : (nuevo <= u.poder_max * 0.6 ? "DESGASTADA" : "en condiciones")} `
        + `(${Math.round((100 * nuevo) / u.poder_max)} %). Desenganchar cuesta, pero salva a la unidad.`,
      bandos_visibles: ["rojo", "azul"], ratio: null, resultado: "rompio_contacto" });
  }
  // ---- 3) OBRAS DE INGENIERÍA (es trabajo, no combate) ----
  for (const o of ordenes) {
    if (o.tipo !== "zapa" || !OBRAS[o.obra] || o.destino_lat == null) continue;
    const u: any = U.get(o.unidad_id);
    if (!vivo(u)) continue;
    // v2.9.324: ingeniería hace todo; la infantería fortifica pero no abre
    // brechas ni excava fosos — eso pide máquinas, no pico y pala.
    const cap = puedeHacerObra(u, o.obra);
    if (!cap) {
      const sol = OBRAS[o.obra] && OBRAS[o.obra].soloIng && capacidadObra(u);
      eventos.push({ tipo: "obra", bando: u.bando, lat: u.lat, lng: u.lng,
        descripcion: sol
          ? `🚫 ${nombreUnidad(u)}: «${OBRAS[o.obra].nom}» necesita MAQUINARIA DE INGENIERÍA — con pico y pala no sale.`
          : `🚫 ${nombreUnidad(u)}: esta unidad no fortifica. Las obras las hacen ingeniería e infantería.`,
        bandos_visibles: [u.bando] });
      continue;
    }
    const obra: any = OBRAS[o.obra];
    const pt = [o.destino_lng, o.destino_lat];
    const t: any = u.trabajo;
    const mismo = t && t.obra === o.obra && haversineKm([t.lng, t.lat], pt) < 0.3;
    // v2.9.443: la brecha es un corredor desde donde está la cuadrilla (hasta 2 km).
    const desde = obra.porKm ? (mismo && t.desde ? t.desde : [u.lng, u.lat]) : null;
    const dObra = haversineKm([u.lng, u.lat], obra.porKm ? desde : pt);
    if (dObra > 1.0) {
      eventos.push({ tipo: "obra", bando: u.bando, lat: u.lat, lng: u.lng,
        descripcion: `🚧 ${nombreUnidad(u)}: NO PUDO TRABAJAR — la obra está a ${dObra.toFixed(1)} km `
          + `y hay que estar encima. Llevá la unidad al lugar primero.`,
        bandos_visibles: [u.bando] });
      continue;
    }
    if (o.obra === "puente" && claseTerreno(pt, terreno) !== "rio") {
      const cl = claseTerreno(pt, terreno);
      eventos.push({ tipo: "obra", bando: u.bando, lat: u.lat, lng: u.lng,
        descripcion: cl === "agua"
          ? `🌉 ${nombreUnidad(u)}: una laguna no se puentea — hay que rodearla.`
          : `🌉 ${nombreUnidad(u)}: ahí no hay un río que cruzar${cl === "camino" ? " (ya hay un puente de camino)" : ""}. `
            + `Marcá el punto SOBRE la traza del río.`,
        bandos_visibles: [u.bando] });
      continue;
    }
    // v2.9.324: los turnos salen de las HORAS de trabajo divididas por lo que
    // dura un turno en ESTA partida.
    const horasObra = horasDeObra(u, o.obra, pt, terreno, desde || undefined);
    const total = mismo ? t.total : turnosDeObra(u, o.obra, pt, terreno, horas, desde || undefined);
    const restan = (mismo ? t.restan : total) - 1;
    if (restan > 0) {
      u.trabajo = { obra: o.obra, lng: pt[0], lat: pt[1], restan, total, ...(desde ? { desde } : {}) };
      eventos.push({ tipo: "obra", bando: u.bando, lat: pt[1], lng: pt[0],
        descripcion: `${obra.icono} ${nombreUnidad(u)} TRABAJA en «${obra.nom}» `
          + `(${horasObra.toFixed(1)} h de trabajo${cap.ing ? "" : " — a pico y pala, sin maquinaria"}) — `
          + `le faltan ${restan} de ${total} turnos. Si la mueven o la sacan de combate, se pierde el trabajo.`,
        bandos_visibles: [u.bando] });
      continue;
    }
    u.trabajo = null;
    _obraTerminada.add(u.id);   // v2.9.325: para evaluar la tarea BLOQUEAR
    if (obra.porKm && desde) {
      // v2.9.443 — EL CORREDOR: 200 m de ancho, desde la cuadrilla hacia el punto.
      const [a, b] = tramoDeBrecha(desde, pt);
      const g = huellaObstaculo({ type: "LineString", coordinates: [a, b] }, obra.ancho);
      if (g) zonas.push({ tipo: "via", geojson: { ...g, obra: "brecha" }, hasta_turno: null, bando: u.bando, obra: o.obra });
      const km = haversineKm(a, b);
      eventos.push({ tipo: "obra", lat: b[1], lng: b[0],
        descripcion: `🛠️ ${nombreUnidad(u)} ABRIÓ BRECHA: un corredor de ${km.toFixed(1)} km por el que se pasa a través `
          + `del terreno restringido, del severo, de los campos minados y de los obstáculos (${horasObra.toFixed(1)} h de trabajo). `
          + `Lo usan LOS DOS bandos.`,
        bandos_visibles: ["rojo", "azul"] });
      continue;
    }
    if (o.obra === "puente") {
      zonas.push({ tipo: "via", geojson: { type: "Polygon", coordinates: [anilloKm(pt[0], pt[1], obra.ancho)], obra: "puente" },
        hasta_turno: null, bando: u.bando, obra: o.obra });
      eventos.push({ tipo: "obra", lat: pt[1], lng: pt[0],
        descripcion: `🌉 ${nombreUnidad(u)} TENDIÓ UN PUENTE sobre el río (${horasObra.toFixed(1)} h de trabajo): desde ahora `
          + `los vehículos cruzan por ahí — los de LOS DOS bandos.`,
        bandos_visibles: ["rojo", "azul"] });
      continue;
    }
    zonas.push({ tipo: obra.tipo, centro: pt, radio: obra.ancho,
      hasta_turno: null, bando: u.bando, obra: o.obra });
    eventos.push({ tipo: "obra", bando: u.bando, lat: pt[1], lng: pt[0],
      descripcion: `✅ ${nombreUnidad(u)} TERMINÓ «${obra.nom}» en ${total} turno${total > 1 ? "s" : ""} `
        + `(${horasObra.toFixed(1)} h de trabajo). ` + obra.desc,
      // Un obstáculo terminado NO se anuncia al enemigo: se descubre cuando lo encuentra.
      bandos_visibles: [u.bando] });
  }
  for (const u of U.values()) {
    if (!u.trabajo) continue;
    const ref = u.trabajo.desde || [u.trabajo.lng, u.trabajo.lat];
    const lejos = haversineKm([u.lng, u.lat], ref) > 1.0;
    if (lejos || !vivo(u)) {
      eventos.push({ tipo: "obra", bando: u.bando, lat: u.trabajo.lat, lng: u.trabajo.lng,
        descripcion: `🚧 ${nombreUnidad(u)}: se PERDIÓ el trabajo en «${(OBRAS[u.trabajo.obra] || { nom: "la obra" }).nom}» — `
          + (lejos ? "la unidad dejó el lugar." : "la unidad quedó fuera de combate."),
        bandos_visibles: [u.bando] });
      u.trabajo = null;
    }
  }
  // ---- 4) EL TURNO, HORA POR HORA ----
  const horaDe = (o: any) => (o.inicio != null && Number.isFinite(Number(o.inicio)))
    ? Math.max(0, Math.min(horas, Number(o.inicio))) : null;
  const fuegos = ordenes.filter((o: any) => (o.tipo === "atacar" && o.objetivo_id != null)
    || (o.tipo === "fuego" && o.destino_lat != null)).map((o: any) => ({ o, h: undefined as any, hecho: false }));
  const minas = [...marcha.entries()].filter(([, m]: any) => m.r.minado)
    .map(([id, m]: any) => ({ id, m, h: m.inicio + (Number(m.r.horasUsadas) || 0), hecho: false }));
  const contactoDe = new Map<any, any>();   // id → { con, h } (el primer contacto: por eso se detuvo)
  const textoMinas = new Map<any, string>();
  const candidatos: any[] = [];
  const lista = [...U.values()];
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a: any = lista[i], b: any = lista[j];
      if (a.bando === b.bando || !vivo(a) || !vivo(b)) continue;
      if (replegando.has(a.id) || replegando.has(b.id)) continue;
      if (esNoCombatiente(a) && esNoCombatiente(b)) continue;
      candidatos.push({ a: a.id, b: b.id, h: undefined as any, hecho: false });
    }
  }
  const horaDeFuego = (f: any, tAhora: number) => {
    const o = f.o, atac: any = U.get(o.unidad_id);
    if (!vivo(atac)) return null;
    const hF = horaDe(o);
    if (o.tipo === "fuego") {
      if (hF != null) return Math.max(hF, tAhora);
      const tr = TR.get(atac.id);
      return Math.max(tAhora, tr.mueve ? trFin(tr) : 0);
    }
    const def: any = U.get(o.objetivo_id);
    if (!vivo(def) || def.bando === atac.bando) return null;
    if (hF != null) return Math.max(hF, tAhora);
    const arma: any = armaDeFuego(atac, o.arma);
    if (!arma) return null;
    const h = trPrimerAlcance(TR.get(atac.id), TR.get(def.id), arma.alcance, tAhora, horas);
    if (h != null) return h;
    return trMasCerca(TR.get(atac.id), TR.get(def.id), tAhora, horas).h;   // nunca tuvo alcance: tira igual, corto
  };
  const resolverAtaque = (o: any, h: number) => {
    const atac: any = U.get(o.unidad_id), def: any = U.get(o.objetivo_id);
    if (!atac || !def || atac.bando === def.bando || !vivo(atac) || !vivo(def)) return;
    const arma: any = armaDeFuego(atac, o.arma);
    if (!arma) return; // no tiene con qué batir (p. ej. sólo medios de zapa)
    // v2.9.230 — SIN MUNICIÓN NO SE TIRA, y se dice.
    if (municionDe(atac, arma.id) <= 0) {
      eventos.push({ tipo: "sin_municion", bando: atac.bando, lat: atac.lat, lng: atac.lng,
        descripcion: `🚫 ${nombreUnidad(atac)}: NO PUDO ABRIR FUEGO sobre ${nombreUnidad(def)} — `
          + `${arma.nom} SIN MUNICIÓN. La orden se pierde hasta que la reabastezcan.`,
        bandos_visibles: [atac.bando] });
      return;
    }
    gastarMunicion(atac, arma.id, COSTO_UF.empeno);
    const pT = trPos(TR.get(atac.id), h), pB = trPos(TR.get(def.id), h);
    const d = haversineKm(pT, pB);
    const atacH = { ...atac, lng: pT[0], lat: pT[1] };
    const defH = { ...def, lng: pB[0], lat: pB[1] };
    disparadoras.add(atac.id); // apretó el gatillo, haya dado o no
    procesados.add(atac.id);
    const cuando = ` (a ${hMas(h)})`;
    if (!dentroDeAlcance(d, arma.alcance)) {
      // TIRO CORTO: dispara igual, gasta munición y se delata.
      eventos.push({ tipo: "fuego_perdido", bando: atac.bando, lat: atacH.lat, lng: atacH.lng,
        descripcion: textoFuegoPerdido(atacH, defH, arma, d) + cuando, bandos_visibles: [atac.bando] });
      eventos.push({ tipo: "fuego_detectado", bando: def.bando, lat: atacH.lat, lng: atacH.lng,
        descripcion: `👂 ${nombreUnidad(def)}: le tiraron y los proyectiles cayeron cortos — el tirador quedó LOCALIZADO (${nombreUnidad(atac)}, a ${d.toFixed(1)} km)${cuando}.`,
        bandos_visibles: [def.bando] });
      return;
    }
    // v2.9.223 — ¿EL BLANCO PUEDE CONTESTAR? De eso depende que el tirador pague.
    const resp: any = puedeResponder(defH, atacH, terreno);
    aplicarCombate(resolverCombate([atacH], defH, terreno, arma, resp.puede),
      U, eventos, defH, [atacH], arma, resp, hMas(h));
    impactos.push({ lng: pB[0], lat: pB[1], radio: arma.radio, arma: arma.id,
      nom: arma.nom, bando: atac.bando, tocadas: 1,
      desde: pT, indirecto: !!arma.indirecto, hora: h });
    // v2.9.223 — FUEGO CRUZADO: si contesta, sale el tiro de vuelta.
    if (resp.puede && resp.arma && vivo(def) && municionDe(def, resp.arma.id) > 0) {
      gastarMunicion(def, resp.arma.id, COSTO_UF.empeno);
      impactos.push({ lng: pT[0], lat: pT[1], radio: resp.arma.radio, arma: resp.arma.id,
        nom: resp.arma.nom, bando: def.bando, tocadas: 1, respuesta: true,
        desde: pB, indirecto: !!resp.arma.indirecto, hora: h });
      disparadoras.add(def.id);
    }
    procesados.add(def.id);
    paresHechos.add(claveP(atac.id, def.id));
    for (const x of [atac, def]) if (!vivo(x)) detener(x.id, h);
  };
  const resolverConcentracion = (o: any, h: number) => {
    const atac: any = U.get(o.unidad_id);
    if (!vivo(atac)) return;
    const arma: any = armaDeFuego(atac, o.arma);
    if (!arma) return;
    const punto = [o.destino_lng, o.destino_lat];
    disparadoras.add(atac.id); // pedir fuego también delata
    procesados.add(atac.id);
    // v2.9.226 — MISIÓN DE ARTILLERÍA. Interdictar no es destruir.
    const mision = MISIONES[o.mision] ? o.mision : "destruccion";
    // v2.9.230: la concentración se paga en munición; la interdicción, el doble.
    const costo = COSTO_UF[mision] != null ? COSTO_UF[mision] : 1;
    if (municionDe(atac, arma.id) < costo) {
      eventos.push({ tipo: "sin_municion", bando: atac.bando, lat: atac.lat, lng: atac.lng,
        descripcion: `🚫 ${nombreUnidad(atac)}: NO PUDO TIRAR la concentración pedida — `
          + `${arma.nom} sin munición suficiente (${mision} cuesta ${costo} UF y `
          + `le quedan ${municionDe(atac, arma.id)}). Hay que reabastecer.`,
        bandos_visibles: [atac.bando] });
      return;
    }
    gastarMunicion(atac, arma.id, costo);
    const pA = trPos(TR.get(atac.id), h);
    const atacH = { ...atac, lng: pA[0], lat: pA[1] };
    const enZona = [...U.values()].map((x: any) => { const p = trPos(TR.get(x.id), h); return { ...x, lng: p[0], lat: p[1] }; });
    const res: any = resolverFuegoArea(atacH, punto, arma, enZona, terreno);
    const cuando = `[${hMas(h)}] `;
    if (mision === "interdiccion") {
      if (!res.alcanza) {
        eventos.push({ tipo: "fuego_perdido", bando: atac.bando, lat: atacH.lat, lng: atacH.lng,
          descripcion: `🔥 ${cuando}${nombreUnidad(atac)}: no puede INTERDICTAR ahí — ${arma.nom} bate hasta `
            + `${arma.alcance.toFixed(1)} km y el punto está a ${res.d.toFixed(1)} km. `
            + `Los tiros cayeron cortos: gastó munición y DELATÓ SU POSICIÓN.`,
          bandos_visibles: [atac.bando] });
        return;
      }
      const dura = INTERDICCION_TURNOS[arma.id] || 2;
      zonas.push({ tipo: "interdiccion", centro: punto, radio: INTERDICCION_ANCHO,
        hasta_turno: (Number(estado.turno) || 0) + dura, bando: atac.bando, arma: arma.id });
      impactos.push({ lng: punto[0], lat: punto[1], radio: arma.radio, arma: arma.id,
        nom: arma.nom, bando: atac.bando, tocadas: res.tocadas.length, mision,
        desde: [atacH.lng, atacH.lat], indirecto: !!arma.indirecto, hora: h });
      eventos.push({ tipo: "fuego", lat: punto[1], lng: punto[0],
        descripcion: `⛔ ${cuando}${nombreUnidad(atac)} INTERDICTÓ con ${arma.nom} a ${res.d.toFixed(1)} km: `
          + `queda batida una faja de ${INTERDICCION_ANCHO} km de radio durante ${dura} turnos. `
          + `El que la cruce lo va a pagar — los propios TAMBIÉN.`,
        bandos_visibles: ["rojo", "azul"] });
      return;
    }
    if (mision === "neutralizacion" && res.alcanza) {
      for (const t of res.tocadas) {
        const u2: any = U.get(t.u.id);
        if (u2) u2.suprimida_hasta = (Number(estado.turno) || 0) + 1;
      }
      impactos.push({ lng: punto[0], lat: punto[1], radio: arma.radio, arma: arma.id,
        nom: arma.nom, bando: atac.bando, tocadas: res.tocadas.length, mision,
        desde: [atacH.lng, atacH.lat], indirecto: !!arma.indirecto, hora: h });
      eventos.push({ tipo: "fuego", lat: punto[1], lng: punto[0],
        descripcion: `🌀 ${cuando}${nombreUnidad(atac)} NEUTRALIZÓ con ${arma.nom} a ${res.d.toFixed(1)} km: `
          + (res.tocadas.length
            ? `${res.tocadas.map((t: any) => nombreUnidad(t.u)).join(" · ")} quedó SUPRIMIDA — combate a media máquina el turno que viene, pero no fue destruida.`
            : `no había nadie en la zona. Munición gastada y posición delatada.`),
        bandos_visibles: res.tocadas.length ? ["rojo", "azul"] : [atac.bando] });
      return;
    }
    if (!res.alcanza) {
      eventos.push({ tipo: "fuego_perdido", bando: atac.bando, lat: atacH.lat, lng: atacH.lng,
        descripcion: `🔥 ${cuando}${nombreUnidad(atac)}: TIRO CORTO sobre la concentración pedida — `
          + `${arma.nom} bate hasta ${arma.alcance.toFixed(1)} km y el punto está a ${res.d.toFixed(1)} km. `
          + `Los tiros cayeron cortos: gastó munición y DELATÓ SU POSICIÓN.`,
        bandos_visibles: [atac.bando] });
      return;
    }
    for (const b of res.bajas) {
      const u: any = U.get(b.id);
      if (u) { u.poder_actual = b.poderNuevo; u.estado = b.estado; procesados.add(u.id); if (!vivo(u)) detener(u.id, h); }
    }
    // v2.9.335 — ¿cayó sobre una instalación logística enemiga? Se la lleva.
    for (const x of instalacionesBatidas(punto, arma, _instalTodas, atac.bando)) {
      if (instalBorrar.includes(x.id)) continue;
      instalBorrar.push(x.id);
      eventos.push({ tipo: "logistica", lat: punto[1], lng: punto[0],
        descripcion: `💥 ${cuando}${nombreUnidad(atac)} DESTRUYÓ una instalación logística enemiga: `
          + `${INSTAL_LOG[x.tipo].nom}. Todo lo que dependía de ese punto se queda sin apoyo.`,
        bandos_visibles: ["rojo", "azul"] });
    }
    eventos.push({ tipo: "fuego", lat: punto[1], lng: punto[0],
      descripcion: cuando + textoFuego(atacH, arma, res),
      bandos_visibles: res.tocadas.length ? ["rojo", "azul"] : [atac.bando] });
    impactos.push({ lng: punto[0], lat: punto[1], radio: arma.radio, arma: arma.id,
      nom: arma.nom, bando: atac.bando, tocadas: res.tocadas.length,
      // v2.9.221: DESDE DÓNDE salió el tiro y si va por elevación, para que la
      // pantalla dibuje el proyectil viajando (parábola o recta).
      desde: [atacH.lng, atacH.lat], indirecto: !!arma.indirecto, hora: h });
  };
  const resolverEncuentro = (idA: any, idB: any, h: number) => {
    const A: any = U.get(idA), B: any = U.get(idB);
    if (!vivo(A) || !vivo(B)) return;
    // v2.9.443: el apoyo nunca abre fuego primero; entre dos de combate, el más fuerte.
    let atac: any, def: any;
    if (esNoCombatiente(A) && !esNoCombatiente(B)) { atac = B; def = A; }
    else if (esNoCombatiente(B) && !esNoCombatiente(A)) { atac = A; def = B; }
    else [atac, def] = poderEfectivo(A) >= poderEfectivo(B) ? [A, B] : [B, A];
    const pA0 = trPos(TR.get(atac.id), h), pD0 = trPos(TR.get(def.id), h);
    const seca = (x: any) => armasCercanas(x).length === 0;
    // v2.9.439 — SIN MUNICIÓN NO SE PELEA. Tira sólo el que tiene con qué; si los
    // dos están secos, se topan y no hay fuego.
    if (seca(atac) && seca(def)) {
      eventos.push({ tipo: "sin_municion", lat: pD0[1], lng: pD0[0],
        descripcion: `🚫 [${hMas(h)}] ${nombreUnidad(atac)} y ${nombreUnidad(def)} se toparon SIN MUNICIÓN: no hubo fuego. `
          + `Hay que reabastecerlas antes de volver a empeñarlas.`,
        bandos_visibles: ["rojo", "azul"] });
      return;
    }
    if (seca(atac)) {
      if (esNoCombatiente(def)) {
        eventos.push({ tipo: "combate", lat: pD0[1], lng: pD0[0],
          descripcion: `🚫 [${hMas(h)}] ${nombreUnidad(atac)} se topó con ${nombreUnidad(def)} SIN MUNICIÓN: no pudo atacarlo, `
            + `y ${nombreUnidad(def)} (apoyo) no abre fuego — siguen en contacto.`,
          bandos_visibles: ["rojo", "azul"] });
        return;
      }
      [atac, def] = [def, atac];        // tira el que tiene con qué
    }
    const secoD = seca(def);
    // v2.9.224 — EL COMBATE DE ENCUENTRO TAMBIÉN SE VE.
    // v2.9.443 — y pelean las armas de cerca: cada una gasta lo suyo.
    const cercA = armasCercanas(atac), cercD = secoD ? [] : armasCercanas(def);
    const armaA: any = cercA[cercA.length - 1];
    const armaD: any = secoD ? (armasCercanas(def, false).slice(-1)[0] || armaDeFuego(def, null)) : cercD[cercD.length - 1];
    for (const w of cercA) gastarMunicion(atac, w.id, COSTO_UF.encuentro);
    for (const w of cercD) gastarMunicion(def, w.id, COSTO_UF.encuentro);
    const pAtac = trPos(TR.get(atac.id), h), pDef = trPos(TR.get(def.id), h);
    const atacH = { ...atac, lng: pAtac[0], lat: pAtac[1] }, defH = { ...def, lng: pDef[0], lat: pDef[1] };
    aplicarCombate(resolverCombate([atacH], defH, terreno, undefined, !secoD), U, eventos, defH, [atacH], armaA,
      { puede: !secoD, arma: armaD, d: haversineKm(pAtac, pDef), seco: secoD && !!armaD, cerca: true }, hMas(h));
    if (armaA) {
      impactos.push({ lng: pDef[0], lat: pDef[1], radio: armaA.radio, arma: armaA.id,
        nom: armaA.nom, bando: atac.bando, tocadas: 1, encuentro: true,
        desde: pAtac, indirecto: !!armaA.indirecto, hora: h });
      disparadoras.add(atac.id);
    }
    if (armaD && !secoD) {
      impactos.push({ lng: pAtac[0], lat: pAtac[1], radio: armaD.radio, arma: armaD.id,
        nom: armaD.nom, bando: def.bando, tocadas: 1, respuesta: true, encuentro: true,
        desde: pDef, indirecto: !!armaD.indirecto, hora: h });
      disparadoras.add(def.id);
    }
    procesados.add(atac.id); procesados.add(def.id);
    for (const x of [atac, def]) if (!vivo(x)) detener(x.id, h);
  };
  const resolverMina = (mi: any) => {
    const u: any = U.get(mi.id), r: any = mi.m.r;
    if (!u) return;
    // ============================================================
    // v2.9.324 — ENTRÓ EN UN CAMPO MINADO. v2.9.440 — MINA POR MINA. Cada
    // detonación se cobra aparte, según el medio y el tipo de campo, y cada una
    // estalla en la película donde saltó. v2.9.443: a la hora en que llegó.
    // ============================================================
    const z: any = r.minado;
    const dets: number[][] = (r.detonaciones || []).length ? r.detonaciones : [[u.lng, u.lat]];
    const n = dets.length, tipoC = tipoDeCampo(z);
    const antes = Math.max(0, Number(u.poder_actual) || 0);
    const nuevo = Math.max(0, antes * (1 - golpeDeMinas(u, z, n)));
    u.poder_actual = Number(nuevo.toFixed(2));
    u.estado = nuevo <= u.poder_max * 0.2 ? "fuera_combate" : (nuevo <= u.poder_max * 0.6 ? "desgastada" : "activa");
    const pct = Math.round((100 * nuevo) / u.poder_max);
    const como = nuevo <= u.poder_max * 0.2 ? "FUERA DE COMBATE" : (nuevo <= u.poder_max * 0.6 ? "DESGASTADA" : "en condiciones");
    textoMinas.set(u.id, ` 💣 ${n} DETONACI${n > 1 ? "ONES" : "ÓN"} EN EL CAMPO MINADO ${NOMBRE_CAMPO[tipoC].toUpperCase()}: `
      + `la vanguardia entró sin saberlo y la orden de alto tardó en llegar a toda la columna. `
      + `Perdió ${(antes - nuevo).toFixed(1)} de poder y quedó ${como} (${pct} %), DETENIDA al borde del campo.`);
    const p = trPos(TR.get(u.id), mi.h);
    eventos.push({ tipo: "obra", lat: p[1], lng: p[0],
      descripcion: `💣 [${hMas(mi.h)}] ${nombreUnidad(u)} entró en un CAMPO MINADO ${NOMBRE_CAMPO[tipoC]}`
        + `${z.bando ? " del " + String(z.bando).toUpperCase() : ""}: ${n} detonaci${n > 1 ? "ones" : "ón"}, `
        + `perdió ${(antes - nuevo).toFixed(1)} de poder (queda ${pct} %) y quedó DETENIDA. `
        + `El obstáculo cumplió: ahora está fija y localizada.`,
      bandos_visibles: ["rojo", "azul"] });
    // La película: las minas estallan cuando la columna llega al borde, una
    // detrás de la otra. Sin `desde`: nadie las tiró, no hay proyectil.
    dets.forEach((q: number[], i: number) => impactos.push({ lng: q[0], lat: q[1], radio: 0.06, arma: "mina",
      nom: tipoC === "ap" ? "Mina AP" : tipoC === "ac" ? "Mina AC" : "Mina", bando: z.bando || null,
      tocadas: 1, mina: true, uid: u.id, orden: i, hora: mi.h }));
    if (!vivo(u)) detener(u.id, mi.h);
  };
  let tAhora = 0;
  for (let vuelta = 0; vuelta < 5000; vuelta++) {
    let prox: any = null;
    const proponer = (h: number, tipo: string, x: any, prio: number) => {
      if (h == null || h > horas + 1e-9) return;
      if (!prox || h < prox.h - 1e-9 || (Math.abs(h - prox.h) <= 1e-9 && prio < prox.prio)) prox = { h, tipo, x, prio };
    };
    for (const mi of minas) {
      if (mi.hecho) continue;
      const tr = TR.get(mi.id);
      if (mi.h > trFin(tr) + 1e-9 || !vivo(U.get(mi.id))) { mi.hecho = true; continue; }   // la frenaron antes de llegar al campo
      proponer(Math.max(mi.h, tAhora), "mina", mi, 0);
    }
    for (const f of fuegos) {
      if (f.hecho) continue;
      if (f.h === undefined || sucios.has(f.o.unidad_id) || (f.o.objetivo_id != null && sucios.has(f.o.objetivo_id))) {
        f.h = horaDeFuego(f, tAhora);
      }
      if (f.h == null) { f.hecho = true; continue; }
      proponer(Math.max(f.h, tAhora), "fuego", f, 1);
    }
    for (const c of candidatos) {
      if (c.hecho) continue;
      if (!vivo(U.get(c.a)) || !vivo(U.get(c.b))) { c.hecho = true; continue; }
      if (c.h === undefined || sucios.has(c.a) || sucios.has(c.b)) {
        c.h = trPrimerAlcance(TR.get(c.a), TR.get(c.b), rango, tAhora, horas);
      }
      if (c.h == null) continue;
      proponer(Math.max(c.h, tAhora), "contacto", c, 2);
    }
    sucios.clear();
    if (!prox) break;
    tAhora = prox.h;
    if (prox.tipo === "mina") { prox.x.hecho = true; resolverMina(prox.x); continue; }
    if (prox.tipo === "fuego") {
      prox.x.hecho = true;
      if (prox.x.o.tipo === "atacar") resolverAtaque(prox.x.o, prox.h); else resolverConcentracion(prox.x.o, prox.h);
      continue;
    }
    const c = prox.x;
    c.hecho = true;
    // v2.9.443 — EL CONTACTO DETIENE: los dos se quedan donde se encontraron.
    for (const [yo, otro] of [[c.a, c.b], [c.b, c.a]]) {
      if (!contactoDe.has(yo)) contactoDe.set(yo, { con: U.get(otro), h: prox.h });
      detener(yo, prox.h);
    }
    const k = claveP(c.a, c.b);
    if (paresHechos.has(k)) continue;   // ya cambiaron fuego este turno: sólo quedan en contacto
    paresHechos.add(k);
    resolverEncuentro(c.a, c.b, prox.h);
  }
  // ---- 5) CÓMO TERMINÓ CADA MARCHA ----
  for (const [id, m] of marcha) {
    const u: any = U.get(id), tr = TR.get(id), r: any = m.r;
    const tFin = Math.max(m.inicio, trFin(tr));
    const corto = tr.tStop < tr.tt[tr.tt.length - 1] - 1e-9;
    const { pts, tt } = trHasta(tr, tFin);
    const p = pts[pts.length - 1];
    u.lng = p[0]; u.lat = p[1];
    const consumo = trValor(tr, tr.cons, tFin);
    const batido = trValor(tr, tr.bat, tFin);
    // v2.9.225 — COMBUSTIBLE ACUMULADO DESDE EL PRINCIPIO.
    u.combustible_km = Number((m.usadoAntes + consumo).toFixed(2));
    const cont = contactoDe.get(id);
    if (corto) {
      const km = largoKm(pts);
      const f = r.avanzadoKm > 0 ? Math.min(1, km / r.avanzadoKm) : 0;
      for (const k of Object.keys(r.porClase || {})) r.porClase[k] = r.porClase[k] * f;
      r.avanzadoKm = km; r.horasUsadas = Math.max(0, tFin - m.inicio);
      r.consumoKm = consumo; r.kmBatido = batido; r.llego = false; r.detenida = true; r.seco = false;
      r.minado = null; r.detonaciones = [];
      r.consumidos = (r.llegadas || []).filter((t: number) => t + m.inicio <= tFin + 1e-9).length;
      if (cont) {
        r.motivo = `entró EN CONTACTO con ${nombreUnidad(cont.con)} a ${hMas(cont.h)} y se detuvo ahí`
          + (cont.h <= m.inicio + 1e-6 ? " (ya estaba en contacto: para salir hay que ordenar ROMPER CONTACTO)" : "");
      } else if (!vivo(u)) r.motivo = "quedó FUERA DE COMBATE en la marcha";
    }
    r.usadoAntes = m.usadoAntes;
    const _rt = ralearConTiempos(pts, tt, 60);
    trazas.push({ id: u.id, bando: u.bando, designacion: u.designacion || null,
      ruta: _rt.ruta, tt: _rt.tt, horas: Math.max(0, tFin - m.inicio), km: Number((r.avanzadoKm || 0).toFixed(2)),
      llego: !!r.llego, detenida: !!r.detenida, destino: [m.o.destino_lng, m.o.destino_lat],
      consumidos: r.consumidos || 0, inicio: m.inicio,
      // v2.9.440: la frenó un campo minado — la marcha NO sigue sola el turno que viene.
      minado: !!r.minado,
      // v2.9.443: la detuvo un contacto — tampoco sigue sola.
      contacto: !!cont, auto: m.o.auto || null });
  }
  // La bitácora de cada marcha (después del turno entero: «a la vista de» y
  // «en contacto con» dependen de dónde quedaron todos).
  const eventosMov: any[] = [];
  for (const [id, m] of marcha) {
    const u: any = U.get(id), r: any = m.r;
    const avisos = avisosPosicion(u, [...U.values()], terreno, rango);
    // v2.9.225: además de qué pasó, CÓMO fue la marcha y qué costó.
    const marchaTxt = textoMarcha(u, r, r.usadoAntes);
    // v2.9.226 — CRUZAR UNA ZONA INTERDICTADA SE PAGA.
    let castigo = "";
    if ((r.kmBatido || 0) > 0.05 && vivo(u)) {
      const bono = bonoDefensa([u.lng, u.lat], terreno);
      const perd = Math.min(0.6, (INTERDICCION_POR_KM * r.kmBatido) / bono);
      const antes = poderEfectivo(u);
      const nuevo = Math.max(0, antes * (1 - perd));
      u.poder_actual = Number(nuevo.toFixed(2));
      u.estado = nuevo <= u.poder_max * 0.2 ? "fuera_combate" : (nuevo <= u.poder_max * 0.6 ? "desgastada" : "activa");
      castigo = ` ⛔ CRUZÓ ${r.kmBatido.toFixed(1)} km de ZONA INTERDICTADA: perdió ${(antes - nuevo).toFixed(0)} `
        + `y quedó ${nuevo <= u.poder_max * 0.2 ? "FUERA DE COMBATE" : (nuevo <= u.poder_max * 0.6 ? "DESGASTADA" : "en condiciones")} `
        + `(${Math.round((100 * nuevo) / u.poder_max)} %).`;
    }
    castigo += textoMinas.get(id) || "";
    // v2.9.440 — PASÓ POR UNA OBRA DEL PLAN DE BARRERAS QUE ESTÁ PROYECTADA.
    const tr = TR.get(id);
    const proy = obrasProyectadasEnRuta(trHasta(tr, trFin(tr)).pts, terreno, u.bando);
    if (proy.length) {
      eventosMov.push({ tipo: "obra", lat: u.lat, lng: u.lng,
        descripcion: `📐 ${nombreUnidad(u)} pasó por ${proy.map((t: any) => "«" + nombreObraPlan(t) + "»").join(", ")} `
          + `del plan de barreras, que está PROYECTADO: todavía no está construido y no la frenó. Si en esta fase `
          + `ya está hecho, construilo en ⚙️ Configurar → 🛡️ Plan de barreras: desde ahí detiene y frena.`,
        bandos_visibles: [] });
    }
    const auto = m.o.auto === "sigue" ? "🔁 (siguió sola la marcha del turno anterior) "
      : m.o.auto === "apoyar" ? (cargaDe(u, "EVAC") > 0 ? "🚑 (va a evacuar, por camino) "
        : cargaDe(u, "REEMP") > 0 ? "👥 (lleva reemplazos, por camino) " : "🚚 (va a abastecer, por camino) ")
      : m.o.auto === "camino" ? "🔁 (sigue por el camino) "
      : m.o.auto === "volver" ? `↩️ (vuelve por camino${m.o.hacia ? " a " + m.o.hacia : ""}) ` : "";
    eventosMov.push({ tipo: "movimiento", lat: u.lat, lng: u.lng,
      descripcion: auto + textoMovimiento(u, r) + (marchaTxt ? " " + marchaTxt : "") + castigo
        + (avisos.length ? " " + avisos.join(" · ") : ""),
      bandos_visibles: [u.bando] });
  }
  // Unidades SIN orden de marcha que quedaron fijadas por un contacto: se dice.
  const det = detectar([...U.values()], terreno, disparadoras);
  // ============================================================
  // v2.9.325 — SE JUZGA LA TAREA, no sólo se cuenta lo que pasó.
  // ============================================================
  const _vivas = [...U.values()];
  const _enemigoMasCerca = (x: any) => {
    let d: any = null;
    for (const e of _vivas as any[]) {
      if (!e || e.bando === x.bando || poderEfectivo(e) <= 0) continue;
      const k = haversineKm([x.lng, x.lat], [e.lng, e.lat]);
      if (d == null || k < d) d = k;
    }
    return d;
  };
  // ¿Alguna unidad propia BATE por fuego el punto de la obra?
  const _obraBatida = new Set<any>();
  for (const id of _obraTerminada) {
    const z: any = U.get(id as any);
    if (!z) continue;
    const t: any = ordenes.find((o: any) => o.unidad_id === id && o.tipo === "zapa");
    const pt = t && t.destino_lng != null ? [t.destino_lng, t.destino_lat] : [z.lng, z.lat];
    for (const a of _vivas as any[]) {
      if (!a || a.bando !== z.bando || a.id === z.id || poderEfectivo(a) <= 0) continue;
      const arma: any = armaDeFuego(a, null);
      if (!arma || !arma.alcance) continue;
      if (haversineKm([a.lng, a.lat], pt) <= arma.alcance) { _obraBatida.add(id); break; }
    }
  }
  // v2.9.448 — LO PERDIDO EN EL TURNO SON HOMBRES: heridos que esperan evacuación y
  // muertos. Y el herido que espera se agrava (el 1,5 % por hora muere).
  {
    const ajustadosIds = new Set(ajustados.map((c: any) => c.u.id));
    for (const u of U.values()) {
      if (!u || esConvoy(u)) continue;
      const a: any = _antes.get(u.id);
      const pm = Math.max(0, num(u.poder_max));
      const c: any = { ...(u.carga || {}) };
      const perd = (a && !ajustadosIds.has(u.id)) ? Math.max(0, num(a.poder_actual) - num(u.poder_actual)) : 0;
      if (perd > 1e-6 && pm > 0) {
        const bajas = Math.round((perd / pm) * hombresDe(u));
        const her = Math.round(bajas * HERIDOS_PCT);
        c.bajas = num(c.bajas) + bajas; c.heridos = herDe(u) + her;
        c.muertos = num(c.muertos) + (bajas - her); c.faltan = num(c.faltan) + bajas;
      }
      const esperan = num(c.heridos);
      if (esperan > 0) {
        const antesM = num(c.muertos);
        const mueren = Math.min(esperan, esperan * MUERE_H * horas);
        c.heridos = Math.round((esperan - mueren) * 100) / 100;
        c.muertos = Math.round((antesM + mueren) * 100) / 100;
        const n = Math.floor(c.muertos) - Math.floor(antesM);
        if (n >= 1) eventos.push({ tipo: "pedido", bando: u.bando, lat: u.lat, lng: u.lng,
          descripcion: `⚠️ ${nombreUnidad(u)}: ${n === 1 ? "murió 1 herido" : `murieron ${n} heridos`} esperando evacuación (quedan ${Math.round(c.heridos)}).`,
          bandos_visibles: [u.bando] });
      }
      u.carga = c;
    }
  }
  // v2.9.447 — LA CLASE I SE CONSUME (un día cada 24 h); sin raciones ni agua, hambre.
  // Antes de reabastecer: lo que llega al final de la jornada ya encuentra el gasto.
  for (const u of U.values()) {
    if (!u || esConvoy(u) || u.estado === "fuera_combate") continue;
    const r = racionDe(u) - horas / 24;
    const c: any = { ...(u.carga || {}), racion: Math.max(0, Math.round(r * 100) / 100) };
    if (r < 0) {
      const pm = Math.max(0, Number(u.poder_max) || 0), antes = Math.max(0, Number(u.poder_actual) || 0);
      const nuevo = Math.max(0, antes - pm * HAMBRE_PCT_DIA * Math.min(horas, -r * 24) / 24);
      c.hambre = Math.round(((Number(c.hambre) || 0) + antes - nuevo) * 100) / 100;
      u.poder_actual = Number(nuevo.toFixed(2));
      u.estado = nuevo <= pm * 0.2 ? "fuera_combate" : (nuevo <= pm * 0.6 ? "desgastada" : "activa");
    }
    u.carga = c;
  }
  // v2.9.334 — FINAL DE JORNADA: SE REABASTECE. Las que voló el fuego ya no reparten nada.
  const _instal = _instalTodas.filter((x: any) => !instalBorrar.includes(x.id));
  const _convoyes: any[] = [...U.values()].filter(esConvoy);
  // v2.9.335 — EL CONVOY DESTRUIDO SE LLEVA SU CARGA.
  for (const cv of _convoyes) {
    if (cv.estado !== "fuera_combate") continue;
    const perdidas = cargaTotal(cv);
    if (perdidas <= 0) continue;
    cv.carga = { ...(cv.carga || {}) }; for (const k of CONVOY_CLASES) cv.carga[k] = 0;
    const aBordo = num(cv.carga.aBordo);   // v2.9.448: los heridos que llevaba la ambulancia
    if (aBordo > 0) { cv.carga.muertos = num(cv.carga.muertos) + aBordo; cv.carga.aBordo = 0; }
    eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
      descripcion: `💥 ${nombreUnidad(cv)} fue destruido con ${perdidas.toFixed(1)} carga(s) a bordo. `
        + (aBordo > 0 ? `Murieron los ${Math.round(aBordo)} heridos que evacuaba.`
          : `Ese abastecimiento NO llega: quien lo esperaba se queda como está.`),
      bandos_visibles: [cv.bando] });
  }
  // v2.9.448 — 🚑 EVACUACIÓN POR CUENTA PROPIA: la unidad a 3 km o menos de un puesto
  // de socorro (o del ASDI) propio lleva sus heridos con sus medios.
  for (const u of U.values()) {
    if (!u || esConvoy(u) || herDe(u) < 1) continue;
    const san = _instal.filter((x: any) => x && x.bando === u.bando && INSTAL_LOG[x.tipo] && INSTAL_LOG[x.tipo].sanidad)
      .map((x: any) => ({ x, d: haversineKm([u.lng, u.lat], puntoInstalacion(x) as number[]) }))
      .filter((o: any) => o.d <= REABASTECER_KM).sort((a: any, b: any) => a.d - b.d)[0];
    if (!san) continue;
    const n = herDe(u);   // todos: los lleva con sus medios
    u.carga = { ...u.carga, heridos: 0, evacuados: Math.round((num(u.carga.evacuados) + n) * 100) / 100 };
    san.x.geojson = { ...(san.x.geojson || {}), recibidos: Math.round((num(san.x.geojson && san.x.geojson.recibidos) + n) * 100) / 100 };
    san.x._sucia = true;
    eventos.push({ tipo: "logistica", bando: u.bando, lat: u.lat, lng: u.lng,
      descripcion: `🚑 ${nombreUnidad(u)} evacuó ${Math.round(n)} herido(s) al ${INSTAL_LOG[san.x.tipo].nom} por sus medios (a ${san.d.toFixed(1)} km).`,
      bandos_visibles: [u.bando] });
  }
  // v2.9.444 — CUÁNTO ESTUVO PARADO CADA CONVOY (sólo parado descarga) y el que
  // llegó a su punto de abastecimiento empieza a descargar desde la hora en que llegó.
  const horasConvoy = new Map<any, number>();
  for (const cv of _convoyes) {
    if (cv.estado === "fuera_combate") continue;
    const tr = TR.get(cv.id);
    const quietoDesde = tr ? Math.max(0, Math.min(horas, trFin(tr))) : 0;
    const m = marcha.get(cv.id);
    const enMarcha = m && !m.r.llego && !m.r.detenida && !(tr && tr.tStop < Infinity);
    horasConvoy.set(cv.id, enMarcha ? 0 : Math.max(0, horas - quietoDesde));
    const c = cv.carga || {};
    if (m && m.o.auto === "apoyar" && m.r.llego && c.fase === "ida") {
      const x: any = U.get(c.apoya);
      const dP = x ? haversineKm([cv.lng, cv.lat], [x.lng, x.lat]) : Infinity;
      cv.carga = { ...c, fase: "descarga", llegoH: quietoDesde, resta: horasDescarga(cv, x), dParada: dP, entrego: 0 };
      eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
        descripcion: dP <= REABASTECER_KM
          ? `🚚 ${nombreUnidad(cv)} llegó a ${dP.toFixed(1)} km de ${nombreUnidad(x)} (${hMas(quietoDesde)}): ${cargaDe(cv, "EVAC") > 0 ? "carga heridos" : "descarga"} ~${horasATexto(cv.carga.resta)}.`
          : `⛔ ${nombreUnidad(cv)} paró en el camino a ${dP.toFixed(1)} km de ${nombreUnidad(x)}: lejos para descargar. `
            + `Espera ${horasATexto(cv.carga.resta)}; si la unidad no se acerca a ${REABASTECER_KM} km, vuelve.`,
        bandos_visibles: [cv.bando] });
    }
  }
  // v2.9.351 — LA DESCARGA SE VE. v2.9.443 — y alcanza para todos los que estén cerca.
  const entregas: any[] = [];
  const { reg, porFuente } = repartirAbastecimiento([...U.values()], _instal, horasConvoy);
  for (const e of reg.values()) {
    const u = e.u;
    eventos.push({ tipo: "logistica", bando: u.bando, lat: u.lat, lng: u.lng,
      descripcion: textoAbastecido(e), bandos_visibles: [u.bando] });
    entregas.push({ uid: u.id, bando: u.bando, designacion: u.designacion || null, lng: u.lng, lat: u.lat,
      clases: [...e.clases], aDomicilio: !!e.aDomicilio, de: e.de.join(" + ") });
  }
  for (const hf of porFuente) {
    const f = hf.f;
    const quienes = [...hf.unidades].map((x: any) => nombreUnidad(x)).join(", ");
    if (f.convoy) {
      const cv = f.convoy, queda = cargaTotal(cv);
      if (cv.carga) cv.carga.entrego = r3((Number(cv.carga.entrego) || 0) + hf.cargas);
      eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
        descripcion: `🚚 ${nombreUnidad(cv)} descargó ${hf.cargas.toFixed(1)} carga(s) en ${horasATexto(hf.horas)} a ${quienes}`
          + `${hf.parcial ? " (no alcanzó para todo)" : (hf.sigue ? " (sigue descargando)" : "")} · `
          + (queda > 1e-6 ? `le quedan ${queda.toFixed(1)}.` : `quedó VACÍO.`),
        bandos_visibles: [cv.bando] });
    } else if (f.instal) {
      const cap = capDe(f.instal), quedan = Math.max(0, cap - usadoDe(f.instal));
      const aviso = quedan <= 1e-6 ? ` ⛔ ${f.nom} quedó AGOTADO — hay que reponerlo del escalón superior.`
        : (quedan <= Math.max(1, cap * 0.25) ? ` ⚠️ Le quedan ${quedan.toFixed(1)} de ${cap} cargas.` : "");
      eventos.push({ tipo: "logistica", bando: f.bando, lat: f.pt[1], lng: f.pt[0],
        descripcion: `🏭 ${f.nom} entregó ${hf.cargas.toFixed(1)} carga(s) a ${quienes}.${aviso}`,
        bandos_visibles: [f.bando] });
    }
  }
  // v2.9.448 — 🚑 LAS AMBULANCIAS CARGAN HERIDOS: 20 cada 30 min, primero los de la
  // unidad que fueron a buscar y después los de las propias a 3 km o menos.
  for (const cv of _convoyes) {
    const c = cv.carga || {};
    if (cv.estado === "fuera_combate" || c.fase !== "descarga" || cargaDe(cv, "EVAC") <= 0) continue;
    let h = num(horasConvoy.get(cv.id)), lugar = lugarAmbulancia(cv), cargo = 0;
    const de: string[] = [];
    const cerca = [...U.values()].filter((u: any) => u && !esConvoy(u) && u.bando === cv.bando && herDe(u) >= 1
      && haversineKm([u.lng, u.lat], [cv.lng, cv.lat]) <= REABASTECER_KM)
      .sort((a: any, b: any) => (String(b.id) === String(c.apoya) ? 1 : 0) - (String(a.id) === String(c.apoya) ? 1 : 0));
    for (const u of cerca) {
      if (lugar < 1 || h <= 1e-6) break;
      const n = Math.round(Math.min(herDe(u), lugar, (h / HORAS_DESCARGA.EVAC) * HERIDOS_POR_CARGA) * 100) / 100;
      if (n < 0.5) continue;
      u.carga = { ...u.carga, heridos: Math.round((herDe(u) - n) * 100) / 100, evacuados: Math.round((num(u.carga.evacuados) + n) * 100) / 100 };
      lugar -= n; cargo += n; h -= (n / HERIDOS_POR_CARGA) * HORAS_DESCARGA.EVAC;
      de.push(`${Math.round(n)} de ${nombreUnidad(u)}`);
    }
    if (cargo > 0) {
      cv.carga = { ...c, aBordo: Math.round((num(c.aBordo) + cargo) * 100) / 100 };
      eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
        descripcion: `🚑 ${nombreUnidad(cv)} cargó ${Math.round(cargo)} herido(s) (${de.join(", ")}) · lleva ${Math.round(num(cv.carga.aBordo))} de ${cargaDe(cv, "EVAC") * HERIDOS_POR_CARGA}.`,
        bandos_visibles: [cv.bando] });
    }
  }
  // v2.9.444 — EL QUE DESCARGA, CUENTA SU TIEMPO. Terminado (o vacío, o sin nadie
  // más a quien darle), vuelve solo por el camino a su instalación.
  for (const cv of _convoyes) {
    const c = cv.carga || {};
    if (c.fase !== "descarga" || cv.estado === "fuera_combate") continue;
    const resta = Math.max(0, (Number(c.resta) || 0) - (Number(horasConvoy.get(cv.id)) || 0));
    const x: any = c.apoya != null ? U.get(c.apoya) : null;
    const cerca = x && poderEfectivo(x) > 0 && haversineKm([cv.lng, cv.lat], [x.lng, x.lat]) <= REABASTECER_KM;
    const amb = cargaDe(cv, "EVAC") > 0;   // v2.9.448: la ambulancia carga heridos, no descarga
    const leFalta = cerca && (amb ? (herDe(x) >= 0.5 && lugarAmbulancia(cv) >= 0.5)
      : ["III", "V", "I", "REEMP"].some((k) =>
        (k === "I" ? cargaDe(cv, "I") + cargaDe(cv, "AGUA") : cargaDe(cv, k)) > 1e-6 && necesidad(x, k, 1) > 1e-3));
    const vacio = amb ? lugarAmbulancia(cv) < 0.5 : cargaTotal(cv) <= 1e-6;
    if (!vacio && resta > 1e-6 && (leFalta || !cerca)) { cv.carga = { ...c, resta }; continue; }
    const dio = Number(c.entrego) || 0, lleva = num(c.aBordo);
    cv.carga = { ...c, fase: "vuelta", apoya: null, resta: null };
    eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
      descripcion: amb
        ? (lleva >= 0.5 ? `🚑 ${nombreUnidad(cv)} terminó de cargar (${Math.round(lleva)} herido(s)): los lleva a su puesto por camino.`
          : `↩️ ${nombreUnidad(cv)} vuelve SIN heridos: ${x ? nombreUnidad(x) + " no se acercó" : "la unidad no está"}`
            + `${x ? ` (quedó a ${haversineKm([cv.lng, cv.lat], [x.lng, x.lat]).toFixed(1)} km)` : ""}.`)
        : dio > 1e-6
        ? `↩️ ${nombreUnidad(cv)} terminó la descarga (${dio.toFixed(1)} carga(s)): vuelve a su instalación por camino.`
        : `↩️ ${nombreUnidad(cv)} vuelve SIN descargar: ${x ? nombreUnidad(x) + " no se acercó" : "la unidad no está"}`
          + `${x ? ` (quedó a ${haversineKm([cv.lng, cv.lat], [x.lng, x.lat]).toFixed(1)} km)` : ""}.`,
      bandos_visibles: [cv.bando] });
  }
  // Y el convoy que volvió a la instalación completa sus cargas de la estiba.
  if (_instal.length) {
    for (const cv of _convoyes) {
      const rec = recargarConvoy(cv, _instal);
      // v2.9.444: el que volvía y llegó queda listo, esperando orden del G-4.
      if (cv.carga && cv.carga.fase === "vuelta" && (rec || cercaDeSuInstalacion(cv, _instal))) {
        // v2.9.448 — la ambulancia entrega sus heridos en el puesto.
        const lleva = num(cv.carga.aBordo);
        if (lleva >= 0.5) {
          const san = _instal.find((x: any) => x && x.bando === cv.bando && INSTAL_LOG[x.tipo] && INSTAL_LOG[x.tipo].sanidad
            && haversineKm([cv.lng, cv.lat], puntoInstalacion(x) as number[]) <= REABASTECER_KM) || null;
          if (san) { san.geojson = { ...(san.geojson || {}), recibidos: num(san.geojson && san.geojson.recibidos) + lleva }; san._sucia = true; }
          eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
            descripcion: `🚑 ${nombreUnidad(cv)} entregó ${Math.round(lleva)} herido(s) en ${san ? INSTAL_LOG[san.tipo].nom : "su puesto"}. Lista para salir.`,
            bandos_visibles: [cv.bando] });
        }
        cv.carga = { ...cv.carga, fase: null, entrego: 0, aBordo: 0 };
      }
      if (!rec) continue;
      eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
        descripcion: rec.texto, bandos_visibles: [cv.bando] });
    }
  }
  // v2.9.445 — 📻 LOS COMANDANTES PIDEN (al cerrar la jornada, ya abastecido lo que llegó).
  eventos.push(...pedidosDelTurno(_antes, U));
  for (const o of ordenes) {
    if (!o || !o.tarea || !TAREAS[o.tarea]) continue;
    const u: any = U.get(o.unidad_id);
    if (!u) continue;
    const ev = evaluarTarea(o, {
      antes: _antes, despues: U, turno: estado.turno, rango,
      pelearon: new Set([...disparadoras, ...procesados]),
      detectadas: (det as any)[u.bando] || new Set(),
      obraTerminada: _obraTerminada, obraBatida: _obraBatida,
      enArea: (pt: number[], tipo: string) => enArea(pt, terreno, tipo),
      enemigoMasCerca: _enemigoMasCerca,
      enemigosCerca: (x: any) => (_vivas as any[]).filter((e: any) => e && e.bando !== x.bando
        && poderEfectivo(e) > 0
        && haversineKm([x.lng, x.lat], [e.lng, e.lat]) <= alcanceObs(x, terreno)).length,
    });
    const txt = ev && textoTarea(u, o, ev);
    if (txt) {
      eventos.push({ tipo: "tarea", bando: u.bando, lat: u.lat, lng: u.lng,
        descripcion: txt, bandos_visibles: [u.bando] });
    }
  }
  // v2.9.344: las instalaciones cuya estiba bajó este turno, para persistirlas.
  const instalActualizar = _instalTodas.filter((x: any) => x && x._sucia && !instalBorrar.includes(x.id))
    .map((x: any) => ({ id: x.id, geojson: x.geojson }));
  // Las órdenes NUEVAS que quedan guardadas (la marcha que siguió sola): así la
  // cadena sigue el turno siguiente aunque nadie la vuelva a mandar.
  const ordenesGuardar = ordenesNuevas.map((o: any) => ({ unidad_id: o.unidad_id, bando: o.bando, tipo: o.tipo,
    destino_lng: o.destino_lng, destino_lat: o.destino_lat, ruta: (o.ruta || []).slice(0, 60),
    tarea: o.tarea || null, proposito: o.proposito || null }));
  return { unidades: [...U.values()].map((x: any) => { const { _suprimida, ...resto } = x; return resto; }),
    eventos: [...eventosMov, ...eventos], trazas, impactos, entregas, zonas, zonasBorrar, instalBorrar,
    instalActualizar, ordenesGuardar, detecciones: { rojo: [...det.rojo], azul: [...det.azul] } };
}
// v2.9.222 — CÓMO QUEDÓ CADA UNIDAD, con nombre y en palabras. La ficha se ve
// punteada y transparente cuando queda fuera de combate, pero eso no se
// explicaba: se veía desvanecer a la unidad que había DISPARADO y parecía que
// la habían destruido a ella.
function estadoEnPalabras(u: any, baja: any) {
  const max = Number(u.poder_max) || 1;
  const pct = Math.round((100 * baja.poderNuevo) / max);
  if (baja.estado === "fuera_combate") return `FUERA DE COMBATE (${pct} % — se retira del tablero)`;
  if (baja.estado === "desgastada") return `DESGASTADA (${pct} %)`;
  return `en condiciones (${pct} %)`;
}
function aplicarCombate(res: any, U: Map<any, any>, eventos: any[], defensor: any, atacantes?: any[], arma?: any, resp?: any, hora?: string | null) {
  if (res.resultado === "sin_combate") return;
  const antes = new Map<any, number>();
  for (const baja of res.bajas) {
    const u: any = U.get(baja.id);
    if (u) antes.set(baja.id, Number(u.poder_actual) || 0);
  }
  for (const baja of res.bajas) {
    const u: any = U.get(baja.id);
    if (u) { u.poder_actual = baja.poderNuevo; u.estado = baja.estado; }
  }
  const atacs = (atacantes || []).filter(Boolean);
  const quienes = atacs.length ? atacs.map(nombreUnidad).join(" + ") : "Una unidad";
  const conQue = arma ? ` con ${arma.nom}` : "";
  const comoQuedo = res.bajas.map((b: any) => {
    const u: any = U.get(b.id);
    if (!u) return null;
    const perd = Math.max(0, (antes.get(b.id) || 0) - b.poderNuevo);
    return `${nombreUnidad(u)} → ${estadoEnPalabras(u, b)}${perd > 0 ? `, perdió ${perd.toFixed(0)}` : ""}`;
  }).filter(Boolean).join(" · ");
  // v2.9.223: se cuenta si hubo FUEGO CRUZADO o si el blanco no llegaba.
  let intercambio = "";
  if (resp) {
    intercambio = resp.puede
      ? (resp.cerca
        // v2.9.443: en el combate de encuentro se cierra la distancia: no se compara el alcance.
        ? ` ${nombreUnidad(defensor)} RESPONDIÓ el fuego con ${resp.arma.nom} y todo lo que tenía para pelear de cerca: hubo fuego cruzado y se desgastaron los dos.`
        : ` ${nombreUnidad(defensor)} RESPONDIÓ el fuego con ${resp.arma.nom} (${resp.arma.alcance} km, y el tiro vino de ${resp.d.toFixed(1)} km): hubo fuego cruzado y se desgastaron los dos.`)
      : (resp.seco
        ? ` ${nombreUnidad(defensor)} NO PUDO RESPONDER: ${resp.arma.nom} SIN MUNICIÓN — lo batieron sin costo para el tirador.`
        : ` ${nombreUnidad(defensor)} NO PUDO RESPONDER: su mayor alcance es ${resp.arma ? resp.arma.alcance + " km" : "nulo"} y el fuego vino de ${resp.d.toFixed(1)} km — por eso el tirador no sufrió bajas.`);
  }
  eventos.push({ tipo: "combate", lat: defensor.lat, lng: defensor.lng,
    descripcion: `⚔️ ${hora ? `[${hora}] ` : ""}${quienes} abrió fuego sobre ${nombreUnidad(defensor)}${conQue} — `
      + `relación ${res.ratio != null ? res.ratio.toFixed(1) : "?"}:1 → ${res.resultado.replace(/_/g, " ")}.`
      + intercambio + " " + comoQuedo + ".",
    bandos_visibles: ["rojo", "azul"], ratio: res.ratio, resultado: res.resultado });
}

// v2.9.226: anillo geodésico para materializar la faja interdictada como
// polígono (la base guarda geometría, no radios).
function anilloKm(lng: number, lat: number, km: number, n = 32) {
  const pts: number[][] = [];
  const R = 6371, dLat = (km / R) * (180 / Math.PI);
  const dLng = dLat / Math.max(1e-6, Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return pts;
}

// ============================================================
// Sesión / autorización
// ============================================================
type Sesion = { id: string; tabla: string; rol: string; nombre: string };
async function validarSesion(token: string): Promise<Sesion | null> {
  const { data: ses } = await sb.from("sesiones").select("usuario_id, usuario_tabla, expira_en, revocado").eq("token", token).limit(1);
  if (!ses || !ses.length) return null;
  const s = ses[0];
  if (s.revocado || new Date(s.expira_en) < new Date()) return null;
  if (s.usuario_tabla === "profesores") {
    const { data: p } = await sb.from("profesores").select("nombre_completo, rol, activo").eq("id", s.usuario_id).limit(1);
    if (!p || !p.length || p[0].activo === false) return null;
    return { id: s.usuario_id, tabla: "profesores", rol: p[0].rol || "", nombre: p[0].nombre_completo || "" };
  }
  if (s.usuario_tabla === "cursantes") {
    const { data: c } = await sb.from("cursantes").select("nombre_completo, activo").eq("id", s.usuario_id).limit(1);
    if (!c || !c.length || c[0].activo === false) return null;
    return { id: s.usuario_id, tabla: "cursantes", rol: "", nombre: c[0].nombre_completo || "" };
  }
  return null;
}
async function getPartida(id: any) {
  const { data } = await sb.from("wg_partidas").select("*").eq("id", id).limit(1);
  return data && data[0] ? data[0] : null;
}
function esArbitro(partida: any, ses: Sesion) {
  return ses.tabla === "profesores" && (partida.arbitro_id === ses.id || partida.creada_por === ses.id);
}
// v2.9.280 — busca un bando POR SU NOMBRE (rojo|azul), para poder reusar su
// clave en vez de rotarla en cada llamada a `agregar_bando`.
async function bandoPorBando(partidaId: any, bando: string) {
  const { data } = await sb.from("wg_bandos").select("*")
    .eq("partida_id", partidaId).eq("bando", bando).limit(1);
  return data && data[0] ? data[0] : null;
}
// Devuelve el bando que controla el caller (por su clave), o null.
async function bandoPorClave(partidaId: any, clave: string) {
  if (!clave) return null;
  const { data } = await sb.from("wg_bandos").select("*").eq("partida_id", partidaId).eq("clave_acceso", clave).limit(1);
  return data && data[0] ? data[0] : null;
}

// ============================================================
// v2.9.201 — RED DE SEGURIDAD. Si algo revienta fuera de un try/catch, Deno
// devuelve un 500 SIN cuerpo JSON y sin cabeceras CORS: el navegador solo ve
// "Edge Function returned a non-2xx status code" y el motivo se pierde. Con
// esto, cualquier falla imprevista sale como {ok:false,error:"..."} legible.
// ============================================================
// v2.9.449 — ⏱️ EL RELOJ DEL JUEGO Y EL ⏹️ ALTO DEL JEM.
// Sergio (03-11-2026): «debe ser un juego donde el G-3, G-4, G-2 estén moviendo sus
// fichas a todo dar para tomar decisiones en ese momento, y lanzar un resultado
// cuando el JEM diga ALTO… cómo quedaron las unidades, la potencia relativa de
// combate y todo eso».
//   · El RELOJ: el turno corre solo cada N minutos (lo pone el árbitro o el JEM).
//     Vive en una fila de wg_terreno (tipo «reloj», con bando para que no cuente
//     como carta ni se mezcle con las obras): todas las pantallas ven la misma
//     cuenta regresiva. Cada turno resuelto la reinicia.
//   · La FOTO del poder de cada bando al iniciar (y al aplicar el arranque):
//     contra eso se compara al ALTO.
//   · El ALTO cierra la partida («finalizada»): ya no hay órdenes y se levanta la
//     niebla para que todos vean los resultados. El árbitro puede reanudarla.
// ============================================================
async function relojDe(pid: any) {
  const { data } = await sb.from("wg_terreno").select("id, geojson").eq("partida_id", pid).eq("tipo", "reloj").limit(1);
  return (data && data[0]) || null;
}
async function guardarReloj(pid: any, fila: any, g: any) {
  if (fila) return await sb.from("wg_terreno").update({ geojson: g }).eq("id", fila.id).eq("partida_id", pid);
  return await sb.from("wg_terreno").insert({ partida_id: pid, tipo: "reloj", bando: "azul", geojson: g });
}
function fotoPoder(uds: any[], turno: any) {
  const f: any = { turno: Number(turno) || 0, azul: 0, rojo: 0, azulMax: 0, rojoMax: 0 };
  for (const u of uds || []) {
    if (!u || u.arma === CONVOY_ARMA || (u.bando !== "azul" && u.bando !== "rojo")) continue;
    f[u.bando] += Math.max(0, Number(u.poder_actual) || 0);
    f[u.bando + "Max"] += Math.max(0, Number(u.poder_max) || 0);
  }
  for (const k of ["azul", "rojo", "azulMax", "rojoMax"]) f[k] = Math.round(f[k] * 10) / 10;
  return f;
}
async function fotoInicial(pid: any, turno: any) {
  const { data: uds } = await sb.from("wg_unidades").select("bando, arma, poder_actual, poder_max").eq("partida_id", pid).limit(2000);
  const fila = await relojDe(pid);
  const g = { ...((fila && fila.geojson) || {}), inicio: fotoPoder(uds || [], turno) };
  await guardarReloj(pid, fila, g);
}
// ============================================================
// v2.9.451 — FORMAR UN CONVOY EN UNA INSTALACIÓN: lo usan el G-4 de carne
// («formar_convoy») y el 🤖 automático. La carga sale de la estiba del puesto
// (v2.9.443); la fila en memoria baja también, porque el turno que se está
// resolviendo la sigue usando.
// ============================================================
async function formarConvoyEn(pid: any, f: any, clase: string, designacion?: any, extra?: any) {
  const I = INSTAL_LOG[f.tipo];
  const paquete = clase === "PAQUETE";
  const despacha: string[] = I.despacha || [];
  const clases = paquete ? ["III", "V", "I"].filter((k) => despacha.includes(k)) : [clase];
  const pt = puntoInstalacion(f);
  if (!pt) return { error: "Esa instalación no tiene posición", status: 400 };
  const porClase = paquete ? CONVOY_PAQUETE : CONVOY_CAPACIDAD;
  const quiere = porClase * clases.length;
  const hay = Math.max(0, capDe(f) - usadoDe(f));
  if (hay <= 1e-6) return { error: `${I.nom} está AGOTADO: no tiene con qué cargar el convoy. Lo repone el escalón superior (árbitro: 📦 Reponer).`, status: 400 };
  const fr = Math.min(1, hay / quiere);
  const carga: any = {};
  for (const k of CONVOY_CLASES) carga[k] = 0;
  for (const k of clases) carga[k] = Number((porClase * fr).toFixed(3));
  carga.cap = Object.fromEntries(clases.map((k) => [k, porClase]));
  carga.origen = f.id;
  if (extra) Object.assign(carga, extra);
  const gU = { ...(f.geojson || {}), usado: Number((usadoDe(f) + quiere * fr).toFixed(3)) };
  const { error: eEst } = await sb.from("wg_terreno").update({ geojson: gU }).eq("id", f.id).eq("partida_id", pid);
  if (eEst) return { error: `No se pudo descontar la estiba: ${eEst.message}`, status: 500 };
  f.geojson = gU;
  const bandoCv = f.bando;
  const { count } = await sb.from("wg_unidades").select("id", { count: "exact", head: true })
    .eq("partida_id", pid).eq("bando", bandoCv).eq("arma", CONVOY_ARMA);
  const desig = String(designacion || "").trim().slice(0, 30)
    || `Cnv-${paquete ? "PQ" : clase}-${(Number(count) || 0) + 1}`;
  // v2.9.347 — EL CONVOY FORMA AFUERA DEL PUESTO, NO ENCIMA: cada uno sale en un
  // rumbo distinto para que no se apilen bajo el símbolo de la instalación.
  const nCv = Number(count) || 0;
  const RAD_SALIDA_KM = 0.6;
  const ang = (nCv * 55) * Math.PI / 180;
  const dLat = (RAD_SALIDA_KM / 111.32) * Math.cos(ang);
  const dLng = (RAD_SALIDA_KM / (111.32 * Math.max(0.15, Math.cos(pt[1] * Math.PI / 180)))) * Math.sin(ang);
  // v2.9.451: el del 🤖 G-4 automático sale del puesto mismo, que está sobre el camino.
  // En «CE-IV9» el desvío de 600 m le hacía cruzar un río sin puente antes de entrar a la ruta.
  const sale = extra && extra.auto ? [pt[0], pt[1]] : [pt[0] + dLng, pt[1] + dLat];
  const fila: any = {
    partida_id: pid, bando: bandoCv, designacion: desig, escalon: "seccion",
    arma: CONVOY_ARMA, medio: "motor", lat: sale[1], lng: sale[0],
    poder_max: CONVOY_PODER, poder_actual: CONVOY_PODER, obs_km: CONVOY_OBS_KM,
    estado: "activa", combustible_km: 0, carga,
  };
  const { data, error } = await sb.from("wg_unidades").insert(fila).select("id").limit(1);
  if (error) return { error: error.message, status: 500 };
  const id = data && data[0] ? data[0].id : null;
  return { id, designacion: desig, carga, fila: { ...fila, id },
    estiba: { cap: capDe(f), quedan: Number(Math.max(0, capDe(f) - gU.usado).toFixed(2)) } };
}
// ============================================================
// v2.9.451 — 🤖 EL G-4 AUTOMÁTICO, la parte que escribe en la base. Decide el motor
// (`planG4`); acá se forman los convoyes de verdad (con id y estiba) y sus órdenes
// entran al turno como las de cualquier jugador. Si el bando no tiene ninguna
// instalación que despache, instala UNA VEZ su Área de Servicios (si se la destruyen,
// se quedó sin logística). Lo que no pudo atender se dice una sola vez: mientras
// siga igual no se repite (`g4firma`, que no viaja a los bandos).
// Vive en la fila del reloj: `g4auto` = { rojo, azul } (por defecto, sólo el rojo).
// ============================================================
function g4AutoDe(g: any) {
  const a = (g && g.g4auto) || {};
  return { rojo: a.rojo !== false, azul: a.azul === true };
}
// La fila del reloj tal como la ven las pantallas: sin la memoria del G-4 (que nombra
// las unidades a las que no les llega nada: eso no lo ve el otro bando).
function relojPublico(g: any) {
  if (!g) return null;
  const { g4firma: _f, ...resto } = g;
  return { ...resto, g4auto: g4AutoDe(g) };
}
async function g4Automatico(pid: any, unidades: any[], terreno: any[], instalLog: any[], ordenes: any[], eventos: any[]) {
  const fila = await relojDe(pid);
  const g: any = (fila && fila.geojson) || {};
  const cfg: any = g4AutoDe(g);
  if (!cfg.rojo && !cfg.azul) return;
  const firma: any = { ...(g.g4firma || {}) }, instalo: any = { ...(g.g4instalo || {}) };
  const antes = JSON.stringify([firma, instalo]);
  const nom = (u: any) => String((u && u.designacion) || "").trim() || nombreUnidad(u);   // la línea ya dice el bando
  for (const b of ["rojo", "azul"]) {
    if (!cfg[b]) continue;
    const ico = b === "rojo" ? "🔴" : "🔵";
    const decir = (texto: string, p?: number[] | null) => eventos.push({ tipo: "logistica", bando: b,
      lng: p ? p[0] : null, lat: p ? p[1] : null, descripcion: `🤖 G-4 ${ico}: ${texto}`, bandos_visibles: [b] });
    const tiene = instalLog.some((x: any) => x && x.bando === b && INSTAL_LOG[x.tipo] && (INSTAL_LOG[x.tipo].despacha || []).length);
    if (!tiene && !instalo[b]) {
      const a = anclaLogistica(b, unidades, terreno);
      if (a) {
        const geo = { type: "Point", coordinates: a.pt, nota: "🤖 G-4 automático" };
        const { data, error } = await sb.from("wg_terreno").insert({ partida_id: pid, tipo: G4_INSTAL, bando: b, geojson: geo })
          .select("id").limit(1);
        if (!error && data && data[0]) {
          instalLog.push({ id: data[0].id, tipo: G4_INSTAL, bando: b, geojson: geo });
          instalo[b] = true;
          decir(`instaló su ${INSTAL_LOG[G4_INSTAL].nom} `
            + (a.dCamino != null && a.dCamino > 0.05 ? `sobre el camino, a ${a.dCamino.toFixed(1)} km de ${nom(a.ref)}` : `junto a ${nom(a.ref)}`)
            + ` — ${INSTAL_LOG[G4_INSTAL].cap} cargas de estiba, y no hay más.`, a.pt);
        }
      }
    }
    const plan = planG4(b, unidades, instalLog, terreno, ordenes);
    for (const f of plan.formar) {
      const r: any = await formarConvoyEn(pid, f.instal, f.clase, "", { auto: true });
      if (r.error || r.id == null) continue;
      unidades.push(r.fila);
      ordenes.push({ id: null, unidad_id: r.id, bando: b, tipo: "apoyar", objetivo_id: f.para.id, g4: f.motivo });
    }
    for (const a of plan.asignar) {
      ordenes.push({ id: null, unidad_id: a.convoy.id, bando: b, tipo: "apoyar", objetivo_id: a.para.id, g4: a.motivo });
    }
    // Lo que no pudo atender: sólo lo NUEVO.
    const clave = (x: any) => `${x.u.id}|${x.k}|${x.por}`;
    const ya = new Set(firma[b] || []);
    const nuevas = plan.faltan.filter((x: any) => !ya.has(clave(x)));
    firma[b] = plan.faltan.map(clave).sort();
    const quienes = (xs: any[]) => [...new Set(xs.map((x: any) => nom(x.u)))].slice(0, 6).join(", ");
    const clases = (xs: any[]) => [...new Set(xs.map((x: any) => G4_CLASE_TXT[x.k]))].join(", ");
    const est = nuevas.filter((x: any) => x.por === "estiba");
    if (est.length) decir(`sin estiba para ${clases(est)} (${quienes(est)}). La repone el escalón superior (árbitro: 📦 Reponer).`);
    const sinI = nuevas.filter((x: any) => x.por === "instal");
    if (sinI.length) decir(`no tiene de dónde sacar ${clases(sinI)} (${quienes(sinI)}).`);
    const vistas = new Set<any>();
    for (const x of nuevas.filter((x: any) => x.por === "camino")) {
      if (vistas.has(x.u.id)) continue;
      vistas.add(x.u.id);
      decir(`${nom(x.u)} ${x.km != null ? `queda a ${x.km.toFixed(1)} km del camino` : "no tiene camino desde sus puestos"}: `
        + `no le llega abastecimiento hasta que se acerque.`, [Number(x.u.lng), Number(x.u.lat)]);
    }
  }
  if (JSON.stringify([firma, instalo]) !== antes) {
    await guardarReloj(pid, fila, { ...g, g4firma: firma, g4instalo: instalo });
  }
}

Deno.serve(async (req: Request) => {
  try {
    return await manejar(req);
  } catch (e: any) {
    console.error("wargame-ops falla no controlada:", e);
    return err(`Falla interna: ${e?.message || e}`, 500);
  }
});

async function manejar(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Método no permitido", 405);
  let body: any;
  try { body = await req.json(); } catch { return err("JSON inválido"); }
  const { accion, token } = body;
  // ============================================================
  // v2.9.274 — ENTRADA POR ENLACE, SÓLO CON NOMBRE (pedido de Sergio).
  // «quiero que generes un QR y un enlace para que se entre como un bando…
  //  por el momento quiero que me dejes entrar sólo con nombre; luego los
  //  alumnos podrán ingresar con su CI y contraseña.»
  //
  // Hasta acá TODA acción exigía token de sesión de SIDECEME, así que un
  // alumno sin cuenta no podía ni mirar. Pero fijate cómo está armado esto:
  // el bando NO sale de la sesión, sale de `clave_acceso` (ver `bandoPorClave`).
  // La sesión sólo servía para saber si sos ÁRBITRO. O sea que dejar entrar por
  // clave no debilita nada: quien tiene la clave del bando ya tenía derecho a
  // jugar ese bando, con cuenta o sin ella.
  //
  // Los dos cerrojos que quedan puestos:
  //   1) Un invitado sólo puede hacer las acciones DE SU BANDO. Nunca crear
  //      partidas, configurar bandos, colocar unidades ni resolver el turno.
  //   2) `esArbitro` exige `ses.tabla === "profesores"`, y acá la tabla es
  //      "invitado": no hay forma de que un enlace te vuelva árbitro.
  // ============================================================
  // v2.9.278 — «No se pudo resolver: Necesitás el enlace de tu bando».
  // Ese cartel era ESTA lista. En la 277 abrí `resolver_turno` a los bandos…
  // pero la puerta de invitado se cierra ANTES, y `resolver_turno` no estaba
  // acá. O sea que el permiso nuevo no lo alcanzaba a usar nadie que entrara
  // por enlace o con la sesión vencida — que son los dos casos reales de
  // Sergio. Los bandos seguían sin poder mover, con otro mensaje.
  // v2.9.282: `pulso` y `replay` son las dos piezas de la sincronización del
  // COMBATE. Si no están acá, el bando que entró por enlace no puede sondear ni
  // pedir el replay — o sea, justo el que más lo necesita (trampa nº 10).
  const ACCIONES_INVITADO = ["estado", "historial", "enviar_orden", "apuntar_dron", "resolver_turno",
    "pulso", "replay",
    // v2.9.286: subir y borrar posiciones enemigas es trabajo del Estado Mayor,
    // no del árbitro — tiene que poder hacerlo quien entró por enlace.
    "reportar_contacto", "borrar_contacto",
    // v2.9.317: las instalaciones del G-4 las ubica el Estado Mayor, no el árbitro.
    "colocar_instalacion", "quitar_instalacion", "mover_instalacion",
    // v2.9.335: el convoy lo forma el G-4, que muchas veces entra por enlace.
    "formar_convoy",
    // v2.9.449: el JEM (por enlace) maneja el reloj y da el ALTO.
    "reloj", "alto"];
  let ses: any = token ? await validarSesion(token) : null;
  let invitado: any = null;
  if (!ses) {
    const nom = String(body.invitado_nombre || "").trim();
    const cl = String(body.clave_acceso || "").trim().toLowerCase();
    if (nom && cl && body.partida_id && ACCIONES_INVITADO.includes(accion)) {
      const b = await bandoPorClave(Number(body.partida_id), cl);
      if (b) {
        invitado = { bando: b.bando, nombre: nom.slice(0, 80) };
        ses = { id: null, tabla: "invitado", rol: "invitado", nombre: invitado.nombre };
      }
    }
    if (!ses) {
      return err(token
        ? "Sesión no válida. Volvé a entrar."
        : "Necesitás el enlace de tu bando (con su clave) o entrar a SIDECEME.", 403);
    }
  }

  // ---------- crear_partida (profesor que arbitra) ----------
  if (accion === "crear_partida") {
    if (ses.tabla !== "profesores" || !ARBITRAN.includes(ses.rol)) return err("Solo un instructor puede crear partidas", 403);
    const nombre = (body.nombre || "").trim();
    if (!nombre) return err("Falta el nombre de la partida");
    const { data, error } = await sb.from("wg_partidas").insert({
      nombre: nombre.slice(0, 200), ejercicio: body.ejercicio ? String(body.ejercicio).slice(0, 200) : null,
      duracion_turno_horas: body.duracion_turno_horas != null ? Number(body.duracion_turno_horas) : 2,
      arbitro_id: ses.id, creada_por: ses.id, estado: "planificacion", turno_actual: 0,
    }).select("id").limit(1);
    if (error) return err(error.message, 500);
    return ok({ id: data?.[0]?.id });
  }

  // ---------- listar_partidas (mías como árbitro) ----------
  if (accion === "listar_partidas") {
    const { data } = await sb.from("wg_partidas").select("id, nombre, ejercicio, estado, turno_actual, creada_en")
      .or(`arbitro_id.eq.${ses.id},creada_por.eq.${ses.id}`).order("creada_en", { ascending: false }).limit(100);
    return ok({ partidas: data || [] });
  }

  // ---------- acciones sobre una partida ----------
  const partida = body.partida_id ? await getPartida(body.partida_id) : null;
  // v2.9.282: `pulso` y `replay` leen `partida.*` — sin este guardia, pedirlos
  // sin `partida_id` reventaba con un 500 mudo en vez de un 404 claro.
  if (["agregar_bando", "agregar_unidad", "importar_escenario", "cargar_terreno", "iniciar", "resolver_turno", "enviar_orden", "estado", "historial", "pulso", "replay",
       "reportar_contacto", "borrar_contacto",
       // v2.9.317 — ⚠️ SON DOS LISTAS. Si una acción falta ACÁ, el 500 es mudo.
       "colocar_instalacion", "quitar_instalacion", "mover_instalacion",
       "formar_convoy",
       // v2.9.440: del árbitro, nunca de un invitado (no va en la otra lista).
       "plan_barreras",
       // v2.9.443: del árbitro.
       "actualizar_medios", "actualizar_carta", "reponer_instalacion"].includes(accion)) {
    if (!partida) return err("Partida no encontrada", 404);
  }
  const arbitro = partida ? esArbitro(partida, ses) : false;

  // ---- ÁRBITRO: configurar ----
  if (accion === "agregar_bando") {
    if (!arbitro) return err("Solo el árbitro configura los bandos", 403);
    const bando = body.bando === "rojo" ? "rojo" : body.bando === "azul" ? "azul" : null;
    if (!bando) return err("Bando inválido (rojo|azul)");
    // ============================================================
    // v2.9.280 — LA CLAVE NO SE ROTA SOLA. ÉSTE es el bug de «el rojo no puede
    // mover y el azul sí».
    // Esta línea inventaba una clave NUEVA en cada llamada. Y el botón se llama
    // «Crear/VER bando» y «Invitar»: Sergio lo tocó dos veces para el ROJO (una
    // para crearlo, otra para sacar el QR) y en la segunda le cambió la clave
    // por debajo. El Estado Mayor ROJO quedó con un enlace viejo: el servidor
    // ya no lo reconocía y le contestaba «necesitás el enlace de tu bando».
    // El AZUL funcionaba porque su clave no se volvió a tocar después de entrar.
    //
    // Ahora: si el bando ya existe, se REUSA su clave. Sólo se genera una nueva
    // cuando el bando no existía, o cuando se pide el cambio a propósito
    // (`regenerar: true`) — que es lo que hace el botón «🔄 Regenerar», y que
    // ahí sí tiene sentido: sirve para revocar un enlace que se filtró.
    // ============================================================
    const previo = await bandoPorBando(partida.id, bando);
    const clave = (
      body.clave_acceso ||
      (previo && !body.regenerar ? previo.clave_acceso : null) ||
      Math.random().toString(36).slice(2, 8)
    ).toLowerCase();
    const { error } = await sb.from("wg_bandos").upsert({
      partida_id: partida.id, bando, nombre: body.nombre ? String(body.nombre).slice(0, 120) : null,
      grupo_id: body.grupo_id != null ? Number(body.grupo_id) : null, clave_acceso: clave,
    }, { onConflict: "partida_id,bando" });
    if (error) return err(error.message, 500);
    return ok({ bando, clave_acceso: clave });
  }
  if (accion === "agregar_unidad") {
    if (!arbitro) return err("Solo el árbitro coloca unidades", 403);
    const u = body.unidad || {};
    if (u.lat == null || u.lng == null || !u.bando) return err("Faltan lat/lng/bando de la unidad");
    const poder = Number(u.poder_max) || 1;
    const { data, error } = await sb.from("wg_unidades").insert({
      partida_id: partida.id, bando: u.bando, designacion: u.designacion || null, escalon: u.escalon || null,
      arma: u.arma || null, medio: u.medio || "motor", lat: u.lat, lng: u.lng,
      poder_max: poder, poder_actual: poder, obs_km: u.obs_km != null ? Number(u.obs_km) : 4, estado: "activa",
    }).select("id").limit(1);
    if (error) return err(error.message, 500);
    // v2.9.431 — AVISAR SI LA FICHA CAE EN TERRENO QUE SU MEDIO NO CRUZA. Así
    // nació el caso de la DIV-1 de «qwert»: colocada dentro de un sector
    // restringido, después sólo podía salir a paso de hombre y nadie entendía
    // por qué un motorizado andaba por ahí. No se prohíbe (el árbitro manda),
    // pero se dice en el acto.
    let aviso: string | null = null;
    try {
      const { data: terr } = await todasLasFilas(() => sb.from("wg_terreno").select("tipo, geojson")   // v2.9.439
        .eq("partida_id", partida.id).in("tipo", ["restringido", "severo", "via", "hidro"]).is("bando", null).order("id", { ascending: true }));
      const medio = medioDe({ medio: u.medio || "motor", arma: u.arma });
      const clase = claseTerreno([Number(u.lng), Number(u.lat)], prepararTerreno(terr || []));
      if ((VEL[medio] || VEL.pie)[clase] == null) {
        aviso = `La ficha quedó DENTRO de ${NOM_CLASE[clase] || "terreno " + clase}, `
          + `que «${medio}» NO cruza: desde ahí sólo va a poder SALIR a paso de hombre `
          + `hacia terreno transitable. Si no es lo que querés, movela a campo abierto o a un camino.`;
      }
    } catch (_e) { /* el aviso es ayuda, no requisito */ }
    return ok({ id: data?.[0]?.id, aviso });
  }
  // ---------- importar_escenario (PUENTE con el Generador de Calcos) ----------
  // v2.9.201 — se llama POR TANDAS: el terreno real de un ejercicio pesa ~1,3 MB
  // (615 polígonos) y no entra en un solo pedido. El frontend manda `limpiar:true`
  // en la PRIMERA tanda (borra unidades y terreno anteriores) y después el resto
  // sin esa marca. Sólo se toca lo que viene en la tanda.
  if (accion === "importar_escenario") {
    if (!arbitro) return err("Solo el árbitro importa el escenario", 403);
    const unidades = Array.isArray(body.unidades) ? body.unidades : [];
    const terreno = Array.isArray(body.terreno) ? body.terreno : [];
    if (body.limpiar) {
      // Reemplazar el escenario es EMPEZAR DE NUEVO: si no se borran también las
      // órdenes, los eventos y las detecciones, quedan apuntando a unidades que
      // ya no existen. Por eso la partida vuelve a 'planificacion', turno 0.
      // (Antes esto se resolvía prohibiendo importar con la partida en curso, y
      // dejaba al árbitro sin salida: ni importar ni vaciar.)
      const { error: eBu } = await sb.from("wg_unidades").delete().eq("partida_id", partida.id);
      if (eBu) return err(`No se pudieron borrar las unidades anteriores: ${eBu.message}`, 500);
      const { error: eBt } = await sb.from("wg_terreno").delete().eq("partida_id", partida.id);
      if (eBt) return err(`No se pudo borrar el terreno anterior: ${eBt.message}`, 500);
      await sb.from("wg_ordenes").delete().eq("partida_id", partida.id);
      await sb.from("wg_detecciones").delete().eq("partida_id", partida.id);
      await sb.from("wg_eventos").delete().eq("partida_id", partida.id);
      const { error: eBp } = await sb.from("wg_partidas")
        .update({ estado: "planificacion", turno_actual: 0 }).eq("id", partida.id);
      if (eBp) return err(`No se pudo volver la partida a planificación: ${eBp.message}`, 500);
    }
    let nU = 0, nT = 0;
    let avisoMedios: string | null = null;
    if (unidades.length) {
      const filas = unidades.filter((u: any) => u.lat != null && u.lng != null && u.bando).map((u: any) => {
        const poder = Number(u.poder_max) || 1;
        const fila: any = { partida_id: partida.id, bando: u.bando === "rojo" ? "rojo" : "azul",
          designacion: u.designacion ? String(u.designacion).slice(0, 120) : null, escalon: u.escalon || null,
          arma: u.arma || null, medio: u.medio || "motor", lat: Number(u.lat), lng: Number(u.lng),
          poder_max: poder, poder_actual: poder, obs_km: u.obs_km != null ? Number(u.obs_km) : 4, estado: "activa" };
        // v2.9.439 — LOS MEDIOS DE LA UNIDAD (COE, planeamiento del G-4) y lo que
        // ya trae cargado. `municion` y `combustible_km` son columnas de siempre.
        const medios = limpiarMedios(u.medios);
        if (medios) fila.medios = medios;
        const mun = limpiarMunicion(u.municion);
        if (mun) fila.municion = mun;
        const cKm = Number(u.combustible_km);
        if (Number.isFinite(cKm) && cKm > 0) fila.combustible_km = Math.min(5000, cKm);
        return fila;
      });
      if (filas.length) {
        let { error } = await sb.from("wg_unidades").insert(filas);
        // v2.9.439: si la base todavía no tiene la columna `medios` (falta correr
        // supabase/wargame/002_medios_unidades.sql), las unidades entran igual,
        // con el armamento del catálogo, y se avisa en vez de cortar la importación.
        if (error && /medios/i.test(error.message || "") && filas.some((f: any) => f.medios)) {
          ({ error } = await sb.from("wg_unidades").insert(filas.map(({ medios: _m, ...f }: any) => f)));
          if (!error) avisoMedios = "La base todavía no tiene la columna «medios» de wg_unidades: las unidades entraron con el armamento del catálogo. Corré supabase/wargame/002_medios_unidades.sql y volvé a importar.";
        }
        if (error) return err(`Unidades: ${error.message}`, 500);
      }
      nU = filas.length;
    }
    if (terreno.length) {
      // DOCTRINALES: los usa el motor (bonos de defensa y movilidad) → sólo polígonos.
      // VISUALES: sólo se dibujan (ríos, curvas de nivel, caminos, poblados…). El
      // motor los ignora porque no son ninguno de los tres tipos doctrinales, así
      // que pueden ser líneas o puntos y viajan por la misma tabla — sin SQL nuevo.
      const filas = terreno
        .filter((t: any) => {
          if (!t.geojson || !t.geojson.type) return false;
          if (TIPOS_DOCTRINA.includes(t.tipo)) return t.geojson.type === "Polygon" || t.geojson.type === "MultiPolygon";
          return TIPOS_VISUALES.includes(t.tipo);
        })
        .map((t: any) => {
          const fila: any = { partida_id: partida.id, tipo: t.tipo, geojson: t.geojson };
          // v2.9.439 — EL PLAN DE BARRERAS ES DE UN BANDO. Con `bando` viaja como
          // las obras (v2.9.324): su dueño lo ve siempre y conoce los pasos; el
          // otro bando lo descubre cuando lo tiene a la vista o se lo topa. Antes
          // entraba sin bando y el enemigo recibía el plan de barreras entero.
          if ((t.bando === "azul" || t.bando === "rojo") && TIPOS_OBRA_DE_BANDO.includes(t.tipo)) fila.bando = t.bando;
          return fila;
        });
      if (filas.length) { const { error } = await sb.from("wg_terreno").insert(filas); if (error) return err(`Terreno: ${error.message}`, 500); }
      nT = filas.length;
    }
    // Totales acumulados, para que el frontend muestre el avance real.
    const { count: totU } = await sb.from("wg_unidades").select("id", { count: "exact", head: true }).eq("partida_id", partida.id);
    const { count: totT } = await sb.from("wg_terreno").select("id", { count: "exact", head: true }).eq("partida_id", partida.id);
    return ok({ unidades: nU, terreno: nT, total_unidades: totU || 0, total_terreno: totT || 0,
      aviso_medios: avisoMedios });
  }
  if (accion === "cargar_terreno") {
    if (!arbitro) return err("Solo el árbitro carga el terreno", 403);
    const t = body.terreno || {};
    if (!t.tipo || !t.geojson) return err("Falta tipo/geojson del terreno");
    const { error } = await sb.from("wg_terreno").insert({ partida_id: partida.id, tipo: t.tipo, geojson: t.geojson });
    if (error) return err(error.message, 500);
    return ok();
  }
  // ---------- plan_barreras (v2.9.440) ----------
  // El árbitro da el plan de barreras por CONSTRUIDO (desde ya detiene y frena
  // al enemigo) o lo vuelve a PROYECTADO, en cualquier turno y sin reimportar.
  // Se cambian las filas en su lugar (mismo `id`): las órdenes, los eventos y
  // las detecciones de la partida no se tocan.
  if (accion === "plan_barreras") {
    if (!arbitro) return err("Sólo el árbitro decide si el plan de barreras está construido", 403);
    const construir = body.estado !== "proyectado";
    const sel = "id, tipo, bando, geojson";
    // Lo proyectado (`obstaculo`) y lo construido del plan (obras con dueño). El
    // CMOC importado no tiene dueño y queda afuera de la segunda consulta.
    const { data: proy, error: e1 } = await todasLasFilas(() => sb.from("wg_terreno").select(sel)
      .eq("partida_id", partida.id).eq("tipo", "obstaculo").order("id", { ascending: true }));
    if (e1) return err(`No se pudo leer el plan de barreras: ${e1.message}`, 500);
    const { data: hechas, error: e2 } = await todasLasFilas(() => sb.from("wg_terreno").select(sel)
      .eq("partida_id", partida.id).in("tipo", OBSTACULO_TIPOS).not("bando", "is", null).order("id", { ascending: true }));
    if (e2) return err(`No se pudo leer el plan de barreras: ${e2.message}`, 500);
    const cambios = planDeBarreras([...(proy || []), ...(hechas || [])], construir);
    for (const c of cambios) {
      const { error: eU } = await sb.from("wg_terreno").update({ tipo: c.tipo, bando: c.bando, geojson: c.geojson })
        .eq("id", c.id).eq("partida_id", partida.id);
      if (eU) return err(`No se pudo ${construir ? "construir" : "volver a proyectar"} «${c.geojson.nom}»: ${eU.message}`, 500);
    }
    const plan = [...(proy || []), ...(hechas || [])].filter((t: any) => obraDelPlan(t));
    return ok({ construido: construir, cambiadas: cambios.length, obras: plan.length,
      campos: cambios.filter((c: any) => c.tipo === "minado").length });
  }
  if (accion === "iniciar") {
    if (!arbitro) return err("Solo el árbitro inicia la partida", 403);
    const { error } = await sb.from("wg_partidas").update({ estado: "en_curso", turno_actual: 1 }).eq("id", partida.id);
    if (error) return err(error.message, 500);
    await fotoInicial(partida.id, 1);   // v2.9.449: contra esto se compara al ALTO
    return ok({ turno: 1 });
  }

  // ---- EM: identificar bando por clave (o árbitro ve todo) ----
  const miBando = arbitro ? null : await bandoPorClave(partida?.id, body.clave_acceso || "");
  const puedeVer = arbitro || !!miBando;

  // ---------- enviar_orden (EM de su bando) ----------
  // ---------- apuntar_dron (v2.9.232) ----------
  // Apuntar el dron NO es una orden de turno: es una decisión de vigilancia que
  // vale desde ya y hasta que se cambie. Por eso va aparte de `enviar_orden` y
  // no espera a que se resuelva el turno.
  if (accion === "apuntar_dron") {
    if (!partida) return err("Partida no encontrada", 404);
    if (!arbitro && !miBando) return err("Clave de bando inválida", 403);
    const uid = body.unidad_id;
    const { data: us } = await sb.from("wg_unidades").select("id, bando").eq("id", uid).eq("partida_id", partida.id).limit(1);
    const u = us && us[0];
    if (!u) return err("Unidad no encontrada", 404);
    if (!arbitro && u.bando !== miBando.bando) return err("Esa unidad no es de tu bando", 403);
    // `null` repliega el dron; cualquier número se normaliza a 0..360.
    const rumbo = body.rumbo == null || body.rumbo === ""
      ? null
      : (((Number(body.rumbo) || 0) % 360) + 360) % 360;
    const { error } = await sb.from("wg_unidades").update({ dron_rumbo: rumbo }).eq("id", uid);
    if (error) return err(error.message, 500);
    return ok({ dron_rumbo: rumbo });
  }

  if (accion === "enviar_orden") {
    if (partida.estado !== "en_curso") return err("La partida no está en curso");
    if (!arbitro && !miBando) return err("Clave de bando inválida", 403);
    const o = body.orden || {};
    // La unidad debe ser del bando del caller (o el árbitro puede ordenar a cualquiera).
    const { data: us } = await sb.from("wg_unidades").select("id, bando, estado").eq("id", o.unidad_id).eq("partida_id", partida.id).limit(1);
    const u = us && us[0];
    if (!u) return err("Unidad no encontrada", 404);
    if (!arbitro && u.bando !== miBando.bando) return err("Esa unidad no es de tu bando", 403);
    if (u.estado === "fuera_combate") return err("La unidad está fuera de combate");
    // v2.9.219: `fuego` = concentración sobre un PUNTO (usa destino_lat/lng),
    // a diferencia de `atacar`, que empeña a una ficha (usa objetivo_id).
    // v2.9.225: `replegar` = romper contacto y retirarse sin empeñar.
    // v2.9.443: `apoyar` = el convoy queda agregado a una unidad propia (la sigue y
    // la abastece); `defender` también sirve de ⏹ ALTO para cortar una marcha que
    // seguía sola.
    const tipo = ["mover", "atacar", "defender", "fuego", "replegar", "zapa", "apoyar"].includes(o.tipo) ? o.tipo : null;
    if (!tipo) return err("Tipo de orden inválido (mover|atacar|defender|fuego|replegar|zapa|apoyar)");
    if (tipo === "apoyar") {
      const { data: ux } = await sb.from("wg_unidades").select("id, arma").eq("id", o.unidad_id).limit(1);
      if (!ux || !ux[0] || ux[0].arma !== CONVOY_ARMA) return err("Sólo un convoy se agrega para apoyar a una unidad");
      const { data: obj } = await sb.from("wg_unidades").select("id, bando, arma, estado").eq("id", o.objetivo_id).eq("partida_id", partida.id).limit(1);
      const x = obj && obj[0];
      if (!x || x.bando !== u.bando) return err("El convoy apoya a una unidad PROPIA");
      if (x.arma === CONVOY_ARMA) return err("Un convoy no apoya a otro convoy");
      if (x.estado === "fuera_combate") return err("Esa unidad está fuera de combate");
    }
    // v2.9.217 — EL ARMA ELEGIDA SE GUARDA. El frontend la manda desde v2.9.214,
    // pero acá se tiraba a la basura porque `wg_ordenes` no tenía la columna: por
    // eso el motor «no la leía». Se acepta sólo un id del catálogo; cualquier otra
    // cosa entra como null y el motor toma el sistema de mayor alcance.
    const arma = typeof o.arma === "string" && ARMAS[o.arma] ? o.arma : null;
    // v2.9.220 — LA RUTA COMPLETA. Sin esto sólo viajaba el primer punto y la
    // unidad avanzaba de hito en hito, un turno por tramo. Se sanea acá: sólo
    // pares [lng,lat] numéricos y un tope, para que nadie mande basura.
    const ruta = Array.isArray(o.ruta)
      ? o.ruta.filter((p: any) => Array.isArray(p) && p.length >= 2
          && Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])))
          .slice(0, 60).map((p: any) => [Number(p[0]), Number(p[1])])
      : null;
    // Una orden por unidad por turno. v2.9.430: antes era «borrar la previa y
    // crear la nueva» en dos pasos; dos envíos con 20 ms de diferencia pasaban
    // los dos por el borrado antes de que ninguno insertara, y quedaban DOS
    // órdenes. Ahora es un solo UPSERT sobre la clave única (partida, turno,
    // unidad) — índice `wg_ordenes_unica_por_turno`, ver supabase/wargame/001.
    const { error } = await sb.from("wg_ordenes").upsert({
      partida_id: partida.id, turno: partida.turno_actual, bando: u.bando, unidad_id: o.unidad_id,
      tipo, destino_lat: o.destino_lat ?? null, destino_lng: o.destino_lng ?? null, objetivo_id: o.objetivo_id ?? null,
      arma,
      // v2.9.234: qué obra pidió la orden de zapa (validada contra el catálogo).
      obra: typeof o.obra === "string" && OBRAS[o.obra] ? o.obra : null,
      ruta: ruta && ruta.length ? ruta : null,
      // v2.9.226: misión del fuego de artillería.
      mision: ["destruccion", "interdiccion", "neutralizacion"].includes(o.mision) ? o.mision : null,
      // v2.9.325 — LA TAREA TÁCTICA Y SU PROPÓSITO. La tarea se valida contra el
      // catálogo (una inventada entra como null y el motor no la evalúa); el
      // propósito es texto libre del cursante —es SU intención, no un menú— y se
      // recorta para que nadie use la columna de bloc de notas.
      tarea: typeof o.tarea === "string" && TAREAS[o.tarea] ? o.tarea : null,
      proposito: typeof o.proposito === "string" && o.proposito.trim()
        ? o.proposito.trim().slice(0, 300) : null,
      // v2.9.223: hora de arranque dentro del turno (matriz de sincronización).
      inicio: Number.isFinite(Number(o.inicio)) ? Math.max(0, Number(o.inicio)) : null,
      estado: "pendiente",
    }, { onConflict: "partida_id,turno,unidad_id" });
    if (error) {
      // Si la clave única todavía no está creada (falta correr el SQL 001), se
      // cae al camino viejo de borrar + insertar en vez de rechazar la orden.
      if (String((error as any).code) !== "42P10") return err(error.message, 500);
      const fila: any = {
        partida_id: partida.id, turno: partida.turno_actual, bando: u.bando, unidad_id: o.unidad_id,
        tipo, destino_lat: o.destino_lat ?? null, destino_lng: o.destino_lng ?? null, objetivo_id: o.objetivo_id ?? null,
        arma, obra: typeof o.obra === "string" && OBRAS[o.obra] ? o.obra : null,
        ruta: ruta && ruta.length ? ruta : null,
        mision: ["destruccion", "interdiccion", "neutralizacion"].includes(o.mision) ? o.mision : null,
        tarea: typeof o.tarea === "string" && TAREAS[o.tarea] ? o.tarea : null,
        proposito: typeof o.proposito === "string" && o.proposito.trim() ? o.proposito.trim().slice(0, 300) : null,
        inicio: Number.isFinite(Number(o.inicio)) ? Math.max(0, Number(o.inicio)) : null,
        estado: "pendiente",
      };
      await sb.from("wg_ordenes").delete().eq("partida_id", partida.id).eq("turno", partida.turno_actual).eq("unidad_id", o.unidad_id);
      const { error: e2 } = await sb.from("wg_ordenes").insert(fila);
      if (e2) return err(e2.message, 500);
    }
    return ok();
  }

  // ---------- v2.9.449 — ⏱️ reloj · ⏹️ alto · ▶️ reanudar ----------
  if (accion === "reloj") {
    if (!puedeVer) return err("Sin acceso", 403);
    if (partida.estado !== "en_curso") return err("La partida no está en curso");
    const fila = await relojDe(partida.id);
    const cadaMin = Math.max(1, Math.min(30, Number(body.cada_min) || Number(fila && fila.geojson && fila.geojson.cadaMin) || 3));
    const activo = !!body.activo;
    const g: any = { ...((fila && fila.geojson) || {}), activo, cadaMin,
      proximo: activo ? Date.now() + cadaMin * 60000 : null, turnoEn: partida.turno_actual };
    const { error } = await guardarReloj(partida.id, fila, g);
    if (error) return err(`No se pudo guardar el reloj: ${error.message}`, 500);
    await sb.from("wg_eventos").insert({ partida_id: partida.id, turno: partida.turno_actual, tipo: "aviso",
      descripcion: activo ? `⏱️ RELOJ: el turno corre solo cada ${cadaMin} min. ¡A dar órdenes!` : `⏸️ RELOJ en pausa.`,
      bandos_visibles: ["azul", "rojo"] });
    return ok({ reloj: relojPublico(g) });   // v2.9.451: sin la memoria del G-4
  }
  if (accion === "alto") {
    if (!puedeVer) return err("Sin acceso", 403);
    if (partida.estado !== "en_curso") return err("La partida no está en curso");
    const fila = await relojDe(partida.id);
    const { data: uds } = await sb.from("wg_unidades").select("bando, arma, poder_actual, poder_max").eq("partida_id", partida.id).limit(2000);
    const quien = String(body.invitado_nombre || (ses && ses.nombre) || "el JEM").slice(0, 80);
    const g: any = { ...((fila && fila.geojson) || {}), activo: false, proximo: null,
      alto: { turno: partida.turno_actual, en: new Date().toISOString(), quien, final: fotoPoder(uds || [], partida.turno_actual) } };
    if (!g.inicio) g.inicio = { turno: 1, azul: g.alto.final.azulMax, rojo: g.alto.final.rojoMax,
      azulMax: g.alto.final.azulMax, rojoMax: g.alto.final.rojoMax, sinFoto: true };
    await guardarReloj(partida.id, fila, g);
    const { error } = await sb.from("wg_partidas").update({ estado: "finalizada" }).eq("id", partida.id);
    if (error) return err(error.message, 500);
    await sb.from("wg_eventos").insert({ partida_id: partida.id, turno: partida.turno_actual, tipo: "aviso",
      descripcion: `⏹️ ALTO — ${quien} terminó el juego de guerra en el turno ${partida.turno_actual}. Resultados a la vista.`,
      bandos_visibles: ["azul", "rojo"] });
    return ok({ reloj: relojPublico(g) });   // v2.9.451: sin la memoria del G-4
  }
  if (accion === "reanudar") {
    if (!arbitro) return err("Sólo el árbitro reanuda una partida terminada", 403);
    if (partida.estado !== "finalizada") return err("La partida no está terminada");
    const { error } = await sb.from("wg_partidas").update({ estado: "en_curso" }).eq("id", partida.id);
    if (error) return err(error.message, 500);
    return ok({ estado: "en_curso" });
  }
  // ---------- v2.9.451 — 🤖 el G-4 automático de un bando (lo decide el árbitro) ----------
  if (accion === "g4auto") {
    if (!arbitro) return err("Sólo el árbitro decide qué logística es automática", 403);
    const b = String(body.bando || "");
    if (b !== "rojo" && b !== "azul") return err("Falta el bando (rojo o azul)");
    const fila = await relojDe(partida.id);
    const g0: any = (fila && fila.geojson) || {};
    const g: any = { ...g0, g4auto: { ...g4AutoDe(g0), [b]: !!body.activo } };
    const { error } = await guardarReloj(partida.id, fila, g);
    if (error) return err(`No se pudo guardar: ${error.message}`, 500);
    await sb.from("wg_eventos").insert({ partida_id: partida.id, turno: partida.turno_actual, tipo: "aviso",
      descripcion: `🤖 La logística del ${b === "rojo" ? "🔴 rojo" : "🔵 azul"} ${body.activo ? "pasa a ser AUTOMÁTICA (G-4 automático)." : "la juega su G-4."}`,
      bandos_visibles: [b] });
    return ok({ reloj: relojPublico(g) });
  }

  // ---------- estado (CON NIEBLA DE GUERRA) ----------
  if (accion === "estado") {
    if (!puedeVer) return err("Clave de bando inválida o no sos el árbitro", 403);
    // ============================================================
    // v2.9.443 — EL ESTADO SE PIDE TODO A LA VEZ. Eran ocho consultas una
    // detrás de la otra en cada refresco de cada pantalla; ahora salen juntas.
    // La carta (MB) sigue viajando sólo cuando la pantalla no la tiene: desde
    // esta versión el navegador la guarda entre sesiones y la vuelve a pedir
    // sólo si cambió su FIRMA (cantidad de filas + la última).
    // ============================================================
    const turnoDet = Math.max(0, (partida.turno_actual || 1) - 1);
    const qOrd = sb.from("wg_ordenes").select("*").eq("partida_id", partida.id).eq("turno", partida.turno_actual);
    const qDet = sb.from("wg_detecciones").select("unidad_id, bando_observador").eq("partida_id", partida.id).eq("turno", turnoDet);
    const [rUni, rBan, rTer, rCnt, rUlt, rIns, rDet, rOrd, rInt, rObr, rRel] = await Promise.all([
      sb.from("wg_unidades").select("*").eq("partida_id", partida.id).limit(2000),
      sb.from("wg_bandos").select("bando, nombre, grupo_id").eq("partida_id", partida.id),
      // v2.9.201: el terreno importado del Generador pesa MB. Se manda una sola
      // vez (primera carga); en los refrescos el frontend pide incluir_terreno:false.
      // v2.9.324 — ⚠️ SÓLO EL TERRENO DE VERDAD (`bando` nulo): las obras y las
      // fajas interdictadas viajan aparte y con niebla, en `obras`.
      // v2.9.439: por páginas (PostgREST corta en 1.000) y lo importante primero.
      body.incluir_terreno !== false
        ? todasLasFilas(() => sb.from("wg_terreno").select("tipo, geojson")
          .eq("partida_id", partida.id).is("bando", null).order("id", { ascending: true }))
        : Promise.resolve(null),
      // v2.9.440 — LA FIRMA DE LA CARTA: un conteo, sin filas…
      sb.from("wg_terreno").select("id", { count: "exact", head: true }).eq("partida_id", partida.id).is("bando", null),
      // …v2.9.443: y la última fila (un cambio que no mueve la cantidad también la cambia).
      sb.from("wg_terreno").select("id").eq("partida_id", partida.id).is("bando", null).order("id", { ascending: false }).limit(1),
      // v2.9.317 — LAS INSTALACIONES DEL G-4 VIAJAN SIEMPRE, APARTE DEL TERRENO.
      sb.from("wg_terreno").select("id, tipo, bando, geojson").eq("partida_id", partida.id).like("tipo", "log\\_%").limit(400),
      (!arbitro && miBando) ? qDet.eq("bando_observador", miBando.bando) : qDet,
      (arbitro || miBando) ? (arbitro ? qOrd : qOrd.eq("bando", miBando.bando)) : Promise.resolve({ data: [] }),
      // v2.9.286 — LA CARTA DEL BANDO: lo que su dron SUBIÓ.
      sb.from("wg_inteligencia").select("bando, unidad_id, nivel, lat, lng, turno, datos, reportado_en")
        .eq("partida_id", partida.id).in("bando", arbitro ? ["rojo", "azul"] : [miBando.bando]),
      // v2.9.324 — LAS OBRAS VIAJAN FRESCAS, APARTE DEL TERRENO, y con niebla.
      // v2.9.439: también el plan de barreras PROYECTADO (`obstaculo` con bando).
      sb.from("wg_terreno").select("id, tipo, bando, geojson, hasta_turno").eq("partida_id", partida.id)
        .not("bando", "is", null).in("tipo", [...TIPOS_MOTOR, "obstaculo"]).order("id", { ascending: true }).limit(1000),
      // v2.9.449: el reloj del juego.
      sb.from("wg_terreno").select("geojson").eq("partida_id", partida.id).eq("tipo", "reloj").limit(1),
    ]);
    const unidades = (rUni as any).data || [];
    const bandos = (rBan as any).data || [];
    const terreno: any[] | null = rTer ? ordenarCarta((rTer as any).data || []) : null;
    const terrenoN = (rCnt as any).count;
    const ultimoId = (((rUlt as any).data || [])[0] || {}).id ?? null;
    const instalaciones = ((rIns as any).data || []).filter((x: any) => arbitro || (miBando && x.bando === miBando.bando));
    // Niebla: el EM ve SUS unidades + enemigos detectados en el último turno resuelto.
    let visibles = unidades || [];
    // v2.9.449: terminado el juego (⏹️ ALTO) no hay niebla: todos ven los resultados.
    if (!arbitro && miBando && partida.estado !== "finalizada") {
      const detectadas = new Set(((rDet as any).data || []).map((d: any) => d.unidad_id));
      // ============================================================
      // v2.9.285 — LO QUE SE VE AHORA, NO SÓLO LO DEL TURNO PASADO.
      // `wg_detecciones` se escribe UNA VEZ por turno, al resolverlo. Entre
      // turno y turno el CW 40 puede volar 40 km y sobrevolar media reserva
      // enemiga sin que aparezca nada: la niebla estaba congelada. Y como el
      // navegador sólo puede dibujar lo que el servidor le manda, el dron NUNCA
      // podía descubrir nada por su cuenta — pasó exactamente eso con el ROJO.
      // Ahora se suma lo que el bando alcanza EN ESTE MOMENTO.
      // ============================================================
      const vivo = idsVisiblesEnVivo(miBando.bando, unidades || []);
      visibles = (unidades || []).filter((u: any) =>
        u.bando === miBando.bando || detectadas.has(u.id) || vivo.has(u.id));
    }
    // v2.9.233 — EL ÁRBITRO PUEDE MIRAR POR LOS OJOS DE CADA BANDO.
    // Él ve TODO (eso no cambia), pero además recibe QUÉ DETECTÓ cada bando, así
    // la pantalla puede mostrarle «lo que ve el azul» o «lo que ve el rojo» sin
    // pedir nada más. Es lo que le permite juzgar si una decisión fue razonable
    // con la información que ese Estado Mayor tenía de verdad.
    let detPorBando: any = null;
    if (arbitro) {
      detPorBando = { rojo: [], azul: [] };
      for (const d of ((rDet as any).data || [])) {
        if (detPorBando[d.bando_observador]) detPorBando[d.bando_observador].push(d.unidad_id);
      }
    }
    // Mis órdenes ya enviadas este turno.
    const misOrdenes: any[] = (rOrd as any).data || [];
    const intel = (rInt as any).data || [];
    const obrasRaw = (rObr as any).data || [];
    const mias = (unidades || []).filter((u: any) =>
      miBando && u.bando === miBando.bando && u.estado !== "fuera_combate");
    const obras = (obrasRaw || []).filter((z: any) => {
      if (z.hasta_turno != null && (partida.turno_actual || 1) > z.hasta_turno) return false;
      if (arbitro) return true;
      if (!miBando) return false;
      if (z.bando === miBando.bando) return true;
      const c = centroDeGeom(z.geojson);
      if (!c) return false;
      return mias.some((u: any) => haversineKm([u.lng, u.lat], c) <= (Number(u.obs_km) || 4));
    });
    return ok({
      partida: { id: partida.id, nombre: partida.nombre, estado: partida.estado, turno_actual: partida.turno_actual, duracion_turno_horas: partida.duracion_turno_horas },
      soy: arbitro ? "arbitro" : miBando.bando, bandos: bandos || [], terreno,
      terreno_n: terrenoN ?? null,   // v2.9.440: la firma de la carta cacheada
      terreno_firma: `${terrenoN ?? 0}:${ultimoId ?? 0}`,   // v2.9.443: cantidad + última fila
      // v2.9.443: se está resolviendo un turno ahora mismo — la pantalla no repinta a medias.
      resolviendo: !!(partida.resolviendo_desde && (Date.now() - new Date(partida.resolviendo_desde).getTime()) < 90000),
      unidades: visibles, ordenes: misOrdenes, inteligencia: intel || [],
      instalaciones,              // v2.9.317: las del G-4, siempre frescas
      obras,                      // v2.9.324: obras y fajas, siempre frescas y con niebla
      detecciones: detPorBando,   // v2.9.233: sólo para el árbitro
      reloj: relojPublico((((rRel as any).data || [])[0] || {}).geojson),   // v2.9.449 (v2.9.451: sin la memoria del G-4)
    });
  }

  // ============================================================
  // v2.9.282 — PULSO. El latido barato de la sincronización.
  //
  // Hasta la 281 el sondeo de cada 4 s llamaba a `estado`, que trae unidades,
  // órdenes, detecciones y (la primera vez) el terreno. Eso es una radiografía
  // completa cuatro veces por minuto por cada jugador, sólo para averiguar UN
  // número: si el turno cambió. Es la misma clase de derroche que hizo lenta la
  // pantalla de sanciones (15,5 MB por consulta).
  //
  // `pulso` lee una fila y devuelve tres campos. El estado completo se pide
  // RECIÉN cuando hay algo nuevo que mirar.
  // ============================================================
  if (accion === "pulso") {
    if (!puedeVer) return err("Sin acceso", 403);
    // ============================================================
    // v2.9.285 — EL PULSO TAMBIÉN LLEVA DÓNDE VUELA EL DRON Y TRAE QUÉ SE VE.
    //
    // El aparato se pilotea en el navegador, 60 veces por segundo: mandar eso al
    // servidor sería insostenible. Pero si NO se manda nunca, el servidor no
    // tiene idea de dónde está el sensor y no puede descubrir nada — que es
    // exactamente lo que le pasó al ROJO.
    //
    // El latido de 4 s ya estaba yendo y viniendo: se le cuelga la posición del
    // aparato de ida, y de vuelta trae la lista de enemigos que ese bando
    // alcanza AHORA. Si aparece uno nuevo, el navegador pide el estado completo.
    // Descubrir algo tarda como mucho esos 4 segundos y no hay una sola llamada
    // de más.
    // ============================================================
    const v: any = body.vuelo;
    const uidV = body.unidad_id;
    if (v && uidV != null) {
      const { data: us } = await sb.from("wg_unidades").select("id, bando")
        .eq("id", uidV).eq("partida_id", partida.id).limit(1);
      const uu = us && us[0];
      if (uu && (arbitro || (miBando && uu.bando === miBando.bando))
          && Number.isFinite(Number(v.lng)) && Number.isFinite(Number(v.lat))) {
        await sb.from("wg_unidades").update({ dron_vuelo: {
          lng: Number(v.lng), lat: Number(v.lat),
          alt: Number(v.alt) || null, proa: Number(v.proa) || 0,
          kmh: Number(v.kmh) || null, zoom: Number(v.zoom) || 1,
          ir: !!v.ir, t: new Date().toISOString(),
        } }).eq("id", uidV);
      }
    }
    let vistos: any = null;
    if (!arbitro && miBando) {
      const { data: uds } = await sb.from("wg_unidades")
        .select("id, bando, lng, lat, estado, dron_rumbo, dron_vuelo")
        .eq("partida_id", partida.id).limit(2000);
      vistos = [...idsVisiblesEnVivo(miBando.bando, uds || [])];
    }
    const _rel = await relojDe(partida.id);   // v2.9.449: la cuenta regresiva de todos
    return ok({ turno_actual: partida.turno_actual, estado_partida: partida.estado, vistos,
      reloj: relojPublico(_rel && _rel.geojson),
      // v2.9.443: un turno se está resolviendo ahora mismo (las fichas se están guardando).
      resolviendo: !!(partida.resolviendo_desde && (Date.now() - new Date(partida.resolviendo_desde).getTime()) < 90000) });
  }

  // ============================================================
  // v2.9.282 — REPLAY DE UN TURNO YA RESUELTO.
  //
  // Sergio, mirando las dos pantallas a la vez: «estas dos unidades en el lado
  // de azul ya se atacó, ya se están incendiando; en el lado de rojo apenas
  // están juntas».
  //
  // Tenía razón otra vez. Las trazas y los impactos viajaban SÓLO en la
  // respuesta de `resolver_turno`, así que los veía únicamente el navegador que
  // apretó «Jugar turno». El otro bando recibía las posiciones nuevas por el
  // sondeo y nada más: el resultado sin el combate. Por eso una pantalla ardía
  // y la otra mostraba dos fichas juntas sin novedad.
  //
  // Ahora el turno resuelto se GUARDA (`wg_replays`) y el otro bando lo pide
  // acá. Los dos ven exactamente la misma película.
  //
  // Se sirve SIN filtrar por detección, igual que hoy lo recibe quien resuelve:
  // que cada bando vea sólo lo que descubrió es el trabajo del Paso 3 (escalera
  // de reconocimiento), y meterlo acá cambiaría las reglas del juego en una
  // ronda que sólo tiene que emparejar las dos pantallas.
  // ============================================================
  if (accion === "replay") {
    if (!puedeVer) return err("Sin acceso", 403);
    const t = Number(body.turno);
    if (!Number.isFinite(t)) return err("Falta el turno");
    const { data } = await sb.from("wg_replays").select("trazas, impactos, entregas")
      .eq("partida_id", partida.id).eq("turno", t).limit(1);
    const fila = data?.[0];
    // Sin fila no es un error: puede ser un turno anterior a esta versión, o un
    // turno en el que nadie se movió ni disparó. El cliente sigue de largo.
    return ok({ turno: t, hay: !!fila, trazas: fila?.trazas || [], impactos: fila?.impactos || [],
      entregas: (fila as any)?.entregas || [] });
  }

  // ============================================================
  // v2.9.286 — SUBIR UNA POSICIÓN ENEMIGA A LA CARTA.
  //
  // Sergio: «una vez que el dron identifique una unidad enemiga, que tenga un
  // botón que diga SUBIR POSICIÓN ENEMIGA, y las unidades dadas por el dron
  // deben estar en otro tono de rojo, como si fueran información proporcionada
  // por el dron».
  //
  // Es la diferencia entre MIRAR y REPORTAR, y es exactamente cómo trabaja un
  // G-2: lo que el operador ve por el sensor no está en la carta hasta que
  // alguien lo pone ahí. Lo que se sube es la CREENCIA de ese bando —la
  // posición y el grado de identificación al momento de reportar— no la verdad
  // del servidor. Por eso se guarda el dato congelado (`datos`) y no un puntero
  // a la unidad: si el enemigo se mueve, la marca se queda donde se la vio, que
  // es lo correcto.
  // ============================================================
  // ============================================================
  // v2.9.317 — LAS INSTALACIONES DEL G-4.
  //
  // Van en `wg_terreno`, que ya tiene `tipo`, `bando`, `geojson` y `hasta_turno`
  // — por eso esto NO necesita SQL. Y van con el tipo prefijado `log_`, que el
  // motor NO conoce: `claseTerreno` sólo reacciona a camino/severo/restringido y
  // `enInterdiccion` a interdiccion, así que una instalación se dibuja y se
  // comparte pero NO altera el movimiento ni el combate. Es un elemento de la
  // carta logística, no un accidente del terreno — que es justamente lo que
  // tiene que ser.
  //
  // Se guardan con bando: cada Estado Mayor ve las suyas.
  // ============================================================
  if (accion === "colocar_instalacion") {
    if (!puedeVer) return err("Sin acceso", 403);
    const bandoIns = arbitro ? String(body.bando || "") : miBando.bando;
    if (bandoIns !== "rojo" && bandoIns !== "azul") {
      // v2.9.352: decir QUÉ falta y cómo se arregla. «Falta el bando» a secas no
      // le dice nada a nadie: pasa cuando el árbitro mira sin lente de bando.
      return err("Elegí primero desde qué bando estás trabajando (el selector AZUL / ROJO de arriba): "
        + "una instalación siempre es de un bando.");
    }
    const tipo = String(body.tipo || "");
    if (!/^log_[a-z]{2,20}$/.test(tipo)) return err("Tipo de instalación inválido");
    const lat = Number(body.lat), lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return err("Falta dónde ubicarla");
    const { data, error } = await sb.from("wg_terreno").insert({
      partida_id: partida.id, tipo, bando: bandoIns,
      geojson: { type: "Point", coordinates: [lng, lat], nota: String(body.nota || "").slice(0, 120) },
    }).select("id").limit(1);
    if (error) return err(error.message, 500);
    return ok({ id: data && data[0] ? data[0].id : null });
  }
  // v2.9.320 — LOS TRENES SE MUEVEN. El Tren de Combate marcha con la unidad y
  // el de Campaña queda a retaguardia: si no se pudieran desplazar, la logística
  // sería un decorado. Se mueve la MISMA fila (no se borra y se recrea) para que
  // conserve su id y el resto del Estado Mayor la siga viendo como la misma.
  if (accion === "mover_instalacion") {
    if (!puedeVer) return err("Sin acceso", 403);
    const id = body.id;   // v2.9.352: al árbitro no se le pide `bando`
    const lat = Number(body.lat), lng = Number(body.lng);
    if (id == null) return err("Falta cuál instalación");
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return err("Falta a dónde moverla");
    const { data: filas } = await sb.from("wg_terreno").select("id, tipo, bando, geojson")
      .eq("id", id).eq("partida_id", partida.id).limit(1);
    const f = filas && filas[0];
    if (!f || !String(f.tipo || "").startsWith("log_")) return err("Esa no es una instalación", 404);
    if (!arbitro && f.bando !== miBando.bando) return err("Esa instalación no es de tu bando", 403);
    const g: any = f.geojson || {};
    const { error } = await sb.from("wg_terreno")
      .update({ geojson: { type: "Point", coordinates: [lng, lat], nota: g.nota || "" } })
      .eq("id", id);
    if (error) return err(error.message, 500);
    return ok();
  }
  // ============================================================
  // v2.9.335 — EL G-4 FORMA UN CONVOY.
  //
  // El convoy nace EN una instalación propia (de ahí saca la carga) y es una
  // unidad más: se le dan órdenes de marcha como a cualquiera, se lo puede
  // escoltar y el enemigo lo puede destruir. Lo forma el Estado Mayor, no el
  // árbitro — igual que las instalaciones desde la v2.9.317.
  // ============================================================
  if (accion === "formar_convoy") {
    if (!puedeVer) return err("Sin acceso", 403);
    // ============================================================
    // v2.9.352 — «No se pudo formar el convoy: Falta el bando».
    // Éste era el cartel que frenaba a Sergio en los DOS bandos: entra con su
    // cuenta de profesor (o sea ÁRBITRO) y el enlace del puesto, así que el
    // servidor lo trataba como árbitro y le exigía un `bando` que el navegador
    // no manda. Y no hacía ninguna falta pedirlo: **el convoy es del bando de la
    // instalación de la que sale**. Se deriva de ahí y se acabó el problema.
    // ============================================================
    const clase = String(body.clase || "III").toUpperCase();
    // v2.9.443 — EL PAQUETE LOGÍSTICO: combustible + munición + víveres en un solo
    // convoy, de las instalaciones que despachan las tres (Trenes, ASDI).
    const paquete = clase === "PAQUETE";
    if (!paquete && !CONVOY_CLASES.includes(clase)) return err(`Clase desconocida: ${clase}`);
    const idIns = body.instalacion_id;
    if (idIns == null) return err("Falta de qué instalación sale");
    const { data: filas } = await sb.from("wg_terreno").select("id, tipo, bando, geojson")
      .eq("id", idIns).eq("partida_id", partida.id).limit(1);
    const f: any = filas && filas[0];
    if (!f || !esInstalacionLog(f.tipo)) return err("Esa instalación no reparte abastecimientos", 404);
    // El convoy sale de ese puesto: es de ese bando. El árbitro puede formar en
    // cualquiera de los dos; un Estado Mayor, sólo en los suyos.
    const bandoCv = f.bando;
    if (bandoCv !== "rojo" && bandoCv !== "azul") return err("Esa instalación no tiene bando", 409);
    if (!arbitro && f.bando !== miBando.bando) return err("Esa instalación no es de tu bando", 403);
    // Que la instalación reparta LO QUE el convoy va a llevar: de un Punto de
    // Municionamiento no salen bidones de combustible.
    const I = INSTAL_LOG[f.tipo];
    const despacha: string[] = I.despacha || [];
    const clases = paquete ? ["III", "V", "I"].filter((k) => despacha.includes(k)) : [clase];
    if (paquete && clases.length < 2) return err(`${I.nom} no arma un paquete: despacha ${despacha.join(", ") || "nada"}`);
    if (!paquete && !despacha.includes(clase)) {
      return err(`${I.nom} no despacha ${clase === "AGUA" ? "agua" : (clase === "EVAC" ? "evacuación sanitaria" : "Clase " + clase)}`);
    }
    // v2.9.443 — LA CARGA SALE DE LA ESTIBA DEL PUESTO. Antes el convoy nacía
    // lleno sin que el puesto perdiera nada: la logística era infinita. Ahora lo
    // que se carga baja la estiba; agotada, se forma con lo que haya (o no se forma).
    // v2.9.451: lo hace `formarConvoyEn`, el mismo que usa el 🤖 G-4 automático.
    const r: any = await formarConvoyEn(partida.id, f, clase, body.designacion);
    if (r.error) return err(r.error, r.status);
    return ok({ id: r.id, designacion: r.designacion, carga: r.carga, estiba: r.estiba });
  }
  // ============================================================
  // v2.9.443 — 📦 REPONER UNA INSTALACIÓN (el escalón superior). Sólo el
  // árbitro: es quien juega lo que está por encima de los Estados Mayores.
  // ============================================================
  if (accion === "reponer_instalacion") {
    if (!arbitro) return err("Sólo el árbitro repone una instalación (es el escalón superior)", 403);
    const { data: filas } = await sb.from("wg_terreno").select("id, tipo, bando, geojson")
      .eq("id", body.id).eq("partida_id", partida.id).limit(1);
    const f: any = filas && filas[0];
    if (!f || !esInstalacionLog(f.tipo)) return err("Esa instalación no existe o no reparte", 404);
    const antes = usadoDe(f);
    const cuanto = body.cargas != null ? Math.max(0, Number(body.cargas) || 0) : antes;
    const g = { ...(f.geojson || {}), usado: Number(Math.max(0, antes - cuanto).toFixed(3)) };
    const { error } = await sb.from("wg_terreno").update({ geojson: g }).eq("id", f.id).eq("partida_id", partida.id);
    if (error) return err(error.message, 500);
    await sb.from("wg_eventos").insert({ partida_id: partida.id, turno: partida.turno_actual, tipo: "logistica",
      descripcion: `📦 El escalón superior repuso ${INSTAL_LOG[f.tipo].nom}: ${(antes - g.usado).toFixed(1)} carga(s) — `
        + `ahora tiene ${(capDe(f) - g.usado).toFixed(1)} de ${capDe(f)}.`,
      lat: (puntoInstalacion(f) || [null, null])[1], lng: (puntoInstalacion(f) || [null, null])[0],
      bandos_visibles: [f.bando] });
    return ok({ id: f.id, cap: capDe(f), quedan: Number((capDe(f) - g.usado).toFixed(2)) });
  }
  // ============================================================
  // v2.9.443 — 🔄 ACTUALIZAR LOS MEDIOS DE LAS FICHAS SIN REIMPORTAR.
  // Sergio: «que se cargue bien lo que las fichas tienen, de azul como de rojo».
  // Las 20 fichas de «ZAPATO II» entraron antes de la v2.9.439: sin sus medios,
  // con el PC del CE-1 en 150 de poder y la DIV MEC-2 como motorizada.
  // Reimportar vuelve la partida al turno 0. Esto cambia SÓLO lo que se le
  // manda de cada ficha (sistemas, dotación, autonomía, medio, poder, observación)
  // en su lugar: posición, munición gastada, combustible, órdenes, bitácora y
  // turno quedan como están. El poder actual conserva el % que tenía; la
  // munición que ya tenía se recorta al tope nuevo si lo pasa.
  // ============================================================
  if (accion === "actualizar_medios") {
    if (!arbitro) return err("Sólo el árbitro actualiza los medios de las fichas", 403);
    const lista = Array.isArray(body.unidades) ? body.unidades.slice(0, 2000) : [];
    if (!lista.length) return err("No llegó ninguna ficha para actualizar");
    const { data: uds } = await sb.from("wg_unidades").select("*").eq("partida_id", partida.id).limit(2000);
    const porId = new Map((uds || []).map((u: any) => [String(u.id), u]));
    const filas: any[] = [];
    for (const n of lista) {
      const u: any = porId.get(String(n && n.id));
      if (!u) continue;
      const medios = limpiarMedios(n.medios);
      const fila: any = { id: u.id, partida_id: u.partida_id, bando: u.bando, lat: u.lat, lng: u.lng,
        poder_max: u.poder_max, poder_actual: u.poder_actual, estado: u.estado || "activa" };
      if (medios) fila.medios = medios;
      if (typeof n.medio === "string" && VEL[n.medio] && u.arma !== CONVOY_ARMA) fila.medio = n.medio;
      const pm = Number(n.poder_max);
      if (Number.isFinite(pm) && pm > 0) {
        const pct = (Number(u.poder_max) || 0) > 0 ? (Number(u.poder_actual) || 0) / Number(u.poder_max) : 1;
        fila.poder_max = Number(pm.toFixed(2));
        fila.poder_actual = Number((pm * Math.max(0, Math.min(1, pct))).toFixed(2));
      }
      const ob = Number(n.obs_km);
      if (Number.isFinite(ob) && ob > 0) fila.obs_km = ob;
      // La munición que ya tenía no pasa del tope nuevo.
      if (u.municion && medios && medios.sistemas) {
        const m: any = {};
        for (const [k, v] of Object.entries(u.municion)) {
          const tope = Number(medios.sistemas[k] && medios.sistemas[k].uf);
          m[k] = Number.isFinite(tope) && tope > 0 ? Math.min(Number(v) || 0, tope) : v;
        }
        fila.municion = m;
      }
      filas.push(fila);
    }
    if (!filas.length) return err("Ninguna de esas fichas es de esta partida");
    let { error } = await sb.from("wg_unidades").upsert(filas, { onConflict: "id" });
    if (error && /medios/i.test(error.message || "")) {
      ({ error } = await sb.from("wg_unidades").upsert(filas.map(({ medios: _m, ...f }: any) => f), { onConflict: "id" }));
      if (!error) return ok({ actualizadas: filas.length, aviso: "La base todavía no tiene la columna «medios» (supabase/wargame/002_medios_unidades.sql): se actualizaron el poder y el medio, no los sistemas." });
    }
    if (error) return err(error.message, 500);
    await sb.from("wg_eventos").insert({ partida_id: partida.id, turno: partida.turno_actual, tipo: "aviso",
      descripcion: `🔄 El árbitro actualizó los medios de ${filas.length} ficha(s) (sistemas de armas, dotación, autonomía, `
        + `medio y poder) sin reiniciar la partida.`, bandos_visibles: [] });
    return ok({ actualizadas: filas.length });
  }
  // ============================================================
  // v2.9.443 — 🗺️ ACTUALIZAR LA CARTA DESDE EL EJERCICIO, SIN REINICIAR.
  // Las partidas importadas antes de la v2.9.439 traen los caminos y la
  // hidrografía SIN su capa: el motor no puede distinguir una carretera de una
  // senda ni un río de una quebrada. Con el archivo del ejercicio, el árbitro
  // reemplaza SÓLO la carta de fondo (caminos, hidrografía, vegetación,
  // poblaciones, relieve, jurisdicciones) por la de la Mesa, con su capa. Se
  // manda por tandas: la primera (`limpiar`) borra la carta vieja. Unidades,
  // CMOC, plan de barreras, obras, instalaciones, órdenes y turno no se tocan.
  // ============================================================
  // ============================================================
  // v2.9.447 — 🧭 EL DESGASTE DE ARRANQUE. Sergio: «elegí esas fases; se supone que
  // hasta esas fases las unidades ya habrían entrado en contacto: calculá cómo
  // fueron desgastadas… y al iniciar la fase debería salir una bitácora de cómo se
  // está empezando». El cálculo lo hace la pantalla del árbitro con el ejercicio
  // (las fases anteriores de cada bando y la llegada a la posición); acá se aplica:
  // el poder que le queda a cada ficha, su combustible, su munición, sus raciones y
  // sus heridos, y el parte de arranque (turno actual) a la bitácora de cada bando.
  // Sólo el árbitro. La posición, las órdenes y el turno no se tocan.
  // ============================================================
  if (accion === "aplicar_arranque") {
    if (!arbitro) return err("Sólo el árbitro aplica el desgaste de arranque", 403);
    const lista = Array.isArray(body.unidades) ? body.unidades.slice(0, 2000) : [];
    const { data: uds } = await sb.from("wg_unidades").select("*").eq("partida_id", partida.id).limit(2000);
    const porId = new Map((uds || []).map((u: any) => [String(u.id), u]));
    const filas: any[] = [];
    for (const n of lista) {
      const u: any = porId.get(String(n && n.id));
      if (!u || u.arma === CONVOY_ARMA) continue;
      const pm = Math.max(0, Number(u.poder_max) || 0);
      const pa = Number(n.poder_actual);
      const fila: any = { id: u.id, partida_id: u.partida_id, bando: u.bando, lat: u.lat, lng: u.lng,
        poder_max: pm, poder_actual: u.poder_actual, estado: u.estado || "activa" };
      if (Number.isFinite(pa)) {
        const v = Math.max(0, Math.min(pm, pa));
        fila.poder_actual = Number(v.toFixed(2));
        fila.estado = v <= pm * 0.2 ? "fuera_combate" : (v <= pm * 0.6 ? "desgastada" : "activa");
      }
      const cKm = Number(n.combustible_km);
      if (Number.isFinite(cKm) && cKm >= 0) fila.combustible_km = Number(Math.min(5000, cKm).toFixed(2));
      const mun = limpiarMunicion(n.municion);
      if (mun) fila.municion = mun;
      if (n.carga && typeof n.carga === "object") {
        const c: any = { ...(u.carga || {}) };
        for (const k of ["racion", "heridos", "bajas", "muertos", "faltan"]) {
          const v = Number(n.carga[k]);
          if (Number.isFinite(v) && v >= 0) c[k] = Math.round(Math.min(100000, v) * 100) / 100;
        }
        fila.carga = c;
      }
      filas.push(fila);
    }
    if (filas.length) {
      const { error } = await sb.from("wg_unidades").upsert(filas, { onConflict: "id" });
      if (error) return err(`No se pudo aplicar el arranque: ${error.message}`, 500);
    }
    const parte = (Array.isArray(body.parte) ? body.parte : []).slice(0, 400)
      .filter((e: any) => e && typeof e.descripcion === "string" && e.descripcion.trim())
      .map((e: any) => ({ partida_id: partida.id, turno: partida.turno_actual || 0,
        tipo: ["arranque", "pedido"].includes(e.tipo) ? e.tipo : "arranque",
        descripcion: String(e.descripcion).slice(0, 600),
        lat: Number.isFinite(Number(e.lat)) ? Number(e.lat) : null, lng: Number.isFinite(Number(e.lng)) ? Number(e.lng) : null,
        bandos_visibles: (Array.isArray(e.bandos_visibles) ? e.bandos_visibles : []).filter((b: any) => b === "azul" || b === "rojo") }));
    if (parte.length) {
      const { error } = await sb.from("wg_eventos").insert(parte);
      if (error) return err(`Se aplicó el estado, pero no el parte: ${error.message}`, 500);
    }
    if ((Number(partida.turno_actual) || 0) <= 1) await fotoInicial(partida.id, partida.turno_actual || 1);   // v2.9.449
    return ok({ aplicadas: filas.length, parte: parte.length });
  }
  if (accion === "actualizar_carta") {
    if (!arbitro) return err("Sólo el árbitro actualiza la carta", 403);
    const CAPAS_FONDO = ["via", "hidro", "vegetacion", "poblado", "elevacion", "jurisdiccion"];
    const filas = (Array.isArray(body.terreno) ? body.terreno : [])
      .filter((t: any) => t && CAPAS_FONDO.includes(t.tipo) && t.geojson && t.geojson.type)
      .map((t: any) => ({ partida_id: partida.id, tipo: t.tipo, geojson: t.geojson }));
    if (body.limpiar) {
      const { error: eB } = await sb.from("wg_terreno").delete().eq("partida_id", partida.id)
        .is("bando", null).in("tipo", CAPAS_FONDO);
      if (eB) return err(`No se pudo borrar la carta vieja: ${eB.message}`, 500);
    }
    if (filas.length) {
      const { error } = await sb.from("wg_terreno").insert(filas);
      if (error) return err(`Carta: ${error.message}`, 500);
    }
    return ok({ insertadas: filas.length });
  }

  if (accion === "quitar_instalacion") {
    if (!puedeVer) return err("Sin acceso", 403);
    const id = body.id;
    if (id == null) return err("Falta cuál instalación");
    // Sólo se borran las PROPIAS y sólo si son instalaciones: nadie puede tocar
    // el terreno del escenario ni las del otro bando por id.
    // v2.9.352: al árbitro ya no se le pide `bando` — puede levantar cualquiera.
    const q = sb.from("wg_terreno").delete().eq("id", id).eq("partida_id", partida.id).like("tipo", "log\\_%");
    const { error } = arbitro ? await q : await q.eq("bando", miBando.bando);
    if (error) return err(error.message, 500);
    return ok();
  }
  if (accion === "reportar_contacto") {
    if (!puedeVer) return err("Sin acceso", 403);
    const bandoRep = arbitro ? String(body.bando || "") : miBando.bando;
    if (bandoRep !== "rojo" && bandoRep !== "azul") return err("Falta el bando que reporta");
    const uid = body.unidad_id;
    if (uid == null) return err("Falta la unidad");
    const { data: us } = await sb.from("wg_unidades").select("*")
      .eq("id", uid).eq("partida_id", partida.id).limit(1);
    const u = us && us[0];
    if (!u) return err("Unidad no encontrada", 404);
    if (u.bando === bandoRep) return err("Esa unidad es tuya, no hay nada que reportar");
    const nivel = Math.max(1, Math.min(3, Number(body.nivel) || 2));
    // Sólo se sube lo que el nivel de identificación permite saber. Si se
    // guardara la ficha entera, el reporte diría más de lo que el dron vio.
    const datos: any = { bando: u.bando, escalon: nivel >= 2 ? u.escalon : null };
    if (nivel >= 3) {
      datos.arma = u.arma; datos.designacion = u.designacion;
      datos.poder_max = u.poder_max; datos.poder_actual = u.poder_actual;
    }
    const { error } = await sb.from("wg_inteligencia").upsert({
      partida_id: partida.id, bando: bandoRep, unidad_id: uid, nivel,
      lat: Number(body.lat ?? u.lat), lng: Number(body.lng ?? u.lng),
      turno: partida.turno_actual, datos, reportado_en: new Date().toISOString(),
    }, { onConflict: "partida_id,bando,unidad_id" });
    if (error) return err(error.message, 500);
    return ok({ unidad_id: uid, nivel });
  }

  // Borrar una marca subida (se comprobó que ya no está ahí).
  if (accion === "borrar_contacto") {
    if (!puedeVer) return err("Sin acceso", 403);
    const bandoRep = arbitro ? String(body.bando || "") : miBando.bando;
    if (!bandoRep || body.unidad_id == null) return err("Faltan datos");
    const { error } = await sb.from("wg_inteligencia").delete()
      .eq("partida_id", partida.id).eq("bando", bandoRep).eq("unidad_id", body.unidad_id);
    if (error) return err(error.message, 500);
    return ok({ borrado: true });
  }

  // ---------- historial (eventos visibles para el caller) ----------
  if (accion === "historial") {
    if (!puedeVer) return err("Sin acceso", 403);
    // v2.9.445: con `bandos_visibles` (la bitácora de abajo reparte cada renglón en el
    // cuadro 🔴 o 🔵) y en el orden en que pasó (`id`): los del mismo turno tienen la
    // misma hora de guardado.
    let q = sb.from("wg_eventos").select("id, turno, tipo, descripcion, lat, lng, creado_en, bandos_visibles").eq("partida_id", partida.id).order("turno", { ascending: false }).order("creado_en", { ascending: false }).order("id", { ascending: false }).limit(300);
    if (!arbitro && miBando) q = q.contains("bandos_visibles", [miBando.bando]);
    const { data } = await q;
    return ok({ eventos: data || [] });
  }

  // ---------- resolver_turno (ÁRBITRO) ----------
  if (accion === "resolver_turno") {
    // ============================================================
    // v2.9.277 — LOS BANDOS TAMBIÉN HACEN CORRER EL TURNO.
    // Sergio: «las unidades no esperan su turno, sólo mueven sus fichas cuando
    // quieren… quiero que cada bando pueda moverse y disparar».
    // Hasta acá sólo el árbitro podía resolver, así que un Estado Mayor mandaba
    // sus órdenes y quedaba CLAVADO esperando al profesor. Por eso «salen
    // órdenes listas pero no se mueven»: las órdenes estaban bien, no había
    // quien las ejecutara.
    // Ahora lo puede disparar cualquiera de los dos bandos (o el árbitro).
    // Se resuelve el turno COMPLETO, con las órdenes de los dos — sigue siendo
    // simultáneo, que es lo correcto: nadie mueve mirando lo que hizo el otro.
    //
    // El cerrojo contra la doble resolución: si el cliente manda el número de
    // turno que creía estar jugando y ya no coincide, se rechaza. Sin esto, dos
    // bandos apretando a la vez resolvían DOS turnos seguidos y las unidades
    // aparecían al doble de distancia.
    // ============================================================
    if (partida.estado !== "en_curso") return err("La partida no está en curso");
    if (!arbitro && !miBando) return err("No sos parte de esta partida", 403);
    const turno = partida.turno_actual;
    if (body.turno != null && Number(body.turno) !== Number(turno)) {
      return err("Ese turno ya lo resolvió el otro bando. Actualizá para ver cómo quedó.", 409);
    }
    // ============================================================
    // v2.9.430 — EL CERROJO DE VERDAD. La comparación de arriba se hacía sobre
    // una partida LEÍDA antes: dos pantallas que apretaban «Jugar turno» a la
    // vez leían las dos «turno 14», pasaban las dos, y el turno se resolvía DOS
    // VECES (la segunda ya con las unidades movidas por la primera). En la base
    // quedaron eventos duplicados en cuatro partidas. Ahora se reclama el turno
    // con UN solo UPDATE condicional: sólo gana quien encuentra `turno_actual`
    // todavía en su número y sin otra resolución en curso (o una colgada hace
    // más de 90 s). El que pierde recibe el 409 de siempre.
    // ============================================================
    const _corte = new Date(Date.now() - 90000).toISOString();
    const { data: _claim, error: eClaim } = await sb.from("wg_partidas")
      .update({ resolviendo_desde: new Date().toISOString() })
      .eq("id", partida.id).eq("turno_actual", turno)
      .or(`resolviendo_desde.is.null,resolviendo_desde.lt.${_corte}`)
      .select("id");
    if (eClaim) return err(`No se pudo reservar el turno: ${eClaim.message}`, 500);
    if (!_claim || !_claim.length) {
      return err("Ese turno ya lo resolvió (o lo está resolviendo) otra pantalla. Esperá unos segundos: te llega solo.", 409);
    }
    let _avanzo = false;
    try {
    // ============================================================
    // v2.9.443 — LO QUE NECESITA EL MOTOR, PEDIDO A LA VEZ. Antes eran cinco
    // consultas una detrás de la otra; ahora salen juntas. Además del terreno
    // doctrinal entran los caminos y la HIDROGRAFÍA (los ríos y las lagunas
    // frenan), y las órdenes y la película del turno ANTERIOR: con eso el
    // servidor sigue solo la marcha que no terminó, para todos los bandos.
    // v2.9.324: el terreno con `id`, porque la obra terminada se guarda aparte.
    // v2.9.439: por páginas (PostgREST corta en 1.000).
    // v2.9.440: con el plan de barreras PROYECTADO (`obstaculo`): no frena a
    // nadie, pero se le avisa al árbitro cuando una marcha pasa por encima.
    // v2.9.334: las instalaciones del G-4 van APARTE del terreno (no frenan:
    // reabastecen) y sin filtro de bando: cada uno se reabastece en las suyas.
    // ============================================================
    const [rU, rT, rI, rO, rOp, rRp] = await Promise.all([
      sb.from("wg_unidades").select("*").eq("partida_id", partida.id),
      todasLasFilas(() => sb.from("wg_terreno").select("id, tipo, geojson, hasta_turno, bando")
        .eq("partida_id", partida.id).in("tipo", [...TIPOS_MOTOR, "obstaculo", "hidro"]).order("id", { ascending: true })),
      sb.from("wg_terreno").select("id, tipo, geojson, bando").eq("partida_id", partida.id).like("tipo", "log\\_%").limit(400),
      sb.from("wg_ordenes").select("*").eq("partida_id", partida.id).eq("turno", turno),
      sb.from("wg_ordenes").select("*").eq("partida_id", partida.id).eq("turno", turno - 1),
      sb.from("wg_replays").select("trazas").eq("partida_id", partida.id).eq("turno", turno - 1).limit(1),
    ]);
    const unidades = (rU as any).data || [];
    const terreno = prepararTerreno((rT as any).data || []);   // v2.9.451: una vez (el grafo de caminos sirve a los dos)
    const instalLog = (rI as any).data || [];
    const ordenes = (rO as any).data || [];
    // v2.9.451 — 🤖 EL G-4 AUTOMÁTICO da sus órdenes antes de resolver, como cualquier
    // jugador: forma sus convoyes y los manda. Si falla, el turno se resuelve igual.
    const g4ev: any[] = [];
    try { await g4Automatico(partida.id, unidades, terreno, instalLog, ordenes, g4ev); }
    catch (e) { console.error("G-4 automático:", e); }
    let res: any;
    try {
      res = resolverTurno({
        duracion_turno_horas: partida.duracion_turno_horas, rango_combate_km: body.rango_combate_km || 3,
        turno, // v2.9.226: las zonas interdictadas vencen, y la supresión también
        terreno, unidades, ordenes,
        instalaciones: instalLog,   // v2.9.334
        ordenesPrevias: (rOp as any).data || [],                                      // v2.9.443
        trazasPrevias: ((((rRp as any).data || [])[0] || {}).trazas) || [],           // v2.9.443
      });
    } catch (e) {
      return err(`Error al resolver el turno: ${(e as any)?.message || e}`, 500);
    }
    // ============================================================
    // v2.9.443 — LAS UNIDADES SE GUARDAN DE UNA SOLA VEZ.
    // Sergio: «hay veces que no se sincroniza». Una de las causas: se guardaba
    // ficha por ficha, una escritura detrás de la otra (20, 50, 100…). Tardaba,
    // y mientras tanto otra pantalla podía leer el tablero a medio guardar —
    // unas fichas ya en su lugar nuevo y otras todavía en el viejo. Ahora va un
    // solo pedido (todo o nada); si la base lo rechazara, se cae al de siempre.
    // No se tocan `dron_vuelo` ni `dron_rumbo` (los escribe el latido mientras
    // tanto) ni los `medios`.
    // ============================================================
    const filasU = res.unidades.map((u: any) => ({ id: u.id, partida_id: partida.id, bando: u.bando,
      lat: u.lat, lng: u.lng, poder_max: u.poder_max, poder_actual: u.poder_actual, estado: u.estado || "activa",
      combustible_km: u.combustible_km ?? 0,
      // v2.9.230: la munición gastada se guarda, si no el límite no existe
      // entre turnos y «apoyar por fuego» vuelve a ser gratis.
      municion: u.municion ?? null,
      carga: u.carga ?? null,       // v2.9.335: lo que lleva el convoy (v2.9.443: y a quién apoya)
      trabajo: u.trabajo ?? null,   // v2.9.234: avance de la obra entre turnos
      suprimida_hasta: u.suprimida_hasta ?? null }));
    if (filasU.length) {
      const { error: eUp } = await sb.from("wg_unidades").upsert(filasU, { onConflict: "id" });
      if (eUp) {
        for (const f of filasU) {
          const { id, partida_id: _p, bando: _b, ...datos } = f;
          const { error: eU } = await sb.from("wg_unidades").update(datos).eq("id", id);
          if (eU) return err(`No se pudo guardar la unidad ${id}: ${eU.message}`, 500);
        }
      }
    }
    // Lo demás no depende entre sí: sale todo junto.
    const escrituras: Promise<any>[] = [];
    const etiquetas: string[] = [];
    const escribir = (etq: string, p: any) => { etiquetas.push(etq); escrituras.push(Promise.resolve(p)); };
    if (g4ev.length) res.eventos = [...g4ev, ...res.eventos];   // v2.9.451: lo del 🤖 G-4, primero
    if (res.eventos.length) {
      escribir("la bitácora del turno", sb.from("wg_eventos").insert(res.eventos.map((e: any) => ({
        partida_id: partida.id, turno, tipo: e.tipo, descripcion: e.descripcion,
        lat: e.lat ?? null, lng: e.lng ?? null, bandos_visibles: e.bandos_visibles || [],
      }))));
    }
    // v2.9.226 — LAS ZONAS QUE DEJA EL TURNO (interdicción, obras) se guardan en
    // wg_terreno y vencen solas por `hasta_turno`. v2.9.443: la brecha (corredor)
    // y el puente traen su geometría hecha.
    if ((res.zonas || []).length) {
      const filasZ = res.zonas.map((z: any) => ({
        partida_id: partida.id, tipo: z.tipo || "interdiccion",
        geojson: z.geojson || { type: "Polygon", coordinates: [anilloKm(z.centro[0], z.centro[1], z.radio)], ...(z.obra ? { obra: z.obra } : {}) },
        hasta_turno: z.hasta_turno, bando: z.bando,
      }));
      escribir("las zonas del turno (interdicción y obras)", sb.from("wg_terreno").insert(filasZ));
    }
    if ((res.zonasBorrar || []).length) {
      escribir("los obstáculos levantados", sb.from("wg_terreno").delete().eq("partida_id", partida.id).in("id", res.zonasBorrar));
    }
    // v2.9.335 — las instalaciones logísticas que voló el fuego se borran de la carta.
    if ((res.instalBorrar || []).length) {
      escribir("las instalaciones destruidas", sb.from("wg_terreno").delete()
        .eq("partida_id", partida.id).like("tipo", "log\\_%").in("id", res.instalBorrar));
    }
    // v2.9.344 — LA ESTIBA QUE BAJÓ.
    for (const it of (res.instalActualizar || [])) {
      escribir("el consumo de una instalación", sb.from("wg_terreno")
        .update({ geojson: it.geojson }).eq("id", it.id).eq("partida_id", partida.id));
    }
    // Detecciones (niebla) del turno.
    const detFilas: any[] = [];
    for (const id of res.detecciones.rojo) detFilas.push({ partida_id: partida.id, turno, bando_observador: "rojo", unidad_id: id });
    for (const id of res.detecciones.azul) detFilas.push({ partida_id: partida.id, turno, bando_observador: "azul", unidad_id: id });
    if (detFilas.length) {
      escribir("las detecciones (niebla de guerra)", sb.from("wg_detecciones")
        .upsert(detFilas, { onConflict: "partida_id,turno,bando_observador,unidad_id" }));
    }
    // v2.9.443 — LA MARCHA QUE SIGUIÓ SOLA queda como orden del turno: así la
    // cadena sigue el turno siguiente aunque nadie la vuelva a mandar.
    if ((res.ordenesGuardar || []).length) {
      escribir("las marchas que siguen solas", sb.from("wg_ordenes").insert(res.ordenesGuardar.map((o: any) => ({
        partida_id: partida.id, turno, bando: o.bando, unidad_id: o.unidad_id, tipo: o.tipo,
        destino_lat: o.destino_lat, destino_lng: o.destino_lng, ruta: o.ruta, tarea: o.tarea, proposito: o.proposito,
        estado: "pendiente" }))));
    }
    // ============================================================
    // v2.9.282 — EL TURNO SE GUARDA PARA EL OTRO BANDO. Las trazas y los
    // impactos (con su HORA desde la v2.9.443) se guardan ANTES de avanzar el
    // turno: si esta escritura fallara, el turno no avanza y se puede reintentar.
    // ============================================================
    if ((res.trazas || []).length || (res.impactos || []).length || (res.entregas || []).length) {
      escribir("el replay del turno", sb.from("wg_replays").upsert({
        partida_id: partida.id, turno,
        trazas: res.trazas || [], impactos: res.impactos || [], entregas: res.entregas || [],
      }, { onConflict: "partida_id,turno" }));
    }
    const resultados = await Promise.all(escrituras);
    for (let k = 0; k < resultados.length; k++) {
      const e = resultados[k] && resultados[k].error;
      if (e) return err(`No se pudo guardar ${etiquetas[k]}: ${e.message}`, 500);
    }
    // Marcar órdenes resueltas y avanzar el turno.
    const { error: eO } = await sb.from("wg_ordenes").update({ estado: "resuelta" })
      .eq("partida_id", partida.id).eq("turno", turno);
    if (eO) return err(`No se pudieron cerrar las órdenes del turno: ${eO.message}`, 500);
    const { error: eP } = await sb.from("wg_partidas")
      .update({ turno_actual: turno + 1, resolviendo_desde: null }).eq("id", partida.id);
    if (eP) return err(`No se pudo avanzar al turno siguiente: ${eP.message}`, 500);
    _avanzo = true;
    // v2.9.449 — ⏱️ con el reloj andando, la cuenta vuelve a empezar para el turno nuevo.
    try {
      const fr = await relojDe(partida.id);
      if (fr && fr.geojson && fr.geojson.activo) {
        await guardarReloj(partida.id, fr, { ...fr.geojson, proximo: Date.now() + (Number(fr.geojson.cadaMin) || 3) * 60000, turnoEn: turno + 1 });
      }
    } catch (_e) { /* el reloj no frena el turno */ }
    return ok({ turno_resuelto: turno, turno_nuevo: turno + 1, eventos: res.eventos.length,
      combates: res.eventos.filter((e: any) => e.tipo === "combate").length,
      // v2.9.203: las rutas recorridas viajan en la RESPUESTA (no se guardan) para
      // que el árbitro pueda ver el replay del turno recién resuelto.
      trazas: res.trazas || [],
      // v2.9.220: puntos donde cayó cada concentración, para el incendio en pantalla.
      impactos: res.impactos || [],
      // v2.9.351: dónde se descargó abastecimiento, para la animación.
      entregas: res.entregas || [] });
    } finally {
      // Si algo falló a mitad de camino, se suelta el cerrojo para poder reintentar.
      if (!_avanzo) {
        try { await sb.from("wg_partidas").update({ resolviendo_desde: null }).eq("id", partida.id); } catch (_e) { /* nada */ }
      }
    }
  }

  return err("Acción no reconocida");
}
