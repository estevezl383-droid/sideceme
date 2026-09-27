// ================================================================================
// SIDECEME — Edge Function  solicitudes-ops   (v2.9.414)
//
// Solicitudes de reconsideración / anulación / modificación de una sanción, y
// lectura del historial de cambios de las sanciones (sanciones_audit).
// Reemplaza los accesos que la app hacía directo a las tablas
// solicitudes_anulacion y sanciones_audit: acá cada operación valida la sesión
// y quién puede hacer qué.
//
// >>> ESTE ARCHIVO VA EN LA FUNCION "solicitudes-ops". Es NUEVA, no reemplaza a nada.
//
// Quién puede qué:
//   - Cursante: crear (solo sobre SUS sanciones) · mias · por_sancion,
//     historial e historial_editadas (solo de SUS sanciones).
//   - Cualquier profesor activo: crear · por_sancion · historial ·
//     historial_editadas.
//   - Jefe de Disciplina, Comandante, Jefe de Estudios y C&T: bandeja (el
//     Comandante y el Jefe de Estudios, solo lo que se les elevó). Resolver
//     (resolver · elevar · retomar · devolver) con las mismas reglas que la
//     pantalla de solicitudes. El auxiliar y el auxiliar de consulta ven la
//     bandeja pero no resuelven (el mismo criterio de sanciones-ops).
//   - C&T: historial_recientes (alertas de seguridad). Es el único que ve las
//     acciones sin registro oficial (registro_generado = false).
//
// Quién pide, quién resuelve y los nombres salen de la sesión, nunca del body.
// Las firmas (imágenes) solo viajan a la bandeja de quien resuelve; en las demás
// lecturas se indica solamente si la solicitud tiene firma (true/false).
//
// Seguridad: JWT OFF + service_role. La autorización es leerUsuario().
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

const VERSION = "2.9.414";
const TIPOS = ["reconsideracion", "anulacion", "modificacion"];
// Una firma dibujada en el canvas pesa unos 25 KB; esto deja mucho margen.
const MAX_FIRMA = 600_000;
// Lo que la app muestra del historial (el user_agent no sale de acá).
const CAMPOS_HISTORIAL =
  "id, sancion_id, accion, realizado_por, realizado_por_nombre, campos_antes, campos_despues, razon, " +
  "creado_en, registro_generado, estado_antes, estado_despues, puntos_antes, puntos_despues, " +
  "solicitante_nombre, solicitud_fecha, solicitud_motivo, decision_final";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}
const ok = (extra?: object) => json({ ok: true, ...extra });
const err = (error: string, status = 400) => json({ ok: false, error }, status);

function txt(v: unknown, max: number): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

// Copia de nombreConGrado() de index.html: el nombre sale igual que en el resto de la app.
function nombreConGrado(c: any): string {
  const grado = String(c?.grado || "").trim();
  const armaOrig = String(c?.arma || "").trim();
  const nombre = String(c?.nombre_completo || "").trim();
  let armaMostrar = armaOrig;
  const esCursante = !!(c?.ciclo || c?.paralelo);
  const gradoUp = grado.toUpperCase();
  if (gradoUp.includes("DEM") || gradoUp.includes("DAEN")) {
    armaMostrar = "";
  } else if (!esCursante && grado) {
    const g = gradoUp.replace(/\./g, "").trim();
    const armaUp = armaOrig.toUpperCase().replace(/\./g, "").trim();
    if (armaUp === "DEM" || armaUp === "DAEN") {
      // ya correcto, no duplicar
    } else if (/^TCNL|^TTE\s*C|^TNTE\s*C/.test(g)) {
      armaMostrar = "DEM.";
    } else if (/^CNL|^CRL|^GRAL|^GRL/.test(g) && !/^T/.test(g)) {
      armaMostrar = "DAEN.";
    }
  }
  const partes = [grado, armaMostrar, nombre].filter(Boolean);
  return partes.length ? partes.join(" ") : (nombre || "—");
}

const fechaBO = () => new Date().toLocaleDateString("es-BO", { timeZone: "America/La_Paz" });

type Usuario = {
  tabla: "profesores" | "cursantes";
  id: string;
  nombre: string;       // nombre_completo, como firma la app ("ANULADA por …")
  nombreGrado: string;  // grado + arma + nombre, como nombreConGrado()
  roles: Set<string>;   // rol + roles[] (solo profesores)
  auxiliar: boolean;
  soloLectura: boolean;
};

