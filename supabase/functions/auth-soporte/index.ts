import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const sb = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
const OWNER_ID = "P030";
const OWNER_CI = "4889191";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey", "Content-Type": "application/json", "Cache-Control": "no-store" };
const reply = (status: number, body: any) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers });
  if (req.method !== "POST") return reply(405, { ok: false, error: "Método no permitido" });
  try {
    const body = await req.json();
    if (!body || typeof body.token !== "string" || !body.token || body.token.length > 200) return reply(401, { ok: false, error: "Sesión requerida" });
    const { data: session, error: sessionError } = await sb.from("sesiones").select("*").eq("token", body.token).maybeSingle();
    const expires = Date.parse(session?.expira_en || "");
    if (sessionError) return reply(503, { ok: false, error: "No se pudo verificar la sesión" });
    // A support session can revoke itself, but can never open another session.
    if (body.accion === "cerrar") {
      if (!session || session.soporte_actor_id !== OWNER_ID || session.soporte_actor_ci !== OWNER_CI) return reply(403, { ok: false, error: "Sesión de soporte requerida" });
      const { error } = await sb.from("sesiones").update({ revocado: true }).eq("token", body.token).eq("soporte_actor_id", OWNER_ID);
      return error ? reply(503, { ok: false, error: "No se pudo cerrar el soporte" }) : reply(200, { ok: true });
    }
    if (!session || session.revocado !== false || !Number.isFinite(expires) || expires <= Date.now()) return reply(401, { ok: false, error: "Sesión inválida o vencida" });
    if (body.accion !== "abrir") return reply(400, { ok: false, error: "Acción inválida" });
    if (session.usuario_id !== OWNER_ID || session.usuario_ci !== OWNER_CI || session.usuario_tabla !== "profesores" || session.es_master !== false || session.soporte_actor_id != null || session.soporte_actor_ci != null) return reply(403, { ok: false, error: "Acceso de soporte no autorizado" });
    if (typeof body.password !== "string" || !body.password || body.password.length > 1024 || typeof body.ci !== "string" || !body.ci.trim() || body.ci.length > 40 || !["profesores", "cursantes"].includes(body.tabla) || typeof body.motivo !== "string" || body.motivo.trim().length < 5 || body.motivo.length > 500) return reply(400, { ok: false, error: "Contraseña, cuenta destino y motivo requeridos" });
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count, error: rateError } = await sb.from("auth_intentos").select("id", { count: "exact", head: true }).eq("ci", OWNER_CI).eq("exitoso", false).eq("motivo", "soporte_credenciales_invalidas").gte("timestamp_ms", since);
    if (rateError) return reply(503, { ok: false, error: "No se pudo verificar el límite de intentos" });
    if ((count || 0) >= 5) return reply(429, { ok: false, error: "Esperá 10 minutos antes de volver a intentar" });
    const { data: actor, error: actorError } = await sb.from("profesores").select("id,ci,activo,rol,password_hash").eq("id", OWNER_ID).eq("ci", OWNER_CI).maybeSingle();
    if (actorError) return reply(503, { ok: false, error: "No se pudo verificar la cuenta de soporte" });
    if (!actor || actor.activo !== true || actor.rol !== "ciencia_tecnologia" || typeof actor.password_hash !== "string" || !actor.password_hash.startsWith("$2")) return reply(403, { ok: false, error: "Cuenta de soporte no habilitada" });
    const { data: valid, error: passwordError } = await sb.rpc("verificar_password", { p_hash: actor.password_hash, p_password: body.password });
    if (passwordError) return reply(503, { ok: false, error: "No se pudo verificar la contraseña" });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconocida";
    const userAgent = req.headers.get("user-agent") || "desconocido";
    if (valid !== true) {
      const { error } = await sb.from("auth_intentos").insert({ ci: OWNER_CI, ip, user_agent: userAgent, exitoso: false, motivo: "soporte_credenciales_invalidas" });
      return error ? reply(503, { ok: false, error: "No se pudo registrar el intento" }) : reply(401, { ok: false, error: "Contraseña personal incorrecta" });
    }
    const columns = body.tabla === "profesores" ? "id,ci,nombre_completo,rol,activo" : "id,ci,nombre_completo,activo";
    const { data: targets, error: targetError } = await sb.from(body.tabla).select(columns).eq("ci", body.ci.trim()).limit(2);
    if (targetError) return reply(503, { ok: false, error: "No se pudo consultar la cuenta destino" });
    const active = (targets || []).filter((t: any) => t.activo !== false);
    if (active.length !== 1 || targets.length !== 1) return reply(409, { ok: false, error: "Cuenta inexistente, inactiva o CI duplicado" });
    const target = active[0];
    if (body.tabla === "profesores" && target.id === OWNER_ID) return reply(400, { ok: false, error: "Ya estás en tu propia cuenta" });
    const token = crypto.randomUUID();
    const expira_en = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { error: insertError } = await sb.from("sesiones").insert({ token, usuario_id: target.id, usuario_ci: target.ci, usuario_tabla: body.tabla, usuario_rol: body.tabla === "cursantes" ? "cursante" : target.rol || "profesor", ip, user_agent: userAgent, expira_en, revocado: false, es_master: false, soporte_actor_id: OWNER_ID, soporte_actor_ci: OWNER_CI, soporte_motivo: body.motivo.trim() });
    if (insertError) return reply(503, { ok: false, error: "No se pudo registrar la sesión de soporte" });
    return reply(200, { ok: true, token, expira_en, usuario: { id: target.id, ci: target.ci, nombre_completo: target.nombre_completo, rol: body.tabla === "cursantes" ? "cursante" : target.rol || "profesor", tabla: body.tabla } });
  } catch {
    return reply(400, { ok: false, error: "Solicitud inválida" });
  }
});
