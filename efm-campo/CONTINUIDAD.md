# Evaluación física digital ECEME

## 05/11/2026 · Historial por ciclo, curso y tanda

- Botón HISTORIAL DE PRUEBAS FÍSICAS junto a los controles de fecha, ciclo y organización. Consulta independiente de la jornada en curso, accesible a Aguirre, Linares y Morales con verificación de sesión en el servidor.
- Índice de todas las fechas con resultados, filtros por ciclo/curso/tanda, matriz de últimas marcas y notas, conformidades por registro y detalle de cada revisión anterior. Incluye alumnos inactivos y organizaciones deshabilitadas; las pruebas personales se identifican como registros de prueba. No modifica registros ni da conformidades.
- La diagnóstica del 03/11/2026 ya existe: segundo ciclo, cuatro cursantes de cursos A/B y veinte pruebas; primer ciclo, una cursante del curso A y cinco pruebas. Se consulta desde sus organizaciones originales, sin copiar ni recalificar datos.
- Acciones autenticadas `historial` / `historial_detalle`, consultas paginadas de 500 filas y conformidades en lotes de 200. Sin tablas, políticas ni permisos nuevos. Los registros nuevos retienen ciclo y curso dentro de `calculo`; los anteriores usan su organización y la nómina disponible cuando no tienen esos datos guardados.
- Se incorporó al archivo local del endpoint la lógica de cierre/publicación que ya estaba en producción v15, conservando sus bloqueos y RPC. Los otros siete módulos del servidor se comprobaron iguales a producción. Nueva función desplegada v16, caché de la cadena frontend v24.
- Validación: pruebas de índice/paginación (>1000 filas), cinco alumnos, separación entre organizaciones y pruebas personales, versiones y conformidades, acceso denegado a evaluadores/alumnos/sesiones revocadas y conservación de curso/ciclo histórico. Chromium de escritorio y móvil: filtros, matrices, revisiones, fallo/reintento y fecha actual conservada; regresiones de captura, organización, conformidades, informes, excelencia, medidas, perfil y soporte. La comparación de perfil cliente/servidor ignora únicamente la versión de caché en la importación.

Piloto solicitado por Tcnl. Sergio Morales para probar las estaciones antes de habilitarlas a evaluadores. Acceso exclusivo a su cuenta personal; el servidor verifica la sesión institucional, cuenta activa e identidad, y excluye sesiones maestras y de soporte.

## Estado

- Interfaz independiente y carga diferida desde el botón EVALUACIÓN FÍSICA DIGITAL en los paneles del usuario.
- Flexiones y abdominales: temporizador de 2 minutos, pausa, reinicio, prueba de alarma, teclado grande y registro.
- Natación: distancia en metros y nota de las celdas explícitas del Anexo D.
- Aeróbica: grupo de salida, cronómetro, llegadas acumuladas, identificación posterior sin duplicar cursantes, respaldo local de la serie y guardado individual.
- Barras: registro de repeticiones y comparación con requisito de excelencia. El Anexo no establece bonificación numérica.
- Hoja individual: marcas, notas y aportes de cuatro pruebas. Peso–talla representa 29 %; nota final pendiente. La vista todavía no reproduce el Word para impresión ni incorpora valoración médica o firmas.
- Servidor `efm-campo` desplegado en proyecto Supabase SIDECEME-V2. Usa la sesión propia del sistema, no Supabase Auth; verify_jwt=false porque comprueba esa sesión en el servidor.
- Tablas nuevas `efmc_perfiles` y `efmc_registros`, RLS activa, sin acceso directo anon/authenticated. Datos oficiales no se modifican. Cada corrección agrega una fila; UUID evita duplicar un reintento.
- 116 fechas de nacimiento coincidieron exactamente con la nómina. Cuatro entradas necesitan revisión de identidad. No inferir sexo por nombres: seleccionar tabla en el piloto.
- 206 retratos cargados y vinculados: 112 primer ciclo, 94 segundo ciclo. WebP máximo 300 × 400, 1.367.162 bytes en total. Quedan 15 archivos dudosos sin asignar.
- Transferencia completada tras autorización expresa de Sergio el 7 de octubre. Bucket efm-retratos privado, retratos enlazados a efmc_perfiles. El importador temporal quedó cerrado (HTTP 410, JWT requerido).

## Baremos y límites

Fuente: Anexo D a Directiva de Ejército 11/25 adjunto por el usuario. Transcripción comprobada visualmente de flexiones/abdominales (páginas PDF 4, 8, 9), natación (2, 3, 6, 7, 8), aeróbica (5, 6, 9, 10, 11) y excelencia (11).

Edad cumplida en fecha de evaluación, zona Bolivia para fecha inicial. Tablas ordinarias: 20–24, 25–29, 30–34, 35–39, 40–44, 45–49, 50+. Excelencia: 20–26, 27–31, 32–36, 37–41, 42–46, 47–51, 52+.

