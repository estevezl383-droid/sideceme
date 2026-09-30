-- Ejecutar antes de desplegar auth-soporte. Solo afecta a nuevas sesiones de soporte.
BEGIN;
SET LOCAL lock_timeout = '3s';
CREATE SCHEMA IF NOT EXISTS sideceme_interno;
REVOKE ALL ON SCHEMA sideceme_interno FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION sideceme_interno.proteger_sesion_soporte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.token IS DISTINCT FROM OLD.token
     OR NEW.usuario_id IS DISTINCT FROM OLD.usuario_id
     OR NEW.usuario_ci IS DISTINCT FROM OLD.usuario_ci
     OR NEW.usuario_tabla IS DISTINCT FROM OLD.usuario_tabla
     OR NEW.usuario_rol IS DISTINCT FROM OLD.usuario_rol
     OR NEW.soporte_actor_id IS DISTINCT FROM OLD.soporte_actor_id
     OR NEW.soporte_actor_ci IS DISTINCT FROM OLD.soporte_actor_ci
     OR NEW.soporte_motivo IS DISTINCT FROM OLD.soporte_motivo
     OR NEW.creado_en IS DISTINCT FROM OLD.creado_en
     OR NEW.es_master IS DISTINCT FROM OLD.es_master THEN
    RAISE EXCEPTION 'No se puede alterar la identidad de una sesión de soporte';
  END IF;
  -- Las funciones de latido existentes no podrán prolongar el soporte.
  NEW.expira_en := LEAST(NEW.expira_en, OLD.expira_en);
  NEW.revocado := COALESCE(OLD.revocado, false) OR COALESCE(NEW.revocado, false);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION sideceme_interno.proteger_sesion_soporte() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS proteger_sesion_soporte ON public.sesiones;
CREATE TRIGGER proteger_sesion_soporte
BEFORE UPDATE ON public.sesiones
FOR EACH ROW WHEN (OLD.soporte_actor_id IS NOT NULL)
EXECUTE FUNCTION sideceme_interno.proteger_sesion_soporte();
COMMIT;
