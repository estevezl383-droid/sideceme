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
