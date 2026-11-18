// ============================================================
// EDGE FUNCTION: calco-ops   (v13, 15-11-2026 - el ejercicio se lee en chorro; v12: guardar solo lo que cambio)
//
// Guarda y lee los trabajos del Generador de Calcos.
// Fuente legible y su historia: supabase/espejo-ge/calco-ops/ en el repo sideceme.
//
// Acciones del cursante (y del docente sobre su trabajo personal):
//   'mi_calco' / 'guardar' (entero o con `delta`) / 'entregar' / 'espejo' / 'espejo_publicar'
// Acciones del docente sobre SUS ejercicios:
//   'mis_calcos' / 'crear_mio' / 'abrir_mio' / 'renombrar_mio' / 'borrar_mio'
// Acciones del profesor / C&T:
//   'listar' / 'abrir' / 'calificar' / 'historial'
//
// Auth: token de sesion de SIDECEME. JWT: OFF. Usa service_role;
// las tablas calcos/calco_versiones/calco_espejo_partes no tienen politicas.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { compartir } from "./compartir.mjs";

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

// 13-11-2026: el ejercicio COMPLETO se lee de la vista (payload_fijo || payload). Los calcos del
// terreno y los documentos pueden estar en `payload_fijo` para que cada guardado no los reescriba.
// OJO: leer `calcos.payload` directo puede dar el ejercicio SIN esas dos claves.
const LEER = "calcos_completo";

// ============================================================
// 15-11-2026 (v13) - EL EJERCICIO SE LEE EN CHORRO. Medido con la sesion de Sergio: 25 Mesas abriendo
// a la vez un ejercicio de 4 MB y solo 6 lo abrian; las otras 19 veian "El ejercicio no existe".
// La funcion armaba 25 copias del JSON en memoria (parse + stringify), se ahogaba, PostgREST mataba
// hilos, la base cancelaba lecturas por tiempo (57014) y ese error se confundia con "sin filas".
// Ahora el ejercicio pasa de PostgREST al navegador tal cual, por pedazos, sin cargarlo entero aca.
// Un error de lectura contesta 503 "ocupado" (codigo:'ocupado'), que la Mesa reintenta sola.
// ============================================================
const REST = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "") + "/rest/v1";
const CLAVE_SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ocupado = (msg: string) =>
  new Response(JSON.stringify({ ok: false, codigo: "ocupado", error: `${msg} Proba de nuevo en unos segundos.` }),
    { status: 503, headers: corsHeaders });