async function leerUsuario(token: unknown): Promise<Usuario | { error: string; status: number }> {
  if (!token || typeof token !== "string" || token.length > 200) {
    return { error: "Sesión no válida. Volvé a iniciar sesión.", status: 401 };
  }
  const { data: ses, error } = await sb
    .from("sesiones")
    .select("usuario_id, usuario_tabla, revocado, expira_en")
    .eq("token", token)
    .maybeSingle();
  if (error || !ses || ses.revocado === true || new Date(ses.expira_en) < new Date()) {
    return { error: "Sesión no válida o expirada. Volvé a iniciar sesión.", status: 401 };
  }
  const id = String(ses.usuario_id);

  if (ses.usuario_tabla === "profesores") {
    const { data: p } = await sb
      .from("profesores")
      .select("grado, arma, nombre_completo, rol, roles, activo, es_auxiliar, solo_lectura")
      .eq("id", id)
      .maybeSingle();
    if (!p || p.activo === false) return { error: "Cuenta inactiva o no encontrada.", status: 403 };
    const roles = new Set<string>();
    if (p.rol) roles.add(String(p.rol).toLowerCase());
    if (Array.isArray(p.roles)) for (const r of p.roles) roles.add(String(r).toLowerCase());
    return {
      tabla: "profesores", id, nombre: p.nombre_completo || id, nombreGrado: nombreConGrado(p),
      roles, auxiliar: p.es_auxiliar === true, soloLectura: p.solo_lectura === true,
    };
  }
  if (ses.usuario_tabla === "cursantes") {
    const { data: c } = await sb
      .from("cursantes")
      .select("grado, arma, nombre_completo, ciclo, paralelo, activo")
      .eq("id", id)
      .maybeSingle();
    if (!c || c.activo === false) return { error: "Cuenta inactiva o no encontrada.", status: 403 };
    return {
      tabla: "cursantes", id, nombre: c.nombre_completo || id, nombreGrado: nombreConGrado(c),
      roles: new Set(), auxiliar: false, soloLectura: false,
    };
  }
  return { error: "Sesión no válida.", status: 403 };
}

const tiene = (u: Usuario, ...r: string[]) => u.tabla === "profesores" && r.some((x) => u.roles.has(x));
const esCT = (u: Usuario) => tiene(u, "ciencia_tecnologia") && !u.auxiliar;
const esDisc = (u: Usuario) => tiene(u, "jefe_disciplina", "disciplina");
const esCmdte = (u: Usuario) => tiene(u, "comandante");
const esEstudios = (u: Usuario) => tiene(u, "jefe_estudios", "estudios");
const veBandeja = (u: Usuario) => esCT(u) || esDisc(u) || esCmdte(u) || esEstudios(u);

// Devuelve null si la persona puede resolver ESTA solicitud, o el motivo si no.
function bloqueoResolver(u: Usuario, s: any): string | null {
  if (u.soloLectura) {
    return "Tu cuenta es de AUXILIAR DE CONSULTA de la Sección: podés ver las solicitudes, pero no resolverlas.";
  }
  if (u.auxiliar) return "Sos AUXILIAR de la sección: resolver solicitudes es atribución del titular.";
  if (esCT(u) || esDisc(u)) return null;
  if (esCmdte(u) && s.enviado_a_comandante) return null;
  if (esEstudios(u) && s.enviado_a_estudios) return null;
  return "No tenés atribución para resolver esta solicitud.";
}

// Igual que _solEstado() de la app: todo lo que no es aprobado/rechazado está pendiente.
function estadoDe(s: any): "aprobado" | "rechazado" | "pendiente" {
  const e = String(s?.estado || "pendiente").toLowerCase().trim();
  return e === "aprobado" || e === "rechazado" ? e : "pendiente";
}

// Igual que _solInfo(s).esCursante de la app.
function esDelCursante(s: any): boolean {
  const com = String(s?.comentario_disciplina || "");
  const creadaPorElCursante = !!s?.cursante_id && String(s?.creada_por || "") === String(s.cursante_id);
  return s?.origen === "cursante" || !!s?.detalle_cursante || !!s?.firma_cursante_solicitud ||
    creadaPorElCursante || /RECONSIDERACI[OÓ]N CURSANTE/i.test(com);
}

function sinFirmas(s: any) {
  return {
    ...s,
    firma_cursante_solicitud: !!s.firma_cursante_solicitud,
    firma_profesor_solicitud: !!s.firma_profesor_solicitud,
  };
}

