// ============================================================
// EDGE FUNCTION: wargame-ops — Juego de Guerra (PMTD) de SIDECEME.  ·  v2.9.351
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
function puntoEnAnillo(pt: number[], ring: number[][]) {
  let dentro = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const corta = (yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi || 1e-12) + xi;
    if (corta) dentro = !dentro;
  }
  return dentro;
}
function puntoEnGeom(pt: number[], geom: any) {
  if (!geom) return false;
  if (geom.type === "Polygon") return puntoEnAnillo(pt, geom.coordinates[0]);
  if (geom.type === "MultiPolygon") return geom.coordinates.some((poly: any) => puntoEnAnillo(pt, poly[0]));
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
  return (terreno || []).map((t: any) => (t && t._caja ? t : { ...t, _caja: cajaDeGeom(t && t.geojson) }));
}
function fueraDeCaja(pt: number[], t: any) {
  const c = t._caja;
  return !!c && (pt[0] < c[0] || pt[0] > c[2] || pt[1] < c[1] || pt[1] > c[3]);
}
// v2.9.221 — LOS CAMINOS SE ANDAN. Hasta acá la capa `via` era DECORACIÓN: el
// motor no la miraba, así que un motorizado quedaba clavado «a los 0.0 km» en
// cuanto el sector era restringido, aunque tuviera una carretera por delante.
const CAMINO_KM = 0.15;
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
function enCamino(pt: number[], terreno: any[]) {
  for (const t of terreno || []) {
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
    // ============================================================
    if (t.tipo !== "via") continue;
    if (fueraDeCajaCon(pt, t, CAMINO_KM)) continue;
    // v2.9.234: una brecha abierta por zapadores es un ÁREA por la que se pasa,
    // no una traza. Sin esto la obra terminada no habría servido de nada.
    if (t.geojson && (t.geojson.type === "Polygon" || t.geojson.type === "MultiPolygon")) {
      if (puntoEnGeom(pt, t.geojson)) return true;
      continue;
    }
    for (const linea of lineasDe(t.geojson)) {
      for (let i = 1; i < linea.length; i++) {
        if (distPtSegKm(pt, linea[i - 1], linea[i]) <= CAMINO_KM) return true;
      }
    }
  }
  return false;
}
function claseTerreno(pt: number[], terreno: any[]) {
  if (enCamino(pt, terreno)) return "camino"; // la carretera manda sobre todo
  let restringido = false;
  for (const t of terreno || []) {
    if (fueraDeCaja(pt, t)) continue;
    if (t.tipo === "severo" && puntoEnGeom(pt, t.geojson)) return "severo";
    if (t.tipo === "restringido" && puntoEnGeom(pt, t.geojson)) restringido = true;
  }
  return restringido ? "restringido" : "libre";
}
// v2.9.226: ¿el punto cae en una zona INTERDICTADA todavía viva? Las zonas
// vencen: el fuego de interdicción no dura para siempre.
function enInterdiccion(pt: number[], terreno: any[], turno?: any) {
  for (const t of terreno || []) {
    if (t.tipo !== "interdiccion") continue;
    if (turno != null && t.hasta_turno != null && turno > t.hasta_turno) continue;
    if (fueraDeCaja(pt, t)) continue;
    if (puntoEnGeom(pt, t.geojson)) return true;
  }
  return false;
}
function enTerrenoClave(pt: number[], terreno: any[]) {
  return (terreno || []).some((t) => t.tipo === "clave" && !fueraDeCaja(pt, t) && puntoEnGeom(pt, t.geojson));
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
function enMinado(pt: number[], terreno: any[], bando?: string) {
  for (const t of terreno || []) {
    if (t.tipo !== "minado") continue;
    if (bando && t.bando === bando) continue; // el dueño conoce las brechas
    if (fueraDeCaja(pt, t)) continue;
    if (puntoEnGeom(pt, t.geojson)) return t;
  }
  return null;
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
const VEL: any = {
  motor: { camino: 50, libre: 40, restringido: null, severo: null },
  oruga: { camino: 32, libre: 28, restringido: 9, severo: null },
  // v2.9.358 — VELOCIDAD DE COLUMNA, NO DE VEHÍCULO SUELTO. 35 km/h es la marcha
  // de una columna cargada por camino de tercera o cuarta (tierra, ripio), que es
  // por donde va el abastecimiento de verdad; no por autopista.
  rueda: { camino: 35, libre: 12, restringido: 4, severo: null },   // camión militar 6×6
  pie: { camino: 6, libre: 5, restringido: 3.5, severo: 2 },
};
// El medio que le toca a cada unidad. El convoy va por llantas aunque su
// columna `medio` diga «motor» — así no hace falta migrar la base.
function medioDe(u: any) { return esConvoy(u) ? "rueda" : (u && u.medio) || "pie"; }
const OBS: any = { camino: 1.0, libre: 1.0, restringido: 0.5, severo: 0.3 };
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
const CONVOY_FUERA_RUTA_KM = 4;


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
const CONSUMO_TERRENO: any = { camino: 0.9, libre: 1.0, restringido: 1.6, severo: 2.2 };
// ---------- Misiones de artillería (v2.9.226) ----------
// INTERDICTAR no busca destruir a nadie: busca NEGAR el uso de un camino, un
// vado o un paso. Por eso no se resuelve con daño instantáneo, sino con una
// zona que QUEDA batida y castiga a todo el que la cruce, propios incluidos.
const MISIONES: any = { destruccion: 1, interdiccion: 1, neutralizacion: 1 };
const INTERDICCION_TURNOS: any = { obus155: 4, obus105: 3, mortero120: 3, mortero81: 2, mortero60: 2 };
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
  const tanque = AUTONOMIA_KM[_medio] || 0;
  const autonomia = tanque > 0 ? Math.max(0, tanque - (Number(u.combustible_km) || 0)) : Infinity;
  let pos = [u.lng, u.lat];
  const totalDest = haversineKm(pos, destino);
  // Ya está ahí: misma forma que el resto de los caminos, si no la bitácora y el
  // replay reciben campos vacíos y revientan al formatear.
  if (totalDest < 1e-4) return { lng: pos[0], lat: pos[1], detenida: false, motivo: "en destino",
    avanzadoKm: 0, totalKm: 0, ruta: [[pos[0], pos[1]]], horasUsadas: 0, llego: true,
    porClase: { camino: 0, libre: 0, restringido: 0, severo: 0 }, consumoKm: 0, kmBatido: 0, minado: null };
  let presupuesto = horas, avanzado = 0, detenida = false, motivo = "", guardia = 0;
  // Con el tanque en cero no arranca (misma forma de retorno de siempre).
  if (autonomia <= 1e-6) return { lng: pos[0], lat: pos[1], detenida: true, motivo: "sin combustible",
    avanzadoKm: 0, totalKm: totalDest, ruta: [[pos[0], pos[1]]], horasUsadas: 0, llego: false,
    porClase: { camino: 0, libre: 0, restringido: 0, severo: 0 }, consumoKm: 0, kmBatido: 0, minado: null,
    seco: true };
  const ruta: number[][] = [[pos[0], pos[1]]]; // v2.9.203: para el replay y la bitácora
  // v2.9.208: ¿arranca metida en terreno que su medio NO cruza? Antes se detenía
  // «a los 0.0 km» TODOS los turnos y quedaba muerta en el tablero para siempre.
  const atrapada = vel[claseTerreno(pos, terreno)] == null;
  let saliendo = atrapada;
  // v2.9.225 — POR DÓNDE FUE Y QUÉ LE COSTÓ: km por clase de terreno, de donde
  // salen la velocidad media, el reparto camino/campo y el consumo.
  const porClase: any = { camino: 0, libre: 0, restringido: 0, severo: 0 };
  let consumoKm = 0;
  // v2.9.358: km que la columna lleva ANDADOS fuera de camino en este turno.
  let kmFueraRuta = 0;
  const topeFuera = esConvoy(u) ? CONVOY_FUERA_RUTA_KM : Infinity;
  // v2.9.226: km recorridos DENTRO de una zona interdictada.
  let kmBatido = 0;
  // v2.9.324: si entró en un campo minado enemigo, cuál. Uno solo: la marcha se
  // corta ahí, así que no hay un segundo.
  let minado: any = null;
  const anotar = (clase: string, km: number, pt?: number[]) => {
    if (porClase[clase] == null) porClase[clase] = 0;
    porClase[clase] += km;
    consumoKm += km * (CONSUMO_TERRENO[clase] != null ? CONSUMO_TERRENO[clase] : 1);
    if (pt && enInterdiccion(pt, terreno, turno)) kmBatido += km;
  };
  while (true) {
    const restante = haversineKm(pos, destino);
    if (restante <= 1e-6) break; // llegó (1 mm)
    if (++guardia > 100000) { motivo = "corte de seguridad"; break; }
    const frac = Math.min(pasoKm, restante) / restante;
    const sig = [pos[0] + (destino[0] - pos[0]) * frac, pos[1] + (destino[1] - pos[1]) * frac];
    // v2.9.324 — EL CAMPO MINADO PARA LA MARCHA, ANTES DE PISARLO DEL TODO.
    // Se corta en el borde, no en el medio: una columna que toca un campo
    // minado se detiene y se despliega, no lo sigue atravesando. Y se corta
    // ANTES de mover, así la unidad queda DONDE LO ENCONTRÓ — que es el dato
    // que después le sirve al otro bando para saber que su obstáculo funcionó.
    const mina = enMinado(sig, terreno, u.bando);
    if (mina) { minado = mina; detenida = true; motivo = "campo minado"; break; }
    const clase = claseTerreno(sig, terreno);
    let v = vel[clase];
    // Doctrina: del terreno que no se cruza SE SALE, pero a paso de hombre (el
    // vehículo se remolca, la tropa desembarca). Al pisar terreno transitable
    // recupera su velocidad propia.
    if (v == null && saliendo) v = (VEL.pie[clase] || 2) * 0.5;
    else if (v != null) saliendo = false;
    if (v == null) {
      detenida = true;
      motivo = esConvoy(u)
        ? `terreno ${clase}: por acá no pasa un camión — el eje no está trazado sobre ruta`
        : `terreno ${clase} infranqueable para ${u.medio}`;
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
    let gasta = CONSUMO_TERRENO[clase] != null ? CONSUMO_TERRENO[clase] : 1;
    if (esConvoy(u) && clase !== "camino") gasta = gasta * 1.5;   // v2.9.351: camión cargado, en baja
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
      ruta.push([pos[0], pos[1]]);
      if (clase !== "camino") kmFueraRuta += kmPosibles;
      if (seFrenaPorTanque) { detenida = true; motivo = "sin combustible"; }
      else { presupuesto = 0; motivo = "fin del turno"; }
      break;
    }
    presupuesto -= tPaso; pos = sig; avanzado += pasoReal;
    anotar(clase, pasoReal, pos);
    ruta.push([pos[0], pos[1]]);
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
    ruta, horasUsadas: Math.max(0, horas - presupuesto), llego: !detenida && haversineKm(pos, destino) <= 1e-3,
    porClase, consumoKm, kmBatido, minado, kmFueraRuta,
    fueraDeRuta: motivo.startsWith("fuera de ruta"),
    seco: motivo === "sin combustible" };
}

// v2.9.220 — MARCHA POR UNA RUTA DE VARIOS PUNTOS, EN UN SOLO TURNO. Antes la
// orden llevaba UN destino: con puntos de paso la unidad gastaba un turno entero
// por tramo y se frenaba en cada hito aunque le sobrara medio día de marcha.
function moverPorRuta(u: any, ruta: any[], terreno: any[], horas: number, turno: any = null) {
  const pts = (ruta || []).filter((p: any) => Array.isArray(p) && p.length >= 2);
  if (!pts.length) return moverUnidad(u, [u.lng, u.lat], terreno, horas);
  let pos: any = { ...u };
  let restante = horas, avanzado = 0, consumidos = 0;
  let rutaTot: number[][] = [[u.lng, u.lat]];
  let detenida = false, motivo = "", llego = false, seco = false;
  const porClase: any = { camino: 0, libre: 0, restringido: 0, severo: 0 };
  let consumoKm = 0, kmBatido = 0, minado: any = null;
  const gastadoAntes = Number(u.combustible_km) || 0;   // v2.9.334
  const totalKm = pts.reduce((s: number, p: any, i: number) => s + haversineKm(i ? pts[i - 1] : [u.lng, u.lat], p), 0);
  for (let i = 0; i < pts.length; i++) {
    if (restante <= 1e-9) { motivo = "fin del turno"; break; }
    const r = moverUnidad(pos, pts[i], terreno, restante, 0.5, turno);
    pos = { ...pos, lng: r.lng, lat: r.lat };
    if (r.ruta && r.ruta.length > 1) rutaTot = rutaTot.concat(r.ruta.slice(1));
    avanzado += r.avanzadoKm;
    for (const k of Object.keys((r as any).porClase || {})) porClase[k] = (porClase[k] || 0) + (r as any).porClase[k];
    consumoKm += (r as any).consumoKm || 0;
    kmBatido += (r as any).kmBatido || 0;
    if ((r as any).minado) minado = (r as any).minado;
    if ((r as any).seco) seco = true;
    // v2.9.334: el tramo siguiente tiene que saber lo que ya se gastó en éste.
    pos.combustible_km = gastadoAntes + consumoKm;
    restante = Math.max(0, restante - r.horasUsadas);
    motivo = r.motivo;
    if (r.detenida) { detenida = true; break; }
    if (!r.llego) { motivo = "fin del turno"; break; }
    consumidos = i + 1;
    llego = (i === pts.length - 1);
  }
  return { lng: pos.lng, lat: pos.lat, detenida, motivo, avanzadoKm: avanzado, totalKm,
    ruta: rutaTot, horasUsadas: Math.max(0, horas - restante), llego, consumidos,
    porClase, consumoKm, kmBatido, minado, seco };
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
  if (r.horasUsadas > 0 && r.avanzadoKm > 0) {
    partes.push(`🚗 media ${(r.avanzadoKm / r.horasUsadas).toFixed(0)} km/h`);
  }
  const tot = Object.values(r.porClase || {}).reduce((s: any, v: any) => s + v, 0) as number;
  if (tot > 0.05) {
    const NOM: any = { camino: "camino", libre: "campo abierto", restringido: "terreno restringido", severo: "terreno severo" };
    const reparto = Object.entries(r.porClase)
      .filter(([, km]: any) => km > 0.05)
      .sort((a: any, b: any) => b[1] - a[1])
      .map(([k, km]: any) => `${Math.round((100 * km) / tot)} % ${NOM[k] || k}`);
    if (reparto.length) partes.push(`🛣️ ${reparto.join(" · ")}`);
  }
  const tanque = AUTONOMIA_KM[medioDe(u)] || 0;
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
  return (terreno || []).some((t) => t.tipo === tipo && !fueraDeCaja(pt, t) && puntoEnGeom(pt, t.geojson));
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
    + `HASTA ACÁ PUEDE LLEGAR por ese camino: hay que rodear el obstáculo con puntos de paso o cambiarle el destino.`;
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
  zapa: { id: "zapa", nom: "Medios de zapa", alcance: 0, radio: 0, pot: 0, uf: 0, contra: "terreno: brechas y obstáculos", ingenieria: true },
};
const DOTACION: any = {
  infanteria: { base: ["fusil", "ametralladora"], compania: ["pesada", "mortero60"],
    batallon: ["pesada", "mortero81", "srAT"], regimiento: ["pesada", "mortero81", "srAT"],
    brigada: ["pesada", "mortero120", "misilAT"] },
  caballeria: { base: ["ametralladora", "pesada"], compania: ["canon"], batallon: ["canon", "misilAT"],
    regimiento: ["canon", "misilAT"], brigada: ["canon", "misilAT"] },
  blindada: { base: ["canon", "pesada"], batallon: ["canon", "pesada", "misilAT"] },
  artilleria: { base: ["fusil"], compania: ["obus105"], batallon: ["obus105"],
    regimiento: ["obus105", "obus155"], brigada: ["obus155"] },
  morteros: { base: ["fusil", "mortero81"], batallon: ["mortero120"] },
  antitanque: { base: ["fusil", "srAT"], batallon: ["misilAT"] },
  ametralladoras: { base: ["ametralladora", "pesada"] },
  ingenieria: { base: ["fusil", "zapa"] },
  comunicaciones: { base: ["fusil"] },
  aerotransportada: { base: ["fusil", "ametralladora"], batallon: ["pesada", "mortero60", "misilAT"] },
  // v2.9.335 — el convoy va armado apenas: «asegurar CON LIMITACIONES su propia
  // defensa». No es una unidad de combate: es un blanco que hay que escoltar.
  convoy: { base: ["fusil"] },
};
function armamentoDe(u: any) {
  if (!u) return [];
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
  brecha: { id: "brecha", nom: "Abrir brecha", icono: "🛠️", tipo: "via",
    desc: "Abre paso por donde no se podía. Queda transitable — y la usan LOS DOS bandos.",
    horas: { camino: 1.5, libre: 1.5, restringido: 3, severo: 6 }, ancho: 0.6,
    soloIng: true, detalle: "Explosivos y maquinaria. Levanta también los obstáculos que encuentre en el paso." },
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
// Lo que cuesta ENTRAR en un campo minado, por medio. El de a pie pierde
// hombres; el vehículo pierde el vehículo, y por eso paga el doble.
// v2.9.353: el camión de llantas es lo que peor lleva una mina — sin blindaje
// de casco y con la carga arriba, un solo estallido saca del ruedo al vehículo
// y a lo que llevaba. Por eso el eje de abastecimiento se barre antes de usarlo.
const MINADO_PERDIDA: any = { pie: 0.10, oruga: 0.18, motor: 0.22, rueda: 0.30 };
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
function horasDeObra(u: any, obraId: string, pt: number[], terreno: any[]) {
  const obra: any = OBRAS[obraId];
  if (!obra) return 0;
  const clase = claseTerreno(pt, terreno);
  const base = obra.horas[clase] != null ? obra.horas[clase] : 4;
  const cap = capacidadObra(u);
  const rinde = (RINDE_ZAPA[u && u.escalon] || 1) * ((cap && cap.rinde) || 1);
  return base / Math.max(0.1, rinde);
}
function turnosDeObra(u: any, obraId: string, pt: number[], terreno: any[], horasTurno = 2) {
  const h = horasDeObra(u, obraId, pt, terreno);
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
  return Number(arma.uf) || 0;
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
const CONVOY_PODER = 15;
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
const CONVOY_CLASES = ["I", "AGUA", "III", "V", "EVAC"];
// Lo que restituye una entrega, en fracción del poder MÁXIMO de la unidad.
// Modesto a propósito: el apoyo de servicio de combate sostiene, no resucita.
const SOSTEN_PCT = 0.08;   // Clase I + agua: raciones y agua mantienen el rendimiento
const EVAC_PCT   = 0.15;   // evacuación: el herido tratado a tiempo vuelve a la línea
function cargaTotal(u: any) { return CONVOY_CLASES.reduce((a, k) => a + cargaDe(u, k), 0); }
function claseQueLleva(u: any) { return CONVOY_CLASES.find((k) => cargaDe(u, k) > 0) || null; }
function gastarCarga(u: any, clase: string) {
  if (!u.carga) u.carga = {};
  u.carga[clase] = Math.max(0, cargaDe(u, clase) - 1);
}
function fuenteDeApoyo(x: any) {
  if (!x) return null;
  if (x.tipo && INSTAL_LOG[x.tipo]) {
    const I = INSTAL_LOG[x.tipo];
    const pt = puntoInstalacion(x);
    if (!pt) return null;
    // v2.9.344: agotada no entrega nada. Sigue en la carta (el G-4 la ve y sabe
    // que tiene que reponerla), pero deja de reabastecer.
    if (instalSeca(x)) return null;
    return { nom: I.nom, pt, bando: x.bando, convoy: null, instal: x,
      combustible: I.combustible || 0, municion: I.municion || 0,
      sostiene: I.sostiene || 0, evacua: I.sanidad || 0 };
  }
  if (esConvoy(x) && x.estado !== "fuera_combate" && cargaTotal(x) > 0) {
    return { nom: `Convoy ${(x.designacion || "").trim()}`.trim(), pt: [x.lng, x.lat],
      bando: x.bando, convoy: x,
      combustible: cargaDe(x, "III") > 0 ? 1 : 0,
      municion: cargaDe(x, "V") > 0 ? 1 : 0,
      sostiene: (cargaDe(x, "I") > 0 || cargaDe(x, "AGUA") > 0) ? 1 : 0,
      evacua: cargaDe(x, "EVAC") > 0 ? 1 : 0 };
  }
  return null;
}
function recargarConvoy(cv: any, instalaciones: any[]) {
  if (!esConvoy(cv) || cv.estado === "fuera_combate") return null;
  const cerca = (instalaciones || []).filter((x: any) => {
    if (!x || !x.tipo || !INSTAL_LOG[x.tipo] || x.bando !== cv.bando) return false;
    const pt = puntoInstalacion(x);
    return pt && haversineKm([cv.lng, cv.lat], pt) <= REABASTECER_KM;
  });
  if (!cerca.length) return null;
  // v2.9.351 — se recarga con lo que el puesto DESPACHA, cualquiera de las cinco
  // clases. El que volvió cargando agua vuelve a salir con agua; el que volvió
  // vacío toma lo primero que este puesto reparta.
  const dan = new Set<string>();
  for (const x of cerca) for (const k of (INSTAL_LOG[x.tipo].despacha || [])) dan.add(k);
  const nombres = [...new Set(cerca.map((x: any) => INSTAL_LOG[x.tipo].nom))];
  if (!cv.carga) cv.carga = {};
  const partes: string[] = [];
  const llevaba = CONVOY_CLASES.filter((k) => cargaDe(cv, k) > 0);
  const aCargar = llevaba.length ? llevaba.filter((k) => dan.has(k))
                                 : CONVOY_CLASES.filter((k) => dan.has(k)).slice(0, 1);
  for (const k of aCargar) {
    if (cargaDe(cv, k) >= CONVOY_CAPACIDAD) continue;
    cv.carga[k] = CONVOY_CAPACIDAD;
    partes.push(`${CONVOY_CAPACIDAD} cargas de ${k === "AGUA" ? "agua" : "Clase " + k}`);
  }
  if (!partes.length) return null;
  return { texto: `🚚 <b>${nombreUnidad(cv)}</b> recargó en ${nombres.join(" + ")} — ${partes.join(" · ")}. `
    + `Listo para salir.` };
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
function reabastecer(u: any, fuentes: any[]) {
  if (!u || u.estado === "fuera_combate") return null;
  if (esConvoy(u)) return null;       // el convoy se RECARGA, no se «reabastece»
  const cerca = (fuentes || []).map(fuenteDeApoyo).filter((f: any) =>
    f && f.bando === u.bando && haversineKm([u.lng, u.lat], f.pt) <= REABASTECER_KM);
  if (!cerca.length) return null;
  // Las FIJAS mandan sobre los convoyes: la carga del convoy es escasa y no se
  // gasta en una unidad que ya está parada sobre el Puesto de Distribución.
  const fijas = cerca.filter((f: any) => !f.convoy);
  const moviles = cerca.filter((f: any) => f.convoy);
  const mejor = (lista: any[], campo: string) => lista.reduce((a: any, b: any) =>
    ((b[campo] || 0) > ((a && a[campo]) || 0) ? b : a), null);
  let fC: any = mejor(fijas, "combustible");
  if (!fC || !fC.combustible) fC = mejor(moviles, "combustible");
  let fM: any = mejor(fijas, "municion");
  if (!fM || !fM.municion) fM = mejor(moviles, "municion");
  const topeC = (fC && fC.combustible) || 0;
  const topeM = (fM && fM.municion) || 0;
  const nombres = [...new Set([fC, fM].filter((f: any) => f && (f.combustible || f.municion)).map((f: any) => f.nom))];
  const partes: string[] = [];
  let repC = 0, repM = 0;
  const tanque = AUTONOMIA_KM[medioDe(u)] || 0;
  if (tanque > 0 && topeC > 0) {
    const gastado = Number(u.combustible_km) || 0;
    if (gastado > 0.05) {
      const repone = Math.min(gastado, tanque * topeC);
      u.combustible_km = Number((gastado - repone).toFixed(2));
      repC = repone;
      partes.push(`⛽ Cl III: +${repone.toFixed(0)} km de autonomía `
        + `(queda con ${(tanque - u.combustible_km).toFixed(0)} de ${tanque} km)`);
      if (fC && fC.convoy) gastarCarga(fC.convoy, "III");   // ese viaje se gastó
      else if (fC && fC.instal) gastarCargaInstal(fC.instal);   // v2.9.344: la estiba baja
    }
  }
  if (topeM > 0) {
    const faltantes: string[] = [];
    for (const a of armamentoDe(u)) {
      if ((a as any).ingenieria || !a.uf) continue;
      const hay = municionDe(u, a.id);
      if (hay >= a.uf - 1e-6) continue;
      const repone = Math.min(a.uf - hay, a.uf * topeM);
      if (repone <= 1e-6) continue;
      if (!u.municion) u.municion = {};
      u.municion[a.id] = Number((hay + repone).toFixed(2));
      repM += repone;
      faltantes.push(`${a.nom} ${u.municion[a.id].toFixed(1)}/${a.uf} UF`);
    }
    if (faltantes.length) {
      partes.push(`🎯 Cl V: ${faltantes.join(" · ")}`);
      if (fM && fM.convoy) gastarCarga(fM.convoy, "V");
      else if (fM && fM.instal) gastarCargaInstal(fM.instal);   // v2.9.344
    }
  }
  // ============================================================
  // v2.9.351 — LO QUE HACEN LAS OTRAS CLASES.
  // Clase III repone autonomía y Clase V repone fuego. Clase I, el agua y la
  // evacuación no reponen ninguna de las dos: SOSTIENEN a la unidad. En el
  // juego eso es poder de combate — la unidad alimentada, con agua y con sus
  // heridos evacuados a tiempo rinde; la que no, se desgasta y no se recupera.
  // Es modesto y tiene tope: nunca pasa del poder máximo, así que no sirve para
  // «curar» una unidad destrozada, sino para sostener a la que aguanta.
  // ============================================================
  const clasesEntregadas: string[] = [];
  if (repC > 0) clasesEntregadas.push("III");
  if (repM > 0) clasesEntregadas.push("V");
  const tope = Math.max(0, Number(u.poder_max) || 0);
  const actual = Math.max(0, Number(u.poder_actual) || 0);
  let repP = 0;
  if (tope > 0 && actual < tope - 1e-6) {
    const mejorS = mejor(fijas, "sostiene") || mejor(moviles, "sostiene");
    const mejorE = mejor(fijas, "evacua") || mejor(moviles, "evacua");
    const falta = tope - actual;
    if (mejorS && mejorS.sostiene > 0) {
      const sube = Math.min(falta - repP, tope * SOSTEN_PCT);
      if (sube > 0.01) {
        repP += sube;
        partes.push(`🥫 Cl I y agua: sostenimiento, +${sube.toFixed(0)} de poder de combate`);
        clasesEntregadas.push("I");
        if (mejorS.convoy) gastarCarga(mejorS.convoy, cargaDe(mejorS.convoy, "AGUA") > 0 ? "AGUA" : "I");
        else if (mejorS.instal) gastarCargaInstal(mejorS.instal);
        if (!nombres.includes(mejorS.nom)) nombres.push(mejorS.nom);
      }
    }
    if (mejorE && mejorE.evacua > 0 && repP < falta) {
      const sube = Math.min(falta - repP, tope * EVAC_PCT);
      if (sube > 0.01) {
        repP += sube;
        partes.push(`🚑 Evacuación sanitaria: bajas evacuadas, +${sube.toFixed(0)} de poder de combate`);
        clasesEntregadas.push("EVAC");
        if (mejorE.convoy) gastarCarga(mejorE.convoy, "EVAC");
        else if (mejorE.instal) gastarCargaInstal(mejorE.instal);
        if (!nombres.includes(mejorE.nom)) nombres.push(mejorE.nom);
      }
    }
    if (repP > 0.01) {
      const nuevo = Math.min(tope, actual + repP);
      u.poder_actual = Number(nuevo.toFixed(2));
      u.estado = nuevo <= tope * 0.2 ? "fuera_combate" : (nuevo <= tope * 0.6 ? "desgastada" : "activa");
    }
  }
  if (!partes.length) return null;
  const aDomicilio = !!((fC && fC.convoy && repC > 0) || (fM && fM.convoy && repM > 0)
    || (repP > 0 && (moviles.some((f: any) => f.sostiene > 0 || f.evacua > 0))));
  // v2.9.344 — que se vea cuánto le queda a la estiba: el G-4 tiene que poder
  // prever la reposición ANTES de quedarse seco, no enterarse cuando ya pasó.
  for (const f of [fC, fM]) {
    if (!f || !f.instal) continue;
    const cap = capDe(f.instal), usado = usadoDe(f.instal);
    if (!cap) continue;
    const quedan = Math.max(0, cap - usado);
    if (quedan === 0) partes.push(`⛔ ${f.nom} quedó AGOTADO — hay que reponerlo del escalón superior`);
    else if (quedan <= Math.max(1, Math.round(cap * 0.25))) partes.push(`⚠️ ${f.nom}: quedan ${quedan} de ${cap} cargas`);
  }
  return { combustible: repC, municion: repM, poder: repP,
    clases: [...new Set(clasesEntregadas)], instalacion: nombres.join(" + "), aDomicilio,
    texto: `📦 <b>${nombreUnidad(u)}</b> se reabasteció ${aDomicilio ? "A DOMICILIO" : ""} `
      .replace(/ +$/, "") + ` en ${nombres.join(" + ")} — ${partes.join(" · ")}` };
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
function puedeResponder(defensor: any, atacante: any, terreno: any[]) {
  const arma: any = armaDeFuego(defensor, null);
  if (!arma) return { puede: false, arma: null as any, d: 0 };
  const d = haversineKm([defensor.lng, defensor.lat], [atacante.lng, atacante.lat]);
  // v2.9.230 — SIN MUNICIÓN NO HAY CONTRABATERÍA.
  const seco = municionDe(defensor, arma.id) <= 0;
  return { puede: d <= arma.alcance && !seco, arma, d, seco };
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
  const U = new Map(estado.unidades.map((u: any) => [u.id, { ...u }]));
  // v2.9.203: se guarda la RUTA (replay) y la bitácora cuenta cuánto avanzó, en
  // cuánto tiempo y qué peligros quedaron sobre la unidad. Los avisos se calculan
  // DESPUÉS de mover a todos: «a la vista de» depende de dónde quedaron los demás.
  const trazas: any[] = [];
  const movidas: any[] = [];
  // v2.9.225 — ROMPER CONTACTO. El choque por proximidad era OBLIGATORIO: dos
  // unidades enemigas cerca se trenzaban TODOS los turnos y al turno 60 no
  // quedaba nadie. Un comandante puede replegarse.
  const replegando = new Set();
  const posInicial = new Map([...U.values()].map((x: any) => [x.id, [x.lng, x.lat]]));
  for (const o of estado.ordenes || []) {
    if ((o.tipo !== "mover" && o.tipo !== "replegar") || o.destino_lat == null) continue;
    const u: any = U.get(o.unidad_id);
    if (!u || poderEfectivo(u) <= 0) continue;
    if (o.tipo === "replegar") replegando.add(u.id);
    // v2.9.220: si la orden trae RUTA, se recorre entera con el tiempo del turno.
    // Sin ruta (órdenes viejas), destino único: compatible hacia atrás.
    const pts = Array.isArray(o.ruta) && o.ruta.length ? o.ruta : [[o.destino_lng, o.destino_lat]];
    // v2.9.223 — SINCRONIZACIÓN: la orden puede arrancar más tarde dentro del
    // turno (H+1, H+1.5…) y entonces dispone sólo de las horas que quedan.
    const inicio = Math.max(0, Math.min(horas, Number(o.inicio) || 0));
    const r: any = moverPorRuta(u, pts, terreno, horas - inicio, estado.turno);
    r.inicio = inicio;
    // v2.9.225 — COMBUSTIBLE ACUMULADO DESDE EL PRINCIPIO.
    r.usadoAntes = Number(u.combustible_km) || 0;
    u.combustible_km = Number((r.usadoAntes + (r.consumoKm || 0)).toFixed(2));
    u.lng = r.lng; u.lat = r.lat;
    trazas.push({ id: u.id, bando: u.bando, designacion: u.designacion || null,
      ruta: ralearRuta(r.ruta), horas: r.horasUsadas, km: Number(r.avanzadoKm.toFixed(2)),
      llego: !!r.llego, detenida: !!r.detenida, destino: [o.destino_lng, o.destino_lat],
      consumidos: (r as any).consumidos || 0,
      inicio: (r as any).inicio || 0 });
    movidas.push({ u, r });
  }
  for (const { u, r } of movidas) {
    const avisos = avisosPosicion(u, [...U.values()], terreno, rango);
    // v2.9.225: además de qué pasó, CÓMO fue la marcha y qué costó.
    const marcha = textoMarcha(u, r, (r as any).usadoAntes);
    // v2.9.226 — CRUZAR UNA ZONA INTERDICTADA SE PAGA: ése es el efecto de la
    // interdicción — no destruye de entrada, encarece el paso.
    let castigo = "";
    if ((r as any).kmBatido > 0.05) {
      const bono = bonoDefensa([u.lng, u.lat], terreno);
      const perd = Math.min(0.6, (INTERDICCION_POR_KM * (r as any).kmBatido) / bono);
      const antes = poderEfectivo(u);
      const nuevo = Math.max(0, antes * (1 - perd));
      u.poder_actual = Number(nuevo.toFixed(2));
      u.estado = nuevo <= u.poder_max * 0.2 ? "fuera_combate" : (nuevo <= u.poder_max * 0.6 ? "desgastada" : "activa");
      castigo = ` ⛔ CRUZÓ ${(r as any).kmBatido.toFixed(1)} km de ZONA INTERDICTADA: perdió ${(antes - nuevo).toFixed(0)} `
        + `y quedó ${nuevo <= u.poder_max * 0.2 ? "FUERA DE COMBATE" : (nuevo <= u.poder_max * 0.6 ? "DESGASTADA" : "en condiciones")} `
        + `(${Math.round((100 * nuevo) / u.poder_max)} %).`;
    }
    // ============================================================
    // v2.9.324 — ENTRÓ EN UN CAMPO MINADO.
    // Cuesta bajas de golpe (no por kilómetro: el daño lo hace la PRIMERA fila)
    // y sobre todo cuesta TIEMPO — la unidad quedó parada donde lo encontró.
    // El motorizado y el de orugas pagan más: pierden el vehículo, no un hombre.
    // Y el hallazgo se cuenta a LOS DOS bandos: el que lo pisó porque lo sufre,
    // y el que lo sembró porque su obstáculo cumplió y tiene que aprovecharlo.
    // ============================================================
    if ((r as any).minado) {
      const z: any = (r as any).minado;
      const _md = medioDe(u);
      const perd = MINADO_PERDIDA[_md] != null ? MINADO_PERDIDA[_md] : 0.12;
      const antes = poderEfectivo(u);
      const nuevo = Math.max(0, antes * (1 - perd));
      u.poder_actual = Number(nuevo.toFixed(2));
      u.estado = nuevo <= u.poder_max * 0.2 ? "fuera_combate" : (nuevo <= u.poder_max * 0.6 ? "desgastada" : "activa");
      castigo += ` 💣 CAMPO MINADO: la marcha se DETUVO al borde del campo y perdió `
        + `${(antes - nuevo).toFixed(0)} (${Math.round((100 * nuevo) / u.poder_max)} %). `
        + `No se cruza por voluntad — hay que ABRIR BRECHA con ingeniería o rodearlo.`;
      eventos.push({ tipo: "obra", lat: u.lat, lng: u.lng,
        descripcion: `💣 ${nombreUnidad(u)} entró en un CAMPO MINADO ${z.bando ? "del " + String(z.bando).toUpperCase() : ""} `
          + `y quedó detenida. El obstáculo cumplió: ahora está fija y localizada.`,
        bandos_visibles: ["rojo", "azul"] });
    }
    eventos.push({ tipo: "movimiento", lat: u.lat, lng: u.lng,
      descripcion: textoMovimiento(u, r) + (marcha ? " " + marcha : "") + castigo
        + (avisos.length ? " " + avisos.join(" · ") : ""),
      bandos_visibles: [u.bando] });
  }
  // v2.9.217 — SE SEPARA EL FUEGO DELIBERADO DEL CHOQUE POR CONTACTO:
  //   a) la orden EXPLÍCITA de atacar usa el ALCANCE REAL del sistema elegido
  //      (el obús 155 bate a 24 km, la fusilería a 0,6). Antes TODO se resolvía
  //      al `rango` fijo de 3 km, así que elegir el arma no cambiaba nada.
  //   b) el choque automático entre unidades que se topan sigue a `rango`,
  //      porque eso modela el combate de encuentro, no el fuego planificado.
  const procesados = new Set();
  const disparadoras = new Set(); // abrieron fuego → quedan localizadas
  // v2.9.220: dónde cayeron los fuegos. Viaja en la RESPUESTA (no se guarda),
  // como las trazas, para que la pantalla pueda encender el incendio ahí.
  const impactos: any[] = [];
  // v2.9.226: zonas NUEVAS que deja el turno (interdicción). Éstas SÍ se
  // guardan: viven en wg_terreno hasta que vencen.
  const zonas: any[] = [];
  // v2.9.324: y las que DEJAN DE EXISTIR — los obstáculos que levantó una
  // brecha. Van por `id` de fila, así que el terreno tiene que llegar con id.
  const zonasBorrar: any[] = [];
  // v2.9.335: instalaciones logísticas que el fuego se llevó puestas.
  const _instalTodas: any[] = (estado.instalaciones || []).filter((x: any) => x && esInstalacionLog(x.tipo));
  const instalBorrar: any[] = [];
  // v2.9.325 — EL «ANTES» DEL TURNO, para poder evaluar las tareas al final.
  const _antes = new Map((estado.unidades || []).map((x: any) => [x.id, { ...x }]));
  const _obraTerminada = new Set();   // quién completó su obra este turno
  // Quién llega a este turno NEUTRALIZADA de un fuego anterior. Se marca ANTES
  // de resolver los combates para que la supresión pese en la relación de
  // fuerzas y no sea sólo un cartel en la bitácora.
  for (const x of U.values()) {
    (x as any)._suprimida = (x as any).suprimida_hasta != null
      && (Number(estado.turno) || 0) <= (x as any).suprimida_hasta;
  }
  // ---- v2.9.225: ROTURA DE CONTACTO, resuelta ANTES que nada ----
  // El contacto se juzga por dónde estaban al EMPEZAR el turno: desenganchar de
  // un enemigo que te tenía encima cuesta, aunque después te alejes 15 km. Si
  // no, replegarse saldría gratis y sería siempre la mejor jugada.
  for (const id of replegando) {
    const u: any = U.get(id);
    if (!u || poderEfectivo(u) <= 0) continue;
    const p0: any = posInicial.get(id); if (!p0) continue;
    let perseguidor: any = null, dMin = Infinity;
    for (const e of U.values()) {
      if ((e as any).bando === u.bando || poderEfectivo(e) <= 0) continue;
      const pe: any = posInicial.get((e as any).id); if (!pe) continue;
      const d = haversineKm(p0, pe);
      if (d <= rango && d < dMin) { dMin = d; perseguidor = e; }
    }
    if (!perseguidor) continue; // no estaba en contacto: se fue limpio
    procesados.add(u.id);
    if (replegando.has(perseguidor.id)) {
      procesados.add(perseguidor.id);
      eventos.push({ tipo: "combate", lat: u.lat, lng: u.lng,
        descripcion: `↩️ ${nombreUnidad(u)} y ${nombreUnidad(perseguidor)} ROMPIERON CONTACTO: `
          + `los dos se replegaron y no hubo empeño.`,
        bandos_visibles: ["rojo", "azul"], ratio: null, resultado: "sin_empeno" });
      continue;
    }
    const bono = bonoDefensa(p0, terreno);
    const perd = Math.min(0.5, 0.18 / bono);
    const antes = poderEfectivo(u);
    const nuevo = Math.max(0, antes * (1 - perd));
    u.poder_actual = Number(nuevo.toFixed(2));
    u.estado = nuevo <= u.poder_max * 0.2 ? "fuera_combate" : (nuevo <= u.poder_max * 0.6 ? "desgastada" : "activa");
    const armaP: any = armaDeFuego(perseguidor, null);
    if (armaP) {
      impactos.push({ lng: p0[0], lat: p0[1], radio: armaP.radio, arma: armaP.id,
        nom: armaP.nom, bando: perseguidor.bando, tocadas: 1, encuentro: true,
        desde: [perseguidor.lng, perseguidor.lat], indirecto: !!armaP.indirecto });
      disparadoras.add(perseguidor.id);
    }
    eventos.push({ tipo: "combate", lat: p0[1], lng: p0[0],
      descripcion: `↩️ ${nombreUnidad(u)} ROMPIÓ CONTACTO y se replegó bajo el fuego de `
        + `${nombreUnidad(perseguidor)} (lo tenía a ${dMin.toFixed(1)} km): aguantó el castigo de la `
        + `persecución y no devolvió fuego — perdió ${(antes - nuevo).toFixed(0)} y quedó `
        + `${nuevo <= u.poder_max * 0.2 ? "FUERA DE COMBATE" : (nuevo <= u.poder_max * 0.6 ? "DESGASTADA" : "en condiciones")} `
        + `(${Math.round((100 * nuevo) / u.poder_max)} %). Desenganchar cuesta, pero salva a la unidad.`,
      bandos_visibles: ["rojo", "azul"], ratio: null, resultado: "rompio_contacto" });
  }
  // ---- v2.9.234: OBRAS DE INGENIERÍA, antes del fuego (es trabajo, no combate) ----
  for (const o of estado.ordenes || []) {
    if (o.tipo !== "zapa" || !OBRAS[o.obra] || o.destino_lat == null) continue;
    const u: any = U.get(o.unidad_id);
    if (!u || poderEfectivo(u) <= 0) continue;
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
    const pt = [o.destino_lng, o.destino_lat];
    const dObra = haversineKm([u.lng, u.lat], pt);
    if (dObra > 1.0) {
      eventos.push({ tipo: "obra", bando: u.bando, lat: u.lat, lng: u.lng,
        descripcion: `🚧 ${nombreUnidad(u)}: NO PUDO TRABAJAR — la obra está a ${dObra.toFixed(1)} km `
          + `y hay que estar encima. Llevá la unidad al lugar primero.`,
        bandos_visibles: [u.bando] });
      continue;
    }
    const obra: any = OBRAS[o.obra];
    const t: any = u.trabajo;
    const mismo = t && t.obra === o.obra && haversineKm([t.lng, t.lat], pt) < 0.3;
    // v2.9.324: los turnos salen de las HORAS de trabajo divididas por lo que
    // dura un turno en ESTA partida.
    const horasObra = horasDeObra(u, o.obra, pt, terreno);
    const total = mismo ? t.total : turnosDeObra(u, o.obra, pt, terreno, horas);
    const restan = (mismo ? t.restan : total) - 1;
    if (restan > 0) {
      u.trabajo = { obra: o.obra, lng: pt[0], lat: pt[1], restan, total };
      eventos.push({ tipo: "obra", bando: u.bando, lat: pt[1], lng: pt[0],
        descripcion: `${obra.icono} ${nombreUnidad(u)} TRABAJA en «${obra.nom}» `
          + `(${horasObra.toFixed(1)} h de trabajo${cap.ing ? "" : " — a pico y pala, sin maquinaria"}) — `
          + `le faltan ${restan} de ${total} turnos. Si la mueven o la sacan de combate, se pierde el trabajo.`,
        bandos_visibles: [u.bando] });
      continue;
    }
    u.trabajo = null;
    zonas.push({ tipo: obra.tipo, centro: pt, radio: obra.ancho,
      hasta_turno: null, bando: u.bando, obra: o.obra });
    _obraTerminada.add(u.id);   // v2.9.325: para evaluar la tarea BLOQUEAR
    // ============================================================
    // v2.9.324 — LA BRECHA LEVANTA EL OBSTÁCULO. Cierra el ciclo doctrinal
    // completo: el defensor siembra, el atacante reconoce, trae ingeniería y
    // abre paso. Sin esto un campo minado era eterno y la brecha, un adorno.
    // ============================================================
    if (obra.id === "brecha") {
      for (const z of terreno || []) {
        if (!esObstaculoConstruido(z) || z.id == null) continue;
        const c = centroDeGeom(z.geojson);
        if (!c) continue;
        if (haversineKm(c, pt) > obra.ancho + 1.0) continue;
        zonasBorrar.push(z.id);
        eventos.push({ tipo: "obra", lat: c[1], lng: c[0],
          descripcion: `🛠️ ${nombreUnidad(u)} ABRIÓ BRECHA: el obstáculo ${z.bando ? "del " + String(z.bando).toUpperCase() + " " : ""}`
            + `que había en ese paso quedó levantado. Ahora se pasa.`,
          bandos_visibles: ["rojo", "azul"] });
      }
    }
    eventos.push({ tipo: "obra", bando: u.bando, lat: pt[1], lng: pt[0],
      descripcion: `✅ ${nombreUnidad(u)} TERMINÓ «${obra.nom}» en ${total} turno${total > 1 ? "s" : ""} `
        + `(${horasObra.toFixed(1)} h de trabajo). ` + obra.desc,
      // Un obstáculo terminado NO se anuncia al enemigo: se descubre cuando lo
      // encuentra. Lo que sí es público es abrir una brecha (se oye y se ve).
      bandos_visibles: obra.id === "brecha" ? ["rojo", "azul"] : [u.bando] });
  }
  for (const u of U.values()) {
    if (!u.trabajo) continue;
    const lejos = haversineKm([u.lng, u.lat], [u.trabajo.lng, u.trabajo.lat]) > 1.0;
    if (lejos || poderEfectivo(u) <= 0) {
      eventos.push({ tipo: "obra", bando: u.bando, lat: u.trabajo.lat, lng: u.trabajo.lng,
        descripcion: `🚧 ${nombreUnidad(u)}: se PERDIÓ el trabajo en «${OBRAS[u.trabajo.obra].nom}» — `
          + (lejos ? "la unidad dejó el lugar." : "la unidad quedó fuera de combate."),
        bandos_visibles: [u.bando] });
      u.trabajo = null;
    }
  }
  const lista = [...U.values()];
  // ============================================================
  // v2.9.268 — NO SE LE TIRA AL DESTINO. (corrección de Sergio)
  // «se supone que la unidad enemiga no sabe dónde llegará. Le puede disparar
  //  durante su desplazamiento, pero no al punto donde llegará.»
  // `resolverTurno` aplica PRIMERO el movimiento y RECIÉN DESPUÉS el fuego, así
  // que `def.lng/lat` ya era el punto de llegada: el enemigo tiraba con
  // información del futuro. Ahora se bate a la unidad EN SU MARCHA — el PRIMER
  // punto de su ruta real en que entró al alcance del tirador.
  // Espejo exacto de wargame-engine.js (mismo cambio, mismo nombre).
  // ============================================================
  const recorrido = new Map<any, any>(
    trazas.filter((t: any) => Array.isArray(t.ruta) && t.ruta.length > 1)
          .map((t: any) => [t.id, t.ruta] as [any, any])
  );
  function puntoDeEmpeno(desde: any, def: any, alcance: number) {
    const ruta = recorrido.get(def.id);
    if (!ruta) return [def.lng, def.lat];   // no se movió: se lo bate donde está
    let mejor: any = null, dMejor = Infinity;
    for (const p of ruta) {
      const d = haversineKm(desde, p);
      if (d <= alcance) return p;           // ← el instante en que entró al alcance
      if (d < dMejor) { dMejor = d; mejor = p; }
    }
    return mejor || [def.lng, def.lat];     // nunca entró: lo más cerca que pasó
  }
  // v2.9.270 — Y EL CHOQUE DE ENCUENTRO, IGUAL: dos que se topan no se trenzan
  // en sus puntos de llegada, sino DONDE SE ENCONTRARON. Se recorren las dos
  // marchas a la par y se toma el primer momento dentro del rango.
  // Espejo exacto de wargame-engine.js.
  function puntoDeContacto(a: any, b: any, rango: number) {
    const ra = recorrido.get(a.id), rb = recorrido.get(b.id);
    if (!ra && !rb) return [[a.lng, a.lat], [b.lng, b.lat]];
    const N = Math.max(ra ? ra.length : 1, rb ? rb.length : 1);
    const en = (r: any, u: any, k: number) => (!r || !r.length)
      ? [u.lng, u.lat]
      : r[Math.min(r.length - 1, Math.round((k / Math.max(1, N - 1)) * (r.length - 1)))];
    for (let k = 0; k < N; k++) {
      const pa = en(ra, a, k), pb = en(rb, b, k);
      if (haversineKm(pa, pb) <= rango) return [pa, pb];
    }
    return [[a.lng, a.lat], [b.lng, b.lat]];
  }
  for (const o of estado.ordenes || []) {
    if (o.tipo !== "atacar" || !o.objetivo_id) continue;
    const atac: any = U.get(o.unidad_id), def: any = U.get(o.objetivo_id);
    if (!atac || !def || atac.bando === def.bando) continue;
    if (poderEfectivo(atac) <= 0 || poderEfectivo(def) <= 0) continue;
    const arma: any = armaDeFuego(atac, o.arma);
    if (!arma) continue; // no tiene con qué batir (p. ej. sólo medios de zapa)
    // v2.9.230 — SIN MUNICIÓN NO SE TIRA, y se dice.
    if (municionDe(atac, arma.id) <= 0) {
      eventos.push({ tipo: "sin_municion", bando: atac.bando, lat: atac.lat, lng: atac.lng,
        descripcion: `🚫 ${nombreUnidad(atac)}: NO PUDO ABRIR FUEGO sobre ${nombreUnidad(def)} — `
          + `${arma.nom} SIN MUNICIÓN. La orden se pierde hasta que la reabastezcan.`,
        bandos_visibles: [atac.bando] });
      continue;
    }
    gastarMunicion(atac, arma.id, COSTO_UF.empeno);
    // v2.9.268: se bate a la unidad EN SU MARCHA, no en su punto de llegada.
    const posTirador = [atac.lng, atac.lat];
    const blanco: any = puntoDeEmpeno(posTirador, def, arma.alcance);
    const d = haversineKm(posTirador, blanco);
    disparadoras.add(atac.id); // apretó el gatillo, haya dado o no
    if (d > arma.alcance) {
      // TIRO CORTO: dispara igual, gasta munición y se delata. No se marca como
      // procesado — si además quedó al alcance del contacto, el choque de (b) se
      // resuelve aparte, que es lo que pasa cuando tirás largo y después te los
      // encontrás de frente.
      eventos.push({ tipo: "fuego_perdido", bando: atac.bando, lat: atac.lat, lng: atac.lng,
        descripcion: textoFuegoPerdido(atac, def, arma, d), bandos_visibles: [atac.bando] });
      eventos.push({ tipo: "fuego_detectado", bando: def.bando, lat: atac.lat, lng: atac.lng,
        descripcion: `👂 ${nombreUnidad(def)}: le tiraron y los proyectiles cayeron cortos — el tirador quedó LOCALIZADO (${nombreUnidad(atac)}, a ${d.toFixed(1)} km).`,
        bandos_visibles: [def.bando] });
      continue;
    }
    // v2.9.223 — ¿EL BLANCO PUEDE CONTESTAR? De eso depende que el tirador pague.
    const resp: any = puedeResponder(def, atac, terreno);
    aplicarCombate(resolverCombate([atac], def, terreno, arma, resp.puede),
      U, eventos, def, [atac], arma, resp);
    // v2.9.221: el empeño a una ficha también se ve.
    // v2.9.268: el proyectil cae DONDE FUE EMPEÑADA, no en su destino.
    impactos.push({ lng: blanco[0], lat: blanco[1], radio: arma.radio, arma: arma.id,
      nom: arma.nom, bando: atac.bando, tocadas: 1,
      desde: posTirador, indirecto: !!arma.indirecto });
    // v2.9.223 — FUEGO CRUZADO: si contesta, sale el tiro de vuelta.
    if (resp.puede && resp.arma && poderEfectivo(def) > 0 && municionDe(def, resp.arma.id) > 0) {
      gastarMunicion(def, resp.arma.id, COSTO_UF.empeno);
      // v2.9.268: y contesta DESDE donde la empeñaron, no desde su destino.
      impactos.push({ lng: atac.lng, lat: atac.lat, radio: resp.arma.radio, arma: resp.arma.id,
        nom: resp.arma.nom, bando: def.bando, tocadas: 1, respuesta: true,
        desde: blanco, indirecto: !!resp.arma.indirecto });
      disparadoras.add(def.id);
    }
    procesados.add(def.id);
  }
  // a2) CONCENTRACIÓN DE FUEGO sobre un PUNTO (v2.9.219): el EM marca DÓNDE
  // quiere los fuegos, no a quién.
  for (const o of estado.ordenes || []) {
    if (o.tipo !== "fuego" || o.destino_lat == null) continue;
    const atac: any = U.get(o.unidad_id);
    if (!atac || poderEfectivo(atac) <= 0) continue;
    const arma: any = armaDeFuego(atac, o.arma);
    if (!arma) continue;
    const punto = [o.destino_lng, o.destino_lat];
    disparadoras.add(atac.id); // pedir fuego también delata
    // v2.9.226 — MISIÓN DE ARTILLERÍA. Interdictar no es destruir.
    const mision = MISIONES[o.mision] ? o.mision : "destruccion";
    // v2.9.230: la concentración se paga en munición; la interdicción, el doble.
    const costo = COSTO_UF[mision] != null ? COSTO_UF[mision] : 1;
    if (municionDe(atac, arma.id) < costo) {
      eventos.push({ tipo: "sin_municion", bando: atac.bando, lat: atac.lat, lng: atac.lng,
        descripcion: `🚫 ${nombreUnidad(atac)}: NO PUDO TIRAR la concentración pedida — `
          + `${arma.nom} sin munición suficiente (${MISIONES[mision].nom} cuesta ${costo} UF y `
          + `le quedan ${municionDe(atac, arma.id)}). Hay que reabastecer.`,
        bandos_visibles: [atac.bando] });
      continue;
    }
    gastarMunicion(atac, arma.id, costo);
    const res: any = resolverFuegoArea(atac, punto, arma, [...U.values()], terreno);
    if (mision === "interdiccion") {
      if (!res.alcanza) {
        eventos.push({ tipo: "fuego_perdido", bando: atac.bando, lat: atac.lat, lng: atac.lng,
          descripcion: `🔥 ${nombreUnidad(atac)}: no puede INTERDICTAR ahí — ${arma.nom} bate hasta `
            + `${arma.alcance.toFixed(1)} km y el punto está a ${res.d.toFixed(1)} km. `
            + `Los tiros cayeron cortos: gastó munición y DELATÓ SU POSICIÓN.`,
          bandos_visibles: [atac.bando] });
        continue;
      }
      const dura = INTERDICCION_TURNOS[arma.id] || 2;
      zonas.push({ tipo: "interdiccion", centro: punto, radio: INTERDICCION_ANCHO,
        hasta_turno: (Number(estado.turno) || 0) + dura, bando: atac.bando, arma: arma.id });
      impactos.push({ lng: punto[0], lat: punto[1], radio: arma.radio, arma: arma.id,
        nom: arma.nom, bando: atac.bando, tocadas: res.tocadas.length, mision,
        desde: [atac.lng, atac.lat], indirecto: !!arma.indirecto });
      eventos.push({ tipo: "fuego", lat: punto[1], lng: punto[0],
        descripcion: `⛔ ${nombreUnidad(atac)} INTERDICTÓ con ${arma.nom} a ${res.d.toFixed(1)} km: `
          + `queda batida una faja de ${INTERDICCION_ANCHO} km de radio durante ${dura} turnos. `
          + `El que la cruce lo va a pagar — los propios TAMBIÉN.`,
        bandos_visibles: ["rojo", "azul"] });
      continue;
    }
    if (mision === "neutralizacion" && res.alcanza) {
      for (const t of res.tocadas) {
        const u2: any = U.get(t.u.id);
        if (!u2) continue;
        u2.suprimida_hasta = (Number(estado.turno) || 0) + 1;
      }
      impactos.push({ lng: punto[0], lat: punto[1], radio: arma.radio, arma: arma.id,
        nom: arma.nom, bando: atac.bando, tocadas: res.tocadas.length, mision,
        desde: [atac.lng, atac.lat], indirecto: !!arma.indirecto });
      eventos.push({ tipo: "fuego", lat: punto[1], lng: punto[0],
        descripcion: `🌀 ${nombreUnidad(atac)} NEUTRALIZÓ con ${arma.nom} a ${res.d.toFixed(1)} km: `
          + (res.tocadas.length
            ? `${res.tocadas.map((t: any) => nombreUnidad(t.u)).join(" · ")} quedó SUPRIMIDA — combate a media máquina el turno que viene, pero no fue destruida.`
            : `no había nadie en la zona. Munición gastada y posición delatada.`),
        bandos_visibles: res.tocadas.length ? ["rojo", "azul"] : [atac.bando] });
      continue;
    }
    if (!res.alcanza) {
      eventos.push({ tipo: "fuego_perdido", bando: atac.bando, lat: atac.lat, lng: atac.lng,
        descripcion: `🔥 ${nombreUnidad(atac)}: TIRO CORTO sobre la concentración pedida — `
          + `${arma.nom} bate hasta ${arma.alcance.toFixed(1)} km y el punto está a ${res.d.toFixed(1)} km. `
          + `Los tiros cayeron cortos: gastó munición y DELATÓ SU POSICIÓN.`,
        bandos_visibles: [atac.bando] });
      continue;
    }
    for (const b of res.bajas) {
      const u: any = U.get(b.id);
      if (u) { u.poder_actual = b.poderNuevo; u.estado = b.estado; }
    }
    // v2.9.335 — ¿cayó sobre una instalación logística enemiga? Se la lleva.
    for (const x of instalacionesBatidas(punto, arma, _instalTodas, atac.bando)) {
      if (instalBorrar.includes(x.id)) continue;
      instalBorrar.push(x.id);
      eventos.push({ tipo: "logistica", lat: punto[1], lng: punto[0],
        descripcion: `💥 ${nombreUnidad(atac)} DESTRUYÓ una instalación logística enemiga: `
          + `<b>${INSTAL_LOG[x.tipo].nom}</b>. Todo lo que dependía de ese punto se queda sin apoyo.`,
        bandos_visibles: ["rojo", "azul"] });
    }
    eventos.push({ tipo: "fuego", lat: punto[1], lng: punto[0],
      descripcion: textoFuego(atac, arma, res),
      bandos_visibles: res.tocadas.length ? ["rojo", "azul"] : [atac.bando] });
    impactos.push({ lng: punto[0], lat: punto[1], radio: arma.radio, arma: arma.id,
      nom: arma.nom, bando: atac.bando, tocadas: res.tocadas.length,
      // v2.9.221: DESDE DÓNDE salió el tiro y si va por elevación, para que la
      // pantalla dibuje el proyectil viajando (parábola o recta).
      desde: [atac.lng, atac.lat], indirecto: !!arma.indirecto });
  }
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const a: any = U.get((lista[i] as any).id), b: any = U.get((lista[j] as any).id);
      if (!a || !b || a.bando === b.bando) continue;
      if (poderEfectivo(a) <= 0 || poderEfectivo(b) <= 0) continue;
      if (procesados.has(a.id) || procesados.has(b.id)) continue;
      if (haversineKm([a.lng, a.lat], [b.lng, b.lat]) > rango) continue;
      const [atac, def] = poderEfectivo(a) >= poderEfectivo(b) ? [a, b] : [b, a];
      // v2.9.224 — EL COMBATE DE ENCUENTRO TAMBIÉN SE VE. Hasta acá sólo el
      // empeño ORDENADO generaba impactos: dos unidades que se topaban se
      // desgastaban en la bitácora sin que saliera un solo tiro en pantalla.
      const armaA: any = armaDeFuego(atac, null), armaD: any = armaDeFuego(def, null);
      // v2.9.230: trenzarse también consume, aunque menos.
      if (armaA) gastarMunicion(atac, armaA.id, COSTO_UF.encuentro);
      if (armaD) gastarMunicion(def, armaD.id, COSTO_UF.encuentro);
      // v2.9.270: se trenzan DONDE SE ENCONTRARON, no en sus puntos de llegada.
      const [pAtac, pDef]: any = puntoDeContacto(atac, def, rango);
      aplicarCombate(resolverCombate([atac], def, terreno), U, eventos, def, [atac], armaA,
        { puede: true, arma: armaD, d: haversineKm(pAtac, pDef) });
      if (armaA) {
        impactos.push({ lng: pDef[0], lat: pDef[1], radio: armaA.radio, arma: armaA.id,
          nom: armaA.nom, bando: atac.bando, tocadas: 1, encuentro: true,
          desde: pAtac, indirecto: !!armaA.indirecto });
        disparadoras.add(atac.id);
      }
      if (armaD) {
        impactos.push({ lng: pAtac[0], lat: pAtac[1], radio: armaD.radio, arma: armaD.id,
          nom: armaD.nom, bando: def.bando, tocadas: 1, respuesta: true, encuentro: true,
          desde: pDef, indirecto: !!armaD.indirecto });
        disparadoras.add(def.id);
      }
      procesados.add(a.id); procesados.add(b.id);
    }
  }
  const det = detectar([...U.values()], terreno, disparadoras);
  // ============================================================
  // v2.9.325 — SE JUZGA LA TAREA, no sólo se cuenta lo que pasó. Va al final:
  // hace falta el resultado del combate, del movimiento y de las detecciones.
  // El renglón lo ve SÓLO el bando que dio la orden — es su evaluación.
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
  // ¿Alguna unidad propia BATE por fuego el punto de la obra? Es la pregunta que
  // convierte un obstáculo en obstáculo: sin fuego encima, sólo cuesta tiempo.
  const _obraBatida = new Set();
  for (const id of _obraTerminada) {
    const z: any = U.get(id as any);
    if (!z) continue;
    const t: any = (estado.ordenes || []).find((o: any) => o.unidad_id === id && o.tipo === "zapa");
    const pt = t && t.destino_lng != null ? [t.destino_lng, t.destino_lat] : [z.lng, z.lat];
    for (const a of _vivas as any[]) {
      if (!a || a.bando !== z.bando || a.id === z.id || poderEfectivo(a) <= 0) continue;
      const arma: any = armaDeFuego(a, null);
      if (!arma || !arma.alcance) continue;
      if (haversineKm([a.lng, a.lat], pt) <= arma.alcance) { _obraBatida.add(id); break; }
    }
  }
  // v2.9.334 — FINAL DE JORNADA: SE REABASTECE. Va acá, después del combate,
  // porque así es en la realidad: se combate y al final de la jornada (o en los
  // altos) se repone. La que llegó hoy al Puesto de Distribución arranca mañana
  // con el tanque lleno.
  // Las que voló el fuego ya no reparten nada: la destrucción es de este turno.
  const _instal = _instalTodas.filter((x: any) => !instalBorrar.includes(x.id));
  const _convoyes: any[] = [...U.values()].filter(esConvoy);
  // v2.9.335 — EL CONVOY DESTRUIDO SE LLEVA SU CARGA. Es la lección de
  // interdictar el EPA: lo que se pierde no es una ficha, es el reabastecimiento
  // de quien la estaba esperando.
  for (const cv of _convoyes) {
    if (cv.estado !== "fuera_combate") continue;
    const perdidas = cargaTotal(cv);
    if (perdidas <= 0) continue;
    cv.carga = {}; for (const k of CONVOY_CLASES) cv.carga[k] = 0;
    eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
      descripcion: `💥 <b>${nombreUnidad(cv)}</b> fue destruido con ${perdidas} carga`
        + `${perdidas > 1 ? "s" : ""} a bordo. Ese abastecimiento NO llega: quien lo esperaba `
        + `se queda como está.`,
      bandos_visibles: [cv.bando] });
  }
  // v2.9.351 — LA DESCARGA SE VE. Sergio: «llega la unidad y debe haber una
  // animación como si estuviera descargando». Las entregas viajan igual que los
  // impactos: en la respuesta del turno y guardadas en `wg_replays`, para que la
  // vean LOS DOS navegadores del bando y no sólo el que apretó Jugar turno.
  const entregas: any[] = [];
  const _fuentes = [..._instal, ..._convoyes];
  if (_fuentes.length) {
    for (const u of U.values()) {
      const rep = reabastecer(u, _fuentes);
      if (!rep) continue;
      eventos.push({ tipo: "logistica", bando: (u as any).bando, lat: (u as any).lat, lng: (u as any).lng,
        descripcion: rep.texto, bandos_visibles: [(u as any).bando] });
      entregas.push({ uid: (u as any).id, bando: (u as any).bando,
        designacion: (u as any).designacion || null,
        lng: (u as any).lng, lat: (u as any).lat,
        clases: (rep as any).clases || [], aDomicilio: !!(rep as any).aDomicilio,
        de: (rep as any).instalacion || "" });
    }
  }
  // Y el convoy que volvió a la instalación completa sus cargas y sale de nuevo.
  if (_instal.length) {
    for (const cv of _convoyes) {
      const rec = recargarConvoy(cv, _instal);
      if (!rec) continue;
      eventos.push({ tipo: "logistica", bando: cv.bando, lat: cv.lat, lng: cv.lng,
        descripcion: rec.texto, bandos_visibles: [cv.bando] });
    }
  }

  for (const o of estado.ordenes || []) {
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
  return { unidades: [...U.values()], eventos, trazas, impactos, entregas, zonas, zonasBorrar, instalBorrar, instalActualizar, detecciones: { rojo: [...det.rojo], azul: [...det.azul] } };
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
function aplicarCombate(res: any, U: Map<any, any>, eventos: any[], defensor: any, atacantes?: any[], arma?: any, resp?: any) {
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
      ? ` ${nombreUnidad(defensor)} RESPONDIÓ el fuego con ${resp.arma.nom} (${resp.arma.alcance} km, y el tiro vino de ${resp.d.toFixed(1)} km): hubo fuego cruzado y se desgastaron los dos.`
      : (resp.seco
        ? ` ${nombreUnidad(defensor)} NO PUDO RESPONDER: ${resp.arma.nom} SIN MUNICIÓN — lo batieron sin costo para el tirador.`
        : ` ${nombreUnidad(defensor)} NO PUDO RESPONDER: su mayor alcance es ${resp.arma ? resp.arma.alcance + " km" : "nulo"} y el fuego vino de ${resp.d.toFixed(1)} km — por eso el tirador no sufrió bajas.`);
  }
  eventos.push({ tipo: "combate", lat: defensor.lat, lng: defensor.lng,
    descripcion: `⚔️ ${quienes} abrió fuego sobre ${nombreUnidad(defensor)}${conQue} — `
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
    "formar_convoy"];
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
       "formar_convoy"].includes(accion)) {
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
    return ok({ id: data?.[0]?.id });
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
    if (unidades.length) {
      const filas = unidades.filter((u: any) => u.lat != null && u.lng != null && u.bando).map((u: any) => {
        const poder = Number(u.poder_max) || 1;
        return { partida_id: partida.id, bando: u.bando === "rojo" ? "rojo" : "azul",
          designacion: u.designacion ? String(u.designacion).slice(0, 120) : null, escalon: u.escalon || null,
          arma: u.arma || null, medio: u.medio || "motor", lat: Number(u.lat), lng: Number(u.lng),
          poder_max: poder, poder_actual: poder, obs_km: u.obs_km != null ? Number(u.obs_km) : 4, estado: "activa" };
      });
      if (filas.length) { const { error } = await sb.from("wg_unidades").insert(filas); if (error) return err(`Unidades: ${error.message}`, 500); }
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
        .map((t: any) => ({ partida_id: partida.id, tipo: t.tipo, geojson: t.geojson }));
      if (filas.length) { const { error } = await sb.from("wg_terreno").insert(filas); if (error) return err(`Terreno: ${error.message}`, 500); }
      nT = filas.length;
    }
    // Totales acumulados, para que el frontend muestre el avance real.
    const { count: totU } = await sb.from("wg_unidades").select("id", { count: "exact", head: true }).eq("partida_id", partida.id);
    const { count: totT } = await sb.from("wg_terreno").select("id", { count: "exact", head: true }).eq("partida_id", partida.id);
    return ok({ unidades: nU, terreno: nT, total_unidades: totU || 0, total_terreno: totT || 0 });
  }
  if (accion === "cargar_terreno") {
    if (!arbitro) return err("Solo el árbitro carga el terreno", 403);
    const t = body.terreno || {};
    if (!t.tipo || !t.geojson) return err("Falta tipo/geojson del terreno");
    const { error } = await sb.from("wg_terreno").insert({ partida_id: partida.id, tipo: t.tipo, geojson: t.geojson });
    if (error) return err(error.message, 500);
    return ok();
  }
  if (accion === "iniciar") {
    if (!arbitro) return err("Solo el árbitro inicia la partida", 403);
    const { error } = await sb.from("wg_partidas").update({ estado: "en_curso", turno_actual: 1 }).eq("id", partida.id);
    if (error) return err(error.message, 500);
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
    const tipo = ["mover", "atacar", "defender", "fuego", "replegar", "zapa"].includes(o.tipo) ? o.tipo : null;
    if (!tipo) return err("Tipo de orden inválido (mover|atacar|defender|fuego|replegar)");
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

  // ---------- estado (CON NIEBLA DE GUERRA) ----------
  if (accion === "estado") {
    if (!puedeVer) return err("Clave de bando inválida o no sos el árbitro", 403);
    const { data: unidades } = await sb.from("wg_unidades").select("*").eq("partida_id", partida.id).limit(2000);
    const { data: bandos } = await sb.from("wg_bandos").select("bando, nombre, grupo_id").eq("partida_id", partida.id);
    // v2.9.201: el terreno importado del Generador pesa MB. Se manda una sola
    // vez (primera carga); en los refrescos el frontend pide incluir_terreno:false
    // y se queda con el que ya dibujó. Sin esto, cada 🔄 arrastraba 1,3 MB.
    let terreno: any[] | null = null;
    if (body.incluir_terreno !== false) {
      // v2.9.324 — ⚠️ SÓLO EL TERRENO DE VERDAD (`bando` nulo).
      // Las obras y las fajas interdictadas viven en esta misma tabla y llevan
      // `bando`. Si entraran acá pasarían dos cosas malas: se DUPLICARÍAN con
      // las que ahora van frescas en `obras`, y —peor— viajarían SIN NIEBLA,
      // porque este paquete se manda entero a los dos bandos. O sea que el
      // enemigo recibía tus campos minados en la primera carga.
      const { data } = await sb.from("wg_terreno").select("tipo, geojson")
        .eq("partida_id", partida.id).is("bando", null).limit(3000);
      terreno = data || [];
    }
    // ============================================================
    // v2.9.317 — LAS INSTALACIONES DEL G-4 VIAJAN SIEMPRE, APARTE DEL TERRENO.
    //
    // El terreno se manda UNA sola vez y el navegador lo cachea (son MB del
    // escenario importado). Si las instalaciones fueran dentro de ese paquete,
    // el G-4 ubicaría un puesto de abastecimiento y NADIE MÁS LO VERÍA hasta
    // recargar la página — el mismo agujero de la 282, con otro disfraz.
    // Son un puñado de puntos, así que van sueltas y frescas en cada refresco,
    // con su `id` (para poder quitarlas) y su `bando` (cada EM ve las suyas).
    // ============================================================
    const { data: instal } = await sb.from("wg_terreno")
      .select("id, tipo, bando, geojson").eq("partida_id", partida.id)
      .like("tipo", "log\\_%").limit(400);
    const instalaciones = (instal || []).filter((x: any) => arbitro || (miBando && x.bando === miBando.bando));
    // Niebla: el EM ve SUS unidades + enemigos detectados en el último turno resuelto.
    let visibles = unidades || [];
    if (!arbitro && miBando) {
      const turnoDet = Math.max(0, (partida.turno_actual || 1) - 1);
      const { data: det } = await sb.from("wg_detecciones").select("unidad_id").eq("partida_id", partida.id).eq("turno", turnoDet).eq("bando_observador", miBando.bando);
      const detectadas = new Set((det || []).map((d: any) => d.unidad_id));
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
      const turnoDet = Math.max(0, (partida.turno_actual || 1) - 1);
      const { data: det } = await sb.from("wg_detecciones")
        .select("unidad_id, bando_observador").eq("partida_id", partida.id).eq("turno", turnoDet);
      detPorBando = { rojo: [], azul: [] };
      for (const d of (det || [])) {
        if (detPorBando[d.bando_observador]) detPorBando[d.bando_observador].push(d.unidad_id);
      }
    }
    // Mis órdenes ya enviadas este turno.
    let misOrdenes: any[] = [];
    if (arbitro || miBando) {
      const q = sb.from("wg_ordenes").select("*").eq("partida_id", partida.id).eq("turno", partida.turno_actual);
      const { data: ords } = arbitro ? await q : await q.eq("bando", miBando.bando);
      misOrdenes = ords || [];
    }
    // v2.9.286 — LA CARTA DEL BANDO: lo que su dron SUBIÓ. Es lo único que ve
    // el Estado Mayor fuera del visor, así que va siempre. Al árbitro se le
    // mandan las dos cartas, para que pueda juzgar con qué información decidió
    // cada uno.
    const { data: intel } = await sb.from("wg_inteligencia")
      .select("bando, unidad_id, nivel, lat, lng, turno, datos, reportado_en")
      .eq("partida_id", partida.id)
      .in("bando", arbitro ? ["rojo", "azul"] : [miBando.bando]);
    // ============================================================
    // v2.9.324 — LAS OBRAS VIAJAN FRESCAS, APARTE DEL TERRENO. (⚠️ ERA UN BUG.)
    //
    // El terreno se manda UNA sola vez y el navegador lo cachea (`incluir_terreno:
    // !WG.terreno`), porque un escenario importado pesa MB. Pero las obras
    // terminadas y las fajas interdictadas se guardan en esa MISMA tabla… así
    // que hasta acá una posición defensiva o un obstáculo recién construido NO
    // APARECÍA EN NINGUNA PANTALLA hasta que alguien recargaba la página. Se
    // trabajaban tres turnos y no se veía el resultado.
    // Es EXACTAMENTE el agujero de la v2.9.282 y de las instalaciones del G-4
    // (v2.9.317), por tercera vez y con otro disfraz. Son un puñado de círculos:
    // van sueltos y frescos en cada refresco.
    //
    // NIEBLA: un obstáculo enemigo no se anuncia. Se ve cuando alguna unidad
    // propia lo tiene a la vista — y el que lo pisa lo tiene a cero metros, así
    // que descubrirlo a los golpes también funciona, sin guardar nada.
    // La distancia sale del `obs_km` liso de la unidad, sin los multiplicadores
    // de terreno: acá no se está detectando una unidad que se esconde, sino una
    // obra en el suelo, y el número tiene que dar igual en las dos pantallas.
    // ============================================================
    const { data: obrasRaw } = await sb.from("wg_terreno")
      .select("id, tipo, bando, geojson, hasta_turno")
      .eq("partida_id", partida.id).not("bando", "is", null)
      .in("tipo", TIPOS_MOTOR).limit(600);
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
      unidades: visibles, ordenes: misOrdenes, inteligencia: intel || [],
      instalaciones,              // v2.9.317: las del G-4, siempre frescas
      obras,                      // v2.9.324: obras y fajas, siempre frescas y con niebla
      detecciones: detPorBando,   // v2.9.233: sólo para el árbitro
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
    return ok({ turno_actual: partida.turno_actual, estado_partida: partida.estado, vistos });
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
    if (!CONVOY_CLASES.includes(clase)) return err(`Clase desconocida: ${clase}`);
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
    if (!(I.despacha || []).includes(clase)) {
      return err(`${I.nom} no despacha ${clase === "AGUA" ? "agua" : (clase === "EVAC" ? "evacuación sanitaria" : "Clase " + clase)}`);
    }
    const pt = puntoInstalacion(f);
    if (!pt) return err("Esa instalación no tiene posición");
    const carga: any = {};
    for (const k of CONVOY_CLASES) carga[k] = 0;
    carga[clase] = CONVOY_CAPACIDAD;
    const { count } = await sb.from("wg_unidades").select("id", { count: "exact", head: true })
      .eq("partida_id", partida.id).eq("bando", bandoCv).eq("arma", CONVOY_ARMA);
    const desig = String(body.designacion || "").trim().slice(0, 30)
      || `Cnv-${clase}-${(Number(count) || 0) + 1}`;
    // v2.9.347 — EL CONVOY FORMA AFUERA DEL PUESTO, NO ENCIMA.
    // Nacía en las coordenadas EXACTAS de la instalación, así que quedaba
    // tapado bajo su símbolo: el G-4 formaba cuatro convoyes, los veía en la
    // lista y en el mapa no había ninguno. Además es lo que se hace: la columna
    // se forma fuera del puesto y de ahí arranca la marcha.
    // Cada uno sale en un rumbo distinto para que no se apilen entre ellos.
    const nCv = Number(count) || 0;
    const RAD_SALIDA_KM = 0.6;
    const ang = (nCv * 55) * Math.PI / 180;
    const dLat = (RAD_SALIDA_KM / 111.32) * Math.cos(ang);
    const dLng = (RAD_SALIDA_KM / (111.32 * Math.max(0.15, Math.cos(pt[1] * Math.PI / 180)))) * Math.sin(ang);
    const sale = [pt[0] + dLng, pt[1] + dLat];
    const { data, error } = await sb.from("wg_unidades").insert({
      partida_id: partida.id, bando: bandoCv, designacion: desig, escalon: "seccion",
      arma: CONVOY_ARMA, medio: "motor", lat: sale[1], lng: sale[0],
      poder_max: CONVOY_PODER, poder_actual: CONVOY_PODER, obs_km: CONVOY_OBS_KM,
      estado: "activa", combustible_km: 0, carga,
    }).select("id").limit(1);
    if (error) return err(error.message, 500);
    return ok({ id: data && data[0] ? data[0].id : null, designacion: desig });
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
    let q = sb.from("wg_eventos").select("turno, tipo, descripcion, lat, lng, creado_en").eq("partida_id", partida.id).order("turno", { ascending: false }).order("creado_en", { ascending: false }).limit(200);
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
    const { data: unidades } = await sb.from("wg_unidades").select("*").eq("partida_id", partida.id);
    // Sólo el terreno DOCTRINAL entra al motor: las capas visuales (ríos,
    // caminos, curvas de nivel) no tienen efecto táctico y sólo lo harían lento.
    // v2.9.324: con `id`, porque una brecha LEVANTA obstáculos y hay que poder
    // decir qué filas se borran.
    const { data: terreno } = await sb.from("wg_terreno").select("id, tipo, geojson, hasta_turno, bando")
      .eq("partida_id", partida.id).in("tipo", TIPOS_MOTOR);
    // v2.9.334: las instalaciones del G-4 entran al motor. Van APARTE del
    // terreno porque no son accidentes del terreno: no frenan ni protegen a
    // nadie, reabastecen. Y van sin filtro de bando: el motor resuelve el turno
    // de los DOS, y cada uno sólo se reabastece en las suyas.
    const { data: instalLog } = await sb.from("wg_terreno").select("id, tipo, geojson, bando")
      .eq("partida_id", partida.id).like("tipo", "log\\_%").limit(400);
    const { data: ordenes } = await sb.from("wg_ordenes").select("*").eq("partida_id", partida.id).eq("turno", turno);
    let res: any;
    try {
      res = resolverTurno({
        duracion_turno_horas: partida.duracion_turno_horas, rango_combate_km: body.rango_combate_km || 3,
        turno, // v2.9.226: las zonas interdictadas vencen, y la supresión también
        terreno: terreno || [], unidades: unidades || [], ordenes: ordenes || [],
        instalaciones: instalLog || [],   // v2.9.334
      });
    } catch (e) {
      return err(`Error al resolver el turno: ${(e as any)?.message || e}`, 500);
    }
    // v2.9.198: antes los errores de base se IGNORABAN (no se leía `error`), así
    // que un fallo al persistir pasaba desapercibido o salía como un 500 mudo.
    // Ahora cada escritura informa qué falló exactamente.
    for (const u of res.unidades) {
      const { error: eU } = await sb.from("wg_unidades")
        .update({ lat: u.lat, lng: u.lng, poder_actual: u.poder_actual, estado: u.estado,
          combustible_km: u.combustible_km ?? 0,
          // v2.9.230: la munición gastada se guarda, si no el límite no existe
          // entre turnos y «apoyar por fuego» vuelve a ser gratis.
          municion: u.municion ?? null,
          carga: u.carga ?? null,       // v2.9.335: lo que lleva el convoy
          trabajo: u.trabajo ?? null,   // v2.9.234: avance de la obra entre turnos
          suprimida_hasta: u.suprimida_hasta ?? null }).eq("id", u.id);
      if (eU) return err(`No se pudo guardar la unidad ${u.designacion || u.id}: ${eU.message}`, 500);
    }
    if (res.eventos.length) {
      const { error: eE } = await sb.from("wg_eventos").insert(res.eventos.map((e: any) => ({
        partida_id: partida.id, turno, tipo: e.tipo, descripcion: e.descripcion,
        lat: e.lat ?? null, lng: e.lng ?? null, bandos_visibles: e.bandos_visibles || [],
      })));
      if (eE) return err(`No se pudo guardar la bitácora del turno: ${eE.message}`, 500);
    }
    // v2.9.226 — LAS ZONAS INTERDICTADAS SE GUARDAN. Viven en wg_terreno como
    // un tipo más (igual que los caminos) y vencen solas por `hasta_turno`: el
    // fuego de interdicción no dura para siempre.
    if ((res.zonas || []).length) {
      const filasZ = res.zonas.map((z: any) => ({
        // v2.9.234: el tipo lo pone la zona (interdicción, brecha, defensiva…),
        // no se fuerza más a "interdiccion".
        partida_id: partida.id, tipo: z.tipo || "interdiccion",
        geojson: { type: "Polygon", coordinates: [anilloKm(z.centro[0], z.centro[1], z.radio)] },
        hasta_turno: z.hasta_turno, bando: z.bando,
      }));
      const { error: eZ } = await sb.from("wg_terreno").insert(filasZ);
      if (eZ) return err(`No se pudieron guardar las zonas interdictadas: ${eZ.message}`, 500);
    }
    // v2.9.324 — LOS OBSTÁCULOS QUE LEVANTÓ UNA BRECHA. Se borran de verdad:
    // un campo minado abierto ya no existe, y dejarlo con una marca de «abierto»
    // sería un estado más que mantener para no ganar nada.
    if ((res.zonasBorrar || []).length) {
      const { error: eB } = await sb.from("wg_terreno").delete()
        .eq("partida_id", partida.id).in("id", res.zonasBorrar);
      if (eB) return err(`No se pudieron levantar los obstáculos de la brecha: ${eB.message}`, 500);
    }
    // v2.9.335 — las instalaciones logísticas que voló el fuego se borran de la
    // carta. Se filtra por `log_%` a propósito: nadie puede hacer desaparecer el
    // terreno del escenario por esta vía aunque el motor devolviera un id raro.
    if ((res.instalBorrar || []).length) {
      const { error: eI } = await sb.from("wg_terreno").delete()
        .eq("partida_id", partida.id).like("tipo", "log\\_%").in("id", res.instalBorrar);
      if (eI) return err(`No se pudieron borrar las instalaciones destruidas: ${eI.message}`, 500);
    }
    // v2.9.344 — LA ESTIBA QUE BAJÓ. Sin esto la capacidad no existiría entre
    // turnos y un Puesto de Distribución volvería a estar lleno cada vez.
    for (const it of (res.instalActualizar || [])) {
      const { error: eA } = await sb.from("wg_terreno")
        .update({ geojson: it.geojson }).eq("id", it.id).eq("partida_id", partida.id);
      if (eA) return err(`No se pudo guardar el consumo de una instalación: ${eA.message}`, 500);
    }
    // Detecciones (niebla) del turno.
    const detFilas: any[] = [];
    for (const id of res.detecciones.rojo) detFilas.push({ partida_id: partida.id, turno, bando_observador: "rojo", unidad_id: id });
    for (const id of res.detecciones.azul) detFilas.push({ partida_id: partida.id, turno, bando_observador: "azul", unidad_id: id });
    if (detFilas.length) {
      const { error: eD } = await sb.from("wg_detecciones")
        .upsert(detFilas, { onConflict: "partida_id,turno,bando_observador,unidad_id" });
      if (eD) return err(`No se pudieron guardar las detecciones (niebla de guerra): ${eD.message}`, 500);
    }
    // ============================================================
    // v2.9.282 — EL TURNO SE GUARDA PARA EL OTRO BANDO.
    // Hasta acá las trazas y los impactos sólo viajaban en la respuesta: los
    // veía el que apretó «Jugar turno» y nadie más. Guardarlos es lo que
    // permite que el otro Estado Mayor vea la MISMA acción cuando su sondeo
    // detecta que el turno corrió.
    // Se guarda ANTES de avanzar el turno a propósito: si esta escritura
    // fallara, el turno no avanza y se puede reintentar sin perder nada.
    // Turnos sin movimiento ni fuego no se guardan — no hay película que ver.
    if ((res.trazas || []).length || (res.impactos || []).length || (res.entregas || []).length) {
      const { error: eR } = await sb.from("wg_replays").upsert({
        partida_id: partida.id, turno,
        trazas: res.trazas || [], impactos: res.impactos || [], entregas: res.entregas || [],
      }, { onConflict: "partida_id,turno" });
      if (eR) return err(`No se pudo guardar el replay del turno: ${eR.message}`, 500);
    }
    // Marcar órdenes resueltas y avanzar el turno.
    const { error: eO } = await sb.from("wg_ordenes").update({ estado: "resuelta" })
      .eq("partida_id", partida.id).eq("turno", turno);
    if (eO) return err(`No se pudieron cerrar las órdenes del turno: ${eO.message}`, 500);
    const { error: eP } = await sb.from("wg_partidas")
      .update({ turno_actual: turno + 1, resolviendo_desde: null }).eq("id", partida.id);
    if (eP) return err(`No se pudo avanzar al turno siguiente: ${eP.message}`, 500);
    _avanzo = true;
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
