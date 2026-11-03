begin;
alter table public.efmc_organizaciones add column publicada_en timestamptz, add column publicada_por text, add column publicacion_semestre smallint, add column publicacion_alumnos integer;
alter table public.evaluaciones_fisicas add column efmc_organizacion_id uuid references public.efmc_organizaciones(id);
create unique index efmc_nota_publicada on public.evaluaciones_fisicas(efmc_organizacion_id,cursante_id) where efmc_organizacion_id is not null;

-- Writers and publication share the organization row lock. Closing never hides
-- the organization: students retain access to their marks, confirmations and PDF.
create function public.efmc_validar_abierta() returns trigger language plpgsql security invoker set search_path='' as $$
declare cerrada timestamptz;
begin
 if tg_table_name='efmc_organizaciones' then
  if old.publicada_en is not null then raise exception 'EVALUACIÓN CERRADA Y PUBLICADA'; end if;
 else
  if new.organizacion_id is null then return new; end if;
  select publicada_en into cerrada from public.efmc_organizaciones where id=new.organizacion_id for share;
  if cerrada is not null then raise exception 'EVALUACIÓN CERRADA Y PUBLICADA'; end if;
 end if;
 return new;
end $$;
create trigger efmc_00_abierta before insert on public.efmc_registros for each row execute function public.efmc_validar_abierta();
create trigger efmc_condicion_abierta before insert on public.efmc_condiciones for each row execute function public.efmc_validar_abierta();
create trigger efmc_organizacion_cerrada before update on public.efmc_organizaciones for each row execute function public.efmc_validar_abierta();
revoke all on function public.efmc_validar_abierta() from public,anon,authenticated;
grant execute on function public.efmc_validar_abierta() to service_role;

