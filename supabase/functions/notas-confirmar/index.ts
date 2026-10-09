// ================================================================================
// SIDECEME — Edge Function  notas-confirmar
//
// Lado del CURSANTE de la conformidad de notas: ver sus pendientes y dar su
// firma digital (de acuerdo) o su objecion (no de acuerdo, con observacion).
// Espejo de `notas-ops` pero para sesiones de cursante, no de profesor.
//
// >>> ESTE ARCHIVO VA EN LA FUNCION "notas-confirmar". Es NUEVA, no reemplaza
// >>> a notas-ops (esa sigue siendo solo para profesores/evaluadores).
//
// Seguridad: JWT OFF + service_role. validarSesionCursante():
//   - token vigente en `sesiones`, usuario_tabla = 'cursantes'
//   - solo puede leer/tocar SUS PROPIAS filas de notas_confirmaciones
//     (siempre filtra por cursante_id = ses.usuario_id, nunca confia en el body)
//
// Acciones: pendientes · resolver
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

async function validarSesionCursante(token: string) {
  if (!token || typeof token !== "string" || token.length > 200) {
    return { error: "Token requerido", status: 400 };
  }
  const { data: ses, error } = await sb
    .from("sesiones")
    .select("usuario_id, usuario_tabla, revocado, expira_en")
    .eq("token", token)
    .maybeSingle();

  if (error || !ses) return { error: "Sesion invalida. Volve a entrar.", status: 401 };
  if (ses.revocado === true) return { error: "Sesion revocada", status: 401 };
  if (new Date(ses.expira_en) < new Date()) return { error: "Sesion expirada. Volve a entrar.", status: 401 };
  if (ses.usuario_tabla !== "cursantes") {
    return { error: "Esta operacion es solo para cursantes", status: 403 };
  }

  const { data: cur } = await sb
    .from("cursantes")
    .select("id, ci, nombre_completo, activo")
    .eq("id", ses.usuario_id)
    .maybeSingle();

  if (!cur || cur.activo === false) return { error: "Usuario inactivo", status: 403 };
  return { cur };
}


