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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { token, sancion } = await req.json();

    if (!token || !sancion) {
      return new Response(
        JSON.stringify({ ok: false, error: "token y sancion requeridos" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Verificar sesión activa
    const { data: sesiones, error: sesErr } = await sb
      .from("sesiones")
      .select("usuario_id, usuario_tabla, expira_en, revocado")
      .eq("token", token)
      .limit(1);

    if (sesErr || !sesiones || sesiones.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Sesión no válida. Volvé a iniciar sesión." }),
        { status: 401, headers: corsHeaders }
      );
    }

    const sesion = sesiones[0];

    if (sesion.revocado || new Date(sesion.expira_en) < new Date()) {
      return new Response(
        JSON.stringify({ ok: false, error: "Sesión expirada. Volvé a iniciar sesión." }),
        { status: 401, headers: corsHeaders }
      );
    }

    if (sesion.usuario_tabla !== "profesores") {
      return new Response(
        JSON.stringify({ ok: false, error: "Solo profesores pueden registrar sanciones." }),
        { status: 403, headers: corsHeaders }
      );
    }

    // S002 es personal de apoyo de Planificación y no tiene función docente.
    if (String(sesion.usuario_id) === "S002") return new Response(
      JSON.stringify({ok:false,error:"Su cuenta de Planificación no está autorizada para registrar sanciones."}),
      {status:403,headers:corsHeaders}
    );
    // v2.9.367: el AUXILIAR DE CONSULTA de una Sección (solo_lectura) entra al panel
    // para ver la situación de disciplina e imprimir reportes, pero NO sanciona.
    // Va acá, en el servidor, y no solo en la pantalla: ocultar el botón no impide
    // que alguien llame igual a esta función con su token.
    const { data: autor } = await sb
      .from("profesores")
      .select("activo, solo_lectura")
      .eq("id", sesion.usuario_id)
      .single();

    if (!autor || autor.activo === false) {
      return new Response(
        JSON.stringify({ ok: false, error: "Cuenta inactiva o no encontrada." }),
        { status: 403, headers: corsHeaders }
      );
    }

    if (autor.solo_lectura === true) {
      return new Response(
        JSON.stringify({ ok: false, error: "Tu cuenta es de AUXILIAR DE CONSULTA de la Sección: podés ver la situación de disciplina e imprimir los reportes, pero no registrar sanciones." }),
        { status: 403, headers: corsHeaders }
      );
    }

    // El profesor_id en la sanción debe coincidir con la sesión
    if (sancion.profesor_id && String(sancion.profesor_id) !== String(sesion.usuario_id)) {
      return new Response(
        JSON.stringify({ ok: false, error: "El profesor_id no coincide con tu sesión." }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Insertar con SERVICE_ROLE_KEY (bypasses RLS)
    const { data, error } = await sb.from("sanciones").insert(sancion).select();

    if (error) {
      // Pasar el error de Supabase tal cual para que el auto-heal del frontend funcione
      return new Response(
        JSON.stringify({ ok: false, error: error.message, details: error.details, hint: error.hint }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, data }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Error interno: " + ((err as Error).message || String(err)) }),
      { status: 500, headers: corsHeaders }
    );
  }
});

