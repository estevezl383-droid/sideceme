// ================================================================================
// SIDECEME — Edge Function  notas-ops   (v2 — malla real + panel evaluador de ciclo)
//
// Carga y CONTROL de notas academicas SIN darle la cuenta de Supabase a nadie.
// El Excel se parsea EN EL NAVEGADOR (SheetJS) y aca llegan las filas ya limpias.
//
// >>> ESTE ARCHIVO VA EN LA FUNCION "notas-ops". NO CONFUNDIR CON aula-virtual-ops.
// >>> Si al pedir la accion "cargar_materia" la respuesta dice "Sesion no valida"
// >>> con tildes, es que aca esta pegado el codigo de OTRA funcion.
//
// Seguridad: JWT OFF + service_role. La autorizacion la hace validarSesion():
//   - token vigente en la tabla `sesiones`
//   - usuario_tabla = 'profesores'
//   - el rol REAL leido de la tabla profesores (rol + roles[]) debe incluir
//     'evaluaciones' o 'ciencia_tecnologia'
//
// Acciones: catalogo · cargar_materia · control · faltantes · mis_cargas
//           publicar_confirmaciones · estado_confirmaciones · fijar_plazo
//           borrar_carga · cargas_archivadas · restaurar_carga            (v2.9.369)
//           corregir_nota · historial_correcciones                        (v2.9.369)
//           correcciones_aviso · acusar_correccion                        (v2.9.370)
//
// NUEVO EN ESTA VERSION:
//  1) cargar_materia ahora resuelve `grupo` (el modulo real de la malla, tabla
//     av_materias) cuando el front no lo manda o llega vacio — antes las materias
//     del 2do semestre de cada ciclo quedaban con grupo=NULL y el cursante las
//     veia en la carpeta "OTRAS". Ver resolverGrupoDesdeMalla().
//  2) `control` ahora recorta la respuesta al ciclo del evaluador si
//     profesores.evaluador_ciclo esta seteado (1=1ER CICLO, 2=2DO CICLO). Ortiz
//     (P028) y Soto Farfan (P017) solo ven su ciclo; Diaz Andia/Balderrama (sin
//     evaluador_ciclo) siguen viendo todo, sin cambios.
//  3) Conformidad AUTOMATICA (decision de Sergio): toda nota cargada/actualizada
//     por cargar_materia arranca sola en notas_confirmaciones con estado
//     'pendiente' y un plazo por DEFECTO de 48h (PLAZO_DEFECTO_H) — no depende de
//     que el evaluador haga nada. Si a un alumno le cambia la nota (correccion)
//     y ya habia firmado/objetado, se REABRE a pendiente con firma limpia (la
//     firma vieja ya no vale para un numero distinto). Logica compartida en
//     publicarConfirmacionesInterno(), usada por cargar_materia Y por la accion
//     manual `publicar_confirmaciones` (sirve para re-avisar o incluir alumnos
//     nuevos sin tener que re-subir la planilla).
//  4) fijar_plazo: el evaluador de ciclo puede ACORTAR o EXTENDER el plazo de
//     48h por defecto para una materia ya publicada (recalcula desde el
//     publicado_en de cada alumno, no desde "ahora").
//  5) estado_confirmaciones: semaforo (verde firmo / rojo no respondio / guinda
//     objeto) que ve el evaluador. El lado del alumno vive en la EF nueva
//     `notas-confirmar`.
//
// v2.9.363 (2026-08-31): FIDELIDAD TOTAL de la nota. Ver el comentario marcado
//     ">>> v2.9.363" dentro de cargar_materia.
//
// v2.9.370 (2026-09-11): SE CORRIGE EL COMPONENTE, NO EL PROMEDIO.
//     `corregir_nota` recibe los bloques del desglose con el valor corregido y
//     RECALCULA aca la nota final, con la formula con que esa fila fue cargada
//     (ver "EL MOTOR DE LA NOTA"). Si la nota tiene desglose reconstruible,
//     escribir el promedio a mano queda prohibido. Cada correccion deja un
//     aviso PENDIENTE para el auxiliar que lleva la planilla, que responde con
//     su conformidad: `correcciones_aviso` + `acusar_correccion`.
//
// v2.9.430 (2026-10-02): AJUSTE DE DECIMALES. `corregir_nota` acepta tambien
//     `nota_final` cuando la nota tiene desglose, pero solo a menos de EPS_NOTA
//     del promedio del desglose (la planilla publicada redondea distinto que el
//     sistema). Queda en `cambios` como "NOTA FINAL · ajuste a mano".
// ================================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};

