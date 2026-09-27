// ================================================================================
// SIDECEME — Edge Function  sanciones-ops   (v2.9.415)
//
// Anular, reactivar y editar una sanción, firma del cursante, token QR y, desde
// v2.9.415, la carga manual de una sanción en papel (crear_manual).
//
// >>> ESTE ARCHIVO VA EN LA FUNCION "sanciones-ops" (reemplaza la versión 18).
//
// Seguridad: JWT OFF + service_role. La autorización es validarToken() y, según la
// acción, bloqueoGestionSancion() o crearManual().
// ================================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const sb = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Content-Type": "application/json",
};

function ok(extra?: object) {
  return new Response(JSON.stringify({ ok: true, ...extra }), { status: 200, headers: corsHeaders });
}
function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: corsHeaders });
}

async function validarToken(token: string): Promise<{ usuario_id: string; usuario_tabla: string } | null> {
  const { data, error } = await sb
    .from("sesiones")
    .select("usuario_id, usuario_tabla, expira_en, revocado")
    .eq("token", token)
    .limit(1);
  if (error || !data || data.length === 0) return null;
  const s = data[0];
  if (s.revocado || new Date(s.expira_en) < new Date()) return null;
  return { usuario_id: s.usuario_id, usuario_tabla: s.usuario_tabla };
}

// v2.9.367 — GUARDA REAL DEL AUXILIAR DE SECCIÓN.
// El auxiliar (es_auxiliar=true) entra al MISMO panel que el titular y registra
// sanciones a su nombre, pero NO puede anular, reactivar ni modificar ninguna.
// Hasta acá eso lo impedía SOLO el front (esGestSanc), así que la restricción no
// era real: con el token de un auxiliar se podía llamar a esta EF y anular igual.
// Devuelve null si la persona puede gestionar, o el motivo del rechazo si no.
async function bloqueoGestionSancion(profesorId: string): Promise<string | null> {
  const { data } = await sb
    .from("profesores")
    .select("rol, activo, es_auxiliar, solo_lectura")
    .eq("id", profesorId)
    .single();
  if (!data || data.activo === false) return "Cuenta inactiva o no encontrada.";
  if (data.solo_lectura === true) {
    return "Tu cuenta es de AUXILIAR DE CONSULTA de la Sección: podés ver la situación de disciplina e imprimir reportes, pero no anular ni modificar una sanción.";
  }
  if (data.es_auxiliar === true) {
    return "Sos AUXILIAR de la sección: podés registrar y consultar sanciones, pero anularlas o modificarlas es atribución del titular.";
  }
  const rol = String(data.rol || "").toLowerCase();
  if (!["jefe_disciplina", "comandante", "disciplina", "jefe_estudios", "ciencia_tecnologia"].includes(rol)) {
    return "No tenés atribución para esta acción sobre una sanción.";
  }
  return null;
}

// v2.9.170: la auditoría SIEMPRE se escribe (tabla inmutable). registro_generado
// solo controla si la acción aparece en el HISTORIAL OFICIAL visible de la app.
async function auditoria(payload: {
  sancion_id: string;
  accion: string;
  realizado_por: string;
  realizado_por_nombre: string;
  campos_antes?: object;
  campos_despues?: object;
  razon?: string;
  registro_generado?: boolean;
  estado_antes?: string;
  estado_despues?: string;
  puntos_antes?: number;
  puntos_despues?: number;
  solicitante_nombre?: string;
  solicitud_fecha?: string;
  solicitud_motivo?: string;
  decision_final?: string;
}) {
  const row: Record<string, unknown> = {
    sancion_id: String(payload.sancion_id),
    accion: payload.accion,
    realizado_por: payload.realizado_por,
    realizado_por_nombre: payload.realizado_por_nombre,
    campos_antes: payload.campos_antes ?? {},
    campos_despues: payload.campos_despues ?? {},
    razon: payload.razon ?? null,
    registro_generado: payload.registro_generado !== false,
    estado_antes: payload.estado_antes ?? null,
    estado_despues: payload.estado_despues ?? null,
    puntos_antes: payload.puntos_antes ?? null,
    puntos_despues: payload.puntos_despues ?? null,
    solicitante_nombre: payload.solicitante_nombre ?? null,
    solicitud_fecha: payload.solicitud_fecha ?? null,
    solicitud_motivo: payload.solicitud_motivo ?? null,
    decision_final: payload.decision_final ?? null,
    creado_en: new Date().toISOString(),
  };
  // Auto-heal: si una columna nueva aún no existe (SQL sin correr), quitarla y reintentar
  for (let i = 0; i < 12; i++) {
    const { error } = await sb.from("sanciones_audit").insert(row);
    if (!error) return;
    const m = (error.message || "").match(/Could not find the '([^']+)' column/i);
    if (m && m[1] && m[1] in row) { delete row[m[1]]; continue; }
    return; // best-effort: no bloquea la operación principal
  }
}

