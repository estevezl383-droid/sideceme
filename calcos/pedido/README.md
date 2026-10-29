# Guardado y preparación de pedidos para alumnos — 29/10/2026

El botón antes llamado «Copias» se llama **Guardar como**. Su primera acción
guarda un archivo JSON mediante el selector del navegador, cuando está
disponible, o solicita una descarga. Sólo se informa «Archivo guardado» después
de que la escritura y el cierre terminaron correctamente. Una descarga por
enlace se informa como «Descarga solicitada», porque la página no puede confirmar
que el alumno haya aceptado el archivo. Cancelar el selector no dispara una
descarga adicional. Las restricciones del selector permiten usar la descarga
normal como alternativa.

Se corrigieron otros dos problemas del resguardo: la huella de una copia local
se marcaba antes de confirmar su escritura, impidiendo reintentar el mismo
contenido tras un fallo; y se omitían ejercicios que sólo tenían hojas o fases.
Los errores locales se muestran en el panel. Una fecha antigua de profesor ya
no vence una sesión de alumno. La ventana de ingreso abierta desde el aviso
puede devolver la sesión nueva del alumno a la pestaña original: sessionStorage
no se comparte automáticamente entre pestañas.

## Qué ocurre al preparar un pedido

La aplicación construye texto en el navegador del alumno. La caja «Trabajar esta
hoja con IA» no envía ese texto a una API de IA. El alumno lo copia o descarga y
lo entrega a su servicio de IA. Varios navegadores pueden hacerlo a la vez.
Eso no establece una capacidad ilimitada del sitio ni de servicios externos.

Preparar el expediente sí puede consultar las capas del terreno y el censo.
Se encontraron peticiones sin límite de espera. La lectura de esas capas ahora
abarca un máximo de 20 segundos, incluido su JSON, y aborta la petición al salir;
el censo opcional tiene un máximo de 10 segundos. El panel limita a 30 segundos
la espera asíncrona para preparar o descargar la hoja: muestra el error y libera
el botón. Esto no interrumpe cálculos síncronos largos del navegador ni reemplaza
la capacidad del servidor de mapas. Las capas que faltan mantienen el aviso que
ya daba la Mesa; no se fabrican datos del terreno.

El portapapeles tiene una alternativa de selección y copia. **Copiar texto
preparado** permite un nuevo clic sin repetir la carga del terreno. Ese botón
copia el texto que ya está preparado: si se cambian la hoja o sus indicaciones,
hay que preparar otro pedido. Se corrigió también la función de Pandora que
pulsaba el primer botón con «Ocultar»: podía cerrar inmediatamente la vista del
pedido. Preparación ya inicia plegada desde su propio estado.

«Corto» limita a 60.000 caracteres y «Normal» a 120.000. «Completo» no tiene tope.
Son límites de texto de la aplicación, no garantías de aceptación por una IA:
el contexto disponible y las cuotas dependen del modelo, el plan y la cuenta.

## Uso en clase

1. Abrir el ejercicio y descargar un JSON con **Guardar como** antes de empezar.
2. Trabajar una hoja por pedido. Probar **Corto** cuando el texto es demasiado largo.
3. Esperar a que termine. Si falla la copia, usar **Copiar texto preparado**, la
   selección manual o la descarga del pedido.
4. Cada alumno usa su cuenta de IA y respeta los avisos de sus límites.
5. Guardar un JSON actualizado antes de cambiar de equipo o terminar la clase.

El guardado compartido de un Estado Mayor es un asunto distinto de los prompts.
El código de `supabase/espejo-ge/calco-ops/index.ts` actualiza el payload completo
del grupo, sin control de versión para ese guardado. Dos pestañas que guarden
versiones diferentes pueden reemplazarse. Para la versión compartida se debe
coordinar quién guarda, o practicar con copias independientes y después integrar
los aportes. Agregar control de versión o edición simultánea por secciones exige
un cambio de servidor y de cliente; esta revisión no lo implementa.

## Verificación y alcance

Pruebas con datos ficticios y servicios simulados: perfil de alumno, exportación
de hojas y ambos CAP, selector de archivo, cancelación, escritura fallida,
reintento tras falta de cuota, renovación de sesión en otra ventana, portapapeles
bloqueado y cinco navegadores aislados que preparan y copian pedidos a la vez.
También se verifica que abrir el texto del pedido no lo cierre automáticamente.
La simultaneidad se comprueba localmente; no mide la capacidad de producción ni
los servicios de IA de los alumnos y no identifica por sí sola el fallo de una
computadora concreta. Los límites de espera se prueban con operaciones detenidas
y plazos cortos controlados. Un navegador con poco espacio o permisos bloqueados
puede seguir necesitando que el alumno descargue manualmente su archivo.

El compilado nuevo se genera con `pruebas/construir-guardar-ia.js`: verifica el
SHA-256 del anterior y revierte los reemplazos para comprobar igualdad byte por
byte. No modifica la estructura ni migra los ejercicios guardados.
