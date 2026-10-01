import { nombreUnidad, unidadesDocumentales } from './modelo.js';

export default function InicioEjercicio({ react: R, aporte, children }) {
  const h = R.createElement;
  const unidades = R.useMemo(() => unidadesDocumentales(aporte.documentos), [aporte.documentos]);
  const [elegida, setElegida] = R.useState('');
  const [manual, setManual] = R.useState('');
  const [error, setError] = R.useState('');
  const actual = aporte.unidadConsiderada;
  R.useEffect(() => {
    const encontrado = unidades.find(u => nombreUnidad(u.nombre) === nombreUnidad(actual?.nombre));
    setElegida(encontrado ? encontrado.nombre : actual?.nombre ? 'manual' : '');
    setManual(actual?.nombre || '');
    setError('');
  }, [actual?.nombre, aporte.pasoUnidad, unidades]);
  const continuar = () => {
    if (aporte.cargandoDocumentos) return;
    aporte.onPasoUnidad(true);
  };
  const confirmar = () => {
    const seleccionado = elegida === 'manual' ? { nombre: nombreUnidad(manual), fuente: 'REGISTRADA POR EL USUARIO' } : unidades.find(u => u.nombre === elegida);
    if (!seleccionado?.nombre) return setError('SELECCIONE UNA UNIDAD O REGÍSTRELA MANUALMENTE.');
    aporte.onElegirUnidad(seleccionado);
    setError('');
    aporte.onPasoUnidad(false);
  };
  return h('section', { className: 'sid-inicio-pasos' },
    h('p', { className: 'sid-inicio-etapa' }, aporte.pasoUnidad ? 'PASO 2 DE 2 · IDENTIDAD DEL EJERCICIO' : 'PASO 1 DE 2 · DOCUMENTOS E IDEA DEL AUTOR'),
    actual?.confirmada && h('p', { className: 'sid-inicio-confirmada' }, 'UNIDAD CONSIDERADA: ', h('strong', null, actual.nombre)),
    aporte.pasoUnidad ? h(R.Fragment, null,
      h('h2', null, '¿QUIÉN SOY YO / QUÉ UNIDAD REPRESENTO?'),
      h('p', null, 'SELECCIONE LA UNIDAD CONSIDERADA. ESTE DATO SE GUARDA CON EL EJERCICIO Y SE INCORPORA A LOS DOCUMENTOS Y AL EXPEDIENTE DE IA.'),
      h('label', null, 'UNIDADES IDENTIFICADAS EN LOS DOCUMENTOS', h('select', { value: elegida, onChange: e => setElegida(e.target.value), disabled: aporte.finalizado, 'aria-label': 'UNIDAD CONSIDERADA' },
        h('option', { value: '' }, 'SELECCIONE SU UNIDAD'),
        ...unidades.map(u => h('option', { value: u.nombre, key: u.nombre }, u.nombre)),
        h('option', { value: 'manual' }, 'MI UNIDAD NO APARECE · REGISTRAR MANUALMENTE'))),
      !unidades.length && h('p', { role: 'status' }, 'NO SE IDENTIFICARON UNIDADES EN EL TEXTO EXTRAÍDO. SI ES UNA IMAGEN O UN DOCUMENTO ESCANEADO, REGISTRE SU UNIDAD MANUALMENTE.'),
      elegida === 'manual' && h('label', null, 'DESIGNACIÓN DE MI UNIDAD', h('input', { value: manual, onChange: e => setManual(e.target.value.toUpperCase()), 'aria-label': 'DESIGNACIÓN DE MI UNIDAD', disabled: aporte.finalizado })),
      elegida !== 'manual' && unidades.find(u => u.nombre === elegida) && h('p', null, 'FUENTE: ', unidades.find(u => u.nombre === elegida).fuente),
      error && h('p', { role: 'alert' }, error),
      h('div', { className: 'sid-inicio-acciones' }, h('button', { onClick: () => aporte.onPasoUnidad(false) }, 'ANTERIOR · DOCUMENTOS'), h('button', { onClick: confirmar, disabled: aporte.finalizado }, 'CONFIRMAR MI UNIDAD Y CONTINUAR'))
    ) : h(R.Fragment, null, children,
      h('button', { className: 'sid-inicio-siguiente', onClick: continuar, disabled: aporte.cargandoDocumentos || aporte.finalizado }, aporte.cargandoDocumentos ? 'LEYENDO DOCUMENTOS…' : actual?.confirmada ? 'CAMBIAR / REVISAR MI UNIDAD' : 'SIGUIENTE · IDENTIFICAR MI UNIDAD'),
      !actual?.confirmada && h('p', { role: 'status' }, 'ES OBLIGATORIO CONFIRMAR SU UNIDAD ANTES DE PREPARAR EL EXPEDIENTE O LOS PROMPTS DE IA.')));
}
