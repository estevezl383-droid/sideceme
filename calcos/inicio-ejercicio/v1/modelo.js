// Identidad del ejercicio: selección explícita, independiente del contenido táctico.
import { escalonDeNombre, mismaUnidad } from '../../conceptos/v4/modelo.js';
export const MIGRACION_ARMAS = 'armas-dimec1-20261001';
export const nombreUnidad = s => String(s || '').replace(/\s+/g, ' ').trim().toUpperCase();

export function unidadesDocumentales(documentos = []) {
  const salida = [];
  for (const doc of documentos) {
    const lineas = String(doc.texto || '').split(/\r?\n|\t|\|/).map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].replace(/^(?:\d{1,2}|[A-Za-z])[.)]-?\s+/, '').replace(/^(?:LA|EL)\s+/i, '');
      // Designaciones numeradas y unidades menores identificadas con nombre o especialidad.
      const m = linea.match(/^((?:DIV\.?\s*MEC\.?|DIMEC|DIVMEC|DIV\.?|BRIG\.?|RCB|RCM|RIMEC|RIM|RIAT|RAM|RAA|RI|RA|RC|BATING\.?\s*MEC\.?|BAT\.?\s*(?:LOG\.?|COM\.?\s*MEC\.?|ING\.?|COM\.?)?|COMP?\.?\s*ICIA\.?|COMP?\.?\s*AV\.?\s*EJTO\.?|SECC\.?\s*ICIA\.?\s*(?:HUM\.?|AE\.?|ELECT\.?)|SECC\.?\s*C\s*Y\s*S\.?)(?:\s*-\s*(?:\d{1,3}|[IVX]+))?)/i);
      if (!m) continue;
      let nombre = m[1].trim();
      const resto = linea.slice(m[0].length).trim();
      const comillas = resto.match(/^[«“"]([^»”"]+)[»”"]/);
      if (comillas) nombre += ' “' + comillas[1] + '”';
      else if (/^[«“"][^»”"]+[»”"]\.?$/.test(lineas[i + 1] || '')) nombre += ' ' + lineas[++i];
      // Evitar menciones genéricas como «la división» o abreviaturas dentro de frases.
      if (!/\d|[-–]\s*[IVX]+\b|[«“"]|ICIA|SECC/i.test(nombre)) continue;
      nombre = nombreUnidad(nombre);
      const anterior = salida.find(u => mismaUnidad(u.nombre, nombre));
      if (anterior) {
        if (!/[«“"]/.test(anterior.nombre) && /[«“"]/.test(nombre)) anterior.nombre = nombre;
        continue;
      }
      salida.push({ nombre, fuente: doc.nombre || 'DOCUMENTO CARGADO', escalon: escalonDeNombre(nombre) || '' });
    }
  }
  return salida;
}

export function configurarIdentidad(estado, ejercicio, seleccion) {
  const nombre = nombreUnidad(seleccion.nombre);
  if (!nombre) throw Error('SELECCIONE O REGISTRE SU UNIDAD CONSIDERADA.');
  return { ...estado,
    ordenSup: { ...(estado.ordenSup || {}), unidad: nombre },
    unidadAnalisis: { ...(estado.unidadAnalisis || {}), nombre, ...(seleccion.escalon ? { magnitud: seleccion.escalon } : {}) },
    ops: { ...(estado.ops || {}), unidadConsiderada: { ...seleccion, nombre, confirmada: true },
      contextoDocumental: { ...(estado.ops?.contextoDocumental || {}), ejercicio, unidad: nombre } }
  };
}

export function migrarArmas(estado, ejercicio) {
  // Excepción autorizada por Sergio: sólo un ejercicio existente, una sola vez.
  if (nombreUnidad(ejercicio) !== 'ARMAS' || estado.ops?.migracionesIdentidad?.[MIGRACION_ARMAS]) return estado;
  const nuevo = configurarIdentidad(estado, ejercicio, { nombre: 'DIV.MEC.-1', escalon: 'division', fuente: 'CONFIGURACIÓN SOLICITADA POR EL AUTOR PARA ARMAS' });
  nuevo.ops.migracionesIdentidad = { ...(estado.ops?.migracionesIdentidad || {}), [MIGRACION_ARMAS]: true };
  return nuevo;
}

export function exigirIdentidad(ops) {
  if (!ops?.unidadConsiderada?.confirmada || !nombreUnidad(ops.unidadConsiderada.nombre)) throw Error('ANTES DE CONTINUAR, COMPLETE «¿QUIÉN SOY YO / QUÉ UNIDAD REPRESENTO?» EN EL INICIO DEL EJERCICIO.');
}
