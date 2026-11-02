import assert from 'node:assert/strict';
import {situacionConformidades,panelConformidades} from '../efm-campo/seguimiento.mjs';
import {botonConformidad} from '../efm-campo/conformidad.mjs';
const data={organizaciones:[{id:'A',grupos:[{alumnos:['T1']}]},{id:'B',grupos:[{alumnos:['T2','T3','T4','T5']}]}],cursantes:[1,2,3,4,5].map(i=>({id:'T'+i,nombre_completo:'FICTICIO '+i})),registros:[2,3,4,5].map(i=>({id:'R'+i,revision:i,organizacion_id:'B',cursante_id:'T'+i,prueba:'talla_peso',calculo:{nota:i===4?0:100}}))};
let s=situacionConformidades(data);assert.equal(s.alumnos,5);assert.equal(s.total,25);assert.equal(s.pendientes,4);assert.equal(s.sinRegistro,21);assert.equal(s.conformes,0);
data.registros[0].conformidad={confirmado_en:'2026-11-02T12:00:00Z'};s=situacionConformidades(data);assert.equal(s.conformes,1);assert.equal(s.pendientes,3);
data.registros.push({...data.registros[0],id:'CORRECCION',revision:50,conformidad:null});s=situacionConformidades(data);assert.equal(s.conformes,0);assert.equal(s.pendientes,4);assert.equal(s.rows.find(r=>r.c.id==='T2').pruebas[0].registro.id,'CORRECCION');
assert(botonConformidad(null,'flexiones').includes('disabled'));assert(botonConformidad(data.registros[3],'talla_peso').includes('data-confirm="R5"'));assert(botonConformidad(data.registros[3],'talla_peso',{soloLectura:true}).includes('disabled'));assert(botonConformidad(data.registros[0],'talla_peso').includes('✓ Conforme'));
assert(panelConformidades(data).includes('data-monitor-count="total">25'));console.log('Detalle: ambos ciclos, 25 pruebas, cero válido, pendientes, conformidad por versión y botones visibles por prueba: OK');
