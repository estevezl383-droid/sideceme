# calco-ops — fuente de la función de guardado de CALCOS

- `v14/` (17-11-2026): el CURSANTE guarda sus ejercicios propios (hasta 6), además del trabajo de su
  Estado Mayor si tiene uno. Antes `mis_calcos`/`crear_mio`/`abrir_mio` eran sólo para docentes y un
  cursante sin Estado Mayor activo recibía 403 en todo: su trabajo quedaba sólo en su navegador.
- `v13/` (15-11-2026): la versión anterior, tal como estaba desplegada. Está acá para poder volver.

La función desplegada en Supabase es un talón de una línea que importa `v14/index.ts` desde este
repositorio, fijado al commit en que se subió (igual que `wargame-ops`). Para volver atrás se despliega
el mismo talón apuntando a `v13/index.ts`.

Probada con 28 casos sobre una base en memoria (cursante sin grupo, 2DO CICLO con dos asignaciones,
docente, y que nadie pueda abrir, guardar ni borrar lo ajeno).
