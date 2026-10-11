-- Envíos de la Mesa a los cursantes por CICLO o por PARALELO (11-10-2026). Además del ejercicio
-- personal del docente y del grupo (Estado Mayor), un envío puede ir a todo un ciclo («1ER CICLO»)
-- o a un paralelo de ese ciclo («1ER CICLO» · «A»). Lo lee calco-ops (areas_recibidos) con el
-- ciclo y el paralelo del cursante que abre su Mesa. Nada se borra: sólo dos columnas, la regla
-- de destino (con la tercera forma) y un índice.
alter table public.calco_compartidos
  add column if not exists destino_ciclo text check (destino_ciclo is null or length(destino_ciclo) between 1 and 40),
  add column if not exists destino_paralelo text check (destino_paralelo is null or length(destino_paralelo) between 1 and 10);
alter table public.calco_compartidos drop constraint if exists calco_compartidos_check;
alter table public.calco_compartidos add constraint calco_compartidos_destino_check check (
  (destino_calco_id is not null and destino_grupo_id is null and destino_ejercicio_id is null and destino_ciclo is null and destino_paralelo is null)
  or (destino_calco_id is null and destino_grupo_id is not null and destino_ejercicio_id is not null and destino_ciclo is null and destino_paralelo is null)
  or (destino_calco_id is null and destino_grupo_id is null and destino_ejercicio_id is null and destino_ciclo is not null)
);
create index if not exists calco_compartidos_ciclo_idx on public.calco_compartidos(destino_ciclo, destino_paralelo, creado_en desc);
