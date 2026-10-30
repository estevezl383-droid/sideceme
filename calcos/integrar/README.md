# 🧩 Integrar el trabajo de los G — 30/10/2026

Lo pidió Sergio: «que cada G vaya generando su trabajo y lo vaya integrando el JEM… y también pueda
copiarle a los G sus trabajos integrados». Le preocupaba que al integrar «se mezclen algunas cosas y
se vuelva un espagueti o un cruce de información», y aclaró que «el trabajo se realizará cada uno en
su computadora y no se lo desarrollará en línea».

Por eso no hay nada en línea: el trabajo viaja en el mismo archivo JSON que baja **💾 Guardar como**
(por USB, correo o WhatsApp), y el JEM **elige hoja por hoja** qué trae.

## Cómo se usa

| Quién | Qué hace |
|---|---|
| Cada G | Trabaja sus hojas en su Mesa y baja su archivo con **💾 Guardar como**. Conviene ponerle la sección en el nombre (`EJERCICIO_CE-I_G-1_….json`): la Mesa lo reconoce sola. |
| JEM | Con su ejercicio abierto toca **🧩 Integrar → 📂 Abrir archivos de los G** (puede abrir varios a la vez). En cada archivo revisa **«Es el trabajo del:»**, mira lo marcado y toca **✅ Integrar**. |
| JEM | **📤 Guardar el integrado para los G** baja `INTEGRADO-JEM_<ejercicio>_<fecha>_<hora>.json`, que reparte a cada G. |
| Cada G | Con su ejercicio abierto toca **🧩 Integrar** y abre el archivo del JEM. |

## Para que no se cruce la información

- **Sólo se marcan solas las hojas del dueño del archivo.** Del archivo del G-1 vienen marcadas las
  hojas del G-1. Las copias que ese archivo tenga de hojas de otras secciones (por ejemplo, una
  versión vieja de la del G-4) quedan aparte, plegadas en «⚠️ Hojas de otras secciones», y sin marcar.
- **El archivo del JEM trae a cada G las hojas de todas las secciones menos la suya.** Así el G no
  pierde lo que siguió trabajando después de mandar su archivo. La Mesa sabe quién es cada uno por
  **«Yo soy:»**, que toma el puesto del enlace (`?puesto=g1`).
- **Cada hoja viene de un solo archivo.** Si se marca la misma hoja en otro archivo, se desmarca en
  el primero y la Mesa lo avisa.
- **Cada hoja se pone en su lugar y lo demás no se toca.** Cada hoja dice si es 🆕 nueva o ✏️
  distinta de la tuya. Las que ya son iguales no se listan.
- **Lo dibujado en la carta nunca se marca solo.** Eso son las unidades, las tareas, las fases de los
  CAP y la organización de la tarea. Se reemplaza entero y la Mesa pide confirmación.
- **Los documentos adjuntados se traen por nombre.** Los nuevos vienen marcados.
- **↩️ Deshacer la última integración** devuelve el ejercicio a como estaba.
- Si el archivo es de otro ejercicio (otro nombre), la Mesa lo avisa.
- Lo integrado se guarda solo, igual que cualquier cambio. Con el ejercicio finalizado (🔒) no se
  puede integrar.

## Dónde vive cada hoja

| Sección | En el ejercicio |
|---|---|
| G-1, G-4, G-5, CMTE., JEM, EME | `hojasG.<sección>.<hoja>` |
| G-2 | `picb.<hoja>` |
| G-3 | `g3.<hoja>` |
| Hojas del CMTE. o del JEM con `compartida: 'g3'` (Línea de Tiempo, Programa General de Planeamiento, Guía Inicial) | `g3.<hoja>`, y son de quien las declara (no del G-3) |

Las hojas `tipo: 'remite'` sólo remiten a la hoja de otra sección y no se listan.

## Código

- `v1/integrar.js`: la lógica pura (`indice`, `comparar`, `deQuien`, `sugerida`, `integrar`),
  que se prueba en Node, y el botón con su panel.
- `v1/integrar.css`: el estilo, con los colores de «💾 Guardar como».
- El compilado (`assets/index-integrar-jem-20261030.js`) sólo deja a la vista dos cosas:
  `window.SIDCatalogoHojas()`, el catálogo de hojas de cada sección, y `window.SIDMesaCargar(datos,
  nombre)`, la misma función con la que la Mesa abre un ejercicio. Ver `CAMBIOS-EN-EL-COMPILADO.md`.
  No cambia el formato del ejercicio ni el servidor.

## Pruebas

- `pruebas/integrar-jem.cjs` (10 casos): el índice, cada hoja donde vive, nueva, distinta o igual,
  qué se marca solo para el JEM y para el G, que integrar no toque lo demás y el nombre del archivo.
- `pruebas/e2e/integrar-jem.cjs` (Chromium, la Mesa real):
  - el JEM abre los archivos del G-1 y del G-4; la copia vieja del G-4 que traía el G-1 no se marca;
  - una hoja viene de un solo archivo;
  - integrar, el autoguardado, deshacer y volver a integrar;
  - bajar el integrado;
  - el G-1, con su hoja más nueva, recibe el integrado y conserva la suya;
  - en el teléfono, el botón y el panel entran en la pantalla;
  - sin errores de consola.
- `.github/workflows/integrar-jem.yml` las corre en cada PR.
