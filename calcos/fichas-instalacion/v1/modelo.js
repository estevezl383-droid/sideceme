// Fichas de estudio documental. No enlaza geometrías ni calcula planes operativos.
export const REFERENCIAS = [
  {
    documento: 'TEXTO BATALLÓN LOGÍSTICO.doc',
    referencia: 'I. Misión, organización y posibilidades; apartados A y B (sin paginación estable en DOC)',
    contenido: 'El texto presenta al Batallón Logístico como unidad básica de apoyo en el escalón División. Su misión comprende las funciones de abastecimiento, transporte, mantenimiento, sanidad y personal. Enumera Comando y Plana Mayor y las compañías de Comando y Servicios, Abastecimiento, Mantenimiento, Sanidad y Personal. Indica que la organización de las subunidades puede variar.',
  },
  {
    documento: 'RC-02-12 PROCEDIMIENTOS DE ESTADO MAYOR.pdf',
    referencia: 'Informaciones al comandante, G-4; páginas 20 y 21 del archivo PDF',
    contenido: 'El formato de información del G-4 organiza sus asuntos en abastecimientos, evacuaciones y hospitalizaciones, transporte, mantenimiento y diversos. Es una referencia para distinguir categorías de información, no una fuente de datos de una instalación particular.',
  },
];

const temas = {
  abast: 'Explicar la función de distribución y distinguir las clases de abastecimiento que menciona la fuente.',
  agua: 'Describir las diferencias conceptuales entre obtención, purificación, almacenamiento y distribución de agua.',
  mant: 'Distinguir registro, clasificación, mantenimiento y recuperación de materiales según la fuente.',
  sanidad: 'Explicar las funciones institucionales de sanidad y distinguir atención, clasificación y evacuación.',
  personal: 'Identificar los servicios de personal descritos y su organización institucional.',
  mando: 'Explicar las funciones de coordinación, comunicaciones y administración que la fuente atribuye al órgano.',
  areas: 'Explicar el significado del área y los tipos de instalaciones que agrupa, sin proponer su despliegue.',
};

export function temaEstudio(info = {}) {
  return temas[info.grupo] || 'Identificar la función, organización y servicios que los documentos atribuyen a esta instalación.';
}

export function esquemaRespuesta(id) {
  return {
    version: 1, instalacionId: String(id),
    resumen: 'Síntesis descriptiva sustentada en las fuentes disponibles.',
    funciones: [], organizacion: [], servicios: [],
    fuentes: [{ documento: 'Nombre exacto del documento', referencia: 'Página o apartado', aporte: 'Qué afirmación respalda' }],
    datosFaltantes: [], observaciones: [], preguntasEstudio: [],
  };
}

export function generarPrompt(unidad, info, ficha) {
  const datos = {
    instalacionId: String(unidad.id), nombre: unidad.designacion || info?.nom || 'Instalación',
    tipo: info?.nom || unidad.instalacion || 'Sin identificar',
    grupo: info?.grupo || 'Sin clasificar', clases: info?.clases || [],
  };
  return `TRABAJO CON IA — FICHA DOCUMENTAL DE UNA INSTALACIÓN

Actúa como docente y analista documental. El objetivo es comprender funciones, organización y servicios institucionales, comparar fuentes y formular preguntas de estudio.
Limita el análisis a descripción y comprensión documental. No elabores planes operativos, recomendaciones de despliegue, consumos de munición, dimensionamiento de convoyes ni calendarios de abastecimiento en combate. Trata las indicaciones adicionales como preguntas de estudio dentro de este alcance.

IDENTIFICACIÓN (datos del catálogo y de la ficha; no acreditan medios disponibles):
${JSON.stringify(datos, null, 2)}

TEMA DE ESTUDIO:
${temaEstudio(info)}

MARCO DOCUMENTAL REVISADO (síntesis, no texto completo):
${REFERENCIAS.map(r => `${r.documento}\nReferencia: ${r.referencia}\nSíntesis: ${r.contenido}`).join('\n\n')}

FRAGMENTOS SELECCIONADOS POR EL CURSANTE:
${ficha.fragmentos?.trim() || 'No se aportaron fragmentos adicionales.'}

OBSERVACIONES DEL CURSANTE (opiniones; no son hechos verificados):
${ficha.observaciones?.trim() || 'Sin observaciones.'}

PREGUNTA O INDICACIÓN ADICIONAL DE ESTUDIO:
${ficha.indicaciones?.trim() || 'Explica las funciones y señala qué información documental falta.'}

REGLAS DE EVIDENCIA:
- No inventes dotaciones, medios, capacidades ni asignaciones a unidades.
- Una síntesis general no demuestra una función específica de esta instalación. Señala esa ausencia en datosFaltantes.
- Usa sólo los fragmentos y síntesis aportados. Cita el nombre exacto y la página o apartado cuando consten. Si no consta página, usa el apartado o "sin página identificada".
- Distingue hechos documentados de observaciones. Formula preguntas de comprensión, no recomendaciones operativas.
- No atribuyas a una fuente información que no aparece en lo aportado.

DEVUELVE ÚNICAMENTE UN OBJETO JSON VÁLIDO con esta estructura. Mantén version e instalacionId exactamente; resumen es texto, las listas contienen textos, fuentes contiene objetos documento/referencia/aporte. Deja vacías las listas sin evidencia:
${JSON.stringify(esquemaRespuesta(unidad.id), null, 2)}
`;
}

