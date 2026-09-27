-- ================================================================================
-- SIDECEME — Seguridad 001: cerrar escritura pública
-- Aplicada el 2026-09-27 como migración "cerrar_escritura_publica".
--
-- La app solo LEE estas vistas: las escrituras de sanciones, cursantes, avisos y
-- quiz pasan por las funciones Edge (service_role). Las vistas son de una sola
-- tabla y PostgreSQL las deja actualizar, y conservaban los permisos que Supabase
-- da por defecto a anon en todo lo nuevo. Acá quedan de solo lectura para el
-- navegador, las sanciones se crean solo por la función sanciones-crear, y se
-- quitan restos de permisos sobre profesores y cursantes.
--
-- Supabase vuelve a dar todos los permisos a anon en cada tabla o vista nueva:
-- revisarlos cada vez que se cree una.
-- ================================================================================

-- Las vistas quedan de solo lectura para el navegador (la app solo las lee)
revoke insert, update, delete, truncate on
  public.v_sanciones, public.v_cursantes, public.v_avisos_activos,
  public.v_quiz_participantes, public.v_quiz_respuestas, public.v_quiz_sesiones
from anon, authenticated;

-- Nadie crea sanciones sin pasar por la función sanciones-crear (usa service_role)
revoke insert on public.sanciones from anon;
drop policy if exists anon_puede_insertar_sanciones on public.sanciones;

-- Restos de permisos sobre personas que hoy frenaba solo la RLS
revoke insert, update, delete, truncate on public.profesores, public.cursantes from anon;
