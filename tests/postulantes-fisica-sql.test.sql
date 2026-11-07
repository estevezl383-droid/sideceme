begin;
do $$
declare p1 uuid:=gen_random_uuid();p2 uuid:=gen_random_uuid();org uuid:=gen_random_uuid();marca uuid:=gen_random_uuid();g jsonb;bad boolean:=false;
begin
 insert into public.post_postulantes(id,ci,nombre_completo,password_hash,identidad_verificada) values(p1,'999999111','PERSONA FICTICIA PRUEBA UNO','HASH-FICTICIO',true),(p2,'999999112','PERSONA FICTICIA PRUEBA DOS','HASH-FICTICIO',true);
 g:=jsonb_build_array(jsonb_build_object('id','ROJO-TEST','color','ROJO','alumnos',jsonb_build_array(p1,p2),'encargados','{}'::jsonb,'apoyos','[]'::jsonb));
 insert into public.post_ef_organizaciones(id,nombre,fecha,ciclo,modo,habilitado,grupos,version,actor_id) values(org,'ORGANIZACIÓN FICTICIA TRANSACCIONAL','2026-11-20','POSTULANTES 2027','PILOTO',true,g,1,'P030');
 if (select count(*) from public.post_ef_organizacion_historial where organizacion_id=org)<>1 then raise exception 'FALTA AUDITORÍA DE ALTA';end if;
 update public.post_ef_organizaciones set version=2 where id=org and version=1;
 if (select count(*) from public.post_ef_organizacion_historial where organizacion_id=org)<>2 then raise exception 'FALTA AUDITORÍA DE REVISIÓN';end if;
 begin update public.post_ef_organizaciones set version=2 where id=org;exception when raise_exception then bad:=true;end;
 if not bad then raise exception 'NO RECHAZÓ VERSIÓN CONCURRENTE';end if;bad:=false;
 begin update public.post_ef_organizaciones set grupos=g||g,version=3 where id=org;exception when raise_exception then bad:=true;end;
 if not bad then raise exception 'NO RECHAZÓ POSTULANTES DUPLICADOS';end if;bad:=false;
 begin update public.post_ef_organizaciones set grupos=jsonb_build_array(jsonb_build_object('id','AJENO','color','AZUL','alumnos',jsonb_build_array(gen_random_uuid()))),version=3 where id=org;exception when raise_exception then bad:=true;end;
 if not bad then raise exception 'NO RECHAZÓ PERSONA AJENA';end if;
 insert into public.post_ef_registros(id,organizacion_id,postulante_id,prueba,fecha,valor,sexo,nacimiento,calculo,actor_id,modo) values(marca,org,p1,'flexiones','2026-11-20',0,'M','1987-01-01','{"estado":"PENDIENTE_ACTA","nota":null}','P030','PRUEBA');
 if not exists(select 1 from public.post_historial where postulante_id=p1 and nuevo->>'id'=marca::text) then raise exception 'FALTA AUDITORÍA DE MARCA';end if;
 if has_table_privilege('anon','public.post_ef_registros','SELECT') or has_table_privilege('authenticated','public.post_ef_organizaciones','UPDATE') then raise exception 'PRIVACIDAD NO APLICADA';end if;
end $$;
rollback;
select (select count(*) from public.post_postulantes where convocatoria_id=2027) as postulantes_reales,(select count(*) from public.post_ef_organizaciones) as organizaciones_postulantes,(select count(*) from public.efmc_organizaciones) as organizaciones_cursantes,(select count(*) from public.efmc_registros) as registros_cursantes;
