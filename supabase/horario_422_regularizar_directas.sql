-- Regularización única, auditable e idempotente de cambios directos antiguos.
-- Solo futuras pendientes creadas Y actualizadas por los tres editores.
-- No altera horas, audiencias, propuestas ajenas, rechazadas ni retiradas.
with antes as materialized (
  select * from public.planif_propuestas
  where estado='pendiente'
    and fecha >= (now() at time zone 'America/La_Paz')::date
    and creado_por in ('P030','P032','S002')
    and actualizado_por in ('P030','P032','S002')
  for update
), actualizadas as (
  update public.planif_propuestas p set
    estado='aprobada', aprobado_por=a.actualizado_por,
    aprobado_por_nombre=a.actualizado_por_nombre,
    aprobado_en=now(), motivo_rechazo=null, version=a.version+1,
    actividad=upper(a.actividad), lugar=upper(a.lugar),
    responsable=upper(a.responsable), asisten=upper(a.asisten),
    uniforme=upper(a.uniforme), motivo=upper(a.motivo)
  from antes a where p.id=a.id and p.version=a.version
  returning p.*
), registro as (
  insert into public.planif_propuestas_log
    (propuesta_id,usuario_id,usuario_nombre,accion,antes,despues)
  select p.id,p.actualizado_por,p.actualizado_por_nombre,'modificar',to_jsonb(a),to_jsonb(p)
  from actualizadas p join antes a on a.id=p.id
  returning id
)
select count(*) as cambios_directos_regularizados from registro;
