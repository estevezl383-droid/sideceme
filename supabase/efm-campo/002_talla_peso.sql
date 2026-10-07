-- Añade una estación al piloto, conservando registros y permisos.
begin;
alter table public.efmc_registros drop constraint efmc_registros_prueba_check;
alter table public.efmc_registros add constraint efmc_registros_prueba_check check (prueba in ('flexiones','abdominales','aerobica','natacion','barras','talla_peso'));
commit;
