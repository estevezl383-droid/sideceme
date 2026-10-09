// ============================================================
// EDGE FUNCTION: planif-propuestas   (SIDECEME v2.9.419)
// Los jefes de seccion proponen actividades sobre la semana que armo
// Planificacion; el Jefe de Estudios las aprueba. NO escribe en
// planif_semanas.datos: las aprobadas se mezclan con la base en el cliente
// al dibujar el calendario y al generar el documento.
//
// Acciones: perfil / cargar / guardar / retirar / aprobar / rechazar /
//           fijar_cierre / historial
//
// v2.9.375: propone CUALQUIER profesor activo, con justificacion escrita.
// v2.9.377: `mueve` permite ARRASTRAR una fila del horario base a otro dia u hora.
// v2.9.382: `puede_mover` (Baptista, Montecinos, Morales, Villarroel, Arce) deja
// mover y estirar CUALQUIER actividad, no solo la propia.
// v2.9.386: esos mismos NO tienen que justificar cada cambio (el `motivo` es
// opcional para ellos); igual queda registrado quien lo hizo en
// `actualizado_por` y en planif_propuestas_log.
// v2.9.387: se puede programar CON ANTELACION. Si Planificacion todavia no creo
// esa semana, la propuesta queda con semana_id NULL y se engancha sola cuando la
// semana se crea (trigger trg_planif_enganchar). Todo se resuelve por `fecha`.
// v2.9.419: puede_mover queda reservado a Morales, Villarroel y Arce (tabla
// planif_editores). Se normalizan textos a MAYUSCULAS y se admite ocultar_base para quitar
// una fila gris del horario mediante propuesta auditable.
// v2.9.422: Jefe de Estudios puede corregir y aprobar propuestas ajenas;
// avisos privados al solicitante basados en el historial.
// v2.9.423: puede_aprobar habilita también mover, editor base y retiro ajeno.
//
// Valida token en 'sesiones'. JWT: OFF.
// El trigger planif_prop_guard repite el control del cierre en la base.
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
const ok = (extra?: object) =>
  new Response(JSON.stringify({ ok: true, ...extra }), { status: 200, headers: corsHeaders });
const err = (msg: string, status = 400) =>
  new Response(JSON.stringify({ ok: false, error: msg }), { status, headers: corsHeaders });

const ROLES_PLANIF = ["jefe_planificacion", "ciencia_tecnologia"];
const AUDIENCIAS = ["planta", "c1", "c2"];
const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const COLS_SEM = "id,gestion,semana_num,fecha_desde,fecha_hasta,periodo,estado,prop_cierre,lugar_fecha,ns_correlativo";

type Perfil = {
  id: string; nombre: string; seccion: string | null;
  proponer: boolean; aprobar: boolean; planif: boolean;
  cierre: boolean; efm: boolean; veTodo: boolean; mover: boolean;
};

// Seccion por defecto de quien no tiene fila en planif_editores: sale de su rol.
const SECCION_POR_ROL: Record<string, string> = {
  comandante: "COMANDO",
  jefe_estudios: "JEFATURA DE ESTUDIOS",
  jefe_sac: "SAC",
  jefe_planificacion: "PLANIFICACION",
  ciencia_tecnologia: "CIENCIA Y TECNOLOGIA",
  evaluaciones: "SUB SECCION EVALUACIONES",
  jefe_disciplina: "SUB SECCION DISCIPLINA",
  jefe_curso: "JEFATURA DE CURSO",
  sub_ef: "SUB SECCION EFM. Y DEPORTES",
  protocolo: "PROTOCOLO",
  profesor: "PLANTEL DOCENTE",
};

