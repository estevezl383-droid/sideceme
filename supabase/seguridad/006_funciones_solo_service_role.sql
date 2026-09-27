-- ================================================================================
-- SIDECEME — Seguridad 006: funciones SECURITY DEFINER solo para service_role
-- Aplicada el 2026-09-27 como migración "funciones_solo_service_role".
--
-- fn_primer_ingreso_actualizar cambiaba password_hash y firma_dataurl de cualquier
-- usuario por su id, sin validar sesión, y se podía llamar con la clave pública
-- por /rest/v1/rpc/. La app no la usa (auth-primer-ingreso actualiza con
-- service_role). verificar_password, set_audit_context y
-- recalcular_puntaje_cursante las usan solo las funciones Edge.
--
-- Revisado antes de cerrar: los registros de Supabase (19 al 27 de septiembre de
-- 2026) no muestran llamadas a estas funciones con la clave pública, y todos los
-- cambios de contraseña de la tabla auditoria desde el 24 de mayo se explican por
-- una sesión del propio usuario o un reseteo del personal.
--
-- Al crear una función SECURITY DEFINER nueva: revocar EXECUTE a public, anon y
-- authenticated, y dar EXECUTE solo a service_role (ver eem_fase6_10_revocar_anon).
-- ================================================================================

revoke execute on function
  public.fn_primer_ingreso_actualizar(text, text, text, text, timestamptz, text, text, text, text),
  public.verificar_password(text, text),
  public.set_audit_context(text, text, text, text),
  public.recalcular_puntaje_cursante(text)
from public, anon, authenticated;

grant execute on function
  public.fn_primer_ingreso_actualizar(text, text, text, text, timestamptz, text, text, text, text),
  public.verificar_password(text, text),
  public.set_audit_context(text, text, text, text),
  public.recalcular_puntaje_cursante(text)
to service_role;
