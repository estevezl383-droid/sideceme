// Paquetes cifrados: valida sesión y permisos existentes antes de entregar la clave.
// Autenticación propia SIDECEME; JWT OFF. Claves solo en tabla privada.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();

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


Deno.serve(async (req: Request) => {
  const headers = { ...corsHeaders, "Cache-Control": "no-store, private" };
  const reply = (body: object, status = 200) => new Response(JSON.stringify(body), {status, headers});
  if (req.method === "OPTIONS") return new Response("ok", {headers});
  if (req.method !== "POST") return reply({ok:false,error:"Método no permitido"},405);
  try {
    const raw = await req.text();
    if (raw.length > 4096) return reply({ok:false,error:"Pedido demasiado grande"},413);
    const body = JSON.parse(raw);
    if (typeof body.token !== "string" || body.token.length > 1024 ||
        typeof body.paquete !== "string" || !/^[a-z0-9-]{1,100}$/.test(body.paquete) ||
        typeof body.manifest_sha256 !== "string" || !/^[a-f0-9]{64}$/.test(body.manifest_sha256)) {
      return reply({ok:false,error:"Pedido inválido"},400);
    }
    const ses = await validarSesion(body.token);
    if (!ses) return reply({ok:false,error:"Sesión no válida. Volvé a entrar a SIDECEME."},403);
    if (!await puedeUsar(ses)) return reply({ok:false,error:MENSAJE_SIN_ACCESO},403);
    const {data: rows, error} = await sb.from("calcos_paquetes")
      .select("id,manifest_sha256,clave_b64,activo").eq("id",body.paquete).eq("activo",true).limit(1);
    if(error) return reply({ok:false,error:"El servicio de paquetes todavía no está disponible."},503);
    const p=rows?.[0];
    if(!p || p.manifest_sha256 !== body.manifest_sha256) return reply({ok:false,error:"Paquete no reconocido, modificado o retirado."},403);
    const {data: sessions, error: sessionError} = await sb.from("sesiones").select("expira_en,revocado").eq("token",body.token).limit(1);
    const live=sessions?.[0];const until=Math.min(Date.parse(live?.expira_en||""),Date.now()+4*3600*1000);
    if(sessionError || !live || live.revocado || !Number.isFinite(until) || until<=Date.now()) return reply({ok:false,error:"La sesión venció."},403);
    return reply({ok:true,manifest_sha256:p.manifest_sha256,key:p.clave_b64,expires:new Date(until).toISOString()});
  } catch {
    return reply({ok:false,error:"No se pudo validar el paquete. Reintentá con conexión."},400);
  }
});

