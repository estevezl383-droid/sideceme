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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Cuerpo invalido" }, 400); }

  if (body.accion === "ping") {
    return json({ ok: true, funcion: "notas-confirmar", acciones: ["pendientes", "resolver"] });
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
          .select("id, gestion, semestre, ciclo, materia, grupo, nota_final, estado, publicado_en, plazo_vence_en, confirmada_en, observacion_cursante")
          .eq("cursante_id", cur.id)
          .not("publicado_en", "is", null)
          .order("publicado_en", { ascending: false })
          .limit(300);
        if (error) return json({ ok: false, error: "No se pudo leer tus notas" }, 500);
        return json({ ok: true, confirmaciones: data || [] });
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
          .select("id, cursante_id, estado")
          .eq("id", confId)
          .eq("cursante_id", cur.id)
          .maybeSingle();
        if (errFila || !fila) return json({ ok: false, error: "No se encontro esa nota" }, 404);
        if (fila.estado !== "pendiente") {
          return json({ ok: false, error: "Esta nota ya fue " + (fila.estado === "confirmada" ? "confirmada" : "objetada") + " antes" }, 409);
        }

        const now = new Date();
        const huella = {
          ip: ip(req),
          user_agent: req.headers.get("user-agent") || "",
          timestamp: now.toISOString(),
        };

        const { error: errUpd } = await sb
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
          .eq("estado", "pendiente"); // doble seguro anti doble-click/carrera
        if (errUpd) { console.error("resolver", errUpd); return json({ ok: false, error: "No se pudo guardar" }, 500); }

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