No extrapolar celdas vacías, marcas superiores a máximos ni tiempos entre filas. Guardar marca y mostrar nota pendiente. Antes del uso oficial definir redondeo de segundos, topes, marcas inferiores, peso–talla, medicina, firmas y política de correcciones.

## Archivos

- `soporte.js`: una carga adicional del launcher al final del archivo, sin modificar funciones de soporte.
- `efm-campo/launcher.js`: botón personal, importación diferida, invocación autenticada.
- `efm-campo/app.mjs`: interfaz y estados de pruebas.
- `efm-campo/style.css`: diseño responsive ECEME.
- `efm-campo/baremos.mjs`: cálculo compartido.
- `supabase/functions/efm-campo/`: endpoint servidor.
- `supabase/efm-campo/001_prueba.sql`: esquema del piloto.
- `tests/efmc-baremos.mjs`: valores de referencia y fronteras.

## Siguiente fase

Después de la prueba de Morales, crear campañas y designaciones por prueba/grupo para Aguirre, Linares y Morales, con autorización efectiva del servidor. Evaluadores solo acceden a sus asignados y estación; cursante consulta su propia hoja. Agregar segundo ciclo al recibir nacimientos. Mantener piloto aislado hasta validar notas, permisos, concurrencia y formato oficial.

## Cómo retomar en otra sesión

Pedir: «Continúa evaluación física digital SIDE-CEME. Lee efm-campo/CONTINUIDAD.md en estevezl383-droid/sideceme y el paquete de continuidad adjunto. Revisa el estado actual antes de modificar. Empezar por probar las cinco estaciones en mi cuenta, completar fotos pendientes y luego designaciones. No escribir registros de prueba en evaluaciones_fisicas ni alterar notas oficiales».

Los adjuntos originales y retratos optimizados se preservan en el paquete de continuidad; los datos personales no se publican en GitHub. Consultar nómina actual en Supabase para cada asignación.

## Verificación completada

15 casos de baremos, 14 casos de acceso/validación, 15 pruebas existentes de soporte. E2E móvil (390 × 844) verificó teclado, reintento conservando UUID, hoja individual, temporizador, captura y asignación de llegadas, exclusión de alumnos ya asignados y recuperación tras recarga. Endpoint desplegado respondió HTTP 401 ante sesión inválida. RLS y revocación de permisos directos confirmadas por SQL. La alarma sonora requiere prueba física en el teléfono de Morales.

## Actualización 7 de octubre: diseño del evaluador

- Ficha con retrato destacado, nacimiento y edad cumplida al evaluar. Masculino por defecto cuando el perfil no tiene sexo, conservando F y permitiendo cambiar la tabla.
- Fecha/ciclo en cuadrícula móvil sin superposición. El ciclo queda ligado al cursante seleccionado.
- Temporizador circular de 120 segundos; cuenta regresiva en verde, ámbar en últimos 30 segundos y rojo en últimos 10. El círculo y la cifra se actualizan juntos al pausar, continuar y finalizar.
- Alarma WAV con reproducción HTMLAudio activada desde el toque del usuario; WebAudio de respaldo y aviso visible al finalizar. Verificar sonido físicamente en iPhone.
- 206 retratos identificados por coincidencias claras del nombre y ciclo, comprimidos a máximo 300 × 400 WebP, 1.367.162 bytes en conjunto. 15 archivos con nombres dudosos sin asignar.
- El bloqueo inicial de auto-review se resolvió mediante autorización expresa de Sergio. Transferencia completada y verificada por cantidad, bytes y unión entre perfiles y objetos almacenados; importador cerrado.
- Sigue siendo piloto personal exclusivo de Morales. Designaciones por profesor/prueba/ciclo y su autorización en servidor pendientes: no afirmar que están activas.

## Autorización y publicación

El 7 de octubre Sergio autorizó expresamente publicar las mejoras y cargar los 206 retratos identificados en el almacenamiento privado de SIDECEME-V2 (ofsyiylhdrdiqtnbaovo). La versión 8a80814 fue desplegada con éxito mediante GitHub Pages; se verificó el temporizador circular en el archivo servido. Carga completada: 206 objetos, 1.367.162 bytes. Verificada unión con efmc_perfiles y cursantes: 112 del primer ciclo y 94 del segundo. Se conservan 15 archivos dudosos sin asignar.

Las designaciones individuales de evaluadores continúan pendientes; el piloto conserva su acceso exclusivo a Morales.

## Actualización 7 de octubre: marcador LED y avance de cursantes

