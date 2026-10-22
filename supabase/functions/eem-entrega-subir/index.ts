// ============================================================
// EDGE FUNCTION: eem-entrega-subir   (Fase 1 — Evaluacion Sumativa EEM)
//
// La entrega es GRUPAL: un solo PDF por grupo. Lo sube CUALQUIER integrante
// y TILDA quienes entregan, el incluido. Queda la hora exacta, la IP y el
// hash. Nada se sobrescribe: cada reentrega es un intento nuevo.
//
// El frontend NUNCA escribe en eem_entregas. Dos pasos:
//   1) 'iniciar'   -> valida TODO y devuelve una URL firmada de subida
//   2) 'confirmar' -> BAJA el archivo del bucket, le calcula el SHA-256 y lo
//                     compara con el que declaro el navegador. Si no coincide,
//                     borra el objeto y no registra nada.
//
// Bucket eem-entregas: PRIVADO. Sin politicas: solo esta funcion, con
// service_role, escribe ahi.
//
// Auth: token de sesion de SIDECEME (tabla sesiones). JWT: OFF.
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

const BUCKET = "eem-entregas";
const MAX_BYTES = 20 * 1024 * 1024;  // 20 MB, igual que valida el navegador

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
  const { data: c } = await sb.from("cursantes")
    .select("nombre_completo, activo").eq("id", s.usuario_id).limit(1);
  if (!c || !c.length || c[0].activo === false) return null;
  return { id: s.usuario_id, tabla: "cursantes", rol: "", nombre: c[0].nombre_completo || "" };
}

async function rolEnCarpeta(profesor: string, carpeta: string): Promise<string | null> {
  const { data } = await sb.rpc("fn_eem_rol_en_carpeta", { p_profesor: profesor, p_carpeta: carpeta });
  return (data as string) || null;
}

function ipDe(req: Request): string {
  const h = req.headers;
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
         h.get("x-real-ip") || "";
}