async function calcoEnChorro(id: string, extra: Record<string, unknown> = {}): Promise<Response> {
  let r: Response;
  try {
    r = await fetch(`${REST}/${LEER}?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: { apikey: CLAVE_SR, Authorization: `Bearer ${CLAVE_SR}`, Accept: "application/vnd.pgrst.object+json" },
    });
  } catch (e) {
    console.error("leer calco:", (e as Error).message);
    return ocupado("No se pudo leer el ejercicio.");
  }
  if (r.status === 406) {
    try { await r.body?.cancel(); } catch { /* nada */ }
    return err("El ejercicio no existe", 404);
  }
  if (!r.ok || !r.body) {
    const t = await r.text().catch(() => "");
    console.error("leer calco:", r.status, t.slice(0, 200));
    return ocupado(`No se pudo leer el ejercicio (${r.status}).`);
  }
  const enc = new TextEncoder();
  const cabeza = enc.encode(`{"ok":true,${
    Object.entries(extra).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v ?? null)},`).join("")
  }"calco":`);
  const lector = r.body.getReader();
  let primero = true, cerrado = false;
  const salida = new ReadableStream<Uint8Array>({
    async pull(ctl) {
      if (primero) { primero = false; ctl.enqueue(cabeza); return; }
      const { done, value } = await lector.read();
      if (done) {
        if (!cerrado) { cerrado = true; ctl.enqueue(enc.encode("}")); ctl.close(); }
        return;
      }
      ctl.enqueue(value);
    },
    cancel() { lector.cancel().catch(() => {}); },
  });
  return new Response(salida, { status: 200, headers: corsHeaders });
}

// Cada cuanto se deja una instantanea en el historial.
const MINUTOS_ENTRE_VERSIONES = 15;
// 13-11-2026: de cada trabajo de GRUPO se conservan las ultimas automaticas (las de entrega y
// las manuales, todas). Con 225 alumnos y una copia entera cada 10 min el disco se llenaba.
const VERSIONES_AUTO_POR_GRUPO = 3;

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
// Puede tener VARIOS; `mi_calco` toma el mas reciente.
// ------------------------------------------------------------
// 13-11-2026 - LA LISTA, SIN EL CONTENIDO. Antes se traian los ejercicios ENTEROS del docente
// (52 = 42 MB) cada vez que se listaba, se abria la Mesa o se creaba uno: la funcion se quedaba
// sin memoria (error 546) y la Mesa decia "este servidor guarda un solo trabajo".
async function listaPersonales(creadoPor: string) {
  const { data, error } = await sb.rpc("calcos_lista_personal", { p_creado_por: creadoPor });
  if (error) throw new Error(error.message);
  return data || [];
}

// v13: solo el id; el contenido viaja en chorro (calcoEnChorro).
async function calcoPersonal(ses: Sesion) {
  const { data: ya, error: e0 } = await sb.from("calcos").select("id")
    .eq("creado_por", ses.id).is("grupo_id", null).is("ejercicio_id", null)
    .order("actualizado_en", { ascending: false }).limit(1);
  // Si la lectura falla NO se crea uno nuevo en blanco (antes un corte dejaba un "Planeamiento" vacio).
  if (e0) return { id: null as string | null, nuevo: false, error: e0.message };
  if (ya && ya.length) return { id: String(ya[0].id), nuevo: false, error: null as string | null };

  const { data: nuevo, error } = await sb.from("calcos").insert({
    ejercicio_id: null, grupo_id: null, creado_por: ses.id,
    nombre: `Planeamiento - ${ses.nombre || "docente"}`, payload: {},
  }).select("id").limit(1);
  if (error) return { id: null, nuevo: false, error: error.message };
  return { id: nuevo?.[0]?.id ? String(nuevo[0].id) : null, nuevo: true, error: null };
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

// Deja una instantanea solo si paso el tiempo minimo, o si es entrega. La copia se hace DENTRO
// de la base (calco_versionar): la funcion ya no vuelve a mandar el contenido entero.
async function versionar(calcoId: string, quien: string, motivo: string) {
  const { error } = await sb.rpc("calco_versionar", {
    p_calco_id: calcoId, p_por: quien, p_motivo: motivo,
    p_min_minutos: MINUTOS_ENTRE_VERSIONES, p_conservar: VERSIONES_AUTO_POR_GRUPO,
  });
  if (error) console.error("calco_versionar:", error.message);
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

  const compartido = await compartir(body, ses, { sb, esDocente, puedeTocar, ventanaAbierta, ok, err });
  if (compartido) return compartido;

  // ================= MI TRABAJO =================
  if (accion === "mi_calco") {
    // El cuerpo docente prepara los ejercicios: trabajo personal propio.
    if (esDocente(ses)) {
      const r = await calcoPersonal(ses);
      if (r.error) return ocupado(`No se pudo leer tu trabajo (${r.error}).`);
      if (!r.id) return err("No se pudo crear el trabajo", 500);
      return calcoEnChorro(r.id, { personal: true, nuevo: r.nuevo });
    }

    const g = await miGrupo(ses.id, body.ejercicio_id);
    if (!g) return err("No estas asignado a ningun Estado Mayor en un ejercicio activo.", 403);

    const { data: ya, error: eYa } = await sb.from("calcos").select("id")
      .eq("ejercicio_id", g.ejercicio_id).eq("grupo_id", g.grupo_id).limit(1);
    if (eYa) return ocupado(`No se pudo leer el trabajo (${eYa.message}).`);
    if (ya && ya.length) return calcoEnChorro(String(ya[0].id), { grupo: g });

    const { data: nuevo, error } = await sb.from("calcos").insert({
      ejercicio_id: g.ejercicio_id, grupo_id: g.grupo_id, creado_por: ses.id,
      nombre: g.nombre || "Planeamiento", payload: {},
    }).select("id").limit(1);
    if (error) return err(error.message, 500);
    if (!nuevo || !nuevo.length) return err("No se pudo crear el trabajo", 500);
    return calcoEnChorro(String(nuevo[0].id), { grupo: g, nuevo: true });
  }

  // ============ MIS EJERCICIOS (varios, solo docentes) ============
  // El cuerpo docente PREPARA ejercicios, y prepara muchos. Los trabajos de GRUPO siguen
  // siendo uno por Estado Mayor: un EM entrega un trabajo, no diez.
  if (accion === "mis_calcos" || accion === "crear_mio" || accion === "abrir_mio"
      || accion === "renombrar_mio" || accion === "borrar_mio") {
    if (!esDocente(ses)) {
      return err("El trabajo de tu Estado Mayor es uno solo: se guarda y se abre desde 'mi_calco'.", 403);
    }

    if (accion === "mis_calcos") {
      // `bytes` lo calcula la base (exacto en los chicos, estimado en los grandes).
      let filas: any[];
      try { filas = await listaPersonales(ses.id); } catch (e) { return err((e as Error).message, 500); }
      return ok({ calcos: filas });
    }

    if (accion === "crear_mio") {
      const nombre = String(body.nombre || "").trim();
      if (!nombre) return err("Ponele un nombre al ejercicio");
      let ya: any[];
      try { ya = await listaPersonales(ses.id); } catch (e) { return err((e as Error).message, 500); }
      if (ya.some((c: any) => (c.nombre || "").toLowerCase() === nombre.toLowerCase()))
        return err("Ya tenes un ejercicio con ese nombre.");
      // `desde_id` duplica: es el "Guardar como" de toda la vida.
      let payload: unknown = {};
      let pais = body.pais || null;
      if (body.desde_id) {
        if (!ya.some((c: any) => c.id === body.desde_id))
          return err("El ejercicio que queres duplicar no es tuyo o no existe.", 403);
        const { data: bs, error: eB } = await sb.from(LEER).select("payload, pais").eq("id", body.desde_id).limit(1);
        if (eB) return ocupado(`No se pudo leer el ejercicio a duplicar (${eB.message}).`);
        const base = bs && bs[0];
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
    // v13: solo las columnas livianas; el contenido va en chorro, y un error ya no se confunde con "no existe".
    const { data: filas, error: eF } = await sb.from("calcos")
      .select("id, grupo_id, ejercicio_id, creado_por, nombre")
      .eq("id", body.calco_id).limit(1);
    if (eF) return ocupado(`No se pudo leer el ejercicio (${eF.message}).`);
    if (!filas || !filas.length) return err("El ejercicio no existe", 404);
    const calco = filas[0];
    if (calco.grupo_id || calco.ejercicio_id)
      return err("Ese es el trabajo de un Estado Mayor, no un ejercicio tuyo.", 403);
    if (calco.creado_por !== ses.id)
      return err("Ese ejercicio es de otro docente.", 403);

    if (accion === "abrir_mio") return calcoEnChorro(String(calco.id));

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
    // 13-11-2026 - GUARDAR SOLO LO QUE CAMBIO. La Mesa manda `delta` (las claves del ejercicio
    // que cambiaron desde la revision `base_rev`) en vez del ejercicio entero (3 a 6 MB cada vez).
    // Con `delta`, `calco_id` viene adentro y el de afuera en null: una funcion vieja contesta
    // "no existe" en vez de guardar un ejercicio vacio.
    const delta = !esEntrega && body.delta && typeof body.delta === "object" ? body.delta : null;
    const calcoId = delta ? delta.calco_id : body.calco_id;
    if (!calcoId) return err("Falta calco_id");

    // Solo lo necesario para decidir: el contenido anterior ya no se lee.
    const { data: filas } = await sb.from("calcos")
      .select("id, grupo_id, creado_por, ejercicio_id, estado, pais, nombre, entregado_en")
      .eq("id", calcoId).limit(1);
    if (!filas || !filas.length) return err("El trabajo no existe", 404);
    const calco = filas[0];

    const veto = await puedeTocar(ses, calco, body.ejercicio_id);
    if (veto) return err(veto, 403);

    const cerrado = await ventanaAbierta(calco.ejercicio_id);
    if (cerrado) return err(cerrado, 403);
    if (calco.estado === "calificado")
      return err("El trabajo ya fue calificado y no admite cambios.", 403);

    if (delta) {
      const cambios = delta.cambios && typeof delta.cambios === "object" && !Array.isArray(delta.cambios)
        ? delta.cambios : {};
      const quitar = Array.isArray(delta.quitar) ? delta.quitar.map((k: unknown) => String(k)) : [];
      const baseRev = Number(delta.base_rev);
      if (!Number.isFinite(baseRev)) return err("Falta la revision de base");
      const { data: r, error } = await sb.rpc("calco_guardar_delta", {
        p_calco_id: calco.id, p_base_rev: baseRev, p_cambios: cambios, p_quitar: quitar,
        p_nombre: body.nombre || null, p_pais: body.pais || null, p_por: ses.nombre,
      });
      if (error) return err(error.message, 500);
      if (!r || r.conflicto || typeof r.rev !== "number") {
        // Otro guardado paso en el medio (otra pestana, otro integrante): la Mesa manda todo.
        return new Response(JSON.stringify({
          ok: false, conflicto: true, rev: r?.rev ?? null,
          error: "El trabajo cambio en el servidor: se manda entero.",
        }), { status: 409, headers: corsHeaders });
      }
      await versionar(calco.id, ses.nombre, body.motivo || "auto");
      return ok({ entregado: false, rev: r.rev, delta: true });
    }

    const payload = body.payload ?? {};
    // Entero: todo va a `payload` y la parte fija queda vacia (el completo es fijo || payload).
    const { data: hecho, error } = await sb.from("calcos").update({
      payload,
      payload_fijo: null,
      pais: body.pais || calco.pais,
      nombre: body.nombre || calco.nombre,
      estado: esEntrega ? "entregado" : calco.estado,
      entregado_en: esEntrega ? new Date().toISOString() : calco.entregado_en,
      actualizado_en: new Date().toISOString(),
      actualizado_por: ses.nombre,
    }).eq("id", calco.id).select("rev");
    if (error) return err(error.message, 500);

    await versionar(calco.id, ses.nombre, esEntrega ? "entrega" : (body.motivo || "auto"));
    return ok({ entregado: esEntrega, rev: hecho?.[0]?.rev ?? null });
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
    if (!body.calco_id) return err("Falta calco_id");
    return calcoEnChorro(String(body.calco_id));
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