- Marcador de siete segmentos CSS con brillo neón; no descarga fuentes. Círculo consumible verde/ámbar/rojo con cifras accesibles.
- Bocina deportiva local de tres ráfagas (`bocina.wav`, 3,4 s, mono 22.050 Hz), activada por toque y respaldo WebAudio. Comprobar potencia efectiva en iPhone con su volumen y altavoz.
- Foto principal ampliada: 112 × 150 móvil / 148 × 198 escritorio. Ficha reúne edad, nacimiento `01-OCT-88`, sexo, peso y estatura. Peso/estatura figuran pendientes cuando el endpoint no aporta valores; esta actualización no incorpora su captura ni altera el cálculo de peso–talla.
- Sexo inicial usa selecciones registradas/perfil; Alyson Manu Salguero se inicia en femenino por identificación explícita de Sergio. No se clasifica por foto. Selector manual disponible; selección confirmada al guardar prevalece durante la sesión.
- Guardado confirmado: foto/datos/marca/nota quedan en ficha compacta y se abre siguiente cursante sin marca de esa prueba, según relación nominal filtrada/ciclo. Fin de lista conserva resúmenes. Revisión/corrección mantiene historial.
- Fallo conserva alumno, marca y UUID, sin avanzar. Reintento confirmado avanza. Cambio de estación muestra solo sus registros. Aeróbica mantiene series/llegadas.
- Caché versionada v3 en launcher, módulo y CSS. Sin cambios en servidor, base de datos, permisos o notas oficiales.
- Validación: 13 casos UI, 15 baremos, 14 acceso y 15 soporte; integración DOM de fallo/reintento, avance, fin de lista, corrección y cambio de estación. Chromium no se pudo descargar: no afirmar validación visual ni sonora en iPhone.

## Actualización 7 de octubre: cronómetro de aeróbica

- Esfera circular ECEME, segmentos LED gruesos verde neón, centésimas y pequeño corredor SVG. Sin LAP ni corazón.
- Pulsador rojo ovalado con relieve, ancho completo y altura mínima 136 px en móvil. Pointerdown captura el tiempo; click solo activa por teclado/asistencia para no duplicar la llegada.
- Capturar no reconstruye la interfaz ni reemplaza el pulsador: mantiene posición y destino para llegadas rápidas. Actualiza número, confirmación y filas, con respaldo local de la serie y vibración breve cuando está disponible.
- Usa grado y arma reales de cursantes (MY. INF., MY. CAB. y las demás). Endpoint cargar incorpora arma; sin modificaciones de registros, notas o permisos.
- Caché v5 para soporte, launcher, módulo UI, app y CSS.
- Verificación: UI/bares/acceso y regresión DOM del registro; tres pulsaciones simuladas separadas por 20 ms mantienen las tres marcas y el mismo botón, sin doble registro por click. Guardado, exclusión de asignados y recuperación comprobados. Validación visual/ergonómica en teléfono pendiente: Chromium local no está disponible.

## Selección rápida de grupo (7 de octubre)

Botones SELECCIONAR TODOS (cantidad de lista visible) y QUITAR SELECCIÓN encima de las fotos. Selección masiva usa la lista visible del ciclo actual, sin duplicados, y respalda el borrador. Selección individual sigue disponible. Botones y handlers bloqueados durante la serie y cuando ya tiene llegadas. Versiones app/CSS/launcher v6. Organización por jefe de entrenamiento pendiente para próxima fase.


## Actualización 7 de octubre: hojas y talla-peso

- Primera estación TALLA / PESO: captura conjunta de kg y metros, admite coma decimal. Guardado con historial, UUID idempotente y reintentos que conservan las dos medidas y la nota. Los datos van en calculo JSON de efmc_registros; la migración 002 solo amplía el CHECK de prueba.
- El Anexo D reenviado es idéntico al anterior y NO contiene baremo de talla-peso. No inferirlo a partir de las notas 0/100 del Excel. Nota opcional ingresada por evaluador, origen registrado como evaluador, aporte nota × 0,29. Sin nota validada: pendiente. Cálculo automático pendiente de recibir tabla/fórmula institucional.
- Hoja individual replegada por defecto: tocar foto/nombre abre notas. Consolidado por ciclo y curso, cantidad completa y final automático cuando las cinco notas existen. Ceros válidos, pendientes no se convierten en cero. Usa última corrección y fecha de evaluación. Barras sigue siendo requisito, sin modificar suma ordinaria.
- Descargas reales .xlsx/.docx/.pdf: individual, matriz de curso y todas las hojas individuales del curso. Excel contiene valores sin enlaces externos. Word individual usa estructura sanitizada del modelo adjunto (sin identidad ni foto del ejemplo); inserta retrato privado al generar. PDF horizontal con foto, notas, medicina, firma/huella y firmas.
- Firmantes configurables para cinco estaciones, jefe de curso/EFM/SAC/Estudios y comandante. Son nombres y espacios de firma/sello, no firmas electrónicas. Valoración médica conserva espacios del modelo, sin inventar resultados médicos.
- Piloto sigue exclusivo Morales; designaciones de jefes/evaluadores pendientes. No presentar estas descargas como habilitadas para otros usuarios. No se escriben notas oficiales.
- Verificación: regresiones de baremos/UI/acceso/soporte; cálculo y faltantes; integración DOM de captura/reintento/filtro/hoja; nueve exportaciones con 30 cursantes ficticios; Excel reabierto y OOXML validado; PDF individual y matriz renderizados. Chromium y LibreOffice no disponibles: falta inspección de Word en aplicación nativa y prueba en teléfono.


