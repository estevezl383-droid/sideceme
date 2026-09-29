// Importador Google Earth -> calcos de terreno de SIDE-CEME
// Carga KML/KMZ, permite elegir el calco destino y agrega sin borrar lo existente.
(function () {
  "use strict";

  const DESTINOS = {
    comunicaciones: {
      nombre: "Comunicaciones",
      icono: "🛣️",
      subcapa(geom) {
        if (/LineString$/.test(geom)) return "comunicaciones_vias";
        if (/Polygon$/.test(geom)) return "comunicaciones_aero";
        return "comunicaciones_vias";
      },
      fclass(geom) {
        return /Polygon$/.test(geom) ? "airfield" : "unclassified";
      }
    },
    poblaciones: {
      nombre: "Poblaciones",
      icono: "🏘️",
      subcapa(geom) {
        return /Point$/.test(geom) ? "poblaciones_puntos" : "poblaciones_areas";
      },
      fclass(geom) {
        return /Point$/.test(geom) ? "locality" : "residential";
      }
    },
    hidrografico: {
      nombre: "Hidrográfico",
      icono: "💧",
      subcapa(geom) {
        return /Polygon$/.test(geom) ? "hidro_poligonos" : "hidro_lineas";
      },
      fclass(geom) {
        return /Polygon$/.test(geom) ? "water" : "river";
      }
    },
    vegetacion: {
      nombre: "Vegetación",
      icono: "🌲",
      subcapa() {
        return "vegetacion";
      },
      fclass() {
        return "forest";
      }
    }
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  function parseCoords(text) {
    return String(text || "")
      .trim()
      .split(/\s+/)
      .map((p) => {
        const a = p.split(",");
        const lon = Number(a[0]), lat = Number(a[1]);
        return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
      })
      .filter(Boolean);
  }

  function directChildren(el, tag) {
    return Array.from(el.children || []).filter((c) => c.localName === tag);
  }

  function textOfDirect(el, tag) {
    const n = directChildren(el, tag)[0];
    return n ? String(n.textContent || "").trim() : "";
  }

  function folderPath(pm) {
    const out = [];
    let p = pm.parentElement;
    while (p) {
      if (p.localName === "Folder") {
        const n = textOfDirect(p, "name");
        if (n) out.unshift(n);
      }
      p = p.parentElement;
    }
    return out;
  }

  function polygonGeom(el) {
    const outer = Array.from(el.getElementsByTagNameNS("*", "outerBoundaryIs"))[0];
    if (!outer) return null;
    const ring = Array.from(outer.getElementsByTagNameNS("*", "coordinates"))[0];
    const exterior = parseCoords(ring && ring.textContent);
    if (exterior.length < 3) return null;
    const coords = [exterior];
    for (const inner of Array.from(el.getElementsByTagNameNS("*", "innerBoundaryIs"))) {
      const c = Array.from(inner.getElementsByTagNameNS("*", "coordinates"))[0];
      const r = parseCoords(c && c.textContent);
      if (r.length >= 3) coords.push(r);
    }
    return { type: "Polygon", coordinates: coords };
  }

  function geometryFrom(el) {
    const tag = el.localName;
    if (tag === "Point") {
      const c = Array.from(el.getElementsByTagNameNS("*", "coordinates"))[0];
      const pts = parseCoords(c && c.textContent);
      return pts.length ? { type: "Point", coordinates: pts[0] } : null;
    }
    if (tag === "LineString") {
      const c = Array.from(el.getElementsByTagNameNS("*", "coordinates"))[0];
      const pts = parseCoords(c && c.textContent);
      return pts.length >= 2 ? { type: "LineString", coordinates: pts } : null;
    }
    if (tag === "Polygon") return polygonGeom(el);
    return null;
  }

  function placemarkFeatures(pm) {
    const nombre = textOfDirect(pm, "name") || "Elemento Google Earth";
    const descripcion = textOfDirect(pm, "description");
    const estilo = textOfDirect(pm, "styleUrl");
    const carpeta = folderPath(pm).join(" / ");
    const propsBase = {
      Nombre: nombre,
      Descripción: descripcion || undefined,
      Carpeta: carpeta || undefined,
      Origen: "Google Earth",
      _sideceme_ge: 1,
      _kmlStyleUrl: estilo || undefined
    };
    const geometries = [];

    for (const child of Array.from(pm.children || [])) {
      if (child.localName === "Point" || child.localName === "LineString" || child.localName === "Polygon") {
        const g = geometryFrom(child);
        if (g) geometries.push(g);
      } else if (child.localName === "MultiGeometry") {
        for (const gc of Array.from(child.children || [])) {
          const g = geometryFrom(gc);
          if (g) geometries.push(g);
        }
      }
    }

    return geometries.map((geometry, i) => ({
      type: "Feature",
      geometry,
      properties: {
        ...propsBase,
        ...(geometries.length > 1 ? { Parte: i + 1 } : {})
      }
    }));
  }

  function parseKml(text) {
    const doc = new DOMParser().parseFromString(String(text || ""), "application/xml");
    const err = doc.getElementsByTagName("parsererror")[0];
    if (err) throw new Error("El KML no es XML válido.");
    const features = [];
    for (const pm of Array.from(doc.getElementsByTagNameNS("*", "Placemark"))) {
      features.push(...placemarkFeatures(pm));
    }
    if (!features.length) {
      throw new Error("El archivo no contiene puntos, líneas o polígonos KML que SIDE-CEME pueda importar.");
    }
    return { type: "FeatureCollection", features };
  }

  async function leerArchivo(file) {
    if (!file) throw new Error("No se eligió ningún archivo.");
    const nombre = String(file.name || "").toLowerCase();
    let texto = "";
    if (nombre.endsWith(".kmz")) {
      const Zip = window.__SIDECEME_JSZIP;
      if (!Zip || typeof Zip.loadAsync !== "function") {
        throw new Error("El lector KMZ todavía no está disponible. Recargá SIDE-CEME y volvé a intentar.");
      }
      const zip = await Zip.loadAsync(file);
      const archivos = Object.values(zip.files || {}).filter((x) => !x.dir && /\.kml$/i.test(x.name));
      if (!archivos.length) throw new Error("El KMZ no contiene ningún archivo .kml.");
      const docKml = archivos.find((x) => /(^|\/)doc\.kml$/i.test(x.name)) || archivos[0];
      texto = await docKml.async("string");
    } else if (nombre.endsWith(".kml")) {
      texto = await file.text();
    } else {
      throw new Error("Elegí un archivo .KML o .KMZ de Google Earth.");
    }
    const fc = parseKml(texto);
    return { fc, archivo: file.name || "Google Earth" };
  }

  function prepararImportacion(fc, destino, archivo) {
    const cfg = DESTINOS[destino];
    if (!cfg) throw new Error("Elegí el calco al que querés agregar la información.");
    const features = (fc.features || []).map((f, idx) => {
      const geom = f.geometry && f.geometry.type || "";
      const sub = cfg.subcapa(geom);
      return {
        ...f,
        id: f.id || `ge-${Date.now()}-${idx}`,
        _capaId: sub,
        properties: {
          ...(f.properties || {}),
          Capa: `${cfg.nombre} · Google Earth`,
          Archivo: archivo || "Google Earth",
          fclass: (f.properties && f.properties.fclass) || cfg.fclass(geom),
          _sideceme_ge: 1,
          _sideceme_destino: destino,
          _sideceme_subcapa: sub
        }
      };
    });
    return { destino, archivo, features };
  }

  function fusionarResultados(actual, imp) {
    const out = actual && typeof actual === "object" ? { ...actual } : {};
    const prev = out[imp.destino] || {
      fc: { type: "FeatureCollection", features: [] },
      total: 0,
      porCapa: {}
    };
    const baseFeatures = Array.isArray(prev.fc && prev.fc.features) ? prev.fc.features : [];
    const features = [...baseFeatures, ...imp.features];
    const porCapa = { ...(prev.porCapa || {}) };
    for (const f of imp.features) {
      const k = f._capaId || (f.properties && f.properties._sideceme_subcapa) || "google_earth";
      porCapa[k] = (porCapa[k] || 0) + 1;
    }
    out[imp.destino] = {
      ...prev,
      fc: { type: "FeatureCollection", features },
      total: features.length,
      porCapa,
      _googleEarth: {
        ...(prev._googleEarth || {}),
        ultimaImportacion: new Date().toISOString(),
        archivo: imp.archivo
      }
    };
    return out;
  }

  function importedBySubcapa(resultados) {
    const m = {};
    for (const r of Object.values(resultados || {})) {
      const fs = r && r.fc && Array.isArray(r.fc.features) ? r.fc.features : [];
      for (const f of fs) {
        if (!(f && (f._capaId || (f.properties && f.properties._sideceme_subcapa)))) continue;
        const isGe = f.properties && f.properties._sideceme_ge;
        if (!isGe) continue;
        const k = f._capaId || f.properties._sideceme_subcapa;
        (m[k] || (m[k] = [])).push(f);
      }
    }
    return m;
  }


  function preservarImportados(nuevo, anterior) {
    const out = nuevo && typeof nuevo === "object" ? { ...nuevo } : {};
    const imp = importedBySubcapa(anterior || {});
    const porDestino = {};
    for (const r of Object.values(anterior || {})) {
      const fs = r && r.fc && Array.isArray(r.fc.features) ? r.fc.features : [];
      for (const feat of fs) {
        const dest = feat && feat.properties && feat.properties._sideceme_destino;
        if (!dest || !(feat.properties && feat.properties._sideceme_ge)) continue;
        (porDestino[dest] || (porDestino[dest] = [])).push(feat);
      }
    }
    for (const [dest, fs] of Object.entries(porDestino)) {
      const prev = out[dest] || { fc: { type: "FeatureCollection", features: [] }, total: 0, porCapa: {} };
      const base = Array.isArray(prev.fc && prev.fc.features)
        ? prev.fc.features.filter((x) => !(x && x.properties && x.properties._sideceme_ge))
        : [];
      const features = [...base, ...fs];
      const porCapa = { ...(prev.porCapa || {}) };
      for (const feat of fs) {
        const k = feat._capaId || (feat.properties && feat.properties._sideceme_subcapa) || "google_earth";
        porCapa[k] = (porCapa[k] || 0) + 1;
      }
      out[dest] = { ...prev, fc: { type: "FeatureCollection", features }, total: features.length, porCapa };
    }
    return out;
  }

  function sumarDatosParaAnalisis(datos, resultados) {
    const out = { ...(datos || {}) };
    const imp = importedBySubcapa(resultados);
    for (const [k, fs] of Object.entries(imp)) {
      const base = out[k] && out[k].fc ? out[k].fc : out[k];
      const old = base && Array.isArray(base.features) ? base.features : [];
      out[k] = { type: "FeatureCollection", features: [...old, ...fs] };
    }
    return out;
  }

  function sumarAConsulta(datos, resultados, solicitadas) {
    const out = { ...(datos || {}) };
    const imp = importedBySubcapa(resultados);
    const set = new Set(solicitadas || Object.keys(imp));
    for (const [k, fs] of Object.entries(imp)) {
      if (!set.has(k)) continue;
      const base = out[k] && out[k].fc ? out[k].fc : out[k];
      const old = base && Array.isArray(base.features) ? base.features : [];
      out[k] = { type: "FeatureCollection", features: [...old, ...fs] };
    }
    return out;
  }

  function resumenGeometria(fc) {
    const r = { puntos: 0, lineas: 0, areas: 0 };
    for (const f of fc.features || []) {
      const t = f.geometry && f.geometry.type || "";
      if (/Point$/.test(t)) r.puntos++;
      else if (/LineString$/.test(t)) r.lineas++;
      else if (/Polygon$/.test(t)) r.areas++;
    }
    return r;
  }

  function modalImportar(leido) {
    return new Promise((resolve) => {
      const r = resumenGeometria(leido.fc);
      const fondo = document.createElement("div");
      fondo.id = "sid-ge-import-modal";
      fondo.style.cssText = "position:fixed;inset:0;z-index:50000;background:rgba(0,0,0,.68);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif";
      fondo.innerHTML = `
        <div style="width:min(540px,94vw);background:#151d2a;color:#eaf1f8;border:1px solid #3e536d;border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.55);padding:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <div style="font-size:18px;font-weight:800;flex:1">🌎 Complementar calcos desde Google Earth</div>
            <button data-x style="background:none;border:0;color:#aebbd0;font-size:20px;cursor:pointer">✕</button>
          </div>
          <div style="font-size:12px;color:#aebbd0;line-height:1.45;margin-bottom:12px">
            <b style="color:#fff">${esc(leido.archivo)}</b><br>
            Se detectaron <b>${r.puntos}</b> punto(s), <b>${r.lineas}</b> línea(s) y <b>${r.areas}</b> área(s).
            Se <b>AGREGAN</b> al calco elegido; no se borra lo que SIDE-CEME ya generó.
          </div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8ea3ba;margin-bottom:6px">Agregar a:</div>
          <div data-dests style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
            ${Object.entries(DESTINOS).map(([id,d]) => `
              <button data-dest="${id}" style="background:#202b3c;color:#eaf1f8;border:1px solid #40516a;border-radius:8px;padding:11px 8px;cursor:pointer;font-weight:700">${d.icono} ${esc(d.nombre)}</button>
            `).join("")}
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end">
            <button data-cancel style="background:#283548;color:#d9e4ef;border:0;border-radius:7px;padding:9px 13px;cursor:pointer">Cancelar</button>
          </div>
        </div>`;
      let elegido = null;
      const cerrar = (v) => { fondo.remove(); resolve(v); };
      fondo.querySelector("[data-x]").onclick = () => cerrar(null);
      fondo.querySelector("[data-cancel]").onclick = () => cerrar(null);
      fondo.onclick = (e) => { if (e.target === fondo) cerrar(null); };
      for (const b of fondo.querySelectorAll("[data-dest]")) {
        b.onclick = () => {
          elegido = b.getAttribute("data-dest");
          cerrar(elegido);
        };
      }
      document.body.appendChild(fondo);
    });
  }

  async function elegirArchivo() {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz";
      input.style.display = "none";
      input.onchange = () => {
        const f = input.files && input.files[0];
        input.remove();
        resolve(f || null);
      };
      document.body.appendChild(input);
      input.click();
    });
  }

  async function importarDesdeUI() {
    const hook = window.__SIDECEME_IMPORT_STATE;
    if (!hook || typeof hook.setResultados !== "function") {
      alert("SIDE-CEME todavía está terminando de cargar. Esperá un momento y volvé a intentar.");
      return;
    }
    try {
      const file = await elegirArchivo();
      if (!file) return;
      hook.setEstado && hook.setEstado("Leyendo " + file.name + "…");
      const leido = await leerArchivo(file);
      const destino = await modalImportar(leido);
      if (!destino) {
        hook.setEstado && hook.setEstado("");
        return;
      }
      const imp = prepararImportacion(leido.fc, destino, leido.archivo);
      hook.setResultados((actual) => {
        const nuevo = fusionarResultados(actual, imp);
        window.__resultados = nuevo;
        return nuevo;
      });
      hook.setVisibles && hook.setVisibles((v) => {
        const a = Array.isArray(v) ? v.slice() : v ? [v] : [];
        if (!a.includes(destino)) a.push(destino);
        return a;
      });
      hook.setError && hook.setError("");
      hook.setEstado && hook.setEstado(`✅ ${imp.features.length} elemento(s) de Google Earth agregados al calco de ${DESTINOS[destino].nombre}. Se guardan con el ejercicio y entran al análisis.`);
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      hook.setError && hook.setError("No se pudo importar Google Earth: " + msg);
      hook.setEstado && hook.setEstado("");
      alert("No se pudo importar el archivo.\n\n" + msg);
    }
  }

  function asegurarBoton() {
    const barra = document.querySelector(".botones-mapa");
    if (!barra || barra.querySelector("#sid-btn-complementar-ge")) return;
    const btn = document.createElement("button");
    btn.id = "sid-btn-complementar-ge";
    btn.className = "btn-cmoc-abrir";
    btn.type = "button";
    btn.title = "Agregar un KML/KMZ de Google Earth a Comunicaciones, Poblaciones, Hidrográfico o Vegetación. No borra el calco existente.";
    btn.textContent = "📥 Complementar calcos";
    btn.onclick = importarDesdeUI;
    const earth = Array.from(barra.querySelectorAll("button")).find((b) => /Espejo|Bajar KMZ/i.test(b.textContent || ""));
    earth && earth.nextSibling ? barra.insertBefore(btn, earth.nextSibling) : barra.appendChild(btn);
  }

  const obs = new MutationObserver(() => asegurarBoton());
  const arrancar = () => {
    asegurarBoton();
    obs.observe(document.documentElement, { childList: true, subtree: true });
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", arrancar, { once: true }) : arrancar();

  window.SIDECEME_IMPORTAR_GE = {
    version: 1,
    leerArchivo,
    parseKml,
    prepararImportacion,
    fusionarResultados,
    preservarImportados,
    sumarDatosParaAnalisis,
    sumarAConsulta,
    importarDesdeUI
  };
})();