-- Run inside a transaction and ROLLBACK. Fictitious accounts only.
do $$
declare org uuid:=gen_random_uuid(); org2 uuid:=gen_random_uuid(); alumno text:='TEST-PUBLICACION-'||gen_random_uuid()::text; p text; r jsonb; h text; e bigint; conf jsonb; blocked boolean;
begin
 insert into public.cursantes(id,ci,nombre_completo,ciclo,activo) values(alumno,alumno,'ALUMNO FICTICIO PUBLICACION','1ER CICLO',true);
 insert into public.efmc_organizaciones(id,nombre,fecha,ciclo,modo,habilitado,grupos,actor_id) values(org,'DIAGNOSTICA FICTICIA','2098-11-03','1ER CICLO','EVALUACION',true,jsonb_build_array(jsonb_build_object('id','TEST','color','AZUL','alumnos',jsonb_build_array(alumno))),'P030');
 r:=public.efmc_publicar_diagnostica(org,'OTRO',1,2,false,null);assert (r->>'ok')::boolean=false,'unauthorized';
 r:=public.efmc_publicar_diagnostica(org,'P030',1,2,false,null);assert jsonb_array_length(r->'bloqueos')=5,'missing notes';
 r:=public.efmc_publicar_diagnostica(org,'P030',1,2,true,'bad');assert (r->>'ok')::boolean=false,'cannot publish missing';
 foreach p in array array['talla_peso','natacion','abdominales','flexiones','aerobica'] loop
  insert into public.efmc_registros(id,organizacion_id,cursante_id,prueba,fecha,valor,sexo,nacimiento,calculo,actor_id,modo) values(gen_random_uuid(),org,alumno,p,'2098-11-03',case when p='aerobica' then 1105 else 30 end,'M','2060-01-01',jsonb_build_object('nota',case when p='natacion' then 0 else 100 end,'peso',62.4,'talla',1.56,'modalidad','ORDINARIA'),'P030','EVALUACION');
 end loop;
 r:=public.efmc_publicar_diagnostica(org,'P019',1,2,false,null);assert jsonb_array_length(r->'bloqueos')=0,'complete zero accepted';h:=r->>'huella';
 r:=public.efmc_publicar_diagnostica(org,'P020',1,2,false,null);assert r->>'huella'=h,'stable preview across responsible accounts';
 r:=public.efmc_publicar_diagnostica(org,'P030',1,2,true,'bad');assert (r->>'ok')::boolean=false,'stale preview';
 -- A previous published grade and recognition are preserved in the audit trail.
 insert into public.evaluaciones_fisicas(cursante_id,ciclo,gestion,semestre,tipo_evaluacion,nota_final,publicado) values(alumno,'1ER CICLO',2098,2,'DIAGNOSTICA','29',true) returning efm_id into e;
 insert into public.efm_confirmaciones(efm_id,cursante_id,estado,firma_cursante,nota_final) values(e,alumno,'confirmada','FIRMA-FICTICIA','29');
 r:=public.efmc_publicar_diagnostica(org,'P030',1,2,true,h);assert (r->>'ok')::boolean=false,'old grade changed after preview';
 r:=public.efmc_publicar_diagnostica(org,'P030',1,2,false,null);h:=r->>'huella';assert (r->>'reemplazos')::integer=1;
 r:=public.efmc_publicar_diagnostica(org,'P030',1,2,true,h);assert (r->>'ok')::boolean=true,'publication';
 assert (select nota_final::numeric=89 and publicado and efmc_organizacion_id=org from public.evaluaciones_fisicas where efm_id=e),'weighted final incl zero';
 assert (select estado='pendiente' and firma_cursante is null from public.efm_confirmaciones where efm_id=e),'renew final recognition';
 assert exists(select 1 from public.efm_correcciones where efm_id=e and antes->'conformidad'->>'firma_cursante'='FIRMA-FICTICIA'),'audit recognition';
 assert (select habilitado and publicada_en is not null from public.efmc_organizaciones where id=org),'closed still visible';
 r:=public.efmc_publicar_diagnostica(org,'P019',1,2,true,h);assert (r->>'ok')::boolean=true,'idempotent retry';
 assert (select count(*)=1 from public.evaluaciones_fisicas where efmc_organizacion_id=org),'no duplicates';
 blocked:=false;begin
  insert into public.efmc_registros(id,organizacion_id,cursante_id,prueba,fecha,valor,sexo,nacimiento,calculo,actor_id,modo) values(gen_random_uuid(),org,alumno,'natacion','2098-11-03',50,'M','2060-01-01','{"nota":100}','P030','EVALUACION');
 exception when others then blocked:=true;end;assert blocked,'closed marks protected';
 blocked:=false;begin update public.efmc_organizaciones set nombre='CAMBIO' where id=org;exception when others then blocked:=true;end;assert blocked,'closed organization protected';
 -- Excellence uses five equal weights and retains a zero in bars.
 insert into public.efmc_organizaciones(id,nombre,fecha,ciclo,modo,habilitado,grupos,actor_id) values(org2,'EXCELENCIA FICTICIA','2099-11-03','1ER CICLO','EVALUACION',true,jsonb_build_array(jsonb_build_object('id','TEST','color','NEGRO','modalidad','EXCELENCIA','alumnos',jsonb_build_array(alumno))),'P030');
 foreach p in array array['natacion','barras','abdominales','flexiones','aerobica'] loop
  insert into public.efmc_registros(id,organizacion_id,cursante_id,prueba,fecha,valor,sexo,nacimiento,calculo,actor_id,modo) values(gen_random_uuid(),org2,alumno,p,'2099-11-03',200,'M','2060-01-01',jsonb_build_object('nota',case when p='barras' then 0 else 100 end,'modalidad','EXCELENCIA'),'P030','EVALUACION');
 end loop;
 r:=public.efmc_publicar_diagnostica(org2,'P030',1,2,false,null);h:=r->>'huella';assert jsonb_array_length(r->'bloqueos')=0,'excellence ready';
 r:=public.efmc_publicar_diagnostica(org2,'P020',1,2,true,h);assert (r->>'ok')::boolean=true,'excellence published';
 assert (select nota_final::numeric=80 and categoria='EXCELENCIA' from public.evaluaciones_fisicas where efmc_organizacion_id=org2),'five equal weights';
end $$;
