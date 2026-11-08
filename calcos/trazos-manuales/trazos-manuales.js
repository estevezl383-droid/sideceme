// ✏️ Trazos a mano en los calcos del terreno (08-11-2026)
//
// Lo que OSM no trae (un camino clandestino recién abierto, una laguna, un
// pueblo sin cartografiar) se DIBUJA en la carta desde la misma fila del calco
// en «👁 1·b · Qué se ve en el calco → 🗺️ Calcos del terreno»:
//   · Comunicaciones → sólo a Comunicaciones (líneas: camino o camino clandestino)
//   · Hidrográfico   → sólo a Hidrográfico (líneas: río/canal/quebrada; polígonos: laguna, bofedal…)
//   · Poblaciones    → sólo a Poblaciones (polígono del pueblo y/o su punto)
//
// Cada trazo entra al calco como un elemento más (`resultados[calco].fc`), con
// las mismas marcas que los elementos de «📥 Complementar calcos»
// (`_sideceme_ge`, `_sideceme_destino`, `_sideceme_subcapa`). Por eso, sin tocar
// el compilado:
//   · se guarda con el ejercicio,
//   · sobrevive a «⚡ Generar calcos» (preservarImportados),
//   · entra al análisis (sumarAConsulta / sumarDatosParaAnalisis): corredores,
//     corredores clandestinos, terreno severo/restringido, rutas, población…
// La clasificación usa los mismos `fclass` de OSM que ya interpreta la app.
(function () {
  "use strict";

  // ── Qué se puede dibujar en cada calco ─────────────────────────────────────
  // sub = subcapa del calco (la misma que usa la app para OSM)
  const VIA = {
    "Via 1": "Vía 1 (todo tiempo, pavimentada)",
    "Via 2": "Vía 2 (todo tiempo, ripiada)",
    "Via 3": "Vía 3 (tiempo seco)",
    "Via 4": "Vía 4 (rodera / vereda)"
  };
  const DESTINOS = {
    comunicaciones: {
      nombre: "Comunicaciones",
      icono: "🛣️",
      fila: /comunicaciones/i,
      herramientas: [{ geom: "linea", txt: "✏️ Dibujar camino", ayuda: "Trazá un camino o un camino clandestino que no figura en el calco." }],
      tipos: {
        linea: [
          { grupo: "🛣️ Camino (red vial) — entra a corredores de movilidad y rutas", items: [
            { id: "via1", fclass: "primary", sub: "comunicaciones_vias", nom: "Carretera — Vía 1 (todo tiempo, pavimentada)", via: "Via 1" },
            { id: "via2", fclass: "secondary", sub: "comunicaciones_vias", nom: "Carretera — Vía 2 (todo tiempo, ripiada)", via: "Via 2" },
            { id: "via3", fclass: "unclassified", sub: "comunicaciones_vias", nom: "Camino — Vía 3 (tiempo seco)", via: "Via 3", def: true },
            { id: "via4", fclass: "track", sub: "comunicaciones_vias", nom: "Camino de tierra — Vía 4 (rodera)", via: "Via 4" }
          ] },
          { grupo: "╫ Camino clandestino — entra a corredores clandestinos (contrabando)", items: [
            { id: "clnd", fclass: "track", sub: "comunicaciones_caminos", nom: "Camino clandestino (rodera / huella)", via: "Via 4", clandestino: true },
            { id: "clnds", fclass: "path", sub: "comunicaciones_caminos", nom: "Senda clandestina (a pie / acémila)", via: "Via 4", clandestino: true }
          ] }
        ]
      }
    },
    hidrografico: {
      nombre: "Hidrográfico",
      icono: "💧",
      fila: /hidrogr/i,
      herramientas: [
        { geom: "linea", txt: "〰 Río / quebrada", ayuda: "Trazá un río, canal o quebrada (línea)." },
        { geom: "poligono", txt: "🌊 Laguna / lago", ayuda: "Rodeá una laguna, lago, embalse o bofedal (polígono)." }
      ],
      tipos: {
        linea: [
          { grupo: "〰 Curso de agua", items: [
            { id: "rio", fclass: "river", sub: "hidro_lineas", nom: "Río — obstáculo para la movilidad", def: true },
            { id: "canal", fclass: "canal", sub: "hidro_lineas", nom: "Canal — obstáculo para la movilidad" },
            { id: "queb", fclass: "stream", sub: "hidro_lineas", nom: "Quebrada / arroyo (no es obstáculo)" }
          ] }
        ],
        poligono: [
          { grupo: "🌊 Espejo de agua — terreno severo (no transitable)", items: [
            { id: "lag", fclass: "water", sub: "hidro_poligonos", nom: "Laguna / lago", def: true },
            { id: "emb", fclass: "reservoir", sub: "hidro_poligonos", nom: "Embalse / represa" },
            { id: "bof", fclass: "wetland", sub: "hidro_poligonos", nom: "Bofedal / pantano / humedal" }
          ] }
        ]
      }
    },
    poblaciones: {
      nombre: "Poblaciones",
      icono: "🏘️",
      fila: /poblaciones/i,
      herramientas: [
        { geom: "poligono", txt: "🏘️ Pueblo (área)", ayuda: "Rodeá la mancha de un pueblo o caserío que no figura (polígono)." },
        { geom: "punto", txt: "📍 Pueblo (punto)", ayuda: "Marcá con un punto un pueblo o caserío que no figura." }
      ],
      tipos: {
        poligono: [
          { grupo: "🏘️ Área poblada — terreno restringido", items: [
            { id: "res", fclass: "residential", sub: "poblaciones_areas", nom: "Área residencial / urbana", def: true },
            { id: "ind", fclass: "industrial", sub: "poblaciones_areas", nom: "Área industrial / campamento" }
          ] }
        ],
        punto: [
          { grupo: "📍 Centro poblado — cuenta para la población estimada", items: [
            { id: "town", fclass: "town", sub: "poblaciones_puntos", nom: "Pueblo (≈ 8 000 hab.)" },
            { id: "village", fclass: "village", sub: "poblaciones_puntos", nom: "Aldea (≈ 1 200 hab.)", def: true },
            { id: "hamlet", fclass: "hamlet", sub: "poblaciones_puntos", nom: "Caserío (≈ 200 hab.)" }
          ] }
        ]
      }
    }
  };
  const TIPOS_AREA = { residential: "Área residencial / urbana", industrial: "Área industrial" };
  const NOM_GEOM = { linea: "línea", poligono: "polígono", punto: "punto" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const hook = () => window.__SIDECEME_IMPORT_STATE;
  const mapa = () => window.__mapa2d;
  const tipoPorId = (destino, id) => {
    for (const lista of Object.values(DESTINOS[destino].tipos)) for (const g of lista) for (const t of g.items) if (t.id === id) return t;
    return null;
  };
  const nuevoId = () => "tm-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);

  // ── Datos: armar, sumar, quitar ────────────────────────────────────────────
  function geometria(geom, pts) {
    if (geom === "punto") return { type: "Point", coordinates: pts[0] };
    if (geom === "linea") return { type: "LineString", coordinates: pts };
    return { type: "Polygon", coordinates: [[...pts, pts[0]]] };
  }

  function armarFeature(destino, tipo, nombre, geom, pts, trazoId, extra) {
    const d = DESTINOS[destino];
    const props = {
      Nombre: nombre || tipo.nom,
      name: nombre || "",
      Tipo: tipo.nom,
      Capa: `${d.nombre} · dibujado a mano`,
      Origen: "Dibujado a mano",
      Fecha: new Date().toLocaleString("es-BO"),
      fclass: tipo.fclass,
      _sideceme_ge: 1,
      _sideceme_manual: 1,
      _sideceme_trazo: trazoId,
      _sideceme_tipo: tipo.id,
      _sideceme_destino: destino,
      _sideceme_subcapa: tipo.sub,
      ...(extra || {})
    };
    if (tipo.via) props["Clasificación militar"] = VIA[tipo.via];
    if (tipo.clandestino) props.Clandestino = "Sí";
    if (TIPOS_AREA[tipo.fclass] && tipo.sub === "poblaciones_areas") props.Tipo = TIPOS_AREA[tipo.fclass];
    return { type: "Feature", id: trazoId + (extra && extra._sideceme_parte ? "-" + extra._sideceme_parte : ""), _capaId: tipo.sub, geometry: geometria(geom, pts), properties: props };
  }

  function recontar(r) {
    const porCapa = {};
    for (const f of r.fc.features) {
      const k = f._capaId || (f.properties && f.properties._sideceme_subcapa) || "otros";
      porCapa[k] = (porCapa[k] || 0) + 1;
    }
    return { ...r, total: r.fc.features.length, porCapa: { ...(r.porCapa || {}), ...porCapa } };
  }

  // Quita los elementos del trazo `quitar` (si hay) y agrega `agregar` en el calco `destino`.
  function aplicar(destino, quitar, agregar) {
    const h = hook();
    if (!h || typeof h.setResultados !== "function") {
      alert("La Mesa todavía está terminando de cargar. Esperá un momento y volvé a intentar.");
      return false;
    }
    h.setResultados((actual) => {
      const out = actual && typeof actual === "object" ? { ...actual } : {};
      const prev = out[destino] || { fc: { type: "FeatureCollection", features: [] }, total: 0, porCapa: {} };
      const base = (prev.fc && Array.isArray(prev.fc.features) ? prev.fc.features : [])
        .filter((f) => !(quitar && f && f.properties && f.properties._sideceme_trazo === quitar));
      // porCapa se recalcula desde cero para lo que este calco tiene: así baja al borrar.
      const r = recontar({ ...prev, porCapa: {}, fc: { type: "FeatureCollection", features: [...base, ...(agregar || [])] } });
      out[destino] = r;
      window.__resultados = out;
      return out;
    });
    h.setVisibles && h.setVisibles((v) => {
      const a = Array.isArray(v) ? v.slice() : v ? [v] : [];
      if (!a.includes(destino)) a.push(destino);
      return a;
    });
    return true;
  }

  // Trazos (agrupados por _sideceme_trazo) que tiene un calco.
  function trazosDe(destino) {
    const h = hook();
    const r = h && typeof h.getResultados === "function" ? h.getResultados() : null;
    const fs = (r && r[destino] && r[destino].fc && r[destino].fc.features) || [];
    const m = new Map();
    for (const f of fs) {
      const p = f && f.properties;
      if (!p || !p._sideceme_manual || !p._sideceme_trazo) continue;
      if (!m.has(p._sideceme_trazo)) m.set(p._sideceme_trazo, []);
      m.get(p._sideceme_trazo).push(f);
    }
    return [...m.entries()].map(([id, feats]) => ({ id, feats, principal: feats.find((f) => f.geometry.type !== "Point") || feats[0] }));
  }

  // ── Dibujo en la carta (Leaflet) ───────────────────────────────────────────
  let activo = null; // sesión de dibujo/edición en curso

  function barra(html) {
    const b = document.createElement("div");
    b.className = "sid-tm-barra";
    b.innerHTML = html;
    document.body.appendChild(b);
    return b;
  }

  function terminarSesion() {
    if (!activo) return;
    try { activo.limpiar(); } catch {}
    activo = null;
  }

  // geom: "linea" | "poligono" | "punto". inicial: puntos para editar (opcional).
  function dibujar(geom, color, inicial) {
    return new Promise((resolve) => {
      const L = window.L, map = mapa();
      if (!L || !map) { alert("No encuentro la carta 2D. Pasá a la vista 2D y volvé a intentar."); resolve(null); return; }
      terminarSesion();
      const editando = Array.isArray(inicial) && inicial.length;
      const pts = editando ? inicial.map((p) => L.latLng(p[1], p[0])) : [];
      const grupo = L.layerGroup().addTo(map);
      const estilo = { color, weight: 4, opacity: 0.95, dashArray: "8 6", interactive: false, fillColor: color, fillOpacity: 0.25 };
      const forma = geom === "poligono" ? L.polygon([], estilo) : L.polyline([], estilo);
      if (geom !== "punto") forma.addTo(grupo);
      const guia = L.polyline([], { color, weight: 2, opacity: 0.7, dashArray: "3 6", interactive: false }).addTo(grupo);
      let vertices = [];
      const contenedor = map.getContainer();
      const cursorAntes = contenedor.style.cursor;
      contenedor.style.cursor = "crosshair";
      const dblAntes = map.doubleClickZoom && map.doubleClickZoom.enabled();
      map.doubleClickZoom && map.doubleClickZoom.disable();

      const redibujar = () => {
        forma.setLatLngs(pts);
        for (const v of vertices) grupo.removeLayer(v);
        vertices = pts.map((p, i) => {
          const m = L.marker(p, {
            draggable: true,
            keyboard: false,
            zIndexOffset: 2000,
            icon: L.divIcon({ className: "sid-tm-vertice" + (i === 0 ? " primero" : ""), iconSize: [14, 14], iconAnchor: [7, 7] })
          });
          m.on("drag", (e) => { pts[i] = e.target.getLatLng(); forma.setLatLngs(pts); });
          m.on("click", (e) => {
            L.DomEvent.stop(e);
            // El 2º clic de un doble clic cae sobre el vértice que dejó el 1º: termina.
            // Clic en el primer vértice de un polígono = cerrarlo.
            if (!editando && esDoble(e)) terminar();
            else if (geom === "poligono" && i === 0 && pts.length >= 3) terminar();
          });
          m.on("dblclick", (e) => { L.DomEvent.stop(e); if (!editando) terminar(); });
          m.on("contextmenu", (e) => { L.DomEvent.stop(e); if (pts.length > 1) { pts.splice(i, 1); redibujar(); actualizarBarra(); } });
          return m.addTo(grupo);
        });
      };

      const minimo = geom === "poligono" ? 3 : geom === "linea" ? 2 : 1;
      const ayuda = geom === "punto"
        ? "Clic en la carta donde está el pueblo."
        : editando
          ? "Arrastrá los vértices · clic derecho sobre un vértice lo quita · clic en la carta agrega uno al final."
          : `Clic en la carta para ir marcando el ${NOM_GEOM[geom]} · doble clic o ✔ para terminar${geom === "poligono" ? " (o clic en el primer vértice)" : ""}.`;
      const b = barra(`
        <div class="sid-tm-barra-txt"><b>✏️ ${editando ? "Editando la forma" : "Dibujando " + NOM_GEOM[geom]}</b> · <span data-ayuda>${esc(ayuda)}</span> <span data-n></span></div>
        <div class="sid-tm-barra-btns">
          ${geom !== "punto" ? '<button type="button" data-a="atras" title="Quita el último vértice (tecla ⌫)">↶ Quitar último</button>' : ""}
          ${geom !== "punto" ? '<button type="button" data-a="ok" class="ok" title="Terminar (tecla Enter)">✔ Terminar</button>' : ""}
          <button type="button" data-a="no" title="Cancelar (tecla Esc)">✕ Cancelar</button>
        </div>`);
      const actualizarBarra = () => {
        const n = b.querySelector("[data-n]");
        if (n && geom !== "punto") n.textContent = `(${pts.length} punto${pts.length === 1 ? "" : "s"})`;
        const ok = b.querySelector('[data-a="ok"]');
        if (ok) ok.disabled = pts.length < minimo;
      };

      // Doble clic propio: no depende de que la carta reciba «dblclick» (el 2º clic suele caer
      // sobre el vértice recién puesto, o la carta tiene otra capa encima).
      let ultimoClic = { t: 0, x: -99, y: -99 };
      const esDoble = (e) => {
        const o = e && e.originalEvent;
        if (o && o.detail > 1) return true;
        const x = o ? o.clientX : -99, y = o ? o.clientY : -99;
        return Date.now() - ultimoClic.t < 500 && Math.abs(x - ultimoClic.x) < 10 && Math.abs(y - ultimoClic.y) < 10;
      };
      const enClic = (e) => {
        if (geom !== "punto" && !editando && pts.length && esDoble(e)) { terminar(); return; }
        const o = e.originalEvent;
        ultimoClic = { t: Date.now(), x: o ? o.clientX : -99, y: o ? o.clientY : -99 };
        pts.push(e.latlng);
        if (geom === "punto") { terminar(); return; }
        redibujar();
        actualizarBarra();
      };
      const enMover = (e) => {
        if (geom === "punto" || !pts.length || editando) return guia.setLatLngs([]);
        const ult = pts[pts.length - 1];
        guia.setLatLngs(geom === "poligono" && pts.length >= 2 ? [ult, e.latlng, pts[0]] : [ult, e.latlng]);
      };
      const enDoble = (e) => {
        if (e && e.originalEvent) L.DomEvent.stop(e);
        if (!editando) terminar();
      };
      const sinPopups = () => { try { map.closePopup(); } catch {} };
      const enTecla = (e) => {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "")) return;
        if (e.key === "Escape") { e.preventDefault(); cancelar(); }
        else if (e.key === "Enter") { e.preventDefault(); terminar(); }
        else if (e.key === "Backspace" && geom !== "punto") { e.preventDefault(); quitarUltimo(); }
      };
      const quitarUltimo = () => { if (pts.length) { pts.pop(); redibujar(); actualizarBarra(); } };

      map.on("click", enClic);
      map.on("mousemove", enMover);
      map.on("dblclick", enDoble);
      map.on("popupopen", sinPopups);
      document.addEventListener("keydown", enTecla, true);
      // Mientras se dibuja, TODO clic sobre la carta es un punto: también sobre una ficha, un
      // rótulo o un elemento de otro calco (si no, Leaflet se lo da a ese elemento y el punto
      // se pierde, o se abre su ventanita). Los vértices propios conservan su clic.
      const panel = map.getPane ? map.getPane("mapPane") : null;
      const clicNativo = (ev) => {
        const t = ev.target;
        if (!panel || !panel.contains(t) || (t.closest && t.closest(".sid-tm-vertice"))) return;
        ev.preventDefault();
        ev.stopPropagation();
        enClic({ latlng: map.mouseEventToLatLng(ev), originalEvent: ev });
      };
      document.addEventListener("click", clicNativo, true);
      // Respaldo: el doble clic nativo sobre la carta, aunque algo lo frene antes de Leaflet.
      const dobleNativo = (ev) => { if (geom !== "punto" && !editando && contenedor.contains(ev.target)) { ev.preventDefault(); ev.stopPropagation(); terminar(); } };
      document.addEventListener("dblclick", dobleNativo, true);

      let hecho = false;
      const limpiar = () => {
        map.off("click", enClic);
        map.off("mousemove", enMover);
        map.off("dblclick", enDoble);
        map.off("popupopen", sinPopups);
        document.removeEventListener("keydown", enTecla, true);
        document.removeEventListener("dblclick", dobleNativo, true);
        document.removeEventListener("click", clicNativo, true);
        try { map.removeLayer(grupo); } catch {}
        b.remove();
        contenedor.style.cursor = cursorAntes;
        if (dblAntes && map.doubleClickZoom) setTimeout(() => map.doubleClickZoom.enable(), 300);
      };
      const cerrar = (v) => { if (hecho) return; hecho = true; activo = null; limpiar(); resolve(v); };
      function terminar() {
        // Quitar puntos repetidos al final (doble clic sobre el mismo lugar).
        while (pts.length > 1 && map.latLngToContainerPoint(pts[pts.length - 1]).distanceTo(map.latLngToContainerPoint(pts[pts.length - 2])) < 4) pts.pop();
        if (pts.length < minimo) {
          const a = b.querySelector("[data-ayuda]");
          if (a) a.textContent = `Faltan puntos: un ${NOM_GEOM[geom]} necesita al menos ${minimo}.`;
          return;
        }
        cerrar(pts.map((p) => [Math.round(p.lng * 1e7) / 1e7, Math.round(p.lat * 1e7) / 1e7]));
      }
      function cancelar() { cerrar(null); }
      b.querySelector('[data-a="no"]').onclick = cancelar;
      const atras = b.querySelector('[data-a="atras"]');
      if (atras) atras.onclick = quitarUltimo;
      const ok = b.querySelector('[data-a="ok"]');
      if (ok) ok.onclick = terminar;
      activo = { limpiar: () => cerrar(null) };
      if (editando) redibujar();
      actualizarBarra();
    });
  }

  // ── Ventana: qué es (clasificación) y cómo se llama ────────────────────────
  function preguntar(destino, geom, previo) {
    return new Promise((resolve) => {
      const d = DESTINOS[destino];
      const grupos = d.tipos[geom] || [];
      const elegido = previo && previo.tipo ? previo.tipo : (grupos.flatMap((g) => g.items).find((t) => t.def) || grupos[0].items[0]).id;
      const conPunto = destino === "poblaciones" && geom === "poligono";
      const fondo = document.createElement("div");
      fondo.className = "sid-tm-modal";
      fondo.innerHTML = `
        <div class="sid-tm-caja" role="dialog" aria-label="Clasificar el trazo">
          <div class="sid-tm-tit">${d.icono} ${previo ? "Cambiar" : "Agregar a"} <b>${esc(d.nombre)}</b> · ${NOM_GEOM[geom]}<button type="button" data-x title="Cancelar">✕</button></div>
          <label class="sid-tm-campo">Nombre <input type="text" data-nom maxlength="80" placeholder="${destino === "poblaciones" ? "Ej.: Caserío Villa Nueva" : destino === "hidrografico" ? "Ej.: Río Grande" : "Ej.: Camino clandestino a la frontera"}" value="${esc(previo && previo.nombre || "")}"></label>
          <div class="sid-tm-sub">¿Qué es?</div>
          ${grupos.map((g) => `
            <fieldset class="sid-tm-grupo"><legend>${esc(g.grupo)}</legend>
              ${g.items.map((t) => `<label class="sid-tm-op"><input type="radio" name="sid-tm-tipo" value="${t.id}" ${t.id === elegido ? "checked" : ""}> ${esc(t.nom)}</label>`).join("")}
            </fieldset>`).join("")}
          ${conPunto ? `
            <fieldset class="sid-tm-grupo"><legend>📍 Centro poblado (para la población estimada y el ASCOPE)</legend>
              <select data-punto>
                <option value="">— Sin punto: sólo el área —</option>
                ${DESTINOS.poblaciones.tipos.punto[0].items.map((t) => `<option value="${t.id}" ${(previo ? previo.punto === t.id : t.def) ? "selected" : ""}>${esc(t.nom)}</option>`).join("")}
              </select>
            </fieldset>` : ""}
          <div class="sid-tm-pie">Se guarda con el ejercicio, no se borra al ⚡ Generar calcos y entra al análisis como cualquier elemento de ${esc(d.nombre)}.</div>
          <div class="sid-tm-acc"><button type="button" data-no>Cancelar</button><button type="button" data-si class="ok">✔ ${previo ? "Guardar" : "Agregar al calco"}</button></div>
        </div>`;
      const cerrar = (v) => { fondo.remove(); document.removeEventListener("keydown", tecla, true); resolve(v); };
      const tecla = (e) => { if (e.key === "Escape") { e.preventDefault(); cerrar(null); } };
      const si = () => {
        const tipo = (fondo.querySelector('input[name="sid-tm-tipo"]:checked') || {}).value;
        const sel = fondo.querySelector("[data-punto]");
        cerrar({ tipo, nombre: fondo.querySelector("[data-nom]").value.trim(), punto: sel ? sel.value : "" });
      };
      fondo.querySelector("[data-x]").onclick = () => cerrar(null);
      fondo.querySelector("[data-no]").onclick = () => cerrar(null);
      fondo.querySelector("[data-si]").onclick = si;
      fondo.querySelector("[data-nom]").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); si(); } });
      fondo.addEventListener("mousedown", (e) => { if (e.target === fondo) cerrar(null); });
      document.addEventListener("keydown", tecla, true);
      document.body.appendChild(fondo);
      setTimeout(() => fondo.querySelector("[data-nom]").focus(), 30);
    });
  }

  function centroide(pts) {
    // Centroide del anillo (fórmula del área); si degenera, el promedio.
    let a = 0, x = 0, y = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      const k = x1 * y2 - x2 * y1;
      a += k; x += (x1 + x2) * k; y += (y1 + y2) * k;
    }
    if (Math.abs(a) < 1e-14) return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
    return [x / (3 * a), y / (3 * a)];
  }

  function featuresDe(destino, geom, resp, pts, trazoId) {
    const tipo = tipoPorId(destino, resp.tipo);
    if (!tipo) return [];
    const out = [armarFeature(destino, tipo, resp.nombre, geom, pts, trazoId)];
    if (destino === "poblaciones" && geom === "poligono" && resp.punto) {
      const tp = tipoPorId("poblaciones", resp.punto);
      if (tp) out.push(armarFeature("poblaciones", tp, resp.nombre, "punto", [centroide(pts)], trazoId, { _sideceme_parte: "punto" }));
    }
    return out;
  }

  // ── Acciones ───────────────────────────────────────────────────────────────
  const colorDe = (destino) => destino === "comunicaciones" ? "#ff2222" : destino === "hidrografico" ? "#33ddff" : "#fc02ff";

  async function nuevo(destino, geom) {
    const pts = await dibujar(geom, colorDe(destino));
    if (!pts) return;
    const resp = await preguntar(destino, geom, null);
    if (!resp || !resp.tipo) return;
    const id = nuevoId();
    if (aplicar(destino, null, featuresDe(destino, geom, resp, pts, id))) aviso(`✅ ${DESTINOS[destino].icono} Agregado a ${DESTINOS[destino].nombre}: ${resp.nombre || tipoPorId(destino, resp.tipo).nom}.`);
  }

  const geomDe = (f) => f.geometry.type === "Point" ? "punto" : f.geometry.type === "Polygon" ? "poligono" : "linea";
  const ptsDe = (f) => {
    const g = f.geometry;
    if (g.type === "Point") return [g.coordinates];
    if (g.type === "LineString") return g.coordinates;
    const r = g.coordinates[0].slice();
    if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r.pop();
    return r;
  };
  const respDe = (t) => {
    const p = t.principal.properties;
    const punto = t.feats.find((f) => f !== t.principal && f.properties._sideceme_parte === "punto");
    return { tipo: p._sideceme_tipo, nombre: p.name || "", punto: punto ? punto.properties._sideceme_tipo : "" };
  };

  async function editarForma(destino, trazoId) {
    const t = trazosDe(destino).find((x) => x.id === trazoId);
    if (!t) return;
    const geom = geomDe(t.principal);
    ver(destino, trazoId, false);
    const pts = await dibujar(geom, colorDe(destino), ptsDe(t.principal));
    if (!pts) return;
    aplicar(destino, trazoId, featuresDe(destino, geom, respDe(t), pts, trazoId));
    aviso("✅ Forma actualizada.");
  }

  async function editarDatos(destino, trazoId) {
    const t = trazosDe(destino).find((x) => x.id === trazoId);
    if (!t) return;
    const geom = geomDe(t.principal);
    const resp = await preguntar(destino, geom, respDe(t));
    if (!resp || !resp.tipo) return;
    aplicar(destino, trazoId, featuresDe(destino, geom, resp, ptsDe(t.principal), trazoId));
    aviso("✅ Datos actualizados.");
  }

  function borrar(destino, trazoId) {
    const t = trazosDe(destino).find((x) => x.id === trazoId);
    if (!t) return;
    const p = t.principal.properties;
    if (!window.confirm(`¿Borrar «${p.Nombre || p.Tipo}» del calco de ${DESTINOS[destino].nombre}?`)) return;
    aplicar(destino, trazoId, []);
    aviso("🗑 Trazo borrado.");
  }

  function ver(destino, trazoId, resaltar = true) {
    const L = window.L, map = mapa();
    const t = trazosDe(destino).find((x) => x.id === trazoId);
    if (!L || !map || !t) return;
    const capa = L.geoJSON({ type: "FeatureCollection", features: t.feats.map((f) => ({ type: "Feature", geometry: f.geometry, properties: {} })) });
    const bb = capa.getBounds();
    if (bb.isValid()) {
      const unPunto = bb.getNorthEast().equals(bb.getSouthWest());
      unPunto ? map.setView(bb.getCenter(), Math.max(map.getZoom(), 15)) : map.fitBounds(bb, { padding: [80, 80], maxZoom: 17 });
    }
    if (!resaltar) return;
    const halo = L.geoJSON(capa.toGeoJSON(), {
      style: { color: "#ffffff", weight: 9, opacity: 0.85, fillOpacity: 0.1, interactive: false },
      pointToLayer: (_f, ll) => L.circleMarker(ll, { radius: 14, color: "#fff", weight: 3, fillOpacity: 0, interactive: false })
    }).addTo(map);
    setTimeout(() => { try { map.removeLayer(halo); } catch {} }, 1600);
  }

  function aviso(txt) {
    const h = hook();
    h && h.setEstado && h.setEstado(txt);
    h && h.setError && h.setError("");
  }

  // ── Panel dentro de la fila del calco ──────────────────────────────────────
  const plegados = { comunicaciones: true, hidrografico: true, poblaciones: true };

  function htmlPanel(destino) {
    const d = DESTINOS[destino];
    const lista = trazosDe(destino);
    const filas = lista.map((t) => {
      const p = t.principal.properties;
      const ico = t.principal.geometry.type === "Point" ? "📍" : t.principal.geometry.type === "Polygon" ? "▰" : (p.Clandestino ? "╫" : "〰");
      return `<div class="sid-tm-item" data-id="${esc(t.id)}">
        <span class="sid-tm-item-nom" title="${esc(p.Tipo)}">${ico} ${esc(p.Nombre || p.Tipo)}${p.Clandestino ? ' <em class="sid-tm-clnd">clandestino</em>' : ""}</span>
        <span class="sid-tm-item-btns">
          <button type="button" data-a="ver" title="Ubicar en la carta">🎯</button>
          <button type="button" data-a="forma" title="Mover o corregir los vértices">✥</button>
          <button type="button" data-a="datos" title="Cambiar nombre o clasificación">✎</button>
          <button type="button" data-a="borrar" title="Borrar este trazo">🗑</button>
        </span></div>`;
    }).join("");
    return `
      <div class="sid-tm-btns">
        ${d.herramientas.map((h) => `<button type="button" class="sid-tm-dib" data-a="nuevo" data-geom="${h.geom}" title="${esc(h.ayuda)} Se agrega sólo a ${esc(d.nombre)}.">${esc(h.txt)}</button>`).join("")}
        ${lista.length ? `<button type="button" class="sid-tm-cuenta" data-a="plegar" title="Ver los trazos a mano de este calco">${plegados[destino] ? "▸" : "▾"} ${lista.length} a mano</button>` : ""}
      </div>
      ${lista.length && !plegados[destino] ? `<div class="sid-tm-lista">${filas}</div>` : ""}`;
  }

  function firma(destino) {
    return trazosDe(destino).map((t) => t.id + ":" + (t.principal.properties.Nombre || "") + ":" + t.principal.properties._sideceme_tipo + ":" + JSON.stringify(t.principal.geometry.coordinates).length).join("|") + "#" + plegados[destino];
  }

  function enlazar(panel, destino) {
    panel.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-a]");
      if (!b) return;
      e.stopPropagation();
      const a = b.getAttribute("data-a");
      const id = b.closest("[data-id]") && b.closest("[data-id]").getAttribute("data-id");
      if (a === "nuevo") nuevo(destino, b.getAttribute("data-geom"));
      else if (a === "plegar") { plegados[destino] = !plegados[destino]; refrescar(true); }
      else if (a === "ver") ver(destino, id);
      else if (a === "forma") editarForma(destino, id);
      else if (a === "datos") editarDatos(destino, id);
      else if (a === "borrar") borrar(destino, id);
    });
  }

  function refrescar(forzar) {
    for (const fila of document.querySelectorAll(".bloque-ver .ver-fila")) {
      const nom = (fila.querySelector(".ver-nom") || {}).textContent || "";
      const destino = Object.keys(DESTINOS).find((k) => DESTINOS[k].fila.test(nom));
      if (!destino) continue;
      let panel = fila.querySelector(":scope > .sid-tm");
      if (!panel) {
        panel = document.createElement("div");
        panel.className = "sid-tm";
        panel.setAttribute("data-destino", destino);
        enlazar(panel, destino);
        fila.appendChild(panel);
      } else if (panel !== fila.lastElementChild) {
        fila.appendChild(panel); // React agregó el control de grosor después: el panel va al final
      }
      const f = firma(destino);
      if (forzar || panel.__firma !== f) { panel.__firma = f; panel.innerHTML = htmlPanel(destino); }
    }
  }

  let pendiente = false;
  const programar = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; try { refrescar(false); } catch (e) { console.warn("trazos-manuales:", e); } });
  };

  function estilos() {
    if (document.getElementById("sid-tm-css")) return;
    const s = document.createElement("style");
    s.id = "sid-tm-css";
    s.textContent = `
      .sid-tm{flex:1 0 calc(100% - 10px);max-width:calc(100% - 10px);box-sizing:border-box;min-width:0;margin:0 0 3px 10px;padding:4px 6px 5px 8px;border:1px solid rgba(61,225,245,.35);border-top:0;border-radius:0 0 6px 6px;background:rgba(61,225,245,.06);font-size:11.5px;color:#cfe3ee}
      .sid-tm-btns{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
      .sid-tm button{font:600 11.5px Arial,Helvetica,sans-serif;cursor:pointer;border-radius:5px}
      .sid-tm-dib{background:rgba(61,225,245,.16);color:#e9fbff;border:1px solid rgba(61,225,245,.6);padding:3px 8px}
      .sid-tm-dib:hover{background:rgba(61,225,245,.32)}
      .sid-tm-cuenta{background:none;border:1px dashed rgba(255,255,255,.3);color:#cfe3ee;padding:3px 7px;margin-left:auto}
      .sid-tm-lista{margin-top:4px;display:flex;flex-direction:column;gap:2px}
      .sid-tm-item{min-width:0;overflow:hidden;display:flex;align-items:center;gap:4px;padding:2px 4px;border-radius:4px;background:rgba(0,0,0,.25)}
      .sid-tm-item-nom{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .sid-tm-item-btns{flex-shrink:0;display:flex;gap:2px}
      .sid-tm-item-btns button{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);color:#fff;padding:1px 5px}
      .sid-tm-item-btns button:hover{background:rgba(255,255,255,.2)}
      .sid-tm-clnd{font-style:normal;color:#ff6b6b;font-size:10.5px;border:1px solid #ff6b6b;border-radius:3px;padding:0 3px;margin-left:3px}
      .sid-tm-barra{position:fixed;left:50%;top:86px;transform:translateX(-50%);z-index:60000;display:flex;flex-wrap:wrap;align-items:center;gap:10px;max-width:min(860px,94vw);padding:9px 12px;border-radius:10px;background:rgba(10,18,28,.94);border:1px solid rgba(61,225,245,.7);box-shadow:0 10px 30px rgba(0,0,0,.5);color:#e9f4fb;font:13px Arial,Helvetica,sans-serif}
      .sid-tm-barra-txt{flex:1;min-width:240px}
      .sid-tm-barra-btns{display:flex;gap:6px}
      .sid-tm-barra button,.sid-tm-acc button{font:700 12.5px Arial,Helvetica,sans-serif;padding:6px 11px;border-radius:7px;border:1px solid rgba(255,255,255,.25);background:#283548;color:#e9f4fb;cursor:pointer}
      .sid-tm-barra button.ok,.sid-tm-acc button.ok{background:#0fb5c9;border-color:#3de1f5;color:#00171c}
      .sid-tm-barra button:disabled{opacity:.45;cursor:not-allowed}
      .sid-tm-vertice{background:#fff;border:2px solid #0b1520;border-radius:50%;box-shadow:0 0 0 2px rgba(61,225,245,.8);cursor:move}
      .sid-tm-vertice.primero{background:#3de1f5}
      .sid-tm-modal{position:fixed;inset:0;z-index:60001;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Arial,Helvetica,sans-serif}
      .sid-tm-caja{width:min(520px,94vw);max-height:90vh;overflow:auto;background:#151d2a;color:#eaf1f8;border:1px solid #3e536d;border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.55);padding:14px 16px}
      .sid-tm-tit{display:flex;align-items:center;gap:6px;font-size:16px;margin-bottom:10px}
      .sid-tm-tit button{margin-left:auto;background:none;border:0;color:#aebbd0;font-size:18px;cursor:pointer}
      .sid-tm-campo{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#aebbd0;margin-bottom:8px}
      .sid-tm-campo input{background:#0d141e;color:#fff;border:1px solid #40516a;border-radius:6px;padding:7px 8px;font-size:13.5px}
      .sid-tm-sub{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8ea3ba;margin:6px 0 4px}
      .sid-tm-grupo{border:1px solid #33465e;border-radius:8px;padding:6px 10px 8px;margin:0 0 8px}
      .sid-tm-grupo legend{font-size:12px;font-weight:700;color:#fecc66;padding:0 4px}
      .sid-tm-op{display:flex;align-items:center;gap:7px;font-size:13px;padding:3px 0;cursor:pointer}
      .sid-tm-grupo select{width:100%;background:#0d141e;color:#fff;border:1px solid #40516a;border-radius:6px;padding:6px;font-size:13px}
      .sid-tm-pie{font-size:11.5px;color:#9fb2c6;line-height:1.4;margin:4px 0 10px}
      .sid-tm-acc{display:flex;gap:8px;justify-content:flex-end}`;
    document.head.appendChild(s);
  }

  const arrancar = () => {
    estilos();
    refrescar(true);
    new MutationObserver((muts) => {
      // Ignorar los cambios que hace este mismo panel.
      for (const m of muts) {
        const t = m.target;
        if (t && t.closest && (t.closest(".sid-tm") || t.closest(".leaflet-container") || t.closest(".sid-tm-barra") || t.closest(".sid-tm-modal"))) continue;
        programar();
        return;
      }
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", arrancar, { once: true }) : arrancar();

  window.SIDTrazosManuales = { version: 1, DESTINOS, trazosDe, nuevo, aplicar, featuresDe, refrescar };
})();
