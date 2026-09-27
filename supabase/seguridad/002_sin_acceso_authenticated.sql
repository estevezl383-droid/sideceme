-- ================================================================================
-- SIDECEME — Seguridad 002: sin acceso para el rol authenticated
-- Aplicada el 2026-09-27 como migración "sin_acceso_authenticated".
--
-- La app no usa Supabase Auth: el navegador entra siempre como anon (clave
-- publishable) y las funciones Edge como service_role. El rol authenticated
-- conservaba los permisos que Supabase da por defecto sobre las tablas y vistas
-- de public, sin que nada de la app los necesite. Se le quita todo; si algún día
-- se usa Supabase Auth, los permisos se dan tabla por tabla.
-- ================================================================================

revoke all on all tables in schema public from authenticated;