## Actualización 07-OCT-2026: Anexo E y nacimientos segundo ciclo
- Anexo E 11/25 páginas 2–5 incorporado a medidas.mjs (cliente y servidor idénticos). Talla en metros, filas de centímetros enteros; varones 150–200 cm, damas 141–185 cm. Peso ideal cm−100; margen por grupos 20–24/25–29/30–34/35–39/40–44/45 y mayores: varones ±5/6/7/8/9/10 kg, damas ±6/7/8/9/10/11 kg. Límites inclusivos.
- Morales confirmó expresamente: dentro del rango 100, fuera 0. Aporte 29 o 0. Servidor calcula e ignora nota enviada por cliente; no existe entrada manual de nota talla-peso. Fechas inválidas, edades menores de 20 y tallas sin fila quedan sin calificar y no se guardan como cero. No redondear tallas entre filas sin criterio.
- 99 identidades de segundo ciclo coinciden con RRNN; 97 fechas válidas cargadas en efmc_perfiles, conservando fotos, sexo y fechas existentes. Dos fechas malformadas/incompatibles pendientes de corrección; no se publican nombres/fechas en este repositorio público. Edad calculada a la fecha de evaluación.
- Historial previo no recalculado: revisar/corregir los registros anteriores de talla-peso con nuevas mediciones para obtener el baremo automático. Se conserva aislamiento piloto P030 y ninguna escritura en notas oficiales.
- Pruebas: 2880 comprobaciones de filas/grupos/límites más cumpleaños y celdas cotejadas con fuente; prueba de servidor contra manipulación, reintentos y conflictos; regresiones de acceso, informes y resto de baremos. Caché: launcher/app/medidas y soporte/index versión 8.


## Actualización 07-OCT-2026: corrección de fecha persistente
- Editor DD/MM/AAAA de texto con botón GUARDAR DATOS. No reconstruye la ficha al escribir cada dígito; conserva borrador y apertura al validar/fallar. Año completo obligatorio y edad adulta (20–100) validada también al registrar en servidor. Evita aceptar años parciales como 0001.
- Endpoint guardar_datos guarda nacimiento y sexo en efmc_perfiles con validación de sesión/propietario y cursante activo. Upsert parcial conserva retrato y fuente; no modifica registros históricos ni sus notas.
- Perfil corregido prevalece frente a datos históricos al abrir ficha, completar y exportar hojas. Corrección guardada permanece al cambiar estación o recargar; si hay borrador sin guardar se impide registrar una prueba.
- Se corrigió una fecha del segundo ciclo por confirmación de Sergio. No se publican nombres o fechas personales en el repositorio público. 99/99 fechas completas.
- Pruebas perfil: edición completa, rechazo año parcial, persistencia, preservación de foto/fuente y prioridad de corrección. Regresiones servidor/talla-peso/acceso/UI/informes/soporte pasan. Cache de soporte/launcher/app/ui/informes/descargas/perfil versión 9.

## Actualización 08-OCT-2026: navegación y hoja oficial en una página
- Flechas ↑/↓ recorren la relación nominal filtrada, incluso cursantes ya evaluados. El botón elegido mantiene foco y se muestra en su lista; las flechas de campos y selectores conservan su uso nativo. Prueba activa, reintento o borrador sin guardar impiden cambiar por teclado.
- Word usa el modelo reenviado el 8 de octubre: fecha y estado en el espacio superior derecho (07-OCT-2026), foto en su posición, tabla original, nombres de cinco evaluadores en Arial 8 y comandante configurable. No agrega un párrafo antes del membrete. S/R significa sin registro; N/R significa no realizó. Una página por alumno, comprobada mediante render de hoja completa con foto y de dos hojas con notas faltantes.
- NO REALIZÓ LA PRUEBA disponible en estaciones y en selector de aeróbica. Guarda un nuevo registro histórico con calculo.estado=NO_REALIZO y nota=null. No asigna cero ni completa la nota final sin política institucional expresa. Reintentos distinguen este estado de una marca cero.
- El servidor obtiene nombre, grado y especialidad del profesor autenticado; guarda el nombre en calculo.evaluador_nombre. Registros previos del piloto resuelven nombre mediante actor_id sin modificar sus notas. Word/PDF/Excel individual usan esa identidad, nunca el firmante manual. Otros profesores siguen pendientes de la fase de designaciones; el piloto conserva el mismo acceso exclusivo a Morales.
- Verificación: pruebas EFM y 39 regresiones de soporte; prueba DOM de avance/retroceso/extremos/campos/borradores; seis estaciones con no realizó, reintentos, conflictos e identidad autenticada. LibreOffice disponible en esta sesión: Word renderizado e inspeccionado con foto, nombres largos y hoja incompleta. Chromium no disponible, por lo que queda la prueba física de teclado en Safari del usuario.

