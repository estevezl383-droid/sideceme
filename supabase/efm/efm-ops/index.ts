// ================================================================================
// SIDECEME — Edge Function  efm-ops   (v2.9.412)
//
// Carga, publicación, conformidad y corrección de NOTAS EFM (Entrenamiento
// Físico Militar). Es el espejo de `notas-ops` + `notas-confirmar`, pero SOLO
// para EFM: no toca notas académicas ni ninguna otra tabla del sistema.
//
// >>> ESTE ARCHIVO VA EN LA FUNCION "efm-ops". Es NUEVA, no reemplaza a nada.
//
// Quién puede qué:
//   - Personal con 'sub_ef' en rol o roles[] (Tcnl. Aguirre P019, My. Linares
//     P020): cargar · publicar · retirar · eliminar_borrador · listar ·
//     detalle · corregir · historial · panel_ef
//   - Cualquier profesor activo: evaluaciones_de (ficha EFM de un cursante, solo lectura)
//   - Cursante (sesión de cursante): mis_evaluaciones · mis_conformidades · resolver — siempre
//     sobre SUS filas (cursante_id sale de la sesión, nunca del body).
//
// Reglas que protegen lo que ya existe:
//   - Solo se tocan filas de evaluaciones_fisicas con carga_id NOT NULL, es
//     decir, las que entraron por esta función. Las históricas (diagnóstica de
//     inicio de año, 1er semestre, reprogramadas) NUNCA se modifican ni borran.
//   - El Excel lo calcula la Sección; acá no se recalcula nada: se guarda el
//     valor tal cual viene de la celda.
//   - Una fila nueva entra como BORRADOR (publicado=false): el cursante no la ve
//     hasta que se publica. Publicar abre la conformidad (pendiente).
//   - Si se corrige o se recarga una nota ya publicada, la conformidad vuelve a
//     'pendiente' con la firma limpia, y el cambio queda en efm_correcciones.
//
// Seguridad: JWT OFF + service_role. La autorización es validarSesion().
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

const ROL_EF = "sub_ef";
const MAX_FILAS = 400;
const CHUNK = 100;
const TIPOS = ["DIAGNOSTICA", "CALIFICA", "REPROGRAMADA"];
const CATEGORIAS = ["NORMAL", "EXCELENCIA"];

// Campos de la prueba que vienen de la planilla (los mismos de la ficha EFM).
const CAMPOS = [
  "categoria", "edad", "talla", "peso", "nota_talla_peso", "nota_talla_peso_pon",
  "natacion_distancia", "natacion_tiempo", "natacion_nota", "natacion_nota_pon",
  "abdominales_cant", "abdominales_nota", "abdominales_nota_pon",
  "flexiones_cant", "flexiones_nota", "flexiones_nota_pon",
  "barra_cant", "barra_nota",
  "aerobica_tiempo", "aerobica_nota", "aerobica_nota_pon",
  "nota_final", "observaciones",
];
// Notas: si vienen, tienen que ser un número entre 0 y 100.
const CAMPOS_NOTA = CAMPOS.filter((c) => c.startsWith("nota_") || c.endsWith("_nota") || c.endsWith("_pon"));

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
function entero(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

type Sesion = { tabla: "profesores" | "cursantes"; usuario_id: string };

async function leerSesion(token: unknown): Promise<Sesion | { error: string; status: number }> {
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
  if (ses.usuario_tabla !== "profesores" && ses.usuario_tabla !== "cursantes") {
    return { error: "Sesion invalida", status: 403 };
  }
  return { tabla: ses.usuario_tabla, usuario_id: String(ses.usuario_id) };
}

async function validarEf(usuarioId: string) {
  const { data: prof } = await sb
    .from("profesores")
    .select("id, grado, nombre_completo, rol, roles, activo")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!prof || prof.activo === false) return { error: "Usuario inactivo", status: 403 };
  const roles: string[] = [];
  if (prof.rol) roles.push(String(prof.rol).toLowerCase());
  if (Array.isArray(prof.roles)) for (const r of prof.roles) roles.push(String(r).toLowerCase());
  if (!roles.includes(ROL_EF)) {
    return { error: "Solo la Sub. Sec. Entrenamiento Fisico puede cargar y controlar notas EFM", status: 403 };
  }
  return { prof };
}

