// ============================================================
// EDGE FUNCTION: calco-espejo   (v4 — capas en su tabla, enlaces estables)
//
// El espejo en vivo con Google Earth. Es la unica funcion que se
// atiende por GET y sin sesion: Google Earth no puede mandar cabeceras
// de autenticacion, asi que la credencial va en la propia direccion.
//
// Como funciona:
//   1. Se pide el enlace desde el Generador (calco-ops -> 'espejo').
//   2. Baja UNA vez un .kml chiquito: el "control". No tiene datos,
//      tiene enlaces de red que apuntan aca.
//   3. Google Earth los sigue y los refresca cada 10 segundos. Cuando se
//      publica un cambio, Google Earth lo muestra solo - tambien a distancia.
//
//   GET ?k=<clave>                -> el control (los enlaces de red)
//   GET ?k=<clave>&parte=<capa>   -> el KML de esa capa, tal cual
//
// v4 (26-sep-2026) — "EL ESPEJO NO SE SINCRONIZA".
// Las capas vivian dentro del payload del trabajo y el autoguardado las
// borraba a los segundos: Google Earth quedaba vacio o mostraba una capa
// en el lugar de otra, porque los enlaces iban POR NUMERO (parte=0, 1…).
// Ahora las capas salen de `calco_espejo_partes` y el enlace de cada una
// es su NOMBRE (parte=unidades, parte=cmoc-terreno…): aparezca o
// desaparezca otra capa, cada enlace sigue apuntando a la suya. Los
// enlaces viejos por numero siguen andando.
//
// No se arma un KML combinado a proposito: cada calco se sirve verbatim
// como lo genero el Generador. Asi no hay que abrir ni recomponer XML,
// que es donde se rompen estas cosas.
//
// DOS TRAMPAS que dejaron el espejo mudo hasta 2026-08-17:
//
// 1. ESCAPADO DOBLE. El `&` que separa los parametros se escapa UNA sola
//    vez, al armar el XML. Escribir `&amp;` a mano y ademas pasarlo por
//    xml() lo convertia en `&amp;amp;`.
//
// 2. LA DIRECCION PROPIA NO SE SACA DE `req.url`. Adentro del runtime la
//    peticion llega como `http://<proyecto>.supabase.co/calco-espejo`:
//    sin `/functions/v1` y sin TLS. Se arma con SUPABASE_URL.
//
// Verify JWT: APAGADO (obligatorio: Google Earth no manda cabeceras).
// La clave es de SOLO LECTURA de ese planeamiento y se revoca
// regenerandola desde el Generador.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

// Cada cuanto Google Earth vuelve a leer cada capa.
const SEGUNDOS_REFRESCO = 10;

// La direccion publica de esta misma funcion. NO se deduce de req.url.
const YO = `${(Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "")}/functions/v1/calco-espejo`;

const kmlHeaders = {
  "Content-Type": "application/vnd.google-earth.kml+xml; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  // Que no se cachee: si se cachea, deja de ser "en vivo".
  "Cache-Control": "no-store, max-age=0",
};

const xml = (s: string) =>
  String(s ?? "").replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));