const ROLES_OK = ["evaluaciones", "ciencia_tecnologia"];
const MAX_FILAS = 400;
const CHUNK = 150;
const MAX_DETALLE = 4000;
const CICLO_TXT: Record<number, string> = { 1: "1ER CICLO", 2: "2DO CICLO" };
const PLAZO_DEFECTO_H = 48; // horas. El evaluador puede cambiarlo con `fijar_plazo`.
const PLAZO_MAX_H = 24 * 30; // tope de sensatez: 30 dias

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function ip(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip") || "desconocida";
}
function txt(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function entero(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.trunc(n);
}
// normaliza texto para matchear "GG. UU. CC." con "GG.UU.CC.", tildes, mayus/minus, etc.
// Los puntos y comas pasan a ESPACIO (no se borran) para que "GG.UU.CC." y
// "GG. UU. CC." caigan en el mismo texto: borrarlos daba "gguucc" vs "gg uu cc".
function normalizar(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // saca tildes
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Busca el modulo real de la malla (av_materias) para una materia, dado su ciclo
// (texto "1ER CICLO"/"2DO CICLO") y el semestre RELATIVO al ciclo (1 o 2).
// av_materias guarda el semestre ABSOLUTO (1..4): ciclo1 → tal cual, ciclo2 → +2.
async function resolverGrupoDesdeMalla(cicloTxt: string, semestreRel: number, materia: string): Promise<string | null> {
  const cicloNum = cicloTxt && cicloTxt.startsWith("2") ? 2 : 1;
  const semAbs = cicloNum === 1 ? semestreRel : semestreRel + 2;
  const { data, error } = await sb
    .from("av_materias")
    .select("nombre_uc, modulo")
    .eq("ciclo", cicloNum)
    .eq("semestre", semAbs);
  if (error || !data || !data.length) return null;
  const nMateria = normalizar(materia);
  // 1) intenta matchear contra el nombre de la Unidad de Competencia
  let hit = data.find((r: any) => normalizar(r.nombre_uc) === nMateria);
  // 2) si no matchea, puede que la materia cargada sea directamente el MODULO
  //    (ej. "ESTRATEGIA NACIONAL" carga consolidada de todo el modulo)
  if (!hit) hit = data.find((r: any) => normalizar(r.modulo) === nMateria);
  if (!hit) return null;
  return String(hit.modulo).toUpperCase();
}

async function validarSesion(token: string) {
  if (!token || typeof token !== "string" || token.length > 200) {
    return { error: "Token requerido", status: 400 };
  }
  const { data: ses, error } = await sb
    .from("sesiones")
    .select("usuario_id, usuario_tabla, revocado, expira_en")
    .eq("token", token)
    .maybeSingle();

  if (error || !ses) return { error: "Sesion invalida", status: 401 };
  if (ses.revocado === true) return { error: "Sesion revocada", status: 401 };
  if (new Date(ses.expira_en) < new Date()) return { error: "Sesion expirada", status: 401 };
  if (ses.usuario_tabla !== "profesores") {
    return { error: "Esta operacion es solo para personal de la Escuela", status: 403 };
  }

  const { data: prof } = await sb
    .from("profesores")
    .select("id, grado, nombre_completo, rol, roles, activo, es_auxiliar, es_suboficial, evaluador_ciclo")
    .eq("id", ses.usuario_id)
    .maybeSingle();

  if (!prof || prof.activo === false) return { error: "Usuario inactivo", status: 403 };

  const roles: string[] = [];
  if (prof.rol) roles.push(String(prof.rol).toLowerCase());
  if (Array.isArray(prof.roles)) for (const r of prof.roles) roles.push(String(r).toLowerCase());

  if (!roles.some((r) => ROLES_OK.includes(r))) {
    return { error: "Su cargo no tiene permiso para cargar ni controlar notas", status: 403 };
  }
  return { prof };
}

// Si el evaluador tiene ciclo asignado (Ortiz/Soto Farfan), solo puede operar
// sobre SU ciclo. Diaz Andia/Balderrama (evaluador_ciclo null) operan sobre todos.
function chequearCicloEvaluador(prof: any, cicloTxt: string | null): string | null {
  if (!prof.evaluador_ciclo) return null;
  const suyo = CICLO_TXT[prof.evaluador_ciclo];
  if (cicloTxt && cicloTxt !== suyo) {
    return "Su cargo de evaluador solo controla el " + suyo;
  }
  return null;
}

// El que CARGA no es el que deshace. Balderrama (S001) tiene rol 'evaluaciones'
// porque sube las planillas, pero es_auxiliar=true: no puede dar de baja una
// carga ni corregir una nota. Esto se verifica ACA, del lado del servidor: la
// leccion del auxiliar de Disciplina fue que el "no puede" que vive solo en la
// pantalla no es una restriccion, es una sugerencia.
function soloEvaluadorPleno(prof: any): string | null {
  if (prof.es_auxiliar === true) {
    return "Su cargo carga notas, pero la baja y la correccion las autoriza el evaluador de ciclo.";
  }
  return null;
}

// Las 7 columnas que agrega notas_archivadas y que NO existen en
// notas_academicas: hay que sacarlas antes de devolver una fila a su tabla.
const COLS_ARCHIVO = ["lote_id", "archivado_en", "archivado_por", "archivado_por_nombre",
  "motivo", "restaurado_en", "restaurado_por"];

// Crea/renueva las filas de notas_confirmaciones de una materia ya cargada.
// - Alumno sin fila todavia -> nueva, pendiente, plazo = ahora + horas.
// - Alumno con fila pendiente -> se refresca (nota_final/plazo) por si cambio algo.
// - Alumno que YA firmo u objeto Y la nota es la MISMA -> no se toca (su firma sigue valiendo).
// - Alumno que YA firmo u objeto pero la nota CAMBIO (correccion) -> se REABRE a
//   pendiente con firma/observacion limpias: la firma vieja no vale para un numero distinto.
async function publicarConfirmacionesInterno(
  gestion: number, semestre: number, ciclo: string, materia: string,
  profId: string | null, profNombre: string | null, horas: number,
): Promise<{ total: number; nuevas: number; reabiertas: number; sinTocar: number; plazoVenceEn: string | null; error?: string }> {
  const { data: filas, error: errFilas } = await sb
    .from("notas_academicas")
    .select("cursante_id, ci, grupo, nota_final")
    .eq("gestion", gestion).eq("semestre", semestre)
    .eq("ciclo", ciclo).eq("materia", materia);
  if (errFilas) return { total: 0, nuevas: 0, reabiertas: 0, sinTocar: 0, plazoVenceEn: null, error: "No se pudo leer la materia" };
  if (!filas || !filas.length) return { total: 0, nuevas: 0, reabiertas: 0, sinTocar: 0, plazoVenceEn: null };

  const { data: existentes } = await sb
    .from("notas_confirmaciones")
    .select("id, cursante_id, estado, nota_final")
    .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo).eq("materia", materia);
  const porCursante = new Map((existentes || []).map((c: any) => [String(c.cursante_id), c]));

  const now = new Date();
  const plazo = new Date(now.getTime() + horas * 3600000);
  let nuevas = 0, reabiertas = 0, sinTocar = 0;
  const upserts: any[] = [];

  for (const f of filas) {
    const ex = porCursante.get(String(f.cursante_id));
    if (ex) {
      const notaCambio = Number(ex.nota_final) !== Number(f.nota_final);
      if (ex.estado !== "pendiente" && !notaCambio) { sinTocar++; continue; } // firma/objecion sigue valida
      reabiertas++;
    } else {
      nuevas++;
    }
    upserts.push({
      cursante_id: f.cursante_id, ci: f.ci,
      gestion, semestre, ciclo, materia, grupo: f.grupo,
      nota_final: f.nota_final,
      estado: "pendiente",
      publicado_en: now.toISOString(), publicado_por: profId, publicado_por_nombre: profNombre,
      plazo_vence_en: plazo.toISOString(),
      firma_cursante: null, confirmada_en: null, observacion_cursante: null, huella_forense: null,
      actualizado_en: now.toISOString(),
    });
  }

  if (upserts.length) {
    const { error: errUp } = await sb
      .from("notas_confirmaciones")
      .upsert(upserts, { onConflict: "cursante_id,gestion,semestre,ciclo,materia" });
    if (errUp) return { total: filas.length, nuevas: 0, reabiertas: 0, sinTocar: 0, plazoVenceEn: null, error: errUp.message };
  }

  return { total: filas.length, nuevas, reabiertas, sinTocar, plazoVenceEn: plazo.toISOString() };
}

// ════════════════════════════════════════════════════════════════════════════
// v2.9.370 — EL MOTOR DE LA NOTA: como se arma la nota final desde su desglose
//
// Hasta la v2.9.369 corregir una nota era PISAR el promedio: el evaluador
// escribia el numero final y el desglose (trabajo / formativa / sumativa)
// quedaba intacto, contando otra cosa. Paso de verdad el 9-SEP-2026 con C045:
// el alumno pidio que le revisen la FORMATIVA, se corrigio 91.05521 -> 95.2381
// y el desglose siguio sumando 91.05521. La nota y su respaldo se divorciaron.
//
// Ahora se corrige EL COMPONENTE y la nota final se RECALCULA. Para eso hay que
// respetar el formato con que fue cargada cada fila, porque conviven dos:
//
//   modo "A" (porcentaje) — `aporte` es el PESO del bloque (10 / 30 / 60).
//        nota = Σ promedio(items del bloque) × aporte / 100
//        Es lo que carga el cargador actual. Todo 2026 sem. 2 es asi.
//
//   modo "B" (puntaje) — `aporte` son los PUNTOS YA PONDERADOS del bloque.
//        nota = Σ aporte
//        El peso no esta escrito pero se deriva: pct = aporte / promedio × 100.
//        Es lo cargado por SQL en 2025 y parte de 2026 sem. 1.
//
//   modo "C" — ninguna de las dos reproduce la nota guardada. No se toca el
//        desglose: solo queda corregir la nota final, avisando que es asi.
//
// El modo NO se adivina ni se pide al navegador: se DEDUCE probando cual de las
// dos formulas devuelve la nota que ya esta guardada. Si ninguna da, es C.
// ════════════════════════════════════════════════════════════════════════════
const EPS_NOTA = 0.01;   // tolerancia al comparar contra la nota guardada

// Saca el ruido del punto flotante (9.5 + 27.61905 + 53.93616 da
// 91.05521000000001 en binario) SIN redondear la nota: los decimales que el
// evaluador escribio se respetan enteros. Ver la regla de fidelidad: los 4
// decimales de la pantalla son presentacion, no almacenamiento.
function limpiar(n: number): number {
  return parseFloat(n.toFixed(10));
}

// Un casillero VACIO no es un cero. Number(null) y Number("") dan 0, y por ahi
// se colaba: dejar la formativa en blanco habria guardado 0 sin que nadie lo
// pidiera. Vacio = "no hay valor", y el bloque queda sin promedio.
function valorItem(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Promedio de los items de un bloque. null si el bloque no tiene numeros.
function promItems(b: any): number | null {
  const its = Array.isArray(b?.items) ? b.items : [];
  const vs = its.map((i: any) => valorItem(i?.v)).filter((n: number | null) => n !== null) as number[];
  if (!vs.length) return null;
  return vs.reduce((a: number, c: number) => a + c, 0) / vs.length;
}

function notaModoA(bloques: any[]): number | null {
  let t = 0;
  for (const b of bloques) {
    const p = promItems(b); const ap = Number(b?.aporte);
    if (p === null || !Number.isFinite(ap)) return null;
    t += p * ap / 100;
  }
  return t;
}

function notaModoB(bloques: any[]): number | null {
  let t = 0;
  for (const b of bloques) {
    const ap = Number(b?.aporte);
    if (!Number.isFinite(ap)) return null;
    t += ap;
  }
  return t;
}

function bloquesDe(detalle: any): any[] {
  const bl = detalle && Array.isArray(detalle.bloques) ? detalle.bloques : null;
  return bl && bl.length ? bl : [];
}

// Que formula reproduce la nota guardada. A gana si empatan.
function detectarModo(bloques: any[], notaGuardada: number): "A" | "B" | "C" {
  if (!bloques.length || !Number.isFinite(notaGuardada)) return "C";
  const a = notaModoA(bloques), b = notaModoB(bloques);
  if (a !== null && Math.abs(a - notaGuardada) < EPS_NOTA) return "A";
  if (b !== null && Math.abs(b - notaGuardada) < EPS_NOTA) return "B";
  // Ninguna da. Casi siempre es una nota que alguien PISO a mano y quedo
  // divorciada de su desglose — justo lo que esta version viene a arreglar
  // (paso con C045 el 9-SEP-2026). Si los aportes suman 100, el desglose es
  // de porcentajes igual y se puede corregir: seria absurdo que la unica nota
  // que hay que reparar sea la unica que no se deja tocar.
  const sumaAp = bloques.reduce((t: number, x: any) => t + (Number(x?.aporte) || 0), 0);
  if (Math.abs(sumaAp - 100) < 0.5) return "A";
  return "C";
}

// Lo que da el desglose hoy, con la formula del modo. Si no coincide con la
// nota guardada, esa nota fue pisada a mano.
function notaSegunDesglose(bloques: any[], modo: "A" | "B"): number | null {
  return modo === "A" ? notaModoA(bloques) : notaModoB(bloques);
}

// El navegador manda los bloques con los valores nuevos. Solo puede haber
// cambiado el `v` de un item: ni bloques de mas, ni items de mas, ni pesos
// distintos. Todo lo demas se toma de lo que YA esta guardado, no de lo que
// llego por la red.
function validarEstructura(orig: any[], nuevos: any[]): string | null {
  if (!Array.isArray(nuevos) || nuevos.length !== orig.length) {
    return "El desglose que llego no tiene los mismos bloques que la nota guardada";
  }
  for (let i = 0; i < orig.length; i++) {
    const o = orig[i], n = nuevos[i];
    if (String(o?.tipo ?? "") !== String(n?.tipo ?? "")) {
      return "El bloque " + (i + 1) + " cambio de nombre (" + o?.tipo + " / " + n?.tipo + ")";
    }
    const oi = Array.isArray(o?.items) ? o.items : [];
    const ni = Array.isArray(n?.items) ? n.items : [];
    if (oi.length !== ni.length) {
      return "El bloque '" + o?.tipo + "' cambio de cantidad de items";
    }
    for (let j = 0; j < oi.length; j++) {
      if (String(oi[j]?.n ?? "") !== String(ni[j]?.n ?? "")) {
        return "Cambio el nombre de un item de '" + o?.tipo + "'";
      }
      const v = valorItem(ni[j]?.v);
      if (v === null) return "'" + (ni[j]?.n || "?") + "' quedo vacio o no es un numero. Un casillero en blanco no es un cero.";
      if (v < 0 || v > 100) return "'" + (ni[j]?.n || "?") + "' esta fuera de 0-100 (" + v + ")";
    }
  }
  return null;
}

// Recalcula la nota final. NO rehace la suma entera: aplica el DELTA de los
// bloques que el evaluador toco sobre la nota que ya estaba guardada.
//
// Por que asi y no recalculando todo: muchas notas fueron cargadas con la suma
// ya redondeada (93.72 guardada contra 93.73 que da el desglose; 597 filas con
// 4 decimales, 49 con 2). Rehacer la suma les cambiaria el ultimo decimal SIN
// que nadie haya corregido eso — un movimiento que despues nadie sabe explicar.
// Con el delta, corregir la formativa mueve exactamente lo que pesa la
// formativa, y lo demas queda intacto. Es lo que haria a mano el que lleva la
// planilla.
//
// Devuelve tambien los bloques tal cual hay que guardarlos: en modo B el
// `aporte` ES el puntaje del bloque, asi que el bloque corregido lo actualiza.
function recalcular(orig: any[], nuevos: any[], modo: "A" | "B", notaGuardada: number):
  { nota: number; bloques: any[] } | { error: string } {
  const salida: any[] = [];
  let delta = 0;

  for (let i = 0; i < orig.length; i++) {
    const o = orig[i], n = nuevos[i];
    const promViejo = promItems(o), promNuevo = promItems(n);
    if (promNuevo === null) return { error: "El bloque '" + o?.tipo + "' quedo sin valores" };

    // Bloque intacto: se copia tal cual, con su aporte exacto. Ni se lo mira.
    if (promViejo !== null && promNuevo === promViejo) { salida.push(o); continue; }
    if (promViejo === null) return { error: "El bloque '" + o?.tipo + "' no tenia valores con que comparar" };

    const apOrig = Number(o?.aporte);
    if (!Number.isFinite(apOrig)) return { error: "El bloque '" + o?.tipo + "' no tiene aporte" };

    if (modo === "A") {
      // aporte = el PESO (10/30/60). El peso no se toca; cambia el promedio.
      delta += (promNuevo - promViejo) * apOrig / 100;
      salida.push({ ...o, items: n.items, aporte: apOrig });
    } else {
      // aporte = los PUNTOS del bloque. El peso esta implicito y se deduce.
      if (promViejo === 0) {
        return { error: "El bloque '" + o?.tipo + "' no permite deducir su peso (el valor anterior era 0). Esa nota solo se puede corregir en los otros bloques." };
      }
      const pct = apOrig / promViejo * 100;
      const apNuevo = limpiar(apOrig + (promNuevo - promViejo) * pct / 100);
      delta += apNuevo - apOrig;
      salida.push({ ...o, items: n.items, aporte: apNuevo });
    }
  }

  // Sobre QUE numero se aplica el delta:
  //  - Si la nota guardada cuadra con su desglose, sobre ella (asi se respeta
  //    el redondeo con que fue cargada y solo se mueve lo corregido).
  //  - Si NO cuadra, la nota guardada es la que esta mal: fue pisada a mano.
  //    Ahi se rehace la suma entera y la nota se SINCERA con su desglose, que
  //    es todo el punto de esta version.
  const segunDesglose = notaSegunDesglose(orig, modo);
  const cuadra = segunDesglose !== null && Math.abs(segunDesglose - notaGuardada) < EPS_NOTA;

  let nota: number;
  if (!cuadra) {
    const rehecha = notaSegunDesglose(salida, modo);
    if (rehecha === null) return { error: "No se pudo rehacer la suma del desglose" };
    nota = limpiar(rehecha);
  } else {
    // delta 0 = no se toco ningun bloque: la nota se devuelve INTACTA, sin
    // pasarla por limpiar(). Hay notas guardadas con ruido binario de origen
    // (90.42196999999999) y no es este el lugar para corregirles el decimal 11.
    nota = delta === 0 ? notaGuardada : limpiar(notaGuardada + delta);
  }
  if (!Number.isFinite(nota) || nota < 0 || nota > 100) {
    return { error: "La nota recalculada da " + nota + ", fuera de 0-100. Revise los valores." };
  }
  return { nota, bloques: salida };
}

// v2.9.430 — AJUSTE DE DECIMALES DE LA NOTA FINAL.
// La planilla publicada redondea (94.0191) y el desglose da 94.01905: el
// alumno ve dos numeros distintos y objeta. El evaluador puede escribir la
// nota final a mano, pero SOLO como ajuste de redondeo: a menos de EPS_NOTA
// del promedio del desglose. Con el mismo umbral de detectarModo la nota sigue
// cuadrando con su desglose, asi que no se repite lo de C045. Para mover mas
// que eso hay que corregir el casillero que corresponde.
function validarAjusteFinal(n: number, segunDesglose: number | null): string | null {
  if (n < 0 || n > 100) return "Nota fuera de 0-100 (" + n + ")";
  if (segunDesglose === null) return "No se pudo calcular el promedio del desglose para validar el ajuste";
  if (Math.abs(n - segunDesglose) >= EPS_NOTA) {
    return "El promedio del desglose da " + limpiar(segunDesglose) + " y la nota escrita es " + n
      + ". A mano solo se ajustan los decimales (diferencia menor a " + EPS_NOTA
      + "). Para mover mas, corrija el casillero que corresponde.";
  }
  return null;
}
// Como queda en `cambios` (historial y aviso al auxiliar).
function cambioAjusteFinal(antes: number, despues: number, segunDesglose: number) {
  return { bloque: "NOTA FINAL", item: "ajuste a mano (el desglose da " + limpiar(segunDesglose) + ")", antes, despues };
}

// Que cambio exactamente, para el historial y para el aviso al auxiliar.
function listarCambios(orig: any[], nuevos: any[]): any[] {
  const out: any[] = [];
  for (let i = 0; i < orig.length; i++) {
    const o = orig[i], n = nuevos[i];
    const oi = Array.isArray(o?.items) ? o.items : [];
    const ni = Array.isArray(n?.items) ? n.items : [];
    for (let j = 0; j < oi.length; j++) {
      const antes = Number(oi[j]?.v), despues = Number(ni[j]?.v);
      if (antes !== despues) {
        out.push({
          bloque: String(o?.tipo ?? ""), item: String(oi[j]?.n ?? ""),
          antes: Number.isFinite(antes) ? antes : null, despues,
        });
      }
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Cuerpo invalido" }, 400); }

  // Diagnostico: dice QUE funcion es y que acciones entiende. No pide sesion.
  if (body.accion === "ping") {
    return json({ ok: true, funcion: "notas-ops",
      acciones: ["catalogo", "cargar_materia", "control", "faltantes", "mis_cargas",
        "publicar_confirmaciones", "estado_confirmaciones", "fijar_plazo",
        "borrar_carga", "cargas_archivadas", "restaurar_carga",
        "corregir_nota", "historial_correcciones",
        "correcciones_aviso", "acusar_correccion"], version: "v2.9.430" });
  }

  const auth = await validarSesion(body.token);
  if ("error" in auth) return json({ ok: false, error: auth.error }, auth.status);
  const prof = auth.prof!;
  const quien = ((prof.grado ? prof.grado + " " : "") + (prof.nombre_completo || "")).trim()
    + " (" + prof.id + ")";

  try {
    switch (body.accion) {
      case "catalogo": {
        const [cur, per] = await Promise.all([
          sb.from("cursantes")
            .select("id, ci, nombre_completo, ciclo, paralelo, grado, arma")
            .not("activo", "is", false)
            .order("nombre_completo"),
          sb.rpc("notas_control_carga", { p_gestion: 0, p_semestre: 1 }),
        ]);
        if (cur.error) return json({ ok: false, error: "No se pudo leer la nomina" }, 500);

        const { data: usadas } = await sb
          .from("notas_academicas")
          .select("ciclo, materia, mod_codigo, grupo, gestion, semestre")
          .order("gestion", { ascending: false })
          .limit(1000);

        const vistas = new Set<string>();
        const materias: any[] = [];
        for (const m of (usadas || [])) {
          const k = m.ciclo + "|" + m.materia;
          if (vistas.has(k)) continue;
          vistas.add(k);
          materias.push(m);
        }
        return json({
          ok: true,
          usuario: { id: prof.id, nombre: quien, es_auxiliar: prof.es_auxiliar === true,
            evaluador_ciclo: prof.evaluador_ciclo || null },
          cursantes: cur.data || [],
          materias,
          periodos: (per.data as any)?.periodos || [],
        });
      }

      case "control": {
        const g = entero(body.gestion), s = entero(body.semestre);
        if (g === null || s === null || s < 1 || s > 2) {
          return json({ ok: false, error: "Periodo invalido" }, 400);
        }
        const { data, error } = await sb.rpc("notas_control_carga", { p_gestion: g, p_semestre: s });
        if (error) { console.error("control", error); return json({ ok: false, error: "No se pudo calcular el control" }, 500); }
        let salida: any = data;
        if (prof.evaluador_ciclo && salida && Array.isArray(salida.ciclos)) {
          const suyo = CICLO_TXT[prof.evaluador_ciclo];
          salida = { ...salida, ciclos: salida.ciclos.filter((c: any) => c.ciclo === suyo) };
        }
        return json({ ok: true, control: salida });
      }

      case "faltantes": {
        const g = entero(body.gestion), s = entero(body.semestre);
        const ciclo = txt(body.ciclo, 60), materia = txt(body.materia, 160);
        if (g === null || s === null || !ciclo || !materia) {
          return json({ ok: false, error: "Faltan datos de la materia" }, 400);
        }
        const errCiclo = chequearCicloEvaluador(prof, ciclo);
        if (errCiclo) return json({ ok: false, error: errCiclo }, 403);
        const { data, error } = await sb.rpc("notas_faltantes", {
          p_gestion: g, p_semestre: s, p_ciclo: ciclo, p_materia: materia,
        });
        if (error) { console.error("faltantes", error); return json({ ok: false, error: "No se pudo obtener la lista" }, 500); }
        return json({ ok: true, faltantes: data || [] });
      }

      case "mis_cargas": {
        const { data, error } = await sb
          .from("notas_cargas_log")
          .select("*")
          .order("creado_en", { ascending: false })
          .limit(Math.min(entero(body.limite) || 50, 200));
        if (error) return json({ ok: false, error: "No se pudo leer la bitacora" }, 500);
        return json({ ok: true, cargas: data || [] });
      }

      case "cargar_materia": {
        const gestion = entero(body.gestion);
        const semestre = entero(body.semestre);
        const ciclo = txt(body.ciclo, 60);
        const materia = txt(body.materia, 160);
        const mod_codigo = txt(body.mod_codigo, 40);
        let grupo = txt(body.grupo, 200);
        const archivo = txt(body.archivo, 200);
        const hoja = txt(body.hoja, 120);
        const reemplazar = body.reemplazar === true;
        const filas = Array.isArray(body.filas) ? body.filas : null;

        if (gestion === null || gestion < 2000 || gestion > 2100) {
          return json({ ok: false, error: "Gestion invalida" }, 400);
        }
        if (semestre !== 1 && semestre !== 2) {
          return json({ ok: false, error: "El semestre debe ser 1 o 2" }, 400);
        }
        if (!ciclo) return json({ ok: false, error: "Falta el ciclo" }, 400);
        if (!materia) return json({ ok: false, error: "Falta el nombre de la materia" }, 400);
        if (!filas || !filas.length) return json({ ok: false, error: "No llego ninguna nota" }, 400);
        if (filas.length > MAX_FILAS) {
          return json({ ok: false, error: "Demasiadas filas (" + filas.length + "). Maximo " + MAX_FILAS + "." }, 400);
        }

        // Resuelve el modulo REAL de la malla (av_materias) si no vino uno.
        // Antes de esto, las materias del 2do semestre de cada ciclo quedaban
        // con grupo=NULL y el cursante las veia en la carpeta "OTRAS".
        if (!grupo) {
          try { grupo = await resolverGrupoDesdeMalla(ciclo, semestre, materia); } catch (e) { console.error("resolverGrupo", e); }
        }

        const { data: nomina, error: errNom } = await sb
          .from("cursantes")
          .select("id, ci, ciclo, nombre_completo")
          .eq("ciclo", ciclo)
          .not("activo", "is", false);
        if (errNom) return json({ ok: false, error: "No se pudo verificar la nomina" }, 500);
        const porId = new Map((nomina || []).map((c: any) => [String(c.id), c]));

        const errores: string[] = [];
        const vistos = new Set<string>();
        const rows: any[] = [];

        for (let i = 0; i < filas.length; i++) {
          const f = filas[i] || {};
          const linea = "fila " + (i + 1);
          const cid = txt(f.cursante_id, 20);
          if (!cid) { errores.push(linea + ": sin cursante"); continue; }
          const cur = porId.get(cid);
          if (!cur) { errores.push(linea + ": el cursante " + cid + " no pertenece a " + ciclo + " o no esta activo"); continue; }
          if (vistos.has(cid)) { errores.push(linea + ": " + cur.nombre_completo + " esta repetido en la planilla"); continue; }
          vistos.add(cid);

          const nota = num(f.nota_final);
          if (nota === null) { errores.push(linea + " (" + cur.nombre_completo + "): la nota no es un numero"); continue; }
          if (nota < 0 || nota > 100) { errores.push(linea + " (" + cur.nombre_completo + "): nota fuera de 0-100 (" + nota + ")"); continue; }

          let detalle = f.detalle_json ?? null;
          if (detalle !== null) {
            try { if (JSON.stringify(detalle).length > MAX_DETALLE) detalle = null; } catch { detalle = null; }
          }

          rows.push({
            cursante_id: cid,
            ci: cur.ci,
            gestion, semestre, ciclo, materia,
            mod_codigo, grupo,
            // >>> v2.9.363: NO se redondea. La nota queda EXACTAMENTE como la subio
            // el Sof. Balderrama. Antes aca decia:
            //     nota_final: Math.round(nota * 10000) / 10000,
            // y eso MODIFICABA el numero (el 26.71875 del Excel se guardaba como
            // 26.7188). Peor: por el error de coma flotante ese mismo Math.round
            // podia mover el 4to decimal (262187.49999999994 -> 26.2187 en vez de
            // 26.2188). La columna nota_final es `numeric` SIN escala, asi que
            // Postgres guarda el numero completo. Los 4 decimales son de
            // PRESENTACION (fmtNota -> toFixed(4)), nunca de almacenamiento.
            nota_final: nota,
            atributo: txt(f.atributo, 8),
            om_materia: entero(f.om_materia),
            detalle_json: detalle,
            cargado_por: quien,
          });
        }

        if (errores.length) {
          return json({ ok: false, error: "La planilla tiene observaciones. No se cargo nada.", errores: errores.slice(0, 25) }, 400);
        }
        if (!rows.length) return json({ ok: false, error: "No quedo ninguna fila valida" }, 400);

        // ── ANTI-DUPLICADO POR NOMBRE ESCRITO DISTINTO ──────────────────────
        // El nombre de la materia lo tipea una persona. Comparar el texto EXACTO
        // dejaba pasar duplicados obvios: "HISTORIA MILITAR APLICADA I" y
        // "Historia Militar Aplicada I" se guardaban como DOS materias, cada una
        // con sus 125 notas, y el alumno las veia repetidas. Ahora se compara
        // NORMALIZADO (sin tildes/mayusculas/puntos) contra lo ya cargado en el
        // mismo periodo+ciclo; si aparece una gemela con otra grafia, se avisa y
        // se propone actualizar ESA en vez de crear una nueva.
        const { data: yaEnPeriodo, error: errPer } = await sb
          .from("notas_academicas")
          .select("materia")
          .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo);
        if (errPer) return json({ ok: false, error: "No se pudo verificar lo ya cargado" }, 500);

        const nombresPeriodo = [...new Set((yaEnPeriodo || []).map((m: any) => String(m.materia)))];
        const nNueva = normalizar(materia);
        const gemela = nombresPeriodo.find((n) => normalizar(n) === nNueva && n !== materia);

        if (gemela && !reemplazar) {
          return json({
            ok: false, ya_existe: true, nombre_distinto: gemela,
            filas_previas: (yaEnPeriodo || []).filter((m: any) => m.materia === gemela).length,
            error: "Ojo: \"" + gemela + "\" ya esta cargada y es LA MISMA materia escrita distinto que \""
              + materia + "\". Si segui adelante sin avisar, quedarian duplicadas.",
          }, 409);
        }

        // Si se confirmo el reemplazo de la gemela, se usa SU nombre (el ya
        // guardado) para no dejar dos grafias conviviendo en la base.
        const materiaFinal = (gemela && reemplazar) ? gemela : materia;

        const { data: previas, error: errPrev } = await sb
          .from("notas_academicas")
          .select("cursante_id")
          .eq("gestion", gestion).eq("semestre", semestre)
          .eq("ciclo", ciclo).eq("materia", materiaFinal);
        if (errPrev) return json({ ok: false, error: "No se pudo verificar lo ya cargado" }, 500);

        const idsPrevios = new Set((previas || []).map((p: any) => String(p.cursante_id)));

        if (idsPrevios.size > 0 && !reemplazar) {
          return json({
            ok: false, ya_existe: true,
            filas_previas: idsPrevios.size,
            error: "La materia \"" + materiaFinal + "\" ya tiene " + idsPrevios.size + " notas cargadas en este periodo.",
          }, 409);
        }

        // El nombre canonico manda: si hubo gemela, las filas van con SU nombre.
        if (materiaFinal !== materia) for (const r of rows) r.materia = materiaFinal;

        const nuevas = rows.filter((r) => !idsPrevios.has(r.cursante_id)).length;
        const actualizadas = rows.length - nuevas;

        for (let i = 0; i < rows.length; i += CHUNK) {
          const { error } = await sb
            .from("notas_academicas")
            .upsert(rows.slice(i, i + CHUNK), { onConflict: "cursante_id,gestion,semestre,materia" });
          if (error) {
            console.error("upsert notas", error);
            return json({ ok: false, error: "Error guardando (se guardaron " + i + " de " + rows.length + "): " + error.message }, 500);
          }
        }

        let borradas = 0;
        if (reemplazar) {
          const sobran = [...idsPrevios].filter((id) => !vistos.has(id));
          if (sobran.length) {
            const { error, count } = await sb
              .from("notas_academicas")
              .delete({ count: "exact" })
              .eq("gestion", gestion).eq("semestre", semestre)
              .eq("ciclo", ciclo).eq("materia", materiaFinal)
              .in("cursante_id", sobran);
            if (!error) borradas = count || sobran.length;
          }
        }

        try {
          await sb.from("notas_cargas_log").insert({
            gestion, semestre, ciclo, materia: materiaFinal, mod_codigo, grupo, archivo, hoja,
            filas_recibidas: filas.length,
            filas_nuevas: nuevas,
            filas_actualizadas: actualizadas,
            filas_borradas: borradas,
            sin_match: entero(body.sin_match) || 0,
            reemplazo: reemplazar,
            usuario_id: prof.id,
            usuario_nombre: quien,
            usuario_rol: prof.rol,
            ip: ip(req),
            resumen: {
              promedio: Math.round((rows.reduce((a, r) => a + r.nota_final, 0) / rows.length) * 100) / 100,
              nota_min: Math.min(...rows.map((r) => r.nota_final)),
              nota_max: Math.max(...rows.map((r) => r.nota_final)),
              sin_atributo: rows.filter((r) => !r.atributo).length,
              sin_om: rows.filter((r) => r.om_materia === null).length,
            },
          });
        } catch (e) { console.error("bitacora", e); }

        // Conformidad AUTOMATICA: cada nota que se acaba de cargar/actualizar
        // nace en rojo (pendiente) con plazo por defecto de 48h. Best-effort:
        // si esto falla no debe tumbar la carga de notas (lo principal).
        let conf: any = null;
        try {
          conf = await publicarConfirmacionesInterno(gestion, semestre, ciclo, materiaFinal, prof.id, quien, PLAZO_DEFECTO_H);
          if (conf.error) console.error("auto-confirmaciones", conf.error);
        } catch (e) { console.error("auto-confirmaciones", e); }

        return json({
          ok: true,
          materia: materiaFinal, ciclo, gestion, semestre, grupo,
          guardadas: rows.length,
          nuevas, actualizadas, borradas,
          cargado_por: quien,
          confirmaciones: conf ? { nuevas: conf.nuevas, reabiertas: conf.reabiertas, plazo_vence_en: conf.plazoVenceEn } : null,
        });
      }

      // Manual: re-avisar (por si un alumno se sumo despues, o para forzar un
      // nuevo plazo sin re-subir la planilla entera). El automatico de
      // cargar_materia ya cubre el caso normal.
      case "publicar_confirmaciones": {
        const gestion = entero(body.gestion), semestre = entero(body.semestre);
        const ciclo = txt(body.ciclo, 60), materia = txt(body.materia, 160);
        const horas = num(body.horas) ?? PLAZO_DEFECTO_H;
        if (gestion === null || semestre === null || !ciclo || !materia) {
          return json({ ok: false, error: "Faltan datos de la materia" }, 400);
        }
        if (horas <= 0 || horas > PLAZO_MAX_H) return json({ ok: false, error: "Plazo invalido (en horas)" }, 400);
        const errCiclo = chequearCicloEvaluador(prof, ciclo);
        if (errCiclo) return json({ ok: false, error: errCiclo }, 403);

        const r = await publicarConfirmacionesInterno(gestion, semestre, ciclo, materia, prof.id, quien, horas);
        if (r.error) return json({ ok: false, error: r.error }, 500);
        if (!r.total) return json({ ok: false, error: "Esa materia no tiene notas cargadas" }, 400);

        return json({ ok: true, total: r.total, nuevas: r.nuevas, reabiertas: r.reabiertas, sin_tocar: r.sinTocar, plazo_vence_en: r.plazoVenceEn });
      }

      // El evaluador de ciclo ajusta (acorta o extiende) el plazo por defecto
      // de 48h para una materia ya publicada. Recalcula desde el publicado_en
      // de CADA alumno (no desde "ahora"), y solo toca los que siguen pendientes.
      case "fijar_plazo": {
        const gestion = entero(body.gestion), semestre = entero(body.semestre);
        const ciclo = txt(body.ciclo, 60), materia = txt(body.materia, 160);
        const horas = num(body.horas);
        if (gestion === null || semestre === null || !ciclo || !materia) {
          return json({ ok: false, error: "Faltan datos de la materia" }, 400);
        }
        if (horas === null || horas <= 0 || horas > PLAZO_MAX_H) {
          return json({ ok: false, error: "Plazo invalido (en horas)" }, 400);
        }
        const errCiclo = chequearCicloEvaluador(prof, ciclo);
        if (errCiclo) return json({ ok: false, error: errCiclo }, 403);

        const { data: pend, error: errP } = await sb
          .from("notas_confirmaciones")
          .select("id, publicado_en")
          .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo).eq("materia", materia)
          .eq("estado", "pendiente");
        if (errP) return json({ ok: false, error: "No se pudo leer las conformidades" }, 500);
        if (!pend || !pend.length) return json({ ok: false, error: "No hay conformidades pendientes en esta materia" }, 400);

        let actualizadas = 0;
        const ahora = new Date().toISOString();
        for (const p of pend) {
          const base = p.publicado_en ? new Date(p.publicado_en) : new Date();
          const nuevoPlazo = new Date(base.getTime() + horas * 3600000);
          const { error } = await sb
            .from("notas_confirmaciones")
            .update({ plazo_vence_en: nuevoPlazo.toISOString(), actualizado_en: ahora })
            .eq("id", p.id);
          if (!error) actualizadas++;
        }
        return json({ ok: true, actualizadas, horas });
      }

      // Semaforo: para cada alumno de la materia, su estado de conformidad.
      case "estado_confirmaciones": {
        const gestion = entero(body.gestion), semestre = entero(body.semestre);
        const ciclo = txt(body.ciclo, 60), materia = txt(body.materia, 160);
        if (gestion === null || semestre === null || !ciclo || !materia) {
          return json({ ok: false, error: "Faltan datos de la materia" }, 400);
        }
        const errCiclo = chequearCicloEvaluador(prof, ciclo);
        if (errCiclo) return json({ ok: false, error: errCiclo }, 403);

        const { data: confs, error: errC } = await sb
          .from("notas_confirmaciones")
          .select("id, cursante_id, estado, publicado_en, plazo_vence_en, confirmada_en, observacion_cursante")
          .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo).eq("materia", materia);
        if (errC) return json({ ok: false, error: "No se pudo leer el estado" }, 500);

        const ids = (confs || []).map((c: any) => c.cursante_id);
        let nombres = new Map<string, any>();
        if (ids.length) {
          const { data: curs } = await sb.from("cursantes").select("id, ci, nombre_completo, grado").in("id", ids);
          nombres = new Map((curs || []).map((c: any) => [String(c.id), c]));
        }

        const lista = (confs || []).map((c: any) => {
          const cur = nombres.get(String(c.cursante_id)) || {};
          const vencido = c.estado === "pendiente" && c.plazo_vence_en && new Date(c.plazo_vence_en) < new Date();
          return {
            cursante_id: c.cursante_id, ci: cur.ci || null,
            nombre_completo: cur.nombre_completo || c.cursante_id, grado: cur.grado || null,
            estado: c.estado, vencido: !!vencido,
            publicado_en: c.publicado_en, plazo_vence_en: c.plazo_vence_en,
            confirmada_en: c.confirmada_en, observacion_cursante: c.observacion_cursante || null,
          };
        }).sort((a: any, b: any) => String(a.nombre_completo).localeCompare(String(b.nombre_completo)));

        return json({
          ok: true, publicado: lista.length > 0, lista,
          resumen: {
            total: lista.length,
            confirmadas: lista.filter((x: any) => x.estado === "confirmada").length,
            rechazadas: lista.filter((x: any) => x.estado === "rechazada").length,
            pendientes: lista.filter((x: any) => x.estado === "pendiente").length,
          },
        });
      }

      // ────────────────────────────────────────────────────────────────────
      // v2.9.369 — BAJA DE UNA CARGA ENTERA (el evaluador deshace el error)
      //
      // El 7-sep-2026 el Sof. Balderrama subio mal "Menciones" y "UC. Menciones"
      // (198 notas) y no habia forma de deshacerlo desde la app: hubo que
      // borrarlas a mano contra la base. Esto es esa maniobra, hecha bien.
      //
      // NO destruye: mueve las filas a notas_archivadas bajo un lote_id, junto
      // con la foto de las conformidades (las firmas de los alumnos no se
      // pierden por una baja). `restaurar_carga` lo devuelve entero.
      // ────────────────────────────────────────────────────────────────────
      case "borrar_carga": {
        const gestion = entero(body.gestion), semestre = entero(body.semestre);
        const ciclo = txt(body.ciclo, 60), materia = txt(body.materia, 160);
        const motivo = txt(body.motivo, 500);
        if (gestion === null || semestre === null || !ciclo || !materia) {
          return json({ ok: false, error: "Faltan datos de la materia" }, 400);
        }
        if (!motivo || motivo.length < 10) {
          return json({ ok: false, error: "Escriba por que da de baja esta carga (al menos 10 caracteres). Queda en el archivo." }, 400);
        }
        const errAux = soloEvaluadorPleno(prof);
        if (errAux) return json({ ok: false, error: errAux }, 403);
        const errCiclo = chequearCicloEvaluador(prof, ciclo);
        if (errCiclo) return json({ ok: false, error: errCiclo }, 403);

        const { data: filas, error: errF } = await sb
          .from("notas_academicas").select("*")
          .eq("gestion", gestion).eq("semestre", semestre)
          .eq("ciclo", ciclo).eq("materia", materia);
        if (errF) return json({ ok: false, error: "No se pudo leer la materia" }, 500);
        if (!filas || !filas.length) {
          return json({ ok: false, error: "Esa materia no tiene notas cargadas en el periodo indicado" }, 400);
        }

        // Foto de las conformidades ANTES de tocar nada.
        const { data: confs } = await sb
          .from("notas_confirmaciones").select("*")
          .eq("gestion", gestion).eq("semestre", semestre)
          .eq("ciclo", ciclo).eq("materia", materia);

        const lote = crypto.randomUUID();
        const ahora = new Date().toISOString();

        // 1) La cabecera del lote primero: si algo se corta despues, queda el rastro.
        const { error: errLote } = await sb.from("notas_archivadas_lotes").insert({
          lote_id: lote, gestion, semestre, ciclo, materia,
          grupo: filas[0].grupo || null,
          filas: filas.length,
          confirmaciones: confs && confs.length ? confs : null,
          cargado_por_original: filas[0].cargado_por || null,
          motivo,
          archivado_en: ahora,
          archivado_por: prof.id, archivado_por_nombre: quien,
          ip: ip(req),
        });
        if (errLote) { console.error("lote", errLote); return json({ ok: false, error: "No se pudo abrir el archivo: " + errLote.message }, 500); }

        // 2) Copia fiel de las notas al archivo.
        const aArchivar = filas.map((f: any) => ({
          ...f, lote_id: lote, archivado_en: ahora,
          archivado_por: prof.id, archivado_por_nombre: quien, motivo,
        }));
        for (let i = 0; i < aArchivar.length; i += CHUNK) {
          const { error } = await sb.from("notas_archivadas").insert(aArchivar.slice(i, i + CHUNK));
          if (error) {
            console.error("archivar", error);
            // Nada se borro todavia: la carga sigue intacta.
            await sb.from("notas_archivadas").delete().eq("lote_id", lote);
            await sb.from("notas_archivadas_lotes").delete().eq("lote_id", lote);
            return json({ ok: false, error: "No se pudo archivar. NO se borro nada: " + error.message }, 500);
          }
        }

        // 3) Recien ahora se sacan de la vista. Si esto falla, el archivo ya
        //    tiene la copia y se puede reintentar sin haber perdido nada.
        const { error: errDel, count } = await sb
          .from("notas_academicas").delete({ count: "exact" })
          .eq("gestion", gestion).eq("semestre", semestre)
          .eq("ciclo", ciclo).eq("materia", materia);
        if (errDel) { console.error("baja", errDel); return json({ ok: false, error: "Se archivo, pero no se pudo quitar de la vista: " + errDel.message }, 500); }

        await sb.from("notas_confirmaciones").delete()
          .eq("gestion", gestion).eq("semestre", semestre)
          .eq("ciclo", ciclo).eq("materia", materia);

        try {
          await sb.from("notas_cargas_log").insert({
            gestion, semestre, ciclo, materia, grupo: filas[0].grupo || null,
            filas_recibidas: 0, filas_nuevas: 0, filas_actualizadas: 0,
            filas_borradas: count || filas.length, sin_match: 0, reemplazo: false,
            usuario_id: prof.id, usuario_nombre: quien, usuario_rol: prof.rol, ip: ip(req),
            resumen: { operacion: "baja_de_carga", lote_id: lote, motivo,
              conformidades_guardadas: (confs || []).length },
          });
        } catch (e) { console.error("bitacora baja", e); }

        return json({ ok: true, lote_id: lote, materia, ciclo, gestion, semestre,
          archivadas: count || filas.length,
          conformidades_guardadas: (confs || []).length });
      }

      // Lo que hay en el archivo, para poder devolverlo.
      case "cargas_archivadas": {
        let q = sb.from("notas_archivadas_lotes").select("*")
          .order("archivado_en", { ascending: false })
          .limit(Math.min(entero(body.limite) || 50, 200));
        if (body.incluir_restauradas !== true) q = q.is("restaurado_en", null);
        if (prof.evaluador_ciclo) q = q.eq("ciclo", CICLO_TXT[prof.evaluador_ciclo]);
        const { data, error } = await q;
        if (error) return json({ ok: false, error: "No se pudo leer el archivo" }, 500);
        return json({ ok: true, lotes: data || [] });
      }

      // Devuelve un lote entero a notas_academicas, con sus conformidades.
      case "restaurar_carga": {
        const lote = txt(body.lote_id, 60);
        if (!lote) return json({ ok: false, error: "Falta el lote" }, 400);
        const errAux = soloEvaluadorPleno(prof);
        if (errAux) return json({ ok: false, error: errAux }, 403);

        const { data: cab, error: errC } = await sb
          .from("notas_archivadas_lotes").select("*").eq("lote_id", lote).maybeSingle();
        if (errC || !cab) return json({ ok: false, error: "Ese lote no esta en el archivo" }, 404);
        if (cab.restaurado_en) return json({ ok: false, error: "Ese lote ya fue restaurado el " + new Date(cab.restaurado_en).toLocaleString("es-BO") }, 400);
        const errCiclo = chequearCicloEvaluador(prof, cab.ciclo);
        if (errCiclo) return json({ ok: false, error: errCiclo }, 403);

        // Si la materia se volvio a cargar despues de la baja, restaurar
        // pisaria lo nuevo. Eso se avisa y se pide confirmacion explicita.
        const { data: yaHay } = await sb.from("notas_academicas").select("cursante_id")
          .eq("gestion", cab.gestion).eq("semestre", cab.semestre)
          .eq("ciclo", cab.ciclo).eq("materia", cab.materia);
        if (yaHay && yaHay.length && body.pisar !== true) {
          return json({ ok: false, ya_existe: true, filas_actuales: yaHay.length,
            error: "\"" + cab.materia + "\" volvio a cargarse despues de la baja (" + yaHay.length
              + " notas). Restaurar el lote pisaria esas notas." }, 409);
        }

        const { data: arch, error: errA } = await sb
          .from("notas_archivadas").select("*").eq("lote_id", lote);
        if (errA || !arch || !arch.length) return json({ ok: false, error: "El archivo no tiene filas de ese lote" }, 404);

        const devolver = arch.map((f: any) => {
          const r: any = { ...f };
          for (const c of COLS_ARCHIVO) delete r[c];
          return r;
        });
        for (let i = 0; i < devolver.length; i += CHUNK) {
          const { error } = await sb.from("notas_academicas")
            .upsert(devolver.slice(i, i + CHUNK), { onConflict: "cursante_id,gestion,semestre,materia" });
          if (error) { console.error("restaurar", error); return json({ ok: false, error: "Error devolviendo las notas: " + error.message }, 500); }
        }

        // Las firmas vuelven tal cual estaban: el alumno que ya habia firmado
        // no tiene por que volver a firmar lo mismo.
        let confsVueltas = 0;
        if (Array.isArray(cab.confirmaciones) && cab.confirmaciones.length) {
          const { error } = await sb.from("notas_confirmaciones")
            .upsert(cab.confirmaciones, { onConflict: "cursante_id,gestion,semestre,ciclo,materia" });
          if (!error) confsVueltas = cab.confirmaciones.length;
          else console.error("restaurar confs", error);
        }

        const ahora = new Date().toISOString();
        await sb.from("notas_archivadas_lotes")
          .update({ restaurado_en: ahora, restaurado_por: prof.id, restaurado_por_nombre: quien })
          .eq("lote_id", lote);
        await sb.from("notas_archivadas")
          .update({ restaurado_en: ahora, restaurado_por: prof.id }).eq("lote_id", lote);

        return json({ ok: true, materia: cab.materia, ciclo: cab.ciclo,
          gestion: cab.gestion, semestre: cab.semestre,
          restauradas: devolver.length, conformidades: confsVueltas });
      }

      // ────────────────────────────────────────────────────────────────────
      // v2.9.370 — CORREGIR EL COMPONENTE, NO EL PROMEDIO
      //
      // El alumno objeta "revisenme la formativa" y hasta ayer lo unico que
      // habia del otro lado era un casillero para escribir la nota FINAL. El
      // evaluador corregia el promedio, el desglose quedaba diciendo otra cosa
      // y el respaldo de la nota se perdia.
      //
      // Ahora llegan los bloques con el valor corregido y la nota final la
      // calcula ESTE lado, con la formula con la que esa fila fue cargada
      // (ver "EL MOTOR DE LA NOTA"). Si la nota tiene un desglose que se puede
      // reconstruir, corregir el promedio a mano queda PROHIBIDO: es justo el
      // error que se esta arreglando.
      //
      // La nota vieja no se pisa: queda en notas_correcciones con el desglose
      // anterior, el nuevo, que item cambio, quien y por que. La conformidad
      // se REABRE (la firma vieja no vale para otro numero) y queda un AVISO
      // pendiente para el auxiliar que lleva la planilla.
      // ────────────────────────────────────────────────────────────────────
      case "corregir_nota": {
        const cursante_id = txt(body.cursante_id, 20);
        const gestion = entero(body.gestion), semestre = entero(body.semestre);
        const ciclo = txt(body.ciclo, 60), materia = txt(body.materia, 160);
        const motivo = txt(body.motivo, 500);

        if (!cursante_id || gestion === null || semestre === null || !ciclo || !materia) {
          return json({ ok: false, error: "Faltan datos de la nota" }, 400);
        }
        if (!motivo || motivo.length < 10) {
          return json({ ok: false, error: "Escriba el motivo de la correccion (al menos 10 caracteres). Es lo que respalda el cambio." }, 400);
        }
        const errAux = soloEvaluadorPleno(prof);
        if (errAux) return json({ ok: false, error: errAux }, 403);
        const errCiclo = chequearCicloEvaluador(prof, ciclo);
        if (errCiclo) return json({ ok: false, error: errCiclo }, 403);

        const { data: nota, error: errN } = await sb
          .from("notas_academicas").select("*")
          .eq("cursante_id", cursante_id).eq("gestion", gestion)
          .eq("semestre", semestre).eq("ciclo", ciclo).eq("materia", materia)
          .maybeSingle();
        if (errN) return json({ ok: false, error: "No se pudo leer la nota" }, 500);
        if (!nota) return json({ ok: false, error: "Ese alumno no tiene nota cargada en esa materia" }, 404);

        const bloquesOrig = bloquesDe(nota.detalle_json);
        const notaVieja = Number(nota.nota_final);
        const modo = detectarModo(bloquesOrig, notaVieja);
        const porComponentes = Array.isArray(body.bloques) && body.bloques.length > 0;

        let notaNueva: number;
        let detalleNuevo: any = null;
        let cambios: any[] = [];

        if (porComponentes) {
          if (modo === "C") {
            return json({ ok: false, error: "Esta nota se cargo sin un desglose que cuadre con la nota final: no se puede corregir por componente." }, 400);
          }
          const errEst = validarEstructura(bloquesOrig, body.bloques);
          if (errEst) return json({ ok: false, error: errEst }, 400);

          cambios = listarCambios(bloquesOrig, body.bloques);
          if (!cambios.length) {
            return json({ ok: false, error: "No cambio ningun valor del desglose." }, 400);
          }

          const rec = recalcular(bloquesOrig, body.bloques, modo, notaVieja);
          if ("error" in rec) return json({ ok: false, error: rec.error }, 400);
          notaNueva = rec.nota;
          detalleNuevo = { ...(nota.detalle_json || {}), bloques: rec.bloques };

          // v2.9.430: ademas del casillero, el evaluador puede ajustar los
          // decimales de la nota que resulta (opcional).
          const finalPedida = num(body.nota_final);
          if (finalPedida !== null && finalPedida !== notaNueva) {
            const segun = notaSegunDesglose(rec.bloques, modo);
            const errAj = validarAjusteFinal(finalPedida, segun);
            if (errAj) return json({ ok: false, error: errAj }, 400);
            cambios.push(cambioAjusteFinal(notaNueva, finalPedida, segun!));
            notaNueva = finalPedida;
          }
        } else {
          // Escribir la nota final a mano. Sin desglose con que reconstruirla
          // (modo C), cualquier valor de 0 a 100. Con desglose (v2.9.430),
          // solo como ajuste de decimales: ver validarAjusteFinal.
          const n = num(body.nota_final);
          if (n === null) return json({ ok: false, error: "La nota corregida no es un numero" }, 400);
          if (n < 0 || n > 100) return json({ ok: false, error: "Nota fuera de 0-100 (" + n + ")" }, 400);
          if (modo !== "C" && n !== notaVieja) {
            const segun = notaSegunDesglose(bloquesOrig, modo);
            const errAj = validarAjusteFinal(n, segun);
            if (errAj) return json({ ok: false, error: errAj }, 400);
            cambios = [cambioAjusteFinal(notaVieja, n, segun!)];
          }
          notaNueva = n;
        }

        if (Number(notaVieja) === Number(notaNueva) && !cambios.length) {
          return json({ ok: false, error: "La nota corregida es igual a la que ya esta cargada" }, 400);
        }

        // La observacion del alumno, para que quede pegada a la correccion.
        const { data: conf } = await sb.from("notas_confirmaciones")
          .select("id, estado, observacion_cursante, publicado_en")
          .eq("cursante_id", cursante_id).eq("gestion", gestion)
          .eq("semestre", semestre).eq("ciclo", ciclo).eq("materia", materia)
          .maybeSingle();

        const atributo = txt(body.atributo, 8)
          || (notaNueva >= 100 ? "E" : notaNueva >= 90 ? "MB" : notaNueva >= 80 ? "B" : notaNueva >= 60 ? "R" : "D");

        const { data: corrIns, error: errIns } = await sb.from("notas_correcciones").insert({
          nota_id: nota.id, cursante_id, ci: nota.ci,
          gestion, semestre, ciclo, materia,
          nota_anterior: notaVieja, nota_nueva: notaNueva,
          detalle_anterior: nota.detalle_json ?? null,
          detalle_nuevo: detalleNuevo,
          cambios: cambios.length ? cambios : null,
          modo: porComponentes ? modo : "TOTAL",
          motivo,
          observacion_alumno: (conf && conf.observacion_cursante) || null,
          corregido_por: prof.id, corregido_por_nombre: quien, ip: ip(req),
          aviso_estado: "pendiente",
        }).select("id").maybeSingle();
        if (errIns) { console.error("historial", errIns); return json({ ok: false, error: "No se pudo guardar el historial. La nota NO se cambio: " + errIns.message }, 500); }

        const patch: any = { nota_final: notaNueva, atributo };
        if (detalleNuevo) patch.detalle_json = detalleNuevo;
        const { error: errUp } = await sb.from("notas_academicas").update(patch).eq("id", nota.id);
        if (errUp) { console.error("corregir", errUp); return json({ ok: false, error: "No se pudo corregir la nota: " + errUp.message }, 500); }

        // El numero cambio: la conformidad vuelve a cero con plazo nuevo.
        // `conformidad` distingue los tres finales posibles, porque no es lo
        // mismo "no habia que reabrir nada" que "habia y NO se pudo": en ese
        // caso el alumno queda con su firma vieja sobre una nota distinta y
        // alguien tiene que enterarse.
        let reabierta = false;
        let conformidad = "no_habia";
        if (conf) {
          const ahora = new Date();
          const { error } = await sb.from("notas_confirmaciones").update({
            nota_final: notaNueva, estado: "pendiente",
            publicado_en: ahora.toISOString(), publicado_por: prof.id, publicado_por_nombre: quien,
            plazo_vence_en: new Date(ahora.getTime() + PLAZO_DEFECTO_H * 3600000).toISOString(),
            firma_cursante: null, confirmada_en: null, observacion_cursante: null,
            huella_forense: null, actualizado_en: ahora.toISOString(),
          }).eq("id", conf.id);
          reabierta = !error;
          conformidad = error ? "error" : "reabierta";
          if (error) console.error("reabrir conf", error);
        }

        return json({ ok: true, cursante_id, materia, ciclo, gestion, semestre,
          correccion_id: corrIns && corrIns.id, modo: porComponentes ? modo : "TOTAL",
          nota_anterior: notaVieja, nota_nueva: notaNueva, atributo,
          cambios, detalle_nuevo: detalleNuevo,
          conformidad_reabierta: reabierta, conformidad,
          observacion_alumno: (conf && conf.observacion_cursante) || null });
      }

      // ────────────────────────────────────────────────────────────────────
      // v2.9.370 — EL AVISO AL QUE LLEVA LA PLANILLA
      //
      // La nota vive en dos lados: en la app y en la planilla de la Sub. Sec.
      // de Evaluaciones. Si el evaluador corrige aca y nadie le avisa al
      // auxiliar, las dos se separan en silencio. Por eso cada correccion deja
      // un aviso PENDIENTE, que el ve en rojo al entrar, y que se apaga recien
      // cuando el responde que ya lo paso a su base.
      //
      // Leerlo lo puede cualquiera de la seccion (el evaluador tambien, para
      // ver si su correccion fue recibida). Acusarlo tambien, con una sola
      // regla: el que corrigio no se acusa recibo a si mismo — si no, la
      // constancia no valdria nada.
      // ────────────────────────────────────────────────────────────────────
      case "correcciones_aviso": {
        let q = sb.from("notas_correcciones")
          .select("id, cursante_id, ci, gestion, semestre, ciclo, materia, nota_anterior, nota_nueva, cambios, modo, motivo, observacion_alumno, corregido_por, corregido_por_nombre, creado_en, aviso_estado, acusado_en, acusado_por_nombre, acuse_comentario")
          .order("creado_en", { ascending: false })
          .limit(Math.min(entero(body.limite) || 200, 500));
        if (body.solo_pendientes === true) q = q.eq("aviso_estado", "pendiente");
        // El evaluador de ciclo ve lo suyo; el auxiliar y el titular ven todo.
        if (prof.evaluador_ciclo) q = q.eq("ciclo", CICLO_TXT[prof.evaluador_ciclo]);
        const { data, error } = await q;
        if (error) return json({ ok: false, error: "No se pudieron leer los avisos de correccion" }, 500);
        const lista = data || [];
        return json({ ok: true, correcciones: lista,
          pendientes: lista.filter((c: any) => c.aviso_estado === "pendiente").length });
      }

      case "acusar_correccion": {
        const id = txt(body.id, 40);
        const comentario = txt(body.comentario, 400);
        if (!id) return json({ ok: false, error: "Falta la correccion a acusar" }, 400);

        const { data: c, error: errC } = await sb.from("notas_correcciones")
          .select("id, corregido_por, aviso_estado, materia, cursante_id, acusado_por_nombre, acusado_en")
          .eq("id", id).maybeSingle();
        if (errC) return json({ ok: false, error: "No se pudo leer la correccion" }, 500);
        if (!c) return json({ ok: false, error: "Esa correccion no existe" }, 404);
        if (c.aviso_estado === "acusado") {
          return json({ ok: false, error: "Esa correccion ya fue acusada por " + (c.acusado_por_nombre || "otro usuario") }, 409);
        }
        if (String(c.corregido_por || "") === String(prof.id)) {
          return json({ ok: false, error: "La conformidad la da quien lleva la planilla, no quien hizo la correccion." }, 403);
        }

        const ahora = new Date().toISOString();
        const { error: errU } = await sb.from("notas_correcciones").update({
          aviso_estado: "acusado", acusado_en: ahora,
          acusado_por: prof.id, acusado_por_nombre: quien,
          acuse_comentario: comentario,
        }).eq("id", id).eq("aviso_estado", "pendiente");
        if (errU) return json({ ok: false, error: "No se pudo registrar la conformidad: " + errU.message }, 500);

        return json({ ok: true, id, acusado_en: ahora, acusado_por_nombre: quien });
      }

      // El rastro de las correcciones. Por alumno, por materia, o las ultimas.
      case "historial_correcciones": {
        const cursante_id = txt(body.cursante_id, 20);
        const materia = txt(body.materia, 160);
        let q = sb.from("notas_correcciones").select("*")
          .order("creado_en", { ascending: false })
          .limit(Math.min(entero(body.limite) || 100, 300));
        if (cursante_id) q = q.eq("cursante_id", cursante_id);
        if (materia) q = q.eq("materia", materia);
        if (prof.evaluador_ciclo) q = q.eq("ciclo", CICLO_TXT[prof.evaluador_ciclo]);
        const { data, error } = await q;
        if (error) return json({ ok: false, error: "No se pudo leer el historial" }, 500);
        return json({ ok: true, correcciones: data || [] });
      }

      default:
        return json({ ok: false, error: "Accion desconocida en notas-ops: " + String(body.accion) }, 400);
    }
  } catch (e) {
    console.error("notas-ops", e);
    return json({ ok: false, error: "Error interno: " + ((e as Error)?.message || String(e)) }, 500);
  }
});
