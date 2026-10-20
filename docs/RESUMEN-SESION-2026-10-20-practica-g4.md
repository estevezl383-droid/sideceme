# Resumen de sesión · 20-10-2026 · Práctica G-4 (1er Ciclo)

## Qué pasó
- En la sesión anterior se creó el ejercicio **PRAC-G4-1C** («PRÁCTICA G-4 · CE-I.V9 - 1er Ciclo»), con **125 grupos de una sola persona** (`PG4-<id del cursante>`, cargo «G-4 Logística»). Cada grupo tiene su copia del calco `2dbf4b3a-323a-414e-ad4c-2a2a6626ac6f` (CE-I.V9 ALUMNOS).
- Se **pausaron** (`ejercicio_miembros.activo=false`) los 131 miembros de los Estados Mayores del ejercicio **1C-2026** («VENCER O MORIR»). No se borró nada.
- Cada ejercicio pesa **3,9 MB**, no 1,4 MB como se había dicho: `resultados` ocupa 2,6 MB. Al entrar los 125 alumnos a la vez, la base de Supabase, que es chica (Micro: shared_buffers 256 MB, 60 conexiones), **se cayó a las 16:17 UTC**. Después respondió muy lento, con errores 500 y 504 en `calco-ops`.
- Los alumnos (por ejemplo Belmonte C120 y Chávez C110) **sí iniciaban sesión** y sus datos estaban bien. Lo que fallaba era abrir el ejercicio, por la carga. Solo 18 de los 125 llegaron a abrirlo.
- Los 403 de `calco-ops` son normales: `mis_calcos` es solo para docentes y la Mesa lo pregunta primero. A eso se suman las pestañas viejas que intentan guardar en el grupo pausado.

## Solución aplicada (PR #127, ya en main y publicada a las 17:18 UTC)
- **Modo práctica**: `https://estevezl383-droid.github.io/sideceme/calcos/?practica`
  - En `calcos/index.html`, si la URL lleva `?practica`, no se define `window.SIDECEME_CALCOS`. La Mesa queda en modo «navegador»: guarda en IndexedDB y no hace ningún pedido a Supabase.
  - Muestra un cartel amarillo «MODO PRÁCTICA» con las instrucciones.
  - El alumno abre el `EJERCICIO_CE-I.V9_….json` que le manda el profesor por WhatsApp (📁 Ejercicios → 📂 Abrir archivo JSON). Practica en 🎓 Aprendizaje → Como G-4 y entrega con 📁 Ejercicios → ⬇️ Bajar el ejercicio.
  - Probado en Chromium con un ejercicio ficticio. **No se probó con el archivo real de 3,9 MB.**
  - Sin servidor, «⚡ Generar calcos» no funciona; el ejercicio ya trae los calcos.

## Pendientes
1. **Reactivar los Estados Mayores de «VENCER O MORIR»** cuando termine la práctica:
   ```sql
   update ejercicio_miembros m set activo=true
   from ejercicio_grupos g
   where g.id=m.grupo_id and g.ejercicio_id='1C-2026' and not m.activo;
   ```
   Antes de reactivarlos, desactivar los miembros de la práctica (`grupo_id like 'PG4-%'`) o el ejercicio PRAC-G4-1C. Si no, cada alumno queda con dos grupos activos.
2. **Borrar el historial de la práctica** (`calco_versiones` de los calcos con `ejercicio_id='PRAC-G4-1C'`) cuando el profesor lo pida. Pesa lo suyo: `calco_versiones` ocupa 243 MB y la base 3,6 GB.
3. **Opcional:** subir la base de Supabase a Small o Medium (lo hace el usuario en Settings → Compute and Disk).
4. **Opcional:** en `calco-ops` (función de Supabase, versión 11), en `guardar`/`entregar`, leer solo `id, grupo_id, creado_por, ejercicio_id, estado, pais, nombre, entregado_en` y no `select *`. Hoy cada guardado y cada rechazo leen el payload de 3,9 MB.
5. **Seguridad (aparte):** `auth-login` tiene una contraseña maestra escrita en el código, aunque en un camino desactivado (`if (false)`). Conviene quitarla.

## Datos útiles
- Proyecto Supabase: `ofsyiylhdrdiqtnbaovo` (SIDECEME-V2)
- Rama de trabajo: `claude/blissful-brahmagupta-p2kc1n`
- Compilado actual de la Mesa: `calcos/assets/index-disgregar-20261020.js`
