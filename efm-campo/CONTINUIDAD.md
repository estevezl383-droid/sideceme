# Evaluación física digital ECEME

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