const noHay = (msg: string) =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(msg)}</name></Document></kml>`,
    { status: 404, headers: kmlHeaders },
  );

// Adonde tiene que mirar Google Earth. Se saca de las coordenadas que ya
// vienen en los KML publicados, para que al hacer doble clic en el
// ejercicio la camara caiga sobre el area y no en medio del oceano.
function miradaDe(kmls: string[]): string {
  try {
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90, hubo = false;
    for (const k of kmls) {
      const bloques = String(k || "").match(/<coordinates>([\s\S]*?)<\/coordinates>/g) || [];
      for (const b of bloques) {
        for (const par of b.replace(/<\/?coordinates>/g, "").trim().split(/\s+/)) {
          const [lon, lat] = par.split(",").map(Number);
          if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
          if (Math.abs(lon) > 180 || Math.abs(lat) > 90) continue;
          minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
          hubo = true;
        }
      }
      if (hubo) break;
    }
    if (!hubo) return "";
    const lado = Math.max(maxLon - minLon, maxLat - minLat, 0.02);
    // ~111 km por grado; con 1,6 de margen entra el area entera en pantalla.
    const rango = Math.round(lado * 111000 * 1.6);
    return `<LookAt><longitude>${((minLon + maxLon) / 2).toFixed(6)}</longitude>` +
      `<latitude>${((minLat + maxLat) / 2).toFixed(6)}</latitude>` +
      `<altitude>0</altitude><heading>0</heading><tilt>0</tilt>` +
      `<range>${rango}</range><altitudeMode>relativeToGround</altitudeMode></LookAt>`;
  } catch {
    return "";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: kmlHeaders });

  const url = new URL(req.url);
  const clave = url.searchParams.get("k") || "";
  const parte = url.searchParams.get("parte");
  if (!clave || clave.length < 20) return noHay("Enlace de espejo no valido");

  const { data } = await sb.from("calcos")
    .select("id, nombre, ejercicio_id")
    .eq("espejo_clave", clave).limit(1);
  if (!data || !data.length) return noHay("Este enlace de espejo ya no es valido");
  const calco = data[0];

  // Las capas publicadas, en su orden.
  const { data: filas } = await sb.from("calco_espejo_partes")
    .select("clave, nombre, orden").eq("calco_id", calco.id).order("orden");
  const capas = filas || [];

  // ---- Una capa: el KML tal cual lo genero el Generador ----
  if (parte !== null) {
    // Enlaces viejos: parte=0, 1… (por numero de orden).
    const cual = /^\d+$/.test(parte) ? capas[Number(parte)]?.clave : parte;
    if (!cual) return noHay("Esa capa ya no esta en el espejo");
    const { data: k } = await sb.from("calco_espejo_partes")
      .select("kml").eq("calco_id", calco.id).eq("clave", cual).limit(1);
    if (!k || !k.length || !k[0].kml) return noHay("Esa capa ya no esta en el espejo");
    return new Response(k[0].kml, { headers: kmlHeaders });
  }

  // ---- El control: enlaces de red que Google Earth va a seguir ----
  // Para ubicar la camara alcanza con la primera capa chica (el area).
  let mirada = "";
  if (capas.length) {
    const { data: k } = await sb.from("calco_espejo_partes")
      .select("kml").eq("calco_id", calco.id).eq("clave", capas[0].clave).limit(1);
    mirada = miradaDe((k || []).map((x: any) => x.kml));
  }

  // El `&` va CRUDO: xml() lo escapa una sola vez y queda `&amp;`.
  const base = `${YO}?k=${encodeURIComponent(clave)}`;
  const enlaces = capas.map((k: any) => `
    <NetworkLink>
      <name>${xml(k.nombre || "Capa")}</name>
      <open>1</open>
      <Link>
        <href>${xml(`${base}&parte=${encodeURIComponent(k.clave)}`)}</href>
        <refreshMode>onInterval</refreshMode>
        <refreshInterval>${SEGUNDOS_REFRESCO}</refreshInterval>
      </Link>
    </NetworkLink>`).join("");

  const vacio = capas.length
    ? ""
    : `<Placemark><name>Todavia no hay capas publicadas</name>
         <description>Cuando la Mesa publique el ejercicio, las capas van a aparecer aca solas.</description>
       </Placemark>`;

  const doc = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${xml(calco.nombre || "Planeamiento")} - espejo en vivo</name>
    <description>Se actualiza solo cada ${SEGUNDOS_REFRESCO} segundos.${calco.ejercicio_id ? ` Ejercicio ${xml(calco.ejercicio_id)}.` : ""}</description>
    <open>1</open>
    ${mirada}${enlaces}${vacio}
  </Document>
</kml>`;

  return new Response(doc, { headers: kmlHeaders });
});
