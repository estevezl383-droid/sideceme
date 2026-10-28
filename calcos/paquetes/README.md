# Paquetes de terreno de Bolivia

Modo opcional `calcos/?paquetes=1`. El alumno abre el archivo de su zona; SIDECEME verifica su sesión y las reglas actuales de `calcos_acceso`. Las capas, el relieve y la cobertura se leen desde el archivo local. El ejercicio se guarda en el IndexedDB existente del navegador; debe descargarse para entregarlo. El modo normal conserva su comportamiento.

## Estado de entrega

Implementación preparada y probada localmente. No activa hasta desplegar el esquema, registrar las claves, desplegar `calcos-paquetes` y publicar el frontend. Los archivos grandes y las claves NO forman parte del repositorio.

## Alcance

Cuatro zonas aproximadas: Pacífico, Amazónico, Central y Plata. Vectores civiles de `calcos_features`, relieve Terrarium niveles 7–12 y cobertura de suelo clasificada desde el servicio Sentinel-2 que usa el generador. Sin documentos, órdenes, unidades ni soluciones del CMOC. No se cambia el algoritmo del CMOC: solamente el origen de sus datos.

El relieve llega a ~40 m/píxel; el algoritmo existente elige menor detalle para áreas grandes. Cobertura vegetal remuestreada a ~36 m/píxel, no resolución original de 10 m. La precisión vertical no se deduce de la resolución horizontal. Límites nacionales basados en Natural Earth con un margen de 0.15 grados; las cuatro divisiones son aproximadas. No utilizar como límites oficiales.

El mapa de fondo sigue en internet. Las huellas en vivo y las capas militares no se solicitan en modo paquetes; se informa que no están incluidas. Las capas civiles ya contienen caminos y sendas de la base disponible. Otros servicios opcionales, como IA o colaboración, siguen requiriendo internet.

## Formato y acceso

SIDPKG1: 8 bytes de firma, uint32 little-endian con longitud del manifiesto, JSON UTF-8, bloques cifrados. AES-256-GCM por bloque, IV aleatorio de 96 bits, AAD `id + '\n' + path`. Vectores comprimidos con gzip; PNG sin recompresión. Cada entrada tiene desplazamiento, longitud, codec, tamaño descomprimido y bbox para filtrar lecturas. La clave no se incluye en el archivo ni en el frontend. El servidor compara SHA-256 del manifiesto con el registro privado antes de entregarla.

La autorización dura hasta el vencimiento de la sesión o cuatro horas, lo que ocurra primero. La clave queda solo en memoria como CryptoKey no exportable. Recargar exige conexión y elegir otra vez el archivo (no descargarlo nuevamente). Revocar acceso no borra lo ya visto ni invalida de inmediato una clave previamente entregada. Un usuario autorizado con conocimientos técnicos puede extraer contenido: no es DRM absoluto, ni evita capturas. La atribución y las licencias de los datos abiertos siguen aplicando.

Lectura por fragmentos, cachés acotadas, sin cargar el archivo entero. Área de trabajo máxima de 4 grados por lado y 100.000 elementos por capa; si se supera se solicita reducir el área, sin recortar datos silenciosamente. El usuario puede cargar paquetes vecinos para un área que cruza límites. El paquete conserva elementos completos que intersectan su zona; se deduplican por id y se recortan al área con el motor existente.

## Despliegue, después de revisar

1. Aplicar `scripts/servidor.sql`: tabla con RLS y sin acceso para anon/authenticated. No cambia sesiones ni reglas existentes.
2. Insertar los cuatro registros desde el archivo privado `registro-claves.json` del empaquetador: `id`, `manifest_sha256`, `clave_b64` (campo `key` del registro), `activo=true`. Nunca publicar ni adjuntar las claves a un PR.
3. Desplegar `supabase/functions/calcos-paquetes/index.ts`. Usa autenticación propia mediante las sesiones existentes; configurar `verify_jwt=false`, como `calcos-datos`. No crear políticas públicas para la tabla.
4. Publicar el frontend de esta rama. Primero probar con una cuenta autorizada y una no autorizada; después una clase piloto con varios equipos.
5. Repartir los cuatro archivos una sola vez. Cada alumno necesita únicamente su zona y, si trabaja en un borde, la vecina. Abrir SIDECEME con su cuenta y acceder al modo paquetes en la misma pestaña.

Rollback: restaurar `calcos/index.html` y `guardado/v1/resguardo.js` anteriores. Desactivar los registros de `calcos_paquetes`. No borrar los ejercicios locales de los alumnos.

## Construcción

`integrar.py` genera el nuevo compilado a partir del vigente conocido, con reemplazos únicos verificados. Si cambia el compilado de origen, adaptar los puntos de integración y repetir pruebas; no efectuar reemplazos aproximados.

`construir.py` requiere Python, shapely y cryptography, exportación de vectores en lotes, descargas de relieve y cobertura, inventarios y conteos esperados. Escribe las claves con permisos 0600 fuera de Git y valida todos los bloques por descifrado antes de entregar.

## Pruebas

- `node calcos/pruebas/paquetes.mjs`: integridad, rechazo, expiración y validación del contenedor.
- `node calcos/pruebas/paquetes-servidor.mjs`: autorización, revocación, roles, cursos y hash, con base simulada.
- `node calcos/pruebas/e2e/paquetes.cjs`: navegador real, servidor simulado, cinco calcos, motor CMOC sin cambios y guardado local; sin descargas vectoriales, DEM, cobertura ni autoguardado remoto. Admite `REAL_PACKAGE`, `PACKAGE_KEYS` (privado) y `TEST_SCREENSHOT`.

Las pruebas locales no certifican 125 dispositivos simultáneos ni el rendimiento de la red del aula. Evitar la descarga inicial de todos los paquetes a la vez sobre esa red.

## Fuentes

- Vectores: SIDECEME / OpenStreetMap según atribución del generador. © OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright
- Relieve: https://registry.opendata.aws/terrain-tiles/ ; atribución completa https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- Cobertura: Esri / Impact Observatory / Microsoft, https://livingatlas.arcgis.com/landcover/
- Máscara geográfica: Natural Earth, dominio público, https://www.naturalearthdata.com/about/terms-of-use/
