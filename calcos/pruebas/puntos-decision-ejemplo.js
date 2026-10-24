// Las seis filas de la F4·P4 que la IA le escribió a Sergio (24-10-2026), tal cual: con «[IA — verificar]».
const FILAS_PD = [
  {
    "N° P.D.": "P.D. 1 [IA — verificar]",
    "Evento crítico": "Detección del inicio de marcha e irrupción de la vanguardia de la 1ª Br. Ac. «CORACEROS» en la AIN-3 (paso Ungallire–Guata). [IA — verificar]",
    "No antes de": "D-3 (0600) [IA — verificar]",
    "No después de": "D (0400) [IA — verificar]",
    "Criterio que activa la decisión": "Confirmación por el UAV-3 o la CIE-297 del despliegue del Pelotón de Reconocimiento Blindado y aproximación de la Cía. Ing. Mec. N° 9 con puentes AVLB Biber a los vados del río Lauca. [IA — verificar]",
    "Decisión que se toma": "Autorizar la ejecución del Plan de Fuegos de Contrabatería masivo con el GALM-1 y la RAM-4 sobre las posiciones de tiro del GAAP N° 4 «MIRAFLORES» (M109/LAR-160) en la AIN-3. [IA — verificar]",
    "A.I.N. asociada": "AIN-3 [IA — verificar]"
  },
  {
    "N° P.D.": "P.D. 2 [IA — verificar]",
    "Evento crítico": "Franqueo del río Lauca e intento de brechado de la Zona de Obstáculos ZO-1 por el primer escalón enemigo (BIB N° 27 «BULNES»). [IA — verificar]",
    "No antes de": "D (0400) [IA — verificar]",
    "No después de": "D+1 (1200) [IA — verificar]",
    "Criterio que activa la decisión": "Contacto del escalón de asalto enemigo con los campos minados AT y zanjas antitanque de la ZO-1 en el paso Ungallire–Guata (P39/P40). [IA — verificar]",
    "Decisión que se toma": "Activar la ejecución de las Concentraciones de Fuegos Defensivos Finales (FPF AB-011) sobre la ZO-1 y ordenar a la DIV MEC-2 la contención tenaz en la LPR (LF «PUMA»). [IA — verificar]",
    "A.I.N. asociada": "AIN-3 [IA — verificar]"
  },
  {
    "N° P.D.": "P.D. 3 [IA — verificar]",
    "Evento crítico": "Detección de intenciones de maniobra o avance de elementos de magnitud Batallón/Grupo sobre la AIN-5 (eje Julo–Bella Vista / sur del Volcán Puquintica). [IA — verificar]",
    "No antes de": "D+1 (0600) [IA — verificar]",
    "No después de": "D+3 (1800) [IA — verificar]",
    "Criterio que activa la decisión": "Reporte de patrullas del Equipo X-RAY (DIV-1/FF.EE. F-10) o UAV-3 confirmando la penetración de más de una compañía blindada/mecanizada sobre el vacío táctico en el límite sur con el CE-II. [IA — verificar]",
    "Decisión que se toma": "Reorientar la masa de fuegos del GALM-1 hacia las posiciones suplementarias del sur y autorizar el empeño de la reserva operacional (DIV-6) para ejecutar el contraataque divisorio sobre el eje Julo–Bella Vista. [IA — verificar]",
    "A.I.N. asociada": "AIN-5 [IA — verificar]"
  },
  {
    "N° P.D.": "P.D. 4 [IA — verificar]",
    "Evento crítico": "Identificación de un cambio del esfuerzo principal enemigo (CAE-2) con viraje de la 1ª Br. Ac. al norte por el curso del río Sajama hacia Tambo Quemado. [IA — verificar]",
    "No antes de": "D+1 (1200) [IA — verificar]",
    "No después de": "D+4 (1800) [IA — verificar]",
    "Criterio que activa la decisión": "Avistamiento de columnas blindadas del Grupo Blindado N° 9 virando por el corredor CM-6/CM-14 hacia el sector Caranguillas/PC-1 y PC-2. [IA — verificar]",
    "Decisión que se toma": "Ajustar el dispositivo de la DIV MEC-2 para bloquear el paso del río Sajama, reorientar la artillería en apoyo a la DIV MEC-1 y desplazar la DIV-6 a posiciones de bloqueo sobre el eje Macaya–Turco. [IA — verificar]",
    "A.I.N. asociada": "AIN-1 [IA — verificar]"
  },
  {
    "N° P.D.": "P.D. 5 [IA — verificar]",
    "Evento crítico": "Ruptura parcial o penetración enemiga de magnitud batallón sobre la LPR (LF «PUMA») en el sector del Cerro Sacabaya (C4). [IA — verificar]",
    "No antes de": "D+2 (1800) [IA — verificar]",
    "No después de": "D+6 (1800) [IA — verificar]",
    "Criterio que activa la decisión": "El primer escalón enemigo logra sobrepasar las posiciones de la DIV MEC-2 en la LF «PUMA» amenazando con abrir el eje hacia Turco y Huachacalla. [IA — verificar]",
    "Decisión que se toma": "Empeñar la reserva operacional del CE-I (DIV-6) desde la ZR Turco para ejecutar un contraataque de bloqueo y contención sobre el eje Macaya–Turco, y solicitar a las FF.TT.T.O. el despliegue del RIAEROTRANS-18. [IA — verificar]",
    "A.I.N. asociada": "AIN-3 [IA — verificar]"
  },
  {
    "N° P.D.": "P.D. 6 [IA — verificar]",
    "Evento crítico": "Desgastamiento, fijación y colapso logístico del primer escalón de la VI División de Ejército enemiga al oeste de la LF «PUMA». [IA — verificar]",
    "No antes de": "D+8 (1800) [IA — verificar]",
    "No después de": "D+15 (1800) [IA — verificar]",
    "Criterio que activa la decisión": "Confirmación de la neutralización de más del 30% de los medios blindados atacantes (Leopard 2A4/M113) y paralización del avance enemigo por desabastecimiento de Clase III/V en el eje Putre–Guallatire. [IA — verificar]",
    "Decisión que se toma": "Ordenar la consolidación de posiciones sobre la LDE-2, reestructurar las unidades de primer escalón y disponer el alistamiento general del CE-I para el paso a la Segunda Campaña (Ofensiva). [IA — verificar]",
    "A.I.N. asociada": "AIN-2 [IA — verificar]"
  }
]

module.exports = { FILAS_PD }
