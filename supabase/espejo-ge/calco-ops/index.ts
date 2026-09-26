// ============================================================
// EDGE FUNCTION: calco-ops   (v5 — el espejo de Google Earth en su tabla)
//
// Guarda y lee los trabajos del Generador de Calcos. Separada de
// `calcos-datos` a proposito: aquella sirve mapas, esta administra
// trabajos.
//
// El cursante ve SOLO el trabajo de su grupo. El profesor ve todo, y
// ADEMAS tiene trabajos PERSONALES propios: el cuerpo docente usa el
// Generador para PREPARAR los ejercicios, y no pertenece a ningun
// Estado Mayor.
//
// v5 (26-sep-2026) — EL ESPEJO SE BORRABA SOLO.
// 'espejo_publicar' guardaba las capas de Google Earth dentro del payload
// del trabajo, y 'guardar' (el autoguardado, cada 2,5 s) reescribe el
// payload entero sin esa clave: el espejo quedaba vacio a los segundos, o
// con una capa en el lugar de otra. Ahora cada capa es una fila de
// `calco_espejo_partes` y el autoguardado ni la toca.
//
// v4 (6-sep-2026) — ANTES EL DOCENTE TENIA UNO SOLO.
// Un indice unico (creado_por) permitia un unico trabajo personal, asi que
// cada "ejercicio nuevo" pisaba al anterior y al abrir salia siempre el
// ultimo. Sergio: "cuando quiero abrir solo me sale el ultimo ejercicio y
// necesito que se guarden todos, al mismo estilo que lo hace Office".
// Se borro ese indice y se agregaron las acciones de la lista.
// Los trabajos de GRUPO siguen siendo UNO por Estado Mayor: un EM entrega
// un trabajo, no diez (indice calcos_grupo_ejercicio_uk, intacto).
//
// Acciones del cursante (y del docente sobre su trabajo personal):
//   - 'mi_calco'  : mi trabajo (el mas reciente; lo crea si no hay ninguno)
//   - 'guardar'   : graba el estado actual
//   - 'entregar'  : lo marca como entregado y deja version
//   - 'espejo'    : direccion del espejo en vivo de Google Earth
//   - 'espejo_publicar' : deja los KML que Google Earth va a leer
//
// Acciones del docente sobre SUS ejercicios (v4):
//   - 'mis_calcos' / 'crear_mio' / 'abrir_mio' / 'renombrar_mio' / 'borrar_mio'
//
// Acciones del profesor / C&T:
//   - 'listar'    : todos los trabajos de un ejercicio
//   - 'abrir'     : un trabajo puntual
//   - 'calificar' : nota y observaciones
//   - 'historial' : versiones guardadas de un trabajo
//
// Auth: token de sesion de SIDECEME. JWT: OFF. Usa service_role;
// las tablas calcos/calco_versiones/calco_espejo_partes no tienen politicas.
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

// Ven todos los trabajos y califican.
const DOCENTES_QUE_VEN_TODO = ["ciencia_tecnologia", "comandante", "jefe_estudios", "estudios", "profesor"];

// Cada cuanto se deja una instantanea en el historial. El autoguardado
// del Generador corre cada 2,5 s: sin este espaciado, 22 grupos dejarian
// cientos de miles de filas por dia.
const MINUTOS_ENTRE_VERSIONES = 10;

