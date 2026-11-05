import fs from 'node:fs';
export function sqlPrueba(migration){return `begin;
create schema efmc_test_borrado;
create table efmc_test_borrado.profesores(id text primary key,grado text,nombre_completo text,activo boolean);
create table efmc_test_borrado.cursantes(id text primary key,ciclo text);
create table efmc_test_borrado.efmc_organizaciones(id uuid primary key,nombre text,modo text,fecha date,ciclo text,publicada_en timestamptz);
create table efmc_test_borrado.efmc_registros(id uuid primary key,organizacion_id uuid,cursante_id text,prueba text,fecha date,modo text,calculo jsonb);
create table efmc_test_borrado.efmc_conformidades(registro_id uuid primary key);
grant usage on schema efmc_test_borrado to service_role;
grant select,insert,update on all tables in schema efmc_test_borrado to service_role;
${migration.replaceAll('public.','efmc_test_borrado.')}
insert into efmc_test_borrado.profesores values('P030','TCNL','ORGANIZADOR FICTICIO',true),('P019','TCNL','OTRO ORGANIZADOR',true),('P020','MY','INACTIVO',false),('P099','MY','NO JEFE',true);
insert into efmc_test_borrado.cursantes values('TEST1','1ER CICLO'),('TEST2','2DO CICLO');
insert into efmc_test_borrado.efmc_organizaciones values('10000000-0000-0000-0000-000000000001','PILOTO FICTICIO','PILOTO','2026-11-03','1ER CICLO',null),('10000000-0000-0000-0000-000000000002','EVALUACION FICTICIA','EVALUACION','2026-11-03','1ER CICLO',null);
insert into efmc_test_borrado.efmc_registros values
('20000000-0000-0000-0000-000000000001',null,'TEST1','flexiones','2026-11-03','PRUEBA','{}'),
('20000000-0000-0000-0000-000000000002',null,'TEST2','flexiones','2026-11-03','PRUEBA','{}'),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','TEST1','flexiones','2026-11-03','PRUEBA','{}'),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','TEST1','flexiones','2026-11-03','EVALUACION','{}'),
('20000000-0000-0000-0000-000000000005',null,'TEST1','flexiones','2026-11-04','PRUEBA','{}');
insert into efmc_test_borrado.efmc_conformidades values('20000000-0000-0000-0000-000000000005');
set local role service_role;
do $test$
declare r jsonb; q jsonb; t text; n int; a uuid:='30000000-0000-0000-0000-000000000001'; h text:=repeat('a',64);
begin
 if has_table_privilege('anon','efmc_test_borrado.efmc_historial_borrados','select') or has_table_privilege('authenticated','efmc_test_borrado.efmc_historial_borrados','insert') then raise exception 'tabla pública'; end if;
 if has_function_privilege('anon','efmc_test_borrado.efmc_confirmar_borrado(uuid,text,text,text)','execute') or has_function_privilege('authenticated','efmc_test_borrado.efmc_preparar_borrado(uuid,text,text,uuid,date,text,text)','execute') then raise exception 'RPC pública'; end if;
 if not (select relrowsecurity from pg_class where oid='efmc_test_borrado.efmc_historial_borrados'::regclass) then raise exception 'falta RLS'; end if;
 r:=efmc_test_borrado.efmc_preparar_borrado(a,'P099',h,null,'2026-11-03','1ER CICLO','Motivo ficticio de prueba');
 if (r->>'status')::int<>403 then raise exception 'no jefe'; end if;
 r:=efmc_test_borrado.efmc_preparar_borrado(a,'P020',h,null,'2026-11-03','1ER CICLO','Motivo ficticio de prueba');
 if (r->>'status')::int<>403 then raise exception 'inactivo'; end if;
 r:=efmc_test_borrado.efmc_preparar_borrado(a,'P030',h,'10000000-0000-0000-0000-000000000002','2026-11-03','1ER CICLO','Motivo ficticio de prueba');
 if (r->>'status')::int<>403 then raise exception 'evaluacion borrable'; end if;
 r:=efmc_test_borrado.efmc_preparar_borrado(a,'P030',h,null,'2026-11-04','1ER CICLO','Motivo ficticio de prueba');
 if (r->>'status')::int<>403 then raise exception 'conformidad borrable'; end if;
 r:=efmc_test_borrado.efmc_preparar_borrado(a,'P030',h,null,'2026-11-03','1ER CICLO','Motivo ficticio de prueba');
 if r->>'ok'<>'true' or r->'solicitud'->>'estado'<>'PREPARADA' or r->'solicitud' ? 'sesion_hash' or r->'solicitud' ? 'registros_ids' then raise exception 'preparacion incorrecta'; end if;
 select count(*) into n from efmc_test_borrado.efmc_candidatos_borrado(null,'2026-11-03','1ER CICLO');if n<>1 then raise exception 'preparar borró datos'; end if;
 q:=efmc_test_borrado.efmc_preparar_borrado(a,'P030',h,null,'2026-11-03','1ER CICLO','Motivo ficticio de prueba');if q<>r then raise exception 'preparacion no idempotente'; end if;
 q:=efmc_test_borrado.efmc_preparar_borrado(a,'P030',h,null,'2026-11-03','1ER CICLO','Un motivo distinto de prueba');if q->>'status'<>'409' then raise exception 'conflicto no detectado'; end if;
 q:=efmc_test_borrado.efmc_confirmar_borrado(a,'P030',h,'NO');if q->>'status'<>'400' then raise exception 'falta segunda confirmacion'; end if;
 q:=efmc_test_borrado.efmc_confirmar_borrado(a,'P019',h,'BORRAR');if q->>'status'<>'403' then raise exception 'otro actor'; end if;
 q:=efmc_test_borrado.efmc_confirmar_borrado(a,'P030',repeat('b',64),'BORRAR');if q->>'status'<>'403' then raise exception 'otra sesion'; end if;
 r:=efmc_test_borrado.efmc_confirmar_borrado(a,'P030',h,'BORRAR');if r->>'ok'<>'true' or r->'borrado'->>'actor_id'<>'P030' or r->'borrado'->>'confirmado_en' is null then raise exception 'auditoria incompleta'; end if;
 q:=efmc_test_borrado.efmc_confirmar_borrado(a,'P030',h,'BORRAR');if q<>r then raise exception 'borrado no idempotente'; end if;
 select count(*) into n from efmc_test_borrado.efmc_candidatos_borrado(null,'2026-11-03','1ER CICLO');if n<>0 then raise exception 'borrado aun activo'; end if;
 select count(*) into n from efmc_test_borrado.efmc_candidatos_borrado(null,'2026-11-03','2DO CICLO');if n<>1 then raise exception 'otro ciclo afectado'; end if;
 select count(*) into n from efmc_test_borrado.efmc_registros;if n<>5 then raise exception 'registros originales alterados'; end if;
 begin update efmc_test_borrado.efmc_historial_borrados set confirmado_en=clock_timestamp() where id=a;raise exception using errcode='ZX001',message='auditoria editable';exception when sqlstate 'P0001' then null;end;
 begin delete from efmc_test_borrado.efmc_historial_borrados where id=a;raise exception using errcode='ZX001',message='auditoria eliminable';exception when insufficient_privilege then null;end;
 insert into efmc_test_borrado.efmc_registros values('20000000-0000-0000-0000-000000000006',null,'TEST1','abdominales','2026-11-03','PRUEBA','{}');
 a:='30000000-0000-0000-0000-000000000002';r:=efmc_test_borrado.efmc_preparar_borrado(a,'P030',h,null,'2026-11-03','1ER CICLO','Otra prueba para concurrencia');
 insert into efmc_test_borrado.efmc_registros values('20000000-0000-0000-0000-000000000007',null,'TEST1','natacion','2026-11-03','PRUEBA','{}');
 q:=efmc_test_borrado.efmc_confirmar_borrado(a,'P030',h,'BORRAR');if q->>'status'<>'409' then raise exception 'cambio de registros no detectado'; end if;
 insert into efmc_test_borrado.efmc_historial_borrados(id,fecha,ciclo,actor_id,actor_nombre,sesion_hash,motivo,registros_ids,resumen,expira_en)
 values('30000000-0000-0000-0000-000000000003','2026-11-03','2DO CICLO','P030','ACTOR FICTICIO',h,'Solicitud ficticia vencida',array['20000000-0000-0000-0000-000000000002'::uuid],'{}',clock_timestamp()-interval '1 second');
 q:=efmc_test_borrado.efmc_confirmar_borrado('30000000-0000-0000-0000-000000000003','P030',h,'BORRAR');if q->>'status'<>'409' then raise exception 'solicitud vencida aceptada'; end if;
 a:='30000000-0000-0000-0000-000000000004';r:=efmc_test_borrado.efmc_preparar_borrado(a,'P030',h,'10000000-0000-0000-0000-000000000001','2026-11-03','1ER CICLO','Piloto ficticio para borrar');
 q:=efmc_test_borrado.efmc_confirmar_borrado(a,'P030',h,'BORRAR');if q->>'ok'<>'true' then raise exception 'piloto no borrado'; end if;
 select count(*) into n from efmc_test_borrado.efmc_historial_borrados where estado='BORRADA';if n<>2 then raise exception 'duplicacion de auditoria'; end if;
end $test$;
reset role;
rollback;
select 'OK: doble confirmación, identidad/sesión, RLS/permisos, inmutabilidad, idempotencia, concurrencia, vencimiento, aislamiento y evaluaciones protegidas; sin cambios persistentes' as resultado;`;}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1]))process.stdout.write(sqlPrueba(fs.readFileSync(new URL('../supabase/migrations/20261105145850_efmc_borrado_auditado.sql',import.meta.url),'utf8')));
