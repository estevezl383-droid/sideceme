// ============================================================
// EDGE FUNCTION: calcos-datos   (v4 — curso exacto; C&T y Planificación)
//
// Sirve las capas geográficas del Generador de Calcos YA RECORTADAS
// por el área de interés, y decide QUIÉN puede usarlo.
//
// Acciones de datos:
//   - 'recortar' : {pais, capas[], aoi} -> { capa: FeatureCollection }
//   - 'capas'    : inventario por país
//   - 'permiso'  : ¿este usuario puede entrar? (lo consulta la app al abrir)
//
// Acciones de administración (SOLO Ciencia y Tecnología y Planificación):
//   - 'acceso_listar'  : reglas vigentes + valores disponibles para el panel
//   - 'acceso_guardar' : alta/actualización de una regla
//   - 'acceso_quitar'  : baja de una regla
//
// Tipos de regla: todos · profesores · ciclo · paralelo · ciclo_paralelo ·
// mencion · persona. `ciclo_paralelo` guarda 'CICLO|PARALELO' (p. ej.
// '1ER CICLO|A'): habilita UN curso exacto, sea cual sea su tamaño.
// `paralelo` compara solo la letra y abarca esa letra en todos los ciclos.
//
// Auth: token de sesión de SIDECEME (tabla 'sesiones'). JWT: OFF.
// Usa service_role: las tablas calcos_* NO tienen políticas y el
// navegador no las puede tocar. Mismo patrón que wg_replays.
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
const err = (msg: string, status = 400, extra?: object) =>
  new Response(JSON.stringify({ ok: false, error: msg, ...extra }), { status, headers: corsHeaders });

// Ciencia y Tecnología y Planificación administran y entran siempre: no
// pueden autoexcluirse y quedarse sin forma de volver a habilitarse. Cuenta
// el rol principal o uno extra en `roles` (doble función); los auxiliares no.
const ADMINISTRAN = ["ciencia_tecnologia", "jefe_planificacion"];

const TIPOS = ["todos", "profesores", "ciclo", "paralelo", "ciclo_paralelo", "mencion", "persona"];

// Separador de 'CICLO|PARALELO' en las reglas ciclo_paralelo.
const SEP = "|";

const MENSAJE_SIN_ACCESO =
  "El Generador de Calcos está habilitado por Ciencia y Tecnología solo para " +
  "fines de ejercicios. Tu curso todavía no está habilitado. Si lo necesitás " +
  "para una actividad, solicitalo a la Sección de Ciencia y Tecnología o a Planificación.";

type Sesion = {
  id: string; tabla: "cursantes" | "profesores"; rol: string; nombre: string;
  roles: string[]; auxiliar: boolean;
  ciclo: string; paralelo: string; mencion: string;
};

async function validarSesion(token: string): Promise<Sesion | null> {
  const { data: ses } = await sb.from("sesiones")
    .select("usuario_id, usuario_tabla, expira_en, revocado")
    .eq("token", token).limit(1);
  if (!ses || !ses.length) return null;
  const s = ses[0];
  if (s.revocado || new Date(s.expira_en) < new Date()) return null;

  if (s.usuario_tabla === "profesores") {
    const { data: p } = await sb.from("profesores")
      .select("nombre_completo, rol, roles, es_auxiliar, activo").eq("id", s.usuario_id).limit(1);
    if (!p || !p.length || p[0].activo === false) return null;
    return {
      id: s.usuario_id, tabla: "profesores", rol: p[0].rol || "",
      nombre: p[0].nombre_completo || "",
      roles: Array.isArray(p[0].roles) ? p[0].roles : [], auxiliar: p[0].es_auxiliar === true,
      ciclo: "", paralelo: "", mencion: "",
    };
  }
  if (s.usuario_tabla === "cursantes") {
    const { data: c } = await sb.from("cursantes")
      .select("nombre_completo, activo, ciclo, paralelo, mencion").eq("id", s.usuario_id).limit(1);
    if (!c || !c.length || c[0].activo === false) return null;
    return {
      id: s.usuario_id, tabla: "cursantes", rol: "", nombre: c[0].nombre_completo || "",
      roles: [], auxiliar: false,
      ciclo: c[0].ciclo || "", paralelo: c[0].paralelo || "", mencion: c[0].mencion || "",
    };
  }
  return null;
}

// "Logística" y "LOGISTICA" tienen que coincidir: se comparan sin
// tildes, sin espacios de sobra y en mayúsculas.
const norm = (s: string) =>
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

function administra(rol: string, roles: unknown, auxiliar: boolean): boolean {
  if (auxiliar) return false;
  const todos = [rol, ...(Array.isArray(roles) ? roles : [])].map((r) => String(r || "").toLowerCase());
  return todos.some((r) => ADMINISTRAN.includes(r));
}

