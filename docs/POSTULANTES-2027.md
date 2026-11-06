# Postulantes ECEME 2027

Módulo de admisión en `/postulantes/`, dentro de SIDECEME. Mantiene sus propios expedientes, sesiones, resultados, conformidades, documentos e historial. No crea cursantes ni registra sanciones disciplinarias.

El 27 de noviembre de 2026 es una referencia de duración. El cierre y la reapertura se ejecutan exclusivamente desde la cuenta activa del comandante y requieren una orden con motivo. Cada petición de postulante vuelve a comprobar ese estado; el cierre revoca sus sesiones sin borrar datos. La pestaña abierta comprueba el acceso cada 30 segundos mientras está visible.

## Acceso institucional

Primero ingresar normalmente a SIDECEME y pulsar **POSTULANTES 2027**. El servidor utiliza la sesión personal existente, comprueba que sigue activa y consulta `post_permisos`. No acepta sesiones master ni sesiones de soporte heredadas.

| Cuenta | Alcance inicial confirmado |
|---|---|
| P001 — comandante | Consulta general, documentos, cierre y reapertura, revisión de directiva |
| P002 — jefe de estudios | Consulta general, identidades, evaluaciones académicas/médicas/psicológicas, documentos |
| P032 — Villarroel | Consulta general de expedientes y matriz de resultados |
| P020 — Linares | Consulta general y registro de evaluación física |
| P030 — administrador | Identidades, evaluaciones, documentos y vista del postulante con motivo e historial |

**Ver como postulante** muestra las notas publicadas y los documentos de esa persona. Registra la consulta a nombre del administrador y conserva su propia sesión. La conformidad únicamente puede darla el postulante desde su cuenta personal.

## Alta e importación

Cada expediente requiere nombre completo, CI conservado como texto, fuente documental y fotografía JPG/PNG de hasta 1 MB. Para habilitarlo, el responsable debe cotejar foto, nombre y CI y marcar la identidad como verificada. Una solicitud personal de registro queda pendiente y no obtiene acceso hasta ese cotejo. La solicitud no reemplaza un expediente existente.

La importación acepta una lista JSON con `ci`, `nombre_completo`, `grado`, `arma`, `foto` como data URL JPG/PNG, `filiacion` como objeto y `fuente`. Se presenta una revisión individual de cada persona antes de guardar. No hay reemplazo silencioso por CI ni importación de contraseñas. Los datos personales y fotografías se guardan en tablas privadas de Supabase; nunca deben agregarse a este repositorio público.

CI/CI es la credencial inicial solicitada. El primer ingreso obliga a crear una contraseña diferente, de 10 a 72 bytes; se almacena bcrypt y el navegador no persiste la contraseña. Las sesiones de postulantes duran hasta ocho horas y se almacenan en la base mediante una huella del token. Existe límite de intentos de ingreso y solicitudes de registro.

## Evaluaciones y documentos

Incluye las seis materias indicadas por el solicitante, evaluación física, revisión médica y evaluación psicológica. El cronograma se transcribió de las imágenes aportadas. La convocatoria completa **no se pudo revisar**: tanto el PDF como el RAR exceden el límite de transferencia de 32 MiB de esta sesión. No se importaron postulantes reales ni se verificó contenido del RAR.

Las notas conservan la escala declarada en el acta, sin ponderación ni aprobación automática. Pendiente y ausente tienen nota nula; cero es una nota válida. Cada rectificación comprueba la revisión esperada y conserva el valor anterior, el nuevo, el evaluador, la fecha, el motivo y la referencia de respaldo. La conformidad corresponde a una revisión concreta.

La evaluación física permite registrar pruebas, marcas, unidades, notas, escalas y observaciones del acta. Este módulo inicial **no aplica los baremos de cursantes a los postulantes**. La integración del cálculo automático con la plataforma física existente requiere cotejar primero el anexo correspondiente de la convocatoria completa.

Los registros parciales identifican resultados pendientes y no acreditan aprobación. El certificado final requiere las nueve evaluaciones completas y publicadas, identidad verificada y revisión expresa de la convocatoria. La revisión registra la referencia y la huella SHA256 del PDF seleccionado, sin subir ese PDF al repositorio.

Los PDF se generan y archivan en el servidor con foto, identidad, evaluaciones publicadas, detalles físicos, respaldo, evaluador, revisión y conformidad. El QR consulta folio, fecha, estado y huella del archivo. La página pública no muestra CI, fotos ni notas y permite comparar un PDF local con el original archivado. Una rectificación de identidad o de evaluación anula la vigencia de documentos previos, que siguen archivados.

## Instalación y comprobación

1. Aplicar `supabase/postulantes/001_postulacion_2027.sql` una sola vez.
2. Desplegar `supabase/functions/postulantes-ops/index.ts` y `documento.mjs`, con `verify_jwt=false`: la RPC comprueba la autenticación propia del sistema. La service role permanece en el servidor.
3. Publicar `index.html` y `postulantes/` juntos en la misma raíz de SIDECEME. El verificador está fijado al origen institucional de GitHub Pages del repositorio.
4. Comprobar acceso institucional con la cuenta personal; cotejar y cargar los archivos reales cuando estén disponibles. No habilitar cuentas cuyos datos no hayan sido verificados.

Validación realizada:

- SQL transaccional con identidades ficticias y `ROLLBACK`: permisos, RLS, aislamiento entre postulantes, primer ingreso, borradores, nota cero, concurrencia por revisión, conformidad, anulación de documento, consulta administrativa, cierre, reapertura, conservación del archivo y límite de intentos.
- Siete pruebas del endpoint sobre acciones internas, fotografías no permitidas, escala física, detalle malformado y tamaño de petición.
- Seis recorridos de navegador con API interceptada: alta, nota cero, consulta como postulante, móvil, cambio obligatorio de contraseña y comparación de PDF original/alterado.
- PDF real generado, reabierto, paginado y reproducible a partir de la misma instantánea.
- Regresión del soporte existente: 24 pruebas de servidor y 15 de interfaz aprobadas.

Las pruebas de navegador usan datos ficticios y no sustituyen una prueba de ingreso con la contraseña personal del propietario. Para repetir: `node --test tests/postulantes-endpoint.test.cjs`, `node tests/postulantes-ui.cjs` con servidor local en 8127 y `POST_PDF_DEPS=<node_modules temporal> node tests/postulantes-pdf.mjs`. El SQL de prueba requiere una transacción que se revierta, nunca una ejecución persistente de sus identidades ficticias.

## Retirada de la interfaz

Si fuera necesario retirar la interfaz, revertir el cambio de frontend y revocar las sesiones de `post_sesiones`. Conservar las tablas de expedientes, notas, historial y documentos. No se necesita borrar ni alterar cursantes, disciplina o el acceso habitual del sistema.
