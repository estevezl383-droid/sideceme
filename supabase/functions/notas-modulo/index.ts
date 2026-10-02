// ================================================================================
// SIDECEME — Edge Function  notas-modulo
//
// CARGA POR MÓDULO. La planilla del módulo (p. ej. "ESTUDIOS MILITARES
// COMPLEMENTARIOS I") trae, por alumno, la nota de cada materia del módulo y el
// PROMEDIO ya calculado por la Sub. Sec. Evaluaciones. Esto NO crea ni cambia
// notas de materias: CONFIRMA que cada nota de la planilla sea EXACTAMENTE la ya
// cargada y reconocida por el alumno, y publica el promedio TAL CUAL viene.
//
//  - Sin redondeos: se compara el número completo (solo se quita el ruido
//    binario a 10 decimales). 93.32475 contra 93.3248 NO coincide.
//  - El promedio no se recalcula: se guarda el de la planilla.
//  - Si una nota no coincide, falta, o el alumno la objetó / no la firmó:
//    ESE alumno queda RETENIDO (no se le publica) y se crea una ALARMA para el
//    auxiliar que carga y el evaluador del ciclo. Los demás se publican.
//  - Nada se borra. Una recarga conserva las firmas que siguen valiendo y guarda
//    la versión anterior en `anterior`.
//
// Personal (profesores con rol 'evaluaciones'/'ciencia_tecnologia'):
//   catalogo · revisar_modulo · cargar_modulo · control · alumnos_modulo
//   alarmas · atender_alarma · fijar_plazo
// Cursante: mis_modulos · consultar_modulo · resolver_modulo
//
// JWT OFF + service_role; la sesión propia se valida contra `sesiones`.
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
const CICLO_TXT: Record<number, string> = { 1: "1ER CICLO", 2: "2DO CICLO" };
const PLAZO_DEFECTO_H = 48;
const PLAZO_MAX_H = 24 * 30;
const MAX_FILAS = 400;
const MAX_MATERIAS = 15;
const CHUNK = 150;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
function ip(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "desconocida";
}
function txt(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}
function entero(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
// Valor EXACTO de una nota: sin redondear. Solo se limpia el ruido binario
// (90.42196999999999 de la celda y 90.42197 de numeric son el mismo número).
export function exacto(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? parseFloat(n.toFixed(10)) : null;
}
export function coincide(a: unknown, b: unknown): boolean {
  const x = exacto(a), y = exacto(b);
  return x !== null && y !== null && x === y;
}
function textoNota(v: unknown): string | null {
  const n = exacto(v);
  return n === null ? null : String(n);
}

// ------------------------------------------------------------------ sesiones
async function leerSesion(token: unknown) {
  if (!token || typeof token !== "string" || token.length > 200) return { error: "Token requerido", status: 400 };
  const { data: ses, error } = await sb.from("sesiones")
    .select("usuario_id, usuario_tabla, revocado, expira_en").eq("token", token).maybeSingle();
  if (error || !ses) return { error: "Sesion invalida. Volve a entrar.", status: 401 };
  if (ses.revocado === true) return { error: "Sesion revocada", status: 401 };
  if (new Date(ses.expira_en) < new Date()) return { error: "Sesion expirada. Volve a entrar.", status: 401 };
  return { ses };
}
async function validarPersonal(ses: any) {
  if (ses.usuario_tabla !== "profesores") return { error: "Esta operacion es solo para personal de la Escuela", status: 403 };
  const { data: prof } = await sb.from("profesores")
    .select("id, grado, nombre_completo, rol, roles, activo, es_auxiliar, evaluador_ciclo")
    .eq("id", ses.usuario_id).maybeSingle();
  if (!prof || prof.activo === false) return { error: "Usuario inactivo", status: 403 };
  const roles: string[] = [];
  if (prof.rol) roles.push(String(prof.rol).toLowerCase());
  if (Array.isArray(prof.roles)) for (const r of prof.roles) roles.push(String(r).toLowerCase());
  if (!roles.some((r) => ROLES_OK.includes(r))) return { error: "Su cargo no tiene permiso para cargar ni controlar notas", status: 403 };
  return { prof };
}
async function validarCursante(ses: any) {
  if (ses.usuario_tabla !== "cursantes") return { error: "Esta operacion es solo para cursantes", status: 403 };
  const { data: cur } = await sb.from("cursantes").select("id, ci, nombre_completo, ciclo, activo")
    .eq("id", ses.usuario_id).maybeSingle();
  if (!cur || cur.activo === false) return { error: "Usuario inactivo", status: 403 };
  return { cur };
}
function errCiclo(prof: any, ciclo: string | null): string | null {
  if (!prof.evaluador_ciclo) return null;
  const suyo = CICLO_TXT[prof.evaluador_ciclo];
  return ciclo && ciclo !== suyo ? "Su cargo de evaluador solo controla el " + suyo : null;
}

// Quiénes reciben la alarma: el/los auxiliares que cargan y el evaluador del ciclo.
async function destinatariosAlarma(ciclo: string): Promise<string[]> {
  const { data } = await sb.from("profesores")
    .select("id, rol, roles, activo, es_auxiliar, evaluador_ciclo").not("activo", "is", false);
  const cicloNum = ciclo.startsWith("2") ? 2 : 1;
  return (data || []).filter((p: any) => {
    const roles = [String(p.rol || "").toLowerCase(), ...(Array.isArray(p.roles) ? p.roles.map((r: any) => String(r).toLowerCase()) : [])];
    if (!roles.includes("evaluaciones")) return false;
    return p.es_auxiliar === true || Number(p.evaluador_ciclo) === cicloNum;
  }).map((p: any) => String(p.id));
}

// ------------------------------------------------- el corazón: la comparación
// Para cada alumno de la planilla compara cada materia contra notas_academicas
// y su conformidad. No escribe nada: la usan `revisar` y `cargar`.
export type Fila = { cursante_id: string; nombre?: string; promedio: unknown; atributo?: unknown; notas: Record<string, unknown> };
export function evaluarAlumno(
  fila: Fila, materias: string[],
  notasPorClave: Map<string, any>, confPorClave: Map<string, any>,
) {
  const detalle: any[] = [];
  const problemas: any[] = [];
  for (const mat of materias) {
    const k = fila.cursante_id + "|" + mat;
    const vigente = notasPorClave.get(k);
    const conf = confPorClave.get(k);
    const excel = fila.notas ? fila.notas[mat] : undefined;
    const d: any = {
      materia: mat, excel: textoNota(excel), sistema: vigente ? textoNota(vigente.nota_final) : null,
      estado_conformidad: conf ? conf.estado : null, coincide: false,
    };
    if (exacto(excel) === null) {
      problemas.push({ tipo: "no_coincide", materia: mat, detalle: "La planilla no trae una nota legible en esta materia" });
    } else if (!vigente) {
      problemas.push({ tipo: "sin_nota", materia: mat, detalle: "El alumno no tiene esta materia cargada en el sistema" });
    } else if (!coincide(excel, vigente.nota_final)) {
      problemas.push({ tipo: "no_coincide", materia: mat,
        detalle: "Planilla del módulo " + d.excel + " ≠ sistema " + d.sistema });
    } else {
      d.coincide = true;
      // La nota coincide; además tiene que estar RECONOCIDA por el alumno sobre ese mismo valor.
      if (!conf || !conf.publicado_en) {
        problemas.push({ tipo: "sin_firma", materia: mat, detalle: "La nota de la materia no fue publicada para su conformidad" });
      } else if (conf.estado === "rechazada") {
        problemas.push({ tipo: "objetada", materia: mat,
          detalle: "El alumno objetó esta materia" + (conf.observacion_cursante ? ': "' + String(conf.observacion_cursante).slice(0, 300) + '"' : "") });
      } else if (conf.estado !== "confirmada") {
        problemas.push({ tipo: "sin_firma", materia: mat, detalle: "El alumno todavía no firmó la conformidad de esta materia" });
      } else if (!coincide(conf.nota_final, vigente.nota_final)) {
        problemas.push({ tipo: "sin_firma", materia: mat, detalle: "La firma del alumno es sobre otra nota (" + textoNota(conf.nota_final) + ")" });
      }
    }
    detalle.push(d);
  }
  if (exacto(fila.promedio) === null) {
    problemas.push({ tipo: "no_coincide", materia: null, detalle: "La planilla no trae el PROMEDIO del módulo" });
  } else {
    const p = exacto(fila.promedio)!;
    if (p < 0 || p > 100) problemas.push({ tipo: "no_coincide", materia: null, detalle: "Promedio fuera de 0-100 (" + p + ")" });
  }
  return { detalle, problemas, ok: problemas.length === 0 };
}

async function leerVigentes(gestion: number, semestre: number, ciclo: string, materias: string[], ids: string[]) {
  const notas = new Map<string, any>(), confs = new Map<string, any>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const lote = ids.slice(i, i + CHUNK);
    const [n, c] = await Promise.all([
      sb.from("notas_academicas").select("id, cursante_id, materia, nota_final")
        .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo)
        .in("materia", materias).in("cursante_id", lote),
      sb.from("notas_confirmaciones").select("cursante_id, materia, estado, nota_final, publicado_en, observacion_cursante")
        .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo)
        .in("materia", materias).in("cursante_id", lote),
    ]);
    if (n.error || c.error) throw new Error("No se pudieron leer las notas vigentes");
    for (const x of n.data || []) {
      const k = x.cursante_id + "|" + x.materia;
      notas.set(k, notas.has(k) ? null : x); // duplicado ambiguo => no habilita
    }
    for (const x of c.data || []) confs.set(x.cursante_id + "|" + x.materia, x);
  }
  for (const [k, v] of notas) if (v === null) notas.delete(k);
  return { notas, confs };
}