## Actualización 08-OCT-2026: organización de pruebas por ciclos y grupos

- Jefes verificados contra profesores activos: Aguirre (P019), Linares (P020), Morales (P030). Acceso con cuenta personal; se excluyen sesiones maestras, soporte, auxiliares, suboficiales y solo lectura del rol evaluador.
- Organizaciones por fecha/ciclo: nombre, modalidad PILOTO/EVALUACION, borrador/habilitada, grupos de color único, alumnos del ciclo sin duplicaciones. NEGRO reservado a excelencia e incorpora barras. Las seis estaciones incluyen talla-peso. Continúa la fase de construcción: registros de este módulo permanecen separados de las notas oficiales.
- Profesores múltiples por grupo/prueba. Habilitación requiere responsables para todas las estaciones del grupo. Apoyos administrativos seleccionados del personal activo o por nombre manual, con tarea; no obtienen permisos de calificación por ser apoyos.
- Servidor verifica designación vigente por alumno/prueba en cada carga y escritura. Devuelve al evaluador únicamente nómina, retratos, registros y novedades de sus grupos/pruebas. Los jefes pueden reemplazar o añadir profesores editando la organización; siguiente consulta/guardado usa la designación actual. En pantalla usar ACTUALIZAR para refrescar asignaciones durante la jornada.
- Organización guardada en efmc_organizaciones con revisión optimista por versión; cada edición genera automáticamente snapshot en efmc_organizacion_historial. Condiciones append-only en efmc_condiciones. RLS activada y permisos directos anon/authenticated revocados en las tres tablas. efmc_registros admite actor autenticado y organizacion_id; piloto histórico sin organización se conserva.
- Importación local DOCX: encabezado GRUPO + COLOR, una fila/párrafo por alumno, CI/ID o conjunto completo de nombres. Ambigüedades/desconocidos/duplicados quedan para revisión; no se asignan por parecido. DOC antiguo requiere guardar como DOCX. Exporta Word real con grupos, nóminas, encargados y tareas. No publica datos personales en el repositorio.
- Novedades por alumno: todas las pruebas o una estación; solicitud con papeleta (referencia obligatoria), sin papeleta, no asistió/faltó, o NORMAL para habilitar nuevamente. Historial conservado. No generan nota cero ni nota final; el servidor bloquea evaluación mientras la condición esté vigente. Reflejadas en hojas Word/PDF/Excel y valores N/R. No sustituyen una valoración médica ni aprueban automáticamente una solicitud.
- Verificación: 49 pruebas/regresiones EFM y soporte; pruebas de aislamiento de registros/estaciones, apoyo sin notas, reemplazo, versión concurrente, importación y novedades. DOM real con happy-dom comprobó crear grupos, elegir alumnos, asignar profesores, habilitar, guardar, editar condición y pantalla del evaluador restringida. Navegador visual no disponible (descarga de Chromium falló); prueba visual en Safari pendiente.
- Migración aplicada al proyecto SIDECEME-V2. Trigger de historial comprobado mediante transacción revertida; tablas sin acceso público verificadas. Edge Function actualizada, sesión inválida devuelve 401. No se crearon organizaciones reales ni asignaciones de alumnos de prueba durante la verificación.

## Actualización 01-NOV-2026: evaluación y conformidad por registro

- Evaluaciones en modalidad EVALUACION abren una carpeta en Mi cuenta → Evaluación física para cada cursante asignado. La nómina concreta y los encargados se guardan sólo en la base institucional; no publicar datos personales en este repositorio.
- Marca y nota permanecen en rojo hasta que el alumno confirma esa versión. Verde indica conformidad, incluyendo nota cero y talla/peso. Una corrección añade un registro y exige otra conformidad; la confirmación anterior se conserva.
- `efmc_conformidades`: RLS, sin permisos de acceso directo anon/authenticated. RPC invoker sólo service_role, sesión institucional e identidad del cursante verificadas en Edge. Candado transaccional común con inserción, revisión monotónica y rechazo de versiones obsoletas. Registros y conformidades inmutables.
- Evaluadores y jefes: pestaña SEGUIMIENTO ROJO / VERDE. Consulta automática cada 2 segundos mientras está visible; no reconstruye temporizadores, teclados ni borradores. Indica fallos y última sincronización. Revalida organización y permisos en servidor. En EVALUACION, incluso un jefe sólo registra estaciones donde fue designado.
- Peso/talla se mantiene pendiente hasta la carga del responsable. No se escribieron marcas ni notas de alumnos como parte de la preparación de la jornada. El modo EVALUACION queda distinguido del piloto histórico. `evaluaciones_fisicas` no recibe copias automáticas ni duplicados de estas estaciones.
- `cargar` con `inicial` elige la próxima evaluación habilitada; un borrador de aeróbica con llegadas pendientes se restaura antes. El organizador existente conserva el campo Nombre y su historial de versiones.
- Verificación: pruebas de permisos/aislamiento, conformidad idempotente, nueva corrección roja, tres ventanas Chromium (alumno móvil, evaluador y jefe), nota cero, desconexión/reintento y conservación de edición. Prueba SQL transaccional revertida verificó guardado, inmutabilidad y rechazo de confirmación obsoleta sin dejar registros de prueba.

