# Logística del G-4 — ASDI paso a paso, Apreciación de Logística y Matriz de Sincronización

Lo pidió Sergio el 02-10-2026 con capturas del panel del G-4 y tres textos de la Escuela
(«UU. CMDO. LOG. 2022» —diapositivas—, «Texto UU. CMDO. LOG.» y «Texto CLFFTTTO 2016»):

1. La **F1·P3 Apreciación Activa de LOGÍSTICA** decía «se baja desde el botón de
   Apreciación»: no se podía trabajar con IA ni poner las ideas del oficial.
2. La pestaña **▣ ASDI** no explicaba qué diferencia hay entre el ASDI y el ARCE ni cómo
   se elige el área: quería ir construyendo PASO A PASO y entender por qué.
3. La **Matriz de Sincronización Logística** (lámina de la Escuela) como producto final
   del G-4.
4. Los **Datos generales de planeamiento logístico** y la **Evaluación de las áreas
   propuestas** (láminas) para elegir el área.
5. Que todo se pueda **acostar al calco** y que la **IA** analice todo.

## En la Mesa

### 🚚 G-4 Logística → ▣ ASDI → 🧭 Paso a paso

| Paso | Qué se hace | De dónde sale |
|---|---|---|
| 1 · Entender | ASDI (División, 6-9 km², ≥ 12 km) y ARCE (CE, 9-12 km², ≥ 25 km), el esquema en profundidad ZI → Base Log. → Zona de Etapas → ARCE → ASDI → áreas de trenes → LC/LPR, el área de retaguardia y la SEGAR, el método de la Escuela | Las láminas y los textos, con su cita |
| 2 · Proponer | «▣ Trazar el Área A / B / C» traza el polígono con la herramienta de siempre y le pone la letra. ¿ASDI o ARCE? (según el escalón). El ARCE del CE se traza como referencia | El calco |
| 3 · Verificar | Tamaño, distancia de seguridad (desde la LPR/LC: el primer lado del AO; sin AO, la ficha enemiga más cercana), distancia máxima de apoyo (DMA = (TD − TC) × V / 2, editable), EPA, enemigo más cercano y el tonelaje que tiene que soportar el EPA. **🗺️ Acostar las medidas en la carta**: la línea de la distancia de seguridad mínima, la menor distancia de cada área al frente (verde cumple, rojo no) y el anillo de la DMA | Medido en el calco contra los «Datos generales de planeamiento logístico» |
| 4 · Evaluar | La matriz de la lámina (MANIOBRA · TERRENO · SEGURIDAD · SITUACIÓN LOGÍSTICA × área A, B…): casilla **roja ✔ = reúne el aspecto**. 🧮 lo medido (impositivo, norma o comparando las propuestas), 👤 lo del oficial, 🤖 lo de la IA. Ideas del oficial, 🤖 IA, conclusión con la forma del ejemplo de la Escuela y **Word** apaisado | Factores de empleo del Batallón Logístico |
| 5 · Elegir | «✔ Elegir el Área A»: en la carta queda como ÁREA SERV. DIV. (las otras siguen con línea discontinua y su letra, o se quitan). Abajo se despliega el Batallón Logístico como siempre | — |

### 📋 Mis hojas

- **F1·P3 Apreciación de Situación de Logística** (y **F2·P13**, la misma actualizada,
  con «📋 Partir de la F1·P3»): OBJETO / CARTAS / ANEXOS, I.- Misión, II.- Situación y
  consideraciones logísticas, III.- Análisis (la **elección del área** y cada **CAP**:
  abastecimientos a.- a e.-, mantenimiento, evacuación y hospitalización, transportes,
  diversos, conclusiones), IV.- Comparación (ventajas y desventajas por CAP), V.-
  Conclusiones y recomendaciones. 🌱 trae del calco (instalaciones por función, áreas,
  ejes, lo medido, la evaluación) y de las otras hojas del G-4 (F2·P3, F2·P5, F2·P6,
  F5·P1) y del concepto de apoyo por fase; 💡 ideas; 🤖 IA; 👁️ vista previa y 📄 **Word
  con el formato militar** de la Mesa (firma del G-4).