create function public.efmc_publicar_diagnostica(p_organizacion uuid,p_actor text,p_version integer,p_semestre integer,p_publicar boolean default false,p_huella text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
#variable_conflict use_variable
declare
 o public.efmc_organizaciones; c public.cursantes; r public.efmc_registros;
 g jsonb; alumno text; prueba text; pruebas text[]; excelencia boolean;
 filas jsonb:='[]'; fila jsonb; fuentes jsonb:='[]'; bloqueos jsonb:='[]';
 total integer:=0; completos integer:=0; reemplazos integer:=0; validas integer; n numeric; aporte numeric; final numeric;
 condicion text; actor_nombre text; huella text; id_efm bigint; carga bigint; previa public.evaluaciones_fisicas;
 datos public.evaluaciones_fisicas; claves text[]; columnas text; valores text; afectados integer; periodo text;
begin
 if p_actor is null or p_actor not in ('P019','P020','P030') or not exists(select 1 from public.profesores where id=p_actor and activo=true and coalesce(es_suboficial,false)=false and coalesce(es_auxiliar,false)=false and coalesce(solo_lectura,false)=false) then
  return jsonb_build_object('ok',false,'error','CUENTA NO AUTORIZADA PARA PUBLICAR');
 end if;
 select * into o from public.efmc_organizaciones where id=p_organizacion for update;
 if not found or o.modo<>'EVALUACION' then return jsonb_build_object('ok',false,'error','SELECCIONÁ UNA EVALUACIÓN'); end if;
 if o.publicada_en is not null then return jsonb_build_object('ok',true,'publicada',true,'alumnos',o.publicacion_alumnos); end if;
 if not o.habilitado or o.version<>p_version or p_semestre is null or p_semestre not in(1,2) then return jsonb_build_object('ok',false,'error','ACTUALIZÁ LA EVALUACIÓN Y REVISÁ EL SEMESTRE'); end if;
 -- Serialize against legacy Excel imports/publication while matching prior notes.
 lock table public.evaluaciones_fisicas in share row exclusive mode;
 periodo:=extract(year from o.fecha)::text||' · '||o.ciclo||' · semestre del año '||p_semestre;
 for g in select value from jsonb_array_elements(o.grupos) loop
  excelencia:=g->>'modalidad'='EXCELENCIA' or (coalesce(g->>'modalidad','')='' and g->>'color'='NEGRO');
  excelencia:=coalesce(excelencia,false);
  pruebas:=case when excelencia then array['natacion','barras','abdominales','flexiones','aerobica'] else array['talla_peso','natacion','abdominales','flexiones','aerobica'] end;
  for alumno in select jsonb_array_elements_text(g->'alumnos') loop
   total:=total+1;
   select * into c from public.cursantes where id=alumno and activo=true;
   if not found or c.ciclo<>o.ciclo then bloqueos:=bloqueos||jsonb_build_array(alumno||': cuenta inactiva o ciclo diferente'); continue; end if;
   fila:=jsonb_build_object('cursante_id',c.id,'nombre_completo',c.nombre_completo,'ci',c.ci,'grado',c.grado,'arma',c.arma,'paralelo',c.paralelo,'ciclo',o.ciclo,'gestion',extract(year from o.fecha)::integer,'semestre',p_semestre,'tipo_evaluacion','DIAGNOSTICA','categoria',case when excelencia then 'EXCELENCIA' else 'NORMAL' end,'publicado',true,'efmc_organizacion_id',o.id,'observaciones','Evaluación de campo: '||o.nombre||' · '||o.fecha::text||'. Diagnóstica: no promedia.');
   validas:=0;final:=0;
   foreach prueba in array pruebas loop
    select * into r from public.efmc_registros where organizacion_id=o.id and cursante_id=c.id and efmc_registros.prueba=prueba and fecha=o.fecha order by revision desc limit 1;
    select estado into condicion from public.efmc_condiciones where organizacion_id=o.id and cursante_id=c.id and efmc_condiciones.prueba in ('TODAS',prueba) order by creado_en desc limit 1;
    if r.id is null or jsonb_typeof(r.calculo->'nota') is distinct from 'number' or coalesce(condicion,'NORMAL')<>'NORMAL' then
     bloqueos:=bloqueos||jsonb_build_array(c.nombre_completo||': '||prueba||' pendiente o con novedad');continue;
    end if;
    n:=(r.calculo->>'nota')::numeric;
    if n<0 or n>100 or r.calculo->>'estado'='NO_REALIZO' or (excelencia and coalesce(r.calculo->>'modalidad','')<>'EXCELENCIA') or (not excelencia and r.calculo->>'modalidad'='EXCELENCIA') then bloqueos:=bloqueos||jsonb_build_array(c.nombre_completo||': revisar '||prueba);continue;end if;
    validas:=validas+1;
    aporte:=round(n*(case when excelencia then 20 when prueba='talla_peso' then 29 when prueba='natacion' then 11 else 20 end)/100,2);final:=final+aporte;
    fuentes:=fuentes||jsonb_build_array(r.id);
    fila:=fila||jsonb_build_object('edad',extract(year from age(o.fecha,r.nacimiento))::text);
    if prueba='talla_peso' then fila:=fila||jsonb_build_object('talla',r.calculo->>'talla','peso',r.calculo->>'peso','nota_talla_peso',n::text,'nota_talla_peso_pon',aporte::text);
    elsif prueba='natacion' then fila:=fila||jsonb_build_object('natacion_distancia',case when excelencia then '100' else r.valor::text end,'natacion_tiempo',case when excelencia then to_char(make_interval(secs=>r.valor::double precision),'MI:SS.MS') else null end,'natacion_nota',n::text,'natacion_nota_pon',aporte::text);
    elsif prueba='barras' then fila:=fila||jsonb_build_object('barra_cant',r.valor::text,'barra_nota',n::text,'barra_obs','Aporte ponderado: '||aporte::text||' (20 %)');
    elsif prueba='aerobica' then fila:=fila||jsonb_build_object('aerobica_tiempo',to_char(make_interval(secs=>r.valor::double precision),'MI:SS.MS'),'aerobica_nota',n::text,'aerobica_nota_pon',aporte::text);
    else fila:=fila||jsonb_build_object(prueba||'_cant',r.valor::text,prueba||'_nota',n::text,prueba||'_nota_pon',aporte::text); end if;
   end loop;
   if validas=5 then completos:=completos+1;end if;
   fila:=fila||jsonb_build_object('nota_final',round(final,2)::text);
   if (select count(*) from public.evaluaciones_fisicas e where e.cursante_id=c.id and e.gestion=extract(year from o.fecha)::integer and e.semestre=p_semestre and e.ciclo=o.ciclo and e.tipo_evaluacion='DIAGNOSTICA')>1 then
    bloqueos:=bloqueos||jsonb_build_array(c.nombre_completo||': existen varias diagnósticas en ese período; revisar en el panel EFM');
   end if;
   select * into previa from public.evaluaciones_fisicas e where e.cursante_id=c.id and e.gestion=extract(year from o.fecha)::integer and e.semestre=p_semestre and e.ciclo=o.ciclo and e.tipo_evaluacion='DIAGNOSTICA' order by efm_id limit 1;
   if previa.efm_id is not null then
    reemplazos:=reemplazos+1;
    fuentes:=fuentes||jsonb_build_array(jsonb_build_object('previa',to_jsonb(previa),'conformidad',(select to_jsonb(cf) from public.efm_confirmaciones cf where cf.efm_id=previa.efm_id)));
    if previa.efmc_organizacion_id is not null and previa.efmc_organizacion_id<>o.id then bloqueos:=bloqueos||jsonb_build_array(c.nombre_completo||': ya existe otra evaluación de campo publicada en este período');end if;
   end if;
   filas:=filas||jsonb_build_array(fila);
  end loop;
 end loop;
 if total=0 then bloqueos:=bloqueos||jsonb_build_array('No hay alumnos en este ciclo');end if;
 if (select count(distinct x->>'cursante_id') from jsonb_array_elements(filas) x)<>jsonb_array_length(filas) then bloqueos:=bloqueos||jsonb_build_array('Hay alumnos repetidos entre grupos');end if;
 huella:=md5(jsonb_build_array(o.version,p_semestre,filas,fuentes,bloqueos)::text);
 if not p_publicar then return jsonb_build_object('ok',true,'publicada',false,'alumnos',total,'completos',completos,'bloqueos',bloqueos,'huella',huella,'periodo',periodo,'reemplazos',reemplazos,'notas',(select jsonb_agg(jsonb_build_object('nombre',x->>'nombre_completo','nota',x->>'nota_final')) from jsonb_array_elements(filas) x));end if;
 if jsonb_array_length(bloqueos)>0 then return jsonb_build_object('ok',false,'error','HAY NOTAS PENDIENTES O NOVEDADES. REVISÁ ANTES DE CERRAR.');end if;
 if p_huella is distinct from huella then return jsonb_build_object('ok',false,'error','LAS NOTAS CAMBIARON. REVISÁ NUEVAMENTE ANTES DE PUBLICAR.');end if;
 select concat_ws(' ',grado,nombre_completo) into actor_nombre from public.profesores where id=p_actor;
 insert into public.efm_cargas(gestion,semestre,ciclo,tipo_evaluacion,categoria,archivo,filas,subido_por,subido_por_nombre) values(extract(year from o.fecha)::integer,p_semestre,o.ciclo,'DIAGNOSTICA','NORMAL','CAMPO · '||o.nombre,total,p_actor,actor_nombre) returning id into carga;
 for fila in select value from jsonb_array_elements(filas) loop
  select * into previa from public.evaluaciones_fisicas e where e.cursante_id=fila->>'cursante_id' and e.gestion=extract(year from o.fecha)::integer and e.semestre=p_semestre and e.ciclo=o.ciclo and e.tipo_evaluacion='DIAGNOSTICA';
  if previa.efmc_organizacion_id is not null and previa.efmc_organizacion_id<>o.id then raise exception 'YA EXISTE OTRA EVALUACIÓN DE CAMPO PUBLICADA EN ESE PERÍODO';end if;
  fila:=fila||jsonb_build_object('carga_id',carga,'actualizado_en',now());
  -- Clear obsolete fields when replacing an older import; preserve its forensic snapshot.
  fila:=jsonb_build_object('talla',null,'peso',null,'nota_talla_peso',null,'nota_talla_peso_pon',null,'natacion_tiempo',null,'natacion_distancia',null,'barra_cant',null,'barra_nota',null,'talla_peso_obs',null,'natacion_obs',null,'abdominales_obs',null,'flexiones_obs',null,'barra_obs',null,'aerobica_obs',null)||fila;
  select array_agg(key order by key) into claves from jsonb_object_keys(fila) key;
  select string_agg(format('%I',k),','), string_agg(format('x.%I',k),',') into columnas,valores from unnest(claves) k;
  if previa.efm_id is null then
   execute format('insert into public.evaluaciones_fisicas(%s) select %s from jsonb_populate_record(null::public.evaluaciones_fisicas,$1) x returning efm_id',columnas,valores) into id_efm using fila;
  else
   id_efm:=previa.efm_id;
   insert into public.efm_correcciones(efm_id,cursante_id,origen,antes,despues,motivo,por_id,por_nombre) values(id_efm,previa.cursante_id,'recarga',jsonb_build_object('nota',to_jsonb(previa),'conformidad',(select to_jsonb(cf) from public.efm_confirmaciones cf where cf.efm_id=id_efm)),fila,'Cierre y publicación de evaluación de campo',p_actor,actor_nombre);
   execute format('update public.evaluaciones_fisicas e set (%s)=(select %s from jsonb_populate_record(null::public.evaluaciones_fisicas,$1) x) where e.efm_id=$2',columnas,valores) using fila,id_efm;
  end if;
  -- A new confirmation ID prevents signing the new grade from a stale open form.
  insert into public.efm_confirmaciones(efm_id,cursante_id,gestion,semestre,ciclo,tipo_evaluacion,nota_final,estado,publicado_en) values(id_efm,fila->>'cursante_id',extract(year from o.fecha)::integer,p_semestre,o.ciclo,'DIAGNOSTICA',fila->>'nota_final','pendiente',now())
  on conflict(efm_id) do update set id=default,nota_final=excluded.nota_final,estado='pendiente',publicado_en=now(),confirmada_en=null,observacion_cursante=null,firma_cursante=null,huella_forense=null,postergacion=null,actualizado_en=now();
 end loop;
 update public.efmc_organizaciones set publicada_en=now(),publicada_por=p_actor,publicacion_semestre=p_semestre,publicacion_alumnos=total,version=version+1,actualizado_en=now() where id=o.id;
 return jsonb_build_object('ok',true,'publicada',true,'alumnos',total);
end $$;
revoke all on function public.efmc_publicar_diagnostica(uuid,text,integer,integer,boolean,text) from public,anon,authenticated;
grant execute on function public.efmc_publicar_diagnostica(uuid,text,integer,integer,boolean,text) to service_role;
commit;