// v2.9.170 CAMBIO 3: rangos de puntos por tipo de falta (Reglamento de Disciplina ECEME)
const RANGOS: Record<string, [number, number]> = { LEVE: [1, 3], GRAVE: [4, 7], MUYGRAVE: [8, 12] };
function rangoDe(categoria: string): [number, number] | null {
  const key = String(categoria || "").toUpperCase().replace(/[^A-Z]/g, "");
  return RANGOS[key] ?? null;
}

// v2.9.170 CAMBIO 2: recálculo del puntaje persistido en BD (best-effort; el trigger SQL ya lo hace)
async function recalcularPuntaje(cursanteId: string) {
  try { await sb.rpc("recalcular_puntaje_cursante", { cid: cursanteId }); } catch (_) { /* trigger cubre */ }
}

// v2.9.170 CAMBIO 4: si C&T actúa DIRECTAMENTE (sin solicitud de profesor) el registro
// oficial no se genera, salvo que lo pida expresamente (body.registrar === true).
async function esCT(profesorId: string): Promise<boolean> {
  const { data } = await sb.from("profesores").select("rol").eq("id", profesorId).single();
  return String(data?.rol || "").toLowerCase() === "ciencia_tecnologia";
}
async function flagRegistro(body: Record<string, unknown>, usuarioId: string): Promise<boolean> {
  if (body.por_solicitud === true) return true;          // pedido por profesor → SIEMPRE se registra
  if (body.registrar === true) return true;              // C&T lo pidió expresamente
  if (await esCT(usuarioId)) return false;               // C&T directo → sin registro oficial
  return true;                                           // resto de roles → siempre se registra
}

// ── CARGA MANUAL (v2.9.415) ───────────────────────────────────────────────────
// Una sanción en papel que no se cargó digitalmente la carga el Jefe de
// Disciplina, el Jefe de Estudios o C&T (el Comandante no: la pantalla tampoco se
// lo ofrece). Del navegador se toman solo los datos del formulario; el cursante y
// quien la carga salen de la base y de la sesión. Los puntos se validan contra la
// tabla reglamentos: con la falta, los del reglamento o el doble (1ª reincidencia);
// sin falta, entre el mínimo de su categoría y el doble del máximo.
const ROLES_CARGA_MANUAL = ["jefe_disciplina", "disciplina", "jefe_estudios", "ciencia_tecnologia"];
const ID_MANUAL = /^manual_\d{10,16}_[a-z0-9]{3,12}$/;
// Como la guarda la app al sancionar (normalizarCategoria): LEVE, GRAVE, GRAVÍSIMA.
const CATEGORIA_GUARDADA: Record<string, string> = { LEVE: "LEVE", GRAVE: "GRAVE", GRAVISIMA: "GRAVÍSIMA" };