function limpiarNombre(n: string): string {
  return (n || "trabajo.pdf").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").slice(-80);
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Todo lo que hay que mirar ANTES de dejar subir un byte.
async function revisarEntrega(carpetaId: string, quienEntrega: string, integrantes: string[]) {
  const { data: cps } = await sb.from("eem_carpetas_clase").select("*").eq("id", carpetaId).limit(1);
  if (!cps || !cps.length) return { error: "La carpeta de clases no existe." };
  const cp = cps[0];
  if (cp.estado !== "abierta") return { error: `La carpeta esta ${cp.estado}: ya no admite entregas.` };

  const { data: roster } = await sb.rpc("fn_eem_roster_carpeta", { p_carpeta: carpetaId });
  const filas = (roster || []) as any[];
  const yo = filas.find((r) => r.cursante_id === quienEntrega);
  if (!yo) return { error: "No figuras en la nomina de esta carpeta de clases." };
  if (!yo.grupo_id) {
    return { error: "Todavia no estas asignado a ningun grupo. Avisa al Evaluador antes de entregar." };
  }

  // Todos los tildados tienen que ser de TU grupo: la nota grupal es de ese grupo.
  const delGrupo = filas.filter((r) => r.grupo_id === yo.grupo_id).map((r) => r.cursante_id);
  const tildados = Array.from(new Set([...(integrantes || []), quienEntrega]));
  const intrusos = tildados.filter((c) => !delGrupo.includes(c));
  if (intrusos.length) {
    return { error: `Estos no son de tu grupo: ${intrusos.join(", ")}. La entrega es del grupo.` };
  }

  // Plazo. Vencido, la unica puerta la abre el Evaluador (eem_tardias).
  let tardia = false;
  if (cp.fecha_limite && new Date() > new Date(cp.fecha_limite)) {
    const habilitados = filas.filter((r) => tildados.includes(r.cursante_id) && r.tardia_habilitada);
    if (!habilitados.length) {
      return { error: `El plazo vencio el ${new Date(cp.fecha_limite).toLocaleString("es-BO", { timeZone: "America/La_Paz" })}. Solo el Evaluador puede habilitar una entrega tardia.` };
    }
    tardia = true;
  }
  return { cp, grupo_id: yo.grupo_id, grupo_numero: yo.grupo_numero, tildados, delGrupo, tardia };
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

  const carpetaId = String(body.carpeta_id || "");
  if (!carpetaId) return err("Falta carpeta_id");

  // Quien figura como autor de la entrega. Normalmente el cursante que sube;
  // por EXCEPCION el Evaluador carga en nombre de un alumno, con motivo.
  let quienEntrega = ses.id;
  let porExcepcion = false;
  let motivo: string | null = null;

  if (ses.tabla === "profesores") {
    const rol = await rolEnCarpeta(ses.id, carpetaId);
    if (rol !== "evaluador" && rol !== "supervisor") {
      return err("Solo el Evaluador de esta carpeta puede cargar en nombre de un alumno.", 403);
    }
    quienEntrega = String(body.entregado_por || "");
    motivo = String(body.motivo || "").trim();
    if (!quienEntrega) return err("Falta el cursante en cuyo nombre se carga.");
    if (!motivo) return err("Cargar en nombre del alumno exige motivo.");
    porExcepcion = true;
  }

  let enlace: string | null = null;
  try {
    const texto = String(body.enlace_complementario || "").trim();
    if (texto) {
      if (texto.length > 2000 || /[\u0000- \u007f]/.test(texto)) throw new Error();
      const url = new URL(texto);
      if (!["https:","http:"].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
      enlace = url.href;
    }
  } catch { return err("El enlace complementario debe ser una direccion http:// o https:// valida, sin usuario ni contraseña."); }

  const integrantes: string[] = Array.isArray(body.integrantes) ? body.integrantes.map(String) : [];

  // ======================= 1) INICIAR =======================
  if (accion === "iniciar") {
    const nombre = String(body.archivo_nombre || "");
    const tam = Number(body.tamano || 0);
    const hash = String(body.sha256 || "").toLowerCase();

    if (!/\.pdf$/i.test(nombre)) return err("El formato de entrega es PDF, y solo PDF.");
    if (!(tam > 0)) return err("El archivo llego vacio.");
    if (tam > MAX_BYTES) return err(`El archivo pesa ${(tam / 1048576).toFixed(1)} MB. El maximo es 20 MB.`);
    if (!/^[0-9a-f]{64}$/.test(hash)) return err("Falta el SHA-256 del archivo.");

    const r: any = await revisarEntrega(carpetaId, quienEntrega, integrantes);
    if (r.error) return err(r.error, 403);

    const path = `${carpetaId}/${r.grupo_id}/${Date.now()}_${limpiarNombre(nombre)}`;
    const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) return err("No se pudo preparar la subida: " + error.message, 500);

    return ok({
      path, token_subida: data.token, signed_url: data.signedUrl,
      grupo_id: r.grupo_id, grupo_numero: r.grupo_numero,
      integrantes: r.tildados, fuera_de_plazo: r.tardia,
    });
  }

  // Alternative transport for networks where the direct Storage request fails.
  // Same authenticated session, group checks and final SHA-256 confirmation.
  if (accion === "transferir") {
    const path = String(body.path || "");
    const hash = String(body.sha256 || "").toLowerCase();
    const r: any = await revisarEntrega(carpetaId, quienEntrega, integrantes);
    if (r.error) return err(r.error, 403);
    if (!path.startsWith(`${carpetaId}/${r.grupo_id}/`) || path.includes("..")) return err("Ruta invalida.", 403);
    const encoded = String(body.pdf_base64 || "");
    if (!encoded || encoded.length > 4 * Math.ceil(MAX_BYTES / 3)) return err("El maximo es 20 MB.");
    let bytes: Uint8Array;
    try { bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0)); }
    catch { return err("Archivo invalido."); }
    if (!bytes.length || bytes.length > MAX_BYTES) return err("El maximo es 20 MB.");
    if (new TextDecoder().decode(bytes.slice(0,5)) !== "%PDF-") return err("Solo PDF.");
    if (!/^[0-9a-f]{64}$/.test(hash) || await sha256Hex(bytes.buffer as ArrayBuffer) !== hash) return err("La huella del archivo no coincide.");
    const { error } = await sb.storage.from(BUCKET).upload(path, bytes, {contentType:"application/pdf", upsert:false});
    // A lost successful response may leave the same object present. Confirm verifies its hash.
    if (error && String((error as any).statusCode) !== "409" && !/already exists|duplicate/i.test(error.message))
      return err("No se pudo transferir el PDF: " + error.message, 500);
    return ok({path});
  }

  // ======================= 2) CONFIRMAR =======================
  if (accion === "confirmar") {
    const path = String(body.path || "");
    const nombre = String(body.archivo_nombre || "");
    const hashCliente = String(body.sha256 || "").toLowerCase();
    if (!path.startsWith(carpetaId + "/")) return err("Ruta de archivo invalida.");
    if (!/^[0-9a-f]{64}$/.test(hashCliente)) return err("Falta el SHA-256 del archivo.");

    const r: any = await revisarEntrega(carpetaId, quienEntrega, integrantes);
    if (r.error) {
      await sb.storage.from(BUCKET).remove([path]);
      return err(r.error, 403);
    }
    if (!path.startsWith(`${carpetaId}/${r.grupo_id}/`)) {
      await sb.storage.from(BUCKET).remove([path]);
      return err("Ese archivo no corresponde a tu grupo.", 403);
    }

    // El archivo que quedo en el bucket es el que se evalua: se le calcula el
    // hash aca, no se cree el que dijo el navegador.
    const { data: blob, error: eDown } = await sb.storage.from(BUCKET).download(path);
    if (eDown || !blob) return err("El archivo no llego al servidor. Volve a intentar.", 500);
    const buf = await blob.arrayBuffer();
    const tam = buf.byteLength;

    if (tam > MAX_BYTES) {
      await sb.storage.from(BUCKET).remove([path]);
      return err(`El archivo pesa ${(tam / 1048576).toFixed(1)} MB. El maximo es 20 MB.`);
    }
    const cabecera = new TextDecoder().decode(new Uint8Array(buf.slice(0, 5)));
    if (cabecera !== "%PDF-") {
      await sb.storage.from(BUCKET).remove([path]);
      return err("Ese archivo no es un PDF (le falta la firma %PDF-).");
    }
    const hashReal = await sha256Hex(buf);
    if (hashReal !== hashCliente) {
      await sb.storage.from(BUCKET).remove([path]);
      return err("El archivo que llego no es el mismo que se eligio (el hash no coincide). Volve a subirlo.");
    }

    const { data: entregaId, error: eIns } = await sb.rpc("fn_eem_f1_entregar_con_enlace", {
      p_enlace: enlace,
      p_carpeta: carpetaId,
      p_entregado_por: quienEntrega,
      p_integrantes: r.tildados,
      p_archivo_nombre: nombre || limpiarNombre(path.split("/").pop() || "trabajo.pdf"),
      p_storage_pdf: path,
      p_sha256: hashReal,
      p_tamano: tam,
      p_ip: ipDe(req),
      p_user_agent: String(body.user_agent || req.headers.get("user-agent") || "").slice(0, 300),
      p_actor: ses.id,
      p_rol: ses.tabla === "profesores" ? (ses.rol || "profesor") : "cursante",
      p_modo: body.supervision === true ? "supervision" : "normal",
    });
    if (eIns) {
      await sb.storage.from(BUCKET).remove([path]);
      return err("No se pudo registrar la entrega: " + eIns.message, 500);
    }

    // El TEMA del grupo es el que declara el grupo al entregar (la app lo lee del
    // «Nombre del proyecto» del PDF y el alumno lo confirma). Es el TEMA del acta.
    // Si no se pudiera guardar, la entrega ya registrada sigue valiendo.
    let temaGuardado: string | null = null;
    const tema = String(body.tema || "").replace(/\s+/g, " ").trim().slice(0, 300);
    if (tema) {
      const { data: gr } = await sb.from("eem_grupos").select("nombre, tema").eq("id", r.grupo_id).limit(1);
      if (gr && gr.length && gr[0].tema !== tema) {
        const { error: eTema } = await sb.rpc("fn_eem_f1_grupo_guardar", {
          p_carpeta: carpetaId, p_grupo: r.grupo_id, p_numero: null,
          p_nombre: gr[0].nombre, p_tema: tema, p_actor: ses.id,
          p_rol: ses.tabla === "profesores" ? (ses.rol || "profesor") : "cursante",
          p_ip: ipDe(req), p_modo: body.supervision === true ? "supervision" : "normal",
        });
        if (!eTema) temaGuardado = tema;
      } else if (gr && gr.length) temaGuardado = tema;
    }

    const { data: filas } = await sb.from("eem_entregas")
      .select("id, archivo_nombre, enlace_complementario, sha256, tamano_bytes, entregado_en, entregado_por, numero_intento, fuera_de_plazo, retraso_minutos, grupo_id")
      .eq("id", entregaId).limit(1);
    const entrega = filas && filas.length ? filas[0] : null;

    if (porExcepcion && entrega) {
      await sb.from("eem_auditoria").insert({
        tabla: "eem_entregas", operacion: "CARGA_POR_EXCEPCION", registro_id: entrega.id,
        actor_id: ses.id, actor_rol: ses.rol || "profesor", motivo,
        ip: ipDe(req), modo: body.supervision === true ? "supervision" : "normal",
        datos_despues: { entregado_por: quienEntrega, archivo: entrega.archivo_nombre },
      });
    }

    return ok({ entrega, por_excepcion: porExcepcion, tema: temaGuardado });
  }

  return err("Accion no reconocida");
});
