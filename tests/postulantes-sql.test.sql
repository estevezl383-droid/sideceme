-- Ejecutar dentro de BEGIN/ROLLBACK, después del setup. Solo identidades ficticias.
create function pg_temp.post_assert(ok boolean,msg text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FALLÓ: %',msg; end if; end $$;
create function pg_temp.post_rechaza(accion text,token text,datos jsonb,fragmento text,prueba_ip text default 'prueba') returns void language plpgsql as $$
declare rechazo boolean:=false; begin
 begin perform public.post_operar(accion,token,datos,prueba_ip); exception when others then
  if position(fragmento in sqlerrm)=0 then raise; end if; rechazo:=true;
 end;
 perform pg_temp.post_assert(rechazo,'Debía rechazar: '||accion||' / '||fragmento);
end $$;
do $$
declare owner_token text:='post-test-owner-'||gen_random_uuid(); cmd_token text:='post-test-cmd-'||gen_random_uuid(); read_token text:='post-test-reader-'||gen_random_uuid(); s_token text;
 r jsonb; p1 uuid; p2 uuid; e_id uuid; doc_id uuid; datos jsonb; original integer; i integer;
 foto text:='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jP5cAAAAASUVORK5CYII=';
begin
 insert into public.sesiones(token,usuario_id,usuario_ci,usuario_tabla,usuario_rol,expira_en,revocado,es_master)
 select owner_token,id,ci,'profesores',rol,now()+interval '1 hour',false,false from public.profesores where id='P030';
 insert into public.sesiones(token,usuario_id,usuario_ci,usuario_tabla,usuario_rol,expira_en,revocado,es_master)
 select cmd_token,id,ci,'profesores',rol,now()+interval '1 hour',false,false from public.profesores where id='P001';
 insert into public.sesiones(token,usuario_id,usuario_ci,usuario_tabla,usuario_rol,expira_en,revocado,es_master)
 select read_token,id,ci,'profesores',rol,now()+interval '1 hour',false,false from public.profesores where id='P032';
 perform pg_temp.post_assert(not has_function_privilege('anon','public.post_operar(text,text,jsonb,text)','execute'),'RPC inaccesible a anon');
 perform pg_temp.post_assert(not has_table_privilege('anon','public.post_postulantes','select'),'Identidades sin lectura anon');
 perform pg_temp.post_assert(not has_table_privilege('authenticated','public.post_postulantes','select'),'Identidades sin lectura authenticated');
 perform pg_temp.post_assert((select count(*)=10 and bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('post_convocatorias','post_permisos','post_materias','post_postulantes','post_sesiones','post_intentos','post_evaluaciones','post_historial','post_conformidades','post_certificados')),'RLS en todas las tablas nuevas');
 perform pg_temp.post_assert((select count(*)=9 from public.post_materias),'Seis materias y física, médica, psicológica');
 r:=public.post_operar('panel',owner_token,'{}','prueba');perform pg_temp.post_assert((r->>'admin')::boolean,'Panel autorizado');
 datos:=jsonb_build_object('ci','999000001','nombre_completo','PERSONA FICTICIA UNO','foto',foto,'fuente','PRUEBA AUTOMATIZADA','motivo','ALTA DE PRUEBA','habilitado',true,'identidad_verificada',true);
 r:=public.post_operar('guardar_postulante',owner_token,datos,'prueba');p1:=(r->>'id')::uuid;
 datos:=datos||jsonb_build_object('ci','999000002','nombre_completo','PERSONA FICTICIA DOS');
 r:=public.post_operar('guardar_postulante',owner_token,datos,'prueba');p2:=(r->>'id')::uuid;
 perform pg_temp.post_rechaza('guardar_postulante',read_token,datos,'SIN PERMISO');
 perform pg_temp.post_rechaza('evaluar',read_token,jsonb_build_object('postulante_id',p1,'materia','PMTD'),'SIN PERMISO');
 r:=public.post_operar('ingresar','',jsonb_build_object('ci','999000001','password','incorrecta'),'prueba');perform pg_temp.post_assert((r->>'ok')::boolean=false,'Contraseña inválida');
 r:=public.post_operar('ingresar','',jsonb_build_object('ci','999000001','password','999000001'),'prueba');s_token:=r->>'token';perform pg_temp.post_assert((r->>'primer_ingreso')::boolean,'CI inicial exige cambio');
 r:=public.post_operar('expediente',s_token,jsonb_build_object('postulante_id',p2),'prueba');perform pg_temp.post_assert((r->>'primer_ingreso')::boolean,'Primer ingreso no lee expedientes');
 perform pg_temp.post_rechaza('cambiar_clave',s_token,jsonb_build_object('password','999000001'),'USE UNA NUEVA');
 perform public.post_operar('cambiar_clave',s_token,jsonb_build_object('password','clave-ficticia-segura'),'prueba');
 r:=public.post_operar('expediente',s_token,jsonb_build_object('postulante_id',p2),'prueba');perform pg_temp.post_assert((r->'postulante'->>'id')::uuid=p1,'Aislamiento por token: ignora id ajeno');
 perform pg_temp.post_assert(not (r->'postulante'?'password_hash'),'No devuelve hash de contraseña');
 datos:=jsonb_build_object('postulante_id',p1,'materia','PMTD','nota',0,'escala',100,'resultado','EVALUADO','publicada',false,'referencia','ACTA FICTICIA','motivo','REGISTRO DE PRUEBA','revision',0);
 perform public.post_operar('evaluar',owner_token,datos,'prueba');
 r:=public.post_operar('expediente',s_token,'{}','prueba');perform pg_temp.post_assert(jsonb_array_length(r->'evaluaciones')=0,'Borradores no visibles al postulante');
 perform pg_temp.post_rechaza('evaluar',owner_token,datos,'OTRO EVALUADOR');
 datos:=datos||jsonb_build_object('revision',1,'publicada',true);perform public.post_operar('evaluar',owner_token,datos,'prueba');
 r:=public.post_operar('expediente',s_token,'{}','prueba');e_id:=(r->'evaluaciones'->0->>'id')::uuid;
 perform pg_temp.post_assert((r->'evaluaciones'->0->>'nota')::numeric=0,'Nota cero preservada');
 perform public.post_operar('confirmar',s_token,jsonb_build_object('evaluacion_id',e_id,'revision',2),'prueba');
 perform pg_temp.post_rechaza('confirmar',owner_token,jsonb_build_object('postulante_id',p1,'evaluacion_id',e_id,'revision',2),'SOLO LA DA EL POSTULANTE');
 perform pg_temp.post_rechaza('evaluar',s_token,datos,'SIN PERMISO');
 perform pg_temp.post_rechaza('emitir',owner_token,jsonb_build_object('postulante_id',p1,'tipo','CERTIFICADO'),'DIRECTIVA REVISADA');
 r:=public.post_operar('emitir',owner_token,jsonb_build_object('postulante_id',p1,'tipo','REGISTRO_PARCIAL'),'prueba');doc_id:=(r->'documento'->>'id')::uuid;
 perform pg_temp.post_assert(jsonb_array_length(r->'documento'->'contenido'->'evaluaciones')=9,'Documento identifica nueve evaluaciones, incluidos pendientes');
 perform pg_temp.post_assert(public.post_sellar(doc_id,encode(convert_to('PDF FICTICIO','UTF8'),'base64'),encode(extensions.digest('PDF FICTICIO','sha256'),'hex')),'Sello hash del PDF');
 r:=public.post_operar('verificar','',jsonb_build_object('id',doc_id),'prueba');perform pg_temp.post_assert(not (r?'ci') and not (r?'contenido') and not (r?'foto'),'QR público no revela datos personales');
 datos:=datos||jsonb_build_object('revision',2,'nota',85,'motivo','RECTIFICACION SEGUN ACTA');perform public.post_operar('evaluar',owner_token,datos,'prueba');
 r:=public.post_operar('verificar','',jsonb_build_object('id',doc_id),'prueba');perform pg_temp.post_assert((r->>'anulado')::boolean,'Rectificación anula vigencia del documento previo');
 perform pg_temp.post_rechaza('confirmar',s_token,jsonb_build_object('evaluacion_id',e_id,'revision',2),'LA EVALUACIÓN CAMBIÓ');
 perform pg_temp.post_assert((select count(*)=3 from public.post_historial where postulante_id=p1 and accion='EVALUACION'),'Historial conserva las tres revisiones');
 perform pg_temp.post_rechaza('vista_postulante',read_token,jsonb_build_object('postulante_id',p1,'motivo','PRUEBA DE CONSULTA'),'SOPORTE PERSONAL');
 r:=public.post_operar('vista_postulante',owner_token,jsonb_build_object('postulante_id',p1,'motivo','REVISAR VISTA DEL POSTULANTE'),'prueba');perform pg_temp.post_assert((r->>'solo_lectura')::boolean,'Vista de soporte solo lectura');
 perform pg_temp.post_assert((select count(*)=1 from public.post_historial where postulante_id=p1 and accion='CONSULTA_COMO_POSTULANTE'),'Soporte atribuido al actor');
 perform pg_temp.post_rechaza('acceso',owner_token,jsonb_build_object('version',1,'abierto',false,'motivo','ORDEN FICTICIA DE CIERRE'),'SOLO EL COMANDANTE');
 perform public.post_operar('acceso',cmd_token,jsonb_build_object('version',1,'abierto',false,'motivo','ORDEN FICTICIA DE CIERRE'),'prueba');
 perform pg_temp.post_rechaza('expediente',s_token,'{}','SESIÓN VENCIDA');
 r:=public.post_operar('ingresar','',jsonb_build_object('ci','999000001','password','clave-ficticia-segura'),'prueba');perform pg_temp.post_assert((r->>'ok')::boolean=false,'Cierre bloquea nuevo ingreso');
 perform pg_temp.post_assert((select count(*)=2 from public.post_postulantes),'Cierre conserva identidades');
 perform pg_temp.post_assert((select count(*)=1 from public.post_evaluaciones),'Cierre conserva notas');
 r:=public.post_operar('expediente',owner_token,jsonb_build_object('postulante_id',p1),'prueba');perform pg_temp.post_assert((r->'postulante'->>'id')::uuid=p1,'Archivo administrativo disponible tras cierre');
 perform public.post_operar('acceso',cmd_token,jsonb_build_object('version',2,'abierto',true,'motivo','ORDEN FICTICIA DE REAPERTURA'),'prueba');
 perform pg_temp.post_rechaza('expediente',s_token,'{}','SESIÓN VENCIDA');
 for i in 1..8 loop perform public.post_operar('ingresar','',jsonb_build_object('ci','999000002','password','incorrecta'),'otro-ip');end loop;
 r:=public.post_operar('ingresar','',jsonb_build_object('ci','999000002','password','999000002'),'otro-ip');perform pg_temp.post_assert(r->>'error' like 'DEMASIADOS%','Límite de intentos bloquea antes de verificar clave');
 perform pg_temp.post_rechaza('evaluar',owner_token,jsonb_build_object('postulante_id',p1,'materia','PICB','resultado','EVALUADO','referencia','ACTA FICTICIA','motivo','PRUEBA SIN NOTA','revision',0),'REQUIERE NOTA');
 perform pg_temp.post_rechaza('acceso',cmd_token,jsonb_build_object('abierto',false,'motivo','PRUEBA SIN VERSION'),'REVISE VERSIÓN');
 update public.sesiones set es_master=true where token=owner_token;
 perform pg_temp.post_rechaza('panel',owner_token,'{}','CUENTA PERSONAL');
 update public.sesiones set es_master=false where token=owner_token;
 r:=public.post_operar('solicitar','',jsonb_build_object('ci','999000003','nombre_completo','PERSONA FICTICIA TRES','foto',foto,'habilitado',true,'identidad_verificada',true),'solicitud-ip');
 perform pg_temp.post_assert((r->>'ok')::boolean,'Solicitud de registro recibida');
 perform pg_temp.post_assert((select not habilitado and not identidad_verificada from public.post_postulantes where ci='999000003'),'Solicitud pública ignora privilegios proporcionados por cliente');
 r:=public.post_operar('ingresar','',jsonb_build_object('ci','999000003','password','999000003'),'solicitud-ip');
 perform pg_temp.post_assert((r->>'ok')::boolean=false,'Solicitud pendiente no inicia sesión');
 for i in 1..4 loop perform public.post_operar('solicitar','',jsonb_build_object('ci','999000003','nombre_completo','INTENTO DE REEMPLAZO','foto',foto),'solicitud-ip');end loop;
 perform pg_temp.post_assert((select nombre_completo='PERSONA FICTICIA TRES' from public.post_postulantes where ci='999000003'),'Solicitud duplicada conserva identidad original');
 perform pg_temp.post_rechaza('solicitar','',jsonb_build_object('ci','999000004','nombre_completo','PERSONA FICTICIA CUATRO','foto',foto),'LÍMITE DE SOLICITUDES','solicitud-ip');
end $$;
select jsonb_build_object('ok',true,'resultado','Permisos, aislamiento, primer ingreso, notas, revisiones, conformidad, QR, cierre, reapertura y límite de intentos verificados. Todas las identidades ficticias se revierten.');
