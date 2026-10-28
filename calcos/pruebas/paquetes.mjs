import assert from 'node:assert/strict';
import {randomBytes,createCipheriv,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {Paquete,leerCabecera,bbox,intersecta} from '../paquetes/v1/paquetes.mjs';
const key=randomBytes(32),id='test-paquete';
function fixture(){
 const plain=Buffer.from('SIDECEME prueba'),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(id+'\ncheck'));
 const body=Buffer.concat([cipher.update(gzipSync(plain)),cipher.final(),cipher.getAuthTag()]);
 const m={id,version:1,geometry:{type:'Polygon',coordinates:[]},entries:[{path:'check',offset:0,length:body.length,plainBytes:plain.length,codec:'gzip',iv:iv.toString('base64')}]};
 const head=Buffer.from(JSON.stringify(m)),prefix=Buffer.alloc(12);prefix.write('SIDPKG1\n');prefix.writeUInt32LE(head.length,8);
 return {buffer:Buffer.concat([prefix,head,body]),hash:createHash('sha256').update(head).digest('hex')};
}
const f=fixture(),file=new File([f.buffer],'test.sidcalco');
const grant=(extra={})=>({ok:true,key:key.toString('base64'),manifest_sha256:f.hash,expires:new Date(Date.now()+60000).toISOString(),...extra});
const p=await Paquete.abrir(file,async()=>grant());assert.equal(new TextDecoder().decode(await p.bytes('check')),'SIDECEME prueba');
await assert.rejects(()=>Paquete.abrir(file,async()=>grant({ok:false})),/autorizado/);
await assert.rejects(()=>Paquete.abrir(file,async()=>grant({manifest_sha256:'0'.repeat(64)})),/autorizado/);
await assert.rejects(()=>Paquete.abrir(file,async()=>grant({expires:'2000-01-01'})),/venció/);
await assert.rejects(()=>Paquete.abrir(file,async()=>grant({key:randomBytes(32).toString('base64')})),/dañado/);
const changed=Buffer.from(f.buffer);changed[changed.length-1]^=1;await assert.rejects(()=>Paquete.abrir(new File([changed],'x'),async()=>grant()),/dañado/);
await assert.rejects(()=>leerCabecera(new File([f.buffer.subarray(0,-1)],'x')),/inválido|incompleto/);
await assert.rejects(()=>leerCabecera(new File(['{"version":1}'],'x')),/sidcalco/);
p.expires=0;await assert.rejects(()=>p.bytes('check'),/venció/);
assert.deepEqual(bbox({type:'Polygon',coordinates:[[[-66,-17],[-65,-17],[-65,-18],[-66,-17]]]}),[-66,-18,-65,-17]);
assert.equal(intersecta([0,0,1,1],[2,2,3,3]),false);
console.log('10 comprobaciones: cifrado, integridad, rechazo, vencimiento y geometría OK');
