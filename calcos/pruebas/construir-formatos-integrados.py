from pathlib import Path
import hashlib,json
base=Path('calcos/assets/index-inicio-ejercicio-20261001.js');s=base.read_text();cambios=[]
def reemplazar(a,b,n=1):
 global s
 assert s.count(a)==n,(a[:100],s.count(a),n)
 cambios.append({'viejo':a,'nuevo':b,'veces':n});s=s.replace(a,b)
reemplazar('exportarRemitida as SIDMilRemitida}', 'exportarRemitida as SIDMilRemitida,esDocumentoMilitar as SIDEsMilitar,etiquetaWord as SIDEtiquetaWord}')
reemplazar('runtime.js?v=inicio20261001','runtime.js?v=integrado20261001')
# Restaurar el generador exacto que tenían las hojas antes de la integración militar.
original=Path('calcos/assets/index-ficha-documental-20260930.js').read_text()
a=original.index('async function Mx(');b=original.index('const K5e=',a)
nativo=original[a:b].replace('async function Mx(','async function SIDHojaWord(',1)
reemplazar('async function Mx(t,e,n={}){return SIDMilWord(t,e,n)}',nativo+'async function Mx(t,e,n={}){return SIDEsMilitar(n.registro)?SIDMilWord(t,e,n):SIDHojaWord(t,e)}')
reemplazar('preparar:Y5e});const K5e=', 'preparar:Y5e,exportarHoja:SIDHojaWord});const K5e=')
reemplazar('async function Lx(t,e,n={}){return SIDMilDirecto(t,e,n.ctx||{},n.registro||{},WLe)}','async function Lx(t,e,n={}){if(!SIDEsMilitar(n.registro)){const{spec:a}=WLe(t,n);return SIDHojaWord(a,e)}return SIDMilDirecto(t,e,n.ctx||{},n.registro||{},WLe)}')
# La integración consulta el estado ya cargado; no recalcula ni escribe las hojas o el calco.
reemplazar('getExpediente:()=>Ju(),guardar:', 'getExpediente:()=>Ju(),getDatosDocumentales:()=>({ejercicio:wn,autorEM:zo,puestoActivo:Ha,baseInfo:fr,ordenSup:Tn,ops:Lt,unidades:dn,orgTarea:uc,cmoc:Jt,picb:$i,g3:Ya,hojasG:Kr,fasesCOA:Yn,faseActiva:yt,conceptoApoyo:pn,misionLog:_,bajasPorFase:Xr,estadosRecursos:ho,evacuacion:Rr,clima:Rn,escenario:cp,orientacion:ri,unidadAnalisis:ut,documentos:en,datosCapas:ve,datosAnalizados:ne,plantilla:Zi}),guardar:')
# Cuatro botones de distintos paneles; etiqueta ligada al tipo de documento.
for anterior,nuevo in [('de?.message||de','SIDEtiquetaWord(nt,{...He,g:"g2"})'),('at?.message||at','SIDEtiquetaWord(Ke,{g:"g3"})'),('SIDMilRemitida(I,t)','SIDEtiquetaWord(I,{g:t})'),('H?.message||H','SIDEtiquetaWord(I,{g:t})')]:
 pos=s.index(anterior,s.index('function Coe(')) if anterior!='SIDMilRemitida(I,t)' else s.index(anterior)
 boton=s.index('children:"📄 Word (formato militar)"',pos)
 reemplazar(s[pos:boton+len('children:"📄 Word (formato militar)"')],s[pos:boton]+'children:'+nuevo)
reemplazar('title:"Formato militar reglamentario, listo para firmar"','title:"Descargar en el formato propio del documento"',3)
# Notas de las hojas de tiempo: no anunciarlas como plantilla militar.
reemplazar('Bajalo con 📄 Word (formato militar).','Bajalo con 📄 Word de esta hoja.',s.count('Bajalo con 📄 Word (formato militar).'))
# Mantener las mejoras de inicio y consulta de ejercicios finalizados de la base vigente.
salida=Path('calcos/assets/index-formatos-integrados-20261001.js');salida.write_text(s)
Path('calcos/pruebas/reemplazos-formatos-integrados.json').write_text(json.dumps({'sha256Base':hashlib.sha256(base.read_bytes()).hexdigest(),'sha256Salida':hashlib.sha256(s.encode()).hexdigest(),'reemplazos':cambios,'notasTiempoActualizadas':True},ensure_ascii=False))
p=Path('calcos/index.html');p.write_text(p.read_text().replace(base.name,salida.name))
print('Formatos separados; generador nativo restaurado y contexto documental integrado.')