// Normaliza y valida lo que llega del navegador (que ya leyó el Excel).
async function prepararCarga(body: any, prof: any) {
  const gestion = entero(body.gestion), semestre = entero(body.semestre);
  const ciclo = txt(body.ciclo, 60), modulo = txt(body.modulo, 200);
  if (gestion === null || gestion < 2000 || gestion > 2100) return { error: "Gestion invalida" };
  if (semestre !== 1 && semestre !== 2) return { error: "El semestre debe ser 1 o 2" };
  if (!ciclo) return { error: "Falta el ciclo" };
  if (!modulo) return { error: "Falta el nombre del módulo" };
  const ec = errCiclo(prof, ciclo); if (ec) return { error: ec, status: 403 };

  const mats = Array.isArray(body.materias) ? body.materias : [];
  if (!mats.length) return { error: "No se indicó ninguna materia del módulo" };
  if (mats.length > MAX_MATERIAS) return { error: "Demasiadas materias" };
  const materias: { columna: string; materia: string }[] = [];
  const vistas = new Set<string>();
  for (const m of mats) {
    const materia = txt(m?.materia, 160), columna = txt(m?.columna, 200) || materia;
    if (!materia) return { error: "Hay una columna de materia sin emparejar" };
    if (vistas.has(materia)) return { error: "La materia \"" + materia + "\" está emparejada con dos columnas" };
    vistas.add(materia); materias.push({ columna: columna!, materia });
  }
  const nombres = materias.map((m) => m.materia);
  // Toda materia emparejada tiene que existir YA cargada en el período: el
  // módulo confirma notas, no las crea.
  const { data: cargadas, error: errC } = await sb.from("notas_academicas").select("materia")
    .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo).in("materia", nombres).limit(5000);
  if (errC) return { error: "No se pudieron verificar las materias" };
  const hay = new Set((cargadas || []).map((x: any) => x.materia));
  const faltan = nombres.filter((n) => !hay.has(n));
  if (faltan.length) return { error: "Estas materias no están cargadas en el período: " + faltan.join(", ") + ". Cargue primero cada materia." };

  const filasIn = Array.isArray(body.filas) ? body.filas : [];
  if (!filasIn.length) return { error: "No llegó ningún alumno" };
  if (filasIn.length > MAX_FILAS) return { error: "Demasiadas filas" };
  const { data: nomina, error: errN } = await sb.from("cursantes").select("id, ci, nombre_completo")
    .eq("ciclo", ciclo).not("activo", "is", false);
  if (errN) return { error: "No se pudo verificar la nómina" };
  const porId = new Map((nomina || []).map((c: any) => [String(c.id), c]));
  const errores: string[] = [];
  const filas: Fila[] = [];
  const usados = new Set<string>();
  filasIn.forEach((f: any, i: number) => {
    const id = txt(f?.cursante_id, 20);
    const cur = id ? porId.get(id) : null;
    if (!cur) { errores.push("fila " + (i + 1) + ": el cursante no pertenece a " + ciclo + " o no está activo"); return; }
    if (usados.has(id!)) { errores.push(cur.nombre_completo + " está repetido en la planilla"); return; }
    usados.add(id!);
    const notas: Record<string, unknown> = {};
    for (const m of nombres) notas[m] = f?.notas ? f.notas[m] : null;
    filas.push({ cursante_id: id!, nombre: cur.nombre_completo, promedio: f?.promedio, atributo: txt(f?.atributo, 8), notas });
  });
  if (errores.length) return { error: "La planilla tiene observaciones. No se cargó nada.", errores: errores.slice(0, 25) };
  return { gestion, semestre, ciclo, modulo, materias, nombres, filas, porId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });
  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Cuerpo invalido" }, 400); }
  if (body.accion === "ping") return json({ ok: true, funcion: "notas-modulo", version: 1 });

  const s = await leerSesion(body.token);
  if ("error" in s) return json({ ok: false, error: s.error }, s.status);

  try {
    // =========================== LADO DEL CURSANTE ===========================
    if (s.ses.usuario_tabla === "cursantes") {
      const a = await validarCursante(s.ses);
      if ("error" in a) return json({ ok: false, error: a.error }, a.status);
      const cur = a.cur;
      const COLS = "id, gestion, semestre, ciclo, modulo, promedio, atributo, notas, estado, publicado_en, plazo_vence_en, confirmada_en, observacion_cursante";
      switch (body.accion) {
        case "mis_modulos": {
          // Solo lo PUBLICADO: un módulo retenido no se le muestra al alumno.
          const { data, error } = await sb.from("notas_modulo_alumnos").select(COLS)
            .eq("cursante_id", cur.id).neq("estado", "retenida").not("publicado_en", "is", null)
            .order("gestion", { ascending: false }).limit(100);
          if (error) return json({ ok: false, error: "No se pudieron leer tus módulos" }, 500);
          return json({ ok: true, modulos: data || [] });
        }
        case "consultar_modulo":
        case "resolver_modulo": {
          const id = txt(body.id, 60);
          if (!id) return json({ ok: false, error: "Falta el módulo" }, 400);
          const { data: fila, error } = await sb.from("notas_modulo_alumnos").select(COLS + ", cursante_id, modulo_id")
            .eq("id", id).eq("cursante_id", cur.id).maybeSingle();
          if (error) return json({ ok: false, error: "No se pudo leer el módulo" }, 500);
          if (!fila || fila.estado === "retenida" || !fila.publicado_en) return json({ ok: false, error: "No se encontró esa publicación" }, 404);
          if (fila.estado !== "pendiente") return json({ ok: false, no_vigente: true, error: "Este módulo ya tiene tu respuesta registrada." }, 409);

          // Revalidar contra las notas de materia VIGENTES: si alguien corrigió
          // una materia después de publicar el módulo, no se firma un número viejo.
          const mats = (fila.notas || []).map((d: any) => d.materia);
          const { notas, confs } = await leerVigentes(fila.gestion, fila.semestre, fila.ciclo, mats, [cur.id]);
          const filaEval: Fila = { cursante_id: cur.id, promedio: fila.promedio, notas: {} };
          for (const d of fila.notas || []) filaEval.notas[d.materia] = d.excel;
          const ev = evaluarAlumno(filaEval, mats, notas, confs);
          if (!ev.ok) {
            const ahora = new Date().toISOString();
            await sb.from("notas_modulo_alumnos").update({
              estado: "retenida", motivo_retencion: ev.problemas.map((p: any) => (p.materia ? p.materia + ": " : "") + p.detalle).join(" · "),
              actualizado_en: ahora,
            }).eq("id", fila.id).eq("estado", "pendiente");
            await sb.from("notas_modulo_alarmas").insert(ev.problemas.map((p: any) => ({
              modulo_id: fila.modulo_id, gestion: fila.gestion, semestre: fila.semestre, ciclo: fila.ciclo, modulo: fila.modulo,
              cursante_id: cur.id, nombre: cur.nombre_completo, materia: p.materia, tipo: "cambio_al_firmar",
              nota_excel: (ev.detalle.find((d: any) => d.materia === p.materia) || {}).excel ?? null,
              nota_sistema: (ev.detalle.find((d: any) => d.materia === p.materia) || {}).sistema ?? null,
              detalle: p.detalle, detectado_por: "Al abrir la firma del alumno",
            })));
            return json({ ok: false, no_vigente: true, retenida: true, destinatarios: await destinatariosAlarma(fila.ciclo),
              error: "Una nota de materia de este módulo cambió desde su publicación. Se avisó a la Sub. Sec. Evaluaciones; no tenés que hacer nada." }, 409);
          }
          if (body.accion === "consultar_modulo") return json({ ok: true, modulo: fila });

          const decision = txt(body.decision, 20);
          const firma = txt(body.firma, 400000);
          const observacion = txt(body.observacion, 1000);
          if (decision !== "confirmar" && decision !== "rechazar") return json({ ok: false, error: "Decision invalida" }, 400);
          if (!firma) return json({ ok: false, error: "Falta tu firma" }, 400);
          if (decision === "rechazar" && !observacion) return json({ ok: false, error: "Si no estás de acuerdo, tenés que explicar por qué" }, 400);
          if (body.promedio_mostrado !== undefined && !coincide(body.promedio_mostrado, fila.promedio)) {
            return json({ ok: false, no_vigente: true, error: "El promedio cambió desde que abriste la firma. Actualizá y revisalo." }, 409);
          }
          const now = new Date();
          const { data: upd, error: errU } = await sb.from("notas_modulo_alumnos").update({
            estado: decision === "confirmar" ? "confirmada" : "rechazada",
            firma_cursante: firma, confirmada_en: now.toISOString(), observacion_cursante: observacion,
            huella_forense: { ip: ip(req), user_agent: req.headers.get("user-agent") || "", timestamp: now.toISOString(),
              promedio: fila.promedio, modulo: fila.modulo, notas: fila.notas, publicado_en: fila.publicado_en },
            actualizado_en: now.toISOString(),
          }).eq("id", fila.id).eq("cursante_id", cur.id).eq("estado", "pendiente").eq("publicado_en", fila.publicado_en)
            .select("id").maybeSingle();
          if (errU) return json({ ok: false, error: "No se pudo guardar" }, 500);
          if (!upd) return json({ ok: false, no_vigente: true, error: "La publicación cambió o ya fue respondida. Actualizá tus notas." }, 409);
          return json({ ok: true, estado: decision === "confirmar" ? "confirmada" : "rechazada" });
        }
        default:
          return json({ ok: false, error: "Accion desconocida para cursantes" }, 400);
      }
    }

    // ============================ LADO DEL PERSONAL ===========================
    const a = await validarPersonal(s.ses);
    if ("error" in a) return json({ ok: false, error: a.error }, a.status);
    const prof = a.prof;
    const quien = ((prof.grado ? prof.grado + " " : "") + (prof.nombre_completo || "")).trim() + " (" + prof.id + ")";

    switch (body.accion) {
      // Módulos de la malla del ciclo/semestre con sus materias, y las materias
      // ya cargadas en el período (para emparejar columnas del Excel).
      case "catalogo": {
        const gestion = entero(body.gestion), semestre = entero(body.semestre), ciclo = txt(body.ciclo, 60);
        if (gestion === null || (semestre !== 1 && semestre !== 2) || !ciclo) return json({ ok: false, error: "Periodo invalido" }, 400);
        const cicloNum = ciclo.startsWith("2") ? 2 : 1;
        const semAbs = cicloNum === 1 ? semestre : semestre + 2;
        const [malla, cargadas] = await Promise.all([
          sb.from("av_materias").select("modulo, codigo_modulo, nombre_uc").eq("ciclo", cicloNum).eq("semestre", semAbs).eq("activo", true),
          sb.from("notas_academicas").select("materia, grupo").eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo).limit(5000),
        ]);
        const mods = new Map<string, any>();
        for (const m of malla.data || []) {
          if (!m.modulo) continue;
          const k = String(m.modulo);
          if (!mods.has(k)) mods.set(k, { modulo: k, codigo: m.codigo_modulo, materias: [] });
          mods.get(k).materias.push(m.nombre_uc);
        }
        const cnt = new Map<string, any>();
        for (const n of cargadas.data || []) {
          const c = cnt.get(n.materia) || { materia: n.materia, grupo: n.grupo, alumnos: 0 };
          c.alumnos++; cnt.set(n.materia, c);
        }
        return json({ ok: true, modulos: [...mods.values()], materias_cargadas: [...cnt.values()] });
      }

      // revisar = simulacro sin escribir · cargar = guarda y publica
      case "revisar_modulo":
      case "cargar_modulo": {
        const p: any = await prepararCarga(body, prof);
        if (p.error) return json({ ok: false, error: p.error, errores: p.errores }, p.status || 400);
        const { gestion, semestre, ciclo, modulo, materias, nombres, filas } = p;
        const { notas, confs } = await leerVigentes(gestion, semestre, ciclo, nombres, filas.map((f: Fila) => f.cursante_id));
        const resultados = filas.map((f: Fila) => ({ fila: f, ...evaluarAlumno(f, nombres, notas, confs) }));
        const publicables = resultados.filter((r: any) => r.ok).length;
        const resumen = { alumnos: filas.length, publicables, retenidos: filas.length - publicables,
          problemas: resultados.reduce((t: number, r: any) => t + r.problemas.length, 0) };
        const salida = resultados.map((r: any) => ({ cursante_id: r.fila.cursante_id, nombre: r.fila.nombre,
          promedio: textoNota(r.fila.promedio), ok: r.ok, detalle: r.detalle, problemas: r.problemas }));
        if (body.accion === "revisar_modulo") return json({ ok: true, resumen, alumnos: salida });

        // ---------------------------- guardar ------------------------------
        const ahora = new Date();
        const plazo = new Date(ahora.getTime() + PLAZO_DEFECTO_H * 3600000).toISOString();
        const { data: cab, error: errCab } = await sb.from("notas_modulos").upsert({
          gestion, semestre, ciclo, modulo, materias,
          archivo: txt(body.archivo, 200), hoja: txt(body.hoja, 120),
          cargado_por: quien, cargado_por_id: prof.id, resumen, actualizado_en: ahora.toISOString(),
        }, { onConflict: "gestion,semestre,ciclo,modulo" }).select("id").maybeSingle();
        if (errCab || !cab) return json({ ok: false, error: "No se pudo registrar el módulo: " + (errCab?.message || "") }, 500);

        const { data: previas } = await sb.from("notas_modulo_alumnos").select("*")
          .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo).eq("modulo", modulo);
        const prev = new Map((previas || []).map((x: any) => [String(x.cursante_id), x]));

        const rows: any[] = [];
        let nuevas = 0, sinTocar = 0, reabiertas = 0;
        for (const r of resultados) {
          const f: Fila = r.fila;
          const ex = prev.get(f.cursante_id);
          const mismo = ex && coincide(ex.promedio, f.promedio)
            && JSON.stringify((ex.notas || []).map((d: any) => [d.materia, d.excel])) === JSON.stringify(r.detalle.map((d: any) => [d.materia, d.excel]));
          // Firma vigente sobre los mismos números: no se toca.
          if (r.ok && mismo && (ex.estado === "confirmada" || ex.estado === "rechazada" || ex.estado === "pendiente")) { sinTocar++; continue; }
          if (ex) reabiertas++; else nuevas++;
          rows.push({
            modulo_id: cab.id, cursante_id: f.cursante_id, ci: p.porId.get(f.cursante_id)?.ci || null,
            gestion, semestre, ciclo, modulo,
            promedio: exacto(f.promedio) ?? 0, atributo: f.atributo || null, notas: r.detalle,
            estado: r.ok ? "pendiente" : "retenida",
            motivo_retencion: r.ok ? null : r.problemas.map((x: any) => (x.materia ? x.materia + ": " : "") + x.detalle).join(" · "),
            publicado_en: r.ok ? ahora.toISOString() : null, plazo_vence_en: r.ok ? plazo : null,
            firma_cursante: null, confirmada_en: null, observacion_cursante: null, huella_forense: null,
            anterior: ex ? { promedio: ex.promedio, notas: ex.notas, estado: ex.estado, confirmada_en: ex.confirmada_en,
              observacion_cursante: ex.observacion_cursante, firma_cursante: ex.firma_cursante, reemplazado_en: ahora.toISOString() } : null,
            actualizado_en: ahora.toISOString(),
          });
        }
        for (let i = 0; i < rows.length; i += CHUNK) {
          const { error } = await sb.from("notas_modulo_alumnos")
            .upsert(rows.slice(i, i + CHUNK), { onConflict: "cursante_id,gestion,semestre,ciclo,modulo" });
          if (error) return json({ ok: false, error: "Error guardando (se guardaron " + i + " de " + rows.length + "): " + error.message }, 500);
        }

        // Una alarma por problema, sin repetir las que ya están abiertas.
        const { data: abiertas } = await sb.from("notas_modulo_alarmas").select("cursante_id, materia, tipo, nota_excel, nota_sistema")
          .eq("gestion", gestion).eq("semestre", semestre).eq("ciclo", ciclo).eq("modulo", modulo).is("atendida_en", null);
        const yaAbierta = new Set((abiertas || []).map((x: any) => [x.cursante_id, x.materia, x.tipo, x.nota_excel, x.nota_sistema].join("|")));
        const alarmas: any[] = [];
        for (const r of resultados) for (const pr of r.problemas) {
          const d = r.detalle.find((x: any) => x.materia === pr.materia) || {};
          const al = { modulo_id: cab.id, gestion, semestre, ciclo, modulo, cursante_id: r.fila.cursante_id, nombre: r.fila.nombre,
            materia: pr.materia, tipo: pr.tipo, nota_excel: d.excel ?? null, nota_sistema: d.sistema ?? null,
            detalle: pr.detalle, detectado_por: quien };
          if (!yaAbierta.has([al.cursante_id, al.materia, al.tipo, al.nota_excel, al.nota_sistema].join("|"))) alarmas.push(al);
        }
        if (alarmas.length) {
          const { error } = await sb.from("notas_modulo_alarmas").insert(alarmas);
          if (error) console.error("alarmas", error);
        }
        return json({ ok: true, modulo_id: cab.id, resumen, nuevas, reabiertas, sin_tocar: sinTocar,
          alarmas_nuevas: alarmas.length, destinatarios: alarmas.length ? await destinatariosAlarma(ciclo) : [],
          publicados: rows.filter((x) => x.estado === "pendiente").map((x) => x.cursante_id), alumnos: salida });
      }

      case "control": {
        const gestion = entero(body.gestion), semestre = entero(body.semestre);
        if (gestion === null || semestre === null) return json({ ok: false, error: "Periodo invalido" }, 400);
        let q = sb.from("notas_modulos").select("*").eq("gestion", gestion).eq("semestre", semestre);
        if (prof.evaluador_ciclo) q = q.eq("ciclo", CICLO_TXT[prof.evaluador_ciclo]);
        const { data: mods, error } = await q.order("ciclo").order("modulo");
        if (error) return json({ ok: false, error: "No se pudo leer los módulos" }, 500);
        const salida: any[] = [];
        for (const m of mods || []) {
          const { data: al } = await sb.from("notas_modulo_alumnos").select("estado").eq("modulo_id", m.id);
          const c: any = { retenida: 0, pendiente: 0, confirmada: 0, rechazada: 0 };
          for (const x of al || []) c[x.estado] = (c[x.estado] || 0) + 1;
          const { count } = await sb.from("notas_modulo_alarmas").select("id", { count: "exact", head: true })
            .eq("modulo_id", m.id).is("atendida_en", null);
          salida.push({ ...m, conteo: c, total: (al || []).length, alarmas_abiertas: count || 0 });
        }
        return json({ ok: true, modulos: salida });
      }

      case "alumnos_modulo": {
        const id = txt(body.modulo_id, 60);
        if (!id) return json({ ok: false, error: "Falta el módulo" }, 400);
        const { data: m } = await sb.from("notas_modulos").select("*").eq("id", id).maybeSingle();
        if (!m) return json({ ok: false, error: "Módulo no encontrado" }, 404);
        const ec = errCiclo(prof, m.ciclo); if (ec) return json({ ok: false, error: ec }, 403);
        const { data: al, error } = await sb.from("notas_modulo_alumnos")
          .select("id, cursante_id, promedio, atributo, notas, estado, motivo_retencion, publicado_en, plazo_vence_en, confirmada_en, observacion_cursante")
          .eq("modulo_id", id);
        if (error) return json({ ok: false, error: "No se pudo leer los alumnos" }, 500);
        const ids = (al || []).map((x: any) => x.cursante_id);
        const { data: curs } = ids.length ? await sb.from("cursantes").select("id, nombre_completo, grado, paralelo").in("id", ids) : { data: [] };
        const nom = new Map((curs || []).map((c: any) => [String(c.id), c]));
        const lista = (al || []).map((x: any) => ({ ...x, ...(nom.get(String(x.cursante_id)) || {}), id: x.id }))
          .sort((a: any, b: any) => String(a.nombre_completo).localeCompare(String(b.nombre_completo)));
        return json({ ok: true, modulo: m, alumnos: lista });
      }

      case "alarmas": {
        let q = sb.from("notas_modulo_alarmas").select("*").order("creado_en", { ascending: false })
          .limit(Math.min(entero(body.limite) || 300, 500));
        if (body.solo_abiertas !== false) q = q.is("atendida_en", null);
        if (prof.evaluador_ciclo) q = q.eq("ciclo", CICLO_TXT[prof.evaluador_ciclo]);
        const { data, error } = await q;
        if (error) return json({ ok: false, error: "No se pudieron leer las alarmas" }, 500);
        return json({ ok: true, alarmas: data || [] });
      }

      // Marcar una alarma como atendida NO publica nada: para publicar al alumno
      // retenido hay que arreglar la nota (o la planilla) y volver a cargar el módulo.
      case "atender_alarma": {
        const id = txt(body.id, 60), comentario = txt(body.comentario, 500);
        if (!id) return json({ ok: false, error: "Falta la alarma" }, 400);
        if (!comentario || comentario.length < 5) return json({ ok: false, error: "Escriba qué se hizo (al menos 5 caracteres)" }, 400);
        const { data: al } = await sb.from("notas_modulo_alarmas").select("id, ciclo, atendida_en").eq("id", id).maybeSingle();
        if (!al) return json({ ok: false, error: "Alarma no encontrada" }, 404);
        const ec = errCiclo(prof, al.ciclo); if (ec) return json({ ok: false, error: ec }, 403);
        if (al.atendida_en) return json({ ok: false, error: "Esa alarma ya fue atendida" }, 409);
        const { error } = await sb.from("notas_modulo_alarmas").update({
          atendida_en: new Date().toISOString(), atendida_por: quien, atendida_comentario: comentario,
        }).eq("id", id).is("atendida_en", null);
        if (error) return json({ ok: false, error: "No se pudo registrar" }, 500);
        return json({ ok: true });
      }

      case "fijar_plazo": {
        const id = txt(body.modulo_id, 60), horas = Number(body.horas);
        if (!id || !Number.isFinite(horas) || horas <= 0 || horas > PLAZO_MAX_H) return json({ ok: false, error: "Plazo invalido" }, 400);
        const { data: m } = await sb.from("notas_modulos").select("ciclo").eq("id", id).maybeSingle();
        if (!m) return json({ ok: false, error: "Módulo no encontrado" }, 404);
        const ec = errCiclo(prof, m.ciclo); if (ec) return json({ ok: false, error: ec }, 403);
        const { data: pend } = await sb.from("notas_modulo_alumnos").select("id, publicado_en").eq("modulo_id", id).eq("estado", "pendiente");
        let n = 0;
        for (const x of pend || []) {
          const base = x.publicado_en ? new Date(x.publicado_en) : new Date();
          const { error } = await sb.from("notas_modulo_alumnos")
            .update({ plazo_vence_en: new Date(base.getTime() + horas * 3600000).toISOString() }).eq("id", x.id);
          if (!error) n++;
        }
        return json({ ok: true, actualizadas: n });
      }

      default:
        return json({ ok: false, error: "Accion desconocida en notas-modulo: " + String(body.accion) }, 400);
    }
  } catch (e) {
    console.error("notas-modulo", e);
    return json({ ok: false, error: "Error interno: " + ((e as Error)?.message || String(e)) }, 500);
  }
});
