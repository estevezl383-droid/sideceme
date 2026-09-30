import { REFERENCIAS, temaEstudio, generarPrompt, leerRespuesta, textoFicha } from './modelo.js';

// React se inyecta desde la Mesa: una sola instancia y sin un nuevo build.
export default function FichaInstalacion({ react: R, unidades = [], documentos = [], ejercicio = '', info: buscarInfo, onEditar, onAgregarDocumentos }) {
  const h = R.createElement;
  const [id, setId] = R.useState(null);
  const [minimo, setMinimo] = R.useState(false);
  R.useEffect(() => {
    const abrir = e => { setId(e.detail?.id ?? null); setMinimo(false); };
    window.addEventListener('sideceme:ficha-instalacion', abrir);
    return () => window.removeEventListener('sideceme:ficha-instalacion', abrir);
  }, []);
  R.useEffect(() => { setId(null); }, [ejercicio]);
  const instaladas = unidades.filter(u => u.tipo === 'instalacion');
  const unidad = instaladas.find(u => u.id === id);
  if (!unidad) return null;
  return h('section', { className: 'sid-fi' + (minimo ? ' sid-fi-min' : ''), 'aria-label': 'Ficha documental de instalación' },
    h('header', { className: 'sid-fi-cab' },
      h('div', null, h('strong', null, 'FICHA DOCUMENTAL · INSTALACIÓN'),
        h('select', { 'aria-label': 'Instalación de la ficha', value: String(id), onChange: e => { const u = instaladas.find(u => String(u.id) === e.target.value); if (u) setId(u.id); } },
          ...instaladas.map(u => h('option', { key: u.id, value: String(u.id) }, u.designacion || buscarInfo(u.instalacion)?.nom || 'Instalación')))),
      h('div', { className: 'sid-fi-acciones' },
        h('button', { onClick: () => setMinimo(!minimo), 'aria-label': minimo ? 'Ampliar ficha' : 'Minimizar ficha' }, minimo ? 'AMPLIAR' : 'MINIMIZAR'),
        h('button', { onClick: () => setId(null), 'aria-label': 'Cerrar ficha documental' }, '✕'))),
    !minimo && h(Editor, { key: `${ejercicio}:${unidad.id}`, react: R, unidad, info: buscarInfo(unidad.instalacion) || {}, documentos, onEditar, onAgregarDocumentos }));
}