async function validarCursante(usuarioId: string) {
  const { data: cur } = await sb
    .from("cursantes")
    .select("id, activo")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!cur || cur.activo === false) return { error: "Usuario inactivo", status: 403 };
  return { cur };
}

// Una evaluación = gestion + semestre + ciclo + tipo. Valida y normaliza.
function leerGrupo(body: any): { g: { gestion: number; semestre: number; ciclo: string; tipo: string } } | { error: string } {
  const gestion = entero(body.gestion);
  const semestre = entero(body.semestre);
  const ciclo = txt(body.ciclo, 20);
  const tipo = (txt(body.tipo_evaluacion, 20) || "").toUpperCase();
  if (!gestion || gestion < 2020 || gestion > 2100) return { error: "Gestion invalida" };
  if (semestre !== 1 && semestre !== 2) return { error: "Semestre invalido" };
  if (ciclo !== "1ER CICLO" && ciclo !== "2DO CICLO") return { error: "Ciclo invalido" };
  if (!TIPOS.includes(tipo)) return { error: "Tipo de evaluacion invalido" };
  return { g: { gestion, semestre, ciclo, tipo } };
}
function filtroGrupo(q: any, g: { gestion: number; semestre: number; ciclo: string; tipo: string }) {
  return q.eq("gestion", g.gestion).eq("semestre", g.semestre).eq("ciclo", g.ciclo)
    .eq("tipo_evaluacion", g.tipo).not("carga_id", "is", null);
}

// Limpia los valores de una fila de la planilla. Devuelve el error de la celda
// que no sirve, para que el oficial sepa exactamente qué corregir.
function limpiarValores(src: any, parcial: boolean): { v: Record<string, string | null> } | { error: string } {
  const v: Record<string, string | null> = {};
  for (const c of CAMPOS) {
    if (parcial && !(c in (src || {}))) continue;
    const s = txt(src?.[c], c === "observaciones" ? 500 : 40);
    if (s !== null && CAMPOS_NOTA.includes(c)) {
      const n = Number(s.replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > 100) return { error: `"${c}" no es una nota valida (${s})` };
    }
    v[c] = s;
  }
  if (v.categoria != null) {
    const cat = v.categoria.toUpperCase();
    if (!CATEGORIAS.includes(cat)) return { error: "Categoria invalida: " + v.categoria };
    v.categoria = cat;
  }
  return { v };
}

function difiere(a: any, b: Record<string, string | null>): boolean {
  for (const k of Object.keys(b)) {
    if ((a?.[k] ?? null) !== (b[k] ?? null)) return true;
  }
  return false;
}
// La columna password nunca sale de acá.
function sinPassword(rows: any[]): any[] {
  return rows.map((r) => { const { password: _pw, ...resto } = r; return resto; });
}
function soloCampos(row: any): Record<string, string | null> {
  const o: Record<string, string | null> = {};
  for (const c of CAMPOS) o[c] = row?.[c] ?? null;
  return o;
}

// Vuelve la conformidad a 'pendiente' (la firma vieja no vale para otro número).
async function reabrirConformidad(efmId: number, nota: string | null) {
  const now = new Date().toISOString();
  await sb.from("efm_confirmaciones").update({
    estado: "pendiente", nota_final: nota, firma_cursante: null, confirmada_en: null,
    observacion_cursante: null, huella_forense: null, publicado_en: now, actualizado_en: now,
  }).eq("efm_id", efmId);
}

