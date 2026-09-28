// La hoja de conceptos entrelazados del EJEMPLO del PMTD 2017 (págs. 21 y 22),
// transcripta como datos de la hoja (esquema conceptos-v2). Sirve para comprobar
// que el dibujo de la Mesa sale con la misma forma que el ejemplo del reglamento.
//
//   node conceptos-ejemplo-pmtd.js > ejemplo.json   → lo imprime como JSON
const F = (fase, datos) => ({ fase, esfuerzo: false, ...datos })

function ejemploPMTD() {
  return {
    esquema: 'conceptos-v2',
    enfoque: 'subordinadas',
    fases: [
      { id: 'F1', nombre: 'OCUPACIÓN Y PREPARACIÓN DE LA PD' },
      { id: 'F2', nombre: 'APOYO CON FUEGO A LA FT INGAVI' },
      { id: 'F3', nombre: 'DEFENSA Y CANALIZACIÓN' },
      { id: 'F4', nombre: 'BLOQUEO A LAS UNIDADES DE LA FT-43 DE ROJO' },
    ],
    unidades: [
      {
        id: 'ce', grupo: 'superior2', nombre: 'CE', magnitud: 'XXX', arma: '', texto: 'CE',
        tarea: 'Defiende y derrota al CE. I de ROJO',
        proposito: 'Proteger VIACHA y Villa BOLÍVAR, evitando la captura y conquista de la ciudad de LA PAZ y ejecutar operaciones favorables para iniciar una contraofensiva por el Sub Teatro Norte del TO con ROJO.',
      },
      {
        id: 'div1', grupo: 'superior1', propia: true, nombre: 'Div-1', magnitud: 'XX', arma: 'infanteria', numero: '1',
        tarea: 'Defiende y destruye al RIMEC 6 y a la FT-43.',
        proposito: 'Evitar la ejecución de operaciones coordinadas de la DIMEC-3 y DIMEC-5 de ROJO destinadas a la conquista de VIACHA y Villa BOLÍVAR.',
      },
      {
        id: 'ingavi', grupo: 'maniobra', nombre: 'INGAVI', magnitud: 'III', arma: 'infanteria', rol: 'OC2',
        fases: [
          F('F1', { tarea: 'Se desplaza por el ITIN. 1, ocupa posiciones al Oeste de PAMPA POSTIRI / Destaca elementos y establece contacto con el GRM-I en el PP-A en coordenadas (7610-3390).', proposito: 'Realizar la posición defensiva en dicho sector / Realizar el recibimiento de esta Unidad y asumir el mando de la batalla.' }),
          F('F2', { esfuerzo: true, tarea: 'Constituye el esfuerzo principal, ataca y destruye al RIMEC-6.', proposito: 'Evitar que esta unidad conquiste las elevaciones en Coord. 8100-4100, obligando el desplazamiento de la FT-43 del enemigo.' }),
          F('F3', { tarea: 'Defiende y bloquea por el sector Oeste del corredor de movilidad desde la LF. SIERRA hasta la LF. COMBO.', proposito: 'Impedir que el enemigo se desplace por las direcciones existentes y eluda el AE YUNQUE.' }),
          F('F4', { tarea: 'Defiende y bloquea por el sector suroeste en inmediaciones de Coord. 7300-4100, a las unidades de la FT-43.', proposito: 'Impedir que dicha unidad pueda capturar terreno clave o encauzar su movimiento por direcciones disponibles hacia el Oeste.' }),
        ],
      },
      {
        id: 'lanza', grupo: 'maniobra', nombre: 'LANZA', magnitud: 'III', arma: 'infanteria', rol: 'OC1',
        fases: [
          F('F1', { tarea: 'Se desplaza por el ITIN 2, ocupa posiciones en elevación en Coord. 8100-3900 / Destaca elementos y establece contacto con el GRM-I en el PP-B en coordenadas (8100-3700).', proposito: 'Encontrarse en condiciones de ejecutar operaciones defensivas en dicho sector / Realizar el recibimiento de esta Unidad y asumir el mando de la batalla.' }),
          F('F2', { tarea: 'Defiende y apoya con fuego a la FT INGAVI (OC2), franqueando desde el Este con sus fuegos.', proposito: 'Distraer a las unidades del RIMEC-6 y que ésta no pueda disparar eficazmente sobre la FT INGAVI.' }),
          F('F3', { esfuerzo: true, tarea: 'Constituye el esfuerzo principal, defiende y canaliza a la FT-43 desde la LF. SIERRA hasta la LF. COMBO.', proposito: 'Atraer sus fuerzas hacia el AE YUNQUE.' }),
          F('F4', { tarea: 'Defiende y bloquea por el sector Sur, Coord. 7600-4400, a las unidades de la FT-43.', proposito: 'Evitar que éstas tomen direcciones alternas hacia el sector de la Div-2 y eludan el AE «YUNQUE».' }),
        ],
      },
      {
        id: 'calama', grupo: 'maniobra', nombre: 'CALAMA', magnitud: 'III', arma: 'infanteria', rol: 'OD',
        fases: [
          F('F1', { tarea: 'Se desplaza por el sector por el ITIN 4, ocupa posiciones en el punto de referencia.', proposito: 'Estar en condiciones de ejecutar operaciones con orden en las subsiguientes fases.' }),
          F('F2', { tarea: 'Mantiene sus posiciones.', proposito: 'Iniciar operaciones en la siguiente fase.' }),
          F('F3', { tarea: 'Mantiene sus posiciones.', proposito: 'Iniciar operaciones ofensivas en la siguiente fase.' }),
          F('F4', { esfuerzo: true, tarea: 'Ataca y destruye a las unidades de la FT-43 en el AE «YUNQUE».', proposito: 'Impedir la ejecución del cerco a VIACHA y su posterior conquista por parte de la DIMEC-5.' }),
        ],
      },
      {
        id: 'toledo', grupo: 'maniobra', nombre: 'TOLEDO', magnitud: 'III', arma: 'infanteria', rol: 'OC3',
        fases: [
          F('F1', { tarea: 'Se desplaza por el ITIN 3 y ocupa posiciones en las elevaciones existentes al Este y al Oeste de AE «YUNQUE».', proposito: 'Estar en condiciones de ejecutar operaciones en las siguientes fases.' }),
          F('F2', { tarea: 'Se constituye en la reserva, adelanta sus unidades hasta CHARCARA PAMPA.', proposito: 'Asumir la tarea de OC2 con orden.' }),
          F('F3', { tarea: 'Ocupa posiciones en las elevaciones existentes al Oeste y Este de su sector de responsabilidad.', proposito: 'Encontrarse en condiciones de inmovilizar al enemigo.' }),
          F('F4', { tarea: 'Defiende e inmoviliza a la FT-43 en el AE «YUNQUE».', proposito: 'Evitar que dichas unidades se reubiquen hacia sectores ventajosos para la batalla.' }),
        ],
      },
      {
        id: 'bing', grupo: 'apoyo', nombre: 'B. ING.', magnitud: 'II', arma: 'ingenieria',
        fases: [
          F('F1', { pe: 'Contramovilidad mediante la instalación de fajas de minas.', pt: 'OC1 y OC2.' }),
          F('F2', { pe: 'Contramovilidad.', pt: 'OC2.' }),
        ],
      },
      {
        id: 'ra1', grupo: 'apoyo', nombre: 'RA-1', magnitud: 'III', arma: 'artilleria',
        fases: [
          F('F1', { tarea: 'Suprimir la progresión ofensiva del enemigo.', proposito: 'Proporcionar la seguridad a los PP A y B durante el recibimiento del GRM-I.', paf: 'OC2', efecto: 'Ocasionar el 10 % de daños a los sistemas de armas del enemigo.' }),
          F('F2', { tarea: 'Destruir el ataque del enemigo.', proposito: 'Evitar que el enemigo conquiste elevaciones y terrenos claves existentes entre la LF. MARTILLO y LF. SIERRA.', paf: 'OC1', efecto: 'Ocasionar daños de 30 % en los sistemas de armas del enemigo.' }),
          F('F3', { tarea: 'Neutralizar la progresión de la FT-43.', proposito: 'Evitar que el enemigo pueda desviar su progresión por el este u oeste del área de operaciones y de esta manera satisfacer además las necesidades de apoyo de fuego de las unidades de maniobra.', paf: 'OC1', efecto: 'Ocasionar daños de 10 % en los sistemas de armas del enemigo.' }),
          F('F4', { tarea: 'Destruir a la FT-43 en el AE YUNQUE.', proposito: 'Evitar que el enemigo prosiga con sus operaciones hasta cercar VIACHA.', paf: 'OD', efecto: 'Ocasionar daños de 30 % en los sistemas de armas del enemigo.' }),
        ],
      },
    ],
    relaciones: [
      { desde: 'div1', hasta: 'ce', tipo: 'directa' },
      { desde: 'calama', hasta: 'div1', tipo: 'directa' },
      { desde: 'ingavi', hasta: 'div1', tipo: 'directa' },
      { desde: 'lanza', hasta: 'calama', tipo: 'directa' },
      { desde: 'toledo', hasta: 'calama', tipo: 'directa' },
      { desde: 'lanza', hasta: 'ingavi', tipo: 'indirecta' },
      { desde: 'ingavi', hasta: 'toledo', tipo: 'indirecta' },
      { desde: 'bing', hasta: 'ingavi', tipo: 'indirecta' },
      { desde: 'bing', hasta: 'lanza', tipo: 'indirecta' },
      { desde: 'bing', hasta: 'calama', tipo: 'directa' },
      { desde: 'bing', hasta: 'toledo', tipo: 'indirecta' },
      { desde: 'ra1', hasta: 'lanza', tipo: 'indirecta' },
      { desde: 'ra1', hasta: 'calama', tipo: 'directa' },
      { desde: 'ra1', hasta: 'toledo', tipo: 'indirecta' },
      { desde: 'ra1', hasta: 'bing', tipo: 'indirecta' },
    ],
  }
}

module.exports = { ejemploPMTD }

if (require.main === module) process.stdout.write(JSON.stringify(ejemploPMTD(), null, 2) + '\n')
