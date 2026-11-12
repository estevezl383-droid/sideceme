-- Una solicitud solo queda aprobada para modificación si sanción y auditoría
-- se guardan en la misma transacción. Solo invocable por la Edge autenticada.
CREATE OR REPLACE FUNCTION public.resolver_solicitud_atomica(
  p_solicitud_id bigint, p_actor_id text, p_decision text, p_razon text,
  p_modificacion jsonb DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  solicitud public.solicitudes_anulacion%ROWTYPE;
  actor public.profesores%ROWTYPE;
  anterior public.sanciones%ROWTYPE;
  nueva public.sanciones%ROWTYPE;
  falta public.reglamentos%ROWTYPE;
  roles_actor text[];
  puntos integer;
  resolucion text;
  antes jsonb;
  despues jsonb;
BEGIN
  IF p_decision IS NULL OR p_decision NOT IN ('modificar','anular','rechazar') THEN
    RAISE EXCEPTION 'Decisión inválida.';
  END IF;
  IF p_razon IS NULL OR length(btrim(p_razon)) < 5 OR length(p_razon) > 2000 THEN
    RAISE EXCEPTION 'El motivo debe tener entre 5 y 2000 caracteres.';
  END IF;
  SELECT * INTO solicitud FROM public.solicitudes_anulacion WHERE id = p_solicitud_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud no encontrada.'; END IF;
  SELECT * INTO actor FROM public.profesores WHERE id = p_actor_id;
  IF NOT FOUND OR actor.activo IS FALSE OR actor.es_auxiliar IS TRUE OR actor.solo_lectura IS TRUE THEN
    RAISE EXCEPTION 'Sin atribución para resolver solicitudes.';
  END IF;
  roles_actor := ARRAY(SELECT lower(r) FROM unnest(array_append(coalesce(actor.roles, '{}'::text[]), actor.rol)) r WHERE r IS NOT NULL);
  IF NOT (roles_actor && ARRAY['ciencia_tecnologia','jefe_disciplina','disciplina']
    OR ('comandante' = ANY(roles_actor) AND solicitud.enviado_a_comandante IS TRUE)
    OR (roles_actor && ARRAY['jefe_estudios','estudios'] AND solicitud.enviado_a_estudios IS TRUE)) THEN
    RAISE EXCEPTION 'No tenés atribución para resolver esta solicitud.';
  END IF;
  IF lower(btrim(coalesce(solicitud.estado,''))) IN ('aprobado','rechazado') THEN
    RAISE EXCEPTION 'La solicitud ya fue resuelta.';
  END IF;
  SELECT * INTO anterior FROM public.sanciones WHERE id = solicitud.sancion_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sanción no encontrada.'; END IF;
  IF p_decision = 'anular' AND anterior.anulada IS NOT TRUE THEN
    RAISE EXCEPTION 'La sanción todavía no figura anulada.';
  END IF;
  resolucion := CASE p_decision WHEN 'modificar' THEN 'MODIFICADA' WHEN 'anular' THEN 'ANULADA' ELSE 'RECHAZADA' END
    || ' por ' || coalesce(actor.nombre_completo,actor.id) || ': ' || btrim(p_razon);
  IF p_decision = 'modificar' THEN
    IF p_modificacion IS NULL OR NOT (p_modificacion ?& ARRAY['falta_id','puntos_aplicados','anterior']) THEN
      RAISE EXCEPTION 'Seleccioná la falta y los puntos finales. Actualizá la página para aplicar la modificación.';
    END IF;
    IF anterior.anulada IS TRUE OR anterior.estado = 'ANULADA' THEN
      RAISE EXCEPTION 'No se puede modificar una sanción anulada.';
    END IF;
    antes := jsonb_build_object('falta_id',anterior.falta_id,'puntos_aplicados',anterior.puntos_aplicados,
      'modificada_en',anterior.modificada_en);
    IF p_modificacion->'anterior' IS DISTINCT FROM antes THEN
      RAISE EXCEPTION 'La sanción cambió. Actualizá la página y revisá los valores antes de resolver.';
    END IF;
    SELECT * INTO falta FROM public.reglamentos WHERE id = p_modificacion->>'falta_id' AND activo IS TRUE;
    IF NOT FOUND OR falta.puntos IS NULL OR falta.puntos <= 0 THEN
      RAISE EXCEPTION 'Seleccioná una falta vigente del reglamento.';
    END IF;
    IF coalesce(p_modificacion->>'puntos_aplicados','') !~ '^[1-9][0-9]{0,2}$' THEN
      RAISE EXCEPTION 'Los puntos deben ser un entero positivo.';
    END IF;
    puntos := (p_modificacion->>'puntos_aplicados')::integer;
    IF puntos NOT IN (falta.puntos, falta.puntos * 2) THEN
      RAISE EXCEPTION 'Los puntos deben coincidir con el reglamento o su primera reincidencia.';
    END IF;
    IF anterior.falta_id = falta.id AND anterior.puntos_aplicados = puntos THEN
      RAISE EXCEPTION 'No hay cambios en la falta ni en los puntos para aprobar.';
    END IF;
    antes := antes || jsonb_build_object('falta_articulo',anterior.falta_articulo,
      'falta_descripcion',anterior.falta_descripcion,'falta_categoria',anterior.falta_categoria,
      'puntos_base',anterior.puntos_base,'es_reincidencia',anterior.es_reincidencia,
      'reincidencia_num',anterior.reincidencia_num,'requiere_memorandum',anterior.requiere_memorandum,
      'requiere_consejo',anterior.requiere_consejo);
    UPDATE public.sanciones SET falta_id = falta.id, falta_articulo = falta.articulo::text,
      falta_descripcion = falta.descripcion, falta_categoria = falta.categoria,
      puntos_base = falta.puntos, puntos_aplicados = puntos,
      es_reincidencia = puntos = falta.puntos * 2,
      reincidencia_num = CASE WHEN puntos = falta.puntos * 2 THEN 1 ELSE 0 END,
      requiere_memorandum = false, requiere_consejo = false,
      estado = 'MODIFICADA', modificada_en = now(), modificada_por = actor.nombre_completo,
      modificada_motivo = btrim(p_razon), registro_generado = true
    WHERE id = anterior.id RETURNING * INTO nueva;
    -- El trigger existente recalcula el acumulado del cursante en esta transacción.
    SELECT jsonb_object_agg(k, to_jsonb(nueva)->k) INTO despues FROM jsonb_object_keys(antes) k;
    INSERT INTO public.sanciones_audit
      (sancion_id,accion,realizado_por,realizado_por_nombre,campos_antes,campos_despues,
       razon,registro_generado,estado_antes,estado_despues,puntos_antes,puntos_despues,
       solicitante_nombre,solicitud_fecha,solicitud_motivo,decision_final)
    VALUES (anterior.id,'editar',actor.id,actor.nombre_completo,antes,
      despues || jsonb_build_object('solicitud_id',solicitud.id), btrim(p_razon),true,
      coalesce(anterior.estado,'VIGENTE'),'MODIFICADA',anterior.puntos_aplicados,puntos,
      CASE WHEN solicitud.origen = 'cursante' OR solicitud.creada_por = solicitud.cursante_id
        THEN solicitud.cursante_nombre ELSE solicitud.profesor_nombre END,
      solicitud.fecha_creacion,coalesce(solicitud.detalle_cursante,solicitud.detalle_profesor,solicitud.comentario_disciplina),resolucion);
  END IF;
  UPDATE public.solicitudes_anulacion SET
    estado = CASE WHEN p_decision = 'rechazar' THEN 'rechazado' ELSE 'aprobado' END,
    comentario_comandante = resolucion, fecha_resolucion = now()
  WHERE id = solicitud.id;
  RETURN jsonb_build_object('solicitud_id',solicitud.id,'sancion',
    CASE WHEN p_decision = 'modificar' THEN despues || jsonb_build_object('id',nueva.id,
      'estado',nueva.estado,'modificada_por',nueva.modificada_por,'modificada_motivo',nueva.modificada_motivo,
      'registro_generado',true) ELSE NULL END);
END;
$$;
REVOKE ALL ON FUNCTION public.resolver_solicitud_atomica(bigint,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_solicitud_atomica(bigint,text,text,text,jsonb) TO service_role;