## Corrección del selector de ciclo

- CICLO DEL CURSANTE permanece disponible con una organización o alumno seleccionado. Al cambiar, carga la organización del otro ciclo para la misma fecha; prioriza nombre y modalidad coincidentes. Si hay varias opciones ambiguas, pide elegir en ORGANIZACIÓN.
- El ciclo, la nómina y los registros cambian juntos después de una carga exitosa. Una carga fallida conserva la selección anterior. No se modifican el ciclo institucional de alumnos ni los datos guardados.
- Protege mediciones, marcas, datos de perfil, llegadas pendientes y pruebas en curso. Ignora una sincronización anterior mientras carga el nuevo grupo. Caché de app/launcher/soporte versión 14.
- Chromium comprobó primer ciclo (1 alumno) ↔ segundo ciclo (4 alumnos), cambio con alumno seleccionado, protección de peso pendiente y recuperación de un fallo de carga, además del flujo de conformidades.

## Carpeta del cursante y consulta desde soporte

- El launcher presenta en Mi cuenta una carpeta por evaluación con su nombre, fecha y cantidad de registros vigentes pendientes de conformidad. La lista se obtiene del servidor y los errores se muestran con opción de reintento.
- Una sesión de soporte de cursante emitida por auth-soporte puede consultar la evaluación. efm-campo vuelve a verificar al actor P030, su CI, rol vigente y cuenta activa. Sesiones maestras, vencidas, revocadas o de otros actores siguen denegadas. Soporte sólo admite acceso/mis_evaluaciones: nunca registra ni da conformidad.
- El servidor devuelve solo_lectura; la pantalla de consulta muestra un aviso y no ofrece botones de conformidad. La cuenta personal del alumno conserva la confirmación y la sincronización automática. Cambiar entre soporte/personal cierra la vista anterior aunque sea el mismo cursante.
- Caché launcher/soporte/alumno v15. Prueba de navegador adicional recorre el launcher real y el código del backend con cinco cuentas ficticias, tanto personales como soporte, incluyendo cero/100, una evaluación sin mediciones, ausencia de datos ajenos, rechazo de firma desde soporte y cambio rojo/verde tras aceptación personal. No se confirman registros reales durante la verificación.

## Botón independiente por prueba y detalle de los tres jefes

- El alumno ve siempre cinco botones identificados: peso/talla, flexiones, abdominales, aeróbica y natación. Se habilita sólo el registro vigente pendiente en su cuenta personal. Pruebas sin registro, conformidades ya guardadas y consulta de soporte muestran el botón deshabilitado con explicación visible.
- P019, P020 y P030 tienen acceso directo a DETALLE DE CONFORMIDADES desde su panel. El endpoint conformidades valida sesión personal, profesor activo y pertenencia a JEFES; consulta la evaluación seleccionada con ambos ciclos. No permite al alumno ni a soporte consultar el detalle general.
- Panel general: alumnos, pruebas previstas, conformes, pendientes y sin registro; matriz por alumno/ciclo/prueba, marca, nota, evaluador, hora de registro y alumno/hora de conformidad. Una corrección usa su nueva revisión y vuelve a rojo. Actualización cada 2 segundos, conservando los detalles abiertos.
- Caché v16. Chromium recorrió cinco botones por cuenta, aprobación separada de las cinco pruebas, cero válido, nuevo registro correctivo, cinco alumnos/25 pruebas y las tres cuentas de jefe con el mismo detalle. Se mantiene el historial y ninguna prueba confirma registros reales.

## Aviso luminoso mientras la evaluación esté pendiente

- La carpeta del cursante muestra borde luminoso, latido y aviso de notas por confirmar. Sigue destacada si faltan registros de pruebas; desaparece el destaque sólo cuando todas las pruebas previstas tienen conformidad vigente. Una corrección reactiva el aviso.
- Al cerrar la evaluación se refresca la carpeta inmediatamente. Se muestran las conformidades completadas y las pruebas sin registro. Soporte refleja el mismo estado, conservando la consulta sin firma.
- CSS del aviso limitado a la carpeta del alumno; las sanciones mantienen su estilo. Si el dispositivo solicita reducir movimiento, conserva la iluminación fija. Caché del launcher/soporte v17.
- Chromium comprobó evaluación recién habilitada, conformidad parcial, cinco pruebas confirmadas → aspecto normal y corrección → nuevo aviso, sin desbordamiento móvil; las regresiones de soporte pasan.

## Actualización inmediata y botón Actualizar notas