function Editor({ react: R, unidad, info, documentos, onEditar, onAgregarDocumentos }) {
  const h = R.createElement;
  const [ficha, setFicha] = R.useState(() => unidad.fichaDocumental || {});
  const [prompt, setPrompt] = R.useState('');
  const [aviso, setAviso] = R.useState('');
  const [error, setError] = R.useState('');
  const [ocupado, setOcupado] = R.useState(false);
  const [doc, setDoc] = R.useState('');
  const actual = R.useRef(ficha);
  const editarRef = R.useRef(onEditar);
  editarRef.current = onEditar;
  const pendiente = R.useRef(false);
  const aplicar = nuevo => { actual.current = nuevo; pendiente.current = true; setFicha(nuevo); setAviso('Cambios pendientes de guardado.'); setError(''); };
  R.useEffect(() => {
    if (!pendiente.current && unidad.fichaDocumental !== actual.current) {
      actual.current = unidad.fichaDocumental || {};
      setFicha(actual.current);
      setPrompt('');
    }
  }, [unidad.fichaDocumental]);
  const guardar = () => {
    if (pendiente.current) { editarRef.current?.(unidad.id, { fichaDocumental: actual.current }); pendiente.current = false; }
    setAviso('Ficha incorporada al ejercicio. Usa GUARDAR en Ejercicio para conservarla.');
  };
  R.useEffect(() => {
    if (!pendiente.current) return;
    const timer = setTimeout(() => { editarRef.current?.(unidad.id, { fichaDocumental: actual.current }); pendiente.current = false; setAviso('Ficha incorporada al ejercicio.'); }, 800);
    return () => clearTimeout(timer);
  }, [ficha, unidad.id]);
  R.useEffect(() => () => { if (pendiente.current) editarRef.current?.(unidad.id, { fichaDocumental: actual.current }); }, [unidad.id]);

  const cambiar = (campo, valor) => { aplicar({ ...actual.current, [campo]: valor }); if (['observaciones', 'indicaciones', 'fragmentos'].includes(campo)) setPrompt(''); };
  const textarea = (label, campo, placeholder, filas = 3) => h('label', { className: 'sid-fi-campo' }, label,
    h('textarea', { 'aria-label': label, value: ficha[campo] || '', rows: filas, maxLength: campo === 'entradaIA' ? 200000 : 100000, placeholder, onChange: e => cambiar(campo, e.target.value) }));
  const copiar = async (texto, mensaje) => {
    try { await navigator.clipboard.writeText(texto); setAviso(mensaje); setError(''); }
    catch { setError('No se pudo copiar. Selecciona el texto y usa Copiar en tu navegador.'); }
  };
  const importar = () => {
    try {
      const resultadoIA = leerRespuesta(actual.current.entradaIA || '', unidad.id, actual.current.formato || 'json');
      aplicar({ ...actual.current, resultadoIA, revisadoEn: null, importadoEn: new Date().toISOString() });
      setAviso('Respuesta proyectada. Pendiente de revisión con las fuentes.');
    } catch (e) { setError(e.message); }
  };
  const agregar = async e => {
    const files = Array.from(e.target.files || []); e.target.value = '';
    if (!files.length) return;
    setOcupado(true); setError('');
    try { await onAgregarDocumentos?.(files); setAviso('Documento añadido. Selecciónalo para consultar el texto extraído.'); }
    catch (e) { setError('No se pudo leer el documento: ' + e.message); }
    finally { setOcupado(false); }
  };
  const documento = documentos[Number(doc)];
  const resultado = ficha.resultadoIA;
  const lista = (titulo, valores) => h('div', { className: 'sid-fi-bloque' }, h('h4', null, titulo),
    valores?.length ? h('ul', null, ...valores.map((x, i) => h('li', { key: i }, x))) : h('p', { className: 'sid-fi-suave' }, 'Sin información aportada.'));

  return h('div', { className: 'sid-fi-cuerpo' },
    h('div', { className: 'sid-fi-col' },
      h('dl', { className: 'sid-fi-datos' },
        h('dt', null, 'TIPO'), h('dd', null, info.nom || unidad.instalacion || 'Sin identificar'),
        h('dt', null, 'ÁREA'), h('dd', null, unidad.areaLog || 'Sin área registrada'),
        h('dt', null, 'CLASES DEL CATÁLOGO'), h('dd', null, info.clases?.join(', ') || 'No aplica / no registradas')),
      h('p', { className: 'sid-fi-tema' }, temaEstudio(info)),
      h('details', null, h('summary', null, 'REFERENCIAS DOCUMENTALES REVISADAS'),
        ...REFERENCIAS.map(r => h('div', { key: r.documento, className: 'sid-fi-bloque' }, h('b', null, r.documento), h('p', { className: 'sid-fi-suave' }, r.referencia), h('p', null, r.contenido))),
        h('p', { className: 'sid-fi-suave' }, 'Estas síntesis generales no acreditan dotaciones ni funciones específicas de la instalación seleccionada.')),
      h('details', null, h('summary', null, 'DOCUMENTOS Y FRAGMENTOS PARA ESTUDIAR'),
        h('label', { className: 'sid-fi-campo' }, ocupado ? 'LEYENDO DOCUMENTO…' : 'ADJUNTAR DOCUMENTO AL EJERCICIO',
          h('input', { type: 'file', multiple: true, accept: '.pdf,.docx,.txt,.md', disabled: ocupado, onChange: agregar })),
        h('p', { className: 'sid-fi-suave' }, 'Para archivos DOC antiguos, guarda una copia como DOCX o PDF. Los documentos adjuntos a este chat deben cargarse también en el ejercicio.'),
        h('label', { className: 'sid-fi-campo' }, 'CONSULTAR TEXTO EXTRAÍDO',
          h('select', { 'aria-label': 'CONSULTAR TEXTO EXTRAÍDO', value: doc, onChange: e => setDoc(e.target.value) }, h('option', { value: '' }, 'Selecciona un documento'),
            ...documentos.map((d, i) => h('option', { key: i, value: String(i) }, d.nombre || 'Documento')))),
        doc !== '' && h('div', null,
          h('p', { className: 'sid-fi-suave' }, documento?.truncado ? 'La extracción está truncada. Consulta el original para páginas no incluidas.' : 'Selecciona un fragmento relevante y cópialo en el campo de abajo, indicando documento y página o apartado.'),
          h('textarea', { readOnly: true, rows: 5, 'aria-label': 'Texto extraído del documento', value: documento?.texto || documento?.aviso || 'Sin texto extraíble. Aporta una transcripción con su referencia.' })),
        textarea('FRAGMENTOS SELECCIONADOS Y REFERENCIAS', 'fragmentos', 'Documento, página o apartado y fragmento relevante.')),
      textarea('OBSERVACIONES DEL CURSANTE', 'observaciones', 'Escribe tus observaciones sobre esta instalación.'),
      h('details', { open: true }, h('summary', null, 'TRABAJO CON IA'),
        h('p', { className: 'sid-fi-suave' }, 'Genera y copia el prompt, úsalo en la IA que elijas y pega su respuesta. La aplicación no consulta una IA automáticamente.'),
        textarea('INDICACIÓN ADICIONAL DE ESTUDIO', 'indicaciones', '¿Qué concepto o diferencia documental quieres comprender?'),
        h('div', { className: 'sid-fi-acciones' },
          h('button', { className: 'sid-fi-pri', onClick: () => { guardar(); setPrompt(generarPrompt(unidad, info, actual.current)); setAviso('Prompt preparado para esta instalación.'); } }, 'GENERAR PROMPT'),
          h('button', { disabled: !prompt, onClick: () => copiar(prompt, 'Prompt copiado.') }, 'COPIAR PROMPT')),
        prompt && h('textarea', { rows: 5, value: prompt, readOnly: true, 'aria-label': 'Prompt documental generado' }),
        h('label', { className: 'sid-fi-campo' }, 'FORMATO DE LA RESPUESTA', h('select', { 'aria-label': 'FORMATO DE LA RESPUESTA', value: ficha.formato || 'json', onChange: e => cambiar('formato', e.target.value) },
          h('option', { value: 'json' }, 'JSON del prompt'), h('option', { value: 'texto' }, 'Texto libre (sin campos estructurados)'))),
        textarea('PEGAR RESPUESTA DE LA IA', 'entradaIA', 'Pega aquí la respuesta completa.', 5),
        h('button', { className: 'sid-fi-pri', onClick: importar }, 'PROYECTAR RESPUESTA EN LA FICHA')),
      h('div', { className: 'sid-fi-acciones' }, h('button', { onClick: guardar }, 'GUARDAR FICHA'),
        h('button', { onClick: () => copiar(textoFicha(unidad, info, actual.current), 'Ficha copiada como texto.') }, 'COPIAR FICHA')),
      error && h('p', { role: 'alert', className: 'sid-fi-error' }, error),
      aviso && h('p', { role: 'status', className: 'sid-fi-suave' }, aviso)),
    h('div', { className: 'sid-fi-col sid-fi-resultado' },
      h('h3', null, 'INFORMACIÓN DOCUMENTAL DE LA INSTALACIÓN'),
      !resultado ? h('p', { className: 'sid-fi-vacio' }, 'La respuesta de IA aparecerá aquí con funciones, organización, servicios, fuentes, datos faltantes y preguntas de estudio. Genera el prompt y pega la respuesta para completar esta instalación.') : h(R.Fragment, null,
        h('p', { className: ficha.revisadoEn ? 'sid-fi-revisado' : 'sid-fi-pendiente' }, ficha.revisadoEn ? 'MARCADO COMO REVISADO POR EL USUARIO' : 'CONTENIDO DE IA · PENDIENTE DE REVISIÓN'),
        resultado.textoLibre ? h('div', { className: 'sid-fi-texto' }, resultado.textoLibre) : h(R.Fragment, null,
          h('div', { className: 'sid-fi-texto' }, resultado.resumen),
          lista('FUNCIONES', resultado.funciones), lista('ORGANIZACIÓN', resultado.organizacion), lista('SERVICIOS', resultado.servicios),
          h('div', { className: 'sid-fi-bloque' }, h('h4', null, 'FUENTES DECLARADAS POR LA IA'),
            resultado.fuentes?.length ? h('ul', null, ...resultado.fuentes.map((x, i) => h('li', { key: i }, h('b', null, x.documento), ' — ', x.referencia, h('p', null, x.aporte)))) : h('p', null, 'Sin fuentes declaradas.')),
          lista('DATOS FALTANTES', resultado.datosFaltantes), lista('OBSERVACIONES DEL ANÁLISIS', resultado.observaciones), lista('PREGUNTAS DE ESTUDIO', resultado.preguntasEstudio)),
        h('button', { onClick: () => { aplicar({ ...actual.current, revisadoEn: ficha.revisadoEn ? null : new Date().toISOString() }); } }, ficha.revisadoEn ? 'VOLVER A PENDIENTE' : 'MARCAR COMO REVISADO CON LAS FUENTES')),
      h('h4', null, 'OBSERVACIONES DEL CURSANTE'),
      h('div', { className: 'sid-fi-texto' }, ficha.observaciones || 'Sin observaciones.')));
}