function esAdmin(ses: Sesion): boolean {
  return ses.tabla === "profesores" && administra(ses.rol, ses.roles, ses.auxiliar);
}

async function puedeUsar(ses: Sesion): Promise<boolean> {
  if (esAdmin(ses)) return true;
  const { data: reglas } = await sb.from("calcos_acceso")
    .select("tipo, valor").eq("activo", true);
  if (!reglas || !reglas.length) return false;

  for (const r of reglas) {
    if (r.tipo === "todos") return true;
    if (r.tipo === "profesores" && ses.tabla === "profesores") return true;
    if (r.tipo === "persona" && r.valor === ses.id) return true;
    if (ses.tabla === "cursantes") {
      if (r.tipo === "ciclo" && norm(r.valor) === norm(ses.ciclo)) return true;
      if (r.tipo === "paralelo" && norm(r.valor) === norm(ses.paralelo)) return true;
      if (r.tipo === "mencion" && norm(r.valor) === norm(ses.mencion)) return true;
      if (r.tipo === "ciclo_paralelo") {
        const [ciclo, paralelo] = String(r.valor || "").split(SEP);
        if (norm(ciclo) === norm(ses.ciclo) && norm(paralelo) === norm(ses.paralelo)) return true;
      }
    }
  }
  return false;
}

// Cota de seguridad: un área de interés no puede ser el país entero.
const LADO_MAX_GRADOS = 4;

