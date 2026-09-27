// ================================================================================
// SIDECEME — Edge Function  registros-ops   (v2.9.416)
//
// Eliminar (marcar inactivo) un horario semanal o una planilla de disciplina, y
// registrar el cambio de titular de la Sección Disciplina. Reemplaza las
// escrituras que la app hacía directo sobre horarios_semanales, planillas_disciplina
// y seccion_cargos: acá se validan la sesión y el rol, con las mismas reglas que
// la pantalla. Subir un horario o una planilla sigue por su camino de siempre.
//
// >>> ESTE ARCHIVO VA EN LA FUNCION "registros-ops". Es NUEVA, no reemplaza a nada.
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

const VERSION = "2.9.416";

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

// Igual que MAPA_ROL_BACKEND_A_CARGO de la app: rol del profesor → panel en el que entra.
const PANEL: Record<string, string> = {
  jefe_disciplina: "disciplina", disciplina: "disciplina",
  jefe_estudios: "estudios", estudios: "estudios",
  comandante: "comandante",
  ciencia_tecnologia: "ciencia_tecnologia",
  jefe_sac: "jefe_sac",
};

type Usuario = { id: string; nombre: string; paneles: Set<string>; auxiliar: boolean; soloLectura: boolean };

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
  if (ses.usuario_tabla !== "profesores") return { error: "Solo el personal de la Escuela puede hacer esto.", status: 403 };
  const id = String(ses.usuario_id);
  const { data: p } = await sb
    .from("profesores")
    .select("nombre_completo, rol, roles, activo, es_auxiliar, solo_lectura")
    .eq("id", id)
    .maybeSingle();
  if (!p || p.activo === false) return { error: "Cuenta inactiva o no encontrada.", status: 403 };
  const paneles = new Set<string>();
  for (const r of [p.rol, ...(Array.isArray(p.roles) ? p.roles : [])]) {
    const panel = PANEL[String(r || "").toLowerCase()];
    if (panel) paneles.add(panel);
  }
  return { id, nombre: p.nombre_completo || id, paneles, auxiliar: p.es_auxiliar === true, soloLectura: p.solo_lectura === true };
}

// esAdminPanel() de la app: quienes usan el panel de Disciplina.
const ADMIN_PANEL = ["disciplina", "comandante", "estudios", "ciencia_tecnologia", "jefe_sac"];
const enPanel = (u: Usuario) => ADMIN_PANEL.some((x) => u.paneles.has(x));
// Horarios: los mismos que ven el botón en la app (esAdminPanel).
const puedeHorarios = (u: Usuario) => !u.soloLectura && enPanel(u);
// Planillas: esAdminPlanilla() — Disciplina, Comandante o C&T (C&T, si no es auxiliar).
const puedePlanillas = (u: Usuario) => !u.soloLectura &&
  (u.paneles.has("disciplina") || u.paneles.has("comandante") || (u.paneles.has("ciencia_tecnologia") && !u.auxiliar));
// Titular de la Sección: los jefes que usan el panel, no el auxiliar.
const puedeCargos = (u: Usuario) => !u.soloLectura && !u.auxiliar && enPanel(u);

const CONSULTA = "Tu cuenta es de AUXILIAR DE CONSULTA: podés ver e imprimir, pero no modificar.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });
  if (req.method !== "POST") return err("Método no permitido", 405);

  let body: any = {};
  try { body = await req.json(); } catch { return err("Cuerpo inválido"); }

  if (body.accion === "ping") return ok({ funcion: "registros-ops", version: VERSION });

  const u = await leerUsuario(body.token);
  if ("error" in u) return err(u.error, u.status);

  try {
    switch (body.accion) {
      case "horario_eliminar": {
        if (!puedeHorarios(u)) {
          return err(u.soloLectura ? CONSULTA : "Solo Jefe Disciplina, Comandante o Jefe Estudios pueden eliminar horarios.", 403);
        }
        const id = Number(body.id);
        if (!Number.isInteger(id) || id <= 0) return err("Horario inválido.");
        const { data: h } = await sb.from("horarios_semanales").select("id, activo").eq("id", id).maybeSingle();
        if (!h) return err("Horario no encontrado.", 404);
        if (h.activo === false) return ok({ ya_estaba: true });
        const { error } = await sb.from("horarios_semanales")
          .update({ activo: false, eliminado_por: u.id, eliminado_en: new Date().toISOString() })
          .eq("id", id);
        if (error) return err("No se pudo eliminar el horario: " + error.message, 500);
        return ok();
      }

      case "planilla_eliminar": {
        if (!puedePlanillas(u)) {
          return err(u.soloLectura ? CONSULTA : "Solo Jefe Disciplina, Comandante o C&T pueden eliminar planillas.", 403);
        }
        const id = Number(body.id);
        if (!Number.isInteger(id) || id <= 0) return err("Planilla inválida.");
        const { data: p } = await sb.from("planillas_disciplina").select("id, activo").eq("id", id).maybeSingle();
        if (!p) return err("Planilla no encontrada.", 404);
        if (p.activo === false) return ok({ ya_estaba: true });
        const { error } = await sb.from("planillas_disciplina").update({ activo: false }).eq("id", id);
        if (error) return err("No se pudo eliminar la planilla: " + error.message, 500);
        return ok();
      }

      case "cargo_registrar": {
        if (!puedeCargos(u)) {
          return err(u.soloLectura ? CONSULTA
            : u.auxiliar ? "Sos AUXILIAR: registrar al titular de la Sección es atribución del titular."
            : "No tenés atribución para registrar al titular de la Sección.", 403);
        }
        const nombre = txt(body.titular_nombre, 200);
        if (!nombre) return err("Falta el nombre del nuevo titular.");
        const grado = txt(body.titular_grado, 80);
        const desde = txt(body.desde, 10);
        if (!desde || !/^\d{4}-\d{2}-\d{2}$/.test(desde) || isNaN(Date.parse(desde + "T12:00:00Z")) ||
            new Date(desde + "T12:00:00Z").toISOString().slice(0, 10) !== desde) {
          return err("Fecha inválida: tiene que ser AAAA-MM-DD.");
        }
        const obs = txt(body.observaciones, 1000);
        // Primero el nuevo titular; recién después se cierra el anterior. Si algo falla
        // a mitad de camino, la Sección no queda sin titular.
        const { data: nuevo, error: eIns } = await sb.from("seccion_cargos").insert({
          seccion: "DISCIPLINA", titular_grado: grado, titular_nombre: nombre, desde,
          estado: "ACTUAL", observaciones: obs, creado_por: u.nombre,
        }).select("id").single();
        if (eIns || !nuevo) return err("No se pudo registrar el nuevo titular: " + (eIns?.message || "sin respuesta"), 500);
        const { error: eAct } = await sb.from("seccion_cargos")
          .update({ hasta: desde, estado: "CONCLUIDO" })
          .eq("seccion", "DISCIPLINA").eq("estado", "ACTUAL").neq("id", nuevo.id);
        if (eAct) return err("Se registró el nuevo titular, pero no se pudo cerrar el anterior: " + eAct.message, 500);
        return ok({ id: nuevo.id });
      }

      default:
        return err("Acción desconocida en registros-ops: " + String(body.accion));
    }
  } catch (e) {
    console.error("registros-ops", e);
    return err("Error interno: " + ((e as Error)?.message || String(e)), 500);
  }
});