// "Gravísima", "GRAVÍSIMA", "GRAVISIMA" y "MUY GRAVE" son la misma categoría.
function claveCategoria(c: unknown): string {
  const k = String(c || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
  return k === "MUYGRAVE" ? "GRAVISIMA" : k;
}
function textoCorto(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

async function crearManual(body: Record<string, any>, usuarioId: string, usuarioTabla: string, req: Request): Promise<Response> {
  if (usuarioTabla !== "profesores") return err("Solo el personal de la Sección carga sanciones manuales.", 403);
  const { data: prof } = await sb
    .from("profesores")
    .select("nombre_completo, grado, ci, rol, activo, es_auxiliar, solo_lectura")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!prof || prof.activo === false) return err("Cuenta inactiva o no encontrada.", 403);
  if (prof.solo_lectura === true) {
    return err("Tu cuenta es de AUXILIAR DE CONSULTA de la Sección: podés ver la situación de disciplina e imprimir reportes, pero no cargar sanciones.", 403);
  }
  if (prof.es_auxiliar === true) return err("Sos AUXILIAR de la sección: la carga manual de una sanción es atribución del titular.", 403);
  if (!ROLES_CARGA_MANUAL.includes(String(prof.rol || "").toLowerCase())) {
    return err("Solo el Jefe de Disciplina, el Jefe de Estudios o C&T cargan sanciones manuales.", 403);
  }

  // Hasta v2.9.414 la app mandaba los datos dentro de "nueva": se aceptan los dos
  // formatos, pero de ahí se toman solo los campos del formulario.
  const f: Record<string, any> = (body.nueva && typeof body.nueva === "object") ? body.nueva : body;
  const cursanteId = textoCorto(f.cursante_id, 60);
  const categoria = claveCategoria(f.falta_categoria);
  const faltaTxt = textoCorto(f.falta_id, 80);
  const descripcion = textoCorto(f.falta_descripcion, 2000);
  const puntos = Number(f.puntos_aplicados);
  const fecha = textoCorto(f.fecha ?? f.fecha_original, 10);
  const observaciones = textoCorto(f.observaciones, 2000);
  const razon = textoCorto(body.razon ?? f.carga_manual_razon, 2000);

  if (!cursanteId) return err("Seleccioná un cursante.");
  if (!CATEGORIA_GUARDADA[categoria]) return err("Categoría inválida: tiene que ser LEVE, GRAVE o GRAVÍSIMA.");
  if (!descripcion) return err("La descripción es obligatoria.");
  if (!Number.isInteger(puntos) || puntos < 1) return err("Los puntos tienen que ser un número entero, al menos 1.");
  if (!razon || razon.length < 5) return err("La razón de la carga manual es obligatoria (mínimo 5 caracteres).");
  const fechaOk = !!fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    !isNaN(Date.parse(fecha + "T12:00:00Z")) && new Date(fecha + "T12:00:00Z").toISOString().slice(0, 10) === fecha;
  if (!fechaOk || fecha! < "2020-01-01") return err("Fecha de la sanción inválida.");
  const hoyBolivia = new Date().toLocaleDateString("en-CA", { timeZone: "America/La_Paz" }); // AAAA-MM-DD
  if (fecha! > hoyBolivia) return err("La fecha de la sanción no puede ser futura.");

  const { data: cur } = await sb
    .from("cursantes")
    .select("id, nombre_completo, ci, activo")
    .eq("id", cursanteId)
    .maybeSingle();
  if (!cur) return err("Cursante no encontrado.", 404);
  if (cur.activo === false) return err("El cursante está dado de baja.");

  const { data: regl, error: rErr } = await sb
    .from("reglamentos")
    .select("id, articulo, puntos, categoria")
    .eq("activo", true);
  if (rErr) return err("No se pudo leer el reglamento: " + rErr.message, 500);
  const reglas: any[] = regl || [];
  const nombreCat = CATEGORIA_GUARDADA[categoria];

  let falta: any = null;
  let puntosBase = puntos;
  let reincidencia = false;
  if (faltaTxt) {
    // "LEVE_1_a" o "ana_LEVE_1_a": el id del reglamento lleva el prefijo ana_.
    const buscado = faltaTxt.toLowerCase();
    falta = reglas.find((r) => {
      const id = String(r.id).toLowerCase();
      return id === buscado || id === "ana_" + buscado;
    }) || null;
    if (!falta) {
      return err(`La falta «${faltaTxt}» no está en el reglamento. Escribila como figura ahí (ej. LEVE_1_a) o dejá el campo vacío.`);
    }
    const catFalta = claveCategoria(falta.categoria);
    if (catFalta !== categoria) {
      return err(`La falta ${falta.id} es ${CATEGORIA_GUARDADA[catFalta] || falta.categoria}, no ${nombreCat}.`);
    }
    const base = Number(falta.puntos) || 0;
    if (puntos === base) {
      puntosBase = base;
    } else if (puntos === base * 2) {
      puntosBase = base;
      reincidencia = true;
    } else {
      return err(`La falta ${falta.id} vale ${base} puntos (${base * 2} en la 1ª reincidencia), no ${puntos}.`);
    }
  } else {
    const pts = reglas.filter((r) => claveCategoria(r.categoria) === categoria)
      .map((r) => Number(r.puntos) || 0).filter((p) => p > 0);
    if (!pts.length) return err(`No hay faltas ${nombreCat} en el reglamento.`);
    const min = Math.min(...pts);
    const max = Math.max(...pts) * 2;
    if (puntos < min || puntos > max) {
      return err(`Una falta ${nombreCat} admite de ${min} a ${max} puntos según el reglamento (el máximo es la 1ª reincidencia).`);
    }
  }

  const [anio, mes] = fecha!.split("-").map(Number);
  const idCliente = textoCorto(f.id, 60);
  const id = (idCliente && ID_MANUAL.test(idCliente))
    ? idCliente
    : `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const fila: Record<string, unknown> = {
    id,
    cursante_id: cur.id,
    cursante_nombre: cur.nombre_completo,
    cursante_ci: cur.ci ?? null,
    profesor_id: usuarioId,
    profesor_nombre: prof.nombre_completo,
    profesor_grado: prof.grado ?? null,
    profesor_ci: prof.ci ?? null,
    falta_id: falta ? falta.id : null,
    falta_articulo: falta && falta.articulo != null ? String(falta.articulo) : null,
    falta_categoria: nombreCat,
    falta_descripcion: descripcion,
    puntos_base: puntosBase,
    puntos_aplicados: puntos,
    es_reincidencia: reincidencia,
    reincidencia_num: reincidencia ? 1 : 0,
    observaciones,
    // Como en las sanciones en papel ya cargadas: la fecha de la papeleta va en
    // creado_en, que es la que usa la app para el semestre y la reincidencia.
    creado_en: `${fecha}T12:00:00-04:00`,
    semestre: `${anio}-${mes <= 6 ? 1 : 2}`,
    tipo: "analogica",
    confirmacion_estado: "analogico",
    estado: "VIGENTE",
    anulada: false,
    es_prueba: false,
    es_carga_manual: true,
    carga_manual_razon: razon,
    registro_generado: true,
    huella_forense: {
      tipo: "carga_manual",
      cargada_por: usuarioId,
      cargada_por_nombre: prof.nombre_completo,
      cargada_por_rol: prof.rol,
      cargada_en: new Date().toISOString(),
      razon,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300) || null,
    },
  };

  // sanciones_no_duplicar es UNIQUE (cursante_id, falta_articulo, creado_en, profesor_id):
  // con la hora fija, una segunda papeleta del mismo artículo, del mismo día y cargada
  // por la misma persona chocaría, así que se corre un segundo por cada una que ya esté.
  let creada: any = null;
  for (let seg = 0; seg < 60; seg++) {
    fila.creado_en = `${fecha}T12:00:${String(seg).padStart(2, "0")}-04:00`;
    const { data, error: insErr } = await sb.from("sanciones").insert(fila).select("*").single();
    if (data && !insErr) { creada = data; break; }
    if (insErr?.code === "23505" && String(insErr.message || "").includes("sanciones_no_duplicar")) continue;
    // Mismo id: la app publicada (que manda su propio id) reenvió la misma carga.
    if (insErr?.code === "23505") return err("Esta sanción ya fue cargada.", 409);
    return err("No se pudo guardar la sanción: " + (insErr?.message || "sin respuesta"), 500);
  }
  if (!creada) return err("Ya hay 60 sanciones de ese artículo con esa fecha, cargadas por vos para este cursante.", 409);

  // Una sanción cargada suma puntos: aparece siempre en el historial oficial,
  // también si la carga C&T.
  await auditoria({
    sancion_id: id, accion: "crear_manual", realizado_por: usuarioId, realizado_por_nombre: prof.nombre_completo,
    campos_antes: {},
    campos_despues: {
      cursante_id: cur.id, falta_id: fila.falta_id, falta_categoria: nombreCat, puntos_aplicados: puntos,
      fecha, semestre: fila.semestre, es_carga_manual: true,
    },
    razon, registro_generado: true,
    estado_despues: "VIGENTE", puntos_antes: 0, puntos_despues: puntos,
  });
  await recalcularPuntaje(String(cur.id));
  return ok({ sancion: creada });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const { accion, token } = body;

    if (!accion) return err("accion requerida");
    if (!token) return err("token requerido", 401);

    const sesion = await validarToken(token);
    if (!sesion) return err("Sesión no válida o expirada. Volvé a iniciar sesión.", 401);

    const { usuario_id, usuario_tabla } = sesion;
    const usuario_nombre: string = body.usuario_nombre || usuario_id;

    // v2.9.415: la carga manual crea la sanción, así que va antes de exigir sancion_id.
    if (accion === "crear_manual") return await crearManual(body, usuario_id, usuario_tabla, req);

    // Todas las acciones operan sobre una sanción existente: se necesita sancion_id
    const { sancion_id } = body;
    if (!sancion_id) return err("sancion_id requerido");

    const { data: sancion, error: sErr } = await sb.from("sanciones").select("*").eq("id", sancion_id).single();
    if (sErr || !sancion) return err("Sanción no encontrada", 404);

    // ── ANULAR ───────────────────────────────────────────────────────────────
    if (accion === "anular") {
      if (usuario_tabla !== "profesores") return err("Solo profesores pueden anular.", 403);
      const _bloqAnular = await bloqueoGestionSancion(usuario_id);
      if (_bloqAnular) return err(_bloqAnular, 403);
      const { razon } = body;
      if (!razon || String(razon).trim().length < 5) return err("Razón mínima 5 caracteres");

      const ahora = new Date().toISOString();
      const registrar = await flagRegistro(body, usuario_id);
      const updates: Record<string, unknown> = {
        anulada: true,
        anulada_razon: String(razon).trim(),
        anulada_por: usuario_id,
        anulada_por_nombre: usuario_nombre,
        anulada_en: ahora,
        estado: "ANULADA",
        registro_generado: registrar,
      };

      // Auto-heal por si el SQL de estado aún no corrió
      for (let i = 0; i < 6; i++) {
        const { error } = await sb.from("sanciones").update(updates).eq("id", sancion_id);
        if (!error) break;
        const m = (error.message || "").match(/Could not find the '([^']+)' column/i);
        if (m && m[1] && m[1] in updates) { delete updates[m[1]]; continue; }
        return err(error.message);
      }

      await auditoria({
        sancion_id, accion: "anular", realizado_por: usuario_id, realizado_por_nombre: usuario_nombre,
        campos_antes: { anulada: false }, campos_despues: updates, razon: String(razon).trim(),
        registro_generado: registrar,
        estado_antes: sancion.estado || "VIGENTE", estado_despues: "ANULADA",
        puntos_antes: Number(sancion.puntos_aplicados) || 0, puntos_despues: 0,
        solicitante_nombre: body.solicitante_nombre || null,
        solicitud_fecha: body.solicitud_fecha || null,
        solicitud_motivo: body.solicitud_motivo || null,
        decision_final: body.decision_final || (body.por_solicitud ? "APROBADA por Jefe de Disciplina" : null),
      });
      await recalcularPuntaje(String(sancion.cursante_id));
      return ok({ registro_generado: registrar });
    }

    // ── REACTIVAR ────────────────────────────────────────────────────────────
    if (accion === "reactivar") {
      if (usuario_tabla !== "profesores") return err("Solo profesores pueden reactivar.", 403);
      const _bloqReact = await bloqueoGestionSancion(usuario_id);
      if (_bloqReact) return err(_bloqReact, 403);
      if (!sancion.anulada) return err("La sanción no está anulada");
      const { razon } = body;
      if (!razon || String(razon).trim().length < 5) return err("Razón mínima 5 caracteres");

      const ahora = new Date().toISOString();
      const registrarR = await flagRegistro(body, usuario_id);
      const updates: Record<string, unknown> = {
        anulada: false,
        reactivada_razon: String(razon).trim(),
        reactivada_por: usuario_id,
        reactivada_en: ahora,
        estado: "VIGENTE",
        registro_generado: registrarR,
      };

      for (let i = 0; i < 6; i++) {
        const { error } = await sb.from("sanciones").update(updates).eq("id", sancion_id);
        if (!error) break;
        const m = (error.message || "").match(/Could not find the '([^']+)' column/i);
        if (m && m[1] && m[1] in updates) { delete updates[m[1]]; continue; }
        return err(error.message);
      }

      await auditoria({
        sancion_id, accion: "reactivar", realizado_por: usuario_id, realizado_por_nombre: usuario_nombre,
        campos_antes: { anulada: true }, campos_despues: updates, razon: String(razon).trim(),
        registro_generado: registrarR,
        estado_antes: "ANULADA", estado_despues: "VIGENTE",
        puntos_antes: 0, puntos_despues: Number(sancion.puntos_aplicados) || 0,
        // v2.9.304: la REACTIVACIÓN también debe decir a solicitud de quién y con qué
        // justificativo. Estos cuatro campos no se pasaban acá (anular y editar sí los
        // guardaban), así que ninguna reactivación podía reconstruir el pedido.
        solicitante_nombre: body.solicitante_nombre || null,
        solicitud_fecha: body.solicitud_fecha || null,
        solicitud_motivo: body.solicitud_motivo || null,
        decision_final: body.decision_final || (body.por_solicitud ? "APROBADA por Jefe de Disciplina" : null),
      });
      await recalcularPuntaje(String(sancion.cursante_id));
      return ok({ registro_generado: registrarR });
    }

    // ── EDITAR ───────────────────────────────────────────────────────────────
    if (accion === "editar") {
      if (usuario_tabla !== "profesores") return err("Solo profesores pueden editar.", 403);
      const _bloqEditar = await bloqueoGestionSancion(usuario_id);
      if (_bloqEditar) return err(_bloqEditar, 403);

      const { cambios, previo, razon } = body;
      if (!cambios || Object.keys(cambios).length === 0) return err("No hay cambios para guardar");
      // CAMBIO 3: justificación obligatoria mínimo 20 caracteres
      if (!razon || String(razon).trim().length < 20) return err("La justificación del cambio es obligatoria (mínimo 20 caracteres).");

      // CAMBIO 3: validar puntos contra el rango del tipo de falta (Reglamento ECEME)
      // Leve 1-3 · Grave 4-7 · Muy Grave 8-12 (deméritos en valor absoluto)
      const catFinal = String(("falta_categoria" in cambios) ? cambios.falta_categoria : sancion.falta_categoria || "");
      const ptsFinal = Math.abs(Number(("puntos_aplicados" in cambios) ? cambios.puntos_aplicados : sancion.puntos_aplicados) || 0);
      const rango = rangoDe(catFinal);
      if (rango && (ptsFinal < rango[0] || ptsFinal > rango[1])) {
        return err(`Puntos fuera de rango: una falta ${catFinal} admite de ${rango[0]} a ${rango[1]} puntos según el Reglamento de Disciplina.`);
      }

      const CAMPOS_EDITABLES = ["folio", "falta_categoria", "falta_id", "falta_descripcion", "puntos_aplicados", "fecha_original", "observaciones"];
      const working: Record<string, unknown> = {};
      for (const k of CAMPOS_EDITABLES) {
        if (k in cambios) working[k] = cambios[k];
      }
      if (Object.keys(working).length === 0) return err("No hay campos editables en los cambios");
      // CAMBIO 1: marcar la sanción como MODIFICADA con su rastro
      const registrarE = await flagRegistro(body, usuario_id);
      working["estado"] = (sancion.anulada === true) ? "ANULADA" : "MODIFICADA";
      working["modificada_en"] = new Date().toISOString();
      working["modificada_por"] = usuario_nombre;
      working["modificada_motivo"] = String(razon).trim();
      working["registro_generado"] = registrarE;

      // Auto-heal: descartar columnas que no existen en el schema y reintentar
      let attempt = 0;
      let updateError: { message?: string } | null = null;
      while (attempt < 15) {
        attempt++;
        const { error } = await sb.from("sanciones").update(working).eq("id", sancion_id);
        if (!error) { updateError = null; break; }
        const msg = error.message || "";
        const m = msg.match(/Could not find the '([^']+)' column/i) || msg.match(/column \"([^\"]+)\" of relation/i);
        if (m && m[1] && (m[1] in working)) { delete working[m[1]]; continue; }
        updateError = error;
        break;
      }
      if (updateError) return err(updateError.message || "Error al editar");
      if (Object.keys(working).length === 0) return err("Ninguno de los campos editados existe en la tabla.");

      await auditoria({
        sancion_id, accion: "editar", realizado_por: usuario_id, realizado_por_nombre: usuario_nombre,
        campos_antes: previo ?? {}, campos_despues: working, razon: String(razon).trim(),
        registro_generado: registrarE,
        estado_antes: sancion.estado || "VIGENTE", estado_despues: String(working["estado"] || "MODIFICADA"),
        puntos_antes: Number(sancion.puntos_aplicados) || 0,
        puntos_despues: Number(("puntos_aplicados" in working) ? working["puntos_aplicados"] : sancion.puntos_aplicados) || 0,
        solicitante_nombre: body.solicitante_nombre || null,
        solicitud_fecha: body.solicitud_fecha || null,
        solicitud_motivo: body.solicitud_motivo || null,
        decision_final: body.decision_final || (body.por_solicitud ? "APROBADA por Jefe de Disciplina" : null),
      });
      await recalcularPuntaje(String(sancion.cursante_id));
      return ok({ registro_generado: registrarE });
    }

    // ── FIRMA CURSANTE ────────────────────────────────────────────────────────
    if (accion === "firma_cursante") {
      if (usuario_tabla !== "cursantes") return err("Token inválido para firma de cursante.", 403);

      if (String(sancion.cursante_id) !== String(usuario_id)) {
        return err("No podés firmar una sanción que no es tuya.", 403);
      }

      const conf = (sancion.confirmacion_estado || "").toLowerCase();
      if (sancion.firma_cursante || conf.includes("firm") || conf.includes("acept")) {
        return err("Esta sanción ya fue firmada.");
      }

      const { updates } = body;
      if (!updates) return err("updates requerido");

      const CAMPOS_FIRMA = ["firma_cursante", "firmada_curs_en", "confirmacion_estado", "observaciones_cursante", "huella_forense"];
      let working: Record<string, unknown> = {};
      for (const k of CAMPOS_FIRMA) {
        if (k in updates) working[k] = updates[k];
      }

      // Auto-heal: quitar columnas que no existen en el schema
      let attempt = 0;
      let updateError = null;
      while (attempt < 10) {
        attempt++;
        const { error } = await sb.from("sanciones").update(working).eq("id", sancion_id);
        if (!error) { updateError = null; break; }
        const msg = error.message || "";
        const m = msg.match(/Could not find the '([^']+)' column/i) || msg.match(/column \"([^\"]+)\" of relation/i);
        if (m && m[1]) { delete working[m[1]]; continue; }
        updateError = error;
        break;
      }
      if (updateError) return err((updateError as { message: string }).message || "Error al guardar firma");

      return ok();
    }

    // ── SET TOKEN QR ─────────────────────────────────────────────────────────
    // Setea token_qr en huella_forense para que el cursante pueda firmar.
    // Solo profesores autenticados. Idempotente: si ya hay token_qr, no lo pisa.
    if (accion === "set_token_qr") {
      if (usuario_tabla !== "profesores") return err("Solo profesores pueden generar el QR.", 403);

      const { token_qr } = body;
      if (!token_qr || typeof token_qr !== "string" || token_qr.length < 8) {
        return err("token_qr inválido");
      }

      // Si ya existe un token_qr en la sanción, lo devolvemos sin sobreescribir.
      const huellaActual = (sancion.huella_forense || {}) as Record<string, unknown>;
      if (huellaActual.token_qr) {
        return new Response(
          JSON.stringify({ ok: true, token_qr: huellaActual.token_qr, ya_existia: true }),
          { status: 200, headers: corsHeaders }
        );
      }

      // No permitir generar QR para sanciones ya firmadas o anuladas
      if (sancion.firma_cursante) return err("La sanción ya está firmada, no requiere QR.");
      if (sancion.anulada === true) return err("La sanción está anulada.");

      const huellaNueva = { ...huellaActual, token_qr };
      const { error: uErr } = await sb
        .from("sanciones")
        .update({ huella_forense: huellaNueva })
        .eq("id", sancion_id);
      if (uErr) return err(uErr.message);

      return new Response(
        JSON.stringify({ ok: true, token_qr, ya_existia: false }),
        { status: 200, headers: corsHeaders }
      );
    }

    return err(`Acción desconocida: ${accion}`);

  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: "Error interno: " + ((e as Error).message || String(e)) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
