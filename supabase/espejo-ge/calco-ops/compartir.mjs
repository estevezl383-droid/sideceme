import { construirPaquete } from '../../../calcos/areas-operaciones/compartir-modelo.mjs'

// Acciones nuevas, aisladas del guardado, espejo y calificación existentes.
// 11-10-2026: también por CICLO o por PARALELO (Sergio: «la opción de compartir a los alumnos, por
// ciclo o por paralelo»), y `ejercicio_enviar`: el profesor manda el ejercicio TAL COMO ESTÁ en su
// Mesa (`foto`: ops, fichas y los documentos de la OGO consolidada), sin esperar al autoguardado.
// El paquete se arma igual (construirPaquete: lista permitida, sólo las áreas elegidas y lo de adentro).
const CURSANTE_ACTIVO = 'activo.is.null,activo.eq.true'
export async function compartir(body, ses, deps) {
  if (!['areas_destinos', 'areas_enviar', 'areas_recibidos', 'ejercicio_enviar'].includes(body.accion)) return null
  const { sb, esDocente, puedeTocar, ventanaAbierta, ok, err } = deps
  try {
    const { data: fuente, error: ef } = await sb.from('calcos').select('*').eq('id', body.calco_id).maybeSingle()
    if (ef) throw ef
    if (!fuente) return err('Abra y guarde primero el ejercicio.', 404)
    const veto = await puedeTocar(ses, fuente, fuente.ejercicio_id)
    if (veto) return err(veto, 403)

    if (body.accion === 'areas_recibidos') {
      let q = sb.from('calco_compartidos').select('id,nombre,paquete,creado_en,enviado_por')
      q = fuente.grupo_id
        ? q.eq('destino_grupo_id', fuente.grupo_id).eq('destino_ejercicio_id', fuente.ejercicio_id)
        : q.eq('destino_calco_id', fuente.id)
      const { data, error } = await q.order('creado_en', { ascending: false }).limit(100)
      if (error) throw error
      let envios = data || []
      // el cursante recibe también lo enviado a su ciclo (o a su paralelo)
      if (!esDocente(ses)) {
        const { data: yo, error: ey } = await sb.from('cursantes').select('ciclo,paralelo').eq('id', ses.id).maybeSingle()
        if (ey) throw ey
        if (yo?.ciclo) {
          const { data: porCiclo, error: ec } = await sb.from('calco_compartidos').select('id,nombre,paquete,creado_en,enviado_por,destino_paralelo')
            .eq('destino_ciclo', yo.ciclo).order('creado_en', { ascending: false }).limit(100)
          if (ec) throw ec
          const ya = new Set(envios.map(e => e.id))
          envios = envios.concat((porCiclo || []).filter(e => !ya.has(e.id) && (!e.destino_paralelo || e.destino_paralelo === yo.paralelo))
            .map(({ destino_paralelo, ...e }) => e))
            .sort((a, b) => String(b.creado_en).localeCompare(String(a.creado_en)))
        }
      }
      return ok({ envios })
    }
    if (!esDocente(ses)) return err('Solo el docente distribuye áreas a los ejercicios.', 403)
    // Solo se distribuyen trabajos propios, no entregas ni trabajos ajenos.
    if (fuente.grupo_id || fuente.creado_por !== ses.id) return err('Seleccione un ejercicio personal suyo como origen.', 403)

    if (body.accion === 'areas_destinos') {
      const { data: propios, error: ep } = await sb.from('calcos').select('id,nombre').eq('creado_por', ses.id)
        .is('grupo_id', null).is('ejercicio_id', null).neq('id', fuente.id).order('nombre').limit(200)
      if (ep) throw ep
      const { data: grupos, error: eg } = await sb.from('ejercicio_grupos')
        .select('id,nombre,ejercicio_id,ejercicios!inner(nombre,estado)').eq('activo', true).order('nombre').limit(500)
      if (eg) throw eg
      // los ciclos y paralelos de los cursantes activos
      const { data: cursantes, error: eu } = await sb.from('cursantes').select('ciclo,paralelo').or(CURSANTE_ACTIVO).limit(5000)
      if (eu) throw eu
      const porCiclo = {}, porParalelo = {}
      for (const c of cursantes || []) {
        if (!c.ciclo) continue
        porCiclo[c.ciclo] = (porCiclo[c.ciclo] || 0) + 1
        if (c.paralelo) porParalelo[`${c.ciclo}|${c.paralelo}`] = (porParalelo[`${c.ciclo}|${c.paralelo}`] || 0) + 1
      }
      return ok({ destinos: [
        ...Object.keys(porCiclo).sort().map(ciclo => ({ clave: `ciclo:${ciclo}`, nombre: `Todo el ${ciclo} (${porCiclo[ciclo]} cursantes)`, tipo: 'ciclo', ciclo })),
        ...Object.keys(porParalelo).sort().map(k => { const [ciclo, paralelo] = k.split('|'); return { clave: `paralelo:${k}`, nombre: `${ciclo} · Paralelo ${paralelo} (${porParalelo[k]} cursantes)`, tipo: 'paralelo', ciclo, paralelo } }),
        ...(propios || []).map(c => ({ clave: `calco:${c.id}`, nombre: `Mi ejercicio · ${c.nombre}`, calco_id: c.id })),
        ...(grupos || []).filter(g => g.ejercicios?.estado !== 'cerrado').map(g => ({
          clave: `grupo:${g.id}`, nombre: `${g.ejercicios.nombre} · ${g.nombre}`, grupo_id: g.id, ejercicio_id: g.ejercicio_id
        }))
      ] })
    }
    const nombre = String(body.nombre || '').trim().slice(0, 160)
    if (!nombre) return err('Ponga un nombre al envío.')
    let destino_calco_id = null, destino_grupo_id = null, destino_ejercicio_id = null, destino_ciclo = null, destino_paralelo = null
    if (body.destino?.ciclo) {
      const ciclo = String(body.destino.ciclo).trim().slice(0, 40), paralelo = body.destino.paralelo ? String(body.destino.paralelo).trim().slice(0, 10) : null
      let q = sb.from('cursantes').select('id', { count: 'exact', head: true }).eq('ciclo', ciclo).or(CURSANTE_ACTIVO)
      if (paralelo) q = q.eq('paralelo', paralelo)
      const { count, error } = await q
      if (error) throw error
      if (!count) return err('No hay cursantes activos en ese ciclo o paralelo.')
      destino_ciclo = ciclo; destino_paralelo = paralelo
    } else if (body.destino?.calco_id && !body.destino?.grupo_id) {
      const { data: d, error } = await sb.from('calcos').select('id,creado_por,grupo_id,ejercicio_id,payload,estado')
        .eq('id', body.destino.calco_id).maybeSingle()
      if (error) throw error
      if (!d || d.creado_por !== ses.id || d.grupo_id || d.ejercicio_id || d.id === fuente.id) return err('Destino no autorizado.', 403)
      if (d.payload?.finalizado || d.estado === 'calificado') return err('El ejercicio de destino está finalizado.', 403)
      destino_calco_id = d.id
    } else if (body.destino?.grupo_id && body.destino?.ejercicio_id) {
      const { data: d, error } = await sb.from('ejercicio_grupos').select('id,ejercicio_id,activo')
        .eq('id', body.destino.grupo_id).eq('ejercicio_id', body.destino.ejercicio_id).maybeSingle()
      if (error) throw error
      if (!d?.activo) return err('El grupo de destino no está activo.', 403)
      const cierre = await ventanaAbierta(d.ejercicio_id)
      if (cierre) return err(cierre, 403)
      destino_grupo_id = d.id; destino_ejercicio_id = d.ejercicio_id
    } else return err('Seleccione el ejercicio o grupo de destino.')
    if (!Array.isArray(body.areas) || body.areas.length > 200) return err('Seleccione las áreas que va a compartir.')
    // ejercicio_enviar: lo que el profesor tiene en su Mesa ahora (su propio ejercicio: `fuente` es suyo)
    const foto = body.accion === 'ejercicio_enviar' && body.foto && typeof body.foto === 'object' ? body.foto : null
    const base = foto ? { ops: foto.ops || {}, unidades: Array.isArray(foto.unidades) ? foto.unidades : [], documentos: Array.isArray(foto.documentos) ? foto.documentos : [] } : fuente.payload
    const paquete = construirPaquete({ ...base, nombre: fuente.nombre }, body.areas, body.opciones)
    if (paquete.areas.length !== new Set(body.areas).size) return err('Hay áreas que no pertenecen al ejercicio guardado.')
    const { data, error } = await sb.from('calco_compartidos').insert({
      origen_calco_id: fuente.id, destino_calco_id, destino_grupo_id, destino_ejercicio_id, destino_ciclo, destino_paralelo,
      nombre, paquete, creado_por: ses.id, enviado_por: ses.nombre
    }).select('id').single()
    if (error) throw error
    return ok({ envio_id: data.id })
  } catch (e) { return err(e.message || 'No se pudo compartir.', 400) }
}
