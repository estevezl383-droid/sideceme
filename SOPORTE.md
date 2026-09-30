# Acceso exclusivo de soporte — SIDE-CEME

Preparado para la cuenta P030, CI 4889191, activa, rol ciencia_tecnologia.

## Uso previsto

Iniciar sesión normalmente con la cuenta propia. Pulsar ABRIR SOPORTE, seleccionar CURSANTE o PERSONAL / PROFESOR, indicar CI destino, motivo y contraseña personal del administrador. El servidor verifica sesión propia y contraseña bcrypt. Abre otra pestaña con el perfil destino y un aviso permanente. SALIR DE SOPORTE revoca el token y cierra esa pestaña; la pestaña original conserva la cuenta propia.

No hay contraseña compartida ni bypass por cargo. El CI y el botón de interfaz no autorizan por sí solos. Las sesiones antiguas marcadas es_master no pueden abrir soporte. No se modifica auth-login.

## Activación, en este orden

1. Ya se añadieron soporte_actor_id, soporte_actor_ci y soporte_motivo, opcionales, en public.sesiones.
2. Ejecutar supabase/seguridad/soporte_sesiones.sql. El trigger limita únicamente sesiones identificadas como soporte: no prolonga su vencimiento, no permite cambiar actor/destino/motivo y no permite deshacer revocación. Las sesiones normales mantienen la renovación actual.
3. Desplegar la nueva Edge Function auth-soporte, entrypoint index.ts, con verify_jwt=false. Usa la autenticación propia del sistema: token de sesiones, validación de identidad/estado, contraseña bcrypt y límite de intentos. No usa los tokens como JWT de Supabase Auth. La service_role permanece en el servidor.
4. Publicar index.html y soporte.js juntos.
5. Probar con Sergio: ingreso normal, abrir cuenta de prueba sin editar ni firmar, verificar perfil y aviso, salir del soporte y confirmar que su pestaña original funciona. Probar un usuario distinto: no debe tener acceso. Luego comprobar acceso a un profesor de prueba y a un cursante de prueba.

## Verificaciones realizadas

- 24 pruebas de lógica del endpoint con dobles de base de datos: autorización, contraseña, caducidad, revocación, límite de intentos y fallos de base.
- 8 pruebas de lógica de interfaz con DOM simulado: pestaña separada, cuenta original conservada, contraseña descartada, errores y revocación.
- Sintaxis válida de soporte.js y de los 10 bloques JavaScript de index.html.
- Trigger probado en la base real contra una tabla temporal dentro de una transacción finalizada con ROLLBACK: mantiene la expiración de soporte, permite renovación normal, conserva revocación y rechaza cambios de identidad. No dejó el trigger instalado en sesiones.
- Comprobado que sesiones no concede SELECT/INSERT/UPDATE a anon ni SELECT a authenticated, y no tiene políticas públicas.
- Comprobado que P030 está activa y que su contraseña usa bcrypt; no se leyó ni solicitó su contraseña personal.

Falta la prueba completa en navegador con las credenciales del propietario. El entorno no dispone de Chromium para la prueba visual. Las pruebas automatizadas no garantizan ausencia absoluta de fallos.

## Alcance y pendientes

La sesión registra el actor y la cuenta destino; los registros de edición y firmas existentes pueden seguir mostrando al usuario destino. No se promete atribución del administrador en cada operación. Antes de usar soporte para modificar datos institucionales, revisar los registros de esas operaciones. Para diagnóstico, usar inicialmente consulta y navegación sin firmar por otro usuario.

Esto no resuelve las siete advertencias de vistas Security Definer ni las políticas públicas pendientes de otras tablas. No cambiar las vistas a security_invoker indiscriminadamente: el frontend todavía consulta esas vistas con anon.

Cerrar la pestaña con la X no revoca instantáneamente el token: expira como máximo a los 30 minutos desde su emisión; usar SALIR DE SOPORTE para revocarlo inmediatamente. No persistimos el soporte en localStorage ni en credenciales biométricas.

## Reversión

Revertir el commit de frontend elimina el acceso visible; auth-login sigue intacta. Revocar únicamente sesiones con soporte_actor_id='P030' si hubiera que retirar el soporte, desactivar auth-soporte y conservar los registros. No hace falta borrar las columnas opcionales ni alterar permisos normales.