function areaRazonable(aoi: any): string | null {
  const coords: number[][] = [];
  const juntar = (g: any) => {
    if (!g || !g.coordinates) return;
    const plano = (a: any): void => {
      if (typeof a[0] === "number") { coords.push(a as number[]); return; }
      for (const x of a) plano(x);
    };
    plano(g.coordinates);
  };
  if (aoi.type === "FeatureCollection") for (const f of aoi.features || []) juntar(f.geometry);
  else if (aoi.type === "Feature") juntar(aoi.geometry);
  else juntar(aoi);

  if (!coords.length) return "El área de interés no tiene geometría";
  const lons = coords.map((c) => c[0]), lats = coords.map((c) => c[1]);
  if (Math.max(...lons) - Math.min(...lons) > LADO_MAX_GRADOS ||
      Math.max(...lats) - Math.min(...lats) > LADO_MAX_GRADOS)
    return "El área de interés es demasiado grande. Achicala y volvé a intentar.";
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Método no permitido", 405);

  let body: any;
  try { body = await req.json(); } catch { return err("JSON inválido"); }

  const { accion, token } = body;
  if (!token) return err("Token requerido");
  const ses = await validarSesion(token);
  if (!ses) return err("Sesión no válida. Volvé a entrar.", 403);

  // ---------- ¿puedo entrar? (la app lo pregunta al abrir) ----------
  if (accion === "permiso") {
    return ok({
      permitido: await puedeUsar(ses),
      administra: esAdmin(ses),
      mensaje: MENSAJE_SIN_ACCESO,
      nombre: ses.nombre,
    });
  }

  // ============ ADMINISTRACIÓN (solo C&T y Planificación) ============
  if (accion === "acceso_listar" || accion === "acceso_guardar" || accion === "acceso_quitar") {
    if (!esAdmin(ses))
      return err("Solo Ciencia y Tecnología o Planificación administran el acceso al Generador.", 403);

    if (accion === "acceso_listar") {
      const { data: reglas } = await sb.from("calcos_acceso")
        .select("id, tipo, valor, activo, nota, creado_por, creado_en")
        .order("tipo").order("valor");

      // Las reglas `persona` guardan un id: el panel muestra el nombre.
      const ids = (reglas || []).filter((r: any) => r.tipo === "persona" && r.valor).map((r: any) => r.valor);
      const nombres: Record<string, string> = {};
      if (ids.length) {
        const [{ data: cs }, { data: ps }] = await Promise.all([
          sb.from("cursantes").select("id, nombre_completo").in("id", ids),
          sb.from("profesores").select("id, nombre_completo").in("id", ids),
        ]);
        for (const x of [...(cs || []), ...(ps || [])]) nombres[x.id] = x.nombre_completo || x.id;
      }

      // Valores reales del curso, para que el panel ofrezca opciones ciertas,
      // con cuántos cursantes activos entran por cada una.
      const { data: cur } = await sb.from("cursantes")
        .select("ciclo, paralelo, mencion").eq("activo", true).limit(2000);
      const conteos: Record<string, Record<string, number>> = {
        ciclo: {}, paralelo: {}, ciclo_paralelo: {}, mencion: {},
      };
      const sumar = (tipo: string, v: string) => {
        if (v) conteos[tipo][v] = (conteos[tipo][v] || 0) + 1;
      };
      for (const c of cur || []) {
        const ciclo = (c.ciclo || "").trim(), paralelo = (c.paralelo || "").trim();
        sumar("ciclo", ciclo);
        sumar("paralelo", paralelo);
        sumar("mencion", (c.mencion || "").trim());
        if (ciclo && paralelo) sumar("ciclo_paralelo", ciclo + SEP + paralelo);
      }
      const valores = (tipo: string) => Object.keys(conteos[tipo]).sort();

      // Profesores para habilitar uno por uno (los que dirigen el ejercicio).
      // Los que administran no figuran: entran siempre.
      const { data: profs } = await sb.from("profesores")
        .select("id, nombre_completo, rol, roles, es_auxiliar, activo").order("nombre_completo");
      const profesores = (profs || [])
        .filter((p: any) => p.activo !== false && !administra(p.rol, p.roles, p.es_auxiliar === true))
        .map((p: any) => ({ id: p.id, nombre: p.nombre_completo || p.id, rol: p.rol || "" }));

      return ok({
        reglas: (reglas || []).map((r: any) =>
          r.tipo === "persona" ? { ...r, nombre: nombres[r.valor] || null } : r),
        opciones: {
          ciclo: valores("ciclo"),
          paralelo: valores("paralelo"),
          ciclo_paralelo: valores("ciclo_paralelo"),
          mencion: valores("mencion"),
          profesores,
        },
        conteos,
      });
    }

    if (accion === "acceso_guardar") {
      const tipo = String(body.tipo || "");
      if (!TIPOS.includes(tipo)) return err("Tipo de regla no válido");
      const valor = ["todos", "profesores"].includes(tipo) ? null : String(body.valor || "").trim();
      if (valor === "") return err("Falta el valor de la regla");
      if (tipo === "ciclo_paralelo") {
        const partes = String(valor).split(SEP);
        if (partes.length !== 2 || !partes[0].trim() || !partes[1].trim())
          return err("La regla de curso va como 'CICLO|PARALELO', p. ej. '1ER CICLO|A'");
      }
      if (tipo === "persona") {
        const [{ data: c }, { data: p }] = await Promise.all([
          sb.from("cursantes").select("id").eq("id", valor).limit(1),
          sb.from("profesores").select("id").eq("id", valor).limit(1),
        ]);
        if (!(c && c.length) && !(p && p.length)) return err("No existe nadie con ese id");
      }
      const { error } = await sb.from("calcos_acceso").upsert({
        tipo, valor,
        activo: body.activo !== false,
        nota: body.nota ? String(body.nota).slice(0, 200) : null,
        creado_por: ses.nombre,
      }, { onConflict: "tipo,valor" });
      if (error) return err(error.message, 500);
      return ok();
    }

    if (accion === "acceso_quitar") {
      if (!body.id) return err("Falta el id de la regla");
      const { error } = await sb.from("calcos_acceso").delete().eq("id", body.id);
      if (error) return err(error.message, 500);
      return ok();
    }
  }

  // ================= DATOS (requieren habilitación) =================
  if (!(await puedeUsar(ses)))
    return err(MENSAJE_SIN_ACCESO, 403, { codigo: "sin_acceso" });

  if (accion === "capas") {
    const { data, error } = await sb.rpc("calcos_inventario");
    if (error) return err(error.message, 500);
    return ok({ inventario: data || [] });
  }

  if (accion === "recortar") {
    const pais = String(body.pais || "").trim();
    const capas: string[] = Array.isArray(body.capas) ? body.capas.map(String) : [];
    const aoi = body.aoi;

    if (!pais) return err("Falta el país");
    if (!capas.length) return err("No pediste ninguna capa");
    if (!aoi || typeof aoi !== "object") return err("Falta el área de interés");

    const problema = areaRazonable(aoi);
    if (problema) return err(problema);

    // zoom 22 = sin escalera, sale TODO lo que hay dentro del área.
    const { data, error } = await sb.rpc("calcos_recortar", {
      p_pais: pais, p_capas: capas, p_aoi: aoi,
      p_zoom: Number.isFinite(body.zoom) ? Number(body.zoom) : 22,
      p_max_features: 0,
    });
    if (error) return err(error.message, 500);

    const salida: Record<string, unknown> = {};
    for (const capa of capas) {
      salida[capa] = (data && (data as any)[capa]) || { type: "FeatureCollection", features: [] };
    }
    return ok({ capas: salida });
  }

  return err("Acción no reconocida");
});