async function validar(token: string): Promise<Perfil | null> {
  const { data: ses } = await sb.from("sesiones")
    .select("usuario_id, usuario_tabla, expira_en, revocado").eq("token", token).limit(1);
  if (!ses || !ses.length) return null;
  const s = ses[0];
  if (s.revocado || new Date(s.expira_en) < new Date() || s.usuario_tabla !== "profesores") return null;
  const { data: prof } = await sb.from("profesores")
    .select("id, rol, roles, grado, nombre_completo, activo").eq("id", s.usuario_id).limit(1);
  if (!prof || !prof.length || prof[0].activo === false) return null;
  const p = prof[0];
  const todos = [p.rol].concat(Array.isArray(p.roles) ? p.roles : [])
    .map((r: string) => String(r || "").toLowerCase());
  const planif = todos.some((r: string) => ROLES_PLANIF.includes(r));
  const { data: ed } = await sb.from("planif_editores")
    .select("seccion, puede_proponer, puede_aprobar, puede_cierre, puede_efm, ve_todo, puede_mover, activo")
    .eq("profesor_id", p.id).limit(1);
  const e = ed && ed.length && ed[0].activo ? ed[0] : null;
  const propone = e ? !!e.puede_proponer : true;
  const rolSec = SECCION_POR_ROL[String(p.rol || "").toLowerCase()] || null;
  return {
    id: p.id,
    nombre: [p.grado, p.nombre_completo].filter(Boolean).join(" ").trim(),
    seccion: (e && e.seccion) || rolSec,
    proponer: propone,
    aprobar: !!(e && e.puede_aprobar),
    planif,
    cierre: !!(e && e.puede_cierre) || planif,
    efm: !!(e && e.puede_efm) || !!(e && e.puede_aprobar),
    veTodo: !!(e && e.ve_todo) || planif || !!(e && e.puede_aprobar),
    // El Jefe de Estudios también reacomoda y retira el horario base.
    mover: !!(e && (e.puede_mover || e.puede_aprobar)),
  };
}

// Cierre efectivo (misma regla que planif_cierre en la base).
function cierreDe(sem: any): string {
  if (sem.prop_cierre) return new Date(sem.prop_cierre).toISOString();
  const d = new Date(sem.fecha_desde + "T23:59:00-04:00");
  d.setUTCDate(d.getUTCDate() - 5);
  return d.toISOString();
}
const abierta = (sem: any) => Date.now() < new Date(cierreDe(sem)).getTime();
const conCierre = (sem: any) => ({ ...sem, cierre: cierreDe(sem), abierta: abierta(sem) });

async function semanaDeFecha(fecha: string) {
  const { data } = await sb.from("planif_semanas").select(COLS_SEM)
    .eq("activo", true).lte("fecha_desde", fecha).gte("fecha_hasta", fecha).limit(1);
  return data && data.length ? data[0] : null;
}
async function semanaPorId(id: number) {
  const { data } = await sb.from("planif_semanas").select(COLS_SEM)
    .eq("id", id).eq("activo", true).limit(1);
  return data && data.length ? data[0] : null;
}
async function propuesta(id: number) {
  const { data } = await sb.from("planif_propuestas").select("*").eq("id", id).limit(1);
  return data && data.length ? data[0] : null;
}
async function log(pid: number, u: Perfil, accion: string, antes: any, despues: any) {
  await sb.from("planif_propuestas_log").insert({
    propuesta_id: pid, usuario_id: u.id, usuario_nombre: u.nombre, accion, antes, despues,
  });
}
async function actualizar(prev: any, cambios: any, u: Perfil, accion: string) {
  const fila = { ...cambios, actualizado_por: u.id, actualizado_por_nombre: u.nombre, version: prev.version + 1 };
  const { data, error } = await sb.from("planif_propuestas").update(fila)
    .eq("id", prev.id).eq("version", prev.version).select("*");
  if (error) return { error: traducir(error.message) };
  if (!data || !data.length) return { error: "Otro usuario modificó esta actividad recién. Recargá el calendario.", status: 409 };
  await log(prev.id, u, accion, prev, data[0]);
  return { fila: data[0] };
}
function traducir(m: string): string {
  if (/CERRADO/.test(m)) return "La semana ya está cerrada para las secciones. Solo el Jefe de Estudios puede cambiarla.";
  if (/SOLO_APRUEBA/.test(m)) return "Solo el Jefe de Estudios aprueba.";
  if (/chk_prop_horas/.test(m)) return "La hora de fin tiene que ser posterior a la de inicio.";
  return m;
}
const txt = (v: any, max = 400) => (v === undefined || v === null) ? null : String(v).trim().slice(0, max);
const may = (v: any, max = 400) => {
  const t = txt(v, max);
  return t === null ? null : t.toLocaleUpperCase("es-BO");
};

