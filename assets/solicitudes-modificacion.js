/* La aprobación de una modificación incluye sus valores finales y su auditoría. */
(function () {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.abrirModificacionSolicitud = async function (solId) {
    if (document.getElementById('sol-modificacion')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'sol-modificacion';
    dialog.setAttribute('aria-labelledby', 'sol-mod-titulo');
    dialog.style.cssText = 'width:min(620px,calc(100vw - 32px));max-height:90vh;box-sizing:border-box;overflow:auto;background:#101c29;color:#e9f2fa;border:1px solid #56758d;border-radius:14px;padding:24px';
    dialog.innerHTML = '<h2 id="sol-mod-titulo">Modificar y aprobar solicitud</h2><p>Cargando sanción y reglamento…</p><button type="button" data-cerrar>Cerrar</button>';
    let guardando = false;
    dialog.addEventListener('cancel', e => { if (guardando) e.preventDefault(); });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.querySelector('[data-cerrar]').onclick = () => dialog.close();
    document.body.appendChild(dialog);
    dialog.showModal();
    try {
      const data = await _solOps('preparar_modificacion', {id: solId});
      if (!dialog.isConnected) return;
      const s = data.sancion, reglas = data.reglamentos || [], solicitud = data.solicitud;
      dialog.innerHTML = `<style>
        #sol-modificacion::backdrop{background:rgba(0,0,0,.7)}
        #sol-modificacion label{display:block;margin:16px 0 6px;font-weight:600}
        #sol-modificacion input,#sol-modificacion select,#sol-modificacion textarea{display:block;width:100%;box-sizing:border-box;padding:10px;font:inherit;background:#fff;color:#182330;border:1px solid #869cac;border-radius:6px}
        #sol-modificacion select{white-space:normal;max-width:100%}
        #sol-modificacion button{padding:10px 16px;margin:8px 8px 0 0;border:1px solid #7394aa;border-radius:8px;cursor:pointer}
        #sol-modificacion [type=submit]{background:#246448;color:white}
        #sol-modificacion p{overflow-wrap:anywhere;line-height:1.5}
      </style><h2 id="sol-mod-titulo">Modificar y aprobar solicitud #${esc(solId)}</h2>
      <p><strong>${esc(s.cursante_nombre)}</strong><br>Folio ${esc(s.folio)}<br>Actual: ${esc(s.falta_descripcion)} <strong>−${esc(s.puntos_aplicados)} puntos</strong></p>
      <p>Solicitud: ${esc(solicitud.detalle_cursante || solicitud.detalle_profesor || solicitud.comentario_disciplina || '—')}</p>
      <form>
        <label for="sol-mod-buscar">Buscar falta en el reglamento</label><input id="sol-mod-buscar" type="search" placeholder="Escribí parte de la descripción">
        <label for="sol-mod-falta">Falta que quedará aplicada</label><select id="sol-mod-falta" required></select>
        <p data-descripcion></p>
        <label for="sol-mod-puntos">Puntos finales</label><select id="sol-mod-puntos" required></select>
        <label for="sol-mod-razon">Fundamento de la resolución</label><textarea id="sol-mod-razon" rows="4" minlength="5" maxlength="2000" required></textarea>
        <p data-resumen aria-live="polite"></p><p data-error role="alert" style="color:#ffb6b6"></p>
        <button type="submit">Aplicar modificación y aprobar</button><button type="button" data-cerrar>Cancelar</button>
      </form>`;
      const form = dialog.querySelector('form'), select = dialog.querySelector('#sol-mod-falta');
      const puntos = dialog.querySelector('#sol-mod-puntos'), buscar = dialog.querySelector('#sol-mod-buscar');
      const razon = dialog.querySelector('#sol-mod-razon'), error = dialog.querySelector('[data-error]');
      const submit = form.querySelector('[type=submit]'), cerrar = dialog.querySelector('[data-cerrar]');
      const normal = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const resumen = () => { dialog.querySelector('[data-resumen]').textContent = puntos.value ? `Al aprobar, la papeleta pasará de ${s.puntos_aplicados} a ${puntos.value} puntos. El acumulado se recalculará y el cambio quedará registrado.` : ''; };
      const elegir = () => {
        const r = reglas.find(x => x.id === select.value);
        dialog.querySelector('[data-descripcion]').textContent = r?.descripcion || '';
        puntos.replaceChildren();
        if (r) {
          puntos.add(new Option(`${r.puntos} puntos — sin reincidencia`, String(r.puntos)));
          puntos.add(new Option(`${r.puntos * 2} puntos — primera reincidencia`, String(r.puntos * 2)));
        }
        resumen();
      };
      const filtrar = () => {
        const anterior = select.value;
        select.replaceChildren(new Option('Seleccioná la falta final', ''));
        reglas.filter(r => normal(`${r.categoria} ${r.descripcion}`).includes(normal(buscar.value))).forEach(r => {
          select.add(new Option(`Art. ${r.articulo} · ${r.puntos} pts · ${r.descripcion}`, r.id));
        });
        if ([...select.options].some(o => o.value === anterior)) select.value = anterior;
        const pts = puntos.value;
        elegir();
        if (select.value === anterior && [...puntos.options].some(o => o.value === pts)) puntos.value = pts;
        resumen();
      };
      buscar.oninput = filtrar; select.onchange = elegir; puntos.onchange = resumen;
      cerrar.onclick = () => { if (!guardando) dialog.close(); };
      filtrar();
      form.onsubmit = async event => {
        event.preventDefault();
        if (guardando || !form.reportValidity()) return;
        error.textContent = '';
        if (razon.value.trim().length < 5) { error.textContent = 'Escribí el fundamento de la resolución.'; return; }
        if (select.value === s.falta_id && Number(puntos.value) === s.puntos_aplicados) { error.textContent = 'La falta y los puntos siguen iguales. Seleccioná la corrección.'; return; }
        const payload = {id:solId, decision:'modificar', razon:razon.value.trim(), modificacion:{
          falta_id:select.value, puntos_aplicados:Number(puntos.value),
          anterior:{falta_id:s.falta_id ?? null,puntos_aplicados:s.puntos_aplicados,modificada_en:s.modificada_en ?? null}
        }};
        guardando = true;
        [...form.elements].forEach(el => { el.disabled = true; });
        submit.textContent = 'Guardando modificación…';
        try {
          const result = await _solOps('resolver', payload);
          if (!result.sancion) throw new Error('No se recibió la sanción actualizada. Actualizá la página para verificar el resultado.');
          const local = discData.sanciones.find(x => String(x.id) === String(s.id));
          if (local) Object.assign(local, result.sancion);
          _reconstruirIndicesDisc();
          _invalidarCacheDisc();
          if (typeof _marcarSancionEditada === 'function') _marcarSancionEditada(s.id);
          dialog.close();
          alert(`Solicitud aprobada y sanción modificada: ${result.sancion.puntos_aplicados} puntos.`);
          goAnulaciones();
        } catch (e) {
          error.textContent = e.message || String(e);
        } finally {
          guardando = false;
          [...form.elements].forEach(el => { el.disabled = false; });
          submit.textContent = 'Aplicar modificación y aprobar';
        }
      };
      buscar.focus();
    } catch (e) {
      dialog.querySelector('p').textContent = e.message || String(e);
    }
  };
})();