async function contarConformidades(efmIds: number[]) {
  const est: Record<string, string> = {};
  for (let i = 0; i < efmIds.length; i += 300) {
    const { data } = await sb.from("efm_confirmaciones").select("efm_id, estado")
      .in("efm_id", efmIds.slice(i, i + 300));
    for (const r of data || []) est[String(r.efm_id)] = r.estado;
  }
  return est;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });

  let body: any = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Cuerpo invalido" }, 400); }

  if (body.accion === "ping") {
    return json({ ok: true, funcion: "efm-ops", version: "2.9.412" });
  }

  const ses = await leerSesion(body.token);
  if ("error" in ses) return json({ ok: false, error: ses.error }, ses.status);

  try {
    // ============================ LADO DEL CURSANTE ============================
    if (ses.tabla === "cursantes") {
      const a = await validarCursante(ses.usuario_id);
      if ("error" in a) return json({ ok: false, error: a.error }, a.status);
      const curId = ses.usuario_id;

      switch (body.accion) {
        // v2.9.411: el cursante lee SUS notas EFM por acá (nunca las de otro):
        // cursante_id sale de la sesión. Borradores fuera.
        case "mis_evaluaciones": {
          const { data, error } = await sb.from("evaluaciones_fisicas").select("*")
            .eq("cursante_id", curId).or("publicado.is.null,publicado.eq.true")
            .order("tipo_evaluacion", { ascending: true });
          if (error) return json({ ok: false, error: "No se pudo leer tus notas EFM" }, 500);
          return json({ ok: true, evaluaciones: sinPassword(data || []) });
        }

        case "mis_conformidades": {
          const { data, error } = await sb.from("efm_confirmaciones")
            .select("id, efm_id, gestion, semestre, ciclo, tipo_evaluacion, nota_final, estado, publicado_en, confirmada_en, observacion_cursante")
            .eq("cursante_id", curId)
            .order("publicado_en", { ascending: false })
            .limit(50);
          if (error) return json({ ok: false, error: "No se pudo leer tus notas EFM" }, 500);
          // Solo las que siguen publicadas (si la Sección retiró la publicación, no se muestra).
          const ids = (data || []).map((c: any) => c.efm_id);
          let pub = new Set<string>();
          if (ids.length) {
            const { data: filas } = await sb.from("evaluaciones_fisicas").select("efm_id")
              .in("efm_id", ids).eq("publicado", true);
            pub = new Set((filas || []).map((f: any) => String(f.efm_id)));
          }
          return json({ ok: true, confirmaciones: (data || []).filter((c: any) => pub.has(String(c.efm_id))) });
        }

        case "resolver": {
          const confId = entero(body.confirmacion_id);
          const decision = txt(body.decision, 20);
          const firma = txt(body.firma, 400000);
          const observacion = txt(body.observacion, 1000);
          if (!confId) return json({ ok: false, error: "Falta la nota a resolver" }, 400);
          if (decision !== "confirmar" && decision !== "rechazar") return json({ ok: false, error: "Decision invalida" }, 400);
          if (!firma) return json({ ok: false, error: "Falta tu firma" }, 400);
          if (decision === "rechazar" && !observacion) {
            return json({ ok: false, error: "Si no estas de acuerdo, tenes que explicar por que" }, 400);
          }
          const { data: fila } = await sb.from("efm_confirmaciones")
            .select("id, efm_id, estado").eq("id", confId).eq("cursante_id", curId).maybeSingle();
          if (!fila) return json({ ok: false, error: "No se encontro esa nota" }, 404);
          if (fila.estado !== "pendiente") {
            return json({ ok: false, error: "Esta nota ya fue " + (fila.estado === "confirmada" ? "confirmada" : "objetada") + " antes" }, 409);
          }
          const { data: ev } = await sb.from("evaluaciones_fisicas").select("publicado")
            .eq("efm_id", fila.efm_id).maybeSingle();
          if (!ev || ev.publicado !== true) return json({ ok: false, error: "Esta nota ya no esta publicada" }, 409);

          const now = new Date();
          const estado = decision === "confirmar" ? "confirmada" : "rechazada";
          const { error: errUpd } = await sb.from("efm_confirmaciones").update({
            estado, firma_cursante: firma, confirmada_en: now.toISOString(),
            observacion_cursante: observacion,
            huella_forense: { ip: ip(req), user_agent: req.headers.get("user-agent") || "", timestamp: now.toISOString() },
            actualizado_en: now.toISOString(),
          }).eq("id", confId).eq("cursante_id", curId).eq("estado", "pendiente");
          if (errUpd) return json({ ok: false, error: "No se pudo guardar" }, 500);
          return json({ ok: true, estado });
        }

        default:
          return json({ ok: false, error: "Accion no permitida" }, 403);
      }
    }

    // ===================== PERSONAL: ver la ficha EFM de un cursante =====================
    // v2.9.411: cualquier profesor activo (Disciplina, Jefe de Curso, etc.) ve las
    // notas EFM publicadas de UN cursante en su ficha. Solo lectura.
    if (body.accion === "evaluaciones_de") {
      const { data: p } = await sb.from("profesores").select("activo").eq("id", ses.usuario_id).maybeSingle();
      if (!p || p.activo === false) return json({ ok: false, error: "Usuario inactivo" }, 403);
      const cid = txt(body.cursante_id, 40);
      if (!cid) return json({ ok: false, error: "Falta el cursante" }, 400);
      const { data, error } = await sb.from("evaluaciones_fisicas").select("*")
        .eq("cursante_id", cid).or("publicado.is.null,publicado.eq.true")
        .order("tipo_evaluacion", { ascending: true });
      if (error) return json({ ok: false, error: "No se pudo leer las notas EFM" }, 500);
      return json({ ok: true, evaluaciones: sinPassword(data || []) });
    }

    // ============================ LADO DE LA SECCIÓN EF ============================
    const auth = await validarEf(ses.usuario_id);
    if ("error" in auth) return json({ ok: false, error: auth.error }, auth.status);
    const prof = auth.prof!;
    const profNombre = [prof.grado, prof.nombre_completo].filter(Boolean).join(" ");

    switch (body.accion) {
      // v2.9.411: todas las notas EFM para el panel de la Sección (incluye borradores).
      case "panel_ef": {
        const { data, error } = await sb.from("evaluaciones_fisicas").select("*").limit(5000);
        if (error) return json({ ok: false, error: "No se pudo leer las notas EFM" }, 500);
        return json({ ok: true, evaluaciones: sinPassword(data || []) });
      }

      // Resumen de todas las evaluaciones cargadas por la plataforma.
      case "listar": {
        const { data, error } = await sb.from("evaluaciones_fisicas")
          .select("efm_id, gestion, semestre, ciclo, tipo_evaluacion, categoria, publicado, nota_final")
          .not("carga_id", "is", null).limit(3000);
        if (error) return json({ ok: false, error: "No se pudo leer las cargas" }, 500);
        const est = await contarConformidades((data || []).map((r: any) => r.efm_id));
        const grupos: Record<string, any> = {};
        for (const r of data || []) {
          const k = [r.gestion, r.semestre, r.ciclo, r.tipo_evaluacion].join("|");
          const g = grupos[k] ||= {
            gestion: r.gestion, semestre: r.semestre, ciclo: r.ciclo, tipo_evaluacion: r.tipo_evaluacion,
            total: 0, publicadas: 0, borrador: 0, normal: 0, excelencia: 0,
            pendiente: 0, confirmada: 0, rechazada: 0,
          };
          g.total++;
          if (r.publicado === true) g.publicadas++; else g.borrador++;
          if (r.categoria === "EXCELENCIA") g.excelencia++; else g.normal++;
          const e = est[String(r.efm_id)];
          if (r.publicado === true && e) g[e]++;
        }
        const { data: cargas } = await sb.from("efm_cargas")
          .select("id, gestion, semestre, ciclo, tipo_evaluacion, categoria, archivo, hoja, filas, subido_por_nombre, subido_en")
          .order("subido_en", { ascending: false }).limit(100);
        return json({ ok: true, grupos: Object.values(grupos), cargas: cargas || [] });
      }

      // Sube una planilla (NORMAL o EXCELENCIA). Filas nuevas → borrador.
      case "cargar": {
        const gestion = entero(body.gestion);
        const semestre = entero(body.semestre);
        const tipo = (txt(body.tipo_evaluacion, 20) || "").toUpperCase();
        const categoria = (txt(body.categoria, 20) || "").toUpperCase();
        const ciclo = txt(body.ciclo, 20); // v2.9.412: el ciclo lo elige el oficial
        if (ciclo !== "1ER CICLO" && ciclo !== "2DO CICLO") return json({ ok: false, error: "Elegi el ciclo" }, 400);
        if (!gestion || gestion < 2020 || gestion > 2100) return json({ ok: false, error: "Gestion invalida" }, 400);
        if (semestre !== 1 && semestre !== 2) return json({ ok: false, error: "Semestre invalido" }, 400);
        if (!TIPOS.includes(tipo)) return json({ ok: false, error: "Tipo de evaluacion invalido" }, 400);
        if (!CATEGORIAS.includes(categoria)) return json({ ok: false, error: "Categoria invalida" }, 400);
        const filas = Array.isArray(body.filas) ? body.filas : [];
        if (!filas.length) return json({ ok: false, error: "La planilla no trae filas" }, 400);
        if (filas.length > MAX_FILAS) return json({ ok: false, error: "Demasiadas filas" }, 400);

        // Validar cada fila ANTES de escribir nada.
        const ids = new Set<string>();
        const limpias: { cursante_id: string; v: Record<string, string | null> }[] = [];
        for (let i = 0; i < filas.length; i++) {
          const id = txt(filas[i]?.cursante_id, 20);
          if (!id) return json({ ok: false, error: `Fila ${i + 1}: falta el cursante` }, 400);
          if (ids.has(id)) return json({ ok: false, error: `El cursante ${id} esta repetido en la planilla` }, 400);
          ids.add(id);
          const lv = limpiarValores(filas[i], false);
          if ("error" in lv) return json({ ok: false, error: `Fila ${i + 1}: ${lv.error}` }, 400);
          lv.v.categoria = categoria;
          limpias.push({ cursante_id: id, v: lv.v });
        }

        // Revalidar contra el padrón: todos deben existir y estar activos.
        const idList = [...ids];
        const curs: Record<string, any> = {};
        for (let i = 0; i < idList.length; i += 300) {
          const { data } = await sb.from("cursantes")
            .select("id, ci, nombre_completo, grado, arma, ciclo, paralelo, activo, nacionalidad, departamento")
            .in("id", idList.slice(i, i + 300));
          for (const c of data || []) curs[c.id] = c;
        }
        const malos = idList.filter((id) => !curs[id] || curs[id].activo === false || !curs[id].ciclo);
        if (malos.length) return json({ ok: false, error: "Cursantes no validos o inactivos: " + malos.join(", ") }, 400);
        const deOtroCiclo = idList.filter((id) => curs[id].ciclo !== ciclo);
        if (deOtroCiclo.length) {
          return json({ ok: false, error: `Hay ${deOtroCiclo.length} cursante(s) que no son del ${ciclo}: ` + deOtroCiclo.map((id) => curs[id].nombre_completo).join(", ") }, 400);
        }

        // Si esa evaluación ya existe como HISTÓRICA (cargada antes de este sistema),
        // no se duplica: el cursante vería dos tarjetas de la misma evaluación.
        for (let i = 0; i < idList.length; i += 300) {
          const { data: hist } = await sb.from("evaluaciones_fisicas").select("cursante_id")
            .eq("gestion", gestion).eq("semestre", semestre).eq("tipo_evaluacion", tipo)
            .is("carga_id", null).in("cursante_id", idList.slice(i, i + 300)).limit(1);
          if (hist && hist.length) {
            return json({ ok: false, error: `Esa evaluacion (${tipo}, semestre ${semestre} de ${gestion}) ya esta cargada desde antes y no se modifica. Revisa la gestion, el semestre y el tipo.` }, 409);
          }
        }

        const { data: carga, error: errCarga } = await sb.from("efm_cargas").insert({
          gestion, semestre, ciclo,
          tipo_evaluacion: tipo, categoria,
          archivo: txt(body.archivo, 200), hoja: txt(body.hoja, 100), filas: limpias.length,
          subido_por: prof.id, subido_por_nombre: profNombre,
        }).select("id").single();
        if (errCarga || !carga) return json({ ok: false, error: "No se pudo registrar la carga" }, 500);

        // Filas que ya existen para esta evaluación (solo las cargadas por la plataforma).
        const existentes: Record<string, any> = {};
        for (let i = 0; i < idList.length; i += 300) {
          const { data } = await sb.from("evaluaciones_fisicas").select("*")
            .eq("gestion", gestion).eq("semestre", semestre).eq("tipo_evaluacion", tipo)
            .not("carga_id", "is", null).in("cursante_id", idList.slice(i, i + 300));
          for (const r of data || []) existentes[r.cursante_id] = r;
        }

        const now = new Date().toISOString();
        const nuevas: any[] = [];
        let actualizadas = 0, sinCambio = 0, reabiertas = 0;
        for (const f of limpias) {
          const c = curs[f.cursante_id];
          const prev = existentes[f.cursante_id];
          if (!prev) {
            nuevas.push({
              cursante_id: c.id, nombre_completo: c.nombre_completo, ci: c.ci, paralelo: c.paralelo,
              ciclo: c.ciclo, nacionalidad: c.nacionalidad, grado: c.grado, arma: c.arma,
              activo: c.activo === false ? "False" : "True", departamento: c.departamento,
              tipo_evaluacion: tipo, gestion, semestre, ...f.v,
              carga_id: carga.id, publicado: false, actualizado_en: now,
            });
            continue;
          }
          if (!difiere(prev, f.v)) { sinCambio++; continue; }
          const { error: eU } = await sb.from("evaluaciones_fisicas")
            .update({ ...f.v, carga_id: carga.id, actualizado_en: now }).eq("efm_id", prev.efm_id);
          if (eU) return json({ ok: false, error: "Error actualizando a " + c.nombre_completo + ". Lo anterior quedo guardado; volve a subir la planilla." }, 500);
          actualizadas++;
          if (prev.publicado === true) {
            await sb.from("efm_correcciones").insert({
              efm_id: prev.efm_id, cursante_id: c.id, origen: "recarga",
              antes: soloCampos(prev), despues: f.v, motivo: "Recarga de planilla: " + (txt(body.archivo, 200) || ""),
              por_id: prof.id, por_nombre: profNombre,
            });
            await reabrirConformidad(prev.efm_id, f.v.nota_final);
            reabiertas++;
          }
        }
        for (let i = 0; i < nuevas.length; i += CHUNK) {
          const { error: eI } = await sb.from("evaluaciones_fisicas").insert(nuevas.slice(i, i + CHUNK));
          if (eI) { console.error("insert", eI); return json({ ok: false, error: "Error guardando filas nuevas: " + eI.message }, 500); }
        }
        await sb.from("efm_cargas").update({ filas: limpias.length }).eq("id", carga.id);
        return json({ ok: true, carga_id: carga.id, nuevas: nuevas.length, actualizadas, sin_cambio: sinCambio, reabiertas });
      }

      // Todas las filas de una evaluación, con su estado de conformidad.
      case "detalle": {
        const lg = leerGrupo(body);
        if ("error" in lg) return json({ ok: false, error: lg.error }, 400);
        const { data, error } = await filtroGrupo(sb.from("evaluaciones_fisicas").select("*"), lg.g).limit(MAX_FILAS);
        if (error) return json({ ok: false, error: "No se pudo leer la evaluacion" }, 500);
        const ids = (data || []).map((r: any) => r.efm_id);
        const conf: Record<string, any> = {};
        for (let i = 0; i < ids.length; i += 300) {
          const { data: cs } = await sb.from("efm_confirmaciones")
            .select("efm_id, estado, observacion_cursante, confirmada_en, publicado_en")
            .in("efm_id", ids.slice(i, i + 300));
          for (const c of cs || []) conf[String(c.efm_id)] = c;
        }
        const filas = (data || []).map((r: any) => {
          const { password: _pw, ...resto } = r; // nunca devolver la columna password
          return { ...resto, conformidad: conf[String(r.efm_id)] || null };
        });
        return json({ ok: true, filas });
      }

      // Publica los borradores de una evaluación y abre la conformidad.
      case "publicar": {
        const lg = leerGrupo(body);
        if ("error" in lg) return json({ ok: false, error: lg.error }, 400);
        const { data: filas, error } = await filtroGrupo(
          sb.from("evaluaciones_fisicas").select("efm_id, cursante_id, gestion, semestre, ciclo, tipo_evaluacion, nota_final"), lg.g,
        ).eq("publicado", false).limit(MAX_FILAS);
        if (error) return json({ ok: false, error: "No se pudo leer la evaluacion" }, 500);
        if (!filas || !filas.length) return json({ ok: true, publicadas: 0 });
        const now = new Date().toISOString();
        const ids = filas.map((f: any) => f.efm_id);
        const { error: eP } = await sb.from("evaluaciones_fisicas")
          .update({ publicado: true, actualizado_en: now }).in("efm_id", ids);
        if (eP) return json({ ok: false, error: "No se pudo publicar" }, 500);
        // Conformidad: se crea si no existe; si existía (se había retirado), se reabre.
        const yaConf = await contarConformidades(ids);
        const nuevasConf = filas.filter((f: any) => !yaConf[String(f.efm_id)]).map((f: any) => ({
          efm_id: f.efm_id, cursante_id: f.cursante_id, gestion: f.gestion, semestre: f.semestre,
          ciclo: f.ciclo, tipo_evaluacion: f.tipo_evaluacion, nota_final: f.nota_final,
          estado: "pendiente", publicado_en: now, actualizado_en: now,
        }));
        for (let i = 0; i < nuevasConf.length; i += CHUNK) {
          await sb.from("efm_confirmaciones").insert(nuevasConf.slice(i, i + CHUNK));
        }
        for (const f of filas) {
          if (yaConf[String(f.efm_id)]) {
            await sb.from("efm_confirmaciones").update({ nota_final: f.nota_final, publicado_en: now, actualizado_en: now })
              .eq("efm_id", f.efm_id);
          }
        }
        return json({ ok: true, publicadas: filas.length });
      }

      // Retira la publicación (vuelve a borrador). No borra nada.
      case "retirar": {
        const lg = leerGrupo(body);
        if ("error" in lg) return json({ ok: false, error: lg.error }, 400);
        const { data, error } = await filtroGrupo(
          sb.from("evaluaciones_fisicas").update({ publicado: false, actualizado_en: new Date().toISOString() }), lg.g,
        ).eq("publicado", true).select("efm_id");
        if (error) return json({ ok: false, error: "No se pudo retirar la publicacion" }, 500);
        return json({ ok: true, retiradas: (data || []).length });
      }

      // Borra una evaluación que NUNCA se publicó (p. ej. se subió al período equivocado).
      case "eliminar_borrador": {
        const lg = leerGrupo(body);
        if ("error" in lg) return json({ ok: false, error: lg.error }, 400);
        const { data: filas } = await filtroGrupo(sb.from("evaluaciones_fisicas").select("efm_id, publicado"), lg.g).limit(MAX_FILAS);
        if (!filas || !filas.length) return json({ ok: true, eliminadas: 0 });
        if (filas.some((f: any) => f.publicado === true)) {
          return json({ ok: false, error: "Hay notas publicadas en esta evaluacion. Primero retira la publicacion." }, 409);
        }
        const conf = await contarConformidades(filas.map((f: any) => f.efm_id));
        if (Object.keys(conf).length) {
          return json({ ok: false, error: "Esta evaluacion ya fue publicada alguna vez (tiene conformidades). No se puede eliminar; corregi las notas." }, 409);
        }
        const { error } = await filtroGrupo(sb.from("evaluaciones_fisicas").delete(), lg.g).eq("publicado", false);
        if (error) return json({ ok: false, error: "No se pudo eliminar" }, 500);
        return json({ ok: true, eliminadas: filas.length });
      }

      // Corrige una fila (reclamo pertinente). Queda en la bitácora.
      case "corregir": {
        const efmId = entero(body.efm_id);
        const motivo = txt(body.motivo, 1000);
        if (!efmId) return json({ ok: false, error: "Falta la nota a corregir" }, 400);
        if (!motivo || motivo.length < 5) return json({ ok: false, error: "Escribi el motivo de la correccion" }, 400);
        const lv = limpiarValores(body.cambios || {}, true);
        if ("error" in lv) return json({ ok: false, error: lv.error }, 400);
        delete lv.v.categoria; // la categoria sale de la planilla, no se cambia a mano
        if (!Object.keys(lv.v).length) return json({ ok: false, error: "No hay cambios" }, 400);
        const { data: prev } = await sb.from("evaluaciones_fisicas").select("*").eq("efm_id", efmId).maybeSingle();
        if (!prev) return json({ ok: false, error: "No se encontro esa nota" }, 404);
        if (prev.carga_id == null) {
          return json({ ok: false, error: "Esta nota es historica (no se cargo por la plataforma) y no se modifica desde aca" }, 403);
        }
        if (!difiere(prev, lv.v)) return json({ ok: false, error: "Los valores son iguales a los actuales" }, 400);
        const antes: Record<string, unknown> = {};
        for (const k of Object.keys(lv.v)) antes[k] = prev[k] ?? null;
        const { data: confPrev } = await sb.from("efm_confirmaciones")
          .select("estado, observacion_cursante, confirmada_en").eq("efm_id", efmId).maybeSingle();
        if (confPrev) antes._conformidad_previa = confPrev;
        const { error: eU } = await sb.from("evaluaciones_fisicas")
          .update({ ...lv.v, actualizado_en: new Date().toISOString() }).eq("efm_id", efmId);
        if (eU) return json({ ok: false, error: "No se pudo guardar la correccion" }, 500);
        await sb.from("efm_correcciones").insert({
          efm_id: efmId, cursante_id: prev.cursante_id, origen: "correccion",
          antes, despues: lv.v, motivo, por_id: prof.id, por_nombre: profNombre,
        });
        if (confPrev) await reabrirConformidad(efmId, "nota_final" in lv.v ? lv.v.nota_final : prev.nota_final);
        return json({ ok: true, reabierta: !!confPrev });
      }

      case "historial": {
        const efmId = entero(body.efm_id);
        if (!efmId) return json({ ok: false, error: "Falta la nota" }, 400);
        const { data } = await sb.from("efm_correcciones")
          .select("id, origen, antes, despues, motivo, por_nombre, en")
          .eq("efm_id", efmId).order("en", { ascending: false }).limit(50);
        return json({ ok: true, historial: data || [] });
      }

      default:
        return json({ ok: false, error: "Accion desconocida en efm-ops: " + String(body.accion) }, 400);
    }
  } catch (e) {
    console.error("efm-ops", e);
    return json({ ok: false, error: "Error interno: " + ((e as Error)?.message || String(e)) }, 500);
  }
});