- La ventana del alumno incluye Actualizar notas, sin recargar la página ni perder la evaluación seleccionada. Consulta al abrir, al volver al primer plano, al recuperar conexión y automáticamente cada segundo. El seguimiento de evaluadores/jefes también consulta cada segundo.
- Cada prueba registrada pendiente habilita su propio botón en la sesión personal, aun cuando todas las otras pruebas estén sin registro. La consulta de soporte sigue mostrando el motivo por el que no puede aceptar como si fuera el alumno.
- Una respuesta de consulta anterior al inicio de una conformidad se descarta; se consulta de nuevo después de terminar la aceptación. Evita que una lectura retrasada vuelva a mostrar rojo un registro ya confirmado. Mantiene visibles los errores de confirmación y permite reintentar.
- Caché v18. Chromium comprobó llegada y aceptación de cada prueba una por una, refresh manual con desconexión y recuperación, respuesta retenida antes de aceptar sin regresión a rojo, tres jefes, consulta de soporte y la alerta de pendientes. No se aceptaron notas reales durante las pruebas.

### 02/11/2026 · Hoja individual PDF del alumno y autenticidad QR

- Cada cuenta personal de cursante dispone de «Descargar mi hoja individual (PDF)» dentro de su evaluación habilitada. El servidor toma la identidad de la sesión y la pertenencia al grupo; ignora identidades enviadas por el navegador. Sólo PDF; soporte sigue siendo consulta sin firma ni descarga.
- La hoja conserva las ponderaciones oficiales, ceros reales y registros vigentes. Lo no registrado figura S/R y la nota final queda pendiente hasta las cinco notas. Indica las conformidades y se marca parcial mientras falte alguna prueba o aceptación.
- `efmc_documentos` guarda emisiones inmutables con snapshot, huella SHA-256 del PDF y hash de un token QR aleatorio de 256 bits. RLS activo y sin permisos directos anon/authenticated; PDF en bucket privado `efm-documentos`. Descargas repetidas reutilizan la misma emisión; las correcciones o conformidades posteriores generan otra emisión.
- `efm-verificar` consulta el token sin sesión y devuelve sólo identidad básica, evaluación, notas/conformidades al emitir, huella del archivo y vigencia. No publica CI, nacimiento, medidas, observaciones médicas ni el PDF. Página pública `efm-campo/verificar.html`: el QR consulta la emisión y permite comprobar el PDF localmente contra su huella. Una emisión anterior conserva su registro y avisa que hay datos nuevos.
- Migración `20261102102916_efmc_documentos_pdf.sql` aplicada; funciones desplegadas `efm-campo` v12 y `efm-verificar` v1, ambas con autenticación propia o token de verificación según corresponda.
- Validación: `tests/efmc-documentos.mjs` (permisos, aislamiento, formatos, caché, errores, integridad y concurrencia), `tests/efmc-pdf-render.mjs` (PDF real de una página y QR decodificado), `tests/efmc-carpeta-browser.cjs` (cinco descargas personales, soporte, verificación local y copia modificada; regresión de confirmación inmediata y tres jefes), conformidad, acceso e informes. Sólo fixtures; sin aceptar registros reales.
- Para el render de PDF en pruebas: instalar `pdf-lib@1.17.1 qrcode@1.5.4 jsqr@1.4.0` en carpeta temporal y pasar su `package.json` como `SIDECEME_PDF_TOOLS`; requiere `pdftotext` y `pdftoppm`. Navegador: `SIDECEME_PLAYWRIGHT_MODULE` permite indicar Playwright ya instalado.

## 3 de noviembre: diagnóstico de marcas conformes sin calificación

- Confirmado por dos PDF aportados y consulta agregada de los registros vigentes de 2026-11-03: 13 marcas pendientes de nota, 10 con conformidad (3 abdominales superiores a tabla, 2 flexiones superiores a tabla, 6 aeróbicas mejores que primera celda y 2 aeróbicas entre filas).
- El baremo v1 deja estos casos con nota nula a propósito: faltan reglas institucionales de tope y segundos entre filas. No es pérdida de la marca ni fallo de la suma ponderada; el promedio espera correctamente las cinco notas.
- Corrección de interfaz preparada: estado ámbar con motivo cuando falta nota aunque exista conformidad, contador de pendientes de calificación para los jefes y alerta persistente en la carpeta del alumno. Cero sigue siendo nota válida; barras y NO_REALIZO conservan su tratamiento propio. Importaciones/caché v20.
- El usuario confirmó explícitamente tope de 100 para marcas superiores al máximo y siguiente fila de 10 segundos en aeróbica (18:25 → 18:30). Baremo v2 idéntico en cliente/servidor, sin alterar la marca exacta. Los tiempos mejores que la primera fila reciben 100; se mantienen los límites de entrada y celdas inferiores sin criterio.
- Servidor efm-campo v13 desplegado y contenido verificado: se reemplazó únicamente baremos.mjs, conservando autenticación y todos los demás archivos desplegados.
- De los 13 registros iniciales, 3 eran de PRUEBA sin organización y quedaron intactos. Los 10 restantes, de EVALUACION, se corrigieron con nuevas revisiones y metadatos calculo.recalculo (registro_origen, version_anterior, motivo, origen y realizado_en). Se preservaron marcas, fechas, sexo/nacimiento, evaluadores y organización; las 10 conformidades originales siguen en el historial. Las nuevas revisiones requieren nueva conformidad del alumno.
- Verificación SQL posterior: 10 revisiones corregidas, cero marcas/evaluadores alterados y cero notas ordinarias pendientes en evaluaciones reales de la fecha. Los cinco alumnos afectados tienen 5/5 notas. No se modificaron las notas del módulo académico ni se desactivaron triggers.
- Regresión específica de criterios: siete grupos de edad, ambos sexos, marcas por encima del máximo, segundos y fracciones entre filas, límites y paridad cliente/servidor; cinco casos representativos comprueban ponderación y preservación de marcas. Regresiones de acceso, conformidad, informes, PDF y talla-peso, además de Chromium para alumno/evaluador/jefes y carpetas. Caché app/baremo/launcher/soporte v21; interfaz de alertas v20.

