// ============================================================
// EDGE FUNCTION: eem-ops   (Fase 1 — Evaluacion Sumativa EEM)
//
// Todo lo que NO es subir ni bajar el archivo: la Carpeta de Evaluacion del
// alumno, el tablero del Evaluador y el modo supervision de C&T.
//
// Quien es quien (lo resuelve la base, no esta funcion):
//   fn_eem_rol_en_carpeta -> 'supervisor' | 'evaluador' | 'tribunal' | null
// El Tribunal TODAVIA no ve nada: llega en la Fase 4.
//
// Toda escritura pasa por los envoltorios fn_eem_f1_*, que fijan el actor
// (y el modo 'supervision') en la MISMA transaccion, para que eem_auditoria
// sepa quien fue.
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

type Sesion = { id: string; tabla: "cursantes" | "profesores"; rol: string; nombre: string; grado: string };

async function validarSesion(token: string): Promise<Sesion | null> {
  const { data: ses } = await sb.from("sesiones")
    .select("usuario_id, usuario_tabla, expira_en, revocado")
    .eq("token", token).limit(1);
  if (!ses || !ses.length) return null;
  const s = ses[0];
  if (s.revocado || new Date(s.expira_en) < new Date()) return null;

  if (s.usuario_tabla === "profesores") {
    const { data: p } = await sb.from("profesores")
      .select("nombre_completo, grado, rol, activo").eq("id", s.usuario_id).limit(1);
    if (!p || !p.length || p[0].activo === false) return null;
    return { id: s.usuario_id, tabla: "profesores", rol: p[0].rol || "",
             nombre: p[0].nombre_completo || "", grado: p[0].grado || "" };
  }
  const { data: c } = await sb.from("cursantes")
    .select("nombre_completo, grado, activo").eq("id", s.usuario_id).limit(1);
  if (!c || !c.length || c[0].activo === false) return null;
  return { id: s.usuario_id, tabla: "cursantes", rol: "",
           nombre: c[0].nombre_completo || "", grado: c[0].grado || "" };
}

