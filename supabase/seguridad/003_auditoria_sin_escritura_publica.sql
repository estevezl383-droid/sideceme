-- ================================================================================
-- SIDECEME — Seguridad 003: la auditoría de sanciones no se escribe desde el navegador
-- Aplicada el 2026-09-27 como migración "auditoria_sin_escritura_publica".
--
-- La auditoría de sanciones la escriben las funciones Edge con service_role; la
-- app nunca escribe en sanciones_audit ni usa audit_sanciones_cambios.
-- ================================================================================

revoke all on public.audit_sanciones_cambios from anon;
drop policy if exists anon_insert on public.audit_sanciones_cambios;
drop policy if exists audit_sanciones_cambios_lectura_publica on public.audit_sanciones_cambios;

revoke insert, update, delete, truncate, references, trigger on public.sanciones_audit from anon;
drop policy if exists anon_insert on public.sanciones_audit;

revoke delete, truncate, references, trigger on public.solicitudes_anulacion from anon;
