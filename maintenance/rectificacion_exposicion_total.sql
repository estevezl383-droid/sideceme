-- Preserva las rectificaciones administrativas de exposición registradas en eem_auditoria.
-- Sin cambios de permisos, sin alterar calificaciones originales de los jurados.
CREATE OR REPLACE FUNCTION public.fn_eem_calcular_nota_exposicion(p_cursante text, p_carpeta uuid)
 RETURNS TABLE(nota numeric, jurados integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare v_rectificacion numeric;
begin
  select (a.datos_despues->>'nota_expo_35_final')::numeric into v_rectificacion
  from eem_auditoria a join eem_notas_finales nf on nf.id::text=a.registro_id
  where a.tabla='eem_notas_finales' and a.modo='rectificacion_exposicion_total' and a.operacion='UPDATE' and (a.datos_antes->'nota_expo_35_final') is distinct from (a.datos_despues->'nota_expo_35_final')
    and nf.carpeta_id=p_carpeta and nf.cursante_id=p_cursante
  order by a.timestamp_ms desc,a.id desc limit 1;
  if v_rectificacion is not null then
    return query select v_rectificacion, count(*)::integer from eem_tribunal_cierres tc
      where tc.carpeta_id=p_carpeta and tc.cursante_id=p_cursante and tc.cerrado
      and not exists(select 1 from eem_tribunal_asignaciones a where a.carpeta_id=p_carpeta and a.profesor_id=tc.profesor_id and a.excluido);
    return;
  end if;
  return query
  with excluidos as (
    select profesor_id from eem_tribunal_asignaciones
     where carpeta_id = p_carpeta and excluido
  ),
  cerrados as (
    select tc.profesor_id from eem_tribunal_cierres tc
     where tc.carpeta_id = p_carpeta and tc.cursante_id = p_cursante and tc.cerrado
       and tc.profesor_id not in (select profesor_id from excluidos)
  ),
  por_item as (
    select ni.rubrica_item_id, avg(ni.valor) as prom
      from eem_notas_item ni
      join eem_rubrica_items ri on ri.id = ni.rubrica_item_id
      join cerrados c on c.profesor_id = ni.calificador_id
     where ni.carpeta_id = p_carpeta and ni.cursante_id = p_cursante
       and ni.origen = 'tribunal' and ri.bloque = 'EXPOSICION'
     group by ni.rubrica_item_id
  ),
  ajustes as (
    select ni.rubrica_item_id, ni.valor
      from eem_notas_item ni
      join eem_rubrica_items ri on ri.id = ni.rubrica_item_id
     where ni.carpeta_id = p_carpeta and ni.cursante_id = p_cursante
       and ni.origen = 'ajuste_manual' and ri.bloque = 'EXPOSICION'
  ),
  final as (
    select coalesce(a.valor, p.prom) as valor
      from por_item p
      full outer join ajustes a on a.rubrica_item_id = p.rubrica_item_id
  )
  select round(coalesce((select sum(valor) from final), 0), 4),
         (select count(*)::integer from cerrados);
end $function$;

CREATE OR REPLACE FUNCTION public.fn_eem_f4_comparativo(p_carpeta uuid, p_cursante text, p_solicitante text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare v_res jsonb; v_min numeric; v_max numeric;
begin
  if not fn_eem_puede_ver_otros_jurados(p_solicitante, p_carpeta, p_cursante) then
    raise exception 'EEM: vas a ver las notas de los demás jurados recién cuando cierres la tuya.'
      using errcode = '42501';
  end if;

  select jsonb_agg(t.x order by t.nom) into v_res from (
    select p.nombre_completo as nom, jsonb_build_object(
      'profesor_id', tc.profesor_id, 'grado', p.grado, 'nombre', p.nombre_completo,
      'cerrado', tc.cerrado, 'cerrado_en', tc.cerrado_en,
      'excluido', coalesce((select bool_or(a.excluido) from eem_tribunal_asignaciones a
                             where a.carpeta_id = p_carpeta and a.profesor_id = tc.profesor_id), false),
      'notas', coalesce((select jsonb_object_agg(ri.orden::text, ni.valor)
                           from eem_notas_item ni
                           join eem_rubrica_items ri on ri.id = ni.rubrica_item_id
                          where ni.carpeta_id = p_carpeta and ni.cursante_id = p_cursante
                            and ni.origen = 'tribunal' and ni.calificador_id = tc.profesor_id
                            and ri.bloque = 'EXPOSICION'), '{}'::jsonb),
      'total', coalesce((select sum(ni.valor) from eem_notas_item ni
                          join eem_rubrica_items ri on ri.id = ni.rubrica_item_id
                         where ni.carpeta_id = p_carpeta and ni.cursante_id = p_cursante
                           and ni.origen = 'tribunal' and ni.calificador_id = tc.profesor_id
                           and ri.bloque = 'EXPOSICION'), 0),
      'observacion', (select max(ni.evidencia->>'observacion') from eem_notas_item ni
                       where ni.carpeta_id = p_carpeta and ni.cursante_id = p_cursante
                         and ni.origen = 'tribunal' and ni.calificador_id = tc.profesor_id)
    ) as x
      from eem_tribunal_cierres tc
      join profesores p on p.id = tc.profesor_id
     where tc.carpeta_id = p_carpeta and tc.cursante_id = p_cursante
  ) t;

  select min((x->>'total')::numeric), max((x->>'total')::numeric) into v_min, v_max
    from jsonb_array_elements(coalesce(v_res,'[]'::jsonb)) x
   where (x->>'cerrado')::boolean and not (x->>'excluido')::boolean;

  return jsonb_build_object(
    'rectificacion_exposicion', (select jsonb_build_object('nota_anterior',(a.datos_antes->>'nota_expo_35_final')::numeric,'nota_rectificada',(a.datos_despues->>'nota_expo_35_final')::numeric,'motivo',a.motivo,'fecha',a.timestamp_ms,'auditoria_id',a.id)
from eem_auditoria a join eem_notas_finales nf_rect on nf_rect.id::text=a.registro_id
where a.tabla='eem_notas_finales' and a.modo='rectificacion_exposicion_total' and a.operacion='UPDATE' and (a.datos_antes->'nota_expo_35_final') is distinct from (a.datos_despues->'nota_expo_35_final')
and nf_rect.carpeta_id=p_carpeta and nf_rect.cursante_id=p_cursante
order by a.timestamp_ms desc,a.id desc limit 1),
    'jurados', coalesce(v_res, '[]'::jsonb),
    'promedio', (select nota from fn_eem_calcular_nota_exposicion(p_cursante, p_carpeta)),
    'cerrados', (select jurados from fn_eem_calcular_nota_exposicion(p_cursante, p_carpeta)),
    'brecha', coalesce(v_max - v_min, 0),
    'discrepancia', coalesce(v_max - v_min, 0) > 5
  );
end $function$;

CREATE OR REPLACE FUNCTION public.fn_eem_f5_acta_grupo(p_grupo uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  v_carpeta uuid; c record; g record; v_entrega record; v_rubrica uuid;
  v_hoy date; v_cfg jsonb; v_forma jsonb; v_fondo jsonb; v_expo jsonb;
  v_cursantes jsonb; v_jurados jsonb; v_texto numeric; v_nforma numeric;
  v_nfondo numeric; v_expo_tot numeric; v_avisos text[] := array[]::text[];
begin
  select * into g from eem_grupos where id = p_grupo;
  if g.id is null then
    raise exception 'EEM: ese grupo no existe.' using errcode = 'no_data_found';
  end if;
  v_carpeta := g.carpeta_id;
  select * into c from eem_carpetas_clase where id = v_carpeta;
  v_rubrica := c.rubrica_id;
  v_cfg := fn_eem_f5_config(v_carpeta);
  v_hoy := (now() at time zone 'America/La_Paz')::date;

  select e.* into v_entrega from eem_entregas e
   where e.grupo_id = p_grupo and e.vigente and e.estado <> 'anulada' limit 1;

  select jsonb_agg(jsonb_build_object(
           'orden', ri.orden, 'descripcion', ri.descripcion,
           'valor_pct', ri.valor_pct, 'nota', fn_eem_f5_nota2(x.valor)) order by ri.orden),
         fn_eem_f5_nota2(sum(x.valor))
    into v_forma, v_nforma
    from eem_rubrica_items ri
    left join lateral (
      select avg(ni.valor) as valor from eem_notas_item ni
       where ni.rubrica_item_id = ri.id and ni.carpeta_id = v_carpeta
         and ni.origen <> 'tribunal' and ni.entrega_id = v_entrega.id) x on true
   where ri.rubrica_id = v_rubrica and ri.bloque = 'FORMA';

  select jsonb_agg(jsonb_build_object(
           'orden', ri.orden, 'sub_bloque', ri.sub_bloque, 'descripcion', ri.descripcion,
           'valor_pct', ri.valor_pct, 'nota', fn_eem_f5_nota2(x.valor)) order by ri.orden),
         fn_eem_f5_nota2(sum(x.valor))
    into v_fondo, v_nfondo
    from eem_rubrica_items ri
    left join lateral (
      select avg(ni.valor) as valor from eem_notas_item ni
       where ni.rubrica_item_id = ri.id and ni.carpeta_id = v_carpeta
         and ni.origen <> 'tribunal' and ni.entrega_id = v_entrega.id) x on true
   where ri.rubrica_id = v_rubrica and ri.bloque = 'FONDO';

  select jsonb_agg(jsonb_build_object(
           'orden', ri.orden, 'descripcion', ri.descripcion,
           'valor_pct', ri.valor_pct, 'nota', fn_eem_f5_nota2(x.valor)) order by ri.orden)
    into v_expo
    from eem_rubrica_items ri
    left join lateral (
      select avg(ni.valor) as valor from eem_notas_item ni
       join eem_grupo_integrantes gi2 on gi2.cursante_id = ni.cursante_id
                                     and gi2.carpeta_id = v_carpeta and gi2.grupo_id = p_grupo
       join eem_tribunal_cierres tc on tc.carpeta_id = v_carpeta and tc.cursante_id = ni.cursante_id
                                   and tc.profesor_id = ni.calificador_id and tc.cerrado
       where ni.rubrica_item_id = ri.id and ni.carpeta_id = v_carpeta and ni.origen = 'tribunal'
         and ni.calificador_id not in (select a.profesor_id from eem_tribunal_asignaciones a
                                        where a.carpeta_id = v_carpeta and a.excluido)) x on true
   where ri.rubrica_id = v_rubrica and ri.bloque = 'EXPOSICION';

  select jsonb_agg(jsonb_build_object(
           'rectificacion_exposicion', (select jsonb_build_object('nota_anterior',(a.datos_antes->>'nota_expo_35_final')::numeric,'nota_rectificada',(a.datos_despues->>'nota_expo_35_final')::numeric,'motivo',a.motivo,'fecha',a.timestamp_ms,'auditoria_id',a.id)
from eem_auditoria a join eem_notas_finales nf_rect on nf_rect.id::text=a.registro_id
where a.tabla='eem_notas_finales' and a.modo='rectificacion_exposicion_total' and a.operacion='UPDATE' and (a.datos_antes->'nota_expo_35_final') is distinct from (a.datos_despues->'nota_expo_35_final')
and nf_rect.carpeta_id=v_carpeta and nf_rect.cursante_id=cu.id
order by a.timestamp_ms desc,a.id desc limit 1),
           'cursante_id', cu.id, 'grado', cu.grado, 'arma', cu.arma, 'nombre', cu.nombre_completo,
           'es_jefe', gi.es_jefe,
           'texto_65', fn_eem_f5_nota2(nf.nota_texto_65_final),
           'expo_35', fn_eem_f5_nota2(nf.nota_expo_35_final),
           'final_100', fn_eem_f5_nota2(nf.nota_final_100_final),
           'jurados', nf.jurados_contados,
           'consolidada', nf.id is not null,
           'requiere_recalculo', coalesce(nf.requiere_recalculo, false),
           'publicada', coalesce(nf.publicada, false),
           'no_expuso', au.id is not null,
           'decision_ausencia', au.decision,
           'motivo_ausencia', au.motivo)
         order by coalesce(cu.orden_paralelo, 9999), cu.nombre_completo),
         fn_eem_f5_nota2(avg(nf.nota_expo_35_final))
    into v_cursantes, v_expo_tot
    from eem_grupo_integrantes gi
    join cursantes cu on cu.id = gi.cursante_id
    left join eem_notas_finales nf on nf.carpeta_id = v_carpeta and nf.cursante_id = cu.id
    left join eem_tribunal_ausencias au on au.carpeta_id = v_carpeta and au.cursante_id = cu.id
                                       and not au.anulada
   where gi.carpeta_id = v_carpeta and gi.grupo_id = p_grupo;

  select fn_eem_f5_nota2(max(nf.nota_texto_65_final)) into v_texto
    from eem_grupo_integrantes gi
    join eem_notas_finales nf on nf.carpeta_id = v_carpeta and nf.cursante_id = gi.cursante_id
   where gi.carpeta_id = v_carpeta and gi.grupo_id = p_grupo;

  select jsonb_agg(jsonb_build_object(
           'profesor_id', j.profesor_id,
           'nombre', btrim(coalesce(j.grado||' ','')||j.nombre_completo),
           'presidente', j.presidente)
         order by j.presidente desc, j.nombre_completo)
    into v_jurados
    from fn_eem_f4_jurados_grupo(p_grupo) j
   where not j.excluido;

  if v_entrega.id is null then
    v_avisos := array_append(v_avisos, 'El grupo no tiene trabajo entregado: el acta sale sin las notas del texto.');
  end if;
  if v_jurados is null then
    v_avisos := array_append(v_avisos, 'Nadie esta designado como jurado de este grupo: el bloque de firmas sale sin nombres.');
  elsif jsonb_array_length(v_jurados) < 3 then
    v_avisos := array_append(v_avisos, ('La mesa tiene ' || jsonb_array_length(v_jurados) || ' jurado(s): el reglamento pide 3 como minimo.'));
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(v_cursantes,'[]'::jsonb)) e
              where not (e->>'consolidada')::boolean) then
    v_avisos := array_append(v_avisos, 'Hay integrantes sin consolidar: sus casillas salen vacias.');
  end if;
  if exists (select 1 from jsonb_array_elements(coalesce(v_cursantes,'[]'::jsonb)) e
              where (e->>'requiere_recalculo')::boolean) then
    v_avisos := array_append(v_avisos, 'Hay integrantes marcados para RECALCULO: la nota impresa seria la vieja.');
  end if;
  if (v_cfg->>'ciclo_nombre') is null or (v_cfg->>'jefe_nombre') is null then
    v_avisos := array_append(v_avisos, 'Falta configurar el Evaluador de Ciclo o el Jefe de Evaluaciones: ese renglon sale en blanco.');
  end if;

  return jsonb_build_object(
    'carpeta', jsonb_build_object('id', v_carpeta, 'materia', c.materia_nombre,
        'codigo_materia', c.materia_codigo, 'ciclo', c.ciclo, 'gestion', c.gestion),
    'config', v_cfg,
    'grupo', jsonb_build_object('id', g.id, 'numero', g.numero, 'nombre', g.nombre,
        'tema', g.tema, 'paralelo', fn_eem_f4_paralelo(p_grupo)),
    'entrega', case when v_entrega.id is null then null else jsonb_build_object(
        'id', v_entrega.id, 'archivo', v_entrega.archivo_nombre, 'sha256', v_entrega.sha256,
        'entregado_en', v_entrega.entregado_en, 'fuera_de_plazo', v_entrega.fuera_de_plazo) end,
    'banda', (select to_jsonb(b) from eem_bandas_nota b where b.carpeta_id=v_carpeta and b.aplicar_a='texto_65' and b.activa limit 1),
    'forma', coalesce(v_forma, '[]'::jsonb),
    'fondo', coalesce(v_fondo, '[]'::jsonb),
    'exposicion', coalesce(v_expo, '[]'::jsonb),
    'totales', jsonb_build_object(
        'forma_20', v_nforma, 'fondo_45', v_nfondo,
        'texto_65', coalesce(v_texto, fn_eem_f5_nota2(coalesce(v_nforma,0) + coalesce(v_nfondo,0))),
        'exposicion_35_grupal', v_expo_tot),
    'cursantes', coalesce(v_cursantes, '[]'::jsonb),
    'jurados', coalesce(v_jurados, '[]'::jsonb),
    'fecha_texto', (v_cfg->>'lugar') || ', ' || fn_eem_f5_mes(extract(month from v_hoy)::integer)
                   || ' del ' || extract(year from v_hoy)::integer,
    'avisos', to_jsonb(v_avisos)
  );
end $function$;