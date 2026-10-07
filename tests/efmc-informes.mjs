import assert from 'node:assert/strict';
import {validarMedidas,calificarMedidas} from '../efm-campo/medidas.mjs';
import {resumen,valoresHoja,ultima} from '../efm-campo/informes.mjs';
const c={id:'C1',fecha_nacimiento:'1988-01-01'},fecha='2026-10-07';
assert.equal(validarMedidas(70.5,1.71),'');assert(validarMedidas(70,171));assert(validarMedidas(0,1.71));assert.equal(calificarMedidas(70,1.71,'M',c.fecha_nacimiento,fecha).aporte,29);assert.equal(calificarMedidas(90,1.71,'M',c.fecha_nacimiento,fecha).aporte,0);
const records=Object.entries({talla_peso:100,natacion:100,abdominales:97,flexiones:98,aerobica:100}).map(([prueba,nota])=>({id:prueba,prueba,fecha,cursante_id:c.id,valor:prueba==='aerobica'?1100:50,creado_en:'2026-10-07T05:00:00Z',calculo:{nota,...(prueba==='talla_peso'?{peso:70.5,talla:1.71}:{})}}));
assert.equal(resumen(c,records,fecha).final,99);assert.equal(resumen(c,records.slice(1),fecha).final,null);assert.equal(resumen(c,records,'2026-10-08').final,null);assert.equal(valoresHoja(resumen(c,records,fecha))[0],70.5);
const correction={...records[0],id:'correction',creado_en:'2026-10-07T06:00:00Z',calculo:{nota:0,peso:70.5,talla:1.71}};assert.equal(ultima([...records,correction],c.id,'talla_peso',fecha).id,'correction');assert.equal(resumen(c,[...records,correction],fecha).final,70);console.log('Medidas, ponderación 29 %, nota cero, pendientes, fecha y corrección más reciente: OK');
