-- Cada conformidad corresponde a una versión inmutable de marca y nota.
begin;
alter table public.efmc_registros drop constraint efmc_registros_modo_check;
alter table public.efmc_registros add constraint efmc_registros_modo_check check(modo in ('PRUEBA','EVALUACION'));
alter table public.efmc_registros add column revision bigint generated always as identity;
create index efmc_registros_vigente on public.efmc_registros(organizacion_id,cursante_id,prueba,fecha,revision desc);
create table public.efmc_conformidades (
 registro_id uuid primary key references public.efmc_registros(id),
 cursante_id text not null references public.cursantes(id),
 confirmado_en timestamptz not null default clock_timestamp()
);
create index efmc_conformidades_cursante on public.efmc_conformidades(cursante_id);
alter table public.efmc_conformidades enable row level security;
revoke all on public.efmc_conformidades from public,anon,authenticated;
grant select,insert on public.efmc_conformidades to service_role;
grant usage,select on sequence public.efmc_registros_revision_seq to service_role;

-- El mismo candado serializa corrección y confirmación. revision se asigna
-- después del candado, evitando inversiones entre escrituras simultáneas.
create function public.efmc_bloquear_registro() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(coalesce(new.organizacion_id::text,'PILOTO')||'/'||new.cursante_id||'/'||new.prueba||'/'||new.fecha::text,0));
 new.revision := nextval('public.efmc_registros_revision_seq');
 new.creado_en := clock_timestamp();
 return new;
end $$;
create trigger efmc_registro_lock before insert on public.efmc_registros for each row execute function public.efmc_bloquear_registro();

create function public.efmc_impedir_cambio_historico() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 raise exception 'El historial es inmutable. Registre una nueva corrección.';
end $$;
create trigger efmc_registros_inmutables before update or delete on public.efmc_registros for each row execute function public.efmc_impedir_cambio_historico();
create trigger efmc_conformidades_inmutables before update or delete on public.efmc_conformidades for each row execute function public.efmc_impedir_cambio_historico();

-- Sólo el backend puede invocarla, después de autenticar al cursante.
create function public.efmc_confirmar_registro(p_registro_id uuid,p_cursante_id text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare r public.efmc_registros; vigente uuid; c public.efmc_conformidades;
begin
 select * into r from public.efmc_registros where id=p_registro_id and cursante_id=p_cursante_id;
 if not found or r.organizacion_id is null then return jsonb_build_object('ok',false,'error','REGISTRO NO DISPONIBLE'); end if;
 perform pg_advisory_xact_lock(hashtextextended(r.organizacion_id::text||'/'||r.cursante_id||'/'||r.prueba||'/'||r.fecha::text,0));
 if not exists(select 1 from public.efmc_organizaciones o where o.id=r.organizacion_id and o.habilitado and o.modo='EVALUACION' and exists(select 1 from jsonb_array_elements(o.grupos) g where (g->'alumnos') ? p_cursante_id)) then
  return jsonb_build_object('ok',false,'error','EVALUACIÓN NO HABILITADA PARA TU CUENTA');
 end if;
 select id into vigente from public.efmc_registros where organizacion_id=r.organizacion_id and cursante_id=r.cursante_id and prueba=r.prueba and fecha=r.fecha order by revision desc limit 1;
 if vigente<>r.id then return jsonb_build_object('ok',false,'error','EL EVALUADOR CORRIGIÓ EL REGISTRO. REVISÁ LA NUEVA MARCA Y NOTA.'); end if;
 insert into public.efmc_conformidades(registro_id,cursante_id) values(r.id,p_cursante_id) on conflict(registro_id) do nothing;
 select * into c from public.efmc_conformidades where registro_id=r.id;
 return jsonb_build_object('ok',true,'conformidad',to_jsonb(c));
end $$;
revoke all on function public.efmc_bloquear_registro(),public.efmc_impedir_cambio_historico(),public.efmc_confirmar_registro(uuid,text) from public,anon,authenticated;
grant execute on function public.efmc_bloquear_registro(),public.efmc_impedir_cambio_historico(),public.efmc_confirmar_registro(uuid,text) to service_role;
commit;
