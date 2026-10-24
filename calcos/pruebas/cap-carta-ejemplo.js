// Una respuesta de IA con la forma que pide «🤖 La IA desarrolla los dos CAP EN LA CARTA» (cap-propios/v1/carta-ia.mjs),
// para el ejercicio de prueba del CE-I (concepto-ejemplo.js): CAP 1 defensa de área, CAP 2 defensa móvil, cinco
// fases cada uno, con lugares del nomenclátor de prueba (Ungallire, Guata, Macaya, Turco, Julo, Estancia Esmeralda…),
// una A.I.N., unas coordenadas, un lugar que NO está en la carta y una unidad que no existe (para ver los avisos).
const fase = (fase, nombre, cuando, unidades = [], tareas = [], obstaculos = [], fuegos = []) => ({ fase, nombre, cuando, tarea: `${nombre} del CE-I`, proposito: 'para cumplir la misión', unidades, tareas, obstaculos, fuegos })
const u = (unidad, lugar, tarea, proposito = '') => ({ unidad, lugar, tarea, proposito })

const RESPUESTA_CAP = {
  juicio: {
    'CAP 1': 'SIRVE — adecuado: retiene la LF «PUMA»; factible: el plan de barreras entra antes del D; aceptable: bajas moderadas; distinguible: esfuerzo en la AA-1 y reserva en Turco; completo: tiene sus cinco fases.',
    'CAP 2': 'SIRVE — destruye a la 1ª Br. Ac. con la masa móvil; exige el punto de decisión en Macaya.',
  },
  caps: [
    {
      cap: 1,
      forma: 'area',
      nombre: 'CAP 1 — Defensa de área con el esfuerzo en la AA-1',
      f3p6: { 'Denominación del CAP': 'CAP 1 — Defensa de área (esfuerzo en la AA-1)', QUIÉN: 'El CE-I (DIV MEC-2, DIV-1, DIV-6).', QUÉ: 'Defiende.' },
      fases: [
        fase(1, 'Concentración', 'D-10 a D-8', [u('DIV MEC-2', 'Turco', 'Concentrarse'), u('DIV-1', 'Huachacalla', 'Concentrarse'), u('DIV-6', 'Turco', 'Concentrarse')]),
        fase(2, 'Desplazamiento', 'D-8 a D-5', [u('DIV MEC-2', 'Macaya', 'Desplazarse a su sector'), u('DIV-1', 'Bella Vista', 'Desplazarse a su sector'), u('DIV-7', 'Turco', 'No existe')]),
        fase(3, 'Ocupación y organización', 'D-5 a D', [u('DIV MEC-2', 'Estancia Esmeralda', 'Defender la LPR'), u('DIV-1', 'Julo', 'Defender la LPR'), u('DIV-6', 'Estancia Ticanani', 'Reserva')], [], [{ tipo: 'minado_ac', lugar: 'Guata' }, { tipo: 'zanja_at', lugar: 'Ungallire', hasta: 'Guata' }]),
        fase(4, 'Conducción de la defensa', 'D a D+8', [u('DIV MEC-2', 'Guata', 'Detener al enemigo en la AA-1', 'para que no pase la LF «PUMA»')], [{ tarea: 'bloquear', unidad: 'DIV MEC-2', lugar: 'Guata', hacia: 'Ungallire' }, { tarea: 'Fijar', unidad: 'DIV-1', lugar: 'AIN-5', hacia: 'Julo' }], [], [{ tipo: 'proteccion', efecto: 'destruir', lugar: 'Ungallire', unidad: 'RAM-4', proposito: 'para batir la ZO-1' }, { tipo: 'Contrabatería', lugar: 'Guallatire', unidad: 'GALM-1' }]),
        fase(5, 'Contraataque y consolidación', 'D+8 a D+15', [u('DIV-6', 'Macaya', 'Contraatacar', 'para restablecer la LPR')], [{ tarea: 'destruir', unidad: 'DIV-6', lugar: 'Guata', hacia: 'Ungallire' }]),
      ],
    },
    {
      cap: 2,
      forma: 'movil',
      nombre: 'CAP 2 — Defensa móvil',
      f3p6: { 'Denominación del CAP': 'CAP 2 — Defensa móvil' },
      fases: [
        fase(1, 'Concentración', 'D-10 a D-8', [u('DIV MEC-2', 'Macaya', 'Concentrarse'), u('DIV-6', 'Turco', 'Concentrarse')]),
        fase(2, 'Desplazamiento', 'D-8 a D-5', [u('DIV MEC-2', 'Ungallire', 'Desplazarse a la LDE-1'), u('DIV-1', 'Estancia Esmeralda', 'Desplazarse a su sector')]),
        fase(3, 'Organización de la defensa móvil', 'D-5 a D', [u('DIV-6', 'Cerro Comanchi', 'Ocultarse en la zona de reunión')], [], [{ tipo: 'minado_ac', lugar: 'Macaya' }]),
        fase(4, 'Retardo y canalización', 'D a D+4', [u('DIV MEC-2', 'Guata', 'Retardar')], [{ tarea: 'canalizar', unidad: 'DIV MEC-2', lugar: 'Guata', hacia: 'Macaya' }], [], [{ tipo: 'interdiccion', lugar: 'Guata', unidad: 'RAM-4' }, { tipo: 'apoyo', lugar: 'Pampa Inexistente', unidad: 'RAM-4' }]),
        fase(5, 'Contraataque y consolidación', 'D+4 a D+10', [u('DIV-6', '-18.4900, -68.8000', 'Contraatacar', 'para destruir al enemigo')], [{ tarea: 'destruir', unidad: 'DIV-6', lugar: 'Macaya', hacia: 'Guata' }]),
      ],
    },
  ],
}
const RESPUESTA_TEXTO = 'Acá van los dos cursos de acción.\n\n```json\n' + JSON.stringify(RESPUESTA_CAP, null, 2) + '\n```\n'

// Los catálogos de la Mesa que la caja recibe (parte del de tareas tácticas y del de obstáculos).
const TAREAS = ['bloquear', 'canalizar', 'contener', 'destruir', 'fijar', 'ocupar', 'mantener'].map((id) => ({ id, nombre: id[0].toUpperCase() + id.slice(1) }))
const OBSTACULOS = { minado_ac: { nom: 'Campo minado anticarro', forma: 'area' }, zanja_at: { nom: 'Zanja antitanque', forma: 'linea' }, abatida: { nom: 'Abatida (tala)', forma: 'linea' } }

// Los del plan de fuegos (fuegos/plan-fuegos.js, window.MesaFuegos.modelo).
const TIPOS_FUEGO = [
  { id: 'preparacion', nom: 'Fuego de preparación' },
  { id: 'apoyo', nom: 'Fuego de apoyo / acompañamiento' },
  { id: 'proteccion', nom: 'Fuego de protección final (barrera)' },
  { id: 'contrabateria', nom: 'Contrabatería' },
  { id: 'interdiccion', nom: 'Interdicción' },
]
const EFECTOS = [{ id: 'destruir', nom: 'Destruir' }, { id: 'neutralizar', nom: 'Neutralizar' }, { id: 'suprimir', nom: 'Suprimir' }]

module.exports = { RESPUESTA_CAP, RESPUESTA_TEXTO, TAREAS, OBSTACULOS, TIPOS_FUEGO, EFECTOS }