async function sancionDe(id: string) {
  const { data } = await sb
    .from("sanciones")
    .select("id, cursante_id, cursante_nombre, anulada")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function esSancionDe(u: Usuario, sancionId: string): Promise<boolean> {
  if (u.tabla === "profesores") return true;
  const san = await sancionDe(sancionId);
  return !!san && String(san.cursante_id) === u.id;
}

async function cargarSolicitud(idRaw: unknown) {
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) return null;
  const { data } = await sb.from("solicitudes_anulacion").select("*").eq("id", id).maybeSingle();
  return data;
}

async function nombreJefeDisciplina(): Promise<string> {
  const { data } = await sb
    .from("profesores")
    .select("grado, arma, nombre_completo, activo, es_auxiliar")
    .eq("rol", "jefe_disciplina")
    .limit(10);
  const filas: any[] = data || [];
  const p = filas.find((x) => x.activo !== false && x.es_auxiliar !== true) || filas[0];
  return p ? nombreConGrado(p) : "Jefe de Disciplina";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });
  if (req.method !== "POST") return err("Método no permitido", 405);

  let body: any = {};
  try { body = await req.json(); } catch { return err("Cuerpo inválido"); }

  if (body.accion === "ping") return ok({ funcion: "solicitudes-ops", version: VERSION });

  const u = await leerUsuario(body.token);
  if ("error" in u) return err(u.error, u.status);

  try {
    switch (body.accion) {
      // ─────────────────────────── SOLICITUDES ───────────────────────────
      case "crear": {
        const sancionId = txt(body.sancion_id, 120);
        if (!sancionId) return err("Falta la sanción.");
        const detalle = txt(body.detalle, 10000);
        if (!detalle) return err("Escribí el desarrollo de la solicitud.");
        const tipoIn = String(body.tipo_solicitud || "reconsideracion").toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const tipo = TIPOS.includes(tipoIn) ? tipoIn : "reconsideracion";
        let firma: string | null = null;
        if (body.firma !== undefined && body.firma !== null && body.firma !== "") {
          if (typeof body.firma !== "string" || body.firma.length > MAX_FIRMA ||
              !/^data:image\/(png|jpeg|webp);base64,/.test(body.firma)) {
            return err("La firma no es válida. Volvé a firmar.");
          }
          firma = body.firma;
        }

        const san = await sancionDe(sancionId);
        if (!san) return err("Sanción no encontrada.", 404);
        const esCur = u.tabla === "cursantes";
        if (esCur && String(san.cursante_id) !== u.id) {
          return err("Solo podés pedir la reconsideración de tus propias sanciones.", 403);
        }

        // Anti-duplicado: el mismo criterio que tenía la app.
        const { data: prev } = await sb
          .from("solicitudes_anulacion")
          .select("estado, creada_por, profesor_id, cursante_id")
          .eq("sancion_id", String(san.id))
          .limit(100);
        const pendientes = (prev || []).filter((x: any) => estadoDe(x) === "pendiente");
        if (esCur && pendientes.some((x: any) => String(x.cursante_id || "") === u.id)) {
          return err("Ya tenés una solicitud pendiente para esta sanción.", 409);
        }
        if (!esCur && pendientes.some((x: any) =>
          String(x.creada_por || "") === u.id || String(x.profesor_id || "") === u.id)) {
          return err("Ya hay una solicitud tuya sin resolver para esta sanción.", 409);
        }

        // Siempre entra pendiente y SIN elevar: la canaliza el Jefe de Disciplina.
        const fila: Record<string, unknown> = {
          sancion_id: String(san.id),
          cursante_id: san.cursante_id ?? null,
          estado: "pendiente",
          enviado_a_comandante: false,
          enviado_a_estudios: false,
          creada_por: u.id,
          origen: esCur ? "cursante" : "profesor",
          tipo_solicitud: tipo,
          fecha_creacion: new Date().toISOString(),
        };
        if (esCur) {
          fila.cursante_nombre = u.nombreGrado;
          fila.detalle_cursante = detalle;
          if (firma) fila.firma_cursante_solicitud = firma;
        } else {
          fila.profesor_id = u.id;
          fila.profesor_nombre = u.nombreGrado;
          fila.cursante_nombre = san.cursante_nombre ?? null;
          fila.detalle_profesor = detalle;
          if (firma) fila.firma_profesor_solicitud = firma;
        }
        const { data: ins, error } = await sb.from("solicitudes_anulacion").insert(fila).select("id").single();
        if (error) return err("No se pudo guardar la solicitud: " + error.message, 500);
        return ok({ id: ins?.id ?? null });
      }

      case "mias": {
        if (u.tabla !== "cursantes") return err("Solo para cursantes.", 403);
        const { data, error } = await sb
          .from("solicitudes_anulacion")
          .select("*")
          .eq("cursante_id", u.id)
          .order("fecha_creacion", { ascending: false })
          .limit(50);
        if (error) return err("No se pudieron leer tus solicitudes.", 500);
        // Solo las que presentó el cursante (no las que un profesor hizo sobre él).
        return ok({ solicitudes: (data || []).filter(esDelCursante).map(sinFirmas) });
      }

      case "por_sancion": {
        const sancionId = txt(body.sancion_id, 120);
        if (!sancionId) return err("Falta la sanción.");
        if (!(await esSancionDe(u, sancionId))) {
          return err("No podés ver las solicitudes de una sanción que no es tuya.", 403);
        }
        const { data, error } = await sb
          .from("solicitudes_anulacion")
          .select("*")
          .eq("sancion_id", sancionId)
          .order("fecha_creacion", { ascending: body.orden !== "desc" })
          .limit(100);
        if (error) return err("No se pudieron leer las solicitudes.", 500);
        return ok({ solicitudes: (data || []).map(sinFirmas) });
      }

      case "bandeja": {
        if (!veBandeja(u)) {
          return err("Solo el Jefe de Disciplina, el Comandante, el Jefe de Estudios y C&T ven las solicitudes.", 403);
        }
        const campos = body.resumen === true ? "id, estado, enviado_a_comandante, enviado_a_estudios" : "*";
        const { data, error } = await sb
          .from("solicitudes_anulacion")
          .select(campos)
          .order("fecha_creacion", { ascending: false })
          .limit(1000);
        if (error) return err("No se pudieron leer las solicitudes.", 500);
        let filas: any[] = data || [];
        // El Jefe de Disciplina y C&T ven todas (es el conducto por el que pasan);
        // el Comandante y el Jefe de Estudios, solo las que se les elevaron.
        if (!esCT(u) && !esDisc(u)) {
          filas = filas.filter((s) =>
            (esCmdte(u) && s.enviado_a_comandante) || (esEstudios(u) && s.enviado_a_estudios));
        }
        return ok({ solicitudes: filas });
      }

      case "elevar": {
        if (!esDisc(u) && !esCT(u)) return err("Solo el Jefe de Disciplina o C&T elevan solicitudes.", 403);
        const destino = String(body.destino || "");
        if (destino !== "comandante" && destino !== "estudios") return err("Destino inválido.");
        const s = await cargarSolicitud(body.id);
        if (!s) return err("Solicitud no encontrada.", 404);
        const bloq = bloqueoResolver(u, s);
        if (bloq) return err(bloq, 403);
        if (estadoDe(s) !== "pendiente") return err("La solicitud ya fue resuelta.", 409);
        const campo = destino === "comandante" ? "enviado_a_comandante" : "enviado_a_estudios";
        const { error } = await sb.from("solicitudes_anulacion").update({ [campo]: true }).eq("id", s.id);
        if (error) return err("No se pudo elevar la solicitud: " + error.message, 500);
        return ok();
      }

      case "resolver": {
        const PREFIJO: Record<string, string> = { anular: "ANULADA", rechazar: "RECHAZADA", modificar: "MODIFICAR" };
        const decision = String(body.decision || "");
        if (!PREFIJO[decision]) return err("Decisión inválida.");
        const razon = txt(body.razon, 2000);
        if (!razon || razon.length < 5) return err("El motivo debe tener al menos 5 caracteres.");
        const s = await cargarSolicitud(body.id);
        if (!s) return err("Solicitud no encontrada.", 404);
        const bloq = bloqueoResolver(u, s);
        if (bloq) return err(bloq, 403);
        if (estadoDe(s) !== "pendiente") return err("La solicitud ya fue resuelta.", 409);
        if (decision === "anular") {
          // La sanción la anula sanciones-ops (con su auditoría); acá solo se cierra
          // la solicitud, y no se asienta "ANULADA" sobre una sanción que no lo está.
          const san = await sancionDe(String(s.sancion_id || ""));
          if (!san || san.anulada !== true) return err("La sanción todavía no figura anulada.", 409);
        }
        const { error } = await sb.from("solicitudes_anulacion").update({
          estado: decision === "rechazar" ? "rechazado" : "aprobado",
          comentario_comandante: `${PREFIJO[decision]} por ${u.nombre}: ${razon}`,
          fecha_resolucion: new Date().toISOString(),
        }).eq("id", s.id);
        if (error) return err("No se pudo guardar la resolución: " + error.message, 500);
        return ok();
      }

      case "retomar": {
        if (!esDisc(u) && !esCT(u)) return err("Solo el Jefe de Disciplina o C&T.", 403);
        const s = await cargarSolicitud(body.id);
        if (!s) return err("Solicitud no encontrada.", 404);
        const bloq = bloqueoResolver(u, s);
        if (bloq) return err(bloq, 403);
        if (estadoDe(s) !== "pendiente") return err("La solicitud ya fue resuelta.", 409);
        const prev = s.comentario_comandante ? s.comentario_comandante + " · " : "";
        const { error } = await sb.from("solicitudes_anulacion").update({
          enviado_a_comandante: false,
          enviado_a_estudios: false,
          estado: "pendiente",
          comentario_comandante: `${prev}Canalizada por conducto regular (${u.nombre}, ${fechaBO()})`,
        }).eq("id", s.id);
        if (error) return err("No se pudo retomar la solicitud: " + error.message, 500);
        return ok();
      }

      case "devolver": {
        const s = await cargarSolicitud(body.id);
        if (!s) return err("Solicitud no encontrada.", 404);
        if (!esCT(u) && !(esCmdte(u) && s.enviado_a_comandante) && !(esEstudios(u) && s.enviado_a_estudios)) {
          return err("Solo quien recibió la solicitud elevada (o C&T) puede devolverla.", 403);
        }
        const bloq = bloqueoResolver(u, s);
        if (bloq) return err(bloq, 403);
        if (estadoDe(s) !== "pendiente") return err("La solicitud ya fue resuelta.", 409);
        const obs = txt(body.obs, 2000);
        const { error } = await sb.from("solicitudes_anulacion").update({
          enviado_a_comandante: false,
          enviado_a_estudios: false,
          estado: "pendiente",
          comentario_comandante: "Devuelta a " + (await nombreJefeDisciplina()) + (obs ? ": " + obs : ""),
        }).eq("id", s.id);
        if (error) return err("No se pudo devolver la solicitud: " + error.message, 500);
        return ok();
      }

      // ────────────────────────── HISTORIAL (sanciones_audit) ──────────────────────────
      case "historial": {
        const sancionId = txt(body.sancion_id, 120);
        if (!sancionId) return err("Falta la sanción.");
        if (!(await esSancionDe(u, sancionId))) {
          return err("No podés ver el historial de una sanción que no es tuya.", 403);
        }
        let q = sb.from("sanciones_audit").select(CAMPOS_HISTORIAL).eq("sancion_id", sancionId);
        // El historial OFICIAL oculta las acciones directas de C&T sin registro; C&T sí las ve.
        if (!esCT(u)) q = q.or("registro_generado.is.null,registro_generado.eq.true");
        const { data, error } = await q.order("creado_en", { ascending: body.orden !== "desc" }).limit(500);
        if (error) return err("No se pudo leer el historial.", 500);
        return ok({ historial: data || [] });
      }

      case "historial_editadas": {
        // Para la marca de sanción MODIFICADA: ids de sanciones con alguna edición.
        let q = sb.from("sanciones_audit").select("sancion_id").eq("accion", "editar");
        if (u.tabla === "cursantes") {
          const { data: mias } = await sb.from("sanciones").select("id").eq("cursante_id", u.id).limit(1000);
          const ids = (mias || []).map((m: any) => String(m.id));
          if (!ids.length) return ok({ ids: [] });
          q = q.in("sancion_id", ids);
        }
        const { data, error } = await q.limit(5000);
        if (error) return err("No se pudo leer el historial.", 500);
        return ok({ ids: [...new Set((data || []).map((r: any) => String(r.sancion_id)))] });
      }

      case "historial_recientes": {
        if (!esCT(u)) return err("Solo C&T.", 403);
        const minimo = Date.now() - 31 * 86400000;
        let desde = Date.parse(String(body.desde || ""));
        if (!Number.isFinite(desde)) desde = Date.now() - 7 * 86400000;
        desde = Math.max(desde, minimo);
        const { data, error } = await sb
          .from("sanciones_audit")
          .select("id, accion, realizado_por_nombre, creado_en")
          .gte("creado_en", new Date(desde).toISOString())
          .order("creado_en", { ascending: false })
          .limit(200);
        if (error) return err("No se pudo leer el historial.", 500);
        return ok({ historial: data || [] });
      }

      default:
        return err("Acción desconocida en solicitudes-ops: " + String(body.accion));
    }
  } catch (e) {
    console.error("solicitudes-ops", e);
    return err("Error interno: " + ((e as Error)?.message || String(e)), 500);
  }
});