function limpiarMueve(v: any): any {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "object") return "Dato de mudanza invalido";
  const fecha = String(v.fecha || ""), d = String(v.desde || ""), h = String(v.hasta || "");
  const t = may(v.texto, 600);
  if (!RE_FECHA.test(fecha)) return "La fila que se mueve no tiene fecha valida";
  if (!RE_HORA.test(d) || !RE_HORA.test(h)) return "La fila que se mueve no tiene horas validas";
  if (!t) return "La fila que se mueve no tiene texto";
  return { fecha, desde: d, hasta: h, texto: t };
}
const esEfm = (t: string) => /ENTRENAMIENTO\s+F[IÍ]SICO/i.test(String(t || ""));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Metodo no permitido", 405);
  let body: any;
  try { body = await req.json(); } catch { return err("JSON invalido"); }
  const { accion, token } = body;
  if (!token) return err("Token requerido");
  const u = await validar(token);
  if (!u) return err("No autorizado", 403);

  if (accion === "perfil") return ok({ perfil: u });

  // Avisos exclusivos del solicitante, derivados del historial auditado.
  // No se confía en un ID de destinatario enviado por el cliente.
  if (accion === "avisos") {
    const { data: propias, error: ep } = await sb.from("planif_propuestas")
      .select("*").eq("creado_por", u.id).neq("estado", "retirada");
    if (ep) return err(ep.message, 500);
    if (!propias?.length) return ok({ avisos: [] });
    const desde = new Date(Date.now() - 30 * 86400e3).toISOString();
    const { data: registros, error: el } = await sb.from("planif_propuestas_log")
      .select("id,propuesta_id,usuario_id,usuario_nombre,accion,antes,despues,en")
      .in("propuesta_id", propias.map((p: any) => p.id))
      .neq("usuario_id", u.id).gte("en", desde)
      .in("accion", ["aprobar", "rechazar", "modificar"])
      .order("en", { ascending: false }).limit(200);
    if (el) return err(el.message, 500);
    const avisos = (registros || []).filter((r: any) =>
      r.despues?.creado_por === u.id &&
      ["aprobada", "rechazada"].includes(r.despues?.estado)
    ).map((r: any) => ({
      id: r.id, en: r.en, accion: r.accion, autoridad: r.usuario_nombre,
      antes: r.antes, despues: r.despues,
      propuesta: propias.find((p: any) => p.id === r.propuesta_id),
    }));
    return ok({ avisos });
  }

  if (accion === "cargar") {
    const { desde, hasta, con_base } = body;
    if (!RE_FECHA.test(desde || "") || !RE_FECHA.test(hasta || "")) return err("Rango invalido");
    const cols = con_base ? COLS_SEM + ",datos" : COLS_SEM;
    const { data: sems, error: e1 } = await sb.from("planif_semanas").select(cols)
      .eq("activo", true).lte("fecha_desde", hasta).gte("fecha_hasta", desde)
      .order("fecha_desde").limit(8);
    if (e1) return err(e1.message, 500);
    const semanas = (sems || []).map((s: any) => {
      const out = conCierre(s);
      if (con_base && s.datos) {
        out.datos = { cab: s.datos.cab || {}, planta: s.datos.planta || null, c1: s.datos.c1 || null, c2: s.datos.c2 || null };
      }
      return out;
    });
    const { data: props, error: e2 } = await sb.from("planif_propuestas").select("*")
      .gte("fecha", desde).lte("fecha", hasta).neq("estado", "retirada")
      .order("fecha").order("desde");
    if (e2) return err(e2.message, 500);
    return ok({ perfil: u, semanas, propuestas: props || [] });
  }

  if (accion === "guardar") {
    const c = body.campos || {};
    const cambios: any = {};
    if (c.fecha !== undefined) { if (!RE_FECHA.test(c.fecha)) return err("Fecha invalida"); cambios.fecha = c.fecha; }
    if (c.desde !== undefined) { if (!RE_HORA.test(c.desde)) return err("Hora de inicio invalida"); cambios.desde = c.desde; }
    if (c.hasta !== undefined) { if (!RE_HORA.test(c.hasta)) return err("Hora de fin invalida"); cambios.hasta = c.hasta; }
    if (c.actividad !== undefined) {
      cambios.actividad = may(c.actividad, 600);
      if (!cambios.actividad) return err("Escribí la actividad");
    }
    for (const k of ["lugar", "responsable", "asisten", "uniforme"]) if (c[k] !== undefined) cambios[k] = may(c[k]);
    const sinJustificar = u.aprobar || u.mover;
    if (c.motivo !== undefined) {
      cambios.motivo = may(c.motivo, 800);
      if (!cambios.motivo) {
        if (!sinJustificar) {
          return err("Escribí por qué se altera el horario. El Jefe de Estudios lo lee antes de aprobar.");
        }
        cambios.motivo = null;
      } else if (cambios.motivo.length < 10 && !sinJustificar) {
        return err("Escribí por qué se altera el horario (al menos 10 caracteres). El Jefe de Estudios lo lee antes de aprobar.");
      }
    }
    if (c.tipo !== undefined) {
      const t = String(c.tipo || "normal");
      if (t !== "normal" && t !== "efm") return err("Tipo invalido");
      if (t === "efm" && !u.efm) {
        return err("El Entrenamiento Físico solo lo mueven los encargados de EFM. y Deportes o el Jefe de Estudios.", 403);
      }
      cambios.tipo = t;
    }
    if (c.mueve !== undefined) {
      const m = limpiarMueve(c.mueve);
      if (typeof m === "string") return err(m);
      if (m && !u.mover && !u.aprobar && !(esEfm(m.texto) && u.efm)) {
        return err("Solo los usuarios autorizados pueden reacomodar filas del horario base.", 403);
      }
      if (m && esEfm(m.texto) && !u.efm) {
        return err("El Entrenamiento Físico solo lo mueven los encargados de EFM. y Deportes.", 403);
      }
      cambios.mueve = m;
      if (m && esEfm(m.texto) && cambios.tipo === undefined) cambios.tipo = "efm";
    }
    if (c.ocultar_base !== undefined) {
      if (!u.mover) return err("Solo los usuarios autorizados pueden quitar filas del horario base.", 403);
      cambios.ocultar_base = !!c.ocultar_base;
    }
    if (c.audiencias !== undefined) {
      const a = Array.isArray(c.audiencias) ? c.audiencias.filter((x: string) => AUDIENCIAS.includes(x)) : [];
      if (!a.length) return err("Marcá a quién aplica (plantel, 1er ciclo o 2do ciclo)");
      cambios.audiencias = Array.from(new Set(a));
    }
    if (c.recortar !== undefined) cambios.recortar = !!c.recortar;

    if (!body.id) {
      // --- crear ---
      if (!u.proponer) return err("Tu acceso es solo de consulta", 403);
      for (const k of ["fecha", "desde", "hasta", "actividad", "audiencias"]) {
        if (cambios[k] === undefined) return err("Falta " + k);
      }
      if (cambios.ocultar_base && !cambios.mueve) return err("Para quitar una fila base hay que identificar la fila de origen.");
      if (cambios.motivo === undefined && !sinJustificar) {
        return err("Escribí por qué se altera el horario. El Jefe de Estudios lo lee antes de aprobar.");
      }
      if (cambios.hasta <= cambios.desde) return err("La hora de fin tiene que ser posterior a la de inicio.");
      const sem = await semanaDeFecha(cambios.fecha);
      if (sem) {
        if (!u.aprobar && !u.mover && !abierta(sem)) return err("La semana " + sem.semana_num + " ya está cerrada para las secciones.", 403);
      } else {
        // v2.9.387: programar con antelacion. Sin semana creada no hay plazo que
        // vencer; lo unico que no se admite es programar hacia atras.
        const hoy = new Date(Date.now() - 4 * 3600e3).toISOString().slice(0, 10);
        if (cambios.fecha < hoy) {
          return err("Esa fecha ya pasó y Planificación no tiene creada esa semana.");
        }
      }
      const fila: any = {
        ...cambios, semana_id: sem ? sem.id : null, seccion: u.seccion,
        creado_por: u.id, creado_por_nombre: u.nombre,
        actualizado_por: u.id, actualizado_por_nombre: u.nombre,
        estado: (u.aprobar || u.mover) ? "aprobada" : "pendiente",
      };
      if (u.aprobar || u.mover) { fila.aprobado_por = u.id; fila.aprobado_por_nombre = u.nombre; fila.aprobado_en = new Date().toISOString(); }
      const { data, error } = await sb.from("planif_propuestas").insert(fila).select("*");
      if (error) return err(traducir(error.message));
      await log(data![0].id, u, "crear", null, data![0]);
      return ok({ propuesta: data![0] });
    }

    // --- modificar ---
    const prev = await propuesta(Number(body.id));
    if (!prev || prev.estado === "retirada") return err("La actividad ya no existe", 404);
    if (Number(body.version) !== prev.version) return err("Otro usuario modificó esta actividad recién. Recargá el calendario.", 409);
    const semPrev = prev.semana_id === null ? null : await semanaPorId(prev.semana_id);
    if (!u.mover && !u.aprobar) {
      if (!u.proponer || prev.creado_por !== u.id) return err("Solo podés modificar las actividades de tu sección", 403);
      // Si todavia no hay semana creada (programada con antelacion) no hay plazo.
      if (prev.semana_id !== null && (!semPrev || !abierta(semPrev))) {
        return err("La semana ya está cerrada para las secciones.", 403);
      }
    }
    if (cambios.motivo === undefined && !sinJustificar) {
      return err("Escribí por qué se cambia. Cada modificación lleva su justificación.");
    }
    const fecha = cambios.fecha || prev.fecha;
    const d = cambios.desde || prev.desde, h = cambios.hasta || prev.hasta;
    if (h <= d) return err("La hora de fin tiene que ser posterior a la de inicio.");
    if (fecha !== prev.fecha) {
      const semNueva = await semanaDeFecha(fecha);
      if (semNueva && !u.mover && !u.aprobar && !abierta(semNueva)) {
        return err("La semana " + semNueva.semana_num + " ya está cerrada para las secciones.", 403);
      }
      cambios.semana_id = semNueva ? semNueva.id : null;
    }
    if (u.mover || u.aprobar) {
      Object.assign(cambios, { estado: "aprobada", aprobado_por: u.id, aprobado_por_nombre: u.nombre, aprobado_en: new Date().toISOString(), motivo_rechazo: null });
    } else if (!u.aprobar && prev.estado !== "pendiente") {
      Object.assign(cambios, { estado: "pendiente", aprobado_por: null, aprobado_por_nombre: null, aprobado_en: null, motivo_rechazo: null });
    }
    const r = await actualizar(prev, cambios, u, "modificar");
    if (r.error) return err(r.error, r.status || 400);
    return ok({ propuesta: r.fila });
  }

  if (accion === "retirar" || accion === "aprobar" || accion === "rechazar") {
    const prev = await propuesta(Number(body.id));
    if (!prev || prev.estado === "retirada") return err("La actividad ya no existe", 404);
    if (Number(body.version) !== prev.version) return err("Otro usuario modificó esta actividad recién. Recargá el calendario.", 409);
    let cambios: any;
    if (accion === "retirar") {
      if (!u.mover) {
        if (prev.creado_por !== u.id) return err("Solo podés retirar las actividades de tu sección", 403);
        if (prev.semana_id !== null) {
          const sem = await semanaPorId(prev.semana_id);
          if (!sem || !abierta(sem)) return err("La semana ya está cerrada para las secciones.", 403);
        }
      }
      cambios = { estado: "retirada" };
    } else {
      if (!u.aprobar) return err("Solo el Jefe de Estudios aprueba o rechaza", 403);
      if (accion === "aprobar") {
        cambios = { estado: "aprobada", aprobado_por: u.id, aprobado_por_nombre: u.nombre, aprobado_en: new Date().toISOString(), motivo_rechazo: null };
      } else {
        const motivo = may(body.motivo, 500);
        if (!motivo || motivo.length < 3) return err("Escribí el motivo del rechazo");
        cambios = { estado: "rechazada", motivo_rechazo: motivo, aprobado_por: null, aprobado_por_nombre: null, aprobado_en: null };
      }
    }
    const r = await actualizar(prev, cambios, u, accion);
    if (r.error) return err(r.error, r.status || 400);
    return ok({ propuesta: r.fila });
  }

  if (accion === "fijar_cierre") {
    if (!u.cierre) return err("No tenés permiso para correr el plazo de esta semana.", 403);
    const sem = await semanaPorId(Number(body.semana_id));
    if (!sem) return err("Semana no encontrada", 404);
    let valor: string | null = null;
    if (body.cierre) {
      const t = new Date(body.cierre);
      if (isNaN(t.getTime())) return err("Fecha de cierre invalida");
      valor = t.toISOString();
    }
    const { data, error } = await sb.from("planif_semanas").update({ prop_cierre: valor })
      .eq("id", sem.id).select(COLS_SEM);
    if (error) return err(error.message, 500);
    return ok({ semana: conCierre(data![0]) });
  }

  if (accion === "historial") {
    const { data, error } = await sb.from("planif_propuestas_log")
      .select("accion, usuario_nombre, antes, despues, en")
      .eq("propuesta_id", Number(body.id)).order("en", { ascending: true }).limit(100);
    if (error) return err(error.message, 500);
    return ok({ historial: data || [] });
  }

  return err("Accion desconocida");
});
