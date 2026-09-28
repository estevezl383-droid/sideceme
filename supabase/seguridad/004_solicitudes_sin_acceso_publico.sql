-- ================================================================================
-- SIDECEME — Seguridad 004: solicitudes e historial de cambios sin acceso público
-- Aplicada el 2026-09-28 como migración "solicitudes_sin_acceso_publico".
--
-- Desde la v2.9.414 la app lee y escribe las solicitudes de reconsideración,
-- anulación y modificación, y el historial de cambios de las sanciones, solo por
-- la función Edge solicitudes-ops (service_role), que valida la sesión y el rol.
-- Con la clave pública se podían leer, crear y modificar solicitudes (con sus
-- firmas) y leer toda la auditoría de sanciones. Se quita todo acceso público.
-- ================================================================================
revoke all on public.solicitudes_anulacion, public.sanciones_audit from anon;
drop policy if exists anon_all on public.solicitudes_anulacion;
drop policy if exists solicitudes_anulacion_lectura_publica on public.solicitudes_anulacion;
drop policy if exists anon_select on public.sanciones_audit;
drop policy if exists sanciones_audit_lectura_publica on public.sanciones_audit;