## 03/11/2026 · Formatos 04/05 y grupos de excelencia física

- Modelos Word sustituidos por los dos documentos en blanco aportados por Sergio el 3 de noviembre. Se conserva su estructura, tipografía y espacios médicos. Firma única inferior: «Gral. Brig. José Jhonny Pardo Pardo» / «COMANDANTE DE LA ECEME.». Las descargas nuevas de evaluaciones anteriores usan el formato actual. Emisiones PDF históricas inmutables se conservan; snapshot v2 fuerza nueva emisión y su verificador usa la misma versión.
- Aguirre, Linares y Morales organizan grupos con tipo ORDINARIA/EXCELENCIA. Excelencia propone NEGRO; se permite otro color. NEGRO anterior sin modalidad sigue siendo excelencia. Incluye seis estaciones para captura y conformidad: cinco pruebas más talla/peso adicional; la hoja 05 sólo pondera natación, barras, abdominales, flexiones y aeróbica, 20 % cada una.
- Fuente de excelencia: fotografía «TABLA DIFERENCIADA» recibida el 03/11, edades 35–39/40–44/45–49/50+. Masculino: natación 200/230/260/290 segundos, barras 9/7/5/3, abdominales y suelo 55/50/45/40, aeróbica 1030/1080/1130/1180 segundos. Femenino: natación 230/260/290/320 segundos, barras 6/5/4/3, abdominales y suelo 40/35/30/25, aeróbica 1060/1110/1160/1210 segundos. Sergio confirmó expresamente 3:50 masculino 40–44 y cumple=100/no cumple=0. Menores de 35: pendiente, sin extrapolar.
- Natación de excelencia registra segundos con centésimas en 100 m: iniciar y detener/guardar. Fallo conserva la marca y UUID para reintento. Natación ordinaria conserva metros y baremo ordinario v2. Barras y natación de excelencia admiten NO CUMPLIÓ con confirmación y estado propio, nota 0; NO REALIZÓ permanece separado y sin nota.
- El servidor decide modalidad, baremo, unidad y nota desde la organización autorizada. No toma nota ni modalidad del cliente. No se recalculan registros ni se dan conformidades de alumnos reales. No hay cambios de esquema, permisos o autenticación. Caché frontend v22.
- Validación: regresiones EFM completas, 80 fronteras de excelencia, servidor (3:50 inclusivo/centésima siguiente, manipulación, restricciones), navegador móvil (cronómetro, fallo/reintento, confirmación/cancelación de no cumplió y organización), navegación ordinaria, alumno/evaluador/jefes, carpeta y QR; nueve exportaciones Word/PDF/Excel y dos PDFs personales ficticios, OOXML válido y PDF de una página. Vista Word mediante docx-preview; inspección en Microsoft Word nativo pendiente.

### 03/11/2026 · Corrección de foto y paginación Word
- El Word reenviado por Sergio reproducía dos páginas y contenía el JPEG, pero faltaba su Content Type. Además, el retrato heredaba un anclaje flotante con desplazamiento fuera de la celda. El visor web anterior no detectó la paginación real de Writer.
- Se declara image/jpeg en OOXML y se inserta el retrato inline de 60 × 80 pt dentro de la celda superior derecha. Estado/fecha pasan a una línea completa; se eliminan párrafos vacíos y se ajustan márgenes a 0,39 pulgadas, conservando tablas, textos, notas y firmas. Ambos modelos y descarga individual/conjunta comparten la corrección. Caché de descarga y cadena de carga v23.
- Archivo original corregido fuera del repositorio: todos sus textos y bytes de foto conservados, convertido con LibreOffice de dos páginas a una, foto visible. Prueba tests/efmc-word-layout.cjs genera cuatro cursantes ficticios con cuatro retratos distintos, nombres largos y modelos ordinario/excelencia; conversión real de Word a PDF confirma cuatro páginas, foto y firma completa por página. No se publican datos del adjunto.