- **F7·P2 Matriz de sincronización logística** (nueva): las fases del COA como columnas
  (desde — hasta) y los renglones de la lámina (secciones de la Zona de Etapas, enfoque y
  prioridad de apoyo, abastecimiento —centros, EPA/ESA—, evacuación y hospitalización
  —hospitales, norma, PA, EPE/ESE—, transporte, mantenimiento, recuperación y nivel de
  amenaza en el área de retaguardia con los niveles I-II-III del texto). 🌱 con el calco y
  el concepto por fase; «↔ Trazar el EPA/EPE en el calco» y «📍 Ver en la carta»; 💡 ideas;
  🤖 IA; **Word** apaisado con membrete, SECRETO, siglas y firma.

La apreciación y la matriz van al **expediente** que reciben las demás hojas con IA.

Se guarda con el ejercicio en `hojasG.g4`:

```js
evalAreas:        { esquema: 'eval-areas-v1', parametros: { td, tc, v, factor }, notas: { [aspecto]: { [claveDelÁrea]: { estado: 'si'|'no', por: 'oficial'|'ia', motivo } } }, conclusion, conclusionIA, elegida, ideas, tropas, tipoDivision }
aprecActiva / aprecOrientacion: { esquema: 'aprec-log-v1', numero, objeto, cartas, anexos, campos: {…}, caps: [{ id, nombre, analisis: {…}, ventajas, desventajas }], ideas, firma, iaCampos }
matrizSinc:       { esquema: 'matriz-sinc-log-v1', numero, fases: [{ id, nombre, desde, hasta }], celdas: { [renglón]: { [fase]: texto } }, ideas, firma, iaCampos }
```

y en el calco, en cada área de `ops.zonasLog`: `propuesta: 'A'` y `elegida: true`.

## Archivos (`v1/`)

- `doctrina.js` — los datos y definiciones de los tres textos, con la cita de cada uno.
- `geo.js` — km², distancias a una línea y entre polígonos, la paralela al frente, círculos.
- `analisis.js` — lo que la Mesa mide en el calco y las sugerencias por aspecto.
- `modelo.js` — los datos de las tres hojas, la siembra sin pisar, revisión y texto.
- `ia.js` — los pedidos a la IA y la aplicación de sus respuestas.
- `documento.js` — la apreciación para el formato militar y los Word apaisados (con el
  Word propio de `riesgo/v1/docx.js`, que permite pintar las casillas).
- `editor.js`, `runtime.js` — las pantallas y el puente con la Mesa (React, el panel de IA
  `hU`, el formato militar, el catálogo `Ni`, la coordenada `Sc`, Leaflet y el calco vivo
  con las acciones para acostar).

## Qué es de la doctrina y qué es criterio de la Mesa

- Tamaño, distancia de seguridad, tonelaje, DMA y la lista de factores y aspectos: de los
  textos de la Escuela (`doctrina.js` cita la lámina o el capítulo).
- **La distancia por carretera se estima** como la línea recta × 1,3 (editable): la Mesa
  no tiene la red vial. Hay que medirla en la carta.
- Los aspectos relativos («más cerrado», «más cerca de tropa amiga», «más lejos de los
  flancos») se proponen **comparando las áreas propuestas entre sí**: es criterio de la
  Mesa y así lo dice la pantalla. Los demás (red viaria, construcciones, cubiertas,
  obstáculos, suelo y agua, puntos críticos, facilidad para la defensa…) los decide el
  oficial o los propone la IA, que nunca cambia lo que marcó el oficial ni lo impositivo
  medido.

## Pruebas

```bash
cd calcos/pruebas
node logistica.cjs           # doctrina, geometría, análisis, modelos, IA, Word y reemplazos
node e2e/logistica.cjs       # la Mesa real en Chromium, escritorio y teléfono
node construir-logistica.js  # vuelve a armar el compilado (y comprueba que es reversible)
```

`logistica-ejemplo.js` tiene un ejercicio FICTICIO (División en la defensa) y respuestas de
IA de ejemplo. Las capturas y los Word de la prueba quedan en `pruebas/salidas-logistica/`
(no se versionan).