const CONF_COLUMNS = "id, gestion, semestre, ciclo, materia, grupo, nota_final, estado, publicado_en, plazo_vence_en, confirmada_en, observacion_cursante";
function claveNota(f: any): string {
  return JSON.stringify([f.gestion, f.semestre, f.ciclo, f.materia]);
}
function notaVisible(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(4) : null;
}
function conformidadVigente(conf: any, nota: any): boolean {
  return !!nota && claveNota(conf) === claveNota(nota)
    && notaVisible(conf.nota_final) !== null
    && notaVisible(conf.nota_final) === notaVisible(nota.nota_final);
}
async function leerNotaVigente(curId: string, conf: any) {
  return await sb.from("notas_academicas")
    .select("id, gestion, semestre, ciclo, materia, nota_final")
    .eq("cursante_id", curId).eq("gestion", conf.gestion)
    .eq("semestre", conf.semestre).eq("ciclo", conf.ciclo)
    .eq("materia", conf.materia).maybeSingle();
}
const ERROR_NO_VIGENTE = "Esta publicacion ya no corresponde a tu nota vigente. Actualiza tus notas y firma solamente la publicacion actual.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Cuerpo invalido" }, 400); }

  if (body.accion === "ping") {
    return json({ ok: true, funcion: "notas-confirmar", version: 4, acciones: ["pendientes", "consultar", "resolver"] });
  }

  const auth = await validarSesionCursante(body.token);
  if ("error" in auth) return json({ ok: false, error: auth.error }, auth.status);
  const cur = auth.cur!;

  try {
    switch (body.accion) {
      // Todas MIS conformidades (publicadas por un evaluador) — el front pinta
      // los pills verde/rojo/guinda y el banner con boton de firmar.
      case "pendientes": {
        const { data, error } = await sb
          .from("notas_confirmaciones")
          .select(CONF_COLUMNS)
          .eq("cursante_id", cur.id)
          .not("publicado_en", "is", null)
          .order("publicado_en", { ascending: false })
          .limit(300);
        if (error) return json({ ok: false, error: "No se pudo leer tus notas" }, 500);
        // Las publicaciones sin nota academica actual son historicas: no se borran
        // ni se trasladan sus firmas a otro nombre/valor.
        const { data: notas, error: errNotas } = await sb.from("notas_academicas")
          .select("gestion, semestre, ciclo, materia, nota_final")
          .eq("cursante_id", cur.id).limit(1000);
        if (errNotas) return json({ ok: false, error: "No se pudo verificar tus notas vigentes" }, 500);
        const porClave = new Map<string, any>();
        for (const n of notas || []) {
          const k = claveNota(n);
          // Ante duplicados ambiguos no habilitar una firma.
          porClave.set(k, porClave.has(k) ? null : n);
        }
        const vigentes = (data || []).filter((c: any) => conformidadVigente(c, porClave.get(claveNota(c))));
        return json({ ok: true, confirmaciones: vigentes });
      }

      // Revalidar antes de abrir el canvas; no confiar en la cache del navegador.
      case "consultar": {
        const confId = txt(body.confirmacion_id, 60);
        if (!confId) return json({ ok: false, error: "Falta la conformidad" }, 400);
        const { data: conf, error } = await sb.from("notas_confirmaciones")
          .select(CONF_COLUMNS).eq("id", confId).eq("cursante_id", cur.id).maybeSingle();
        if (error) return json({ ok: false, error: "No se pudo leer la conformidad" }, 500);
        if (!conf || !conf.publicado_en) return json({ ok: false, error: "No se encontro esa publicacion" }, 404);
        const { data: nota, error: errNota } = await leerNotaVigente(cur.id, conf);
        if (errNota) return json({ ok: false, error: "No se pudo verificar la nota vigente" }, 500);
        if (!conformidadVigente(conf, nota)) return json({ ok: false, no_vigente: true, error: ERROR_NO_VIGENTE }, 409);
        if (conf.estado !== "pendiente") return json({ ok: false, no_vigente: true, error: "Esta nota ya tiene tu respuesta registrada." }, 409);
        return json({ ok: true, confirmacion: conf });
      }

      // decision: 'confirmar' (de acuerdo) | 'rechazar' (no de acuerdo, con observacion)
      case "resolver": {
        const confId = txt(body.confirmacion_id, 60);
        const decision = txt(body.decision, 20);
        const firma = txt(body.firma, 400000); // dataURL png del canvas
        const observacion = txt(body.observacion, 1000);

        if (!confId) return json({ ok: false, error: "Falta la conformidad a resolver" }, 400);
        if (decision !== "confirmar" && decision !== "rechazar") {
          return json({ ok: false, error: "Decision invalida" }, 400);
        }
        if (!firma) return json({ ok: false, error: "Falta tu firma" }, 400);
        if (decision === "rechazar" && !observacion) {
          return json({ ok: false, error: "Si no estas de acuerdo, tenes que explicar por que" }, 400);
        }

        // Nunca confiar en cursante_id del body: siempre la propia sesion.
        const { data: fila, error: errFila } = await sb
          .from("notas_confirmaciones")
          .select("id, cursante_id, gestion, semestre, ciclo, materia, nota_final, publicado_en, estado")
          .eq("id", confId)
          .eq("cursante_id", cur.id)
          .maybeSingle();
        if (errFila || !fila) return json({ ok: false, error: "No se encontro esa nota" }, 404);
        if (fila.estado !== "pendiente") {
          return json({ ok: false, error: "Esta nota ya fue " + (fila.estado === "confirmada" ? "confirmada" : "objetada") + " antes" }, 409);
        }

        const { data: nota, error: errNota } = await leerNotaVigente(cur.id, fila);
        if (errNota) return json({ ok: false, error: "No se pudo verificar la nota vigente" }, 500);
        if (!fila.publicado_en || !conformidadVigente(fila, nota)) {
          return json({ ok: false, no_vigente: true, error: ERROR_NO_VIGENTE }, 409);
        }
        if (body.nota_mostrada !== undefined && notaVisible(body.nota_mostrada) !== notaVisible(fila.nota_final)) {
          return json({ ok: false, no_vigente: true, error: "La nota cambio desde que abriste la firma. Actualiza y revisala nuevamente." }, 409);
        }
        if (body.publicado_en !== undefined && body.publicado_en !== fila.publicado_en) {
          return json({ ok: false, no_vigente: true, error: "La publicacion cambio. Actualiza y revisala nuevamente." }, 409);
        }

        const now = new Date();
        const huella = {
          ip: ip(req),
          user_agent: req.headers.get("user-agent") || "",
          timestamp: now.toISOString(),
          nota_final: fila.nota_final, materia: fila.materia,
          nota_id: nota.id, publicado_en: fila.publicado_en,
        };

        const { data: actualizada, error: errUpd } = await sb
          .from("notas_confirmaciones")
          .update({
            estado: decision === "confirmar" ? "confirmada" : "rechazada",
            firma_cursante: firma,
            confirmada_en: now.toISOString(),
            observacion_cursante: observacion,
            huella_forense: huella,
            actualizado_en: now.toISOString(),
          })
          .eq("id", confId)
          .eq("cursante_id", cur.id)
          .eq("estado", "pendiente")
          .eq("nota_final", fila.nota_final).eq("publicado_en", fila.publicado_en)
          .select("id").maybeSingle(); // no firmar una publicacion que cambio en paralelo
        if (errUpd) {
          if (errUpd.code === "23514") return json({ ok: false, no_vigente: true, error: ERROR_NO_VIGENTE }, 409);
          console.error("resolver", errUpd); return json({ ok: false, error: "No se pudo guardar" }, 500);
        }
        if (!actualizada) return json({ ok: false, no_vigente: true, error: "La publicacion cambio o ya fue respondida. Actualiza tus notas." }, 409);

        return json({ ok: true, estado: decision === "confirmar" ? "confirmada" : "rechazada" });
      }

      default:
        return json({ ok: false, error: "Accion desconocida en notas-confirmar: " + String(body.accion) }, 400);
    }
  } catch (e) {
    console.error("notas-confirmar", e);
    return json({ ok: false, error: "Error interno: " + ((e as Error)?.message || String(e)) }, 500);
  }
});