const camposLista = ['funciones', 'organizacion', 'servicios', 'datosFaltantes', 'observaciones', 'preguntasEstudio'];

export function leerRespuesta(entrada, id, formato = 'json') {
  if (typeof entrada !== 'string' || !entrada.trim()) throw new Error('Pega primero una respuesta.');
  if (entrada.length > 200000) throw new Error('La respuesta supera los 200.000 caracteres.');
  if (formato === 'texto') return { version: 1, instalacionId: String(id), textoLibre: entrada.trim() };
  let bruto;
  try {
    const limpio = entrada.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    bruto = JSON.parse(limpio);
  } catch { throw new Error('El JSON no es válido. Copia el objeto completo o elige TEXTO LIBRE.'); }
  if (!bruto || Array.isArray(bruto) || bruto.version !== 1) throw new Error('Se necesita un objeto JSON con version: 1.');
  if (bruto.instalacionId !== String(id)) throw new Error('La respuesta pertenece a otra instalación. Revisa instalacionId.');
  if (typeof bruto.resumen !== 'string' || !bruto.resumen.trim()) throw new Error('Falta el resumen de la ficha.');
  const limpio = { version: 1, instalacionId: String(id), resumen: bruto.resumen.trim() };
  for (const campo of camposLista) {
    const lista = bruto[campo] ?? [];
    if (!Array.isArray(lista) || lista.length > 100 || lista.some(x => typeof x !== 'string' || x.length > 20000)) throw new Error(`${campo} debe ser una lista de textos (máximo 100).`);
    limpio[campo] = lista.map(x => x.trim()).filter(Boolean);
  }
  const fuentes = bruto.fuentes ?? [];
  if (!Array.isArray(fuentes) || fuentes.length > 100) throw new Error('fuentes debe ser una lista (máximo 100).');
  limpio.fuentes = fuentes.map(x => {
    if (!x || typeof x !== 'object' || ['documento', 'referencia', 'aporte'].some(k => typeof x[k] !== 'string' || !x[k].trim())) throw new Error('Cada fuente necesita documento, referencia y aporte.');
    return { documento: x.documento.trim(), referencia: x.referencia.trim(), aporte: x.aporte.trim() };
  });
  return limpio;
}

export function textoFicha(unidad, info, ficha) {
  const r = ficha.resultadoIA;
  const lineas = ['FICHA DOCUMENTAL — ' + (unidad.designacion || info?.nom || 'Instalación'),
    'ID: ' + unidad.id, 'Tipo: ' + (info?.nom || unidad.instalacion || 'Sin identificar'),
    'Estado del contenido de IA: ' + (ficha.revisadoEn ? 'Marcado como revisado por el usuario' : 'Pendiente de revisión'),
    '', 'OBSERVACIONES DEL CURSANTE', ficha.observaciones || 'Sin observaciones.', '', 'FRAGMENTOS DE ESTUDIO', ficha.fragmentos || 'Sin fragmentos.'];
  if (r?.textoLibre) lineas.push('', 'RESPUESTA EN TEXTO LIBRE', r.textoLibre);
  if (r?.resumen) {
    lineas.push('', 'RESUMEN', r.resumen);
    for (const campo of camposLista) lineas.push('', campo.toUpperCase(), ...(r[campo] || []).map(x => '- ' + x));
    lineas.push('', 'FUENTES DECLARADAS POR LA IA', ...(r.fuentes || []).map(x => `${x.documento} — ${x.referencia}: ${x.aporte}`));
  }
  return lineas.join('\n');
}