const ipDe = (req: Request) =>
  (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
  req.headers.get("x-real-ip") || "";

async function rolEnCarpeta(profesor: string, carpeta: string): Promise<string | null> {
  const { data } = await sb.rpc("fn_eem_rol_en_carpeta", { p_profesor: profesor, p_carpeta: carpeta });
  return (data as string) || null;
}
async function esSupervisor(profesor: string): Promise<boolean> {
  const { data } = await sb.rpc("fn_eem_es_supervisor", { p_profesor: profesor });
  return data === true;
}
// Compatibilidad con la pantalla EEM publicada: nom() muestra grado + nombre.
// Solo se compone la etiqueta de la respuesta; el grado de la base NO cambia.
function gradoConArma(grado: unknown, arma: unknown): string {
  const g = String(grado || "").trim();
  const a = String(arma || "").trim();
  if (!a) return g;
  const normal = (v: string) => v.toLowerCase().replace(/[.\s]/g, "");
  return normal(g).endsWith(normal(a)) ? g : [g, a].filter(Boolean).join(" ");
}
async function roster(carpeta: string): Promise<any[]> {
  const { data, error } = await sb.rpc("fn_eem_roster_carpeta", { p_carpeta: carpeta });
  if (error) throw new Error(error.message);
  const filas = (data || []) as any[];
  const {data: escritos,error:errorEscritos}=await sb.rpc("fn_eem_resultados_escrito",{p_carpeta:carpeta});
  if(errorEscritos) throw new Error(errorEscritos.message);
  const porAlumno=new Map((escritos||[]).map((x:any)=>[x.cursante_id,x.escrito]));
  for(const fila of filas) fila.escrito=porAlumno.get(fila.cursante_id)||null;
  const ids = [...new Set(filas.map(r => r.cursante_id).filter(Boolean))];
  if (!ids.length) return filas;
  const { data: personas, error: errorArmas } = await sb.from("cursantes")
    .select("id, arma").in("id", ids);
  if (errorArmas) throw new Error(errorArmas.message);
  const entregaIds = [...new Set(filas.map(r=>r.entrega_id).filter(Boolean))];
  const enlaces = new Map<string,string>();
  if(entregaIds.length){
    const {data: entregas, error: errorEnlaces} = await sb.from("eem_entregas").select("id, enlace_complementario").in("id",entregaIds);
    if(errorEnlaces) throw new Error(errorEnlaces.message);
    for(const e of entregas || []) enlaces.set(e.id,e.enlace_complementario);
  }
  const armas = new Map((personas || []).map((p: any) => [p.id, p.arma]));
  return filas.map(r => ({...r, enlace_complementario:enlaces.get(r.entrega_id)||null, grado_base: r.grado, arma: armas.get(r.cursante_id) || "",
    grado: gradoConArma(r.grado, armas.get(r.cursante_id))}));
}
async function nombresProfesores(ids: string[]): Promise<Record<string, string>> {
  const limpios = Array.from(new Set(ids.filter(Boolean)));
  if (!limpios.length) return {};
  const { data } = await sb.from("profesores").select("id, grado, nombre_completo").in("id", limpios);
  const m: Record<string, string> = {};
  for (const p of data || []) m[p.id] = `${p.grado || ""} ${p.nombre_completo || ""}`.trim();
  return m;
}
async function nombresCursantes(ids: string[]): Promise<Record<string, string>> {
  const limpios = Array.from(new Set(ids.filter(Boolean)));
  if (!limpios.length) return {};
  const { data } = await sb.from("cursantes").select("id, grado, nombre_completo").in("id", limpios);
  const m: Record<string, string> = {};
  for (const c of data || []) m[c.id] = `${c.grado || ""} ${c.nombre_completo || ""}`.trim();
  return m;
}

async function pesos(rubrica:string){
 const {data}=await sb.from('eem_rubrica_items').select('bloque,valor_pct').eq('rubrica_id',rubrica);
 const p={FORMA:0,FONDO:0,EXPOSICION:0}; for(const i of data||[])p[i.bloque]+=Number(i.valor_pct); return {...p,texto:p.FORMA+p.FONDO};
}
async function autogrupo(perfil:string){const {data}=await sb.from('eem_perfiles_forma').select('perfil').eq('id',perfil).limit(1);return data?.[0]?.perfil?.entrega_autogrupo===true;}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Metodo no permitido", 405);

  let body: any;
  try { body = await req.json(); } catch { return err("JSON invalido"); }

  const { accion, token } = body;
  if (!token) return err("Token requerido");
  const ses = await validarSesion(token);
  if (!ses) return err("Sesion no valida. Volve a entrar.", 403);

  const ip = ipDe(req);

  // ===================================================================
  // ALUMNO — "Mis evaluaciones y exposiciones"
  // ===================================================================
  if (accion === "mis_carpetas") {
    if (ses.tabla !== "cursantes") return err("Esta vista es del alumno.", 403);

    const { data: cur } = await sb.from("cursantes")
      .select("ciclo, paralelo").eq("id", ses.id).limit(1);
    if (!cur || !cur.length) return err("No encuentro tu ficha de cursante.", 404);
    const miCiclo = String(cur[0].ciclo || "");
    const miParalelo = String(cur[0].paralelo || "");

    const { data: cps } = await sb.from("eem_carpetas_clase").select("*")
      .order("creado_en", { ascending: false }).limit(50);
    const mias = (cps || []).filter((c: any) => {
      const txt = c.ciclo === 1 ? "1ER CICLO" : c.ciclo === 2 ? "2DO CICLO" : c.ciclo === 3 ? "3ER CICLO" : "";
      return txt === miCiclo && (!c.paralelo || c.paralelo === miParalelo);
    });
    const profes = await nombresProfesores(mias.map((c: any) => c.evaluador_id));

    const salida: any[] = [];
    for (const cp of mias) {
      const filas = await roster(cp.id);
      const yo = filas.find((r) => r.cursante_id === ses.id);
      const companeros = yo && yo.grupo_id
        ? filas.filter((r) => r.grupo_id === yo.grupo_id).map((r) => ({
            cursante_id: r.cursante_id, grado: r.grado,
            nombre_completo: r.nombre_completo, es_jefe: r.es_jefe }))
        : [];

      let entrega: any = null, intentos: any[] = [];
      if (yo && yo.grupo_id) {
        const { data: ents } = await sb.from("eem_entregas")
          .select("id, archivo_nombre, enlace_complementario, sha256, tamano_bytes, entregado_en, entregado_por, numero_intento, fuera_de_plazo, retraso_minutos, vigente, estado")
          .eq("grupo_id", yo.grupo_id).order("numero_intento", { ascending: false });
        intentos = ents || [];
        entrega = intentos.find((e: any) => e.vigente && e.estado !== "anulada") || null;
        const quienes = await nombresCursantes(intentos.map((e: any) => e.entregado_por));
        for (const e of intentos) e.entregado_por_nombre = quienes[e.entregado_por] || e.entregado_por;
        if (entrega) entrega.entregado_por_nombre = quienes[entrega.entregado_por] || entrega.entregado_por;
      }

      // Nota: SOLO si esta publicada. Antes de eso el alumno no ve nada.
      const { data: acta } = await sb.from("v_eem_acta_individual")
        .select("nota_grupal_65, nota_individual_35, nota_total, publicada, publicada_en")
        .eq("carpeta_id", cp.id).eq("cursante_id", ses.id).limit(1);
      const nota = acta && acta.length && acta[0].publicada ? acta[0] : null;

      salida.push({
        carpeta: {
          id: cp.id, materia_nombre: cp.materia_nombre, ciclo: cp.ciclo,
          paralelo: cp.paralelo, gestion: cp.gestion, estado: cp.estado,
          fecha_limite: cp.fecha_limite,
          pesos: await pesos(cp.rubrica_id),
          entrega_autogrupo: await autogrupo(cp.perfil_forma_id),
          evaluador: profes[cp.evaluador_id] || cp.evaluador_id,
        },
        grupo: yo && yo.grupo_id
          ? { id: yo.grupo_id, numero: yo.grupo_numero, nombre: yo.grupo_nombre, tema: yo.grupo_tema }
          : null,
        integrantes: companeros,
        entrega: yo && yo.entrega_id ? entrega : null, intentos,
        tardia_habilitada: !!(yo && yo.tardia_habilitada),
        escrito: yo?.escrito?.publicada ? yo.escrito : null,
        nota,
      });
    }
    return ok({ carpetas: salida, yo: { id: ses.id, nombre: ses.nombre, grado: ses.grado } });
  }

  // ===================================================================
  // De aca para abajo, cuerpo docente
  // ===================================================================
  if (ses.tabla !== "profesores") return err("Vista reservada al cuerpo docente.", 403);
  const supervisor = await esSupervisor(ses.id);

  if (accion === "carpetas") {
    const { data: cps } = await sb.from("eem_carpetas_clase").select("*")
      .order("creado_en", { ascending: false }).limit(200);
    let lista = cps || [];
    if (!supervisor) {
      const { data: m } = await sb.from("eem_carpeta_miembros")
        .select("carpeta_id").eq("profesor_id", ses.id).eq("activo", true);
      const habilitadas = new Set((m || []).map((x: any) => x.carpeta_id));
      lista = lista.filter((c: any) => c.evaluador_id === ses.id || habilitadas.has(c.id));
    }
    const profes = await nombresProfesores(lista.map((c: any) => c.evaluador_id));
    const salida = [];
    for (const c of lista) {
      const filas = await roster(c.id);
      const conEntrega = new Set(filas.filter((r) => r.entrega_id).map((r) => r.entrega_id));
      salida.push({
        ...c,
        pesos: await pesos(c.rubrica_id),
        evaluador_nombre: profes[c.evaluador_id] || c.evaluador_id,
        mi_rol: await rolEnCarpeta(ses.id, c.id),
        alumnos: filas.length,
        sin_grupo: filas.filter((r) => !r.grupo_id).length,
        entregas: conEntrega.size,
      });
    }
    const { data: rubricas } = await sb.from("eem_rubricas")
      .select("id, materia_nombre, ciclo, gestion, version, estado").order("creado_en", { ascending: false });
    const { data: perfiles } = await sb.from("eem_perfiles_forma")
      .select("id, nombre, version, estado").order("creado_en", { ascending: false });
    return ok({ carpetas: salida, supervisor, rubricas: rubricas || [], perfiles: perfiles || [],
                yo: { id: ses.id, nombre: `${ses.grado || ""} ${ses.nombre}`.trim() } });
  }

  // Abrir una carpeta de evaluacion para otra materia. Cualquier docente puede
  // abrir la suya (queda el como evaluador); solo el supervisor puede abrirla
  // a nombre de otro.
  if (accion === "carpeta_crear") {
    if(body.fecha_limite && !Number.isFinite(new Date(body.fecha_limite).getTime()))return err('Fecha límite inválida.');
    const evaluador = String(body.evaluador_id || ses.id);
    if (evaluador !== ses.id && !supervisor) {
      return err("Solo Ciencia y Tecnologia puede abrir una carpeta a nombre de otro docente.", 403);
    }
    const { data, error } = await sb.rpc("fn_eem_f1_carpeta_crear", {
      p_materia: String(body.materia || ""),
      p_codigo: body.codigo || null,
      p_ciclo: Number(body.ciclo || 0),
      p_paralelo: body.paralelo || null,
      p_gestion: Number(body.gestion || new Date().getFullYear()),
      p_evaluador: evaluador,
      p_rubrica: body.rubrica_id || null,
      p_perfil: body.perfil_id || null,
      p_actor: ses.id, p_rol: ses.rol || "profesor", p_ip: ip,
      p_modo: (supervisor && body.supervision === true) ? "supervision" : "normal",
    });
    if (error) return err(error.message, 400);
    if(body.fecha_limite){
      const {error:plazoError}=await sb.rpc('fn_eem_f1_carpeta_config',{p_carpeta:data,p_fecha_limite:body.fecha_limite,p_estado:null,p_permite_tardias:false,p_rubrica:null,p_perfil:null,p_actor:ses.id,p_rol:ses.rol||'profesor',p_ip:ip,p_modo:'normal'});
      if(plazoError)return err(plazoError.message,400);
    }
    return ok({ carpeta_id: data });
  }

  const carpetaId = String(body.carpeta_id || "");
  if (!carpetaId) return err("Falta carpeta_id");
  const miRol = await rolEnCarpeta(ses.id, carpetaId);
  if (!miRol) return err("No estas habilitado en esta carpeta de evaluacion.", 403);

  // El supervisor que entra "como evaluador" deja marcado el modo en la auditoria.
  const modo = (supervisor && body.supervision === true) ? "supervision" : "normal";
  const puedeAdministrar = miRol === "evaluador" || miRol === "supervisor";
  const rolBase = ses.rol || "profesor";

  if (accion === "panel") {
    const { data: cps } = await sb.from("eem_carpetas_clase").select("*").eq("id", carpetaId).limit(1);
    if (!cps || !cps.length) return err("La carpeta no existe.", 404);
    const cp = cps[0];
    cp.pesos = await pesos(cp.rubrica_id);

    const filas = await roster(carpetaId);
    const { data: grupos } = await sb.from("eem_grupos")
      .select("id, numero, nombre, tema").eq("carpeta_id", carpetaId).order("numero");
    const { data: rub } = await sb.from("eem_rubricas").select("*").eq("id", cp.rubrica_id).limit(1);
    const { data: perf } = await sb.from("eem_perfiles_forma").select("*").eq("id", cp.perfil_forma_id).limit(1);
    const { data: bandas } = await sb.from("eem_bandas_nota").select("*")
      .eq("carpeta_id", carpetaId).order("fijada_en", { ascending: false });
    const { data: miembros } = await sb.from("eem_carpeta_miembros").select("*")
      .eq("carpeta_id", carpetaId).eq("rol", "tribunal").eq("activo", true);
    const profes = await nombresProfesores([...(miembros || []).map((m: any) => m.profesor_id), cp.evaluador_id]);
    const quienes = await nombresCursantes(filas.map((r) => r.entregado_por));
    for (const r of filas) r.entregado_por_nombre = quienes[r.entregado_por] || r.entregado_por;

    const entregas = new Set(filas.filter((r) => r.entrega_id).map((r) => r.entrega_id));
    const gruposConEntrega = new Set(filas.filter((r) => r.entrega_id).map((r) => r.grupo_id));
    const vencio = !!(cp.fecha_limite && new Date() > new Date(cp.fecha_limite));

    return ok({
      carpeta: { ...cp, evaluador_nombre: profes[cp.evaluador_id] || cp.evaluador_id, vencio },
      mi_rol: miRol, supervisor, modo,
      rubrica: rub && rub.length ? rub[0] : null,
      perfil: perf && perf.length ? perf[0] : null,
      bandas: bandas || [],
      banda_activa: (bandas || []).find((b: any) => b.activa && b.aplicar_a === "texto_65") || null,
      tribunal: (miembros || []).map((m: any) => ({ ...m, nombre: profes[m.profesor_id] || m.profesor_id })),
      grupos: (grupos || []).map((g: any) => ({
        ...g,
        integrantes: filas.filter((r) => r.grupo_id === g.id).map((r) => ({
          cursante_id: r.cursante_id, grado: r.grado, nombre_completo: r.nombre_completo,
          paralelo: r.paralelo, es_jefe: r.es_jefe })),
        entrega: filas.find((r) => r.grupo_id === g.id && r.entrega_id) || null,
      })),
      roster: filas,
      contadores: {
        alumnos: filas.length,
        grupos: (grupos || []).length,
        sin_grupo: filas.filter((r) => !r.grupo_id).length,
        entregados: entregas.size,
        grupos_con_entrega: gruposConEntrega.size,
        grupos_sin_entrega: (grupos || []).length - gruposConEntrega.size,
        alumnos_con_entrega: filas.filter((r) => r.entrega_id).length,
        alumnos_sin_entrega: filas.filter((r) => !r.entrega_id).length,
        tardias: filas.filter((r) => r.fuera_de_plazo).length,
        tardias_habilitadas: filas.filter((r) => r.tardia_habilitada).length,
      },
    });
  }

  if (accion === "intentos") {
    const grupoId = String(body.grupo_id || "");
    if (!grupoId) return err("Falta grupo_id");
    const { data } = await sb.from("eem_entregas").select("*")
      .eq("grupo_id", grupoId).order("numero_intento", { ascending: false });
    const quienes = await nombresCursantes((data || []).map((e: any) => e.entregado_por));
    return ok({ intentos: (data || []).map((e: any) => ({ ...e, entregado_por_nombre: quienes[e.entregado_por] || e.entregado_por })) });
  }

  if (accion === "profesores_buscar") {
    const q = String(body.q || "").trim();
    let sel = sb.from("profesores").select("id, grado, nombre_completo, rol").eq("activo", true)
      .order("nombre_completo").limit(40);
    if (q) sel = sel.ilike("nombre_completo", `%${q}%`);
    const { data } = await sel;
    return ok({ profesores: data || [] });
  }

  if (accion === "auditoria") {
    if (!puedeAdministrar) return err("Solo el Evaluador o el Supervisor ven la auditoria.", 403);
    // El Evaluador ve SOLO su carpeta. El Supervisor ve todo, o filtra por una.
    let q = sb.from("eem_auditoria").select("*")
      .order("timestamp_ms", { ascending: false }).limit(Number(body.limite) || 300);
    if (!supervisor || body.solo_esta_carpeta === true) {
      q = q.or(`registro_id.eq.${carpetaId},` +
               `datos_despues->>carpeta_id.eq.${carpetaId},` +
               `datos_antes->>carpeta_id.eq.${carpetaId}`);
    }
    if (body.tabla) q = q.eq("tabla", String(body.tabla));
    if (body.solo_supervision === true) q = q.eq("modo", "supervision");
    const { data, error } = await q;
    if (error) return err(error.message, 500);
    const actores = await nombresProfesores((data || []).map((a: any) => a.actor_id));
    return ok({ auditoria: (data || []).map((a: any) => ({ ...a, actor_nombre: actores[a.actor_id] || a.actor_id })) });
  }

  // ------------------- ESCRITURAS (solo Evaluador / Supervisor) -------------
  if (!puedeAdministrar) return err("Esta accion es del Evaluador de la carpeta.", 403);

  const comun = { p_actor: ses.id, p_rol: rolBase, p_ip: ip, p_modo: modo };

  if (accion === "grupo_guardar") {
    const { data, error } = await sb.rpc("fn_eem_f1_grupo_guardar", {
      p_carpeta: carpetaId, p_grupo: body.grupo_id || null,
      p_numero: body.numero === undefined || body.numero === null ? null : Number(body.numero),
      p_nombre: body.nombre || null, p_tema: body.tema || null, ...comun });
    if (error) return err(error.message, 400);
    return ok({ grupo_id: data });
  }

  if (accion === "grupo_asignar") {
    const cursante = String(body.cursante_id || "");
    if (!cursante) return err("Falta cursante_id");
    const { error } = await sb.rpc("fn_eem_f1_grupo_asignar", {
      p_carpeta: carpetaId, p_cursante: cursante,
      p_grupo: body.grupo_id || null, p_es_jefe: body.es_jefe === true, ...comun });
    if (error) return err(error.message, 400);
    return ok();
  }

  // Carga de la ORGANIZACION DE GRUPOS desde el documento del Evaluador.
  // La interfaz manda los nombres YA enganchados a un cursante_id: esta funcion
  // no adivina a nadie, solo comprueba que todos sean de la carpeta.
  if (accion === "importar_grupos") {
    const grupos = Array.isArray(body.grupos) ? body.grupos : [];
    if (!grupos.length) return err("El documento no trajo ningun grupo.");

    const filas = await roster(carpetaId);
    const validos = new Set(filas.map((r) => r.cursante_id));
    const rotulos = new Set<string>();
    for (const g of grupos) {
      const n = Number(g.numero);
      if (!Number.isInteger(n) || n < 1) return err("Hay un grupo sin numero valido.");
      const rot = String(g.nombre || n);
      if (rotulos.has(rot)) return err(`El grupo "${rot}" viene repetido en el documento.`);
      rotulos.add(rot);
      for (const i of (g.integrantes || [])) {
        if (!validos.has(i.cursante_id)) {
          return err(`El cursante ${i.cursante_id} no figura en la nomina de esta carpeta.`);
        }
      }
    }

    const { data, error } = await sb.rpc("fn_eem_f1_importar_grupos", {
      p_carpeta: carpetaId, p_grupos: grupos,
      p_reemplazar: body.reemplazar !== false, ...comun });
    if (error) return err(error.message, 400);
    return ok({ resumen: data });
  }

  if (accion === "tribunal_set") {
    const prof = String(body.profesor_id || "");
    if (!prof) return err("Falta profesor_id");
    const { error } = await sb.rpc("fn_eem_f1_tribunal", {
      p_carpeta: carpetaId, p_profesor: prof, p_activo: body.activo !== false, ...comun });
    if (error) return err(error.message, 400);
    const { data: m } = await sb.from("eem_carpeta_miembros").select("profesor_id")
      .eq("carpeta_id", carpetaId).eq("rol", "tribunal").eq("activo", true);
    const n = (m || []).length;
    return ok({ miembros: n,
      aviso: n < 3 ? `El tribunal tiene ${n} miembro(s): el reglamento pide 3 o 4.`
           : n > 4 ? `El tribunal tiene ${n} miembros: el reglamento admite hasta 4.` : null });
  }

  if (accion === "carpeta_config") {
    if (body.sin_limite === true) {
      const { error } = await sb.rpc("fn_eem_f1_carpeta_sin_limite", { p_carpeta: carpetaId, ...comun });
      if (error) return err(error.message, 400);
      return ok();
    }
    const { error } = await sb.rpc("fn_eem_f1_carpeta_config", {
      p_carpeta: carpetaId,
      p_fecha_limite: body.fecha_limite || null,
      p_estado: body.estado || null,
      p_permite_tardias: body.permite_tardias === undefined ? null : !!body.permite_tardias,
      p_rubrica: body.rubrica_id || null,
      p_perfil: body.perfil_id || null, ...comun });
    if (error) return err(error.message, 400);
    return ok();
  }

  if (accion === "banda_fijar") {
    const min = Number(body.minima), max = Number(body.maxima);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return err("La banda necesita nota minima y maxima.");
    if (min > max) return err("La nota minima no puede ser mayor que la maxima.");
    const { data, error } = await sb.rpc("fn_eem_f1_banda", {
      p_carpeta: carpetaId, p_aplicar_a: String(body.aplicar_a || "texto_65"),
      p_minima: min, p_maxima: max, p_modo_banda: String(body.modo_banda || "reescalado"),
      p_activar: body.activar !== false, p_motivo: body.motivo || null, ...comun });
    if (error) return err(error.message, 400);
    return ok({ banda_id: data });
  }

  if (accion === "perfil_guardar") {
    if (!body.perfil || typeof body.perfil !== "object") return err("Falta el perfil normativo.");
    const { data, error } = await sb.rpc("fn_eem_f1_perfil_guardar", {
      p_carpeta: carpetaId, p_base: body.base_id || null,
      p_nombre: body.nombre || null, p_perfil: body.perfil, ...comun });
    if (error) return err(error.message, 400);
    return ok({ perfil_id: data });
  }

  if (accion === "tardia") {
    const cursante = String(body.cursante_id || "");
    if (!cursante) return err("Falta cursante_id");
    const { error } = await sb.rpc("fn_eem_f1_tardia", {
      p_carpeta: carpetaId, p_cursante: cursante,
      p_habilitar: body.habilitar !== false, p_motivo: body.motivo || null, ...comun });
    if (error) return err(error.message, 400);
    return ok();
  }

  if (accion === "entrega_anular") {
    const entrega = String(body.entrega_id || "");
    if (!entrega) return err("Falta entrega_id");
    const { data, error } = await sb.rpc("fn_eem_f1_anular_entrega", {
      p_entrega: entrega, p_motivo: body.motivo || null, ...comun });
    if (error) return err(error.message, 400);
    return ok({ vigente_ahora: data });
  }

  return err("Accion no reconocida");
});