// La clave de una capa del espejo: su nombre en minusculas, sin acentos.
// Es lo que va en el enlace de Google Earth, asi que NO depende del orden:
// si aparece una capa nueva, las demas siguen en su mismo enlace.
// (La migracion 001_espejo_partes.sql usa la misma regla.)
const claveDe = (nombre: string) =>
  String(nombre || "capa").toLowerCase()
    .replace(/[áéíóúüñ]/g, (c) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n" }[c] as string))
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "capa";

type Sesion = { id: string; tabla: "cursantes" | "profesores"; rol: string; nombre: string };

async function validarSesion(token: string): Promise<Sesion | null> {
  const { data: ses } = await sb.from("sesiones")
    .select("usuario_id, usuario_tabla, expira_en, revocado")
    .eq("token", token).limit(1);
  if (!ses || !ses.length) return null;
  const s = ses[0];
  if (s.revocado || new Date(s.expira_en) < new Date()) return null;

  if (s.usuario_tabla === "profesores") {
    const { data: p } = await sb.from("profesores")
      .select("nombre_completo, rol, activo").eq("id", s.usuario_id).limit(1);
    if (!p || !p.length || p[0].activo === false) return null;
    return { id: s.usuario_id, tabla: "profesores", rol: p[0].rol || "", nombre: p[0].nombre_completo || "" };
  }
  if (s.usuario_tabla === "cursantes") {
    const { data: c } = await sb.from("cursantes")
      .select("nombre_completo, activo").eq("id", s.usuario_id).limit(1);
    if (!c || !c.length || c[0].activo === false) return null;
    return { id: s.usuario_id, tabla: "cursantes", rol: "", nombre: c[0].nombre_completo || "" };
  }
  return null;
}

const esDocente = (s: Sesion) => s.tabla === "profesores" && DOCENTES_QUE_VEN_TODO.includes(s.rol);

// El grupo (Estado Mayor) al que pertenece este cursante, dentro de un
// ejercicio activo. Es lo que decide que trabajo puede tocar.
async function miGrupo(cursanteId: string, ejercicioId?: string) {
  const { data } = await sb.from("ejercicio_miembros")
    .select("grupo_id, cargo, ejercicio_grupos!inner(id, nombre, bando, ejercicio_id, activo)")
    .eq("cursante_id", cursanteId).eq("activo", true);
  if (!data || !data.length) return null;
  const filas = data.filter((m: any) =>
    m.ejercicio_grupos?.activo && (!ejercicioId || m.ejercicio_grupos.ejercicio_id === ejercicioId));
  if (!filas.length) return null;
  const g = filas[0];
  return {
    grupo_id: g.grupo_id,
    nombre: g.ejercicio_grupos.nombre,
    bando: g.ejercicio_grupos.bando,
    ejercicio_id: g.ejercicio_grupos.ejercicio_id,
    cargo: g.cargo,
  };
}

// ------------------------------------------------------------
// Los trabajos PERSONALES de un docente: sin grupo y sin ejercicio.
// Desde la v4 puede tener VARIOS, asi que se devuelven ORDENADOS y
// `mi_calco` toma el mas reciente. Con el indice unico viejo esto no
// hacia falta; ahora si: sin `order`, cual volvia era imprevisible.
// ------------------------------------------------------------
async function calcosPersonales(creadoPor: string) {
  const { data } = await sb.from("calcos").select("*")
    .eq("creado_por", creadoPor).is("grupo_id", null).is("ejercicio_id", null)
    .order("actualizado_en", { ascending: false }).limit(200);
  return data || [];
}

async function calcoPersonal(ses: Sesion) {
  const ya = await calcosPersonales(ses.id);
  if (ya.length) return { calco: ya[0], nuevo: false, error: null as string | null };

  const { data: nuevo, error } = await sb.from("calcos").insert({
    ejercicio_id: null, grupo_id: null, creado_por: ses.id,
    nombre: `Planeamiento - ${ses.nombre || "docente"}`, payload: {},
  }).select("*").limit(1);
  if (error) return { calco: null, nuevo: false, error: error.message };
  return { calco: nuevo?.[0] || null, nuevo: true, error: null };
}

// Se puede guardar ahora? Las fechas son opcionales: nulo = sin limite.
// Un trabajo personal de docente no cuelga de ningun ejercicio: no vence.
async function ventanaAbierta(ejercicioId: string | null): Promise<string | null> {
  if (!ejercicioId) return null;
  const { data } = await sb.from("ejercicios")
    .select("nombre, estado, fecha_inicio, fecha_fin").eq("id", ejercicioId).limit(1);
  if (!data || !data.length) return "El ejercicio no existe";
  const e = data[0];
  if (e.estado === "cerrado") return "El ejercicio esta cerrado";
  const ahora = new Date();
  if (e.fecha_inicio && ahora < new Date(e.fecha_inicio))
    return `El ejercicio todavia no comenzo (abre el ${new Date(e.fecha_inicio).toLocaleString("es-BO")})`;
  if (e.fecha_fin && ahora > new Date(e.fecha_fin))
    return `El plazo del ejercicio vencio el ${new Date(e.fecha_fin).toLocaleString("es-BO")}`;
  return null;
}

// Deja una instantanea solo si paso el tiempo minimo, o si es entrega.
async function quizasVersionar(calcoId: string, payload: unknown, quien: string, motivo: string) {
  if (motivo === "auto") {
    const { data } = await sb.from("calco_versiones")
      .select("creado_en").eq("calco_id", calcoId)
      .order("creado_en", { ascending: false }).limit(1);
    if (data && data.length) {
      const min = (Date.now() - new Date(data[0].creado_en).getTime()) / 60000;
      if (min < MINUTOS_ENTRE_VERSIONES) return;
    }
  }
  const texto = JSON.stringify(payload ?? {});
  await sb.from("calco_versiones").insert({
    calco_id: calcoId, payload, bytes: texto.length, guardado_por: quien, motivo,
  });
}

// Este usuario puede tocar este trabajo? El docente, los suyos personales y
// los de los grupos; el cursante, solo el de su Estado Mayor.
async function puedeTocar(ses: Sesion, calco: any, ejercicioId?: string): Promise<string | null> {
  if (esDocente(ses)) {
    // Un trabajo personal es de quien lo creo, aunque el otro sea docente.
    if (!calco.grupo_id && calco.creado_por && calco.creado_por !== ses.id)
      return "Ese trabajo personal es de otro docente.";
    return null;
  }
  const g = await miGrupo(ses.id, ejercicioId);
  if (!g) return "No estas asignado a ningun Estado Mayor en un ejercicio activo.";
  if (calco.grupo_id !== g.grupo_id) return "Ese trabajo es de otro Estado Mayor.";
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Metodo no permitido", 405);

  let body: any;
  try { body = await req.json(); } catch { return err("JSON invalido"); }

  const { accion, token } = body;
  if (!token) return err("Token requerido");
  const ses = await validarSesion(token);
  if (!ses) return err("Sesion no valida. Volve a entrar.", 403);

  // ================= MI TRABAJO =================
  if (accion === "mi_calco") {
    // El cuerpo docente prepara los ejercicios: trabajo personal propio.
    if (esDocente(ses)) {
      const r = await calcoPersonal(ses);
      if (r.error) return err(r.error, 500);
      return ok({ calco: r.calco, personal: true, nuevo: r.nuevo });
    }

    const g = await miGrupo(ses.id, body.ejercicio_id);
    if (!g) return err("No estas asignado a ningun Estado Mayor en un ejercicio activo.", 403);

    const { data: ya } = await sb.from("calcos").select("*")
      .eq("ejercicio_id", g.ejercicio_id).eq("grupo_id", g.grupo_id).limit(1);
    if (ya && ya.length) return ok({ calco: ya[0], grupo: g });

    const { data: nuevo, error } = await sb.from("calcos").insert({
      ejercicio_id: g.ejercicio_id, grupo_id: g.grupo_id, creado_por: ses.id,
      nombre: g.nombre || "Planeamiento", payload: {},
    }).select("*").limit(1);
    if (error) return err(error.message, 500);
    return ok({ calco: nuevo?.[0] || null, grupo: g, nuevo: true });
  }

  // ============ MIS EJERCICIOS (varios, solo docentes) ============
  // El cuerpo docente PREPARA ejercicios, y prepara muchos. Antes tenia uno
  // solo y cada "nuevo" pisaba al anterior. Los trabajos de GRUPO siguen
  // siendo uno por Estado Mayor: un EM entrega un trabajo, no diez.
  if (accion === "mis_calcos" || accion === "crear_mio" || accion === "abrir_mio"
      || accion === "renombrar_mio" || accion === "borrar_mio") {
    if (!esDocente(ses)) {
      return err("El trabajo de tu Estado Mayor es uno solo: se guarda y se abre desde 'mi_calco'.", 403);
    }

    if (accion === "mis_calcos") {
      const filas = await calcosPersonales(ses.id);
      return ok({
        calcos: filas.map((c: any) => ({
          id: c.id, nombre: c.nombre, pais: c.pais, estado: c.estado,
          creado_en: c.creado_en, actualizado_en: c.actualizado_en,
          bytes: JSON.stringify(c.payload ?? {}).length,
        })),
      });
    }

    if (accion === "crear_mio") {
      const nombre = String(body.nombre || "").trim();
      if (!nombre) return err("Ponele un nombre al ejercicio");
      const ya = await calcosPersonales(ses.id);
      if (ya.some((c: any) => (c.nombre || "").toLowerCase() === nombre.toLowerCase()))
        return err("Ya tenes un ejercicio con ese nombre.");
      // `desde_id` duplica: es el "Guardar como" de toda la vida.
      let payload: unknown = {};
      let pais = body.pais || null;
      if (body.desde_id) {
        const base = ya.find((c: any) => c.id === body.desde_id);
        if (!base) return err("El ejercicio que queres duplicar no es tuyo o no existe.", 403);
        payload = base.payload ?? {};
        pais = pais || base.pais;
      }
      const { data, error } = await sb.from("calcos").insert({
        ejercicio_id: null, grupo_id: null, creado_por: ses.id,
        nombre, pais, payload,
      }).select("*").limit(1);
      if (error) return err(error.message, 500);
      return ok({ calco: data?.[0] || null, nuevo: true });
    }

    // De aca para abajo, todas necesitan un id y que sea SUYO.
    if (!body.calco_id) return err("Falta calco_id");
    const { data: filas } = await sb.from("calcos").select("*").eq("id", body.calco_id).limit(1);
    if (!filas || !filas.length) return err("El ejercicio no existe", 404);
    const calco = filas[0];
    if (calco.grupo_id || calco.ejercicio_id)
      return err("Ese es el trabajo de un Estado Mayor, no un ejercicio tuyo.", 403);
    if (calco.creado_por !== ses.id)
      return err("Ese ejercicio es de otro docente.", 403);

    if (accion === "abrir_mio") return ok({ calco });

    if (accion === "renombrar_mio") {
      const nombre = String(body.nombre || "").trim();
      if (!nombre) return err("Ponele un nombre");
      const { error } = await sb.from("calcos").update({
        nombre, actualizado_en: new Date().toISOString(), actualizado_por: ses.nombre,
      }).eq("id", calco.id);
      if (error) return err(error.message, 500);
      return ok();
    }

    if (accion === "borrar_mio") {
      await sb.from("calco_versiones").delete().eq("calco_id", calco.id);
      const { error } = await sb.from("calcos").delete().eq("id", calco.id);
      if (error) return err(error.message, 500);
      return ok({ borrado: calco.nombre });
    }
  }

  if (accion === "guardar" || accion === "entregar") {
    const esEntrega = accion === "entregar";

    const { data: filas } = await sb.from("calcos").select("*").eq("id", body.calco_id).limit(1);
    if (!filas || !filas.length) return err("El trabajo no existe", 404);
    const calco = filas[0];

    const veto = await puedeTocar(ses, calco, body.ejercicio_id);
    if (veto) return err(veto, 403);

    const cerrado = await ventanaAbierta(calco.ejercicio_id);
    if (cerrado) return err(cerrado, 403);
    if (calco.estado === "calificado")
      return err("El trabajo ya fue calificado y no admite cambios.", 403);

    const payload = body.payload ?? {};
    const { error } = await sb.from("calcos").update({
      payload,
      pais: body.pais || calco.pais,
      nombre: body.nombre || calco.nombre,
      estado: esEntrega ? "entregado" : calco.estado,
      entregado_en: esEntrega ? new Date().toISOString() : calco.entregado_en,
      actualizado_en: new Date().toISOString(),
      actualizado_por: ses.nombre,
    }).eq("id", calco.id);
    if (error) return err(error.message, 500);

    await quizasVersionar(calco.id, payload, ses.nombre, esEntrega ? "entrega" : (body.motivo || "auto"));
    return ok({ entregado: esEntrega });
  }

  // ---- Enlace del espejo en vivo de Google Earth ----
  // Devuelve la direccion que Google Earth va a seguir. Con
  // `regenerar` se invalida la anterior (por si se filtro).
  if (accion === "espejo") {
    const { data: filas } = await sb.from("calcos")
      .select("id, grupo_id, creado_por, nombre").eq("id", body.calco_id).limit(1);
    if (!filas || !filas.length) return err("El trabajo no existe", 404);
    const calco = filas[0];

    const veto = await puedeTocar(ses, calco, body.ejercicio_id);
    if (veto) return err(veto, 403);

    const { data: clave, error } = await sb.rpc("calco_espejo_clave", {
      p_calco_id: calco.id,
      p_regenerar: body.regenerar === true,
    });
    if (error) return err(error.message, 500);

    const base = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
    return ok({
      url: `${base}/functions/v1/calco-espejo?k=${clave}`,
      nombre: calco.nombre || "Planeamiento",
    });
  }

  // ---- Lo que Google Earth va a leer ----
  // Cada capa es una fila de `calco_espejo_partes`, APARTE del trabajo: el
  // autoguardado reescribe el payload y ya no puede borrar el espejo.
  //   { partes: [{nombre, kml}] }  -> reemplaza todo el espejo
  //   { parte: {nombre, kml} }     -> reemplaza (o agrega) una sola capa
  if (accion === "espejo_publicar") {
    const { data: filas } = await sb.from("calcos")
      .select("id, grupo_id, creado_por").eq("id", body.calco_id).limit(1);
    if (!filas || !filas.length) return err("El trabajo no existe", 404);
    const calco = filas[0];

    const veto = await puedeTocar(ses, calco, body.ejercicio_id);
    if (veto) return err(veto, 403);

    const ahora = new Date().toISOString();

    if (Array.isArray(body.partes)) {
      const vistas = new Set<string>();
      const partes = body.partes
        .filter((p: any) => p && p.kml)
        .map((p: any, i: number) => ({
          calco_id: calco.id,
          clave: claveDe(p.nombre),
          nombre: String(p.nombre || "Capa"),
          orden: i,
          kml: String(p.kml),
          actualizado_en: ahora,
        }))
        .filter((p: any) => !vistas.has(p.clave) && vistas.add(p.clave));
      if (partes.length) {
        const { error } = await sb.from("calco_espejo_partes").upsert(partes, { onConflict: "calco_id,clave" });
        if (error) return err(error.message, 500);
      }
      let borrar = sb.from("calco_espejo_partes").delete().eq("calco_id", calco.id);
      if (partes.length) borrar = borrar.not("clave", "in", `(${partes.map((p: any) => p.clave).join(",")})`);
      const { error: eb } = await borrar;
      if (eb) return err(eb.message, 500);
      return ok({ capas: partes.length });
    }

    if (body.parte && body.parte.kml) {
      const nombre = String(body.parte.nombre || "Capa");
      const clave = claveDe(nombre);
      const { data: ya } = await sb.from("calco_espejo_partes")
        .select("clave, orden").eq("calco_id", calco.id);
      const existente = (ya || []).find((x: any) => x.clave === clave);
      const orden = existente
        ? existente.orden
        : (ya && ya.length ? Math.max(...ya.map((x: any) => x.orden)) + 1 : 0);
      const { error } = await sb.from("calco_espejo_partes").upsert({
        calco_id: calco.id, clave, nombre, orden, kml: String(body.parte.kml), actualizado_en: ahora,
      }, { onConflict: "calco_id,clave" });
      if (error) return err(error.message, 500);
      return ok({ capas: (ya || []).length + (existente ? 0 : 1) });
    }

    return err("No mandaste ninguna capa para el espejo");
  }

  // ================= PROFESOR / C&T =================
  if (!esDocente(ses)) return err("Solo el cuerpo docente puede ver o calificar los trabajos.", 403);

  if (accion === "listar") {
    // Los trabajos PERSONALES de los docentes no son entregas: no van a la
    // lista de calificacion.
    let q = sb.from("calcos")
      .select("id, ejercicio_id, grupo_id, nombre, pais, estado, nota, entregado_en, actualizado_en, actualizado_por")
      .not("grupo_id", "is", null)
      .order("actualizado_en", { ascending: false }).limit(500);
    if (body.ejercicio_id) q = q.eq("ejercicio_id", body.ejercicio_id);
    const { data, error } = await q;
    if (error) return err(error.message, 500);

    // Nombre y bando del Estado Mayor, para que la lista se entienda.
    const { data: grupos } = await sb.from("ejercicio_grupos")
      .select("id, nombre, bando, ejercicio_id");
    const porId: Record<string, any> = {};
    for (const g of grupos || []) porId[g.id] = g;
    const lista = (data || []).map((c: any) => ({
      ...c,
      grupo_nombre: porId[c.grupo_id]?.nombre || null,
      bando: porId[c.grupo_id]?.bando ?? null,
    }));
    return ok({ calcos: lista });
  }

  if (accion === "abrir") {
    const { data, error } = await sb.from("calcos").select("*").eq("id", body.calco_id).limit(1);
    if (error) return err(error.message, 500);
    if (!data || !data.length) return err("El trabajo no existe", 404);
    return ok({ calco: data[0] });
  }

  if (accion === "calificar") {
    if (!body.calco_id) return err("Falta calco_id");
    const nota = body.nota === null || body.nota === undefined ? null : Number(body.nota);
    if (nota !== null && (!Number.isFinite(nota) || nota < 0 || nota > 100))
      return err("La nota debe estar entre 0 y 100");
    const { error } = await sb.from("calcos").update({
      nota,
      observaciones: body.observaciones ? String(body.observaciones).slice(0, 4000) : null,
      estado: nota === null ? "entregado" : "calificado",
      actualizado_en: new Date().toISOString(),
      actualizado_por: ses.nombre,
    }).eq("id", body.calco_id);
    if (error) return err(error.message, 500);
    return ok();
  }

  if (accion === "historial") {
    const { data, error } = await sb.from("calco_versiones")
      .select("id, bytes, guardado_por, motivo, creado_en")
      .eq("calco_id", body.calco_id)
      .order("creado_en", { ascending: false }).limit(200);
    if (error) return err(error.message, 500);
    return ok({ versiones: data || [] });
  }

  return err("Accion no reconocida");
});
