-- Organización y marcas de admisión, con referencias exclusivas a postulantes.
create table public.post_ef_organizaciones (
 id uuid primary key, nombre text not null check(length(trim(nombre)) between 1 and 100),
 fecha date not null, ciclo text not null default 'POSTULANTES 2027' check(ciclo='POSTULANTES 2027'),
 modo text not null check(modo in ('PILOTO','EVALUACION')), habilitado boolean not null default false,
 grupos jsonb not null check(jsonb_typeof(grupos)='array'), version integer not null check(version>0),
 actor_id text not null references public.profesores(id), actualizado_en timestamptz not null default now()
);
create index post_ef_organizaciones_fecha on public.post_ef_organizaciones(fecha);
create table public.post_ef_organizacion_historial (
 id bigint generated always as identity primary key, organizacion_id uuid not null references public.post_ef_organizaciones(id),
 version integer not null, snapshot jsonb not null, creado_en timestamptz not null default now()
);
create index post_ef_historial_organizacion on public.post_ef_organizacion_historial(organizacion_id,version);
create table public.post_ef_perfiles (
 postulante_id uuid primary key references public.post_postulantes(id), fecha_nacimiento date not null,
 sexo text not null check(sexo in ('M','F')), actor_id text not null references public.profesores(id),
 actualizado_en timestamptz not null default now()
);
create table public.post_ef_registros (
 id uuid primary key, organizacion_id uuid not null references public.post_ef_organizaciones(id),
 postulante_id uuid not null references public.post_postulantes(id), prueba text not null check(prueba in ('talla_peso','flexiones','abdominales','aerobica','natacion','barras')),
 fecha date not null, valor numeric not null check(valor between 0 and 10000), sexo text check(sexo in ('M','F')), nacimiento date,
 calculo jsonb not null, actor_id text not null references public.profesores(id), modo text not null check(modo in ('PRUEBA','EVALUACION')),
 revision bigint generated always as identity, creado_en timestamptz not null default now()
);
create index post_ef_registros_org on public.post_ef_registros(organizacion_id,postulante_id,revision desc);
create index post_ef_registros_persona on public.post_ef_registros(postulante_id,creado_en desc);
create table public.post_ef_condiciones (
 id uuid primary key, organizacion_id uuid not null references public.post_ef_organizaciones(id),
 postulante_id uuid not null references public.post_postulantes(id), prueba text not null,
 estado text not null check(estado in ('NORMAL','CON_PAPELETA','SIN_PAPELETA','NO_ASISTIO')),
 observacion text not null default '', referencia text not null default '', actor_id text not null references public.profesores(id),
 creado_en timestamptz not null default now()
);
create index post_ef_condiciones_org on public.post_ef_condiciones(organizacion_id,postulante_id,creado_en desc);
do $$ declare t text; begin
 foreach t in array array['post_ef_organizaciones','post_ef_organizacion_historial','post_ef_perfiles','post_ef_registros','post_ef_condiciones'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.post_ef_organizacion_historial_id_seq,public.post_ef_registros_revision_seq to service_role;
create function public.post_ef_validar_grupos() returns trigger language plpgsql security invoker set search_path='' as $$
declare g jsonb; ids uuid[]:='{}'; persona text; begin
 if tg_op='UPDATE' and (new.fecha<>old.fecha or new.ciclo<>old.ciclo or new.version<>old.version+1) then raise exception 'RECARGUE LA ORGANIZACIÓN ANTES DE GUARDAR'; end if;
 if jsonb_array_length(new.grupos) not between 1 and 12 then raise exception 'REVISE LOS GRUPOS'; end if;
 for g in select value from jsonb_array_elements(new.grupos) loop
  if jsonb_typeof(g->'alumnos')<>'array' or jsonb_array_length(g->'alumnos')=0 then raise exception 'GRUPO SIN POSTULANTES'; end if;
  for persona in select jsonb_array_elements_text(g->'alumnos') loop
   if persona::uuid=any(ids) or not exists(select 1 from public.post_postulantes p where p.id=persona::uuid and p.convocatoria_id=2027 and p.identidad_verificada) then raise exception 'POSTULANTE REPETIDO O AJENO A LA CONVOCATORIA'; end if;
   ids:=array_append(ids,persona::uuid);
  end loop;
 end loop; return new;
end $$;
create trigger post_ef_grupos_validos before insert or update on public.post_ef_organizaciones for each row execute function public.post_ef_validar_grupos();
create function public.post_ef_auditar() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_table_name='post_ef_organizaciones' then
  insert into public.post_ef_organizacion_historial(organizacion_id,version,snapshot) values(new.id,new.version,to_jsonb(new));
 else
  insert into public.post_historial(postulante_id,accion,actor,motivo,nuevo)
  values(new.postulante_id,'FISICA_'||upper(tg_table_name),new.actor_id,'Registro de evaluación física de admisión; sin sanción disciplinaria',to_jsonb(new));
 end if;return new;
end $$;
create trigger post_ef_org_auditoria after insert or update on public.post_ef_organizaciones for each row execute function public.post_ef_auditar();
create trigger post_ef_marca_auditoria after insert on public.post_ef_registros for each row execute function public.post_ef_auditar();
create trigger post_ef_datos_auditoria after insert or update on public.post_ef_perfiles for each row execute function public.post_ef_auditar();
create trigger post_ef_condicion_auditoria after insert on public.post_ef_condiciones for each row execute function public.post_ef_auditar();
revoke all on function public.post_ef_validar_grupos(),public.post_ef_auditar() from public,anon,authenticated;
grant execute on function public.post_ef_validar_grupos(),public.post_ef_auditar() to service_role;
create view public.post_ef_nomina with (security_invoker=true) as
 select id,ci,nombre_completo,grado,arma,filiacion->>'fecha_nacimiento' as fecha_nacimiento,
 foto is not null as tiene_foto,identidad_verificada from public.post_postulantes where convocatoria_id=2027;
revoke all on public.post_ef_nomina from public,anon,authenticated;
grant select on public.post_ef_nomina to service_role;
